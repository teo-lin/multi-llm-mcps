#!/bin/bash

# Test MSK access via SSM port forwarding
#
# Usage:
# 1. In Terminal 1: Run this script (it will start the SSM tunnel)
# 2. In Terminal 2: Test Kafka connection
#
# Terminal 1:
# ./test-ssm-tunnel.sh
#
# Terminal 2:
# cd <repo>/mcps/MSK
# node test-kafka-localhost.js

echo " Starting SSM port forwarding to MSK broker..."
echo ""
echo "This will forward localhost:9094 → Bastion → MSK broker b-1:9094"
echo ""
echo "Keep this terminal open. Press Ctrl+C to stop."
echo ""

aws ssm start-session \
  --profile your-profile \
  --region your-region \
  --target i-xxxxxxxxxxxxxxxxx \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{
    "host":["b-1.your-cluster.xxxxxx.cX.kafka.your-region.amazonaws.com"],
    "portNumber":["9094"],
    "localPortNumber":["9094"]
  }'
