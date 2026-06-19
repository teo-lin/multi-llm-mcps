export const tools = [
  {
    name: "search_onyx",
    description:
      "Keyword search across the Onyx knowledge base (indexed Jira, Confluence, GitHub, web pages and uploaded files). " +
      "Returns the most relevant documents with a matching snippet and a link. " +
      "Use this to ground answers in Doctari's internal knowledge. " +
      "Note: this is lexical/keyword matching, not semantic — prefer specific terms over vague questions.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search terms. Use concrete keywords (names, identifiers, error strings) rather than full sentences.",
        },
        source_type: {
          type: "string",
          description:
            "Optional filter by source. One of: confluence, jira, github, web, file.",
          enum: ["confluence", "jira", "github", "web", "file"],
        },
        max_results: {
          type: "number",
          description: "Maximum number of documents to return (default 10).",
          default: 10,
        },
      },
      required: ["query"],
    },
  },
]
