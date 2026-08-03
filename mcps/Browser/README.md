# Browser MCP

Local browser automation for any MCP client. Control a real Chrome instance with tabs, navigation, clicks, form entry, screenshots, and network capture.

## Install

Clone the repo and install dependencies:

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/Browser
npm install
```

Then register the server with your client. Claude Code:

```bash
claude mcp add --scope user browser -- node /absolute/path/to/mcps/Browser/mcp-server.js
```

Or, for a client that reads an `mcpServers` config file:

```json
{
  "mcpServers": {
    "browser": {
      "command": "node",
      "args": ["/absolute/path/to/mcps/Browser/mcp-server.js"],
      "transport": "stdio"
    }
  }
}
```

## Tools

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

## Requirements

- Node.js 18+
- Chrome or Chromium (a Puppeteer-managed build is downloaded on first use)
- macOS for the local OCR feature

## License

MIT
