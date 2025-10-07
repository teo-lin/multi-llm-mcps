import { spawn } from 'child_process';

console.log('🚀 Testing Kafdrop MCP Server\n');

const nvmDir = process.env.NVM_DIR || `${process.env.HOME}/.nvm`;
const nodePath = `${nvmDir}/versions/node/v24.9.0/bin/node`;

const mcp = spawn(nodePath, ['src/index.js']);

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
          console.log('✅ Initialize: Server connected');
          testResults.push('✅ Initialize');
        } else if (response.id === 2) {
          const tools = response.result?.tools || [];
          const toolNames = tools.map(t => t.name).join(', ');
          console.log(`✅ Available tools: ${toolNames}`);
          testResults.push('✅ Available tools');
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  });
});

mcp.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  if (msg.includes('Kafdrop MCP Server running')) {
    console.log('📡 MCP server started\n');
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

// Exit with summary
setTimeout(() => {
  console.log(`\n📊 Results: ${testResults.length}/2 tests passed`);
  mcp.kill();
  process.exit(testResults.length === 2 ? 0 : 1);
}, 1500);
