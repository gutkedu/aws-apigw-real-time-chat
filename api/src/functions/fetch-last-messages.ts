import { dynamo } from '@/aws-clients/dynamo'
import { MessageDynamo, MessageEntity } from '@/entities/message'
import { IntegrationError } from '@/shared/errors/integration-error'
import { getLogger } from '@/shared/get-logger'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'

const dynamoClient = dynamo()
const logger = getLogger()

interface FetchLastMessagesResponse {
  messages: Array<{
    id: string
    sender: string
    connectionId: string
    content: string
    createdAt: string
  }>
}

export async function fetchLastMessages(): Promise<FetchLastMessagesResponse> {
  const fetchMessagesCommand = new QueryCommand({
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': 'MESSAGE'
    },
    ScanIndexForward: false,
    Limit: 20
  })

  try {
    const { Items } = await dynamoClient.send(fetchMessagesCommand)

    if (!Items || !Items.length) {
      return { messages: [] }
    }

    const messagesArr = Items.map((item) => MessageEntity.fromDynamoItem(item as MessageDynamo))

    return {
      messages: messagesArr.map((message) => ({
        id: message.id,
        sender: message.sender,
        connectionId: message.connectionId,
        content: message.content,
        createdAt: message.createdAt
      }))
    }
  } catch (error) {
    logger.error('Error fetching messages', { error })
    throw new IntegrationError('Error fetching messages')
  }
}
