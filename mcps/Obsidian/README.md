# Obsidian MCP Server

## Features

MCP server for a **single Obsidian vault**, built for the Karpathy LLM Wiki flow.

- **Sandboxed**: every path is resolved inside `VAULT_PATH`; traversal outside the vault is rejected.
- **`raw/` read-only**: `write_file` / `append_file` are denied anywhere under `raw/`, enforcing the immutable-sources rule in the vault's `AGENTS.md`. This closes the gap the generic `@modelcontextprotocol/server-filesystem` leaves open (it grants write everywhere).
- **Local stdio server**: runs on your machine, no network, minimal tokens.

| | This Server | Official filesystem MCP |
|---|---|---|
| **Scope** | one vault (`VAULT_PATH`) | any allowed dirs |
| **`raw/` protection** | enforced (read-only) | none |
| **Tools** | read/write/append/list/search | full FS |
| **Transport** | stdio | stdio |

## Prerequisites

- Node.js >= 18
- An Obsidian vault on this machine

`VAULT_PATH` is required — the server exits immediately without it.

```bash
# Setup environment
cp .env.example .env
# Add:
#   VAULT_PATH=/absolute/path/to/your/vault
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
claude mcp add obsidian --scope user -- npx --yes @teolin/mcp-obsidian
gemini mcp add obsidian npx --yes @teolin/mcp-obsidian
```

This server reads its config from environment variables. `npx` and global installs do not see
this folder's `.env`, so pass them on the command line:

```bash
claude mcp add obsidian --scope user --env VAULT_PATH=/absolute/path/to/your/vault -- npx --yes @teolin/mcp-obsidian
```

### npm install

Installed once, so startup is instant and works offline. You update it yourself with `npm update`.

```bash
# Global — available in every project (recommended)
npm install --global @teolin/mcp-obsidian
claude mcp add obsidian --scope user -- obsidian-mcp
gemini mcp add obsidian obsidian-mcp

# Local — pinned to one project, shared with your team through package.json
npm install @teolin/mcp-obsidian
claude mcp add obsidian --scope project -- node ./node_modules/@teolin/mcp-obsidian/src/index.js
```

### clone repo

Runs the source directly, so your edits take effect at the next restart. Needed for unpublished changes.

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/Obsidian
npm install
cp .env.example .env   # then fill it in — start-mcp.sh loads it for you
claude mcp add obsidian --scope user -- "$PWD/start-mcp.sh"
```

### Other agents

Same three methods apply — only the registration command changes. Each example below uses npx; for
**npm install** swap `npx --yes @teolin/mcp-obsidian` for `obsidian-mcp`, and for **clone repo** swap it for the absolute
path to `start-mcp.sh`.

**GitHub Copilot CLI** — `copilot mcp add`, or `/mcp add` inside a session, or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "obsidian": {
      "type": "local",
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-obsidian"],
      "env": { "VAULT_PATH": "/absolute/path/to/your/vault" },
      "tools": ["*"]
    }
  }
}
```

**OpenAI Codex CLI** — one command, or edit `~/.codex/config.toml`:

```bash
codex mcp add obsidian --env VAULT_PATH=/absolute/path/to/your/vault -- npx --yes @teolin/mcp-obsidian
```

```toml
[mcp_servers.obsidian]
command = "npx"
args = ["--yes", "@teolin/mcp-obsidian"]

[mcp_servers.obsidian.env]
VAULT_PATH = "/absolute/path/to/your/vault"
```

**Devin** — one command, or edit `.devin/mcp_config.json` (put secrets in the gitignored `.devin/mcp_config.local.json`):

```bash
devin mcp add obsidian -- npx --yes @teolin/mcp-obsidian
```

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-obsidian"],
      "env": { "VAULT_PATH": "/absolute/path/to/your/vault" }
    }
  }
}
```

**Goose** — `goose configure` → *Add Extension* → *Command-line Extension*, or edit `~/.config/goose/config.yaml`:

```yaml
extensions:
  obsidian:
    type: stdio
    name: obsidian
    enabled: true
    cmd: npx
    args: ["--yes", "@teolin/mcp-obsidian"]
    envs: { VAULT_PATH: "/absolute/path/to/your/vault" }
    timeout: 300
```

### Verify and remove

```bash
claude mcp list
gemini mcp list

claude mcp remove obsidian --scope user
gemini mcp remove obsidian
```

### Use with Claude Desktop

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

Restart Claude Desktop. `VAULT_PATH` comes from this directory's `.env`, so no path is duplicated in
the Desktop config. Because `raw/` is read-only at the server level, Desktop cannot mutate your
sources even though it is not governed by Claude Code's `.claude/settings.json`.

---

## Available Tools

| Tool | Args | Notes |
|------|------|-------|
| `read_file`   | `path` | UTF-8, vault-relative |
| `write_file`  | `path`, `content` | denied under `raw/`; makes parent dirs |
| `append_file` | `path`, `content` | denied under `raw/` (e.g. `wiki/log.md`) |
| `list_dir`    | `path?` | dirs get trailing `/`; default = vault root |
| `search`      | `query`, `path?`, `max_results?` | recursive regex; skips `node_modules`, `.git`, `.obsidian`, binaries |

## Usage Examples

### Example 1: Read a note
```javascript
// In Claude Desktop:
"Read wiki/index.md from my vault"
// Uses: read_file
```

### Example 2: Append to a log
```javascript
// In Claude Desktop:
"Append today's summary to wiki/log.md"
// Uses: append_file
```

### Example 3: Search the vault
```javascript
// In Claude Desktop:
"Find every note mentioning 'retrieval augmented'"
// Uses: search
```

## Note on Claude Code

Claude Code already has native file tools scoped to the working directory, so this server is mainly
for **Claude Desktop** (which otherwise has no vault access) and for enforcing `raw/` immutability
everywhere.
