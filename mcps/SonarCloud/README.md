# SonarCloud MCP Server

Model Context Protocol (MCP) server for SonarCloud and SonarQube integration. Provides comprehensive code quality analysis, issue management, and security hotspot detection directly in Claude Code CLI.

## Features

-  **Quality Gate Status** - Check if your project passes quality gates
-  **Issue Management** - List and analyze bugs, vulnerabilities, and code smells
-  **Security Hotspots** - Identify and review security-sensitive code
-  **Project Metrics** - Get coverage, duplication, and quality metrics
-  **File Browser** - Navigate project structure
-  **Source Code Access** - Read source code with issue context
-  **Rule Details** - Understand what each rule checks and how to fix it
-  **Analysis History** - View past analysis results
-  **Comprehensive Summaries** - Get aggregated issue reports

## Prerequisites

- Node.js >=18.0.0
- SonarCloud or SonarQube instance with API access

## Installation

---

### Option 1: Using npx (No Installation)

#### Setup

```bash
# Either User scope (available in all projects)
claude mcp add sonarcloud -s user -- npx -y @teolin/mcp-sonarcloud

# Or Project scope (shared with team via git)
claude mcp add sonarcloud -s project -- npx -y @teolin/mcp-sonarcloud
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `npx -y @teolin/mcp-sonarcloud` on start)

---

### Option 2: Global npm Installation

#### Setup

```bash
npm install -g @teolin/mcp-sonarcloud

# Either User scope (available in all projects)
claude mcp add sonarcloud -s user -- sonarcloud-mcp

# Or Project scope (shared with team via git)
claude mcp add sonarcloud -s project -- sonarcloud-mcp
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `sonarcloud-mcp` on start)

---

### Option 3: Local Installation

#### Setup

```bash
npm install @teolin/mcp-sonarcloud

# Either User scope (available in all projects)
claude mcp add sonarcloud -s user -- node ./node_modules/@teolin/mcp-sonarcloud/src/index.js

# Or Project scope (shared with team via git)
claude mcp add sonarcloud -s project -- node ./node_modules/@teolin/mcp-sonarcloud/src/index.js
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `node ./node_modules/@teolin/mcp-sonarcloud/src/index.js` on start)

---

## Configuration

### Get your SonarCloud credentials

**For SonarCloud:**
- Organization Key: Found in SonarCloud URL: `https://sonarcloud.io/organizations/{your-org-key}`
- Project Key: Found in project settings or URL: `https://sonarcloud.io/project/overview?id={project-key}`
- Token: Go to https://sonarcloud.io/account/security → Generate a new user token

**For self-hosted SonarQube:**
- Host URL: Your SonarQube server URL (e.g., `https://sonar.company.com`)
- Project Key: Found in project settings
- Token: My Account → Security → Generate token

### Environment Variables

```bash
cp .env.example .env
# Edit .env with your credentials
```

```bash
# For SonarCloud (default)
SONAR_HOST_URL=https://sonarcloud.io
SONAR_TOKEN=your_sonar_token_here
SONAR_ORGANIZATION=your_organization_key
SONAR_PROJECT_KEY=your_project_key

# For self-hosted SonarQube
SONAR_HOST_URL=https://your-sonarqube-instance.com
SONAR_TOKEN=your_sonar_token_here
SONAR_ORGANIZATION=your_organization_key  # Optional for SonarQube
SONAR_PROJECT_KEY=your_project_key
```

## Available Tools

### 1. `get_project_status`
Get the quality gate status for the project.

**Response includes:**
- Quality gate status (PASSED/FAILED)
- Condition details
- Period information

### 2. `get_issues`
Get issues (bugs, vulnerabilities, code smells) from the project.

**Parameters:**
- `severities` (optional): BLOCKER, CRITICAL, MAJOR, MINOR, INFO
- `types` (optional): BUG, VULNERABILITY, CODE_SMELL, SECURITY_HOTSPOT
- `statuses` (optional): OPEN, CONFIRMED, REOPENED, RESOLVED, CLOSED
- `resolved` (optional): Include resolved issues (default: false)
- `pageSize` (optional): Results per page (default: 100, max: 500)
- `page` (optional): Page number (default: 1)

### 3. `get_issue_details`
Get detailed information about a specific issue.

**Parameters:**
- `issueKey` (required): The issue key/ID

**Response includes:**
- Issue message and description
- File location and line number
- Rule information
- Severity and type
- Comments and transitions
- Code snippets

### 4. `get_measures`
Get project metrics.

**Parameters:**
- `metricKeys` (optional): Comma-separated metric keys

**Default metrics:** bugs, vulnerabilities, code_smells, coverage, duplicated_lines_density

