# Obsidian MCP Server

## Features

Model Context Protocol server for a **single Obsidian vault**, built for the Karpathy LLM Wiki flow.

- **Sandboxed**: every path is resolved inside `VAULT_PATH`; traversal outside the vault is rejected.
- **`raw/` read-only**: `write_file` / `append_file` are denied anywhere under `raw/`, enforcing the immutable-sources rule in the vault's `AGENTS.md`. This closes the gap the generic `@modelcontextprotocol/server-filesystem` leaves open (it grants write everywhere).
- **Local stdio server**: runs on your machine, no network, minimal tokens.

| | This Server | Official filesystem MCP |
|---|---|---|
| **Scope** | one vault (`VAULT_PATH`) | any allowed dirs |
| **`raw/` protection** | enforced (read-only) | none |
| **Tools** | read/write/append/list/search | full FS |
| **Transport** | stdio | stdio |

## Tools

| Tool | Args | Notes |
|------|------|-------|
| `read_file`   | `path` | UTF-8, vault-relative |
| `write_file`  | `path`, `content` | denied under `raw/`; makes parent dirs |
| `append_file` | `path`, `content` | denied under `raw/` (e.g. `wiki/log.md`) |
| `list_dir`    | `path?` | dirs get trailing `/`; default = vault root |
| `search`      | `query`, `path?`, `max_results?` | recursive regex; skips `node_modules`, `.git`, `.obsidian`, binaries |

## Prerequisites

- Node.js >= 18

## Setup

```bash
cd "path/to/mcps/Obsidian"
cp .env.example .env          # then edit VAULT_PATH to your vault's absolute path
./setup-mcp.sh                # installs deps, registers with Claude Code, runs tests
```

Or manually:

```bash
npm install
npm test
npm start                     # runs the server on stdio
```

## Configuration

`.env`:

```
VAULT_PATH=/absolute/path/to/your/vault
```

## Use with Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "/absolute/path/to/mcps/Obsidian/start-mcp.sh"
    }
  }
}
```

Restart Claude Desktop. `VAULT_PATH` comes from this directory's `.env`, so no path is duplicated in the Desktop config. Because `raw/` is read-only at the server level, Desktop cannot mutate your sources even though it's not governed by Claude Code's `.claude/settings.json`.

## Use with Claude Code

`setup-mcp.sh` registers it via `claude mcp add`. Note: Claude Code already has native file tools scoped to the working directory, so this server is primarily for **Claude Desktop** (which otherwise has no vault access) and for enforcing `raw/` immutability everywhere.
