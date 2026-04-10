/**
 * @bugteasers/worker
 * RabbitMQ worker for processing assignment analysis tasks
 */

// Load environment variables from .env file
require("dotenv").config();

const { consumeMessages } = require("@bugteasers/mq-core");
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

    // TODO: Perform AST comparison analysis
    // This is where you would use @bugteasers/ast-core to compare submissions
    console.log(`\n[START_ANALYSIS] 🔬 Ready for AST comparison phase`);
    console.log(`[START_ANALYSIS] 📋 Problems to analyze: ${Object.keys(submissionsByProblem).length}`);

    // Example structure for AST comparison (to be implemented):
    console.log(`\n[START_ANALYSIS] 📊 Detailed breakdown by problem:`);
    for (const [problemId, problemData] of Object.entries(submissionsByProblem)) {
      console.log(`\n[START_ANALYSIS]    📝 Problem: "${problemData.problemTitle}"`);
      console.log(`[START_ANALYSIS]       ID: ${problemId}`);
      console.log(`[START_ANALYSIS]       Submissions: ${problemData.submissions.length}`);
      console.log(`[START_ANALYSIS]       Solution code: ${problemData.solutionCode ? `${problemData.solutionCode.length} chars` : 'Not available'}`);
      
      // Log languages used
      const languages = [...new Set(problemData.submissions.map(s => s.language))];
      console.log(`[START_ANALYSIS]       Languages: ${languages.join(', ')}`);
      
      // Log status distribution
      const statusCounts = problemData.submissions.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {});
      console.log(`[START_ANALYSIS]       Status distribution:`, statusCounts);
      
      // TODO: Call AST comparison logic here
      // Example:
      // const similarities = await compareSubmissions(problemData);
      // await storeSimilarityResults(assignmentId, problemId, similarities);
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
