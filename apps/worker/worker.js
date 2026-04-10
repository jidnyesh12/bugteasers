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
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Create Postgres client with direct connection
const sql = postgres(DATABASE_URL, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

console.log("✅ Database connection configured");

// ============================================
// Message Handlers
// ============================================

/**
 * Handle START_ANALYSIS action
 * Fetches best submissions for each student-problem pair and prepares for AST comparison
 */
async function handleStartAnalysis(assignmentId) {
  console.log("\n" + "=".repeat(80));
  console.log(`[START_ANALYSIS] 🚀 Processing assignment: ${assignmentId}`);
  console.log("=".repeat(80));

  try {
    console.log(`[START_ANALYSIS] 📊 Executing database query...`);
    const queryStart = Date.now();
    
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

    const queryTime = Date.now() - queryStart;
    console.log(`[START_ANALYSIS] ✅ Query completed in ${queryTime}ms`);
    console.log(`[START_ANALYSIS] 📦 Found ${submissions.length} best submissions`);

    if (submissions.length === 0) {
      console.log(`[START_ANALYSIS] ⚠️  No submissions found for assignment ${assignmentId}`);
      console.log(`[START_ANALYSIS] ℹ️  This could mean:`);
      console.log(`[START_ANALYSIS]    - No students have submitted yet`);
      console.log(`[START_ANALYSIS]    - Assignment ID is incorrect`);
      console.log(`[START_ANALYSIS]    - Submissions don't have assignment_id set`);
      console.log("=".repeat(80) + "\n");
      return;
    }

    // Log summary
    const uniqueStudents = new Set(submissions.map((s) => s.student_id)).size;
    const uniqueProblems = new Set(submissions.map((s) => s.problem_id)).size;
    
    console.log(`\n[START_ANALYSIS] 📈 Summary:`);
    console.log(`[START_ANALYSIS]    👥 Students: ${uniqueStudents}`);
    console.log(`[START_ANALYSIS]    📝 Problems: ${uniqueProblems}`);
    console.log(`[START_ANALYSIS]    📊 Total submissions: ${submissions.length}`);
    console.log(`[START_ANALYSIS]    📐 Avg submissions per problem: ${(submissions.length / uniqueProblems).toFixed(1)}`);

    // Log first few submissions for debugging
    console.log(`\n[START_ANALYSIS] 🔍 Sample submissions (first 3):`);
    submissions.slice(0, 3).forEach((sub, idx) => {
      console.log(`[START_ANALYSIS]    ${idx + 1}. ${sub.student_name} - ${sub.problem_title}`);
      console.log(`[START_ANALYSIS]       Status: ${sub.status}, Score: ${sub.score || 'N/A'}, Language: ${sub.language}`);
      console.log(`[START_ANALYSIS]       Code length: ${sub.code?.length || 0} chars`);
      console.log(`[START_ANALYSIS]       Solution code available: ${sub.solution_code ? 'Yes' : 'No'}`);
    });

    // Group submissions by problem for analysis
    console.log(`\n[START_ANALYSIS] 🗂️  Grouping submissions by problem...`);
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

    console.log(`[START_ANALYSIS] ✅ Grouped into ${Object.keys(submissionsByProblem).length} problems`);

    // ============================================
    // AST Comparison Phase
    // ============================================
    console.log(`\n[START_ANALYSIS] 🔬 Starting AST comparison phase...`);
    console.log(`[START_ANALYSIS] 📋 Problems to analyze: ${Object.keys(submissionsByProblem).length}`);

    const allComparisonResults = [];
    let totalComparisons = 0;
    let totalHighSimilarities = 0;

    // Process each problem
    for (const [problemId, problemData] of Object.entries(submissionsByProblem)) {
      console.log(`\n${"─".repeat(80)}`);
      console.log(`[AST] 📝 Problem: "${problemData.problemTitle}"`);
      console.log(`[AST]    ID: ${problemId}`);
      console.log(`[AST]    Submissions: ${problemData.submissions.length}`);
      
      const submissions = problemData.submissions;
      const solutionCode = problemData.solutionCode;

      // Step 1: Generate fingerprints for all submissions
      console.log(`[AST] 🔍 Step 1: Generating fingerprints...`);
      const fingerprintStart = Date.now();
      
      const submissionsWithFingerprints = [];
      
      for (const submission of submissions) {
        try {
          console.log(`[AST]    Analyzing ${submission.studentName} (${submission.language})...`);
          const fingerprint = await analyzeCode(submission.code, submission.language);
          
          submissionsWithFingerprints.push({
            ...submission,
            fingerprint,
          });
          
          console.log(`[AST]    ✅ Fingerprint generated: ${fingerprint.length} hashes`);
        } catch (error) {
          console.error(`[AST]    ❌ Failed to analyze ${submission.studentName}:`, error.message);
          // Skip this submission if fingerprinting fails
        }
      }
      
      const fingerprintTime = Date.now() - fingerprintStart;
      console.log(`[AST] ✅ Fingerprints generated in ${fingerprintTime}ms`);
      console.log(`[AST]    Success: ${submissionsWithFingerprints.length}/${submissions.length}`);

      if (submissionsWithFingerprints.length === 0) {
        console.log(`[AST] ⚠️  No valid fingerprints, skipping problem`);
        continue;
      }

      // Step 2: AI Check - Compare against solution code
      console.log(`\n[AST] 🤖 Step 2: AI Check (vs solution code)...`);
      let solutionFingerprint = null;
      
      if (solutionCode) {
        try {
          // Assume solution is in the same language as first submission
          const solutionLanguage = submissionsWithFingerprints[0].language;
          console.log(`[AST]    Generating solution fingerprint (${solutionLanguage})...`);
          solutionFingerprint = await analyzeCode(solutionCode, solutionLanguage);
          console.log(`[AST]    ✅ Solution fingerprint: ${solutionFingerprint.length} hashes`);
          
          // Compare each submission against solution
          for (const submission of submissionsWithFingerprints) {
            const aiSimilarity = calculateSimilarity(submission.fingerprint, solutionFingerprint);
            submission.aiSimilarity = aiSimilarity;
            
            console.log(`[AST]    ${submission.studentName}: ${aiSimilarity.toFixed(2)}% similar to solution`);
            
            if (aiSimilarity > 30) {
              totalHighSimilarities++;
            }
          }
        } catch (error) {
          console.error(`[AST]    ❌ Failed to analyze solution code:`, error.message);
        }
      } else {
        console.log(`[AST]    ⚠️  No solution code available, skipping AI check`);
      }

      // Step 3: Peer Check - N×N comparison
      console.log(`\n[AST] 👥 Step 3: Peer Check (N×N comparison)...`);
      const n = submissionsWithFingerprints.length;
      const totalPeerComparisons = (n * (n - 1)) / 2; // Combinations, not permutations
      console.log(`[AST]    Students: ${n}`);
      console.log(`[AST]    Comparisons to perform: ${totalPeerComparisons}`);
      
      const peerComparisonStart = Date.now();
      
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
          
          totalComparisons++;
          
          // Track max similarity for each submission
          if (similarity > submissionA.maxPeerSimilarity) {
            submissionA.maxPeerSimilarity = similarity;
          }
          if (similarity > submissionB.maxPeerSimilarity) {
            submissionB.maxPeerSimilarity = similarity;
          }
          
          // Store detailed results if similarity > 30%
          if (similarity > 30) {
            totalHighSimilarities++;
            
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
            
            console.log(`[AST]    🚨 ${similarity.toFixed(2)}% - ${submissionA.studentName} ↔ ${submissionB.studentName}`);
          }
        }
      }
      
      const peerComparisonTime = Date.now() - peerComparisonStart;
      console.log(`[AST] ✅ Peer comparisons completed in ${peerComparisonTime}ms`);
      console.log(`[AST]    Comparisons performed: ${totalPeerComparisons}`);
      console.log(`[AST]    High similarities (>30%): ${allComparisonResults.filter(r => r.problemId === problemId).length}`);
      
      // Step 4: Summary for this problem
      console.log(`\n[AST] 📊 Summary for "${problemData.problemTitle}":`);
      for (const submission of submissionsWithFingerprints) {
        console.log(`[AST]    ${submission.studentName}:`);
        if (submission.aiSimilarity !== undefined) {
          console.log(`[AST]       AI Similarity: ${submission.aiSimilarity.toFixed(2)}%`);
        }
        console.log(`[AST]       Max Peer Similarity: ${submission.maxPeerSimilarity.toFixed(2)}%`);
        console.log(`[AST]       Absolute Highest: ${Math.max(submission.aiSimilarity || 0, submission.maxPeerSimilarity).toFixed(2)}%`);
      }
    }

    // ============================================
    // Final Summary
    // ============================================
    console.log(`\n${"=".repeat(80)}`);
    console.log(`[START_ANALYSIS] 📈 Final Summary:`);
    console.log(`[START_ANALYSIS]    Total comparisons: ${totalComparisons}`);
    console.log(`[START_ANALYSIS]    High similarities (>30%): ${totalHighSimilarities}`);
    console.log(`[START_ANALYSIS]    Detailed results stored: ${allComparisonResults.length}`);
    
    if (allComparisonResults.length > 0) {
      console.log(`\n[START_ANALYSIS] 🚨 Top 5 highest similarities:`);
      const topResults = allComparisonResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
      
      topResults.forEach((result, idx) => {
        console.log(`[START_ANALYSIS]    ${idx + 1}. ${result.similarity.toFixed(2)}% - ${result.studentA.name} ↔ ${result.studentB.name}`);
        console.log(`[START_ANALYSIS]       Problem: ${result.problemTitle}`);
      });
      
      // TODO: Store results in database
      console.log(`\n[START_ANALYSIS] 💾 TODO: Store ${allComparisonResults.length} results in database`);
      console.log(`[START_ANALYSIS] 📊 Results structure:`, JSON.stringify(allComparisonResults[0], null, 2));
    }

    console.log(`\n[START_ANALYSIS] ✅ Analysis completed for assignment ${assignmentId}`);
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error(`\n[START_ANALYSIS] ❌ Error processing assignment ${assignmentId}:`);
    console.error(`[START_ANALYSIS] Error name: ${error.name}`);
    console.error(`[START_ANALYSIS] Error message: ${error.message}`);
    console.error(`[START_ANALYSIS] Stack trace:`, error.stack);
    console.log("=".repeat(80) + "\n");
    throw error;
  }
}

