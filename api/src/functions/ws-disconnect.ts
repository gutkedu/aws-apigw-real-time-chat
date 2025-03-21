import { ConnectionEntity } from '@/entities/connection'
import { dynamo } from '@/aws-clients/dynamo'
import { IntegrationError } from '@/shared/errors/integration-error'
import { getLogger } from '@/shared/get-logger'
import { DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { eventBridge } from '@/aws-clients/event-bridge'
import { PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { EventsDetailType, EventSourceName } from '@/shared/events/events-definitions'
import { WebSocketRouteKey } from '@/shared/enum/websocket-route-key'

interface WsDisconnectInput {
  connectionId: string
  action: WebSocketRouteKey
}

const dynamoClient = dynamo()
const eventBridgeClient = eventBridge()
const logger = getLogger()

/**
 * @description This function is used to disconnect from a WebSocket server.
 */
export async function wsDisconnect({ connectionId, action }: WsDisconnectInput) {
  try {
    const findItemCommand = new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        pk: `CONNECTION`,
        sk: `ID#${connectionId}`
      }
    })

    const { Item } = await dynamoClient.send(findItemCommand)

    const connectionEntity = ConnectionEntity.fromDynamoItem(Item as ConnectionEntity)

    if (!connectionEntity) {
      logger.error('Connection not found', { connectionId })
      throw new IntegrationError('Connection not found')
    }

    const { pk, sk } = connectionEntity.toDynamoItem()

    const deleteItemCommand = new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key: { pk, sk }
    })

    await dynamoClient.send(deleteItemCommand)

    logger.info('Connection deleted', { connectionId })

    const sendEvent = new PutEventsCommand({
      Entries: [
        {
          DetailType: EventsDetailType.CONNECTION_CLOSED,
          Source: EventSourceName,
          Detail: JSON.stringify({
            connectionId,
            sender: connectionEntity.sender,
            clientId: connectionEntity.clientId,
            action,
            timestamp: new Date().toISOString()
          }),
          EventBusName: process.env.EVENT_BUS_NAME
        }
      ]
    })

    const { Entries } = await eventBridgeClient.send(sendEvent)

    logger.info('Event sent', { Entries })
  } catch (error) {
    logger.error('Error deleting connection', { connectionId, error })
    throw new IntegrationError('Error deleting connection')
  }
}
