# Claude MCP Servers

A comprehensive collection of Model Context Protocol (MCP) servers for Claude Code, providing integrations with MySQL, Jira, GitHub, CloudWatch, Azure AD, and more.

## ⏭️ Quick Start

```bash
git clone https://github.com/teo-lin/claude-mcps.git
cd claude-mcps
npm run setup
```
Edit the `.env` files in each MCP directory with your credentials


## 📦 Available MCP Servers

### 1. **MySQL** (`mysql`)
Connect to MySQL databases, execute queries, and manage schemas.

**Tools:**
- `query` - Execute SQL queries with parameterized placeholders
- `list_databases` - List all databases
- `list_tables` - List tables in a database
- `describe_table` - Show table structure

**Configuration:** `MySQL/.env`

---

### 2. **Jira** (`jira`)
Comprehensive Jira integration with advanced querying capabilities.

**Tools:**
- `get_ticket_details` - Get ticket information
- `search_tickets_jql` - Search using JQL
- `get_board_issues` - Get sprint board issues
- `get_ptls_board_bugs` - Get PTLS bugs by team
- `get_absences_bugs` - Get Absences team bugs
- `get_team_names` - List team names

**Configuration:** `Jira/.env`

---

### 3. **GitHub** (`github`)
GitHub operations using GitHub CLI.

**Tools:**
- PR information and diffs
- Repository context extraction
- Multiple PR identifier formats support

**Prerequisites:** GitHub CLI (`gh`) authenticated

**Configuration:** `GitHub/.env`

---

### 4. **CodeReview** (`code-review`)
Automated PR code review with Jira integration.

**Tools:**
- `codereview` - Automated PR analysis with Jira context

**Features:**
- Fetches PR diffs and metadata
- Retrieves Jira requirements
- Runs tests and linting
- Generates AI-powered review

**Prerequisites:** GitHub CLI + Atlassian CLI

**Configuration:** `CodeReview/.env`

---

### 5. **Atlassian** (`atlassian`)
Atlassian Jira operations via Atlassian CLI.

**Tools:**
- `jira_ticket_info` - Get ticket details
- `jira_extract_ticket_from_text` - Extract ticket keys
- `jira_open_ticket` - Open in browser
- `jira_auth_status` - Check authentication

**Prerequisites:** Atlassian CLI (`acli`) authenticated

**Configuration:** `Atlassian/.env`

---

### 6. **CloudWatch** (`cloudwatch`)
Query AWS CloudWatch Logs using Log Insights.

**Tools:**
- `query_logs` - Execute CloudWatch Logs Insights queries
- `list_log_groups` - Browse log groups
- `get_recent_logs` - Quick access to recent entries

**Prerequisites:** AWS credentials configured

**Configuration:** `CloudWatch/.env`

---

### 7. **AzureAD** (`azuread`)
Azure Active Directory authentication with OAuth 2.0.

**Tools:**
- `authenticate` - Device code flow authentication
- `get_access_token` - Get current token
- `check_auth_status` - Check authentication
- `clear_token_cache` - Force re-authentication
- `make_authenticated_request` - Authenticated HTTP requests

**Configuration:** `AzureAD/.env`

---

### 8. **Kafdrop** (`kafdrop`)
Kafka cluster inspection via Kafdrop Web UI.

**Tools:**
- `list_topics` - View all topics
- `get_topic_details` - Topic information
- `browse_messages` - Read messages
- `list_consumer_groups` - Monitor consumers
- `list_brokers` - List Kafka brokers
- `search_messages` - Search for messages

**Configuration:** `Kafdrop/.env`

---

## 🛠️ Management Scripts

```bash
# Setup everything (first time)
npm run setup

# Register all servers
npm run register

# Unregister all servers
npm run unregister
```

## 📚 Documentation

Each MCP server has its own README with detailed documentation:

- [MySQL README](MySQL/README.md)
- [Jira README](Jira/README.md)
- [GitHub README](GitHub/README.md)
- [CodeReview README](CodeReview/README.md)
- [Atlassian README](Atlassian/README.md)
- [CloudWatch README](CloudWatch/README.md)
- [AzureAD README](AzureAD/README.md)
- [Kafdrop README](Kafdrop/README.md)

## 🔧 Requirements

- **Node.js**: 24.9.0 (automatically installed by setup script)
- **Claude Code**: Latest version
- **GitHub CLI**: For GitHub and CodeReview MCPs (`brew install gh`)
- **Atlassian CLI**: For Atlassian and CodeReview MCPs
- **AWS CLI**: For CloudWatch MCP (credentials configured)

## 🏗️ Architecture

All MCPs are registered in **user config** (`~/.claude.json`), making them available globally across all your projects.

```
~/.claude.json (user config)
├── mysql
├── jira
├── github
├── code-review
├── atlassian
├── cloudwatch
├── azuread
└── kafdrop
```

## 🔒 Security

- Never commit `.env` files to version control
- All `.env` files are in `.gitignore`
- API tokens and credentials are stored locally only
- Each MCP runs in isolated process

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🆘 Support

For issues or questions:
- Check individual MCP READMEs
- Review `.env.example` files for configuration help
- Verify authentication: `gh auth status`, `acli auth status`
- Check MCP health: `claude mcp list`

---
