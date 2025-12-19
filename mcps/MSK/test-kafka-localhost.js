#!/usr/bin/env node

// Test Kafka connection via SSM port forwarding
//
// Make sure to run test-ssm-tunnel.sh FIRST in another terminal
// Then run this script to test the connection

import { Kafka } from 'kafkajs';

console.log('🔌 Testing Kafka connection via SSM tunnel...');
console.log('');
console.log('Connecting to: localhost:9094');
console.log('(tunneled to MSK broker via bastion)');
console.log('');

const kafka = new Kafka({
  clientId: 'msk-mcp-ssm-test',
  brokers: ['localhost:9094'],  // Connect to local port (forwarded by SSM)
  ssl: true,
  connectionTimeout: 15000,
  requestTimeout: 15000
});

try {
  const admin = kafka.admin();
  console.log('Connecting...');
  await admin.connect();
  console.log('✅ Connected successfully!');
  console.log('');

  console.log('📋 Fetching topics...');
  const topics = await admin.listTopics();
  console.log('✅ Found', topics.length, 'topics');
  console.log('');
  console.log('Topics:');
  topics.slice(0, 15).forEach(topic => console.log('  -', topic));
  if (topics.length > 15) console.log('  ... and', topics.length - 15, 'more');

  await admin.disconnect();
  console.log('');
  console.log('🎉 SUCCESS! SSM port forwarding is working!');
  console.log('');
  console.log('Next: Update .env to use localhost:9094 when tunnel is active');
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('');
  console.error('Troubleshooting:');
  console.error('1. Make sure test-ssm-tunnel.sh is running in another terminal');
  console.error('2. Check that session-manager-plugin is installed');
  console.error('3. Verify bastion has SSM agent and IAM role');
  console.error('4. Check bastion security group allows outbound to MSK:9094');
  process.exit(1);
}
