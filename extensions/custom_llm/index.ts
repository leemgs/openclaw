import {
  definePluginEntry,
  type OpenClawPluginApi,
  type ProviderAuthMethodNonInteractiveContext,
} from "openclaw/plugin-sdk/plugin-entry";
import {
  CUSTOM_LLM_DEFAULT_API_KEY_ENV_VAR,
  CUSTOM_LLM_DEFAULT_BASE_URL,
  CUSTOM_LLM_MODEL_PLACEHOLDER,
  CUSTOM_LLM_PROVIDER_LABEL,
  buildCustomLlmProvider,
} from "./api.js";

const PROVIDER_ID = "custom_llm";

async function loadProviderSetup() {
  return await import("openclaw/plugin-sdk/provider-setup");
}

export default definePluginEntry({
  id: "custom_llm",
  name: "Custom LLM Provider",
  description: "Bundled Custom LLM provider plugin",
  register(api: OpenClawPluginApi) {
    api.registerProvider({
      id: PROVIDER_ID,
      label: "Custom LLM",
      docsPath: "/providers/custom_llm",
      envVars: ["CUSTOM_LLM_API_KEY"],
      auth: [
        {
          id: "custom",
          label: CUSTOM_LLM_PROVIDER_LABEL,
          hint: "Fast self-hosted OpenAI-compatible server",
          kind: "custom",
          run: async (ctx) => {
            const providerSetup = await loadProviderSetup();
            return await providerSetup.promptAndConfigureOpenAICompatibleSelfHostedProviderAuth({
              cfg: ctx.config,
              prompter: ctx.prompter,
              providerId: PROVIDER_ID,
              providerLabel: CUSTOM_LLM_PROVIDER_LABEL,
              defaultBaseUrl: CUSTOM_LLM_DEFAULT_BASE_URL,
              defaultApiKeyEnvVar: CUSTOM_LLM_DEFAULT_API_KEY_ENV_VAR,
              modelPlaceholder: CUSTOM_LLM_MODEL_PLACEHOLDER,
            });
          },
          runNonInteractive: async (ctx: ProviderAuthMethodNonInteractiveContext) => {
            const providerSetup = await loadProviderSetup();
            return await providerSetup.configureOpenAICompatibleSelfHostedProviderNonInteractive({
              ctx,
              providerId: PROVIDER_ID,
              providerLabel: CUSTOM_LLM_PROVIDER_LABEL,
              defaultBaseUrl: CUSTOM_LLM_DEFAULT_BASE_URL,
              defaultApiKeyEnvVar: CUSTOM_LLM_DEFAULT_API_KEY_ENV_VAR,
              modelPlaceholder: CUSTOM_LLM_MODEL_PLACEHOLDER,
            });
          },
        },
      ],
      discovery: {
        order: "late",
        run: async (ctx) => {
          const providerSetup = await loadProviderSetup();
          return await providerSetup.discoverOpenAICompatibleSelfHostedProvider({
            ctx,
            providerId: PROVIDER_ID,
            buildProvider: buildCustomLlmProvider,
          });
        },
      },
      wizard: {
        setup: {
          choiceId: "custom_llm",
          choiceLabel: "Custom LLM",
          choiceHint: "Fast self-hosted OpenAI-compatible server",
          groupId: "custom_llm",
          groupLabel: "Custom LLM",
          groupHint: "Fast self-hosted server",
          methodId: "custom",
        },
        modelPicker: {
          label: "Custom LLM (custom)",
          hint: "Enter Custom LLM URL + API key + model",
          methodId: "custom",
        },
      },
    });
  },
});
