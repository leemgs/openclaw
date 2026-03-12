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

If you receive a 403 Forbidden error (e.g., when asking for weather in Mattermost), it usually indicates that SearXNG's bot-detection or the missing JSON format is blocking the request.

**Potential causes:**

- Missing `json` format in `settings.yml`.
- Server-side restrictions (rate limiting, IP blocking via the `Limiter` plugin).
- Misconfigured SearXNG instance.

##### Resolution Method 1: Modify inside the running container

1.  **Identify the container:**
    ```bash
    docker ps | grep searxng
    ```
2.  **Enter the container:**
    ```bash
    docker exec -it {container_name} sh
    ```
3.  **Locate and edit `settings.yml`:**

    ```bash
    find / -name "settings.yml" 2>/dev/null
    vi /etc/searxng/settings.yml
    ```

    Add `json` to `formats` and comment out the `Limiter` if you are on a private network:

    ```yaml
    search:
      formats:
        - html
        - json # ← Add this

    enabled_plugins:
      # - 'Limiter' # ← Comment out for personal/private instances
      - "Basic Calculator"
      - "Hash plugin"
    ```

    > [!WARNING]
    > For public instances, keep the `Limiter` enabled. Only disable it for internal or private network use.

4.  **Restart the container:**
    ```bash
    exit
    docker restart {container_name}
    ```

##### Resolution Method 2: Volume Mounting (Recommended)

Mount a host-side `settings.yml` to ensure settings persist after container updates or removals.

1.  **Copy the config from the container:**
    ```bash
    docker cp {container_id}:/etc/searxng/settings.yml ~/searxng-settings.yml
    ```
2.  **Edit the file on your host:**
    Add `json` to `formats` and disable `Limiter` as described in Method 1.
3.  **Restart with the volume mount:**
    ```bash
    docker stop searxng
    docker rm searxng
    docker run -d \
      --name searxng \
      -p 8080:8080 \
      -v ~/searxng-settings.yml:/etc/searxng/settings.yml \
      searxng/searxng
    ```

##### Verify the fix (curl)

Verify that the JSON endpoint works manually:

```bash
curl -X GET "http://localhost:8080/search?q=test&format=json" \
  -H "User-Agent: Mozilla/5.0" \
  -H "Accept-Language: ko-KR,ko;q=0.9"
```

If you receive a JSON response, the configuration is correct. If you still see a 403, re-examine `settings.yml`.

#### Freshness Support

SearXNG supports the `freshness` parameter (`pd`, `pw`, `pm`, `py`) which maps to its `time_range` filter (`day`, `week`, `month`, `year`).

## Perplexity / OpenRouter

OpenClaw supports [Perplexity AI](https://www.perplexity.ai/) for web search. It can connect directly to Perplexity's API or via [OpenRouter](https://openrouter.ai/).

- **Default:** If the API key is unrecognized or missing, OpenClaw defaults to **OpenRouter** (`https://openrouter.ai/api/v1`).
- **Direct Perplexity:** API keys starting with `pplx-` are automatically routed to `https://api.perplexity.ai`.
- **OpenRouter:** API keys starting with `sk-or-` are routed to OpenRouter.

### Configuration

```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "perplexity",
        "perplexity": {
          "apiKey": "pplx-your-perplexity-key",
          "model": "sonar-pro"
        }
      }
    }
  }
}
```

- **`apiKey`**: Your Perplexity or OpenRouter key.
- **`baseUrl`**: (Optional) Override the default API endpoint.
- **`model`**: (Optional) Defaults to `sonar-pro`.

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

### Gateway & Authentication Errors

While configuring web search, you may encounter gateway-level security errors if your connection is not properly authorized or secured.

#### Origin not allowed

**Error:** `origin not allowed (open the Control UI from the gateway host or allow it in gateway.controlUi.allowedOrigins)`

This happens when you try to access the OpenClaw Control UI from a browser on a different machine or IP that isn't in the allowlist.

**Resolution:**
Update `gateway.controlUi.allowedOrigins` in your `openclaw.json` to include the IP address of the machine you are browsing from, or use `"*"` to allow any origin (not recommended for public networks).

```json
{
  "gateway": {
    "controlUi": {
      "allowedOrigins": ["http://10.251.1.32:18789", "http://your-client-ip:port"]
    }
  }
}
```

#### Device identity required

**Error:** `device identity required` or `control ui requires device identity (use HTTPS or localhost secure context)`

OpenClaw uses device identity to secure the connection between your browser and the gateway. This requires a **Secure Context** (HTTPS or `localhost`) for the browser's cryptographic APIs to work.

**Resolution:**

1.  **Use Localhost:** Access the UI via `http://localhost:18789` if the gateway is running on the same machine.
2.  **Use HTTPS:** Set up a reverse proxy with TLS (e.g., Nginx, Caddy) to serve the gateway over HTTPS.
3.  **Insecure Auth (Advanced):** If you must use HTTP on a private network, you can enable insecure auth (not recommended):

```json
{
  "gateway": {
    "controlUi": {
      "allowInsecureAuth": true,
      "dangerouslyDisableDeviceAuth": true
    }
  }
}
```

> [!WARNING]
> Disabling device auth or allowing insecure auth exposes your gateway to potential session hijacking. Only use these settings on trusted private networks.

## Final checklist

- Verify `~/.openclaw/openclaw.json` contains the correct `baseUrl` and `allowPrivateNetwork` settings.
- Ensure SearXNG `settings.yml` has `json` format enabled and, if needed, the limiter plugin disabled.
- Restart the OpenClaw daemon to apply configuration changes:
  ```bash
  pkill -f openclaw
  pnpm openclaw onboard --install-daemon
  ```
- Test a simple search in Mattermost:
  ```
  /ask search "내일 대전 날씨" freshness=pd
  ```
  If the result appears without a 403 error, the setup is complete.

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
