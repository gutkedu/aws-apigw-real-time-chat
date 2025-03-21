import { ConnectionEntity } from '@/entities/connection'
import { dynamo } from '@/aws-clients/dynamo'
import { IntegrationError } from '@/shared/errors/integration-error'
import { getLogger } from '@/shared/get-logger'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { eventBridge } from '@/aws-clients/event-bridge'
import { PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { EventsDetailType, EventSourceName } from '@/shared/events/events-definitions'
import { genSenderFromConnId } from '@/shared/utils/generate-sender-from-conn-id'
import { WebSocketRouteKey } from '@/shared/enum/websocket-route-key'

interface WsConnectInput {
  connectionId: string
  action: WebSocketRouteKey
  clientId: string | null
}

const dynamoClient = dynamo()
const eventBridgeClient = eventBridge()
const logger = getLogger()

/**
 * @description This function is used to connect to a WebSocket server.
 */
export async function wsConnect({ connectionId, action, clientId }: WsConnectInput) {
  /**
   * 2 hours is the maximum TTL for a connection
   * ref: https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html
   */
  const EXPIRATION_IN_SECONDS = 2 * 60 * 60

  const expiryTime = Math.floor(Date.now() / 1000) + EXPIRATION_IN_SECONDS

  const connectionEntity = ConnectionEntity.create({
    id: connectionId,
    ttl: expiryTime,
    sender: genSenderFromConnId(connectionId),
    clientId
  })

  const putItemCommand = new PutCommand({
    TableName: process.env.TABLE_NAME,
    Item: connectionEntity.toDynamoItem(),
    ConditionExpression: 'attribute_not_exists(sk)'
  })

  try {
    await dynamoClient.send(putItemCommand)
    logger.info('Connection created', { connectionId, expiryTime })
  } catch (error) {
    logger.error('Error creating connection', { connectionId, error })
    throw new IntegrationError('Error creating connection')
  }

  const event = new PutEventsCommand({
    Entries: [
      {
        Source: EventSourceName,
        DetailType: EventsDetailType.CONNECTION_ESTABLISHED,
        Detail: JSON.stringify({
          connectionId,
          sender: connectionEntity.sender,
          action,
          clientId,
          timestamp: new Date().toISOString()
        }),
        EventBusName: process.env.EVENT_BUS_NAME
      }
    ]
  })

  try {
    await eventBridgeClient.send(event)
  } catch (error) {
    logger.error('Error sending event', { connectionId, error })
    throw new IntegrationError('Error sending event')
  }
}
