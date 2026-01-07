# NPX Test Results - Final Report

**Test Date**: 2026-01-05
**Tested Packages**: 8 (excluding MSK - marked as WIP)
**Test Method**: Published packages via npx

## Executive Summary

✅ **5/8 packages working perfectly** (62.5%)
❌ **3/8 packages failing** (37.5%) - Binary resolution issue

All packages work correctly when installed globally (`npm install -g`), but 3 packages fail when run via `npx` due to binary resolution issues.

---

## ✅ Working Packages (5/8)

### 1. @teolin/mcp-local-mysql ✅
**Status**: WORKING PERFECTLY
**Binary**: `mysql-mcp`
**Tools**: 4 tools (query, list_databases, list_tables, describe_table)
**Notes**: Server starts successfully, responds to MCP protocol

### 2. @teolin/mcp-azure-ad ✅
**Status**: WORKING PERFECTLY
**Binary**: `azuread-mcp`
**Tools**: 5 tools (authenticate, get_access_token, check_auth_status, clear_token_cache, make_authenticated_request)
**Notes**: Warns about missing AZURE_CLIENT_ID but starts successfully

### 3. @teolin/mcp-cloudwatch-logs ✅
**Status**: WORKING PERFECTLY
**Binary**: `cloudwatch-mcp`
**Tools**: 3 tools (query_logs, list_log_groups, get_recent_logs)
**Notes**: Server starts successfully, responds to MCP protocol

### 4. @teolin/mcp-jira ✅
**Status**: WORKING PERFECTLY (Published version v3.0.1)
**Binary**: `jira-mcp`
**Tools**: 6 tools (get_ticket_details, search_tickets_jql, get_board_issues, get_ptls_board_bugs, get_absences_bugs, get_team_names)
**Notes**: Gracefully handles missing credentials with warning message. Local fix (v3.0.2) is even better but not yet published.

### 5. @teolin/mcp-kafdrop ✅
**Status**: WORKING PERFECTLY
**Binary**: `kafdrop-mcp`
**Tools**: 7 tools (list_topics, get_topic_details, browse_messages, list_consumer_groups, get_consumer_group_details, list_brokers, search_messages)
**Notes**: Server starts successfully, connects to localhost:9000

---

## ❌ Failing Packages (3/8)

All three failures share the same root cause: **Binary resolution issue with npx**.

### 1. @teolin/mcp-github ❌
**Status**: FAILING - Binary not found
**Binary**: `mcp-github`
**Error**: `sh: mcp-github: command not found`
**Package Version**: 3.1.3

