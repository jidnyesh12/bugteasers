/**
 * @bugteasers/worker
 * RabbitMQ worker for processing assignment analysis tasks
 */

// Load environment variables from .env file
require("dotenv").config();

const { consumeMessages } = require("@bugteasers/mq-core");
const { analyzeCode, calculateSimilarity } = require("@bugteasers/ast-core");
const postgres = require("postgres");

// ============================================
// Database Connection
// ============================================

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Create Postgres client with direct connection
const sql = postgres(DATABASE_URL, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

// ============================================
// Message Handlers
// ============================================

/**
 * Handle START_ANALYSIS action
 * Fetches best submissions for each student-problem pair and prepares for AST comparison
 */
async function handleStartAnalysis(assignmentId) {
  try {
    // Fetch best first submission for each student-problem pair
    // Using DISTINCT ON for optimal performance
    const submissions = await sql`
      SELECT DISTINCT ON (ps.problem_id, ps.student_id)
        ps.id,
        ps.student_id,
        ps.problem_id,
        ps.code,
        ps.language,
        ps.status,
        ps.score,
        ps.earned_points,
        ps.total_points,
        ps.submitted_at,
        p.solution_code,
        p.title as problem_title,
        u.full_name as student_name,
        u.email as student_email
      FROM problem_submissions ps
      INNER JOIN problems p ON ps.problem_id = p.id
      INNER JOIN users u ON ps.student_id = u.id
      WHERE ps.assignment_id = ${assignmentId}
      ORDER BY 
        ps.problem_id,
        ps.student_id,
        ps.score DESC NULLS LAST,
        ps.submitted_at ASC
    `;

    if (submissions.length === 0) {
      console.warn(`[worker] No submissions found for assignment ${assignmentId}`);
      return;
    }

    // Group submissions by problem for analysis
    const submissionsByProblem = submissions.reduce((acc, submission) => {
      if (!acc[submission.problem_id]) {
        acc[submission.problem_id] = {
          problemId: submission.problem_id,
          problemTitle: submission.problem_title,
          solutionCode: submission.solution_code,
          submissions: [],
        };
      }
      
      acc[submission.problem_id].submissions.push({
        id: submission.id,
        studentId: submission.student_id,
        studentName: submission.student_name,
        studentEmail: submission.student_email,
        code: submission.code,
        language: submission.language,
        status: submission.status,
        score: submission.score,
        earnedPoints: submission.earned_points,
        totalPoints: submission.total_points,
        submittedAt: submission.submitted_at,
      });
      
      return acc;
    }, {});

    // ============================================
    // AST Comparison Phase
    // ============================================

    const allComparisonResults = [];

    // Process each problem
    for (const [problemId, problemData] of Object.entries(submissionsByProblem)) {
      const submissions = problemData.submissions;
      const solutionCode = problemData.solutionCode;

      // Step 1: Generate fingerprints for all submissions
      const submissionsWithFingerprints = [];
      
      for (const submission of submissions) {
        try {
          const fingerprint = await analyzeCode(submission.code, submission.language);
          
          submissionsWithFingerprints.push({
            ...submission,
            fingerprint,
          });
        } catch (error) {
          console.error(`[worker] Failed to analyze ${submission.studentName}:`, error.message);
        }
      }

      if (submissionsWithFingerprints.length === 0) {
        continue;
      }

      // Store fingerprints in database
      for (const submission of submissionsWithFingerprints) {
        try {
          await sql`
            UPDATE problem_submissions
            SET fingerprint = ${JSON.stringify(submission.fingerprint.map(String))}::jsonb
            WHERE id = ${submission.id}
          `;
        } catch (error) {
          console.error(`[worker] Failed to store fingerprint for ${submission.studentName}:`, error.message);
        }
      }

      // Step 2: AI Check - Compare against solution code
      let solutionFingerprint = null;
      
      if (solutionCode) {
        try {
          // Assume solution is in the same language as first submission
          const solutionLanguage = submissionsWithFingerprints[0].language;
          solutionFingerprint = await analyzeCode(solutionCode, solutionLanguage);
          
          // Compare each submission against solution
          for (const submission of submissionsWithFingerprints) {
            const aiSimilarity = calculateSimilarity(submission.fingerprint, solutionFingerprint);
            submission.aiSimilarity = aiSimilarity;
          }
        } catch (error) {
          console.error(`[worker] Failed to analyze solution code:`, error.message);
        }
      }

      // Step 3: Peer Check - N×N comparison
      const n = submissionsWithFingerprints.length;
      
      // Initialize max similarity tracking for each submission
      for (const submission of submissionsWithFingerprints) {
        submission.maxPeerSimilarity = 0;
      }
      
      // N×N loop (only upper triangle to avoid duplicates)
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const submissionA = submissionsWithFingerprints[i];
          const submissionB = submissionsWithFingerprints[j];
          
          const similarity = calculateSimilarity(
            submissionA.fingerprint,
            submissionB.fingerprint
          );
          
          // Track max similarity for each submission
          if (similarity > submissionA.maxPeerSimilarity) {
            submissionA.maxPeerSimilarity = similarity;
          }
          if (similarity > submissionB.maxPeerSimilarity) {
            submissionB.maxPeerSimilarity = similarity;
          }
          
          // Store detailed results if similarity > 30%
          if (similarity > 30) {
            const comparisonResult = {
              assignmentId,
              problemId,
              problemTitle: problemData.problemTitle,
              studentA: {
                id: submissionA.studentId,
                name: submissionA.studentName,
                email: submissionA.studentEmail,
                submissionId: submissionA.id,
                language: submissionA.language,
                status: submissionA.status,
                score: submissionA.score,
              },
              studentB: {
                id: submissionB.studentId,
                name: submissionB.studentName,
                email: submissionB.studentEmail,
                submissionId: submissionB.id,
                language: submissionB.language,
                status: submissionB.status,
                score: submissionB.score,
              },
              similarity: similarity,
              comparedAt: new Date().toISOString(),
            };
            
            allComparisonResults.push(comparisonResult);
          }
        }
      }
      
      // Store comparison results in database
      const problemResults = allComparisonResults.filter(r => r.problemId === problemId);
      if (problemResults.length > 0) {
        // First, delete existing matches for this assignment and problem
        // This ensures we don't have duplicates if analysis is run multiple times
        try {
          await sql`
            DELETE FROM plagiarism_matches
            WHERE assignment_id = ${assignmentId}
              AND match_metadata->>'problemId' = ${problemId}
          `;
        } catch (error) {
          console.error(`[worker] Failed to delete old matches:`, error.message);
        }
        
        // Insert new matches
        for (const result of problemResults) {
          try {
            // Insert plagiarism match
            await sql`
              INSERT INTO plagiarism_matches (
                assignment_id,
                submission_a_id,
                submission_b_id,
                similarity_score,
                match_metadata
              ) VALUES (
                ${assignmentId},
                ${result.studentA.submissionId},
                ${result.studentB.submissionId},
                ${result.similarity},
                ${JSON.stringify({
                  problemId: result.problemId,
                  problemTitle: result.problemTitle,
                  studentA: result.studentA,
                  studentB: result.studentB,
                  comparedAt: result.comparedAt
                })}::jsonb
              )
            `;
          } catch (error) {
            console.error(`[worker] Failed to store comparison result:`, error.message);
          }
        }
      }
      
      // Update max_plagiarism_score and top_match for each submission
      for (const submission of submissionsWithFingerprints) {
        const maxScore = Math.max(submission.aiSimilarity || 0, submission.maxPeerSimilarity);
        const isAiMatch = (submission.aiSimilarity || 0) > submission.maxPeerSimilarity;
        
        // Find top match submission ID (if peer match is highest)
        let topMatchId = null;
        if (!isAiMatch && submission.maxPeerSimilarity > 0) {
          // Find the submission that had the highest similarity with this one
          for (const result of problemResults) {
            if (result.studentA.submissionId === submission.id && result.similarity === submission.maxPeerSimilarity) {
              topMatchId = result.studentB.submissionId;
              break;
            }
            if (result.studentB.submissionId === submission.id && result.similarity === submission.maxPeerSimilarity) {
              topMatchId = result.studentA.submissionId;
              break;
            }
          }
        }
        
        try {
          await sql`
            UPDATE problem_submissions
            SET 
              max_plagiarism_score = ${maxScore},
              top_match_submission_id = ${topMatchId},
              is_ai_match = ${isAiMatch}
            WHERE id = ${submission.id}
          `;
        } catch (error) {
          console.error(`[worker] Failed to update scores for ${submission.studentName}:`, error.message);
        }
      }
    }

    console.log(`[worker] Analysis completed for assignment ${assignmentId}`);
  } catch (error) {
    console.error(`[worker] Error processing assignment ${assignmentId}:`, error.message);
    throw error;
  }
}

/**
 * Main message handler
 * Routes messages to appropriate handlers based on action type
 */
async function handleMessage(message) {
  const { action, assignmentId } = message;

  if (!action) {
    console.error("[worker] Message missing 'action' field");
    return;
  }

  switch (action) {
    case "START_ANALYSIS":
      if (!assignmentId) {
        console.error("[worker] START_ANALYSIS message missing 'assignmentId'");
        return;
      }
      
      await handleStartAnalysis(assignmentId);
      break;

    default:
      console.warn(`[worker] Unknown action: "${action}"`);
  }
}

// ============================================
// Worker Startup
// ============================================

async function startWorker() {
  try {
    // Test database connection
    await sql`SELECT 1 as test`;
    console.log("[worker] Database connection verified");

    // Start consuming messages from test_queue
    console.log("[worker] Waiting for messages on test_queue...");
    
    await consumeMessages("test_queue", handleMessage);
  } catch (error) {
    console.error("[worker] Failed to start:", error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("[worker] Shutting down (SIGINT)...");
  await sql.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[worker] Shutting down (SIGTERM)...");
  await sql.end();
  process.exit(0);
});

// Start the worker
startWorker();
