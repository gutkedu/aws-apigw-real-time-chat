import { ApiGatewayManagementApiClient } from '@aws-sdk/client-apigatewaymanagementapi'

let client: ApiGatewayManagementApiClient | null = null

export const apiGatewayManagementApi = (): ApiGatewayManagementApiClient => {
  if (client) {
    return client
  }
  client = new ApiGatewayManagementApiClient({
    endpoint: process.env.WEBSOCKET_HTTP_API_ENDPOINT
  })
  return client
}