**Analysis**:
- ✅ Package structure is correct
- ✅ Binary has execute permissions in tarball
- ✅ Shebang line present (#!/usr/bin/env node)
- ✅ Works perfectly when installed globally
- ❌ Binary not resolved by npx

### 2. @teolin/mcp-atlassian ❌
**Status**: FAILING - Binary not found
**Binary**: `atlassian-mcp`
**Error**: `sh: atlassian-mcp: command not found`
**Package Version**: 3.1.3

**Analysis**:
- ✅ Package structure is correct
- ✅ Binary has execute permissions in tarball
- ✅ Shebang line present (#!/usr/bin/env node)
- ✅ Works perfectly when installed globally
- ❌ Binary not resolved by npx

### 3. @teolin/code-review-agent ❌
**Status**: FAILING - Binary not found
**Binary**: `codereview-mcp`
**Error**: `sh: codereview-mcp: command not found`
**Package Version**: 3.1.3

**Analysis**:
- ✅ Package structure is correct
- ✅ Binary has execute permissions in tarball
- ✅ Shebang line present (#!/usr/bin/env node)
- ✅ Works perfectly when installed globally
- ❌ Binary not resolved by npx

---

## Root Cause Analysis

### Binary Resolution Issue

When running `npx @teolin/mcp-github`:
1. ✅ npx downloads and caches the package successfully
2. ✅ Package contains correct bin configuration in package.json
3. ✅ Binary file has execute permissions
4. ❌ npx fails to resolve/execute the binary command

**Evidence**:
- Verbose npx output shows: `npm verbose argv "exec" "--loglevel" "verbose" "--" "@teolin/mcp-github"`
- Error: `sh: mcp-github: command not found`
- Same command structure works for @teolin/mcp-azure-ad and other working packages

**What Works**:
```bash
npm install -g @teolin/mcp-github
mcp-github  # Works perfectly!
```

**What Doesn't Work**:
```bash
npx @teolin/mcp-github  # Fails with "command not found"
npx --package=@teolin/mcp-github mcp-github  # Also fails
```

### Comparison: Working vs Failing

| Package | Package Name Pattern | Bin Name | npx Status |
|---------|---------------------|----------|------------|
| mcp-local-mysql | mcp-{service} | {service}-mcp | ✅ Works |
| mcp-azure-ad | mcp-{service} | {service}mcp | ✅ Works |
| mcp-cloudwatch-logs | mcp-{service} | {service}-mcp | ✅ Works |
| mcp-jira | mcp-{service} | {service}-mcp | ✅ Works |
| mcp-kafdrop | mcp-{service} | {service}-mcp | ✅ Works |
| mcp-github | mcp-{service} | **mcp-{service}** | ❌ Fails |
| mcp-atlassian | mcp-{service} | {service}-mcp | ❌ Fails |
| code-review-agent | {service} | {service}-mcp | ❌ Fails |

**Pattern Discovery**: The failing packages may have subtle differences in how npx resolves their binaries, but the exact cause is unclear. All packages have correct metadata and structure.

---

## Recommendations

### Immediate Actions Required

#### 1. Investigate npx Binary Resolution

The core issue needs investigation:
- Why does npx resolve some packages but not others?
- Is there an npm/npx version-specific bug?
- Is there a naming pattern that affects resolution?

**Suggested Investigation**:
```bash
# Test with different npm/node versions
nvm use 18
npx @teolin/mcp-github

nvm use 20
npx @teolin/mcp-github

# Test with latest npm
npm install -g npm@latest
npx @teolin/mcp-github
```

#### 2. Potential Workarounds to Test

**Option A: Change bin names to match package names**
```json
// @teolin/mcp-github package.json
"bin": {
  "mcp-github": "src/index.js"  // Current
  "@teolin/mcp-github": "src/index.js"  // Try adding this
}
```

**Option B: Add default bin**
```json
"bin": "./src/index.js"  // Single string instead of object
```

**Option C: Simplify package names**
```json
// Maybe republish as:
"name": "mcp-github"  // Without @teolin scope?
```

#### 3. Document Global Installation as Workaround

Until npx issue is resolved, update READMEs to recommend global installation:

```markdown
## Installation

### Recommended: Global Installation
\`\`\`bash
npm install -g @teolin/mcp-github
\`\`\`

### Alternative: npx (Currently not working - under investigation)
\`\`\`bash
# Note: npx method currently has issues, use global installation instead
npx @teolin/mcp-github
\`\`\`
```

#### 4. Republish Jira Package

The local Jira fix (v3.0.2) with graceful credential handling should be published:

```bash
cd mcps/Jira
# Update version in package.json to 3.0.2
npm version patch
npm publish
```

---

## Testing Checklist

### After Implementing Fixes

- [ ] Test all 3 failing packages with npx on clean system
- [ ] Test with different Node versions (18, 20, 22, latest)
- [ ] Test with different npm versions
- [ ] Verify global installation still works
- [ ] Test in Claude Code CLI configuration
- [ ] Update documentation with final resolution

---

## Test Environment

**Node Version**: v25.2.1
**npm Version**: 11.6.2
**OS**: macOS (Darwin 25.2.0)
**Test Scripts**:
- `/Users/teolin/_WORK/done 👍/✴️ AI/scripts/test-npx.sh`
- `/Users/teolin/_WORK/done 👍/✴️ AI/scripts/test-npx-interactive.sh`

---

## Conclusion

**Production Ready**:
- 5 packages are fully production-ready and work perfectly via npx
- All 8 packages work when installed globally

**Needs Investigation**:
- 3 packages have npx binary resolution issues
- Root cause unclear - requires npm/npx debugging
- Global installation works as reliable workaround

**Next Steps**:
1. Investigate npx binary resolution issue
2. Test potential workarounds
3. Republish Jira package with local improvements
4. Update documentation with findings