**Other available metrics:** sqale_index, reliability_rating, security_rating, sqale_rating, ncloc, complexity

### 5. `get_security_hotspots`
Get security hotspots from the project.

**Parameters:**
- `status` (optional): TO_REVIEW, REVIEWED
- `resolution` (optional): FIXED, SAFE, ACKNOWLEDGED
- `pageSize` (optional): Results per page (default: 100)
- `page` (optional): Page number

### 6. `get_hotspot_details`
Get detailed information about a security hotspot.

**Parameters:**
- `hotspotKey` (required): The hotspot key/ID

### 7. `get_files`
Get list of files in the project.

**Parameters:**
- `qualifiers` (optional): FIL (files), DIR (directories), TRK (projects). Default: FIL
- `pageSize` (optional): Results per page (default: 100)
- `page` (optional): Page number

### 8. `get_source_code`
Get source code of a file.

**Parameters:**
- `fileKey` (required): The file component key
- `from` (optional): Start line number
- `to` (optional): End line number

### 9. `get_rules`
Get SonarQube/SonarCloud rules.

**Parameters:**
- `languages` (optional): js, ts, java, python, etc.
- `types` (optional): BUG, VULNERABILITY, CODE_SMELL, SECURITY_HOTSPOT
- `severities` (optional): BLOCKER, CRITICAL, MAJOR, MINOR, INFO
- `pageSize` (optional): Results per page (default: 100)
- `page` (optional): Page number

### 10. `get_rule_details`
Get detailed information about a specific rule.

**Parameters:**
- `ruleKey` (required): The rule key (e.g., typescript:S1234)

**Response includes:**
- Rule description
- Why this is an issue
- How to fix it
- Code examples (good/bad)
- Tags and severity

### 11. `get_analyses_history`
Get project analysis history.

**Parameters:**
- `pageSize` (optional): Results per page (default: 10)
- `page` (optional): Page number

### 12. `get_issues_summary`
Get a comprehensive summary of all issues grouped by type and severity.

**Response includes:**
- Total counts by type (bugs, vulnerabilities, code smells, security hotspots)
- Breakdown by severity (BLOCKER, CRITICAL, MAJOR, MINOR, INFO)
- Breakdown by status (OPEN, CONFIRMED, REOPENED, etc.)

## Publishing

### Using GitHub Actions (Recommended)

This package uses GitHub Actions for automated publishing. To publish a new version:

1. Go to GitHub Actions → "Publish @teolin/mcp-sonarcloud" → Run workflow
2. The workflow will automatically:
   - Install dependencies
   - Run the `prepublishOnly` script to make the bin executable
   - Publish to npm with public access

### Manual Publishing

#### Prerequisites

1. You need an npm account: https://www.npmjs.com/signup
2. Login to npm:
   ```bash
   npm login
   ```

#### Publishing Steps

1. **Test the package locally** (optional but recommended):
   ```bash
   # Test that it runs
   node src/index.js --help

   # Or test with environment variables
   SONAR_HOST_URL=https://sonarcloud.io SONAR_TOKEN=your_token SONAR_ORGANIZATION=your_org SONAR_PROJECT_KEY=your_project node src/index.js
   ```

2. **Publish to npm**:
   ```bash
   npm publish
   ```

   This will:
   - Run the `prepublishOnly` script to make the bin executable
   - Only include files specified in the `files` field
   - Publish to npm with public access (configured in `publishConfig`)

3. **Verify the package**:
   ```bash
   # Test with npx (no installation)
   npx -y @teolin/mcp-sonarcloud

   # Or install globally and test
   npm install -g @teolin/mcp-sonarcloud
   sonarcloud-mcp
   ```

#### Updating the Package

1. Update the version in `package.json`:
   ```bash
   npm version patch  # for bug fixes (1.0.0 -> 1.0.1)
   npm version minor  # for new features (1.0.0 -> 1.1.0)
   npm version major  # for breaking changes (1.0.0 -> 2.0.0)
   ```

2. Publish the new version:
   ```bash
   npm publish
   ```

#### Checking Published Package

View your package on npm:
- https://www.npmjs.com/package/@teolin/mcp-sonarcloud

Check what files will be included before publishing:
```bash
npm pack --dry-run
```

#### Troubleshooting

**"You do not have permission to publish"**
- Make sure you're logged in: `npm whoami`
- For scoped packages (@teolin/...), ensure you have access to the @teolin organization or use your own scope

**"Package name already exists"**
- The package name might be taken. Check: https://www.npmjs.com/package/@teolin/mcp-sonarcloud
- If needed, change the name in package.json

