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

## Setup

Four ways to run this server. Pick one:

| Setup            | What it does                                   | Use it when                                | How to                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| _none (npx)_     | Downloads and runs on demand, nothing kept     | Trying it out, or always want latest       |                                                   |
| _global (npm)_   | Installs once, runs from disk, offline         | Fastest start, works offline, all projects | `npm install --global @teolin/mcp-onyx`                     |
| _local (npm)_    | Install per project / repository, runs offline | Fast, offline, Project/team specific       | `npm install @teolin/mcp-onyx`                              |
| _custom (clone)_ | Runs your own source copy                      | You want to change the server code         | `git clone https://github.com/teo-lin/multi-llm-mcps.git && cd multi-llm-mcps && npm run setup` |

### Usage

Once installed, the server must be registered with your preferred agent(s), so the agent(s) can use it. Pick the relevant one(s) for you.

```bash
# no setup (npx):
claude mcp add onyx --scope user -- npx --yes @teolin/mcp-onyx
gemini mcp add onyx npx --yes @teolin/mcp-onyx
codex  mcp add onyx -- npx --yes @teolin/mcp-onyx
devin  mcp add onyx --scope user -- npx --yes @teolin/mcp-onyx

# global setup (npm --global): same commands, with the binary instead of npx
claude mcp add onyx --scope user -- onyx-mcp
gemini mcp add onyx onyx-mcp
codex  mcp add onyx -- onyx-mcp
devin  mcp add onyx --scope user -- onyx-mcp

# local setup (npm, one project): point at the installed file
claude mcp add onyx --scope project -- node ./node_modules/@teolin/mcp-onyx/src/index.js

# custom (clone): register every server in this repo, from the repo root
bash scripts/register-all.sh
# or register just this one, from mcps/Onyx:
claude mcp add onyx --scope user -- "$PWD/start-mcp.sh"
gemini mcp add onyx --scope user "$PWD/start-mcp.sh"
codex  mcp add onyx -- "$PWD/start-mcp.sh"
devin  mcp add onyx --scope user -- "$PWD/start-mcp.sh"
```

`npx` and global installs do not read this folder's `.env` — pass config on the command line:

```bash
claude mcp add onyx --scope user --env ONYX_BASE_URL=http://localhost:3210 -- npx --yes @teolin/mcp-onyx
gemini mcp add onyx --scope user -e ONYX_BASE_URL=http://localhost:3210 npx --yes @teolin/mcp-onyx
codex  mcp add onyx --env ONYX_BASE_URL=http://localhost:3210 -- npx --yes @teolin/mcp-onyx
devin  mcp add onyx --scope user -e ONYX_BASE_URL=http://localhost:3210 -- npx --yes @teolin/mcp-onyx
```

The clone setup needs none of this: `start-mcp.sh` loads `.env` for you.

### Verify and remove

```bash
claude mcp list
gemini mcp list
codex  mcp list
devin  mcp list

claude mcp remove onyx --scope user
gemini mcp remove onyx --scope user
codex  mcp remove onyx
devin  mcp remove onyx --scope user
```

`claude mcp get onyx`, `codex mcp get onyx` and `devin mcp get onyx` show one server in
detail. `devin` removes from `local` scope unless you pass `--scope`, so remove from the same scope
you added to.

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
