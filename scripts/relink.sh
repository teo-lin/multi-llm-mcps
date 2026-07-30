#!/bin/bash
# Re-point the stable symlink used by MCP registrations at this repo's current location.
#
# Claude Code stores an absolute `command` path for every stdio MCP server, so renaming
# or moving this repo breaks every registration. To avoid that, all registrations point
# at a fixed path (~/.mcp) which is a symlink to wherever this repo actually lives.
# After renaming or moving the repo, run this script once — no re-registration needed.

# -e exit on error, -u error on unset var, -o pipefail fail on any pipe stage.
# The `set` builtin has no long-option forms.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LINK="${MCP_LINK:-$HOME/.mcp}"

if [ -e "$LINK" ] && [ ! -L "$LINK" ]; then
  echo "Refusing to touch $LINK: exists and is not a symlink." >&2
  exit 1
fi

# BSD ln (macOS) has no long options: -s symbolic, -f force, -n no-dereference
# (replace the symlink itself rather than following it into its target directory).
ln -sfn "$ROOT_DIR" "$LINK"

echo "Linked: $LINK -> $ROOT_DIR"

# Sanity check: every launcher must be reachable through the symlink.
missing=0
for script in "$LINK"/mcps/*/start-mcp.sh; do
  if [ ! -x "$script" ]; then
    echo "  not executable: $script" >&2
    missing=1
  fi
done
[ "$missing" -eq 0 ] && echo "All launchers reachable via $LINK/mcps/*/start-mcp.sh"
