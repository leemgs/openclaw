---
summary: "Web search configuration for Tavily and SearXNG"
read_when:
  - You want to use Tavily for web search
  - You want to set up a self-hosted SearXNG instance
title: "Web Search Providers"
---

# Web search providers

OpenClaw supports multiple web search providers via the `web_search` tool. You can configure them in `~/.openclaw/openclaw.json` or using environment variables.

## Tavily

[Tavily](https://tavily.com/) is a search engine optimized for AI agents.

1. **Environment Variable:** Set `TAVILY_API_KEY` in your environment.
2. **Configuration:** Update `~/.openclaw/openclaw.json`:

```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "tavily",
        "tavily": {
          "apiKey": "your-tavily-api-key"
        }
      }
    }
  }
}
```

## SearXNG (Self-hosted)

[SearXNG](https://github.com/searxng/searxng) is a free, privacy-respecting metasearch engine you can host yourself.

1. **Self-hosting with Docker:**
   ```bash
   docker run -d -p 8080:8080 searxng/searxng
   ```
2. **Environment Variable:** (Optional) Set `SEARXNG_API_KEY` if your instance requires authentication.
3. **Configuration:** Update `~/.openclaw/openclaw.json`:

```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "searxng",
        "searxng": {
          "baseUrl": "http://localhost:8080"
        }
      }
    }
  }
}
```

## Related documentation

- [Web Tools](/tools/web) — Overview of search and fetch tools.
- [Brave Search setup](/brave-search) — Standard search provider.
- [Perplexity Sonar](/perplexity) — AI-synthesized search results.
