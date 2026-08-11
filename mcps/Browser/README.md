# Browser MCP Server

## Features

Local Chrome automation for any MCP client. Drives a real browser — tabs, navigation, clicks, form
entry, screenshots and network capture — through Puppeteer.

- **Real Chrome**: headed or headless, with a persistent profile so logins survive restarts
- **Cheap page reading**: accessibility snapshots instead of screenshots, so no vision tokens
- **Full interaction**: click, type, select, scroll, key presses, multi-field form fill
- **Network capture**: record and read requests made by a page
- **Batching**: run several actions in one call
- **Local OCR**: extract text from an image with Apple Vision, on macOS

## Prerequisites

- Node.js >= 18
- Chrome or Chromium — a Puppeteer-managed build is downloaded on first use
- macOS, for the optional OCR tool

No configuration and no `.env`: this server needs no credentials.

## Setup and Usage

Three ways to run this server. Pick one — they all end with the same MCP registered in your agent.

| Method         | What it does                              | Use it when                            |
| -------------- | ----------------------------------------- | -------------------------------------- |
| **npx**        | Downloads and runs on demand, nothing kept | Trying it out, or always want latest    |
| **npm install**| Installs once, runs from disk              | Daily use — fastest start, works offline |
| **clone repo** | Runs your own source copy                  | You want to change the server code       |

### npx

No install. npx fetches the package on first run and caches it, so the first start is slower.

```bash
claude mcp add browser --scope user -- npx --yes @teolin/mcp-browser
gemini mcp add browser npx --yes @teolin/mcp-browser
```

### npm install

Installed once, so startup is instant and works offline. You update it yourself with `npm update`.

```bash
# Global — available in every project (recommended)
npm install --global @teolin/mcp-browser
claude mcp add browser --scope user -- mcp-browser
gemini mcp add browser mcp-browser

# Local — pinned to one project, shared with your team through package.json
npm install @teolin/mcp-browser
claude mcp add browser --scope project -- node ./node_modules/@teolin/mcp-browser/mcp-server.js
```

### clone repo

Runs the source directly, so your edits take effect at the next restart. Needed for unpublished changes.

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/Browser
npm install
claude mcp add browser --scope user -- "$PWD/start-mcp.sh"
```

### Other agents

Same three methods apply — only the registration command changes. Each example below uses npx; for
**npm install** swap `npx --yes @teolin/mcp-browser` for `mcp-browser`, and for **clone repo** swap it for the absolute
path to `start-mcp.sh`.

**GitHub Copilot CLI** — `copilot mcp add`, or `/mcp add` inside a session, or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "browser": {
      "type": "local",
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-browser"],
      "env": {},
      "tools": ["*"]
    }
  }
}
```

**OpenAI Codex CLI** — one command, or edit `~/.codex/config.toml`:

```bash
codex mcp add browser -- npx --yes @teolin/mcp-browser
```

```toml
[mcp_servers.browser]
command = "npx"
args = ["--yes", "@teolin/mcp-browser"]
```

**Devin** — one command, or edit `.devin/mcp_config.json` (put secrets in the gitignored `.devin/mcp_config.local.json`):

```bash
devin mcp add browser -- npx --yes @teolin/mcp-browser
```

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-browser"],
      "env": {}
    }
  }
}
```

**Goose** — `goose configure` → *Add Extension* → *Command-line Extension*, or edit `~/.config/goose/config.yaml`:

```yaml
extensions:
  browser:
    type: stdio
    name: browser
    enabled: true
    cmd: npx
    args: ["--yes", "@teolin/mcp-browser"]
    envs: {}
    timeout: 300
```

### Verify and remove

```bash
claude mcp list
gemini mcp list

claude mcp remove browser --scope user
gemini mcp remove browser
```

---

## Available Tools

`launch` returns a `pageId`. Every other tool needs it.

### Browser lifecycle

- `launch` — start Chrome (`headless` optional, defaults to headed)
- `close_browser` — close it
- `new_tab` / `close_tab` — tab management
- `list_pages` — tabs tracked by this session
- `list_open_pages` — all tabs in the running Chrome, including ones this session did not open
- `set_viewport` — set a tab's viewport

### Navigation

- `navigate` — go to a URL
- `go_back` — back in history
- `wait_for` — wait for an element to appear

### Page inspection

- `snapshot` — accessibility tree with interactive `ref`s. Cheapest way to see a page; use it before reaching for a screenshot
- `get_text` — text of the page or an element
- `get_links` / `get_inputs` — lists
- `screenshot` — image, optionally with local OCR
- `ocr` — extract text from an image file via local Apple Vision OCR

### Interaction

- `click` / `click_ref` — by selector/text/coordinates, or by snapshot `ref`
- `type` / `type_ref`
- `fill_form` — set many fields at once, optionally submit; much faster than one `type` per field
- `press_key`
- `select`
- `scroll`
- `eval` — run custom JavaScript

### Network

- `network_monitor` — start/stop request capture on a page. Start it *before* the action you want to observe
- `get_network_requests` — read captured requests (requires `network_monitor` enabled)

### Batching

- `batch` — run several actions sequentially in one call, saving round trips. Take a `snapshot` first, then batch actions against those refs

## Usage Examples

### Example 1: Read a page
```javascript
// In Claude Code:
"Open digi24.ro and tell me the top headlines"
// Uses: launch -> navigate -> get_text
```

### Example 2: Interact with a form
```javascript
// In Claude Code:
"Log into the staging admin panel and open the users list"
// Uses: snapshot -> fill_form -> click_ref
```

### Example 3: Watch network traffic
```javascript
// In Claude Code:
"Open the checkout page and show me which API calls it makes"
// Uses: network_monitor -> navigate -> get_network_requests
```

## How to interact with an element

- If you know the element already, use `click` or `type` with a CSS `selector`.
- If you need to find what is on the page, use `snapshot` to get an accessibility tree and `refs`, then `click_ref` / `type_ref`.
- `eval` is best for one-off DOM checks or custom actions.

## Profile

Chrome runs against a dedicated profile at `~/.browser-mcp-profile`, so cookies and logins persist between runs. One profile means one Chrome at a time — a second `launch` fails while an instance is still up. Delete the directory to reset all saved sessions.

## Security

- All code is local. No telemetry or remote calls.
- `list_open_pages` discovers an already-running Chrome via a local debug port (`127.0.0.1`).
- The optional REST server (`npm run server`) is off by default and binds to `localhost`.
- OCR runs locally with the Apple Vision framework on macOS.

## License

MIT
