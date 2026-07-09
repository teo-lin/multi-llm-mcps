# Onyx Setup Runbook (Planerio / Absences team)

Goal: a self-hosted Onyx instance used **purely as a retrieval index** (no LLM in Onyx — Claude Code is the brain via the Onyx MCP `search_onyx` tool). Scoped to Planerio/Absences content, German+English, lean (no bloat).

This doc captures the working config **and the non-obvious traps** that cost us hours. Read the "Gotchas" section before touching the embedding model.

---

## 0. Architecture / facts

- Onyx runs via docker compose. UI at `http://localhost:3210`. Admin panel under `/admin`.
- **Backend = OpenSearch** (this build, not Vespa). One chunk index per embedding model: `danswer_chunk_<sanitized_model_name>`.
- **LLM provider (2026-06-22): Ollama wired in** as an OpenAI-compatible provider (Onyx has no native "ollama" type). Onyx LLM provider id=1, `provider:"openai"`, `api_base:"http://host.docker.internal:11434/v1"`, `api_key:"ollama"` (dummy), models `qwen3:8b` (default) + `codellama:7b`. Ollama runs on the host (`ollama serve`, port 11434), reachable from containers via `host.docker.internal`. Created via `PUT /api/admin/llm/provider?is_creation=true`. ⚠️ RAM: qwen3:8b needs ~6GB; Docker holds 12.5GB of 16 → only ~3.5GB free → model swaps (slow). Real fix per plan: drop Docker RAM or use a 3B model. Retrieval (`search_onyx`/BM25) needs no LLM and is unaffected; the LLM only enables in-Onyx RAG chat.
- Containers (names): `onyx-api_server-1`, `onyx-background-1` (Celery worker — does indexing/embedding dispatch), `onyx-indexing_model_server-1` (embeds text), `onyx-inference_model_server-1`, `onyx-relational_db-1` (Postgres), `onyx-opensearch-1`, `onyx-minio-1`, `onyx-cache-1` (redis), `onyx-web_server-1`, `onyx-nginx-1`, `onyx-code-interpreter-1`.
- **CPU-only** on these laptops (no GPU). Embedding is slow; plan for it. The embedding model is downloaded from HuggingFace on first use (e5-large ≈ 2.2 GB).

### Access cheat-sheet
```bash
# Postgres (Onyx relational DB)
docker exec onyx-relational_db-1 psql -U postgres -d postgres -c "SELECT 1;"

# OpenSearch (secured: https + basic auth). Admin pw from env OPENSEARCH_ADMIN_PASSWORD
docker exec onyx-api_server-1 python3 -c "
import urllib.request,ssl,base64
ctx=ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
r=urllib.request.Request('https://opensearch:9200/_cat/indices?h=index,docs.count')
r.add_header('Authorization','Basic '+base64.b64encode(b'admin:StrongPassword123!').decode())
print(urllib.request.urlopen(r,context=ctx,timeout=8).read().decode())"
```
- Onyx admin REST is reachable from the logged-in browser (cookie auth). We drove most config via the browser devtools `fetch(...)` against `/api/...`.

---

## 1. THE BIG GOTCHA — embedding model & index naming (read first)

**Symptom we hit:** picked `Qwen/Qwen3-Embedding-0.6B`. Reindex got "stuck" forever (attempt IN_PROGRESS, heartbeating, but `total_chunks=0`, docprocessing queue empty, model server idle). Then api_server started **crash-looping**.

**Root cause:** Onyx derives the OpenSearch index name from the model id by replacing `/ . -` with `_` **but does NOT lowercase it**. `Qwen/Qwen3-Embedding-0.6B` → `danswer_chunk_Qwen_Qwen3_Embedding_0_6B` (has capitals). **OpenSearch refuses to create an index with uppercase letters.** So:
- the index is never created → every chunk write 404s → reindex can never finish (looks like a stall),
- and on boot api_server tries to create that index, fails fatally, crash-loops.

**Rule: the embedding model's HF id must be all-lowercase.** This rules out `Qwen/...`, `BAAI/bge-m3` (capital BAAI), `NVIDIA/...`, etc. Onyx's built-in self-hosted presets (`nomic-ai/...`, `intfloat/...`) are lowercase, which is why they work.