/**
 * Main message handler
 * Routes messages to appropriate handlers based on action type
 */
async function handleMessage(message) {
  console.log("\n" + "█".repeat(80));
  console.log("█ [Worker] 📨 NEW MESSAGE RECEIVED");
  console.log("█".repeat(80));
  console.log("[Worker] Message payload:", JSON.stringify(message, null, 2));
  console.log("[Worker] Timestamp:", new Date().toISOString());

  const { action, assignmentId } = message;

  if (!action) {
    console.error("[Worker] ❌ Message missing 'action' field");
    console.error("[Worker] Full message:", message);
    console.log("█".repeat(80) + "\n");
    return;
  }

  console.log(`[Worker] Action type: "${action}"`);

  switch (action) {
    case "START_ANALYSIS":
      if (!assignmentId) {
        console.error("[Worker] ❌ START_ANALYSIS message missing 'assignmentId'");
        console.error("[Worker] Full message:", message);
        console.log("█".repeat(80) + "\n");
        return;
      }
      console.log(`[Worker] ✅ Valid START_ANALYSIS message`);
      console.log(`[Worker] Assignment ID: ${assignmentId}`);
      console.log("█".repeat(80));
      
      await handleStartAnalysis(assignmentId);
      break;

    default:
      console.warn(`[Worker] ⚠️  Unknown action: "${action}"`);
      console.warn(`[Worker] Supported actions: START_ANALYSIS`);
      console.log("█".repeat(80) + "\n");
  }
}

