/**
 * Test script to manually trigger worker analysis
 * Usage: node test-message.js <assignment-id>
 */

require("dotenv").config();
const { publishMessage } = require("@bugteasers/mq-core");

async function testWorker() {
  const assignmentId = process.argv[2];
  
  if (!assignmentId) {
    console.error("❌ Usage: node test-message.js <assignment-id>");
    console.error("Example: node test-message.js abc-123-def-456");
    process.exit(1);
  }
  
  try {
    console.log("📤 Publishing test message to test_queue...");
    console.log("Assignment ID:", assignmentId);
    
    await publishMessage("test_queue", {
      action: "START_ANALYSIS",
      assignmentId: assignmentId
    });
    
    console.log("✅ Message published successfully!");
    console.log("👀 Check worker console for processing logs.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error publishing message:");
    console.error(error.message);
    process.exit(1);
  }
}

testWorker();
