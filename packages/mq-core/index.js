/**
 * @bugteasers/mq-core
 * RabbitMQ message queue utilities with prefetch-based load balancing
 */

const amqplib = require("amqplib");

/**
 * Get RabbitMQ connection URL from environment
 * @returns {string}
 */
function getRabbitMQUrl() {
  const url = process.env.RABBITMQ_URL;
  if (!url) {
    throw new Error("[mq-core] RABBITMQ_URL environment variable is not set");
  }
  return url;
}

/**
 * Create a connection and channel to RabbitMQ
 * @returns {Promise<{connection: amqplib.Connection, channel: amqplib.Channel}>}
 */
async function createConnection() {
  const url = getRabbitMQUrl();
  console.log(`[mq-core] 🔌 Connecting to RabbitMQ at ${url.replace(/:[^:@]+@/, ":****@")}...`);
  
  try {
    const connection = await amqplib.connect(url);
    const channel = await connection.createChannel();
    console.log("[mq-core] ✅ Connected to RabbitMQ successfully");
    return { connection, channel };
  } catch (err) {
    console.error("[mq-core] ❌ Failed to connect to RabbitMQ:", err.message);
    throw err;
  }
}

/**
 * Publish a message to a queue
 * @param {string} queueName - Name of the queue
 * @param {object} payload - JSON-serializable payload object
 * @returns {Promise<boolean>} - True if message was published successfully
 */
async function publishMessage(queueName, payload) {
  let connection;
  let channel;
  
  try {
    const conn = await createConnection();
    connection = conn.connection;
    channel = conn.channel;
    
    // Assert queue exists (creates if not)
    await channel.assertQueue(queueName, { durable: true });
    console.log(`[mq-core] 📝 Queue "${queueName}" asserted`);
    
    // Send message as JSON buffer
    const messageBuffer = Buffer.from(JSON.stringify(payload));
    const sent = channel.sendToQueue(queueName, messageBuffer, {
      persistent: true,
      contentType: "application/json",
    });
    
    if (sent) {
      console.log(`[mq-core] 📤 Message published to queue "${queueName}":`, payload);
    } else {
      console.warn(`[mq-core] ⚠️ Message buffered but not immediately sent to "${queueName}"`);
    }
    
    return sent;
  } catch (err) {
    console.error(`[mq-core] ❌ Failed to publish message to "${queueName}":`, err.message);
    throw err;
  } finally {
    // Clean up connection
    if (channel) {
      try {
        await channel.close();
        console.log("[mq-core] 📪 Channel closed");
      } catch (e) {
        // Ignore close errors
      }
    }
    if (connection) {
      try {
        await connection.close();
        console.log("[mq-core] 🔌 Connection closed");
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

/**
 * Consume messages from a queue with prefetch-based load balancing
 * @param {string} queueName - Name of the queue
 * @param {function(object): Promise<void>} callback - Async callback to process messages
 * @returns {Promise<void>} - Resolves when consumer is set up (runs indefinitely)
 */
async function consumeMessages(queueName, callback) {
  let connection;
  let channel;
  
  try {
    const conn = await createConnection();
    connection = conn.connection;
    channel = conn.channel;
    
    // Assert queue exists (creates if not)
    await channel.assertQueue(queueName, { durable: true });
    console.log(`[mq-core] 📝 Queue "${queueName}" asserted`);
    
    // CRITICAL: Set prefetch to 1 for proper load balancing across workers
    // This ensures each worker only receives one message at a time
    await channel.prefetch(1);
    console.log(`[mq-core] ⚙️ Prefetch set to 1 for queue "${queueName}"`);
    
    console.log(`[mq-core] 👂 Listening for messages on queue "${queueName}"...`);
    
    // Start consuming messages
    await channel.consume(queueName, async (msg) => {
      if (!msg) {
        console.warn(`[mq-core] ⚠️ Received null message on "${queueName}"`);
        return;
      }
      
      const content = msg.content.toString();
      let data;
      
      try {
        data = JSON.parse(content);
      } catch (parseErr) {
        console.error(`[mq-core] ❌ Failed to parse message JSON:`, parseErr.message);
        console.error(`[mq-core] 📄 Raw content:`, content);
        // Ack invalid messages to prevent infinite retry
        channel.ack(msg);
        return;
      }
      
      console.log(`[mq-core] 📩 Received message on "${queueName}":`, data);
      
      try {
        // Await callback execution
        await callback(data);
        
        // Only ack if callback succeeds
        channel.ack(msg);
        console.log(`[mq-core] ✅ Message processed and acked on "${queueName}"`);
      } catch (callbackErr) {
        console.error(`[mq-core] ❌ Callback failed on "${queueName}":`, callbackErr.message);
        
        // Nack with requeue = false to send to dead-letter queue (if configured)
        // or requeue = true to retry
        channel.nack(msg, false, true);
        console.log(`[mq-core] 🔄 Message nacked and requeued on "${queueName}"`);
      }
    });
    
    // Handle connection closure
    connection.on("close", () => {
      console.log("[mq-core] 🔌 Connection closed by server");
    });
    
    connection.on("error", (err) => {
      console.error("[mq-core] ❌ Connection error:", err.message);
    });
    
    channel.on("error", (err) => {
      console.error("[mq-core] ❌ Channel error:", err.message);
    });
    
    // Keep the process alive
    console.log(`[mq-core] 🚀 Consumer ready and waiting for messages on "${queueName}"`);
    
  } catch (err) {
    console.error(`[mq-core] ❌ Failed to start consumer on "${queueName}":`, err.message);
    
    // Clean up on error
    if (channel) {
      try { await channel.close(); } catch (e) { /* ignore */ }
    }
    if (connection) {
      try { await connection.close(); } catch (e) { /* ignore */ }
    }
    
    throw err;
  }
}

module.exports = {
  publishMessage,
  consumeMessages,
};
