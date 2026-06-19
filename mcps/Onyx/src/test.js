import { OnyxClient } from "./onyx-client.js"

// Quick smoke test: node --env-file=.env src/test.js
const client = new OnyxClient()
const query = process.argv[2] || "Schichten"
console.error(`Logging in to ${client.baseUrl} as ${client.email} ...`)
const results = await client.search(query, null, 5)
console.error(`search_onyx("${query}") -> ${results.length} results`)
console.log(JSON.stringify(results, null, 2))
