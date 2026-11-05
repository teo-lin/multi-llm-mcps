#!/usr/bin/env node
// One MCP server for all agent sessions, over streamable HTTP. Started by scripts/share-servers.sh (launchd).
// Usage: node --env-file=<dir>/.env serve-http.js <dir>/src/index.js <port>
import http from "node:http"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"

const [modulePath, portArg] = process.argv.slice(2)
const port = Number(portArg)
if (!modulePath || !Number.isInteger(port)) {
  console.error("Usage: node serve-http.js <server module> <port>")
  process.exit(2)
}

const { createServer } = await import(pathToFileURL(path.resolve(modulePath)).href)
if (typeof createServer !== "function") {
  console.error(`${modulePath} does not export createServer()`)
  process.exit(2)
}

// Only local agents: a web page (other Host or Origin, DNS rebinding) is refused.
const hosts = [`127.0.0.1:${port}`, `localhost:${port}`]

const httpServer = http.createServer(async (req, res) => {
  if (new URL(req.url, "http://127.0.0.1").pathname !== "/mcp") return void res.writeHead(404).end()
  if (req.method !== "POST") return void res.writeHead(405, { Allow: "POST" }).end()

  // Stateless: a new server per request, so a restart loses no session and sessions never mix.
  const server = createServer()
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    enableDnsRebindingProtection: true,
    allowedHosts: hosts,
    allowedOrigins: hosts.map((host) => `http://${host}`),
  })
  res.on("close", () => {
    transport.close().catch(() => {})
    server.close().catch(() => {})
  })
  try {
    await server.connect(transport)
    await transport.handleRequest(req, res)
  } catch (error) {
    console.error("[serve-http]", error)
    if (!res.headersSent) res.writeHead(500).end()
  }
})

httpServer.listen(port, "127.0.0.1", () => {
  console.error(`${modulePath} on http://127.0.0.1:${port}/mcp`)
})

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    httpServer.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 3000).unref()
  })
}
