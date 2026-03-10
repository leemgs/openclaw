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

[SearXNG](https://github.com/searxng/searxng) is a free, privacy-respecting metasearch engine you can host yourself. It is the recommended choice for local or private search workflows.

### 1. Installation

The easiest way to run SearXNG is using Docker.

#### Basic Run

```bash
docker run -d -p 8080:8080 --name searxng searxng/searxng
```

#### Recommended Run (with persistence)

To customize SearXNG settings, mount a local folder for configuration:

```bash
mkdir -p ./searxng
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/searxng:/etc/searxng \
  --name searxng \
  searxng/searxng
```

### 2. SearXNG Configuration (`settings.yml`)

OpenClaw requires SearXNG to support JSON output. You must enable it in your `settings.yml` (located in `/etc/searxng` inside the container).

```yaml
# settings.yml
use_default_settings: true

server:
  port: 8080
  bind_address: "0.0.0.0"
  secret_key: "change_this_to_a_random_string"

search:
  formats:
    - html
    - json # CRITICAL: Must be enabled for OpenClaw
```

### 3. OpenClaw Configuration

Update your `~/.openclaw/openclaw.json` to point to your instance.

```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "searxng",
        "allowPrivateNetwork": true,
        "searxng": {
          "baseUrl": "http://10.251.1.32:8080"
        }
      }
    }
  }
}
```

- **`baseUrl`**: Use the IP address or hostname of your SearXNG server. If running on the same machine as OpenClaw, you can use `http://localhost:8080`.
- **`allowPrivateNetwork`**: Set this to `true` if your SearXNG instance is on a local/private IP (like `10.x.x.x` or `192.168.x.x`) or `localhost`.

### 4. Troubleshooting

#### 403 Forbidden Error

If you receive a 403 Forbidden error in Mattermost or other channels, it is likely due to SearXNG's bot-detection (the `limiter` plugin).

1.  **Check Formats**: Ensure `json` is enabled in `settings.yml`.
2.  **Limiter Configuration**: If your instance is only for personal use, you can relax the limiter in `settings.yml`:
    ```yaml
    enabled_plugins:
      # - 'Limiter'  # Comment out during testing if you see constant 403s
    ```
3.  **Headers**: OpenClaw sends browser-like headers (`User-Agent`, `Accept-Language`, etc.) automatically to help bypass these filters.

#### Freshness Support

SearXNG supports the `freshness` parameter (`pd`, `pw`, `pm`, `py`) which maps to its `time_range` filter (`day`, `week`, `month`, `year`).

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

## Usage Example

In Mattermost, you can ask OpenClaw to perform a web search like this:

```
/ask search "내일 대전 날씨" freshness=pd
```

The `freshness=pd` flag limits results to the past day. Adjust the provider or parameters as needed.

> **Note:** After modifying `~/.openclaw/openclaw.json`, restart the OpenClaw daemon to apply changes:
>
> ```bash
> pkill -f openclaw
> pnpm openclaw onboard --install-daemon
> ```
