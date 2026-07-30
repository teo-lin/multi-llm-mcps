# Onyx MCP

Model Context Protocol server that exposes a self-hosted [Onyx](https://onyx.app)
knowledge base to MCP clients (Claude Code, Claude Desktop, …).

Onyx does the indexing + retrieval over your connected sources (Jira, Confluence,
GitHub, web pages, uploaded files). This server lets your existing LLM (e.g.
Claude Code) **search that knowledge base** — so you don't need to wire any LLM
into Onyx itself.

## Tools

- **`search_onyx`** — keyword search across all indexed documents. Returns the
  top matching documents with a snippet, source, link and score.
  Optional `source_type` filter (`confluence` | `jira` | `github` | `web` | `file`).

> Retrieval is **lexical/keyword** (Onyx's `/api/admin/search`), not semantic.
> Semantic search and the `chat` API require an LLM provider configured inside
> Onyx, which in turn needs an Onyx API key (Business plan) or a local model.

## Auth

Onyx API keys are gated behind the Business plan, so this server authenticates
like the web UI: it logs in with `ONYX_EMAIL` / `ONYX_PASSWORD` to get a session
cookie, caches it, and re-logs-in automatically on expiry.

## Setup

```bash
npm install
cp .env.example .env   # then edit
npm test               # smoke test: prints search results
```

`.env`:

```
ONYX_BASE_URL=http://localhost:3210
ONYX_EMAIL=you@example.com
ONYX_PASSWORD=your-onyx-password
```

## Register in Claude Code

Add to the `mcpServers` block of `~/.cc/.claude.json` (or `~/.claude.json`):

```json
"onyx": {
  "type": "stdio",
  "command": "/Users/teolin/.mcp/mcps/Onyx/start-mcp.sh",
  "args": [],
  "env": {}
}
```

Restart Claude Code; the `search_onyx` tool then appears as `mcp__onyx__search_onyx`.
