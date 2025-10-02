# MCP Servers Collection

A collection of Model Context Protocol (MCP) servers for Claude Code, providing integrations with various services and tools.

## 📦 Available Servers

| Server | Description | Status |
|--------|-------------|--------|
| **MySQL** | MySQL database operations with connection pooling | ✅ Ready |
| **Jira** | Jira ticket management and JQL queries | ✅ Ready |
| **GitHub** | GitHub PR operations and diff analysis | ✅ Ready |
| **CodeReview** | Automated code reviews with GitHub + Jira | ✅ Ready |
| **Atlassian** | Atlassian/Jira CLI integration | ✅ Ready |
| **CloudWatch** | AWS CloudWatch Logs queries | ⚠️ Needs AWS credentials |

## 🚀 Quick Start

### Prerequisites

- Node.js 24.9.0 (managed via nvm)
- Claude Code CLI installed

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/teo-lin/claude-mcps.git
   cd claude-mcps
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Each server that needs configuration has a `.env.example` file. Copy and configure:
   ```bash
   # For MySQL
   cd MySQL && cp .env.example .env && cd ..

   # For Jira
   cd Jira && cp .env.example .env && cd ..

   # For CloudWatch (optional)
   cd CloudWatch && cp .env.example .env && cd ..

   # For CodeReview/Atlassian (optional)
   cd CodeReview && cp .env.example .env && cd ..
   cd Atlassian && cp .env.example .env && cd ..
   ```

4. **Register servers with Claude Code:**

   **Easy way** (register all at once):
   ```bash
   npm run register
   ```

   **Manual way** (register individually):
   ```bash
   claude mcp add mysql $(pwd)/MySQL/start-mcp.sh
   claude mcp add jira $(pwd)/Jira/start-mcp.sh
   claude mcp add github $(pwd)/GitHub/start-mcp.sh
   claude mcp add code-review $(pwd)/CodeReview/start-mcp.sh
   claude mcp add atlassian $(pwd)/Atlassian/start-mcp.sh
   claude mcp add cloudwatch $(pwd)/CloudWatch/start-mcp.sh
   ```

5. **Verify servers:**
   ```bash
   claude mcp list
   ```

## 📖 Server Documentation

### MySQL Server

**Purpose:** Query MySQL databases with connection pooling and parameterized queries.

**Setup:**
```bash
cd MySQL
cp .env.example .env
# Edit .env with your MySQL credentials
npm test  # Verify connection
```

**Environment Variables:**
- `MYSQL_HOST` - Database host (default: 127.0.0.1)
- `MYSQL_PORT` - Database port (default: 3306)
- `MYSQL_USER` - Database user
- `MYSQL_PASSWORD` - Database password
- `MYSQL_DATABASE` - Database name

**Tools:**
- `query` - Execute SQL queries with parameterized placeholders
- `list_databases` - List all databases
- `list_tables` - List tables in a database
- `describe_table` - Show table structure

[Full Documentation →](MySQL/README.md)

---

### Jira Server

**Purpose:** Interact with Jira tickets, boards, and JQL queries.

**Setup:**
```bash
cd Jira
cp .env.example .env
# Edit .env with your Jira credentials
npm test
```

**Environment Variables:**
- `JIRA_BASE_URL` - Your Jira instance URL
- `JIRA_EMAIL` - Your Atlassian account email
- `JIRA_API_TOKEN` - Your Atlassian API token
- `JIRA_TEAM_BOARD_ID` - Optional: Team sprint board ID
- `JIRA_BUGS_BOARD_ID` - Optional: Bugs board ID

**Tools:**
- `get_ticket_details` - Get ticket information
- `search_tickets_jql` - Search with JQL
- `get_board_issues` - Get board/sprint issues
- `get_ptls_board_bugs` - Get PTLS bugs
- `get_absences_bugs` - Get Absences team bugs
- `get_team_names` - List team names

[Full Documentation →](Jira/README.md)

---

### GitHub Server

**Purpose:** Access GitHub PR information and diffs.

**Prerequisites:**
- GitHub CLI (`gh`) installed and authenticated: `gh auth login`

**Tools:**
- `github_pr_info` - Get PR title, body, branch, and diff
- `github_pr_diff` - Get PR diff only
- `github_auth_status` - Check GitHub CLI auth status

[Full Documentation →](GitHub/README.md)

