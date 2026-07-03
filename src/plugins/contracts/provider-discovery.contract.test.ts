import {
  describeCloudflareAiGatewayProviderDiscoveryContract,
  describeGithubCopilotProviderDiscoveryContract,
  describeMinimaxProviderDiscoveryContract,
  describeModelStudioProviderDiscoveryContract,
  describeOllamaProviderDiscoveryContract,
  describeCustomLlmProviderDiscoveryContract,
  describeVllmProviderDiscoveryContract,
} from "../../../test/helpers/plugins/provider-discovery-contract.js";

describeCloudflareAiGatewayProviderDiscoveryContract();
describeGithubCopilotProviderDiscoveryContract();
describeMinimaxProviderDiscoveryContract();
describeModelStudioProviderDiscoveryContract();
describeOllamaProviderDiscoveryContract();
describeCustomLlmProviderDiscoveryContract();
describeVllmProviderDiscoveryContract();