// ============================================
// Worker Startup
// ============================================

async function startWorker() {
  console.log("\n" + "🚀".repeat(40));
  console.log("🚀 Starting BugTeasers Worker...");
  console.log("🚀".repeat(40) + "\n");

  try {
    // Test database connection
    console.log("[Worker] 🔌 Testing database connection...");
    const dbTest = await sql`SELECT 1 as test, NOW() as current_time`;
    console.log("[Worker] ✅ Database connection verified");
    console.log("[Worker] 📅 Database time:", dbTest[0].current_time);

    // Start consuming messages from test_queue
    console.log("\n[Worker] 👂 Starting message consumer...");
    console.log("[Worker] 📬 Queue: test_queue");
    console.log("[Worker] ⏳ Waiting for messages...\n");
    
    await consumeMessages("test_queue", handleMessage);
  } catch (error) {
    console.error("\n❌".repeat(40));
    console.error("❌ Failed to start worker");
    console.error("❌".repeat(40));
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\n" + "🛑".repeat(40));
  console.log("🛑 Shutting down worker (SIGINT)...");
  console.log("🛑".repeat(40));
  await sql.end();
  console.log("✅ Database connections closed");
  console.log("👋 Goodbye!\n");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n\n" + "🛑".repeat(40));
  console.log("🛑 Shutting down worker (SIGTERM)...");
  console.log("🛑".repeat(40));
  await sql.end();
  console.log("✅ Database connections closed");
  console.log("👋 Goodbye!\n");
  process.exit(0);
});

// Start the worker
startWorker();
