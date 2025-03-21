import { FastifyInstance } from 'fastify'
import { FetchLastMessagesController } from './fetch-last-messages'

export async function routes(app: FastifyInstance) {
  app.get('/chat/last-messages', FetchLastMessagesController)
}