**Files missing after installation**
- Check the `files` field in package.json
- Use `npm pack --dry-run` to preview what will be included

## Usage Examples

### Example 1: Daily Code Quality Check

```javascript
// In Claude Code:
"Check the quality gate status and give me a summary of issues"

// Claude will:
// 1. Call get_project_status
// 2. Call get_issues_summary
// 3. Present a formatted report
```

### Example 2: Fixing Critical Issues

```javascript
// In Claude Code:
"Show me all critical bugs and help me fix them"

// Claude will:
// 1. Call get_issues with types="BUG" and severities="CRITICAL"
// 2. For each bug, call get_issue_details
// 3. Call get_rule_details to understand the rule
// 4. Call get_source_code to see the problematic code
// 5. Suggest fixes based on the rule documentation
```

### Example 3: Security Review

```javascript
// In Claude Code:
"Are there any security issues I need to review?"

// Claude will:
// 1. Call get_issues with types="VULNERABILITY"
// 2. Call get_security_hotspots with status="TO_REVIEW"
// 3. Present findings with severity prioritization
// 4. For critical findings, provide remediation advice
```

### Example 4: Pre-Release Quality Check

```javascript
// In Claude Code:
"Is the code ready for release?"

// Claude will:
// 1. Call get_project_status to check quality gate
// 2. Call get_measures to check coverage and other metrics
// 3. Call get_issues to check for blockers
// 4. Call get_security_hotspots to check for unreviewed security issues
// 5. Provide a go/no-go recommendation
```

### Example 5: TypeScript Code Quality

```javascript
// In Claude Code:
"Show me all TypeScript code smells with MAJOR severity"

// Parameters: { types: "CODE_SMELL", severities: "MAJOR" }
// Helps identify maintainability issues
```

### Example 6: Understanding a Rule

```javascript
// In Claude Code:
"Explain rule typescript:S2699 and show me where it's violated"

// Claude will:
// 1. Call get_rule_details to get the rule explanation
// 2. Call get_issues to find violations
// 3. Explain the issue and how to fix it
```

### Example 7: Code Coverage Analysis

```javascript
// In Claude Code:
"What's our test coverage and which areas need more tests?"

// Claude will:
// 1. Call get_measures with coverage metrics
// 2. Call get_files to identify uncovered files
// 3. Provide coverage recommendations
```

### Example 8: GitHub Actions Integration

```javascript
// Workflow:
// 1. GitHub Actions runs SonarCloud analysis on PR
// 2. In Claude Code: "Check the latest SonarCloud results"
// 3. Claude fetches and summarizes issues
// 4. You ask: "Help me fix the critical bugs"
// 5. Claude suggests fixes based on rules
// 6. You implement the fixes
// 7. Push changes
// 8. Verify: "Did the quality gate pass now?"
```

## Understanding SonarCloud Concepts

### Issue Types
- **BUG**: A coding mistake that will lead to unexpected behavior
- **VULNERABILITY**: A security flaw that could be exploited
- **CODE_SMELL**: Maintainability issue that will make code harder to understand or modify
- **SECURITY_HOTSPOT**: Security-sensitive code that needs manual review

### Severities
- **BLOCKER**: Must be fixed immediately
- **CRITICAL**: Should be fixed as soon as possible
- **MAJOR**: Should be fixed
- **MINOR**: Should be reviewed
- **INFO**: Informational only

### Quality Gates
Quality gates are pass/fail checks based on metrics like:
- New bugs/vulnerabilities introduced
- Code coverage on new code
- Duplication in new code
- Maintainability rating

## Troubleshooting

### Authentication Errors

```
Error: SonarCloud is not configured
```

**Solution**: Ensure all environment variables are set correctly:
- `SONAR_TOKEN` - Check token is valid and not expired
- `SONAR_ORGANIZATION` - Verify organization key is correct
- `SONAR_PROJECT_KEY` - Verify project key matches exactly

### 404 Errors

```
Error: Project not found
```

**Solution**:
- Verify `SONAR_PROJECT_KEY` is correct
- Check you have access to the project in SonarCloud
- For SonarCloud, ensure `SONAR_ORGANIZATION` is set

### Rate Limiting

SonarCloud has rate limits. If you hit them:
- Use pagination with smaller page sizes
- Add delays between requests
- Consider caching results

## Requirements

- Node.js >=18.0.0
- SonarCloud or SonarQube instance with API access
- Published on npm: [@teolin/mcp-sonarcloud](https://www.npmjs.com/package/@teolin/mcp-sonarcloud)

## Related Resources

- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [SonarQube Web API](https://docs.sonarqube.org/latest/extend/web-api/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code CLI](https://github.com/anthropics/claude-code)

## License

MIT
