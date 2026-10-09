export const tools = [
  {
    name: "authenticate",
    description: "Authenticate with Azure AD using device code flow",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_access_token",
    description:
      "Get the current access token (will trigger authentication if needed)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "check_auth_status",
    description: "Check if currently authenticated and token validity",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "clear_token_cache",
    description: "Clear the cached access token",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "make_authenticated_request",
    description: "Make an HTTP request with Azure AD authentication",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL to make the request to",
        },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
          description: "HTTP method (default: GET)",
        },
        headers: {
          type: "object",
          description: "Additional headers to include",
        },
        body: {
          type: "object",
          description: "Request body (for POST/PUT/PATCH)",
        },
      },
      required: ["url"],
    },
  },
]
