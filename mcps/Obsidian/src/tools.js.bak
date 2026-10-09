export const tools = [
  {
    name: "read_file",
    description:
      "Read a UTF-8 text file from the vault. Path is relative to the vault root (e.g. 'wiki/index.md', 'raw/articles/foo.md').",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path relative to the vault root",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description:
      "Create or overwrite a UTF-8 text file in the vault. Denied for anything under raw/ (immutable sources). Creates parent directories as needed.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path relative to the vault root (NOT under raw/)",
        },
        content: {
          type: "string",
          description: "Full file content to write",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "append_file",
    description:
      "Append text to a file in the vault (e.g. wiki/log.md). Creates the file if missing. Denied for anything under raw/.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path relative to the vault root (NOT under raw/)",
        },
        content: {
          type: "string",
          description: "Text to append",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_dir",
    description:
      "List entries of a directory in the vault. Returns names with a trailing '/' for directories. Omit path to list the vault root.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Directory path relative to the vault root (default: root)",
        },
      },
    },
  },
  {
    name: "search",
    description:
      "Recursively search vault text files. Matches a literal substring by default; set regex:true for a regular expression. Skips node_modules, .git, .obsidian and symlinks. Returns file:line matches.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Substring to search for (or a regex when regex:true). Max 1000 chars.",
        },
        path: {
          type: "string",
          description: "Optional subdirectory to limit the search (default: whole vault)",
        },
        max_results: {
          type: "number",
          description: "Optional cap on matches returned (default 200)",
        },
        regex: {
          type: "boolean",
          description: "Treat query as a regular expression instead of a literal substring (default false).",
        },
      },
      required: ["query"],
    },
  },
]
