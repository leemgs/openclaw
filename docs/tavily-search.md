---
summary: "Web search configuration for Tavily"
title: "Tavily Search"
---

# Tavily Search

[Tavily](https://tavily.com/) is a search engine optimized for AI agents.

## 1. Environment Variable

Set `TAVILY_API_KEY` in your environment.

## 2. Configuration

Update `~/.openclaw/openclaw.json`:

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
