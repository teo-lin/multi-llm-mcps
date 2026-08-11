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
- macOS, for the optional OCR tool
- no config, no `.env`, no credentials.

## Setup

Four ways to run this server. Pick one:

| Setup              | What it does                                   | Use it when                                | How to                                                                                            |
| ------------------ | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| _none (npx)_     | Downloads and runs on demand, nothing kept     | Trying it out, or always want latest       |                                                                                                   |
| _global (npm)_   | Installs once, runs from disk, offline         | Fastest start, works offline, all projects | `npm install --global @teolin/mcp-browser`                                                      |
| _local (npm)_    | Install per project / repository, runs offline | Fast, offline, Project/team specific       | `npm install @teolin/mcp-browser`                                                               |
| _custom (clone)_ | Runs your own source copy                      | You want to change the server code         | `git clone https://github.com/teo-lin/multi-llm-mcps.git && cd multi-llm-mcps && npm run setup` |

### Usage

Once installed, the server must be registered with your preferred agent(s), so the agent(s) can use it. Pick the relevant one(s) for you.

```bash
# no setup (npx):
claude mcp add browser --scope user -- npx --yes @teolin/mcp-browser
gemini mcp add browser npx --yes @teolin/mcp-browser
codex  mcp add browser -- npx --yes @teolin/mcp-browser
devin  mcp add browser --scope user -- npx --yes @teolin/mcp-browser

# global setup (npm --global): same commands, with the binary instead of npx
claude mcp add browser --scope user -- mcp-browser
gemini mcp add browser mcp-browser
codex  mcp add browser -- mcp-browser
devin  mcp add browser --scope user -- mcp-browser

# local setup (npm, one project): point at the installed file
claude mcp add browser --scope project -- node ./node_modules/@teolin/mcp-browser/mcp-server.js

# custom (clone): register every server in this repo, from the repo root
bash scripts/register-all.sh
# or register just this one, from mcps/Browser:
claude mcp add browser --scope user -- "$PWD/start-mcp.sh"
gemini mcp add browser --scope user "$PWD/start-mcp.sh"
codex  mcp add browser -- "$PWD/start-mcp.sh"
devin  mcp add browser --scope user -- "$PWD/start-mcp.sh"
```


### Verify and remove

```bash
claude mcp list
gemini mcp list
codex  mcp list
devin  mcp list

claude mcp remove browser --scope user
gemini mcp remove browser --scope user
codex  mcp remove browser
devin  mcp remove browser --scope user
```

`claude mcp get browser`, `codex mcp get browser` and `devin mcp get browser` show one server in
detail. `devin` removes from `local` scope unless you pass `--scope`, so remove from the same scope
you added to.


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

- `network_monitor` — start/stop request capture on a page. Start it _before_ the action you want to observe
- `get_network_requests` — read captured requests (requires `network_monitor` enabled)

### Batching

- `batch` — run several actions sequentially in one call, saving round trips. Take a `snapshot` first, then batch actions against those refs

## Usage Examples

### Example 1: Read a page

```javascript
// In Claude Code:
"Open digi24.ro and tell me the top headlines";
// Uses: launch -> navigate -> get_text
```

### Example 2: Interact with a form

```javascript
// In Claude Code:
"Log into the staging admin panel and open the users list";
// Uses: snapshot -> fill_form -> click_ref
```

### Example 3: Watch network traffic

```javascript
// In Claude Code:
"Open the checkout page and show me which API calls it makes";
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
