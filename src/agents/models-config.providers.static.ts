import { resolveBundledPluginPublicSurfacePath } from "../plugins/public-surface-runtime.js";
import type { ProviderConfig } from "./models-config.providers.secrets.js";

const PROVIDER_CATALOG_ARTIFACT_BASENAME = "provider-catalog.js";
const DEFAULT_PROVIDER_CATALOG_ROOT = path.resolve(import.meta.dirname, "../..");

export type BundledProviderCatalogEntry = {
  dirName: string;
  pluginId: string;
  providers: readonly string[];
  artifactPath: string;
};

type ProviderCatalogModule = Record<string, unknown>;
type ProviderCatalogExportMap = Record<string, unknown>;

let providerCatalogEntriesCache: ReadonlyArray<BundledProviderCatalogEntry> | null = null;
let providerCatalogModulesPromise: Promise<Readonly<Record<string, ProviderCatalogModule>>> | null =
  null;
let providerCatalogExportMapPromise: Promise<Readonly<ProviderCatalogExportMap>> | null = null;

export function resolveBundledProviderCatalogEntries(params?: {
  rootDir?: string;
}): ReadonlyArray<BundledProviderCatalogEntry> {
  const rootDir = params?.rootDir ?? DEFAULT_PROVIDER_CATALOG_ROOT;
  if (rootDir === DEFAULT_PROVIDER_CATALOG_ROOT && providerCatalogEntriesCache) {
    return providerCatalogEntriesCache;
  }

  const entries: BundledProviderCatalogEntry[] = [];
  for (const entry of listBundledPluginMetadata({ rootDir })) {
    if (!entry.publicSurfaceArtifacts?.includes(PROVIDER_CATALOG_ARTIFACT_BASENAME)) {
      continue;
    }
    const artifactPath = resolveBundledPluginPublicSurfacePath({
      rootDir,
      dirName: entry.dirName,
      artifactBasename: PROVIDER_CATALOG_ARTIFACT_BASENAME,
    });
    if (!artifactPath) {
      continue;
    }
    entries.push({
      dirName: entry.dirName,
      pluginId: entry.manifest.id,
      providers: entry.manifest.providers ?? [],
      artifactPath,
    });
  }
  entries.sort((left, right) => left.dirName.localeCompare(right.dirName));

  if (rootDir === DEFAULT_PROVIDER_CATALOG_ROOT) {
    providerCatalogEntriesCache = entries;
  }
  return entries;
}

export async function loadBundledProviderCatalogModules(params?: {
  rootDir?: string;
}): Promise<Readonly<Record<string, ProviderCatalogModule>>> {
  const rootDir = params?.rootDir ?? DEFAULT_PROVIDER_CATALOG_ROOT;
  if (rootDir === DEFAULT_PROVIDER_CATALOG_ROOT && providerCatalogModulesPromise) {
    return providerCatalogModulesPromise;
  }

  const loadPromise = (async () => {
    const entries = resolveBundledProviderCatalogEntries({ rootDir });
    const modules = await Promise.all(
      entries.map(async (entry) => {
        const module = (await import(
          pathToFileURL(entry.artifactPath).href
        )) as ProviderCatalogModule;
        return [entry.dirName, module] as const;
      }),
    );
    return Object.freeze(Object.fromEntries(modules));
  })();

  if (rootDir === DEFAULT_PROVIDER_CATALOG_ROOT) {
    providerCatalogModulesPromise = loadPromise;
  }
  return loadPromise;
}

export async function loadBundledProviderCatalogExportMap(params?: {
  rootDir?: string;
}): Promise<Readonly<ProviderCatalogExportMap>> {
  const rootDir = params?.rootDir ?? DEFAULT_PROVIDER_CATALOG_ROOT;
  if (rootDir === DEFAULT_PROVIDER_CATALOG_ROOT && providerCatalogExportMapPromise) {
    return providerCatalogExportMapPromise;
  }

  const loadPromise = (async () => {
    const modules = await loadBundledProviderCatalogModules({ rootDir });
    const exports: ProviderCatalogExportMap = {};
    const exportOwners = new Map<string, string>();

    for (const [dirName, module] of Object.entries(modules)) {
      for (const [exportName, exportValue] of Object.entries(module)) {
        if (exportName === "default") {
          continue;
        }
        const existingOwner = exportOwners.get(exportName);
        if (existingOwner && existingOwner !== dirName) {
          throw new Error(
            `Duplicate provider catalog export "${exportName}" from folders "${existingOwner}" and "${dirName}"`,
          );
        }
        exportOwners.set(exportName, dirName);
        exports[exportName] = exportValue;
      }
    }

    return Object.freeze(exports);
  })();

  if (rootDir === DEFAULT_PROVIDER_CATALOG_ROOT) {
    providerCatalogExportMapPromise = loadPromise;
  }
  return loadPromise;
}

export const OWL_BASE_URL =
  "https://inference-web-api.mycloud.com/custom_modelo-owl-ultra-think/v1";
export const OWL_DEFAULT_MODEL_ID = "custom_model2-37b-instruct";
export const OWL_DEFAULT_CONTEXT_WINDOW = 120000;
export const OWL_DEFAULT_MAX_TOKENS = 4096;
export const OWL_DEFAULT_COST = {
  input: 0.1,
  output: 0.1,
  cacheRead: 0.05,
  cacheWrite: 0.05,
};

export function buildOwlProvider(): ProviderConfig {
  return {
    baseUrl: OWL_BASE_URL,
    api: "openai-completions",
    auth: "basic",
    models: [
      {
        id: OWL_DEFAULT_MODEL_ID,
        name: "Custom Owl Instruct",
        reasoning: true,
        input: ["text"],
        cost: OWL_DEFAULT_COST,
        contextWindow: OWL_DEFAULT_CONTEXT_WINDOW,
        maxTokens: OWL_DEFAULT_MAX_TOKENS,
      },
    ],
  };
}
