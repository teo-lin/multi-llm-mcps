# Code Review MCP Server

Automated code review server that integrates GitHub PRs with Jira tickets for comprehensive code review automation.

## Features

-  **GitHub PR Integration**: Fetches PR diffs and metadata
-  **Jira Integration**: Retrieves requirements and acceptance criteria via Atlassian CLI
-  **Test Execution**: Pulls branch locally and runs tests
-  **Lint Checking**: Runs linting to ensure code quality
-  **AI-Powered Analysis**: Generates review comments with file:line references
-  **Formatted Output**: Clean markdown report with all findings

## Prerequisites

1. **GitHub CLI**: `gh` command must be available and authenticated
2. **Atlassian CLI**: `acli` command must be available and authenticated
3. **Node.js**: Version >=25.2.1 required

## Installation

---

### Option 1: Using npx (No Installation)

#### Setup

```bash
# Either User scope (available in all projects)
claude mcp add codereview --scope user -- npx --yes @teolin/code-review-agent

# Or Project scope (shared with team via git)
claude mcp add codereview -s project -- npx --yes @teolin/code-review-agent
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `npx --yes @teolin/code-review-agent` on start)

---

### Option 2: Global npm Installation

#### Setup

```bash
npm install -g @teolin/code-review-agent

# Either User scope (available in all projects)
claude mcp add codereview --scope user -- codereview-mcp

# Or Project scope (shared with team via git)
claude mcp add codereview -s project -- codereview-mcp
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `codereview-mcp` on start)

---

### Option 3: Local Installation

#### Setup

```bash
npm install @teolin/code-review-agent

# Either User scope (available in all projects)
claude mcp add codereview --scope user -- node ./node_modules/@teolin/code-review-agent/src/index.js

# Or Project scope (shared with team via git)
claude mcp add codereview -s project -- node ./node_modules/@teolin/code-review-agent/src/index.js
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `node ./node_modules/@teolin/code-review-agent/src/index.js` on start)

---

## Configuration

### Authenticate Required Services

```bash
# GitHub CLI
gh auth login

# Atlassian CLI
acli auth login --url https://your-domain.atlassian.net
```

### Example Output

```markdown
# Code Review: 123

##  Jira Ticket: PAB-2197
**Summary:** Implement user authentication with JWT
**Status:** In Progress
**Description:** Add JWT-based authentication system
**Acceptance Criteria:** Users should be able to login and receive tokens

##  Test Results
**Status:**  PASSED

##  Lint Results
**Status:**  PASSED

##  Review Comments

• **src/auth.js:45** → Remove console.log before merging
• **src/types.js:12** → Avoid "any" type, be more specific
• **src/handler.js:89** → Consider error handling for async operation
```

## How It Works

1. **PR Analysis**: Extracts PR diff and metadata from GitHub
2. **Jira Integration**: Finds associated Jira ticket (from branch name/PR title/body)
3. **Requirements Fetch**: Gets ticket details via Atlassian CLI
4. **Branch Testing**: Checks out PR branch and runs `npm run test`
5. **Code Quality**: Runs `npm run lint` for style compliance
6. **Smart Analysis**: Scans code changes for common issues:
   - Console.log statements
   - TODO/FIXME comments
   - TypeScript `any` usage
   - Security concerns
   - Missing error handling
7. **Report Generation**: Formats findings into actionable review

## Supported Patterns

- **Branch naming**: `feat/PAB-123-description`, `fix/ABC-456`
- **PR titles**: `[PAB-123] Add feature`
- **PR descriptions**: References to Jira tickets

## Configuration

The server automatically detects:
- GitHub repository context
- Node.js project structure
- Available npm scripts (`test`, `lint`)
- Jira ticket references

## Testing

To test the MCP server:

```bash
npm test
```

## Troubleshooting

- **GitHub auth**: Run `gh auth status`
- **Atlassian auth**: Run `acli auth list`
- **MCP connection**: Check Claude Code logs with `/logs`
- **Permissions**: Ensure server has access to repositories

## Publishing

### Using GitHub Actions (Recommended)

This package uses GitHub Actions for automated publishing. To publish a new version:

1. Go to GitHub Actions → "Publish @teolin/code-review-agent" → Run workflow
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

   # Or test with a PR number (requires gh and acli to be authenticated)
   node src/index.js
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
   npx --yes @teolin/code-review-agent

   # Or install globally and test
   npm install -g @teolin/code-review-agent
   codereview-mcp
   ```

#### Updating the Package

1. Update the version in `package.json`:
   ```bash
   npm version patch  # for bug fixes (2.0.2 -> 2.0.3)
   npm version minor  # for new features (2.0.2 -> 2.1.0)
   npm version major  # for breaking changes (2.0.2 -> 3.0.0)
   ```

2. Publish the new version:
   ```bash
   npm publish
   ```

#### Checking Published Package

View your package on npm:
- https://www.npmjs.com/package/@teolin/code-review-agent

Check what files will be included before publishing:
```bash
npm pack --dry-run
```

#### Troubleshooting

**"You do not have permission to publish"**
- Make sure you're logged in: `npm whoami`
- For scoped packages (@teolin/...), ensure you have access to the @teolin organization or use your own scope

**"Package name already exists"**
- The package name might be taken. Check: https://www.npmjs.com/package/@teolin/code-review-agent
- If needed, change the name in package.json

**Files missing after installation**
- Check the `files` field in package.json
- Use `npm pack --dry-run` to preview what will be included

## Usage Examples

### Example 1: Review current PR
```javascript
// In Claude Code (from a git repository):
"Review PR 123"
// Fetches PR, runs tests & lint, analyzes code, generates review
```

### Example 2: Review with working directory
```javascript
// In Claude Code:
"Review PR 456 in /path/to/repo"
// Explicit path to repository
```

### Example 3: Quick code quality check
```javascript
// In Claude Code:
"Check code quality for PR 789"
// Runs lint and test suite, reports results
```

## Requirements

- Node.js >=18.0.0
- GitHub CLI (`gh`) authenticated
- Atlassian CLI (`acli`) authenticated
- Published on npm: [@teolin/code-review-agent](https://www.npmjs.com/package/@teolin/code-review-agent)

## Extending

The server can be extended to support:
- Different CI/CD systems
- Additional code quality tools
- Custom review rules
- Multiple Jira instances
- Slack/Teams notifications