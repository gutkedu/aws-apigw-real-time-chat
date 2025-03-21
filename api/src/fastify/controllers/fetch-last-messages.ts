import { fetchLastMessages } from '@/functions/fetch-last-messages'
import { getLogger } from '@/shared/get-logger'
import { FastifyReply, FastifyRequest } from 'fastify'

const logger = getLogger()

export async function FetchLastMessagesController(request: FastifyRequest, reply: FastifyReply) {
  logger.info('Fetch last messages request received', {
    requestId: request.id
  })

  const { messages } = await fetchLastMessages()

  reply.status(200).send({
    messages
  })
}
