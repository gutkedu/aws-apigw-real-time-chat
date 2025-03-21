import { EventBridgeClient } from '@aws-sdk/client-eventbridge'

let client: EventBridgeClient | null = null

/**
 * @description get the EventBridgeClient
 * @returns EventBridgeClient
 */
export const eventBridge = (): EventBridgeClient => {
  if (client) {
    return client
  }
  client = new EventBridgeClient({
    region: process.env.AWS_REGION ?? 'us-east-1'
  })
  return client
}
