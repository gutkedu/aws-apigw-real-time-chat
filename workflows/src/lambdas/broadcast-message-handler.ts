import { PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import { getLogger } from '../shared/get-logger'
import { apiGatewayManagementApi } from '../aws-clients/api-gateway-management'
import type { Handler } from 'aws-lambda'

const logger = getLogger()
const client = apiGatewayManagementApi()

interface WebSocketMessage {
  action: string
  sender: string
  content: string
  timestamp: string
}

interface MessageEvent {
  connectionId: string
  message: WebSocketMessage
}

/**
 * Lambda handler for direct invocation to broadcast a message to a WebSocket connection
 */
export const broadcastMessageHandler: Handler<MessageEvent> = async (event) => {
  try {
    logger.info('Processing message event', { connectionId: event.connectionId })

    await sendMessageToConnection(event)

    return { statusCode: 200, body: 'Message sent successfully' }
  } catch (error) {
    logger.error('Error in broadcastMessageHandler', { error })
    throw error
  }
}

/**
 * Sends a message to a single WebSocket connection
 */
async function sendMessageToConnection(messageEvent: MessageEvent): Promise<void> {
  const { connectionId, message } = messageEvent

  if (!connectionId) {
    logger.error('ConnectionId not found in payload', { messageEvent })
    return
  }

  try {
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(message))
    })

    await client.send(command)
    logger.info('Message sent successfully', { connectionId })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.name === 'GoneException') {
      // Connection is stale/closed
      logger.warn('Stale connection detected - connection no longer available', {
        connectionId,
        error: error.message
      })
      return
    }

    // Rethrow the error for non-GoneException errors
    // This will help the state machine handle failures appropriately
    logger.error('Failed to send message to connection', {
      connectionId,
      error: error.message,
      errorName: error.name
    })
    throw error
  }
}
