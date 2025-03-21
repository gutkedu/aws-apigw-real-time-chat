#!/bin/bash

# Set variables
ENV=${1:-dev}  # Default to dev if no environment is specified
BUCKET_NAME="real-time-chat-frontend-bucket-$ENV"
FRONTEND_DIR="front"
SRC_DIR="$FRONTEND_DIR/src"
PROFILE="gutkedu-terraform"

echo "===== Deploying frontend to S3 bucket: $BUCKET_NAME ($ENV environment) ====="

# Check if the frontend directory exists
if [ ! -d "$SRC_DIR" ]; then
  echo "Error: Frontend source directory '$SRC_DIR' not found!"
  exit 1
fi

# Upload files to S3 without ACLs
echo "Syncing files with S3 bucket..."
echo "SRC_DIR: $SRC_DIR"

# Use sync without the --acl flag
aws s3 sync "$SRC_DIR/" "s3://$BUCKET_NAME/" --delete --profile $PROFILE

# Set content types for specific files if needed
echo "Setting content types..."
aws s3 cp "s3://$BUCKET_NAME/app.mjs" "s3://$BUCKET_NAME/app.mjs" --content-type "application/javascript" --metadata-directive REPLACE --profile $PROFILE
aws s3 cp "s3://$BUCKET_NAME/style.css" "s3://$BUCKET_NAME/style.css" --content-type "text/css" --metadata-directive REPLACE --profile $PROFILE

echo "Deployment complete!"