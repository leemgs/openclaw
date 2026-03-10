---
summary: "Web search configuration for Tavily, SearXNG, and Grok"
read_when:
  - You want to use Tavily or Grok for web search
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

### Freshness support

Tavily supports the `freshness` parameter (`pd`, `pw`, `pm`, `py`) which maps to its `days` parameter (1, 7, 30, and 365 days respectively) to filter for recent content.

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

### Local/Private Network Access

If your SearXNG instance is running on `localhost` or a private IP (e.g., `10.x.x.x`), you may need to explicitly allow private network access in your configuration:

```json
{
  "tools": {
    "web": {
      "search": {
        "allowPrivateNetwork": true
      }
    }
  }
}
```

### Common issues (403 Forbidden)

SearXNG instances often use bot detection. OpenClaw automatically sends common browser headers (`User-Agent` and `Accept-Language`) to bypass these filters. Ensure your SearXNG `settings.yml` allows `json` as a search format:

```yaml
# SearXNG settings.yml
search:
  formats:
    - html
    - json
```

## Grok Search (xAI)

[xAI Grok](https://x.ai/) provides a web search tool via the Responses API.

1.  **Environment Variable:** Set `XAI_API_KEY` in your environment.
2.  **Configuration:** Update `~/.openclaw/openclaw.json`:

```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "grok",
        "grok": {
          "apiKey": "your-xai-api-key"
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
