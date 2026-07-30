# Multi LLM MCP Servers

A comprehensive collection of Model Context Protocol (MCP) servers for Claude Code, Gemini, Copilot, providing integrations with MySQL, Jira, GitHub, CloudWatch, Azure AD, and more.

## Setup

git clone https://github.com/teo-lin/multi-llm-mcps
cd mcp-servers
npm run setup

Edit the `.env` files in each MCP directory with your credentials

### Manually register a single mcp server
```bash
## ADD GitHub 0.2k tokens
claude mcp add github --scope user -- npx --yes @teolin/mcp-github
# REMOVE
claude mcp remove github --scope user
```

### Or... Install official ones and see your tokens fly out the window. Context window.
```bash

## ADD GitHub 5.1k tokens
claude mcp add github --scope user -- npx --yes @modelcontextprotocol/server-github
## REMOVE
claude mcp remove github --scope user 

## ADD Playwright 3.6k tokens
claude mcp add playwright --scope user -- npx --yes @playwright/mcp@latest
## REMOVE
claude mcp remove playwright --scope user 

```

## Available MCP Servers

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

### 9. **MSK** (`msk`)

AWS MSK (Managed Streaming for Kafka) with protobuf message decoding.

**Tools:**

- `list_clusters` - List MSK clusters
- `get_cluster_details` - Get cluster information
- `list_topics` - List Kafka topics
- `get_topic_metadata` - Get partition/offset info
- `browse_messages` - Browse messages from partition/offset
- `search_messages` - Search across partitions
- `list_protobuf_types` - List available protobuf message types

**Features:**

- Direct AWS MSK integration via AWS SDK
- KafkaJS for Kafka operations
- Protobuf message decoding using `@doctaridev/io.planer.library.npm.protobuf`
- Support for IAM, TLS, and plaintext authentication

**Prerequisites:** AWS credentials configured, network access to MSK cluster

**Configuration:** `MSK/.env`

---

## Management Scripts

```bash
# Setup everything (first time)
npm run setup

# Register all servers
npm run register

# Unregister all servers
npm run unregister

# Re-point the stable symlink after renaming or moving this repo
./scripts/relink.sh
```

### Path independence

Claude Code stores an absolute `command` path per stdio server, so registrations would
break every time this folder is renamed or moved. To avoid that, servers are registered
under a fixed path — `~/.mcp/mcps/<Server>/start-mcp.sh` — where `~/.mcp` is a symlink to
this repo. After a rename or move, run `./scripts/relink.sh` once; no re-registration and
no config edits needed. `register-all.sh` calls it automatically. Override the link
location with `MCP_LINK=/some/path`.

## Documentation

Each MCP server has its own README with detailed documentation:

- [MySQL README](MySQL/README.md)
- [Jira README](Jira/README.md)
- [GitHub README](GitHub/README.md)
- [CodeReview README](CodeReview/README.md)
- [Atlassian README](Atlassian/README.md)
- [CloudWatch README](CloudWatch/README.md)
- [AzureAD README](AzureAD/README.md)
- [Kafdrop README](Kafdrop/README.md)
- [MSK README](MSK/README.md)

## Requirements

- **Node.js**: 25.2.1 (automatically installed by setup script)
- **Claude Code**: Latest version
- **GitHub CLI**: For GitHub and CodeReview MCPs (`brew install gh`)
- **Atlassian CLI**: For Atlassian and CodeReview MCPs
- **AWS CLI**: For CloudWatch MCP (credentials configured)

## Security

- Never commit `.env` files to version control
- All `.env` files are in `.gitignore`
- API tokens and credentials are stored locally only
- Each MCP runs in isolated process

# Introduction to MCP Servers

## What in the Devil's name are those...?

Think of MCP servers as smart-ish middleware between the agent's tools and the agent. An agent is basically a glorified chat-bot with tools. You can create your own coding agent starting from Codellama or DeepSeek by adding a minimum of 4 tools: file reader/editor, shell client, web-clinet, debugger. Think of these as supplementary abilities, besides the chat-bot's skill of diplomatically serving you bullshit.

MCP stands for Model-Context Protocoll, a fancy-ass name for a framework that lets AI agents handle structured inputs (basically JSON), manage context across tasks, and produce more consistent, meaningful outputs.

Now, since you cannot modify the built-in tools that Claude Code or Gemini CLI ship with, you can extend these with your own: the mighty MCP servers.

