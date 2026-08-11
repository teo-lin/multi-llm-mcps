# Publishing MCP Packages

## Prerequisites

- NPM Automation token configured as `NPMJS_TOKEN` in GitHub repository secrets
- Packages must have their version bumped before publishing

## Workflow Structure (DRY)

All publish workflows use a single reusable workflow (`publish-mcp.yml`) to avoid code duplication.

### Available Workflows

#### Publish All MCPs
**Actions → Publish All MCPs → Run workflow**

Publishes all 8 MCP packages in parallel:
- @teolin/mcp-github
- atlassian-mcp-server
- azure-ad-mcp-server
- cloudwatch-logs-mcp-server
- code-review-mcp-server
- jira-mcp-server
- kafdrop-mcp-server
- local-mysql-mcp-server

#### Publish Individual Packages
**Actions → Publish [package-name] → Run workflow**

Individual workflows for each package:
- Publish mcp-github
- Publish atlassian-mcp-server
- Publish azure-ad-mcp-server
- Publish cloudwatch-logs-mcp-server
- Publish code-review-mcp-server
- Publish jira-mcp-server
- Publish kafdrop-mcp-server
- Publish local-mysql-mcp-server

## Publishing Process

### 1. Bump Version

```bash
# For a specific package
cd mcps/GitHub
npm version patch|minor|major

# Commit and push
git add package.json package-lock.json
git commit -m "chore: bump mcp-github to vX.X.X"
git push
```

### 2. Run Workflow

Go to **Actions** → Select workflow → **Run workflow**

### 3. Verify

Check npm: https://www.npmjs.com/package/@teolin/mcp-github

## Manual Publishing

```bash
# From repository root
npm publish --workspace=mcps/GitHub --access public
```

Requires `NPM_TEOLIN_ACCESS_TOKEN` in environment.

## Adding New Packages

To add a new MCP package to publishing:

1. Add job to `.github/workflows/publish-all-mcps.yml`
2. Create individual workflow file (copy existing pattern)
3. Ensure package has correct scope/name in `package.json`
