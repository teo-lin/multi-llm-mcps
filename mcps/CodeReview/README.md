# Code Review MCP Server

Automated code review server that integrates GitHub PRs with Jira tickets for comprehensive code review automation.

## Features

- 🔄 **GitHub PR Integration**: Fetches PR diffs and metadata
- 🎫 **Jira Integration**: Retrieves requirements and acceptance criteria via Atlassian CLI
- 🧪 **Test Execution**: Pulls branch locally and runs tests
- 🔍 **Lint Checking**: Runs linting to ensure code quality
- 💬 **AI-Powered Analysis**: Generates review comments with file:line references
- 📝 **Formatted Output**: Clean markdown report with all findings

## Prerequisites

1. **GitHub CLI**: `gh` command must be available and authenticated
2. **Atlassian CLI**: `acli` command must be available and authenticated
3. **Node.js**: Version 25.2.1 required

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Authenticate Required Services

```bash
# GitHub CLI
gh auth login

# Atlassian CLI
acli auth login --url https://your-domain.atlassian.net
```

## Usage

### In Claude Code

```bash
# Review a specific PR (from any repository)
code_review pr_name: "123" working_directory: "/path/to/your/repo"

# Or use the tool directly:
/mcp code_review {"pr_name": "123", "working_directory": "/path/to/your/repo"}
```

### Example Output

```markdown
# Code Review: 123

## 🎫 Jira Ticket: PAB-2197
**Summary:** Implement user authentication with JWT
**Status:** In Progress
**Description:** Add JWT-based authentication system
**Acceptance Criteria:** Users should be able to login and receive tokens

## 🧪 Test Results
**Status:** ✅ PASSED

## 🔍 Lint Results
**Status:** ✅ PASSED

## 💬 Review Comments

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

## Extending

The server can be extended to support:
- Different CI/CD systems
- Additional code quality tools
- Custom review rules
- Multiple Jira instances
- Slack/Teams notifications