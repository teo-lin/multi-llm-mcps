import axios from "axios"

/**
 * Client for a self-hosted Onyx instance.
 *
 * Onyx API keys are gated behind the Business plan, so this client
 * authenticates the same way the web UI does: it logs in with email +
 * password to obtain a session cookie, then reuses that cookie. On a 401 it
 * transparently re-logs-in once and retries.
 */
export class OnyxClient {
  constructor() {
    // Base URL of the Onyx instance (nginx), WITHOUT the /api suffix.
    this.baseUrl = (process.env.ONYX_BASE_URL || "http://localhost:3210").replace(/\/$/, "")
    this.email = process.env.ONYX_EMAIL
    this.password = process.env.ONYX_PASSWORD

    if (!this.email || !this.password) {
      throw new Error(
        "Onyx MCP misconfigured: set ONYX_EMAIL and ONYX_PASSWORD in .env"
      )
    }

    // Credentials are POSTed in the login body. Over plain HTTP to a non-local
    // host that means they cross the wire in clear text — refuse it.
    const isHttp = /^http:\/\//i.test(this.baseUrl)
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(this.baseUrl)
    if (isHttp && !isLocal) {
      throw new Error(
        `Onyx MCP refuses to send credentials over plain HTTP to a remote host (${this.baseUrl}). Use https:// in ONYX_BASE_URL.`
      )
    }

    this.cookie = null
    this.http = axios.create({
      baseURL: `${this.baseUrl}/api`,
      // We handle non-2xx ourselves so we can detect 401 for re-auth.
      validateStatus: () => true,
      headers: { Accept: "application/json" },
      timeout: 30000,
    })
  }

  /** Log in and capture the session cookie. */
  async login() {
    const body = new URLSearchParams({
      username: this.email,
      password: this.password,
    })
    const res = await this.http.post("/auth/login", body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    if (res.status !== 200 && res.status !== 204) {
      throw new Error(
        `Onyx login failed (HTTP ${res.status}). Check ONYX_EMAIL / ONYX_PASSWORD.`
      )
    }
    const setCookie = res.headers["set-cookie"]
    if (!setCookie || setCookie.length === 0) {
      throw new Error("Onyx login returned no session cookie")
    }
    // Keep just the "name=value" of each cookie.
    this.cookie = setCookie.map((c) => c.split(";")[0]).join("; ")
    return this.cookie
  }

  /** Issue an authenticated request, logging in / retrying once on 401. */
  async request(method, path, data) {
    if (!this.cookie) await this.login()

    const send = () =>
      this.http.request({
        method,
        url: path,
        data,
        headers: {
          Cookie: this.cookie,
          ...(data ? { "Content-Type": "application/json" } : {}),
        },
      })

    let res = await send()
    if (res.status === 401) {
      await this.login()
      res = await send()
    }
    if (res.status < 200 || res.status >= 300) {
      // Cap the surfaced body: it flows back into the LLM transcript/logs, so
      // avoid dumping large or sensitive internal API payloads verbatim.
      const raw =
        typeof res.data === "object" ? JSON.stringify(res.data) : String(res.data)
      const detail = raw.length > 500 ? raw.slice(0, 500) + "… (truncated)" : raw
      throw new Error(`Onyx API ${method} ${path} -> HTTP ${res.status}: ${detail}`)
    }
    return res.data
  }

  /**
   * Meaning-based search across all indexed documents.
   * Uses Onyx's full search pipeline (vectors + keywords, blended), the same
   * one the Onyx chat uses. Falls back to the keyword-only admin endpoint if
   * the pipeline is unavailable.
   *
   * @param {string} query
   * @param {string|null} sourceType  e.g. "confluence" | "jira" | "github" | "web" | "file"
   * @param {number} maxResults
   */
  async search(query, sourceType = null, maxResults = 10) {
    const sources = sourceType ? [sourceType] : null
    try {
      const data = await this.request("POST", "/search", {
        query,
        sources,
        document_sets: null,
        tags: null,
        time_cutoff: null,
        skip_query_expansion: false,
      })
      const results = Array.isArray(data?.results) ? data.results : []
      if (results.length) {
        return results.slice(0, maxResults).map((r) => ({
          title: r.semantic_identifier ?? r.title,
          source: r.source_type ?? r.source,
          link: r.link,
          score: r.score,
          updated_at: r.updated_at,
          snippet: r.blurb ?? r.content?.slice(0, 500),
          metadata: r.metadata || {},
        }))
      }
    } catch (e) {
      // fall through to keyword search
    }

    const data = await this.request("POST", "/admin/search", {
      query,
      filters: {
        source_type: sources,
        document_set: null,
        time_cutoff: null,
        tags: null,
      },
    })
    const docs = Array.isArray(data?.documents) ? data.documents : []
    return docs.slice(0, maxResults).map((d) => ({
      title: d.semantic_identifier,
      source: d.source_type,
      link: d.link,
      score: d.score,
      updated_at: d.updated_at,
      snippet: d.blurb,
      metadata: d.metadata || {},
    }))
  }
}
