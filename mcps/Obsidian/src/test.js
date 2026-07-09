import { spawn } from "child_process"
import { promises as fs } from "node:fs"
import path from "node:path"

console.log(" Testing Obsidian MCP Server\n")

const TEST_FILE = "wiki/.mcp-selftest.md"
const TEST_BODY = "selftest content\n"

const mcp = spawn(process.execPath, ["--env-file=.env", "src/index.js"])

let buffer = ""
const passed = []

function send(id, method, params) {
  mcp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
}

mcp.stdout.on("data", (data) => {
  buffer += data.toString()
  const lines = buffer.split("\n")
  buffer = lines.pop() || ""

  for (const line of lines) {
    if (!line.trim()) continue
    let r
    try {
      r = JSON.parse(line)
    } catch {
      continue
    }
    const text = r.result?.content?.[0]?.text ?? ""
    const isError = r.result?.isError === true

    if (r.id === 1) {
      console.log(" Initialize: connected")
      passed.push("initialize")
    } else if (r.id === 2) {
      const names = (r.result?.tools || []).map((t) => t.name)
      console.log(` Tools: ${names.join(", ")}`)
      if (names.length === 5) passed.push("tools/list")
    } else if (r.id === 3) {
      if (text.includes("wiki/") && text.includes("raw/")) {
        console.log(" list_dir: root shows wiki/ + raw/")
        passed.push("list_dir")
      }
    } else if (r.id === 4) {
      if (!isError && text.includes("Wrote")) {
        console.log(" write_file: wrote wiki/ file")
        passed.push("write_file")
      }
    } else if (r.id === 5) {
      if (text.includes("selftest content")) {
        console.log(" read_file: content round-trips")
        passed.push("read_file")
      }
    } else if (r.id === 6) {
      if (isError && /read-only/.test(text)) {
        console.log(" write_file raw/ DENIED (raw is immutable)")
        passed.push("raw-denied")
      } else {
        console.error(" SECURITY FAIL: write to raw/ was allowed")
      }
    } else if (r.id === 7) {
      if (isError && /escapes/.test(text)) {
        console.log(" path traversal DENIED")
        passed.push("escape-denied")
      } else {
        console.error(" SECURITY FAIL: path traversal was allowed")
      }
    }
  }
})

mcp.stderr.on("data", (data) => {
  const msg = data.toString().trim()
  if (msg.includes("Obsidian MCP server running")) console.log(" MCP server started\n")
  else if (msg) console.error("ERROR:", msg)
})

setTimeout(() => send(1, "initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "test-client", version: "1.0.0" },
}), 100)
setTimeout(() => send(2, "tools/list", {}), 400)
setTimeout(() => send(3, "tools/call", { name: "list_dir", arguments: { path: "." } }), 700)
setTimeout(() => send(4, "tools/call", { name: "write_file", arguments: { path: TEST_FILE, content: TEST_BODY } }), 1000)
setTimeout(() => send(5, "tools/call", { name: "read_file", arguments: { path: TEST_FILE } }), 1300)
setTimeout(() => send(6, "tools/call", { name: "write_file", arguments: { path: "raw/should-fail.md", content: "x" } }), 1600)
setTimeout(() => send(7, "tools/call", { name: "read_file", arguments: { path: "../../../etc/hosts" } }), 1900)

setTimeout(async () => {
  // Clean up the self-test file
  try {
    await fs.unlink(path.resolve(process.env.VAULT_PATH, TEST_FILE))
  } catch {}

  const expected = ["initialize", "tools/list", "list_dir", "write_file", "read_file", "raw-denied", "escape-denied"]
  const ok = expected.every((t) => passed.includes(t))
  console.log(`\n Integration Tests: ${passed.length}/${expected.length} passed`)
  mcp.kill()
  if (ok) {
    console.log(" All functionality + security guards verified!")
    process.exit(0)
  } else {
    console.log(` Missing: ${expected.filter((t) => !passed.includes(t)).join(", ")}`)
    process.exit(1)
  }
}, 2600)