**What we use:** `intfloat/multilingual-e5-large`
- 1024-dim, multilingual (strong German+English), CPU-viable, lowercase path → index `danswer_chunk_intfloat_multilingual_e5_large` (valid).
- e5 REQUIRES prefixes: **Query Prefix = `query: `** and **Passage Prefix = `passage: `** (trailing space), **Normalize = ON**.
- Alternative (safest, zero-config): the built-in preset **`intfloat/multilingual-e5-base`** (768-dim) — Onyx sets prefixes automatically.

**Why multilingual at all:** the Onyx default `nomic-embed-text-v1` is English-only → English queries do NOT reliably retrieve German docs (retrieval is the bottleneck; Claude reads German fine once a doc is retrieved). Lots of Planerio docs are German, so multilingual embeddings are required.

### How to set the model (clean path)
Admin → **Index Settings** → Embedding Model → **Self-hosted** tab → **Add Custom Model**:
- Model Name: `intfloat/multilingual-e5-large`
- Model Dimension: `1024`
- Query Prefix: `query: `
- Passage Prefix: `passage: `
- Normalize Embeddings: ON
→ Connect → then **Apply & Re-index** (strategy "Re-index All Connectors Then Switch").

⚠️ If you see a **"Failed to apply settings"** popup, the OpenSearch index creation failed (almost always the uppercase-name bug). Do not ignore it — verify the index exists (see Access cheat-sheet). The model switch row lives in Postgres `search_settings` (status `FUTURE` until reindex completes, then `PRESENT`; old model → `PAST`).

