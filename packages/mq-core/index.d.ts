/**
 * @bugteasers/mq-core TypeScript declarations
 */

/**
 * Publish a message to a queue
 * @param queueName - Name of the queue
 * @param payload - JSON-serializable payload object
 * @returns Promise that resolves to true if message was published successfully
 */
export function publishMessage(
  queueName: string,
  payload: Record<string, unknown>
): Promise<boolean>;

/**
 * Consume messages from a queue with prefetch-based load balancing
 * @param queueName - Name of the queue
 * @param callback - Async callback to process messages
 * @returns Promise that resolves when consumer is set up (runs indefinitely)
 */
export function consumeMessages(
  queueName: string,
  callback: (data: Record<string, unknown>) => Promise<void>
): Promise<void>;
