# Onyx MCP Server

## Features

MCP server that exposes a self-hosted [Onyx](https://onyx.app) knowledge base to MCP clients.

Onyx does the indexing and retrieval over your connected sources (Jira, Confluence, GitHub, web
pages, uploaded files). This server lets your existing LLM search that knowledge base, so you do not
need to wire any LLM into Onyx itself.

- **Keyword search** across every indexed document, with snippet, source, link and score
- **Source filter** — `confluence`, `jira`, `github`, `web` or `file`
- **Session auth** — logs in like the web UI, so no paid API key is needed

> Retrieval is **lexical/keyword** (Onyx's `/api/admin/search`), not semantic. Semantic search and
> the `chat` API require an LLM provider configured inside Onyx, which needs an Onyx API key
> (Business plan) or a local model.

## Prerequisites

- Node.js >= 18
- A reachable Onyx instance, and an account on it

Onyx API keys are gated behind the Business plan, so this server authenticates like the web UI: it
logs in with `ONYX_EMAIL` / `ONYX_PASSWORD`, caches the session cookie, and logs in again on expiry.

```bash
# Setup environment
cp .env.example .env
# Add:
#   ONYX_BASE_URL=http://localhost:3210
#   ONYX_EMAIL=you@example.com
#   ONYX_PASSWORD=your-onyx-password
```

## Setup and Usage

Three ways to run this server. Pick one — they all end with the same MCP registered in your agent.

| Method         | What it does                              | Use it when                            |
| -------------- | ----------------------------------------- | -------------------------------------- |
| **npx**        | Downloads and runs on demand, nothing kept | Trying it out, or always want latest    |
| **npm install**| Installs once, runs from disk              | Daily use — fastest start, works offline |
| **clone repo** | Runs your own source copy                  | You want to change the server code       |

### npx

No install. npx fetches the package on first run and caches it, so the first start is slower.

```bash
claude mcp add onyx --scope user -- npx --yes @teolin/mcp-onyx
gemini mcp add onyx npx --yes @teolin/mcp-onyx
```

This server reads its config from environment variables. `npx` and global installs do not see
this folder's `.env`, so pass them on the command line:

```bash
claude mcp add onyx --scope user --env ONYX_BASE_URL=http://localhost:3210 -- npx --yes @teolin/mcp-onyx
```

### npm install

Installed once, so startup is instant and works offline. You update it yourself with `npm update`.

```bash
# Global — available in every project (recommended)
npm install --global @teolin/mcp-onyx
claude mcp add onyx --scope user -- onyx-mcp
gemini mcp add onyx onyx-mcp

# Local — pinned to one project, shared with your team through package.json
npm install @teolin/mcp-onyx
claude mcp add onyx --scope project -- node ./node_modules/@teolin/mcp-onyx/src/index.js
```

### clone repo

Runs the source directly, so your edits take effect at the next restart. Needed for unpublished changes.

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/Onyx
npm install
cp .env.example .env   # then fill it in — start-mcp.sh loads it for you
claude mcp add onyx --scope user -- "$PWD/start-mcp.sh"
```

### Other agents

Same three methods apply — only the registration command changes. Each example below uses npx; for
**npm install** swap `npx --yes @teolin/mcp-onyx` for `onyx-mcp`, and for **clone repo** swap it for the absolute
path to `start-mcp.sh`.

**GitHub Copilot CLI** — `copilot mcp add`, or `/mcp add` inside a session, or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "onyx": {
      "type": "local",
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-onyx"],
      "env": { "ONYX_BASE_URL": "http://localhost:3210" },
      "tools": ["*"]
    }
  }
}
```

**OpenAI Codex CLI** — one command, or edit `~/.codex/config.toml`:

```bash
codex mcp add onyx --env ONYX_BASE_URL=http://localhost:3210 -- npx --yes @teolin/mcp-onyx
```

```toml
[mcp_servers.onyx]
command = "npx"
args = ["--yes", "@teolin/mcp-onyx"]

[mcp_servers.onyx.env]
ONYX_BASE_URL = "http://localhost:3210"
```

**Devin** — one command, or edit `.devin/mcp_config.json` (put secrets in the gitignored `.devin/mcp_config.local.json`):

```bash
devin mcp add onyx -- npx --yes @teolin/mcp-onyx
```

```json
{
  "mcpServers": {
    "onyx": {
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-onyx"],
      "env": { "ONYX_BASE_URL": "http://localhost:3210" }
    }
  }
}
```

**Goose** — `goose configure` → *Add Extension* → *Command-line Extension*, or edit `~/.config/goose/config.yaml`:

```yaml
extensions:
  onyx:
    type: stdio
    name: onyx
    enabled: true
    cmd: npx
    args: ["--yes", "@teolin/mcp-onyx"]
    envs: { ONYX_BASE_URL: "http://localhost:3210" }
    timeout: 300
```

### Verify and remove

```bash
claude mcp list
gemini mcp list

claude mcp remove onyx --scope user
gemini mcp remove onyx
```

---

## Available Tools

### 1. search_onyx
Keyword search across all indexed documents. Returns the top matching documents with a snippet,
source, link and score. Parameters: `query` (required), `source_type` (optional:
`confluence` | `jira` | `github` | `web` | `file`).

## Usage Examples

### Example 1: Search everything
```javascript
// In Claude Code:
"Search our knowledge base for the absence approval flow"
// Uses: search_onyx
```

### Example 2: Search one source
```javascript
// In Claude Code:
"Find Confluence pages about the release checklist"
// Uses: search_onyx with source_type=confluence
```
