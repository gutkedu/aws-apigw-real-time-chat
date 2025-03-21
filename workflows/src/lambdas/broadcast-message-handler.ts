import { PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import { getLogger } from '../shared/get-logger'
import { BatchProcessor, EventType, processPartialResponse } from '@aws-lambda-powertools/batch'
import { apiGatewayManagementApi } from '../aws-clients/api-gateway-management'
import type { SQSRecord, SQSHandler } from 'aws-lambda'

const logger = getLogger()
const client = apiGatewayManagementApi()
const processor = new BatchProcessor(EventType.SQS)

interface MessagePayload {
  connectionId: string
  message: {
    action: string
    sender: string
    content: string
    timestamp: string
  }
}

const recordHandler = async (record: SQSRecord): Promise<void> => {
  logger.info('Processing SQS message', {
    messageId: record.messageId
  })

  const body = record.body

  if (!body) {
    logger.error('Empty message body received')
    return
  }

  try {
    const item: MessagePayload = JSON.parse(body)

    const { connectionId, message } = item

    if (!connectionId) {
      logger.error('ConnectionId not found in payload', { item })
      return
    }

    try {
      const command = new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify({ ...message, connectionId }))
      })

      await client.send(command)
      logger.info('Message sent successfully', { connectionId })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.name === 'GoneException') {
        // Connection is stale/closed - remove it from your tracking
        logger.warn('Stale connection detected - connection no longer available', {
          connectionId,
          error: error.message
        })
        return
      }
      throw error
    }
  } catch (error) {
    logger.error('Failed to process message', {
      error,
      body,
      messageId: record.messageId
    })
    // Rethrow to mark this individual record as failed
    throw error
  }
}

export const broadcastMessageHandler: SQSHandler = async (event, context) => {
  logger.info(`Batch size: ${event?.Records.length || 0}`)
  return processPartialResponse(event, recordHandler, processor, { context })
}
