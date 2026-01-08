export const tools = [
  {
    name: "codereview",
    description:
      "Automated code review for GitHub PRs with Jira integration (orchestrates GitHub and Atlassian MCPs)",
    inputSchema: {
      type: "object",
      properties: {
        pr: {
          type: ["string", "number"],
          description: "GitHub PR number or branch name to review",
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
]
