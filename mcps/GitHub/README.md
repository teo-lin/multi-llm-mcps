# GitHub MCP Server

Model Context Protocol server for GitHub operations using GitHub CLI (`gh`).

## Features

- **PR Information**: Fetch pull request details, diffs, and metadata
- **Repository Context**: Extract and parse GitHub PR identifiers
- **CLI Integration**: Uses GitHub CLI for seamless authentication

## Prerequisites

- Node.js >=18.0.0
- GitHub CLI (`gh`) installed and authenticated

### Install GitHub CLI

```bash
# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### Authenticate with GitHub CLI

```bash
gh auth login
```

---

## Option 1: Using npx (No Installation, but makes external web call to npmjs every use)

### Setup

```bash
# Either User scope (available in all projects)
claude mcp add github -s user -- npx -y @teolin/mcp-github

# Or Project scope (shared with team via git)
claude mcp add github -s project -- npx -y @teolin/mcp-github
```

### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `npx -y @teolin/mcp-github` on start)

---

## Option 2: Global npm Installation

### Setup

```bash
npm install -g @teolin/mcp-github

# Either User scope (available in all projects)
claude mcp add github -s user -- mcp-github

# Or Project scope (shared with team via git)
claude mcp add github -s project -- mcp-github
```

### Usage
Automatic. Claude will use it when needed. (Startup Managed by Claude MCP server lifecyle - it simply runs `mcp-github` on start)
---

## Option 3: Local Installation

### Setup

```bash
npm install @teolin/mcp-github

# Either User scope (available in all projects)
claude mcp add github -s user -- node ./node_modules/@teolin/mcp-github/src/index.js

# Or Project scope (shared with team via git)
claude mcp add github -s project -- node ./node_modules/@teolin/mcp-github/src/index.js
```

### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `node ./node_modules/@teolin/mcp-github/src/index.js` on start)

---

## Available Tools

The GitHub MCP provides tools for interacting with GitHub pull requests and repositories through the GitHub CLI.

### PR Identifier Formats

The server supports multiple PR identifier formats:
- **PR number**: `123`
- **PR with hash**: `#123`
- **PR URL**: `https://github.com/owner/repo/pull/123`
- **Branch name**: `feat/PAB-123-feature-name`

## Usage Examples

### Example 1: Get PR details
```javascript
// In Claude Code (from a git repository):
"Get details for PR 123"
// Fetches PR metadata and diff
```

### Example 2: Get PR from URL
```javascript
// In Claude Code:
"Analyze PR https://github.com/owner/repo/pull/456"
// Extracts PR number and fetches details
```

### Example 3: Get PR diff
```javascript
// In Claude Code:
"Show me the diff for PR #789"
// Gets full diff of all changes
```

### Example 4: Get PR from branch
```javascript
// In Claude Code:
"Get PR for branch feat/PAB-123-new-feature"
// Finds PR associated with the branch
```

## Requirements

- Node.js >=18.0.0
- GitHub CLI (`gh`) authenticated
- Network access to GitHub
- Published on npm: [@teolin/mcp-github](https://www.npmjs.com/package/@teolin/mcp-github)

## Troubleshooting

### GitHub CLI not authenticated
```bash
gh auth status
# If not authenticated:
gh auth login
```

### Permission errors
- Ensure you have access to the repository
- Check GitHub CLI permissions: `gh auth refresh -h github.com -s repo`

## Publishing

### Using GitHub Actions (Recommended)

This package uses GitHub Actions for automated publishing. To publish a new version:

1. Go to GitHub Actions → "Publish @teolin/mcp-github" → Run workflow
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

   # Or test with GitHub CLI (requires gh to be authenticated)
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
   npx -y @teolin/mcp-github

   # Or install globally and test
   npm install -g @teolin/mcp-github
   mcp-github
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
- https://www.npmjs.com/package/@teolin/mcp-github

Check what files will be included before publishing:
```bash
npm pack --dry-run
```

#### Troubleshooting

**"You do not have permission to publish"**
- Make sure you're logged in: `npm whoami`
- For scoped packages (@teolin/...), ensure you have access to the @teolin organization or use your own scope

**"Package name already exists"**
- The package name might be taken. Check: https://www.npmjs.com/package/@teolin/mcp-github
- If needed, change the name in package.json

**Files missing after installation**
- Check the `files` field in package.json
- Use `npm pack --dry-run` to preview what will be included

## License

MIT
