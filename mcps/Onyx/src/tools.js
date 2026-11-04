export const tools = [
  {
    name: "search_onyx",
    annotations: { readOnlyHint: true },
    description:
      "Keyword search across the Onyx knowledge base (indexed Jira, Confluence, GitHub, web pages and uploaded files). " +
      "Returns the most relevant documents with a matching snippet and a link. " +
      "Use this to ground answers in Doctari's internal knowledge. " +
      "Searches by meaning as well as words, so plain-English questions work well.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "What you want to know. A full question works; so do specific names, identifiers or error strings.",
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