Think of these as functions you can call. They're like little Lambdas or Google Functions, running locally. There's a plethora of them freely available, which may or may not come with massive security risks. Good luck with those. You can create them with Node, Python, whatever you fancy. You can ask your AI agent to build them for you. It's basically just a one-file project.

Setup: Create a small server app exposing one or more functions, like code_review(pull_request_id), then register the tool so that your agent can "see" them (usually with mcp add my-code_review-server --scope user /path/to/server). Verify with `claude mcp list` to ensure it shows " Connected".

Run with - every service differs: mcp__code_review_review 1234 (Claude) or cursor.agent.codeReview(pull_request_id) (you guessed it, Cursor) etc. You can also @-mention them to toggle on/off, or use `/mcp` to see all available tools from connected servers.

Pros: Scoped, accepts params, can authenticate and integrate with external services, very flexible

Cons: more complex, needs a repo to share with the team.

## Slow down...

### WHAT

| Aspect  | Knowledge Base          | Driver / Runtime        | Workflow                  | Tool (MCP Servers)         | AI Coding Agent          |
| ------- | ----------------------- | ----------------------- | ------------------------- | -------------------------- | ------------------------ |
| What    | Model (LLM)             | API + Query Tool        | Shortcuts: Skill/Command  | Background dormant process | UI/CLI: AI orchestrator  |
| Why     | Store knowledge         | Access information      | Automate operations       | External service as tool   | Analyze, plan, do, test  |
| How     | Tokenize & Predict next | Run models, serve API   | `/cmd` syntax calls MCPs  | Listen → Execute → Retry   | Select tools → iterate   |
| Example | Qwen4, DeepSeek         | Ollama, LM Studio       | `/commit` git flow        | `mcp-github, mcp-mysql`    | Cloud/Local, CLI/IDE/UI  |

- **AI Agents by Category**

| Interface      | Cloud (paid/proprietary)                 | Local                            |
| -------------- | ---------------------------------------- | -------------------------------- |
| CLI            | Claude Code, Gemini-CLI, Codex           | Goose, PicoClaw, OpenClaw        |
| IDE / UI       | Cursor, Windsurf, Antigravity, Cline     | LM Studio, Comfy UI, Auto1111    |
| IDE Extensions | Q, Rovo, MS Copilot, GH Copilot, CodeGPT | Continue                         |
| Browser        | Bolt, Lovable, Vercel v0, Replit         | HuggingFace Spaces, Codespaces   |

### WHY

Anthropic's baby, widely adopted. It's a **standardized protocol** that connects AI models and coding assistants to external tools and services in a **structured, cost-friendly way**.
- Because you don't wanna:
  - Copy-paste credentials and secrets into chat willy-nilly.
  - Manually describe API responses a zillion times per day
  - Explain your coding slave what and how to use every single time

- You want:
  - Secure, sandboxed access to tools
  - Structured tool descriptions
  - Automatic tool selection by AI based on task
  - Scalable across multiple AI platforms / agents


### HOW

#### Core Pattern: Tools That Return Minimal, Structured Data

An MCP Server wraps external services (GitHub, databases, APIs) as tools, returning Minimal, Structured Data
Typical Structure:
├── tools.js          # Define what tools do (name, description, input schema)
├── handlers.js       # Implement tool logic (call API/service, parse output)
├── index.js          # Wire it up (Server → ListTools → CallTools)
└── .env              # Keep your passwords and tokens safe (use .gitignore as well)

#### Core Pattern: Context Window Optimization

| Principle                | Goal                        | How                                                                 |
| ------------------------ | --------------------------- | ------------------------------------------------------------------- |
| **Precise Descriptions** | AI understands purpose      | "Get PR details" not verbose explanation                            |
| **Structured I/O**       | Prevent errors & min tokens | `{title, branch}` not raw API response with metadata/headers/status |
| **Minimal Result Sets**  | Keep context lean           | `LIMIT 100` not all 10k rows                                        |
| **Clear Error Messages** | Fast failure recovery       | `{error: "reason", suggestion: "fix"}`                              |

**Real Result:** GitHub PR queries drop from 2000-10k tokens → 300-800 tokens (75%+ savings).

### Resources

- **MCP Specification:** https://modelcontextprotocol.io/
- **Official MCP Servers:** https://github.com/modelcontextprotocol/servers
- **NPM Packages:** https://www.npmjs.com/search?q=%40teolin
