---
summary: "Run OpenClaw against a self-hosted OpenAI-compatible server via the bundled Custom LLM provider"
read_when:
  - You want the bundled provider preset with guided onboarding and model auto-discovery
  - You run a self-hosted OpenAI-compatible server (for example SGLang, vLLM, or any /v1 gateway)
title: "Custom LLM Provider"
---

# Custom LLM Provider

The bundled `custom_llm` provider connects OpenClaw to any **OpenAI-compatible**
self-hosted server (for example SGLang, vLLM, or any `/v1` gateway) using the
`openai-completions` API. It adds guided onboarding and model auto-discovery on
top of a plain provider entry.

<Note>
For a fully hand-written provider entry with no preset behavior, see
[Custom LLM](/providers/custom-llm) instead. This page documents the bundled
`custom_llm` provider plugin.
</Note>

OpenClaw can **auto-discover** available models from your server when you opt
in with `CUSTOM_LLM_API_KEY` (any value works if your server does not enforce auth)
and you do not define an explicit `models.providers.custom_llm` entry.

## Quick start

1. Start your self-hosted OpenAI-compatible server.

Your base URL should expose `/v1` endpoints (for example `/v1/models`,
`/v1/chat/completions`). Such servers commonly run on:

- `http://127.0.0.1:30000/v1`

<Warning>
Set `baseUrl` to the `/v1` root, **not** the full
`/v1/chat/completions` path. The `openai-completions` client appends
`/chat/completions` itself, so a base URL that already ends in
`/chat/completions` becomes `/v1/chat/completions/chat/completions` and the
request fails (typically `404`, or `401` from a fronting proxy). If you copied
a URL from a `curl` example that ended in `/chat/completions`, trim that suffix.
</Warning>

2. Opt in (any value works if no auth is configured):

```bash
export CUSTOM_LLM_API_KEY="custom-llm-local"
```

3. Run onboarding and choose `Custom LLM`, or set a model directly:

```bash
openclaw onboard
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "custom_llm/your-model-id" },
    },
  },
}
```

## Model discovery (implicit provider)

When `CUSTOM_LLM_API_KEY` is set (or an auth profile exists) and you **do not**
define `models.providers.custom_llm`, OpenClaw will query:

- `GET http://127.0.0.1:30000/v1/models`

and convert the returned IDs into model entries.

If you set `models.providers.custom_llm` explicitly, auto-discovery is skipped and
you must define models manually.

## Explicit configuration (manual models)

Use explicit config when:

- Your server runs on a different host/port.
- You want to pin `contextWindow`/`maxTokens` values.
- Your server requires a real API key (or you want to control headers).

```json5
{
  models: {
    providers: {
      custom_llm: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${CUSTOM_LLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local Custom LLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Gateways that require Basic auth or a custom header

By default the `openai-completions` client sends credentials as
`Authorization: Bearer <apiKey>`. Some hosted gateways instead expect a
different scheme, for example HTTP Basic auth where the token is already a
base64-encoded `id:secret`:

```bash
curl -X POST "https://your-gateway/path/v1/chat/completions" \
  -H "Authorization: Basic <token>" \
  -H "Content-Type: application/json" \
  -d '{"model":"your-model-id","messages":[{"role":"user","content":"ping"}]}'
```

When the gateway needs a non-Bearer scheme, set the `Authorization` header
explicitly under the provider. A configured header overrides the
auto-generated `Bearer` header, so the exact value you set is what gets sent:

```json5
{
  models: {
    providers: {
      custom_llm: {
        baseUrl: "https://your-gateway/path/v1",
        api: "openai-completions",
        apiKey: "${CUSTOM_LLM_API_KEY}",
        headers: {
          Authorization: "Basic <token>",
        },
        models: [
          {
            id: "your-model-id",
            name: "Your Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Troubleshooting

- Check the server is reachable:

```bash
curl http://127.0.0.1:30000/v1/models
```

- If requests fail with auth errors, set a real `CUSTOM_LLM_API_KEY` that matches
  your server configuration, or configure the provider explicitly under
  `models.providers.custom_llm`.
- If you get `401` while a `curl` test succeeds, compare the auth scheme. The
  client sends `Bearer` by default. If your gateway expects `Basic` (or another
  scheme), set the `Authorization` header explicitly as shown in
  [Gateways that require Basic auth or a custom header](#gateways-that-require-basic-auth-or-a-custom-header).
- If you get `404` (or `401` from a fronting proxy), confirm `baseUrl` ends at
  `/v1` and not `/v1/chat/completions`.
- If simple requests succeed but agent runs fail with `500`, the served model
  may not support function calling. OpenClaw sends a `tools` array by default
  (for example with the `coding` tools profile), and some models return
  `500` for any request that includes `tools`. Mark the model as tool-free so
  OpenClaw stops sending tool definitions:

  ```json5
  {
    models: {
      providers: {
        custom_llm: {
          // ...
          models: [
            {
              id: "your-model-id",
              // ...
              compat: { supportsTools: false },
            },
          ],
        },
      },
    },
  }
  ```

  With `supportsTools: false` the model can still chat, but it cannot call
  tools (file edits, shell, tool-based web search, and similar agent actions
  are unavailable for that model).

## Proxy-style behavior

The `custom_llm` provider is treated as a proxy-style OpenAI-compatible `/v1`
backend, not a native OpenAI endpoint.

- native OpenAI-only request shaping does not apply here
- no `service_tier`, no Responses `store`, no prompt-cache hints, and no
  OpenAI reasoning-compat payload shaping
- hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`)
  are not injected on custom base URLs
