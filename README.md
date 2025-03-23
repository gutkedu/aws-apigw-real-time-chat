# Real-Time Chat Demo
A serverless real-time chat application built with AWS serverless services.

## Overview
This demo showcases how to build a scalable, real-time chat application using AWS serverless technologies. The application uses WebSockets for real-time bi-directional communication, allowing users to exchange messages instantly without page refreshes.

## Architecture
The application is built using the following AWS services:

- **API Gateway (WebSocket API)**: Handles real-time WebSocket connections
- **Lambda**: Processes chat messages and connection events
- **DynamoDB**: Stores connection information and message history
- **Step Functions**: Orchestrates message delivery and workflow
- **EventBridge**: Facilitates event-driven communication between components
- **S3**: Hosts the frontend static assets

![Architecture Diagram](www.google.com) TODO: Add architecture diagram
 
## Features
- Real-time message delivery via WebSockets
- Message persistence with DynamoDB
- User presence indicators (online/offline status)
- Message history loading
- Serverless architecture with pay-per-use pricing
- Client-side message filtering to avoid duplicate messages
- Responsive and lightweight frontend

## Repository Structure

```bash
real-time-chat-demo/
├── front/                   # Frontend code
│   ├── src/                 # Source code for the chat interface
│   │   ├── index.html       # Main HTML file
│   │   ├── style.css        # Styling for the chat interface
│   │   └── app.mjs          # JavaScript for WebSocket communication
│   └── deploy-frontend.sh   # Script to deploy frontend to S3
├── shared/                  # Shared resources across services
│   ├── template.yaml        # CloudFormation template for shared resources
├── workflows/               # Step Functions workflows
│   ├── template.yaml        # CloudFormation template for workflows
│   ├── src/                 # Source code for Lambda functions
│   │   ├── lambdas/         # Lambda function handlers
│   │   │   └── broadcast-message-handler.ts   # Message broadcast handler
│   │   ├── shared/          # Shared utilities
│   │   └── aws-clients/     # AWS SDK client configuration
│   └── statemachine/        # Step Functions state machine definitions
│       └── message-distribution.asl.json    # Message distribution state machine
└── api/                     # API Gateway and connection management
    ├── template.yaml        # CloudFormation template for API
    └── src/                 # Lambda functions for API endpoints
```

### Deployment
Each component of the application has its own deployment process:

### Prerequisites
- AWS CLI installed and configured
- Node.js 16+ and npm
- AWS SAM CLI (for deploying serverless applications)

### Shared Resources
- **API Gateway and Connection Management**

### Workflows
- **Frontend**

## Local Development
To run the application locally:
1. Start the frontend development server.
2. Use a WebSocket emulator or deploy the backend to AWS and connect to it from the local frontend.

## Performance Optimization
The application is optimized for real-time performance:
- Direct Lambda invocation for message delivery instead of SQS for lower latency
- Client-side message handling to prevent duplicate message display
- Efficient WebSocket message format to minimize payload size

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements
- AWS for their serverless services
- The open-source community for inspiration and tools

## Contact
For questions or feedback, please open an issue in this repository.