### Recovery if it's already wedged / api_server crash-looping
The bad model row poisons startup. Fix it in the DB, then restart api_server:
```bash
# Repurpose the FUTURE search_settings row to a lowercase model (e5-large here)
docker exec onyx-relational_db-1 psql -U postgres -d postgres -c "
UPDATE search_settings
SET model_name='intfloat/multilingual-e5-large', model_dim=1024, normalize=true,
    query_prefix='query: ', passage_prefix='passage: ',
    index_name='danswer_chunk_intfloat_multilingual_e5_large'
WHERE status='FUTURE';"
docker restart onyx-api_server-1
# wait for healthy, confirm the lowercase index now exists (Access cheat-sheet)
```
After switchover, the old attempts may be marked SUCCESS-but-empty (they "succeeded" while the index didn't exist). Force a clean reindex of every connector so the new index actually fills (see §8).

---

## 2. Global setting — turn OFF image extraction (bloat killer)

`image_extraction_and_analysis_enabled` defaults **True**. With it on, every connector indexes **each embedded/inline image as its own document**. With no vision LLM configured (our case) those image docs carry **zero searchable text** — pure noise. This is what blew Confluence up to ~117k docs (≈98k were image-attachment docs).

The Admin UI toggle ("Extract & Caption Images") is **locked/disabled** when no vision LLM exists, so set it via API:
```js
// in the logged-in browser console:
fetch('/api/settings').then(r=>r.json()).then(s=>{
  delete s.notifications; delete s.needs_reindexing;
  s.image_extraction_and_analysis_enabled=false;
  return fetch('/api/admin/settings',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(s)});
}).then(r=>console.log('PUT',r.status));
```
Verify: `GET /api/settings` → `image_extraction_and_analysis_enabled:false`. Set this **before** indexing Confluence.

---

## 3. Connector: Confluence

**What counts as a doc:** 1 page = 1 doc (current version only — page *history* is NOT indexed). **Comments are appended into the page's text** (no extra docs, no toggle to disable — would need a source patch). **Attachments are indexed as separate docs** (images gated by the global image-extraction flag; non-image attachments like PDFs still index).

**Empty CQL = ALL spaces** (global + personal + archived) + all attachments → ~80k+ docs of mostly junk. Always scope it.

**Scoping (our setup):** space **SD** (Solutions Domain = Planerio engineering), pages only:
```
cql_query: type = page AND space = SD
```
- CQL valid fields verified on this instance: `space`, `space.type`, `space.key`, `space.title`, `space.category`. **Invalid:** `space.status`, content `status` (so you can't filter archived by a field).
- **Archived spaces are auto-excluded** when you use a CQL query (the search index doesn't return archived content). Empty-CQL mode (direct space enumeration) does NOT exclude them — another reason to always set CQL.
- SD ≈ **2,530 pages**; with attachments it balloons to ~36k docs (hence image-extraction OFF).

**Trim noise (optional; approach we chose = subtree + title excludes):** SD is full of low-signal stuff (meeting notes, sprint reviews, OKRs, RCAs, hiring, conferences, Kafka-topic templates). Other doctari brands (Lichtfeld, Arztpool, Doctari City, Ärzte) are NOT in SD — they live in other spaces (ED, CD, CUS, …), so `space = SD` already excludes them.
Example fuller CQL:
```
type = page AND space = SD
 AND title !~ "Bi-Weekly" AND title !~ "Sprint Review" AND title !~ "Meeting Notes"
 AND title !~ "Jour Fixe" AND title !~ "OKR" AND title !~ "Post Mortem" AND title !~ "Postmortem"
 AND title !~ "Interview" AND title !~ "Conference" AND title !~ "Recruiting"
 AND title !~ "Newsletter" AND title !~ "RCA"
 AND NOT ancestor = 3784704565   -- Post Mortems
 AND NOT ancestor = 3490752757   -- OKRs
 AND NOT ancestor = 4717707352   -- ALPACA Meetings
 AND NOT ancestor = 4716495006   -- Finished Features
 AND NOT ancestor = 2929262658   -- Onboarding templates
 AND NOT ancestor = 3490745291   -- Hiring
 AND NOT ancestor = 4808474778   -- Newsletters
 AND NOT ancestor = 3490748806   -- Architecture Jour Fixe
 AND NOT ancestor = 3490742995   -- RCAs
```
(ancestor ids are SD-specific; re-derive on a fresh instance — they won't match elsewhere. Get them via `getConfluencePageDescendants` / the page URLs.)

**Connector-specific config is NOT editable in the UI after creation.** To change `cql_query` etc., either recreate the connector via the wizard, or PATCH:
```
PATCH /api/manage/admin/connector/<connector_id>
body includes: name, source:"confluence", input_type:"poll", access_type:"public", groups:[],
  connector_specific_config:{space:"",page_id:"",is_cloud:true,
    cql_query:"type = page AND space = SD", wiki_base:"https://doctari.atlassian.net/wiki",
    scoped_token:false, index_recursively:true},
  refresh_freq:86400, prune_freq:604800, indexing_start:null
```
After scoping a connector that already has junk, **prune** it: `POST /api/manage/admin/cc-pair/<ccpair_id>/prune` (deletes docs no longer returned by the connector).

---

## 4. Connector: GitHub

**What counts as a doc:** PRs (if `include_prs`), Issues (if `include_issues`), and **"Documents"** (if `include_files`). **"Documents" = prose files only** — hardcoded allowlist `.md/.mdx/.markdown/.rst/.txt` + README/LICENSE/CHANGELOG-type names. **Source code, .proto, .json/.yaml/.xml/.sql are NOT indexed.** Files come from the **default branch HEAD only** (no other branches, no history). Files >1 MB and `node_modules/dist/build/vendor` are skipped.
→ Onyx GitHub is a **docs indexer, not code search**. For code knowledge use Sourcegraph/Cody or Claude Code directly (Onyx can't do it).

**Config (current, 2026-06-22):** **38 specific repos** (doctariDev), PRs+issues+docs. Expanded from the original 6 (absences set) → 18 → **38** (added timetracking, payroll, automaticplanning, planning-config, notifications, central-auth/login, approval_process, monolith, etc.). Repo list lives in `connector.connector_specific_config->>'repositories'` (comma-separated, connector id=10). Edit via SQL `jsonb_set(..., '{repositories}', ...)`.
```
repo_owner: doctariDev
include_prs: true, include_issues: true, include_files: true
```
- **6-month cap = `indexing_start`** (filters PRs/issues by `updated >= start`). ⚠️ It also skips a repo's *files* if the repo's `pushed_at < start` — fine for active repos.
- Issues are disabled on most planer repos → 0 issues there (expected).
- Volume seen: `io.planer.service.absences` ≈ 3060 docs; `io.planer.frontend.absences` ≈ 1175; `planerio-monolith` ≈ 437.
- **All 38 doctariDev repos are PRIVATE** → the PAT MUST have full `repo` scope + SAML-SSO authorization (see §4 token gotcha + Gotcha #16).

**⚠️ GitHub token gotchas (2026-06-22, cost us a run):**
1. **Scope:** the PAT needs the top-level **`repo`** scope, not just `public_repo`. A `public_repo`-only token returns **404** on private repos (looks like the repo doesn't exist) and indexes nothing. Verify: `curl -sI -H "Authorization: token <PAT>" https://api.github.com/repos/doctariDev/<private-repo>` → expect `200` and header `x-oauth-scopes: repo`.
2. **SAML SSO:** doctariDev is SSO-gated. After creating/editing the PAT, **Configure SSO → Authorize for doctariDev** on the token, else org repos `403` with an `X-GitHub-SSO` header.
3. **Mid-run 401:** an expired/under-scoped token surfaces as a `401 Bad credentials` partway through indexing (run FAILS, e.g. attempt 218 died at 814 docs). Failed runs prune nothing — already-indexed docs survive.
4. Update the credential via API (encrypted in Postgres):
```
PUT /api/manage/admin/credential/3
body: {credential_json:{github_access_token:"<PAT>"}, admin_public:true,
       source:"github", name:"GitHub PAT", curator_public:false, groups:[]}
```

**Form gotcha:** the Add-Connector wizard's repo field needs a real keystroke to register (programmatic fill didn't commit) — type into it. If `repositories` ends up empty it silently indexes the **whole org**.

---

## 5. Connector: Jira

**What counts as a doc:** **1 issue = 1 doc** (summary + description + **all comments concatenated** into one text section). **Attachments are NOT indexed.** No multiplier.

**Config (our setup):** PAB (all) + PTLSNEW filtered to the Absences service, 6-month cap:
```
jql_query: project = PAB OR (project = PTLSNEW AND cf[11121] = "Absences - new services")
indexing_start: <6 months ago>   (DB only — see §7)
jira_base_url: https://doctari.atlassian.net
```
- **PTLSNEW service field = `customfield_11121`** (single-select). Values include: `Absences - new services`, `Timetracking & Payroll - new services`, `Core and Analytics (former U&A)`, `Planning - new services`, `PHP Maintenance`, `Automatic Planning`, `Planning Configuration - new services`. We want **`Absences - new services`** (note plural "services").
- Volume: all-PTLSNEW ≈ 1,500/6mo (~3,000/yr) of mostly transient support tickets; **Absences-filtered ≈ 458/yr, ~230/6mo** (≈ 94% reduction). PAB ≈ 500/6mo (most PAB activity is recent; 1yr a bit more).

**✅ RESOLVED (2026-06-22) — jira 0-docs was the credential.** The connector returned **0 docs** for weeks. Root cause confirmed: the stored Jira credential's API token was wrong/scoped — NOT the JQL. Replacing `jira_api_token` (credential id=1, keys `jira_user_email` + `jira_api_token`) with a fresh classic Atlassian API token + re-triggering `run-once from_beginning` immediately indexed **1009 docs** (PAB + PTLSNEW both present). Lesson stands: **jira 0-docs = credential, verify the token returns issues.**

Update the token via API (credential_json is encrypted in Postgres — can't SQL it):
```
PUT /api/manage/admin/credential/1
body: {credential_json:{jira_user_email:"<email>", jira_api_token:"<token>"},
       admin_public:true, source:"jira", name:"Jira API token", curator_public:false, groups:[]}
```
(`name` must be a non-null string or PUT 422s.)

---

## 6. Connectors: Web & File
- **Web** (`Planerio website`, base `https://planerio.com/`, recursive): ~24 docs. Fine as-is.
- **File** (`Planerio PDFs`): a few uploaded PDFs (~3 docs). Re-upload the PDFs on the new instance.

---

## 7. indexing_start — the silent drop (Jira, GitHub, Confluence)

`indexing_start` (the date cap) is **NOT settable via the connector PATCH API — it's silently dropped** (returns `null`). It must be written directly in Postgres:
```bash
docker exec onyx-relational_db-1 psql -U postgres -d postgres -c "
UPDATE connector SET indexing_start='2025-12-21 00:00:00+00' WHERE id=<connector_id>;"
```
(Then re-index. `connector_id` ≠ `cc_pair_id` — map via `connector_credential_pair`.)

---

## 8. Operating the reindex / common ops

- **Trigger reindex (from scratch):**
  `POST /api/manage/admin/connector/run-once  {connector_id, credential_ids:[..], from_beginning:true}`
- **Pause/resume a connector:**
  `PUT /api/manage/admin/cc-pair/<ccpair_id>/status  {status:"PAUSED"|"ACTIVE"}`
- **Delete a connector + its docs:** `POST /api/manage/admin/deletion-attempt {connector_id, credential_id}` (async; watch docs drain in Postgres).
- **Prune (drop docs no longer in scope):** `POST /api/manage/admin/cc-pair/<id>/prune`
- **Indexing status (JSON):** `POST /api/manage/admin/connector/indexing-status?secondary_index=false` body `{}`
- **Watch progress in DB:**
  ```sql
  SELECT DISTINCT ON (connector_credential_pair_id) connector_credential_pair_id cc, id, status,
         total_docs_indexed FROM index_attempt
  WHERE search_settings_id=<current> ORDER BY connector_credential_pair_id, id DESC;
  SELECT id, model_name, status, index_name FROM search_settings ORDER BY id DESC;  -- FUTURE/PRESENT/PAST
  ```
- **`cc_pair_id` vs `connector_id` vs `credential_id` all differ.** Always map via `connector_credential_pair`.

---

## 9. Gotchas summary (the stuff that bit us)

1. **Uppercase model name = broken** (no lowercasing → OpenSearch rejects index → stuck reindex + api_server crash-loop). Use lowercase HF ids only (`intfloat/multilingual-e5-large`). §1.
2. **Default embedding model is English-only** (`nomic-embed-text-v1`) → German docs invisible to English queries. Use multilingual. §1.
3. **Image extraction defaults ON** → every inline image = a noise doc; with no vision LLM they're empty. A page showing 4 images can have 400+ stored attachments (Confluence keeps every pasted image across edit history). Turn it OFF. §2.
4. **Empty Confluence CQL = all spaces** (personal + archived + attachments). Always set `type = page AND space = <KEY>`. §3.
5. **Connector-specific config is read-only in the UI** after creation → PATCH API or recreate. §3.
6. **`indexing_start` is dropped by the PATCH API** → set it in Postgres. §7.
7. **GitHub "Documents" ≠ code** — prose files only, default branch only. Onyx is not code search. §4.
8. **Comments**: Confluence & Jira fold comments into the page/issue doc (no toggle). Not bloat, but not separately disableable.
9. **jira 0-docs = credential**, not JQL. Needs a token with project access. ✅ Confirmed + fixed 2026-06-22 (new token → 1009 docs). §5.
10. **"Orphaned index attempt — Celery task not found"** cancellations happen when the stack restarts mid-index (Docker Desktop quit / Mac sleep). Don't sleep the machine during a long initial index.
11. **Stuck-reindex diagnosis:** attempt `IN_PROGRESS` + `total_chunks=0` + docprocessing queue empty + model server only doing health pings ⇒ the target OpenSearch index doesn't exist. Check `_cat/indices`.
12. **Restarting `onyx-background-1`** clears a wedged docprocessing worker; **restarting `onyx-api_server-1`** is needed after DB edits to search_settings (and it ensures indices on boot — but it will crash-loop if a search_settings points at an uppercase index).
13. The Atlassian search APIs (CQL/JQL) here **don't return true totals** (page count caps at page size) — count by date-slicing into <page-size windows, or just let Onyx's `total_docs_indexed` tell you after a run.
14. **DISK WATERMARK (this bit us hardest).** OpenSearch lives in the Docker VM disk. At **>90% disk it silently blocks index creation + writes** (`403 index_create_block_exception` / read-only block). Symptom: reindex "succeeds" but lands almost nothing; api_server **crash-loops** trying to create an index. **Keep the Docker VM disk under ~85%.** Check: `docker exec onyx-opensearch-1 df -h /usr/share/opensearch/data`. The hog was **MinIO** (`onyx_minio_data`): Onyx downloads **every Confluence attachment as a raw blob** (`onyx-files/public/att*`) — 97k blobs / 20 GB from the all-spaces run, **orphaned but NOT garbage-collected when the connector was deleted**. Purge orphaned `att*` blobs + unused HF models (`/app/.cache/huggingface/hub/models--*` in the model-server containers) to reclaim space.
16. **GitHub PAT: full `repo` scope + SSO authorize, or it silently fails.** `public_repo`-only token → 404 on private repos → indexes nothing; missing SSO authorization → 403; expired/under-scoped mid-run → `401 Bad credentials` and the run FAILS partway. All 38 doctariDev repos are private. Verify the token (`x-oauth-scopes: repo`, `200` on a private repo) BEFORE updating Onyx. §4.
15. **Model-migration deadlock on a POPULATED instance (the big one).** Switching embedding models when documents already exist triggers a death spiral: Onyx marks the new model's reindex attempts SUCCESS even when ~nothing was written (e.g. during a disk block) → **auto-promotes the empty index to PRESENT** → `document_index_metadata_sync_task` fires for every existing doc against that empty PRESENT index → **404 storm** that starves the docprocessing worker → the index can never fill → stays empty → storm continues. Status-flipping `search_settings` back to a full model does NOT hold — Onyx re-promotes the empty one. **The only reliable fix: remove the pre-existing documents.** Either (a) **set the desired embedding model FIRST on an empty instance, before adding any connectors** (no migration ever happens — strongly preferred, see §10), or (b) on an already-populated instance, **delete the connectors (clears their docs → kills the storm source), then recreate + index fresh** (credentials survive connector deletion).

---

## 10. Rebuild order (fresh laptop) — ORDER MATTERS

The single most important lesson: **set the embedding model FIRST, on an empty instance, before any connector indexes data.** That avoids the model-migration deadlock (§Gotcha 15) entirely — there are no pre-existing docs to storm.

1. Bring up the Onyx docker stack. **Confirm Docker VM disk has headroom (<85%)** (§Gotcha 14) — model downloads + any attachment blobs eat space fast.
2. Log into `http://localhost:3210/admin`.
3. **Disable image extraction** (§2) — before any indexing (kills attachment-blob bloat + noise docs).
4. **Set the embedding model NOW, before adding connectors.** Use a **lowercase-HF-id multilingual** model (§1). We settled on **`intfloat/multilingual-e5-base`** — it's a built-in self-hosted preset (lowercase, multilingual, auto-prefixes, zero-config, 768-dim). `multilingual-e5-large` (1024, custom, needs `query: `/`passage: ` prefixes) is higher quality but you must add it as a custom model. **Avoid uppercase ids (Qwen/…, BAAI/…).** Verify the lowercase index gets created in OpenSearch.
5. Add credentials: Confluence (cloud token), GitHub (org PAT), **Jira (token WITH PAB/PTLSNEW access — VERIFY it returns issues!)**, web, file.
6. Create connectors with the scoped configs (§3–6). Repo field needs a real keystroke; CQL set at creation or PATCH after.
7. Set `indexing_start` in Postgres for Jira/GitHub (and Confluence if date-capping) (§7).
8. `run-once from_beginning` each connector; watch `index_attempt` + the `danswer_chunk_intfloat_multilingual_e5_base` count climb (chunks must actually accumulate — if `total_chunks=0`/flat, check disk + that you're not mid-migration).
9. Connect Onyx's MCP (`search_onyx`) to Claude Code as the retrieval tool.

---

## 11. Current state (2026-06-22)

Rebuild complete and indexing healthily. Active embedding index = `danswer_chunk_intfloat_multilingual_e5_base`.

- **Embedding model: `intfloat/multilingual-e5-base`** (768, lowercase, multilingual) = sole `PRESENT`. (Qwen/e5-large/nomic abandoned per §1.)
- **Image extraction: OFF.** Disk crisis fixed earlier (94% → 38%).
- **LLM: Ollama wired** (OpenAI-compatible, qwen3:8b default) — §0. RAM-constrained; tune later.
- **Connectors / doc counts:**
  - **Jira** ✅ — `project = PAB OR (project = PTLSNEW AND cf[11121] = "Absences - new services")`. **1009 docs** (was 0; fixed via new credential, §5).
  - **Confluence** — `type = page AND space = SD`. **2793 docs**.
  - **GitHub** — **38 repos** (id=10), PRs+issues+docs. Re-indexing from beginning (attempt 219) after the token fix; 23/38 repos already present (~7k+ docs), remaining 15 filling. §4.
  - **Web** (planerio.com) — 23 docs.
  - **File** (Planerio PDFs) — was 0/CANCELED historically; ~92 chunks seen. Still flaky; force a clean run if needed.
- **Credentials (encrypted in Postgres; update via API):** Jira (id=1), GitHub PAT (id=3, full `repo` scope + SSO), Confluence (id=4 "doctari").
- **Open items:** (1) GitHub reindex 219 to finish all 38 repos cleanly; (2) Ollama RAM tuning (drop Docker RAM or 3B model); (3) File connector clean re-index of the PDFs.

> Note: an older sibling doc `mcps/Onyx/STATUS.md` is now stale (says nomic index, "all spaces" Confluence, 24 GitHub repos, Jira 0 docs) — this file (ONYX.md) is the current source of truth.
