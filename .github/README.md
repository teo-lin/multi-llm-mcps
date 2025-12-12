# Publishing MCP Packages

## @teo-lin/mcp-github

### Prerequisites

- NPM token exported from `.zshrc`
- GitHub token exported from `.zshrc`

### Publishing Process

#### Option 1: GitHub Actions (Recommended)

1. Go to **Actions** → **Publish @teo-lin/mcp-github**
2. Click **Run workflow** → **Run workflow**
3. The workflow runs on your self-hosted runner and publishes to npm

The workflow:

- Uses your runner's environment variables (`NPM_TEOLIN_ACCESS_TOKEN`)
- Falls back to GitHub secrets if `NPM_TOKEN` is set
- Publishes from the `mcps/GitHub` workspace

#### Option 2: Manual Publishing

```bash
# From repository root
npm publish --workspace=mcps/GitHub --access public
```

Requires `NPM_TEOLIN_ACCESS_TOKEN` in your environment.

### Version Management

Update version in `mcps/GitHub/package.json` before publishing.

```bash
cd mcps/GitHub
npm version patch|minor|major
```
