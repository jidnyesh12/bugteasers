/**
 * Test script for @bugteasers/mq-core
 * 
 * Usage: node test.js publish  - Publish a test message
 *        node test.js consume  - Start consumer
 * 
 * Requires RABBITMQ_URL env var (defaults to localhost)
 */

const { publishMessage, consumeMessages } = require("./index");

// Default URL for local development
if (!process.env.RABBITMQ_URL) {
  process.env.RABBITMQ_URL = "amqp://guest:guest@localhost:5672";
  console.log("[test] Using default RABBITMQ_URL: amqp://guest:guest@localhost:5672");
}

const QUEUE_NAME = process.env.RABBITMQ_QUEUE || "test_queue";

async function testPublish() {
  console.log("\n=== Testing publishMessage ===\n");
  
  const payload = {
    id: Date.now(),
    action: "test",
    data: { message: "Hello from mq-core!" },
  };
  
  await publishMessage(QUEUE_NAME, payload);
  console.log("\n✅ Publish test completed");
}

async function testConsume() {
  console.log("\n=== Testing consumeMessages ===\n");
  
  let messageCount = 0;
  
  await consumeMessages(QUEUE_NAME, async (data) => {
    messageCount++;
    console.log(`\n📦 Processing message #${messageCount}:`, data);
    
    // Simulate async work
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    console.log("✅ Processing complete");
    
    // Stop after 3 messages for testing
    if (messageCount >= 3) {
      console.log("\n🛑 Received 3 messages, exiting test...");
      process.exit(0);
    }
  });
}

// Run test based on argument
const mode = process.argv[2];

if (mode === "publish") {
  testPublish().catch(console.error);
} else if (mode === "consume") {
  testConsume().catch(console.error);
} else {
  console.log("Usage:");
  console.log("  node test.js publish  - Publish a test message");
  console.log("  node test.js consume  - Start consumer (listens indefinitely)");
}
