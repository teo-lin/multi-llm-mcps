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

## Setup

Four ways to run this server. Pick one:

| Setup            | What it does                                   | Use it when                                | How to                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| _none (npx)_     | Downloads and runs on demand, nothing kept     | Trying it out, or always want latest       |                                                   |
| _global (npm)_   | Installs once, runs from disk, offline         | Fastest start, works offline, all projects | `npm install --global @teolin/mcp-sonarcloud`                     |
| _local (npm)_    | Install per project / repository, runs offline | Fast, offline, Project/team specific       | `npm install @teolin/mcp-sonarcloud`                              |
| _custom (clone)_ | Runs your own source copy                      | You want to change the server code         | `git clone https://github.com/teo-lin/multi-llm-mcps.git && cd multi-llm-mcps && npm run setup` |

### Usage

Once installed, the server must be registered with your preferred agent(s), so the agent(s) can use it. Pick the relevant one(s) for you.

```bash
# no setup (npx):
claude mcp add sonarcloud --scope user -- npx --yes @teolin/mcp-sonarcloud
gemini mcp add sonarcloud npx --yes @teolin/mcp-sonarcloud
codex  mcp add sonarcloud -- npx --yes @teolin/mcp-sonarcloud
devin  mcp add sonarcloud --scope user -- npx --yes @teolin/mcp-sonarcloud

# global setup (npm --global): same commands, with the binary instead of npx
claude mcp add sonarcloud --scope user -- sonarcloud-mcp
gemini mcp add sonarcloud sonarcloud-mcp
codex  mcp add sonarcloud -- sonarcloud-mcp
devin  mcp add sonarcloud --scope user -- sonarcloud-mcp

# local setup (npm, one project): point at the installed file
claude mcp add sonarcloud --scope project -- node ./node_modules/@teolin/mcp-sonarcloud/src/index.js

# custom (clone): register every server in this repo, from the repo root
bash scripts/register-all.sh
# or register just this one, from mcps/SonarCloud:
claude mcp add sonarcloud --scope user -- "$PWD/start-mcp.sh"
gemini mcp add sonarcloud --scope user "$PWD/start-mcp.sh"
codex  mcp add sonarcloud -- "$PWD/start-mcp.sh"
devin  mcp add sonarcloud --scope user -- "$PWD/start-mcp.sh"
```

`npx` and global installs do not read this folder's `.env` — pass config on the command line:

```bash
claude mcp add sonarcloud --scope user --env SONAR_TOKEN=your-token -- npx --yes @teolin/mcp-sonarcloud
gemini mcp add sonarcloud --scope user -e SONAR_TOKEN=your-token npx --yes @teolin/mcp-sonarcloud
codex  mcp add sonarcloud --env SONAR_TOKEN=your-token -- npx --yes @teolin/mcp-sonarcloud
devin  mcp add sonarcloud --scope user -e SONAR_TOKEN=your-token -- npx --yes @teolin/mcp-sonarcloud
```

The clone setup needs none of this: `start-mcp.sh` loads `.env` for you.

### Verify and remove

```bash
claude mcp list
gemini mcp list
codex  mcp list
devin  mcp list

claude mcp remove sonarcloud --scope user
gemini mcp remove sonarcloud --scope user
codex  mcp remove sonarcloud
devin  mcp remove sonarcloud --scope user
```

`claude mcp get sonarcloud`, `codex mcp get sonarcloud` and `devin mcp get sonarcloud` show one server in
detail. `devin` removes from `local` scope unless you pass `--scope`, so remove from the same scope
you added to.

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
