#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { promises as fs } from "node:fs"
import path from "node:path"
import { tools } from "./tools.js"

const SKIP_DIRS = new Set(["node_modules", ".git", ".obsidian"])
const IGNORE_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip", ".mp4", ".mov", ".webp",
])

class ObsidianMCPServer {
  constructor() {
    const vault = process.env.VAULT_PATH
    if (!vault) {
      console.error("VAULT_PATH is not set (define it in .env)")
      process.exit(1)
    }
    this.vaultPath = path.resolve(vault)

    this.server = new Server(
      { name: "obsidian-mcp-server", version: "1.0.0" },
      { capabilities: { tools: {} } }
    )

    this.setupHandlers()
    this.setupErrorHandling()
  }

  setupErrorHandling() {
    this.server.onerror = (error) => console.error("[MCP Error]", error)
    process.on("SIGINT", () => process.exit(0))
  }

  // Resolve a vault-relative path and guarantee it stays inside the vault root.
  resolvePath(rel) {
    if (typeof rel !== "string") throw new Error("`path` must be a string")
    const abs = path.resolve(this.vaultPath, rel)
    if (abs !== this.vaultPath && !abs.startsWith(this.vaultPath + path.sep)) {
      throw new Error(`Path escapes the vault root: ${rel}`)
    }
    return abs
  }

  // Reject writes/appends to the immutable raw/ layer.
  assertWritable(rel) {
    const norm = path.normalize(rel).replace(/^(\.\/)+/, "")
    if (norm === "raw" || norm.startsWith("raw" + path.sep)) {
      throw new Error("raw/ is read-only (immutable sources) — writes are denied there")
    }
  }

  async readFile(rel) {
    return fs.readFile(this.resolvePath(rel), "utf-8")
  }

  async writeFile(rel, content) {
    this.assertWritable(rel)
    const abs = this.resolvePath(rel)
    await fs.mkdir(path.dirname(abs), { recursive: true })
    await fs.writeFile(abs, content, "utf-8")
    return `Wrote ${Buffer.byteLength(content, "utf-8")} bytes to ${rel}`
  }

  async appendFile(rel, content) {
    this.assertWritable(rel)
    const abs = this.resolvePath(rel)
    await fs.mkdir(path.dirname(abs), { recursive: true })
    await fs.appendFile(abs, content, "utf-8")
    return `Appended ${Buffer.byteLength(content, "utf-8")} bytes to ${rel}`
  }

  async listDir(rel = ".") {
    const abs = this.resolvePath(rel)
    const entries = await fs.readdir(abs, { withFileTypes: true })
    return entries
      .map((e) => (e.isDirectory() ? e.name + "/" : e.name))
      .sort()
  }

  async search(query, rel = ".", maxResults = 200) {
    const root = this.resolvePath(rel)
    const re = new RegExp(query, "i")
    const results = []

    const walk = async (dir) => {
      if (results.length >= maxResults) return
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const e of entries) {
        if (results.length >= maxResults) return
        if (e.isDirectory()) {
          if (SKIP_DIRS.has(e.name)) continue
          await walk(path.join(dir, e.name))
        } else {
          if (IGNORE_EXT.has(path.extname(e.name).toLowerCase())) continue
          const abs = path.join(dir, e.name)
          let text
          try {
            text = await fs.readFile(abs, "utf-8")
          } catch {
            continue
          }
          const relPath = path.relative(this.vaultPath, abs)
          const lines = text.split("\n")
          for (let i = 0; i < lines.length; i++) {
            if (re.test(lines[i])) {
              results.push(`${relPath}:${i + 1}: ${lines[i].trim()}`)
              if (results.length >= maxResults) break
            }
          }
        }
      }
    }

    await walk(root)
    return results
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }))

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params
        let payload

        switch (name) {
          case "read_file":
            if (!args?.path) throw new Error("`read_file` requires `path`")
            payload = await this.readFile(args.path)
            break

          case "write_file":
            if (!args?.path) throw new Error("`write_file` requires `path`")
            payload = await this.writeFile(args.path, args.content ?? "")
            break

          case "append_file":
            if (!args?.path) throw new Error("`append_file` requires `path`")
            payload = await this.appendFile(args.path, args.content ?? "")
            break

          case "list_dir":
            payload = (await this.listDir(args?.path ?? ".")).join("\n")
            break

          case "search": {
            if (!args?.query) throw new Error("`search` requires `query`")
            const hits = await this.search(args.query, args.path ?? ".", args.max_results ?? 200)
            payload = hits.length ? hits.join("\n") : "(no matches)"
            break
          }

          default:
            throw new Error(`Unknown tool: ${name}`)
        }

        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.Obsidian: ${name} ••••••••••••\n${payload}`,
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        }
      }
    })
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error(`Obsidian MCP server running on stdio (vault: ${this.vaultPath})`)
  }
}

const server = new ObsidianMCPServer()
server.run().catch(console.error)
