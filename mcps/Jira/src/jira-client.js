import axios from "axios"
import { exec } from "child_process"
import { promisify } from "util"
import { readFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const execAsync = promisify(exec)

export class JiraClient {
  constructor() {
    this.baseUrl = process.env.JIRA_BASE_URL || "https://doctari.atlassian.net"
    this.email = process.env.JIRA_EMAIL
    this.apiToken = process.env.JIRA_READ_TOKEN || process.env.JIRA_API_TOKEN
    this.editToken = process.env.JIRA_EDIT_TOKEN

    // Auth strategy: 'oauth' (acli), 'basic' (API token), or 'auto' (try oauth first, fallback to basic)
    this.authStrategy = process.env.JIRA_AUTH_STRATEGY || "auto"

    // Configure axios client for basic auth (read operations)
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

    // Configure axios client for write operations (uses JIRA_EDIT_TOKEN if available)
    const writeToken = this.editToken || this.apiToken
    this.hasWriteAuth = !!(this.email && writeToken)
    if (this.hasWriteAuth) {
      this.writeClient = axios.create({
        baseURL: this.baseUrl,
        auth: {
          username: this.email,
          password: writeToken,
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

  async _normalizeParentKey(parentKey, projectKey) {
    if (!parentKey) return null

    const input = parentKey.trim()

    // Case 1: Full URL - extract key from URL
    // e.g., https://doctari.atlassian.net/browse/PAB-2241
    const urlMatch = input.match(/\/browse\/([A-Z]+-\d+)/)
    if (urlMatch) {
      console.error(`[Jira MCP] Extracted parent key from URL: ${urlMatch[1]}`)
      return urlMatch[1]
    }

    // Case 2: Full key - already in correct format
    // e.g., PAB-2241
    if (/^[A-Z]+-\d+$/.test(input)) {
      return input
    }

    // Case 3: Just the number - prepend project key
    // e.g., 2241 -> PAB-2241
    if (/^\d+$/.test(input)) {
      const fullKey = `${projectKey}-${input}`
      console.error(`[Jira MCP] Expanded parent key: ${input} -> ${fullKey}`)
      return fullKey
    }

    // Case 4: Title search - find by summary (risky, only if exact single match)
    try {
      console.error(`[Jira MCP] Searching for parent by title: "${input}"`)
      const jql = `project = ${projectKey} AND summary ~ "\\"${input.replace(/"/g, '\\"')}\\"" ORDER BY created DESC`
      const results = await this.searchTickets(jql, 5)

      if (results.issues && results.issues.length === 1) {
        const foundKey = results.issues[0].key
        console.error(`[Jira MCP] Found parent by title: ${foundKey}`)
        return foundKey
      } else if (results.issues && results.issues.length > 1) {
        console.warn(`[Jira MCP] Multiple matches for title "${input}", using first: ${results.issues[0].key}`)
        return results.issues[0].key
      } else {
        console.warn(`[Jira MCP] No matches found for title "${input}", treating as literal key`)
        return input
      }
    } catch (error) {
      console.warn(`[Jira MCP] Title search failed: ${error.message}, treating as literal key`)
      return input
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

  async createTicket({
    projectKey,
    summary,
    description,
    issueType = "Story",
    parentKey,
    assigneeEmail,
    sprintId,
  }) {
    this._checkConfigured()

    // Default project to JIRA_DEFAULT_PROJECT if not specified
    const finalProjectKey = projectKey || process.env.JIRA_DEFAULT_PROJECT
    if (!finalProjectKey) {
      throw new Error("project_key is required (or set JIRA_DEFAULT_PROJECT in .env)")
    }

    // Normalize parent_key - handles URL, full key, number, or title
    const finalParentKey = await this._normalizeParentKey(parentKey, finalProjectKey)

    // Default assignee to JIRA_EMAIL if not specified
    const finalAssignee = assigneeEmail || this.email

    // Default sprint to active sprint from JIRA_TEAM_BOARD_ID if not specified
    let finalSprintId = sprintId
    if (!finalSprintId && process.env.JIRA_TEAM_BOARD_ID) {
      try {
        const activeSprint = await this.getActiveSprintForBoard(
          parseInt(process.env.JIRA_TEAM_BOARD_ID, 10)
        )
        if (activeSprint) {
          finalSprintId = activeSprint.id
          console.error(`[Jira MCP] Using active sprint: ${activeSprint.name} (${activeSprint.id})`)
        }
      } catch (error) {
        console.warn("[Jira MCP] Could not get active sprint:", error.message)
      }
    }

    let ticket

    // Use acli (OAuth) for creating tickets - API tokens often lack write permissions
    const oauthAvailable = await this._isOAuthAvailable()
    if (oauthAvailable) {
      ticket = await this._createTicketViaOAuth({
        projectKey: finalProjectKey,
        summary,
        description,
        issueType,
        parentKey: finalParentKey,
        assigneeEmail: finalAssignee,
      })
    } else if (this.hasWriteAuth) {
      ticket = await this._createTicketViaBasicAuth({
        projectKey: finalProjectKey,
        summary,
        description,
        issueType,
        parentKey: finalParentKey,
        assigneeEmail: finalAssignee,
      })
    } else {
      throw new Error(
        "OAuth (acli) not available and API token not configured. Run 'acli jira auth login' or set JIRA_EDIT_TOKEN."
      )
    }

    // Add to sprint if specified or defaulted
    if (finalSprintId && ticket.key) {
      try {
        await this.addToSprint(finalSprintId, [ticket.key])
        ticket.sprintId = finalSprintId
      } catch (error) {
        console.warn(`[Jira MCP] Could not add ${ticket.key} to sprint ${finalSprintId}:`, error.message)
        ticket.sprintError = error.message
      }
    }

    return ticket
  }

  async _createTicketViaOAuth({
    projectKey,
    summary,
    description,
    issueType,
    parentKey,
    assigneeEmail,
  }) {
    const args = [
      "--summary",
      summary,
      "--project",
      projectKey,
      "--type",
      issueType,
      "--json",
    ]

    if (description) {
      args.push("--description", description)
    }

    if (parentKey) {
      args.push("--parent", parentKey)
    }

    if (assigneeEmail) {
      args.push("--assignee", assigneeEmail)
    }

    console.error(`[Jira MCP] Creating ticket via OAuth (acli) in project ${projectKey}`)
    const { stdout } = await execAsync(
      `acli jira workitem create ${args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(" ")}`
    )
    const ticket = JSON.parse(stdout)

    return {
      key: ticket.key,
      id: ticket.id,
      self: ticket.self,
      url: `${this.baseUrl}/browse/${ticket.key}`,
    }
  }

  async _createTicketViaBasicAuth({
    projectKey,
    summary,
    description,
    issueType,
    parentKey,
    assigneeEmail,
  }) {
    const issueData = {
      fields: {
        project: { key: projectKey },
        summary,
        issuetype: { name: issueType },
      },
    }

    if (description) {
      issueData.fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: description }],
          },
        ],
      }
    }

    if (parentKey) {
      issueData.fields.parent = { key: parentKey }
    }

    if (assigneeEmail) {
      try {
        const userResponse = await this.writeClient.get(
          `/rest/api/3/user/search`,
          { params: { query: assigneeEmail } }
        )
        if (userResponse.data.length > 0) {
          issueData.fields.assignee = { id: userResponse.data[0].accountId }
        }
      } catch (error) {
        console.warn(`Could not find user ${assigneeEmail}:`, error.message)
      }
    }

    console.error(`[Jira MCP] Creating ticket via API token in project ${projectKey}`)
    const response = await this.writeClient.post("/rest/api/3/issue", issueData)

    return {
      key: response.data.key,
      id: response.data.id,
      self: response.data.self,
      url: `${this.baseUrl}/browse/${response.data.key}`,
    }
  }

  async getActiveSprintForBoard(boardId) {
    this._checkConfigured()

    // Try OAuth via acli first (more reliable)
    const oauthAvailable = await this._isOAuthAvailable()
    if (oauthAvailable) {
      try {
        const { stdout } = await execAsync(
          `acli jira board list-sprints --id ${boardId} --state active --json`
        )
        const result = JSON.parse(stdout)
        const sprints = result.sprints || []
        if (sprints.length > 0) {
          return {
            id: sprints[0].id,
            name: sprints[0].name,
            state: sprints[0].state,
            goal: sprints[0].goal,
          }
        }
      } catch (error) {
        console.warn("Could not fetch active sprint via OAuth:", error.message)
      }
    }

    // Fallback to basic auth
    if (this.hasBasicAuth) {
      try {
        const response = await this.axiosClient.get(
          `/rest/agile/1.0/board/${boardId}/sprint`,
          { params: { state: "active" } }
        )
        const activeSprints = response.data.values
        if (activeSprints.length > 0) {
          return {
            id: activeSprints[0].id,
            name: activeSprints[0].name,
            state: activeSprints[0].state,
            goal: activeSprints[0].goal,
          }
        }
      } catch (error) {
        console.warn("Could not fetch active sprint via basic auth:", error.message)
      }
    }

    return null
  }

  async _getOAuthTokenFromKeychain() {
    try {
      // Read acli config to get the cloud ID and account ID
      const configPath = join(homedir(), ".config", "acli", "global_auth_config.yaml")
      const config = readFileSync(configPath, "utf8")

      // Parse cloud_id and account_id from YAML (simple parsing)
      const cloudIdMatch = config.match(/cloud_id:\s*([^\s]+)/)
      const accountIdMatch = config.match(/account_id:\s*([^\s]+)/)

      if (!cloudIdMatch || !accountIdMatch) {
        throw new Error("Could not parse acli config")
      }

      const cloudId = cloudIdMatch[1]
      const accountId = accountIdMatch[1]

      // Get token from keychain
      const keychainAccount = `jira:${cloudId}:${accountId}`
      const { stdout } = await execAsync(
        `security find-generic-password -s "acli" -a "${keychainAccount}" -w`
      )

      // Decode the token (remove prefix and base64 decode)
      const tokenData = stdout.trim()
      if (tokenData.startsWith("go-keyring-base64:")) {
        const base64Token = tokenData.replace("go-keyring-base64:", "")
        return Buffer.from(base64Token, "base64").toString("utf8")
      }

      return tokenData
    } catch (error) {
      console.error("[Jira MCP] Could not get OAuth token from keychain:", error.message)
      return null
    }
  }

  async addToSprint(sprintId, issueKeys) {
    this._checkConfigured()

    if (!Array.isArray(issueKeys) || issueKeys.length === 0) {
      throw new Error("issueKeys must be a non-empty array")
    }

    // Try using OAuth token from keychain for the agile API
    const oauthToken = await this._getOAuthTokenFromKeychain()
    if (oauthToken && this.email) {
      try {
        console.error(`[Jira MCP] Adding ${issueKeys.length} issue(s) to sprint ${sprintId} via OAuth`)

        const response = await axios.post(
          `${this.baseUrl}/rest/agile/1.0/sprint/${sprintId}/issue`,
          { issues: issueKeys },
          {
            auth: {
              username: this.email,
              password: oauthToken,
            },
            headers: {
              "Content-Type": "application/json",
            },
          }
        )

        return {
          success: true,
          sprintId,
          issuesAdded: issueKeys,
        }
      } catch (error) {
        console.error("[Jira MCP] OAuth sprint assignment failed:", error.message)
        throw new Error(`Failed to add issues to sprint: ${error.message}`)
      }
    }

    throw new Error(
      "OAuth token not available. Ensure acli is authenticated: run 'acli jira auth login'"
    )
  }
}
