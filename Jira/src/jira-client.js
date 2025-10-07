import axios from "axios";

export class JiraClient {
  constructor() {
    // Get configuration from environment variables
    this.baseUrl = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;

    if (!email || !apiToken) {
      throw new Error(
        "JIRA_EMAIL and JIRA_API_TOKEN environment variables are required"
      );
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: email,
        password: apiToken,
      },
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  }

  async getTicketDetails(ticketKey) {
    const response = await this.client.get(`/rest/api/3/issue/${ticketKey}`);
    return response.data;
  }

  async searchTickets(jql, maxResults = 50) {
    const response = await this.client.post("/rest/api/3/search", {
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
    });
    return response.data;
  }

  async getBoardIssues(boardId, sprintId) {
    const url = `/rest/agile/1.0/board/${boardId}/issue`;
    const params = {
      maxResults: 100,
    };

    if (sprintId) {
      params.jql = `sprint = ${sprintId}`;
    }

    const response = await this.client.get(url, { params });
    return response.data.issues;
  }

  async getPtlsBoardBugs(teamName) {
    let jql = "project = PTLSNEW AND issuetype = Bug";

    if (teamName) {
      // Normalize team name for query
      const normalizedTeam = teamName.toLowerCase();
      if (normalizedTeam === "absences") {
        jql += ` AND (assignee in membersOf("absences-team") OR "Team" ~ "Absences")`;
      } else {
        jql += ` AND "Team" ~ "${teamName}"`;
      }
    }

    const searchResult = await this.searchTickets(jql, 100);
    return searchResult.issues;
  }

  async getTeamNames() {
    try {
      // Try to get team names from custom field values
      const response = await this.client.get("/rest/api/3/field/search", {
        params: {
          query: "team",
          type: "custom",
        },
      });

      const teamFields = response.data.values.filter((field) =>
        field.name.toLowerCase().includes("team")
      );

      if (teamFields.length > 0) {
        const fieldId = teamFields[0].id;

        // Get possible values for the team field
        const optionsResponse = await this.client.get(
          `/rest/api/3/customFieldOption/${fieldId}`
        );
        return optionsResponse.data.values?.map((option) => option.value) || [];
      }

      // Fallback: return common team names
      return ["Absences", "Bookings", "Core", "Platform", "Mobile"];
    } catch (error) {
      console.warn("Could not fetch team names, returning defaults:", error);
      return ["Absences", "Bookings", "Core", "Platform", "Mobile"];
    }
  }

  async getActiveSprintForBoard(boardId) {
    try {
      const response = await this.client.get(
        `/rest/agile/1.0/board/${boardId}/sprint`,
        {
          params: {
            state: "active",
          },
        }
      );

      const activeSprints = response.data.values;
      return activeSprints.length > 0 ? activeSprints[0].id : null;
    } catch (error) {
      console.warn("Could not fetch active sprint:", error);
      return null;
    }
  }
}
