# mcp-fda-drug-competition

Orange Book competitive intelligence from FDA's monthly official data ZIP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1361+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `orange_book_product_search` | Search FDA Orange Book products by ingredient, trade name, applicant, or application number. Returns NDA/ANDA status, therapeutic-equivalence codes, RLD/reference-standard flags, strength, route, and approval date. |
| `orange_book_competition_profile` | Profile FDA Orange Book competition for an ingredient or trade name: matched applications/products, NDA versus ANDA holders, RLD/reference standards, patents, and exclusivities. Approved ANDAs indicate regulatory approval, not launch, supply, substitution, or market share. |
| `orange_book_application_detail` | Retrieve all FDA Orange Book product, patent, and exclusivity rows for one NDA or ANDA application. Patent and exclusivity dates are FDA listings, not a legal conclusion about enforceability or actual generic entry. |
| `orange_book_patent_expirations` | Find listed Orange Book patent expirations in a date window, optionally filtered by drug/applicant through matching product applications. Dates are sponsor-submitted FDA listings and do not establish freedom to operate or a certain launch date. |
| `orange_book_exclusivity_expirations` | Find FDA Orange Book exclusivity expirations in a date window, optionally filtered by drug/applicant. Exclusivity codes have program-specific meanings; expiration alone does not guarantee generic approval or launch. |

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

Or connect to the full Pipeworx gateway for access to all 1361+ data sources:

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

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
