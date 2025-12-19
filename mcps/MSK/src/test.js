import { spawn } from 'child_process';

console.log('🚀 Testing MSK MCP Server\n');

const mcp = spawn(process.execPath, ['src/index.js']);

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
          const expectedTools = [
            'list_clusters',
            'get_cluster_details',
            'list_topics',
            'get_topic_metadata',
            'browse_messages',
            'search_messages',
            'list_protobuf_types'
          ];
          const toolNames = tools.map(t => t.name);

          console.log(`✅ Available tools (${tools.length}): ${toolNames.join(', ')}`);

          const allPresent = expectedTools.every(t => toolNames.includes(t));
          if (allPresent) {
            testResults.push('✅ All tools available');
          } else {
            const missing = expectedTools.filter(t => !toolNames.includes(t));
            console.log(`❌ Missing tools: ${missing.join(', ')}`);
          }
        } else if (response.id === 3) {
          const result = response.result;
          if (result && result.content) {
            const text = result.content[0]?.text || '';
            if (text.includes('list_protobuf_types') && text.includes('UserAvailabilityException')) {
              console.log('✅ Protobuf types available');
              testResults.push('✅ Protobuf decoder');
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  });
});

mcp.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  if (msg.includes('MSK MCP Server running')) {
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

// Test protobuf types
setTimeout(() => {
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'list_protobuf_types',
      arguments: {}
    }
  }) + '\n');
}, 1000);

// Exit with summary
setTimeout(() => {
  console.log(`\n📊 Results: ${testResults.length}/3 tests passed`);
  mcp.kill();
  process.exit(testResults.length === 3 ? 0 : 1);
}, 2000);
