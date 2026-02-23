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

| Method         | Pros                          | Cons                             | When           |
| -------------- | ----------------------------- | -------------------------------- | -------------- |
| **npx**        | No install, latest version    | Slower, needs internet           | Quick demos    |
| **Global npm** | Instant, offline              | Takes disk space, manual updates | Default choice |
| **Local npm**  | Version controlled, team sync | Extra disk per project           | Shared teams   |

```bash
# Option 1: npx (fastest)
claude mcp add sonarcloud --scope user -- npx --yes @teolin/mcp-sonarcloud
gemini mcp add sonarcloud npx --yes @teolin/mcp-sonarcloud

# Option 2: Global install (recommended)
npm install --global @teolin/mcp-sonarcloud
claude mcp add sonarcloud --scope user -- sonarcloud-mcp
gemini mcp add sonarcloud sonarcloud-mcp

# Option 3: Local project
npm install @teolin/mcp-sonarcloud
claude mcp add sonarcloud --scope project -- node ./node_modules/@teolin/mcp-sonarcloud/src/index.js

# Verify
claude mcp list
gemini mcp list

# Remove
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
