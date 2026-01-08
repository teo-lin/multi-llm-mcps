export const tools = [
  {
    name: "github_pr_info",
    description:
      "Get GitHub PR information including title, body, branch name and diff",
    inputSchema: {
      type: "object",
      properties: {
        pr: {
          type: ["string", "number"],
          description: "GitHub PR number, URL, or branch name",
        },
        working_directory: {
          type: "string",
          description:
            "Optional: Working directory path (defaults to current working directory)",
        },
      },
      required: ["pr"],
    },
  },
  {
    name: "github_pr_diff",
    description: "Get GitHub PR diff only",
    inputSchema: {
      type: "object",
      properties: {
        pr: {
          type: ["string", "number"],
          description: "GitHub PR number, URL, or branch name",
        },
        working_directory: {
          type: "string",
          description:
            "Optional: Working directory path (defaults to current working directory)",
        },
      },
      required: ["pr"],
    },
  },
  {
    name: "github_auth_status",
    description: "Check GitHub CLI authentication status",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
]
