#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SonarClient } from './sonar-client.js';

const sonarClient = new SonarClient();

const server = new Server(
  {
    name: 'sonarcloud-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_project_status',
        description: 'Get the quality gate status for the project',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_issues',
        description: 'Get issues (bugs, vulnerabilities, code smells) from the project',
        inputSchema: {
          type: 'object',
          properties: {
            severities: {
              type: 'string',
              description: 'Comma-separated severities: BLOCKER, CRITICAL, MAJOR, MINOR, INFO',
            },
            types: {
              type: 'string',
              description: 'Comma-separated types: BUG, VULNERABILITY, CODE_SMELL, SECURITY_HOTSPOT',
            },
            statuses: {
              type: 'string',
              description: 'Comma-separated statuses: OPEN, CONFIRMED, REOPENED, RESOLVED, CLOSED',
            },
            resolved: {
              type: 'boolean',
              description: 'Include resolved issues (default: false)',
            },
            pageSize: {
              type: 'number',
              description: 'Number of results per page (default: 100, max: 500)',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
          },
        },
      },
      {
        name: 'get_issue_details',
        description: 'Get detailed information about a specific issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'The issue key/ID',
            },
          },
          required: ['issueKey'],
        },
      },
      {
        name: 'get_measures',
        description: 'Get project metrics (bugs count, vulnerabilities, code smells, coverage, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            metricKeys: {
              type: 'string',
              description: 'Comma-separated metric keys (default: bugs, vulnerabilities, code_smells, coverage, duplicated_lines_density)',
            },
          },
        },
      },
      {
        name: 'get_security_hotspots',
        description: 'Get security hotspots from the project',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by status: TO_REVIEW, REVIEWED',
            },
            resolution: {
              type: 'string',
              description: 'Filter by resolution: FIXED, SAFE, ACKNOWLEDGED',
            },
            pageSize: {
              type: 'number',
              description: 'Number of results per page (default: 100)',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
          },
        },
      },
      {
        name: 'get_hotspot_details',
        description: 'Get detailed information about a specific security hotspot',
        inputSchema: {
          type: 'object',
          properties: {
            hotspotKey: {
              type: 'string',
              description: 'The security hotspot key/ID',
            },
          },
          required: ['hotspotKey'],
        },
      },
      {
        name: 'get_files',
        description: 'Get list of files in the project',
        inputSchema: {
          type: 'object',
          properties: {
            qualifiers: {
              type: 'string',
              description: 'Component qualifiers: FIL (files), DIR (directories), TRK (projects). Default: FIL',
            },
            pageSize: {
              type: 'number',
              description: 'Number of results per page (default: 100)',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
          },
        },
      },
      {
        name: 'get_source_code',
        description: 'Get source code of a file',
        inputSchema: {
          type: 'object',
          properties: {
            fileKey: {
              type: 'string',
              description: 'The file component key',
            },
            from: {
              type: 'number',
              description: 'Start line number (optional)',
            },
            to: {
              type: 'number',
              description: 'End line number (optional)',
            },
          },
          required: ['fileKey'],
        },
      },
      {
        name: 'get_rules',
        description: 'Get SonarQube/SonarCloud rules',
        inputSchema: {
          type: 'object',
          properties: {
            languages: {
              type: 'string',
              description: 'Comma-separated languages: js, ts, java, python, etc.',
            },
            types: {
              type: 'string',
              description: 'Comma-separated types: BUG, VULNERABILITY, CODE_SMELL, SECURITY_HOTSPOT',
            },
            severities: {
              type: 'string',
              description: 'Comma-separated severities: BLOCKER, CRITICAL, MAJOR, MINOR, INFO',
            },
            pageSize: {
              type: 'number',
              description: 'Number of results per page (default: 100)',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
          },
        },
      },
      {
        name: 'get_rule_details',
        description: 'Get detailed information about a specific rule including description and remediation',
        inputSchema: {
          type: 'object',
          properties: {
            ruleKey: {
              type: 'string',
              description: 'The rule key (e.g., typescript:S1234)',
            },
          },
          required: ['ruleKey'],
        },
      },
      {
        name: 'get_analyses_history',
        description: 'Get project analysis history',
        inputSchema: {
          type: 'object',
          properties: {
            pageSize: {
              type: 'number',
              description: 'Number of results per page (default: 10)',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
          },
        },
      },
      {
        name: 'get_issues_summary',
        description: 'Get a comprehensive summary of all issues in the project grouped by type and severity',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_project_status': {
        const status = await sonarClient.getProjectStatus();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'get_issues': {
        const options = {
          severities: args.severities,
          types: args.types,
          statuses: args.statuses,
          resolved: args.resolved || false,
          ps: args.pageSize || 100,
          p: args.page || 1,
        };
        const issues = await sonarClient.getIssues(options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issues, null, 2),
            },
          ],
        };
      }

      case 'get_issue_details': {
        const issue = await sonarClient.getIssueDetails(args.issueKey);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issue, null, 2),
            },
          ],
        };
      }

      case 'get_measures': {
        const metricKeys = args.metricKeys
          ? args.metricKeys.split(',').map((k) => k.trim())
          : undefined;
        const measures = await sonarClient.getMeasures(metricKeys);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(measures, null, 2),
            },
          ],
        };
      }

      case 'get_security_hotspots': {
        const options = {
          status: args.status,
          resolution: args.resolution,
          ps: args.pageSize || 100,
          p: args.page || 1,
        };
        const hotspots = await sonarClient.getHotspots(options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(hotspots, null, 2),
            },
          ],
        };
      }

      case 'get_hotspot_details': {
        const hotspot = await sonarClient.getHotspotDetails(args.hotspotKey);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(hotspot, null, 2),
            },
          ],
        };
      }

      case 'get_files': {
        const options = {
          qualifiers: args.qualifiers || 'FIL',
          ps: args.pageSize || 100,
          p: args.page || 1,
        };
        const files = await sonarClient.getComponentTree(options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(files, null, 2),
            },
          ],
        };
      }

      case 'get_source_code': {
        const options = {
          from: args.from,
          to: args.to,
        };
        const source = await sonarClient.getSourceCode(args.fileKey, options);
        return {
          content: [
            {
              type: 'text',
              text: source,
            },
          ],
        };
      }

      case 'get_rules': {
        const options = {
          languages: args.languages,
          types: args.types,
          severities: args.severities,
          ps: args.pageSize || 100,
          p: args.page || 1,
        };
        const rules = await sonarClient.getRules(options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(rules, null, 2),
            },
          ],
        };
      }

      case 'get_rule_details': {
        const rule = await sonarClient.getRuleDetails(args.ruleKey);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(rule, null, 2),
            },
          ],
        };
      }

      case 'get_analyses_history': {
        const options = {
          ps: args.pageSize || 10,
          p: args.page || 1,
        };
        const analyses = await sonarClient.getProjectAnalyses(options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(analyses, null, 2),
            },
          ],
        };
      }

      case 'get_issues_summary': {
        // Get all issue types
        const [bugs, vulnerabilities, codeSmells, hotspots] = await Promise.all([
          sonarClient.getIssues({ types: 'BUG', ps: 500 }),
          sonarClient.getIssues({ types: 'VULNERABILITY', ps: 500 }),
          sonarClient.getIssues({ types: 'CODE_SMELL', ps: 500 }),
          sonarClient.getHotspots({ ps: 500 }),
        ]);

        const summary = {
          total: {
            bugs: bugs.total || 0,
            vulnerabilities: vulnerabilities.total || 0,
            codeSmells: codeSmells.total || 0,
            securityHotspots: hotspots.paging?.total || 0,
          },
          bySeverity: {},
          byStatus: {},
        };

        // Aggregate by severity and status
        const allIssues = [
          ...(bugs.issues || []),
          ...(vulnerabilities.issues || []),
          ...(codeSmells.issues || []),
        ];

        allIssues.forEach((issue) => {
          // By severity
          summary.bySeverity[issue.severity] = (summary.bySeverity[issue.severity] || 0) + 1;
          // By status
          summary.byStatus[issue.status] = (summary.byStatus[issue.status] || 0) + 1;
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

console.log('☁️  SonarCloud MCP Server running on stdio');
