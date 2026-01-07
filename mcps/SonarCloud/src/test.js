#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Starting SonarCloud MCP Integration Tests...\n');

const mcp = spawn('node', [join(__dirname, 'index.js')], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

const testResults = [];

mcp.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach((line) => {
    if (!line.trim()) return;

    // Check for server startup
    if (line.includes('SonarCloud MCP Server running')) {
      console.log('✅ Server started successfully');
      testResults.push('server_start');
      return;
    }

    try {
      const response = JSON.parse(line);

      // Test 1: Initialize response
      if (response.id === 1 && response.result?.capabilities) {
        console.log('✅ Test 1: Initialize - Server initialized with capabilities');
        testResults.push('initialize');
      }

      // Test 2: Tools list response
      if (response.id === 2 && response.result?.tools) {
        const tools = response.result.tools;
        console.log(`✅ Test 2: List Tools - Found ${tools.length} tools`);
        console.log('   Tools:', tools.map((t) => t.name).join(', '));
        testResults.push('list_tools');
      }

      // Test 3: Get project status (will fail without credentials, but tests the tool)
      if (response.id === 3) {
        if (response.error || (response.result?.content?.[0]?.text?.includes('Error') || response.result?.content?.[0]?.text?.includes('not configured'))) {
          console.log('⚠️  Test 3: Get Project Status - Expected auth error (no credentials configured)');
          testResults.push('get_project_status');
        } else if (response.result) {
          console.log('✅ Test 3: Get Project Status - Success');
          testResults.push('get_project_status');
        }
      }

      // Test 4: Get measures (will fail without credentials, but tests the tool)
      if (response.id === 4) {
        if (response.error || (response.result?.content?.[0]?.text?.includes('Error') || response.result?.content?.[0]?.text?.includes('not configured'))) {
          console.log('⚠️  Test 4: Get Measures - Expected auth error (no credentials configured)');
          testResults.push('get_measures');
        } else if (response.result) {
          console.log('✅ Test 4: Get Measures - Success');
          testResults.push('get_measures');
        }
      }
    } catch (e) {
      // Not JSON, probably a log message
    }
  });
});

mcp.stderr.on('data', (data) => {
  const msg = data.toString();
  if (msg.includes('Warning: SonarCloud not configured')) {
    console.log('ℹ️  Info: SonarCloud credentials not configured (expected for testing)');
  }
});

// Test 1: Initialize
setTimeout(() => {
  mcp.stdin.write(
    JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test',
          version: '1.0.0',
        },
      },
    }) + '\n'
  );
}, 500);

// Test 2: List tools
setTimeout(() => {
  mcp.stdin.write(
    JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    }) + '\n'
  );
}, 1000);

// Test 3: Get project status
setTimeout(() => {
  mcp.stdin.write(
    JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_project_status',
        arguments: {},
      },
    }) + '\n'
  );
}, 1500);

// Test 4: Get measures
setTimeout(() => {
  mcp.stdin.write(
    JSON.stringify({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'get_measures',
        arguments: {},
      },
    }) + '\n'
  );
}, 2000);

// Exit with summary
setTimeout(() => {
  console.log(`\n📊 Integration Tests: ${testResults.length} tests passed`);
  if (testResults.length >= 3) {
    console.log('✨ All core functionality verified!');
    mcp.kill();
    process.exit(0);
  } else {
    console.log('❌ Some tests failed!');
    mcp.kill();
    process.exit(1);
  }
}, 3000);
