import { IntegrationError } from '@/shared/errors/integration-error'
import Fastify from 'fastify'
import { ZodError } from 'zod'
import cors from '@fastify/cors'
import { getLogger } from '@/shared/get-logger'
import { routes } from '@/fastify/controllers/routes'

const logger = getLogger()

export const app = Fastify()

app.register(routes)

app.register(cors, {
  origin: '*'
})

app.setErrorHandler((error, _request, reply) => {
  logger.error('Error', { error })

  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation error.',
      issues: error.format()
    })
  }

  if (error instanceof IntegrationError) {
    return reply.status(400).send({ message: error.message })
  }

  return reply.status(500).send({ message: 'Internal server error.' })
})
