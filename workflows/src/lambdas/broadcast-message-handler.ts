import { PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import { getLogger } from '../shared/get-logger'
import { BatchProcessor, EventType, processPartialResponse } from '@aws-lambda-powertools/batch'
import { apiGatewayManagementApi } from '../aws-clients/api-gateway-management'
import type { KinesisStreamHandler, KinesisStreamRecord } from 'aws-lambda'

const logger = getLogger()
const client = apiGatewayManagementApi()
const processor = new BatchProcessor(EventType.KinesisDataStreams)

interface MessagePayload {
  connectionId: string
  message: {
    action: string
    sender: string
    content: string
    timestamp: string
  }
}

const recordHandler = async (record: KinesisStreamRecord): Promise<void> => {
  logger.info(`Processing record of sequenceNumber: ${record.kinesis.sequenceNumber}`, {
    record
  })

  const data = Buffer.from(record.kinesis.data, 'base64').toString()

  if (!data) {
    logger.error('Empty payload received')
    return
  }

  try {
    const item: MessagePayload = JSON.parse(data)

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
    logger.error('Failed to process record', {
      error,
      data,
      partitionKey: record.kinesis.partitionKey,
      sequenceNumber: record.kinesis.sequenceNumber
    })
    // Rethrow to mark this individual record as failed
    throw error
  }
}

export const broadcastMessageHandler: KinesisStreamHandler = async (event, context) => {
  logger.info(`Batch size: ${event?.Records.length || 0}`)
  return processPartialResponse(event, recordHandler, processor, { context })
}
