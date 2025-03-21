import { sendMessage } from '@/functions/send-message'
import { wsConnect } from '@/functions/ws-connect'
import { wsDisconnect } from '@/functions/ws-disconnect'
import { WebSocketRouteKey } from '@/shared/enum/websocket-route-key'
import { IntegrationError } from '@/shared/errors/integration-error'
import { getLogger } from '@/shared/get-logger'
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { z, ZodError } from 'zod'

const logger = getLogger()
export async function wsApiHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  logger.info('WebSocket handler', { event, context })

  const { connectionId } = event.requestContext
  const eventType = event.requestContext.eventType as 'CONNECT' | 'DISCONNECT' | 'MESSAGE'
  const routeKey = event.requestContext.routeKey as WebSocketRouteKey

  if (!connectionId) {
    logger.error('ConnectionId not found', { event })
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'ConnectionId not found' })
    }
  }

  if (!routeKey) {
    logger.error('RouteKey not found', { event })
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'RouteKey not found' })
    }
  }

  try {
    if (routeKey === WebSocketRouteKey.CONNECT && eventType === 'CONNECT') {
      const clientId = event.queryStringParameters?.clientId ?? null
      logger.info('Connecting', { connectionId })
      await wsConnect({ connectionId, action: WebSocketRouteKey.CONNECT, clientId })
      return { statusCode: 200, body: 'Connected' }
    }

    if (routeKey === WebSocketRouteKey.DISCONNECT && eventType === 'DISCONNECT') {
      logger.info('Disconnecting', { connectionId })
      await wsDisconnect({ connectionId, action: WebSocketRouteKey.DISCONNECT })
      return { statusCode: 200, body: 'Disconnected' }
    }

    if (routeKey === WebSocketRouteKey.SEND_MESSAGE && eventType === 'MESSAGE') {
      logger.info('Sending message', { connectionId })
      const message = JSON.parse(event.body || '{}')

      const schema = z.object({
        content: z.string().min(1).max(150)
      })

      const { content } = schema.parse(message)

      await sendMessage({ content, connectionId, action: WebSocketRouteKey.SEND_MESSAGE })

      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'Message sent successfully' })
      }
    }

    if (routeKey === WebSocketRouteKey.SYSTEM_MESSAGE && eventType === 'MESSAGE') {
      logger.info('Sending system message', { connectionId })
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'System message sent successfully' })
      }
    }

    if (routeKey === WebSocketRouteKey.RECEIVE_MESSAGE && eventType === 'MESSAGE') {
      logger.info('Receiving message', { connectionId })
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'Message received successfully' })
      }
    }

    if (routeKey === WebSocketRouteKey.DEFAULT) {
      logger.info('Default route', { connectionId })
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Unsupported action: ${routeKey}` })
      }
    }

    logger.error('Unknown route key', { routeKey })
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Unknown route key' })
    }
  } catch (error) {
    logger.error('Error handling websocket event', { event, error })

    if (error instanceof ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.errors })
      }
    }

    if (error instanceof IntegrationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.message })
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error.' })
    }
  }
}