---

### CodeReview Server

**Purpose:** Automated code reviews combining GitHub PRs with Jira tickets.

**Prerequisites:**
- GitHub CLI (`gh`) authenticated
- Atlassian CLI (`acli`) authenticated (optional)

**Setup:**
```bash
cd CodeReview
cp .env.example .env  # Optional for Jira integration
npm test
```

**Tools:**
- `codereview` - Comprehensive PR review with Jira integration

**Features:**
- Fetches PR diffs and metadata
- Links to Jira tickets automatically
- Analyzes code for common issues
- Generates formatted review reports

[Full Documentation →](CodeReview/README.md)

---

### Atlassian Server

**Purpose:** Atlassian/Jira CLI integration with auto-authentication.

**Prerequisites:**
- Atlassian CLI (`acli`) installed

**Setup:**
```bash
cd Atlassian
cp .env.example .env  # Optional for auto-auth
npm test
```

**Tools:**
- `jira_ticket_info` - Get ticket information
- `jira_extract_ticket_from_text` - Extract ticket keys from text
- `jira_open_ticket` - Open ticket in browser
- `jira_auth_status` - Check auth status

[Full Documentation →](Atlassian/README.md)

---

### CloudWatch Server

**Purpose:** Query AWS CloudWatch Logs using Log Insights.

**Prerequisites:**
- AWS credentials configured (IAM user or SSO)

**Setup:**
```bash
cd CloudWatch
cp .env.example .env
# Edit .env with AWS credentials (or use AWS CLI config)
npm test
```

**Environment Variables:**
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID` - Optional: AWS access key
- `AWS_SECRET_ACCESS_KEY` - Optional: AWS secret key
- `AWS_SESSION_TOKEN` - Optional: For temporary credentials

**Required IAM Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "logs:DescribeLogGroups",
      "logs:StartQuery",
      "logs:GetQueryResults"
    ],
    "Resource": "*"
  }]
}
```

**Tools:**
- `query_logs` - Execute Log Insights queries
- `list_log_groups` - List log groups
- `get_recent_logs` - Get recent logs from a group

[Full Documentation →](CloudWatch/README.md)

---

## 🛠️ Development

### Project Structure

```
claude-mcps/
├── MySQL/
│   ├── src/
│   │   ├── index.js       # Main server
│   │   └── test.js        # Test script
│   ├── .env.example       # Config template
│   ├── package.json
│   ├── start-mcp.sh       # Startup script
│   └── README.md
├── Jira/
│   ├── src/
│   │   ├── index.js
│   │   ├── jira-client.js
│   │   └── test.js
│   └── ...
├── (other servers follow same pattern)
├── package.json           # Root workspace
└── README.md             # This file
```

### Common Commands

```bash
# Install all dependencies (uses npm workspaces)
npm install

# Register all servers with Claude Code
npm run register

# Unregister all servers
npm run unregister

# Test individual server
cd ServerName && npm test

# Test all servers
npm test

# Start a server manually
cd ServerName && npm start
# or
./ServerName/start-mcp.sh
```

### Environment Variables

All servers use Node.js built-in `--env-file=.env` flag (Node 24.9.0+). No external packages like `dotenv` are needed.

Create `.env` files from templates:
```bash
cp ServerName/.env.example ServerName/.env
```

## 📝 Managing Servers in Claude Code

### Add a Server
```bash
claude mcp add <name> /path/to/server/start-mcp.sh
```

### List Servers
```bash
claude mcp list
```

### Remove a Server
```bash
claude mcp remove <name>
```

### Update Server Path
```bash
claude mcp remove <name>
claude mcp add <name> /new/path/start-mcp.sh
```

## 🔒 Security

- All `.env` files are gitignored - never commit credentials
- `.env.example` files provide templates with placeholders
- Use `.gitignore` to protect sensitive files
- API tokens and passwords should use environment variables

## 🤝 Contributing

1. Follow the existing server structure
2. Include `.env.example` with all required variables
3. Add `start-mcp.sh` script for easy registration
4. Create comprehensive README for your server
5. Add test script in `src/test.js`
6. Update this main README with server information

## 📄 License

MIT - See individual server directories for specific licenses.

## 👤 Author

Teolin

## 🔗 Links

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Claude Code Documentation](https://docs.claude.com/claude-code)
