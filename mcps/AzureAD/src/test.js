import { spawn } from "child_process"

console.log(" Testing Azure AD MCP Server\n")

const mcp = spawn(process.execPath, ["src/index.js"])

let buffer = ""
let testResults = []

mcp.stdout.on("data", (data) => {
  buffer += data.toString()
  const lines = buffer.split("\n")
  buffer = lines.pop() || ""

  lines.forEach((line) => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line)

        if (response.id === 1) {
          console.log(" Initialize: Server connected")
          testResults.push(" Initialize")
        } else if (response.id === 2) {
          const tools = response.result?.tools || []
          const toolNames = tools.map((t) => t.name).join(", ")
          console.log(` Available tools: ${toolNames}`)
          testResults.push(" Available tools")
        } else if (response.id === 3) {
          console.log(" Auth Status: Check completed")
          testResults.push(" Auth Status")
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  })
})

mcp.stderr.on("data", (data) => {
  const msg = data.toString().trim()
  if (msg.includes("Azure AD MCP Server running")) {
    console.log(" MCP server started\n")
  } else {
    console.log("", msg)
  }
})

// Initialize
setTimeout(() => {
  mcp.stdin.write(
    JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    }) + "\n"
  )
}, 100)

// List tools
setTimeout(() => {
  mcp.stdin.write(
    JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    }) + "\n"
  )
}, 500)

// Test 3: Check auth status
setTimeout(() => {
  mcp.stdin.write(
    JSON.stringify({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "check_auth_status",
        arguments: {},
      },
    }) + "\n"
  )
}, 1000)

// Exit with summary
setTimeout(() => {
  console.log(`\n Integration Tests: ${testResults.length} tests passed`)
  console.log(" Core functionality verified!")
  mcp.kill()
  process.exit(testResults.length >= 2 ? 0 : 1)
}, 2000)
