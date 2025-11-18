# MCP Servers

## What in the Devil's name are those...?

Think of MCP servers as smart-ish middleware between the agent's tools and the agent. An agent is basically a glorified chat-bot with tools. You can create your own coding agent starting from Codellama or DeepSeek by adding a minimum of 4 tools: file reader/editor, shell client, web-clinet, debugger. Think of these as supplementary abilities, besides the chat-bot's skill of diplomatically serving you bullshit.

MCP stands for Model-Context Protocoll, a fancy-ass name for a framework that lets AI agents handle structured inputs (basically JSON), manage context across tasks, and produce more consistent, meaningful outputs.

Now, since you cannot modify the built-in tools that Claude Code or Gemini CLI ship with, you can extend these with your own: the mighty MCP servers.

Think of these as functions you can call. They're like little Lambdas or Google Functions, running locally. There's a plethora of them freely available, which may or may not come with massive security risks. Good luck with those. You can create them with Node, Python, whatever you fancy. You can ask your AI agent to build them for you. It's basically just a one-file project.

Setup: Create a small server app exposing one or more functions, like code_review(pull_request_id), then register the tool so that your agent can "see" them (usually with mcp add my-code_review-server --scope user /path/to/server). Verify with `claude mcp list` to ensure it shows "✓ Connected".

Run with - every service differs: mcp__code_review_review 1234 (Claude) or cursor.agent.codeReview(pull_request_id) (you guessed it, Cursor) etc. You can also @-mention them to toggle on/off, or use `/mcp` to see all available tools from connected servers.

Pros: Scoped, accepts params, can authenticate and integrate with external services, very flexible

Cons: more complex, needs a repo to share with the team.
