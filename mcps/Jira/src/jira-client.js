import axios from "axios"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export class JiraClient {
  constructor() {
    this.baseUrl = process.env.JIRA_BASE_URL || "https://doctari.atlassian.net"
    this.email = process.env.JIRA_EMAIL
    this.apiToken = process.env.JIRA_API_TOKEN

    // Auth strategy: 'oauth' (acli), 'basic' (API token), or 'auto' (try oauth first, fallback to basic)
    this.authStrategy = process.env.JIRA_AUTH_STRATEGY || "auto"

    // Configure axios client for basic auth
    this.hasBasicAuth = !!(this.email && this.apiToken)
    if (this.hasBasicAuth) {
      this.axiosClient = axios.create({
        baseURL: this.baseUrl,
        auth: {
          username: this.email,
          password: this.apiToken,
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
    }

    this.configured = true
    this.oauthAvailable = null // Cache oauth availability check
  }

  _checkConfigured() {
    if (!this.configured) {
      throw new Error("Jira is not configured properly.")
    }
  }

  async _isOAuthAvailable() {
    if (this.oauthAvailable !== null) {
      return this.oauthAvailable
    }

    try {
      const { stdout } = await execAsync("acli jira auth status")
      this.oauthAvailable =
        stdout.includes("") ||
        stdout.includes("authenticated") ||
        stdout.includes("logged in")
      return this.oauthAvailable
    } catch (error) {
      this.oauthAvailable = false
      return false
    }
  }

  async _getTicketViaOAuth(ticketKey) {
    const { stdout } = await execAsync(
      `acli jira workitem view ${ticketKey} --json`
    )
    const ticket = JSON.parse(stdout)

    return {
      key: ticket.key,
      fields: {
        summary: ticket.fields.summary,
        description: ticket.fields.description,
        status: ticket.fields.status,
        assignee: ticket.fields.assignee,
        reporter: ticket.fields.reporter,
        priority: ticket.fields.priority,
        issuetype: ticket.fields.issuetype,
        created: ticket.fields.created,
        updated: ticket.fields.updated,
      },
    }
  }

  async _getTicketViaBasicAuth(ticketKey) {
    if (!this.hasBasicAuth) {
      throw new Error(
        "Basic auth not configured. Set JIRA_EMAIL and JIRA_API_TOKEN environment variables."
      )
    }

    const response = await this.axiosClient.get(
      `/rest/api/3/issue/${ticketKey}`
    )
    return response.data
  }

  async getTicketDetails(ticketKey) {
    this._checkConfigured()

    const errors = []

    // Try OAuth first if strategy is 'oauth' or 'auto'
    if (this.authStrategy === "oauth" || this.authStrategy === "auto") {
      const oauthAvailable = await this._isOAuthAvailable()
      if (oauthAvailable) {
        try {
          console.error(
            `[Jira MCP] Fetching ticket ${ticketKey} via OAuth (acli)`
          )
          return await this._getTicketViaOAuth(ticketKey)
        } catch (error) {
          console.error(`[Jira MCP] OAuth failed: ${error.message}`)
          errors.push(`OAuth: ${error.message}`)

          // If strategy is 'oauth' only, don't try basic auth
          if (this.authStrategy === "oauth") {
            throw new Error(
              `Failed to fetch Jira ticket ${ticketKey} via OAuth: ${error.message}`
            )
          }
        }
      }
    }

    // Try basic auth if strategy is 'basic' or 'auto' (and oauth failed)
    if (this.authStrategy === "basic" || this.authStrategy === "auto") {
      try {
        console.error(
          `[Jira MCP] Fetching ticket ${ticketKey} via Basic Auth (API token)`
        )
        return await this._getTicketViaBasicAuth(ticketKey)
      } catch (error) {
        console.error(`[Jira MCP] Basic auth failed: ${error.message}`)
        errors.push(`Basic Auth: ${error.message}`)
      }
    }

    throw new Error(
      `Failed to fetch Jira ticket ${ticketKey}. All auth methods failed: ${errors.join(
        ", "
      )}`
    )
  }

  async _searchTicketsViaOAuth(jql, maxResults) {
    const { stdout } = await execAsync(
      `acli jira workitem search --jql "${jql.replace(
        /"/g,
        '\\"'
      )}" --limit ${maxResults} --json`
    )
    const result = JSON.parse(stdout)

    return {
      issues: result.issues || [],
      total: result.total || 0,
    }
  }

  async _searchTicketsViaBasicAuth(jql, maxResults) {
    if (!this.hasBasicAuth) {
      throw new Error(
        "Basic auth not configured. Set JIRA_EMAIL and JIRA_API_TOKEN environment variables."
      )
    }

    const response = await this.axiosClient.post("/rest/api/3/search", {
      jql,
      maxResults,
      fields: [
        "summary",
        "status",
        "assignee",
        "reporter",
        "priority",
        "issuetype",
        "created",
        "updated",
        "description",
      ],
    })
    return response.data
  }

  async searchTickets(jql, maxResults = 50) {
    this._checkConfigured()

    const errors = []

    // Try OAuth first if strategy is 'oauth' or 'auto'
    if (this.authStrategy === "oauth" || this.authStrategy === "auto") {
      const oauthAvailable = await this._isOAuthAvailable()
      if (oauthAvailable) {
        try {
          console.error(`[Jira MCP] Searching tickets via OAuth (acli)`)
          return await this._searchTicketsViaOAuth(jql, maxResults)
        } catch (error) {
          console.error(`[Jira MCP] OAuth search failed: ${error.message}`)
          errors.push(`OAuth: ${error.message}`)

          if (this.authStrategy === "oauth") {
            throw new Error(
              `Failed to search Jira tickets via OAuth: ${error.message}`
            )
          }
        }
      }
    }

    // Try basic auth if strategy is 'basic' or 'auto' (and oauth failed)
    if (this.authStrategy === "basic" || this.authStrategy === "auto") {
      try {
        console.error(
          `[Jira MCP] Searching tickets via Basic Auth (API token)`
        )
        return await this._searchTicketsViaBasicAuth(jql, maxResults)
      } catch (error) {
        console.error(`[Jira MCP] Basic auth search failed: ${error.message}`)
        errors.push(`Basic Auth: ${error.message}`)
      }
    }

    throw new Error(
      `Failed to search Jira tickets. All auth methods failed: ${errors.join(
        ", "
      )}`
    )
  }

  async getBoardIssues(boardId, sprintId) {
    this._checkConfigured()

    // For basic auth, we need to use the agile API
    if (
      this.authStrategy === "basic" ||
      (this.authStrategy === "auto" && !(await this._isOAuthAvailable()))
    ) {
      if (!this.hasBasicAuth) {
        throw new Error("Basic auth not configured for board issues.")
      }

      const url = `/rest/agile/1.0/board/${boardId}/issue`
      const params = { maxResults: 100 }

      if (sprintId) {
        params.jql = `sprint = ${sprintId}`
      }

      try {
        const response = await this.axiosClient.get(url, { params })
        return response.data.issues
      } catch (error) {
        console.error(
          `[Jira MCP] Failed to get board issues via basic auth: ${error.message}`
        )
      }
    }

    // Fallback to JQL search
    let jql = `project = board AND board = ${boardId}`
    if (sprintId) {
      jql = `sprint = ${sprintId}`
    }

    const searchResult = await this.searchTickets(jql, 100)
    return searchResult.issues
  }

  async getPtlsBoardBugs(teamName) {
    this._checkConfigured()
    let jql = "project = PTLSNEW AND issuetype = Bug"

    if (teamName) {
      const normalizedTeam = teamName.toLowerCase()
      if (normalizedTeam === "absences") {
        jql += ` AND (assignee in membersOf("absences-team") OR "Team" ~ "Absences")`
      } else {
        jql += ` AND "Team" ~ "${teamName}"`
      }
    }

    const searchResult = await this.searchTickets(jql, 100)
    return searchResult.issues
  }

  async getTeamNames() {
    this._checkConfigured()

    // Try to get team names via basic auth API
    if (this.hasBasicAuth) {
      try {
        const response = await this.axiosClient.get(
          "/rest/api/3/field/search",
          {
            params: {
              query: "team",
              type: "custom",
            },
          }
        )

        const teamFields = response.data.values.filter((field) =>
          field.name.toLowerCase().includes("team")
        )

        if (teamFields.length > 0) {
          const fieldId = teamFields[0].id
          const optionsResponse = await this.axiosClient.get(
            `/rest/api/3/customFieldOption/${fieldId}`
          )
          return (
            optionsResponse.data.values?.map((option) => option.value) || []
          )
        }
      } catch (error) {
        console.warn(
          "Could not fetch team names via API, returning defaults:",
          error
        )
      }
    }

    // Fallback: return common team names
    return ["Absences", "Bookings", "Core", "Platform", "Mobile"]
  }

  async getActiveSprintForBoard(boardId) {
    this._checkConfigured()

    // Try basic auth first
    if (this.hasBasicAuth) {
      try {
        const response = await this.axiosClient.get(
          `/rest/agile/1.0/board/${boardId}/sprint`,
          {
            params: {
              state: "active",
            },
          }
        )

        const activeSprints = response.data.values
        return activeSprints.length > 0 ? activeSprints[0].id : null
      } catch (error) {
        console.warn(
          "Could not fetch active sprint via basic auth:",
          error.message
        )
      }
    }

    // Try OAuth if available
    const oauthAvailable = await this._isOAuthAvailable()
    if (oauthAvailable) {
      try {
        const { stdout } = await execAsync(
          `acli jira sprint list --board-id ${boardId} --state active --json`
        )

        const sprints = JSON.parse(stdout)
        return sprints.length > 0 ? sprints[0].id : null
      } catch (error) {
        console.warn("Could not fetch active sprint via OAuth:", error.message)
      }
    }

    return null
  }
}
