# Browser MCP

Local browser automation for any MCP client. Control a real Chrome instance with tabs, clicks, form entry, screenshots, and more.

## Install

```bash
npm install -g browser
```

Then add the MCP server to your client. For example, in `~/.config/devin/mcp_config.json`:

```json
{
  "mcpServers": {
    "browser_mcp": {
      "command": "browser",
      "transport": "stdio"
    }
  }
}
```

## Tools

### Browser lifecycle

- `launch` — start a new Chrome browser
- `close_browser` — close it
- `new_tab` / `close_tab` — tab management
- `list_pages` / `list_open_pages` — list tabs
- `set_viewport` — set a tab's viewport

### Page inspection

- `snapshot` — accessibility tree with interactive refs
- `get_text` — text of page or an element
- `get_links` / `get_inputs` — lists
- `screenshot` — image, optionally with local OCR

### Interaction

- `click` / `click_ref`
- `type` / `type_ref`
- `press_key`
- `select`
- `scroll`
- `wait_for`
- `eval` — run custom JavaScript

## How to interact with an element

- If you know the element already, use `click` or `type` with a CSS `selector`.
- If you need to find what is on the page, use `snapshot` to get an accessibility tree and `refs`.
- `eval` is best for one-off DOM checks or custom actions.

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
