# SonarCloud MCP Server

## Features

Model Context Protocol (MCP) server for SonarCloud and SonarQube integration. Provides comprehensive code quality analysis, issue management, and security hotspot detection.

- **Quality Gate Status**: Check if your project passes quality gates
- **Issue Management**: List and analyze bugs, vulnerabilities, and code smells
- **Security Hotspots**: Identify and review security-sensitive code
- **Project Metrics**: Get coverage, duplication, and quality metrics
- **File Browser**: Navigate project structure
- **Source Code Access**: Read source code with issue context
- **Rule Details**: Understand what each rule checks and how to fix it

## Prerequisites

- Node.js >=18.0.0
- SonarCloud or SonarQube instance with API access

```bash
# Setup environment
cp .env.example .env

# For SonarCloud:
# Add:
#   SONAR_HOST_URL=https://sonarcloud.io
#   SONAR_TOKEN=your_token
#   SONAR_ORGANIZATION=your_org_key
#   SONAR_PROJECT_KEY=your_project_key

# For self-hosted SonarQube:
# Add:
#   SONAR_HOST_URL=https://your-sonarqube-instance.com
#   SONAR_TOKEN=your_token
#   SONAR_PROJECT_KEY=your_project_key
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
claude mcp add sonarcloud --scope user -- npx --yes @teolin/mcp-sonarcloud
gemini mcp add sonarcloud npx --yes @teolin/mcp-sonarcloud
```

This server reads its config from environment variables. `npx` and global installs do not see
this folder's `.env`, so pass them on the command line:

```bash
claude mcp add sonarcloud --scope user --env SONAR_TOKEN=your-token -- npx --yes @teolin/mcp-sonarcloud
```

### npm install

Installed once, so startup is instant and works offline. You update it yourself with `npm update`.

```bash
# Global — available in every project (recommended)
npm install --global @teolin/mcp-sonarcloud
claude mcp add sonarcloud --scope user -- sonarcloud-mcp
gemini mcp add sonarcloud sonarcloud-mcp

# Local — pinned to one project, shared with your team through package.json
npm install @teolin/mcp-sonarcloud
claude mcp add sonarcloud --scope project -- node ./node_modules/@teolin/mcp-sonarcloud/src/index.js
```

### clone repo

Runs the source directly, so your edits take effect at the next restart. Needed for unpublished changes.

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/SonarCloud
npm install
cp .env.example .env   # then fill it in — start-mcp.sh loads it for you
claude mcp add sonarcloud --scope user -- "$PWD/start-mcp.sh"
```

### Other agents

Same three methods apply — only the registration command changes. Each example below uses npx; for
**npm install** swap `npx --yes @teolin/mcp-sonarcloud` for `sonarcloud-mcp`, and for **clone repo** swap it for the absolute
path to `start-mcp.sh`.

**GitHub Copilot CLI** — `copilot mcp add`, or `/mcp add` inside a session, or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "sonarcloud": {
      "type": "local",
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-sonarcloud"],
      "env": { "SONAR_TOKEN": "your-token" },
      "tools": ["*"]
    }
  }
}
```

**OpenAI Codex CLI** — one command, or edit `~/.codex/config.toml`:

```bash
codex mcp add sonarcloud --env SONAR_TOKEN=your-token -- npx --yes @teolin/mcp-sonarcloud
```

```toml
[mcp_servers.sonarcloud]
command = "npx"
args = ["--yes", "@teolin/mcp-sonarcloud"]

[mcp_servers.sonarcloud.env]
SONAR_TOKEN = "your-token"
```

**Devin** — one command, or edit `.devin/mcp_config.json` (put secrets in the gitignored `.devin/mcp_config.local.json`):

```bash
devin mcp add sonarcloud -- npx --yes @teolin/mcp-sonarcloud
```

```json
{
  "mcpServers": {
    "sonarcloud": {
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-sonarcloud"],
      "env": { "SONAR_TOKEN": "your-token" }
    }
  }
}
```

**Goose** — `goose configure` → *Add Extension* → *Command-line Extension*, or edit `~/.config/goose/config.yaml`:

```yaml
extensions:
  sonarcloud:
    type: stdio
    name: sonarcloud
    enabled: true
    cmd: npx
    args: ["--yes", "@teolin/mcp-sonarcloud"]
    envs: { SONAR_TOKEN: "your-token" }
    timeout: 300
```

### Verify and remove

```bash
claude mcp list
gemini mcp list

claude mcp remove sonarcloud --scope user
gemini mcp remove sonarcloud
```

---

## Available Tools

### 1. get_project_status
Get the quality gate status for the project. Returns PASSED/FAILED with conditions.

### 2. get_issues
Get issues (bugs, vulnerabilities, code smells) from the project. Parameters: `severities`, `types`, `statuses`, `resolved`, `pageSize`, `page`.

### 3. get_issue_details
Get detailed information about a specific issue. Parameters: `issueKey` (required).

### 4. get_measures
Get project metrics (bugs, vulnerabilities, code_smells, coverage, duplicated_lines_density, etc.). Parameters: `metricKeys` (optional).

### 5. get_security_hotspots
Get security hotspots from the project. Parameters: `status`, `resolution`, `pageSize`, `page`.

### 6. get_hotspot_details
Get detailed information about a security hotspot. Parameters: `hotspotKey` (required).

### 7. get_files
Get list of files in the project. Parameters: `qualifiers`, `pageSize`, `page`.

### 8. get_source_code
Get source code of a file. Parameters: `fileKey` (required), `from`, `to`.

## Usage Examples

### Example 1: Check quality gate
```javascript
// In Claude Code:
"Is my SonarCloud project passing quality gates?"
// Returns quality gate status
```

### Example 2: List bugs
```javascript
// In Claude Code:
"Show me all bugs in my SonarCloud project"
// Uses: get_issues with type BUG
```

### Example 3: Security hotspots
```javascript
// In Claude Code:
"List all security hotspots to review"
// Returns security-sensitive code locations
```

### Example 4: Project metrics
```javascript
// In Claude Code:
"What's the code coverage of my project?"
// Returns metrics including coverage
```
