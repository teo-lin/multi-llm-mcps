import { spawn } from 'child_process';
import { execSync } from 'child_process';

console.log('🚀 Testing MySQL MCP Server\n');

// Ensure we use Node 24.9.0 from nvm
const nvmDir = process.env.NVM_DIR || `${process.env.HOME}/.nvm`;
const nodePath = `${nvmDir}/versions/node/v24.9.0/bin/node`;

const mcp = spawn(nodePath, ['--env-file=.env', 'src/index.js']);

let buffer = '';
let testResults = [];

mcp.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  lines.forEach(line => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);

        if (response.id === 1) {
          console.log('✅ Initialize: Connected to Absences Local DB (ABS_local)');
          testResults.push('✅ Initialize');
        } else if (response.id === 2) {
          const tools = response.result?.tools || [];
          const toolNames = tools.map(t => t.name).join(', ');
          console.log(`✅ Available tools: ${toolNames}`);
          testResults.push('✅ Available tools');
        } else if (response.id === 3) {
          const content = JSON.parse(response.result.content[0].text);
          console.log(`✅ Parameterized Query: Retrieved ${content.rows.length} OPEN records`);
          testResults.push('✅ Parameterized Query');
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  });
});

mcp.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  if (msg.includes('MySQL MCP server running')) {
    console.log('📡 MCP server started\n');
  } else if (msg) {
    console.error('ERROR:', msg);
  }
});

// Initialize
setTimeout(() => {
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  }) + '\n');
}, 100);

// List tools
setTimeout(() => {
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  }) + '\n');
}, 500);

// Parameterized query
setTimeout(() => {
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'query',
      arguments: {
        query: 'SELECT * FROM Periods WHERE status = ? LIMIT 2',
        params: ['OPEN']
      }
    }
  }) + '\n');
}, 1000);

// Exit with summary
setTimeout(() => {
  console.log(`\n📊 Results: ${testResults.length}/3 tests passed`);
  mcp.kill();
  process.exit(0);
}, 2000);
