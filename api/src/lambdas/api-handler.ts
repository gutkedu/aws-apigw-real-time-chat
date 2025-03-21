import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import awsLambdaFastify from '@fastify/aws-lambda'
import { app } from '../fastify/app'

import { getLogger } from '@/shared/get-logger'

const logger = getLogger()

const proxy = awsLambdaFastify(app, {
  serializeLambdaArguments: true
})

export async function apiHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  logger.addContext(context)
  logger.info('Lambda request', { event, context })
  return await proxy(event, context)
}
