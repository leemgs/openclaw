---
summary: "Connect OpenClaw to any OpenAI-compatible custom LLM endpoint"
read_when:
  - You want to use a self-hosted or vendor LLM that speaks the OpenAI API
  - Your endpoint needs a non-default base URL, auth scheme, or headers
  - You want a generic provider entry that is not tied to a bundled preset
title: "Custom LLM"
---

# Custom LLM

Many inference servers and gateways expose an **OpenAI-compatible** HTTP API
(`/v1/chat/completions`, `/v1/models`). OpenClaw can talk to any of them through
a generic provider entry using the `openai-completions` API. You pick the
provider id, so you can name it something descriptive like `custom_llm`.

Use this approach when no bundled preset fits, or when you prefer a stable,
self-documented provider name in your own config instead of borrowing a preset
such as `sglang`, `vllm`, or `litellm`.

## Quick start

Define the provider explicitly under `models.providers.<your-id>`:

```json5
{
  models: {
    providers: {
      custom_llm: {
        baseUrl: "https://your-host/path/v1",
        api: "openai-completions",
        apiKey: "${CUSTOM_LLM_API_KEY}",
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
  agents: {
    defaults: {
      model: { primary: "custom_llm/your-model-id" },
    },
  },
}
```

The provider id (`custom_llm` above) is arbitrary. Reference the model
everywhere as `<provider-id>/<model-id>`.

## Base URL

<Warning>
Set `baseUrl` to the `/v1` root, **not** the full `/v1/chat/completions`
path. The `openai-completions` client appends `/chat/completions` itself, so a
base URL that already ends in `/chat/completions` becomes
`/v1/chat/completions/chat/completions` and the request fails (typically `404`,
or `401` from a fronting proxy). If you copied a URL from a `curl` example that
ended in `/chat/completions`, trim that suffix.
</Warning>

## Authentication

By default the client sends credentials as `Authorization: Bearer <apiKey>`.
That works for most OpenAI-compatible servers.

Some gateways expect a different scheme, for example HTTP Basic auth where the
token is already a base64-encoded `id:secret`:

```bash
curl -X POST "https://your-host/path/v1/chat/completions" \
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
        baseUrl: "https://your-host/path/v1",
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

Keep a non-empty `apiKey` so the provider is treated as configured, even when
the real credential is carried by the `Authorization` header.

## Models without function calling

OpenClaw sends a `tools` array by default (for example with the `coding` tools
profile). Some models return `500` for any request that includes `tools`, or
for a conversation whose history contains prior `tool_calls` or `tool` results.

Mark such a model as tool-free so OpenClaw stops sending tool definitions:

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

With `supportsTools: false` the model can still chat, but it cannot call tools
(file edits, shell, tool-based web search, and similar agent actions are
unavailable for that model).

<Note>
`supportsTools: false` only stops **new** tool calls. If a session already
contains tool messages from earlier turns, replaying that history can still
trigger `500`. Start a fresh session (in the TUI, run `/reset` or `/new`) after
switching a model to tool-free.
</Note>

## Troubleshooting

- Check the endpoint is reachable and your auth scheme is correct:

```bash
curl https://your-host/path/v1/models -H "Authorization: Bearer <token>"
```

- `401` while a `curl` test succeeds: compare the auth scheme. The client sends
  `Bearer` by default. If your gateway expects `Basic` (or another scheme), set
  the `Authorization` header explicitly as shown in [Authentication](#authentication).
- `404` (or `401` from a fronting proxy): confirm `baseUrl` ends at `/v1` and
  not `/v1/chat/completions`.
- `500` on agent runs while simple chat succeeds: the model likely does not
  support function calling. Set `compat: { supportsTools: false }` and start a
  fresh session. See [Models without function calling](#models-without-function-calling).

## Related presets

If your server matches a known runtime, a bundled preset may give you
auto-discovery and guided onboarding:

- [Ollama](/providers/ollama)
- [vLLM](/providers/vllm)
- [LiteLLM](/providers/litellm)
- [SGLang](/providers/sglang)
