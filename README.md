# @pipeworx/fda-drug-competition

FDA drug-competition MCP for Orange Book small-molecule approvals, patents, and exclusivities plus Purple Book biologic and biosimilar licensure data.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

- `orange_book_product_search(...)` — search approved NDA and ANDA product rows by drug, applicant, or application.
- `orange_book_competition_profile(...)` — profile NDA/ANDA applications, applicants, patents, and exclusivities for a drug.
- `orange_book_application_detail(...)` — retrieve the products, patents, and exclusivities attached to one application.
- `orange_book_patent_expirations(...)` — find listed patent expirations in a date window.
- `orange_book_exclusivity_expirations(...)` — find regulatory-exclusivity expirations in a date window.
- `orange_book_loss_of_exclusivity_profile(...)` — assemble reference applications, approved ANDAs, and active or elapsed patent/exclusivity ranges for LOE diligence.
- `orange_book_generic_entry_timeline(...)` — show first approval timing for unique ANDA applications.
- `orange_book_reference_drug_landscape(...)` — compare RLD/reference-standard designations and approved ANDAs by dosage form and route.
- `orange_book_expiry_cliff_calendar(...)` — combine patent and exclusivity expirations into a drug-aware calendar.
- `purple_book_product_search(...)` — search licensed biologic product rows by name, applicant, reference product, or BLA.
- `purple_book_competition_profile(...)` — count reference, biosimilar, and interchangeable BLAs around a biologic.
- `purple_book_biosimilars(...)` — list licensed 351(k) biosimilar and interchangeable products.
- `purple_book_interchangeables(...)` — list products carrying FDA's interchangeable designation.
- `purple_book_reference_product(...)` — connect a reference biologic to related licensed 351(k) products.
- `purple_book_recent_changes(...)` — read the additions and updates in FDA's latest monthly report.
- `purple_book_biosimilar_entry_timeline(...)` — show approval timing for unique 351(k) BLAs associated with a reference biologic.

## Auth

Keyless.

## Data sources

- <https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files> — monthly product, patent, and exclusivity files for FDA-approved small-molecule drugs.
- <https://purplebooksearch.fda.gov/downloads> — FDA's latest monthly Purple Book report for licensed biological products.

Orange Book patent dates are sponsor-submitted listings, and regulatory approval dates do not establish launch, availability, sales, market share, patent enforceability, or a certain generic-entry date. RLD and reference-standard designations serve different FDA purposes. Purple Book interchangeability is an FDA designation; pharmacy substitution remains subject to applicable law and circumstances.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "fda-drug-competition": {
      "url": "https://gateway.pipeworx.io/fda-drug-competition/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/fda-drug-competition/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Fda Drug Competition data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/orange_book_product_search \
  -H 'Content-Type: application/json' \
  -d '{"query":"Eliquis","limit":25}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/orange_book_product_search`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
