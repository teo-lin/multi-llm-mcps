import axios from 'axios';

export class SonarClient {
  constructor() {
    this.hostUrl = process.env.SONAR_HOST_URL || 'https://sonarcloud.io';
    this.token = process.env.SONAR_TOKEN;
    this.organization = process.env.SONAR_ORGANIZATION;
    this.projectKey = process.env.SONAR_PROJECT_KEY;

    // Track configuration status
    this.configured = !!(this.token && this.organization && this.projectKey);

    if (!this.configured) {
      console.error(
        '⚠️  Warning: SonarCloud not configured. Set SONAR_TOKEN, SONAR_ORGANIZATION, and SONAR_PROJECT_KEY environment variables.'
      );
      this.client = null;
      return;
    }

    this.client = axios.create({
      baseURL: this.hostUrl,
      auth: {
        username: this.token,
        password: '', // SonarCloud uses token as username with empty password
      },
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  _checkConfigured() {
    if (!this.configured) {
      throw new Error(
        'SonarCloud is not configured. Please set SONAR_TOKEN, SONAR_ORGANIZATION, and SONAR_PROJECT_KEY environment variables.'
      );
    }
  }

  async getProjectStatus() {
    this._checkConfigured();
    const response = await this.client.get('/api/qualitygates/project_status', {
      params: {
        projectKey: this.projectKey,
      },
    });
    return response.data;
  }

  async getIssues(options = {}) {
    this._checkConfigured();
    const {
      severities = null, // BLOCKER, CRITICAL, MAJOR, MINOR, INFO
      types = null, // BUG, VULNERABILITY, CODE_SMELL, SECURITY_HOTSPOT
      statuses = null, // OPEN, CONFIRMED, REOPENED, RESOLVED, CLOSED
      resolved = false,
      ps = 100, // page size
      p = 1, // page number
    } = options;

    const params = {
      componentKeys: this.projectKey,
      organization: this.organization,
      ps,
      p,
      resolved,
    };

    if (severities) params.severities = Array.isArray(severities) ? severities.join(',') : severities;
    if (types) params.types = Array.isArray(types) ? types.join(',') : types;
    if (statuses) params.statuses = Array.isArray(statuses) ? statuses.join(',') : statuses;

    const response = await this.client.get('/api/issues/search', { params });
    return response.data;
  }

  async getIssueDetails(issueKey) {
    this._checkConfigured();
    const response = await this.client.get('/api/issues/search', {
      params: {
        issues: issueKey,
        organization: this.organization,
        additionalFields: 'comments,transitions',
      },
    });
    return response.data.issues[0] || null;
  }

  async getMeasures(metricKeys = ['bugs', 'vulnerabilities', 'code_smells', 'coverage', 'duplicated_lines_density']) {
    this._checkConfigured();
    const response = await this.client.get('/api/measures/component', {
      params: {
        component: this.projectKey,
        metricKeys: Array.isArray(metricKeys) ? metricKeys.join(',') : metricKeys,
      },
    });
    return response.data;
  }

  async getHotspots(options = {}) {
    this._checkConfigured();
    const {
      status = null, // TO_REVIEW, REVIEWED
      resolution = null, // FIXED, SAFE, ACKNOWLEDGED
      ps = 100,
      p = 1,
    } = options;

    const params = {
      projectKey: this.projectKey,
      ps,
      p,
    };

    if (status) params.status = status;
    if (resolution) params.resolution = resolution;

    const response = await this.client.get('/api/hotspots/search', { params });
    return response.data;
  }

  async getHotspotDetails(hotspotKey) {
    this._checkConfigured();
    const response = await this.client.get('/api/hotspots/show', {
      params: {
        hotspot: hotspotKey,
      },
    });
    return response.data;
  }

  async getComponentTree(options = {}) {
    this._checkConfigured();
    const {
      qualifiers = 'FIL', // FIL (files), DIR (directories), TRK (projects)
      ps = 100,
      p = 1,
    } = options;

    const response = await this.client.get('/api/components/tree', {
      params: {
        component: this.projectKey,
        qualifiers,
        ps,
        p,
      },
    });
    return response.data;
  }

  async getSourceCode(fileKey, options = {}) {
    this._checkConfigured();
    const { from = null, to = null } = options;

    const params = { key: fileKey };
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await this.client.get('/api/sources/raw', { params });
    return response.data;
  }

  async getRules(options = {}) {
    this._checkConfigured();
    const {
      languages = null, // js, ts, java, python, etc.
      types = null, // BUG, VULNERABILITY, CODE_SMELL, SECURITY_HOTSPOT
      severities = null,
      ps = 100,
      p = 1,
    } = options;

    const params = { ps, p };

    if (languages) params.languages = Array.isArray(languages) ? languages.join(',') : languages;
    if (types) params.types = Array.isArray(types) ? types.join(',') : types;
    if (severities) params.severities = Array.isArray(severities) ? severities.join(',') : severities;

    const response = await this.client.get('/api/rules/search', { params });
    return response.data;
  }

  async getRuleDetails(ruleKey) {
    this._checkConfigured();
    const response = await this.client.get('/api/rules/show', {
      params: {
        key: ruleKey,
      },
    });
    return response.data;
  }

  async getProjectAnalyses(options = {}) {
    this._checkConfigured();
    const { ps = 10, p = 1 } = options;

    const response = await this.client.get('/api/project_analyses/search', {
      params: {
        project: this.projectKey,
        ps,
        p,
      },
    });
    return response.data;
  }
}
