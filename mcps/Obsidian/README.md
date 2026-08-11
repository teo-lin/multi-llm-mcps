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

## Setup

Four ways to run this server. Pick one:

| Setup            | What it does                                   | Use it when                                | How to                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| _none (npx)_     | Downloads and runs on demand, nothing kept     | Trying it out, or always want latest       |                                                   |
| _global (npm)_   | Installs once, runs from disk, offline         | Fastest start, works offline, all projects | `npm install --global @teolin/mcp-obsidian`                     |
| _local (npm)_    | Install per project / repository, runs offline | Fast, offline, Project/team specific       | `npm install @teolin/mcp-obsidian`                              |
| _custom (clone)_ | Runs your own source copy                      | You want to change the server code         | `git clone https://github.com/teo-lin/multi-llm-mcps.git && cd multi-llm-mcps && npm run setup` |

### Usage

Once installed, the server must be registered with your preferred agent(s), so the agent(s) can use it. Pick the relevant one(s) for you.

```bash
# no setup (npx):
claude mcp add obsidian --scope user -- npx --yes @teolin/mcp-obsidian
gemini mcp add obsidian npx --yes @teolin/mcp-obsidian
codex  mcp add obsidian -- npx --yes @teolin/mcp-obsidian
devin  mcp add obsidian --scope user -- npx --yes @teolin/mcp-obsidian

# global setup (npm --global): same commands, with the binary instead of npx
claude mcp add obsidian --scope user -- obsidian-mcp
gemini mcp add obsidian obsidian-mcp
codex  mcp add obsidian -- obsidian-mcp
devin  mcp add obsidian --scope user -- obsidian-mcp

# local setup (npm, one project): point at the installed file
claude mcp add obsidian --scope project -- node ./node_modules/@teolin/mcp-obsidian/src/index.js

# custom (clone): register every server in this repo, from the repo root
bash scripts/register-all.sh
# or register just this one, from mcps/Obsidian:
claude mcp add obsidian --scope user -- "$PWD/start-mcp.sh"
gemini mcp add obsidian --scope user "$PWD/start-mcp.sh"
codex  mcp add obsidian -- "$PWD/start-mcp.sh"
devin  mcp add obsidian --scope user -- "$PWD/start-mcp.sh"
```

`npx` and global installs do not read this folder's `.env` — pass config on the command line:

```bash
claude mcp add obsidian --scope user --env VAULT_PATH=/absolute/path/to/your/vault -- npx --yes @teolin/mcp-obsidian
gemini mcp add obsidian --scope user -e VAULT_PATH=/absolute/path/to/your/vault npx --yes @teolin/mcp-obsidian
codex  mcp add obsidian --env VAULT_PATH=/absolute/path/to/your/vault -- npx --yes @teolin/mcp-obsidian
devin  mcp add obsidian --scope user -e VAULT_PATH=/absolute/path/to/your/vault -- npx --yes @teolin/mcp-obsidian
```

The clone setup needs none of this: `start-mcp.sh` loads `.env` for you.

### Verify and remove

```bash
claude mcp list
gemini mcp list
codex  mcp list
devin  mcp list

claude mcp remove obsidian --scope user
gemini mcp remove obsidian --scope user
codex  mcp remove obsidian
devin  mcp remove obsidian --scope user
```

`claude mcp get obsidian`, `codex mcp get obsidian` and `devin mcp get obsidian` show one server in
detail. `devin` removes from `local` scope unless you pass `--scope`, so remove from the same scope
you added to.

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
