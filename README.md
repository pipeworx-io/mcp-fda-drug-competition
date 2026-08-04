# mcp-fda-drug-competition

Orange Book competitive intelligence from FDA's monthly official data ZIP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `orange_book_product_search` | Search FDA Orange Book products by ingredient, trade name, applicant, or application number. Returns NDA/ANDA status, therapeutic-equivalence codes, RLD/reference-standard flags, strength, route, and approval date. |
| `orange_book_competition_profile` | Profile FDA Orange Book competition for an ingredient or trade name: matched applications/products, NDA versus ANDA holders, RLD/reference standards, patents, and exclusivities. Approved ANDAs indicate regulatory approval, not launch, supply, substitution, or market share. |
| `orange_book_application_detail` | Retrieve all FDA Orange Book product, patent, and exclusivity rows for one NDA or ANDA application. Patent and exclusivity dates are FDA listings, not a legal conclusion about enforceability or actual generic entry. |
| `orange_book_patent_expirations` | Find listed Orange Book patent expirations in a date window, optionally filtered by drug/applicant through matching product applications. Dates are sponsor-submitted FDA listings and do not establish freedom to operate or a certain launch date. |
| `orange_book_exclusivity_expirations` | Find FDA Orange Book exclusivity expirations in a date window, optionally filtered by drug/applicant. Exclusivity codes have program-specific meanings; expiration alone does not guarantee generic approval or launch. |
| `purple_book_product_search` | Search FDA Purple Book biologic products by proper/proprietary name, applicant, reference product, or BLA. Returns licensure and product-level attributes. A licensed biosimilar is not necessarily launched, available, interchangeable, or substitutable under state law. |
| `purple_book_competition_profile` | Profile FDA-licensed biologic competition around a proper, proprietary, or reference-product name. Counts unique BLAs as sponsors/applications and separates reference products, biosimilars, and interchangeables. It does not measure launches, availability, sales, or market share. |
| `purple_book_biosimilars` | List FDA-licensed 351(k) biosimilar and interchangeable products for an optional reference product, applicant, or product name. Approval/licensure does not establish commercial launch or current availability. |
| `purple_book_interchangeables` | List FDA Purple Book products designated 351(k) Interchangeable, optionally filtered by reference product, applicant, or product name. Interchangeability is an FDA designation; pharmacy substitution remains subject to applicable law and circumstances. |
| `purple_book_reference_product` | Find a reference biologic and its FDA-licensed 351(k) products by proper or proprietary name. Product rows and BLA counts must not be interpreted as market participants, launches, or market share. |
| `purple_book_recent_changes` | Return the changes section of FDA’s latest monthly Purple Book report: N=newly approved, R=added in current release, U=updated. Updated or added does not necessarily mean newly licensed. |

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Fda Drug Competition data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
