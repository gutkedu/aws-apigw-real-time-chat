import { MessageEntity } from '@/entities/message'
import { dynamo } from '@/aws-clients/dynamo'
import { eventBridge } from '@/aws-clients/event-bridge'
import { IntegrationError } from '@/shared/errors/integration-error'
import { EventsDetailType, EventSourceName } from '@/shared/events/events-definitions'
import { getLogger } from '@/shared/get-logger'
import { PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { ConnectionEntity } from '@/entities/connection'
import { WebSocketRouteKey } from '@/shared/enum/websocket-route-key'

interface SendMessageInput {
  content: string
  connectionId: string
  action: WebSocketRouteKey
}

const eventBridgeClient = eventBridge()
const dynamoClient = dynamo()
const logger = getLogger()

export async function sendMessage({ content, connectionId, action }: SendMessageInput): Promise<void> {
  try {
    const connectionExist = new GetCommand({
      Key: {
        pk: `CONNECTION`,
        sk: `ID#${connectionId}`
      },
      TableName: process.env.TABLE_NAME
    })

    const { Item } = await dynamoClient.send(connectionExist)

    const connection = ConnectionEntity.fromDynamoItem(Item as ConnectionEntity)

    if (!connection) {
      logger.error('Connection not found', { connectionId })
      throw new IntegrationError('Connection not found')
    }

    const MESSAGE_EXPIRATION_IN_SECONDS = 24 * 60 * 60 // 24 hours
    const ttl = Math.floor(Date.now() / 1000) + MESSAGE_EXPIRATION_IN_SECONDS

    const message = MessageEntity.create({
      content,
      connectionId,
      sender: connection.sender,
      ttl
    })

    const addToDynamoCommand = new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: message.toDynamoItem()
    })

    await dynamoClient.send(addToDynamoCommand)

    const eventPayload = {
      action,
      content,
      sender: message.sender,
      messageId: message.id,
      clientId: connection.clientId,
      connectionId: message.connectionId,
      timestamp: new Date().toISOString()
    }

    const sendEvent = new PutEventsCommand({
      Entries: [
        {
          Source: EventSourceName,
          DetailType: EventsDetailType.MESSAGE_SENT,
          Detail: JSON.stringify(eventPayload),
          EventBusName: process.env.EVENT_BUS_NAME
        }
      ]
    })

    const { Entries } = await eventBridgeClient.send(sendEvent)

    logger.info('Message sent', {
      Entries,
      eventPayload
    })
  } catch (error) {
    logger.error('Error fetching connection from DynamoDB', { error })
    throw new IntegrationError('Error fetching connection from DynamoDB')
  }
}
