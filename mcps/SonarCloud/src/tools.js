export const tools = [
  {
    name: "get_project_status",
    description: "Get the quality gate status for the project",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_issues",
    description:
      "Get issues (bugs, vulnerabilities, code smells) from the project",
    inputSchema: {
      type: "object",
      properties: {
        severities: {
          type: "string",
          description:
            "Comma-separated severities: BLOCKER, CRITICAL, MAJOR, MINOR, INFO",
        },
        types: {
          type: "string",
          description:
            "Comma-separated types: BUG, VULNERABILITY, CODE_SMELL, SECURITY_HOTSPOT",
        },
        statuses: {
          type: "string",
          description:
            "Comma-separated statuses: OPEN, CONFIRMED, REOPENED, RESOLVED, CLOSED",
        },
        resolved: {
          type: "boolean",
          description: "Include resolved issues (default: false)",
        },
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 100, max: 500)",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
      },
    },
  },
  {
    name: "get_issue_details",
    description: "Get detailed information about a specific issue",
    inputSchema: {
      type: "object",
      properties: {
        issueKey: {
          type: "string",
          description: "The issue key/ID",
        },
      },
      required: ["issueKey"],
    },
  },
  {
    name: "get_measures",
    description:
      "Get project metrics (bugs count, vulnerabilities, code smells, coverage, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        metricKeys: {
          type: "string",
          description:
            "Comma-separated metric keys (default: bugs, vulnerabilities, code_smells, coverage, duplicated_lines_density)",
        },
      },
    },
  },
  {
    name: "get_security_hotspots",
    description: "Get security hotspots from the project",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filter by status: TO_REVIEW, REVIEWED",
        },
        resolution: {
          type: "string",
          description: "Filter by resolution: FIXED, SAFE, ACKNOWLEDGED",
        },
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 100)",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
      },
    },
  },
  {
    name: "get_hotspot_details",
    description: "Get detailed information about a specific security hotspot",
    inputSchema: {
      type: "object",
      properties: {
        hotspotKey: {
          type: "string",
          description: "The security hotspot key/ID",
        },
      },
      required: ["hotspotKey"],
    },
  },
  {
    name: "get_files",
    description: "Get list of files in the project",
    inputSchema: {
      type: "object",
      properties: {
        qualifiers: {
          type: "string",
          description:
            "Component qualifiers: FIL (files), DIR (directories), TRK (projects). Default: FIL",
        },
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 100)",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
      },
    },
  },
  {
    name: "get_source_code",
    description: "Get source code of a file",
    inputSchema: {
      type: "object",
      properties: {
        fileKey: {
          type: "string",
          description: "The file component key",
        },
        from: {
          type: "number",
          description: "Start line number (optional)",
        },
        to: {
          type: "number",
          description: "End line number (optional)",
        },
      },
      required: ["fileKey"],
    },
  },
  {
    name: "get_rules",
    description: "Get SonarQube/SonarCloud rules",
    inputSchema: {
      type: "object",
      properties: {
        languages: {
          type: "string",
          description: "Comma-separated languages: js, ts, java, python, etc.",
        },
        types: {
          type: "string",
          description:
            "Comma-separated types: BUG, VULNERABILITY, CODE_SMELL, SECURITY_HOTSPOT",
        },
        severities: {
          type: "string",
          description:
            "Comma-separated severities: BLOCKER, CRITICAL, MAJOR, MINOR, INFO",
        },
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 100)",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
      },
    },
  },
  {
    name: "get_rule_details",
    description:
      "Get detailed information about a specific rule including description and remediation",
    inputSchema: {
      type: "object",
      properties: {
        ruleKey: {
          type: "string",
          description: "The rule key (e.g., typescript:S1234)",
        },
      },
      required: ["ruleKey"],
    },
  },
  {
    name: "get_analyses_history",
    description: "Get project analysis history",
    inputSchema: {
      type: "object",
      properties: {
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 10)",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
      },
    },
  },
  {
    name: "get_issues_summary",
    description:
      "Get a comprehensive summary of all issues in the project grouped by type and severity",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
]
