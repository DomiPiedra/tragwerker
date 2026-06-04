import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AIModelTier = "fast" | "writer" | "capable" | "vision" | "seo";

const DEFAULT_AZURE_DEPLOYMENT = "gpt-5.4";

const GEMINI_BACKUP_BY_TIER: Record<AIModelTier, string[]> = {
  fast: ["gemini-1.5-flash", "gemini-2.0-flash"],
  writer: ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"],
  capable: ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"],
  vision: ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"],
  seo: ["gemini-1.5-flash", "gemini-1.5-flash-latest"],
};

function trimEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function azureEndpoint(): string | undefined {
  const raw =
    trimEnv("AZURE_OPENAI_ENDPOINT") ??
    trimEnv("AZURE_OPENAI_BASE_URL") ??
    trimEnv("OPENAI_BASE_URL");
  if (!raw) return undefined;
  return raw.replace(/\/$/, "");
}

function azureApiKey(): string | undefined {
  return trimEnv("AZURE_OPENAI_API_KEY") ?? trimEnv("OPENAI_API_KEY");
}

function isAzureConfigured(): boolean {
  return Boolean(azureEndpoint() && azureApiKey());
}

function primaryDeploymentName(): string {
  return (
    trimEnv("AZURE_OPENAI_DEPLOYMENT") ??
    trimEnv("AI_PRIMARY_MODEL") ??
    trimEnv("OPENAI_MODEL") ??
    DEFAULT_AZURE_DEPLOYMENT
  );
}

function createAzurePrimaryClient() {
  const baseURL = azureEndpoint();
  const apiKey = azureApiKey();
  if (!baseURL || !apiKey) return null;

  return createOpenAI({
    baseURL,
    apiKey,
    name: "azure-openai",
  });
}

function createStandardOpenAIClient() {
  const apiKey = trimEnv("OPENAI_API_KEY");
  if (!apiKey || isAzureConfigured()) return null;
  return createOpenAI({ apiKey });
}

export function hasAnyAIConfigured(): boolean {
  return Boolean(isAzureConfigured() || trimEnv("OPENAI_API_KEY") || trimEnv("GEMINI_API_KEY"));
}

export function getPrimaryProviderLabel(): string {
  if (isAzureConfigured()) return "Azure OpenAI";
  const provider = (process.env.AI_PRIMARY_PROVIDER ?? "openai").toLowerCase();
  return provider === "openai" ? "OpenAI" : provider;
}

/** Primary model(s) first, then Gemini backup models for the tier. */
export function getModelsForTier(tier: AIModelTier): LanguageModel[] {
  const models: LanguageModel[] = [];

  const azure = createAzurePrimaryClient();
  if (azure) {
    models.push(azure(primaryDeploymentName()));
  } else {
    const openai = createStandardOpenAIClient();
    if (openai) {
      const modelId =
        trimEnv("AI_PRIMARY_MODEL") ??
        trimEnv("OPENAI_MODEL") ??
        (tier === "capable" || tier === "vision" ? "gpt-4o" : "gpt-4o-mini");
      models.push(openai(modelId));
    }
  }

  const geminiKey = trimEnv("GEMINI_API_KEY");
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    const tierBackups = GEMINI_BACKUP_BY_TIER[tier];
    const backup =
      tier === "seo"
        ? (trimEnv("GEMINI_SEO_FALLBACK_MODEL") ?? tierBackups[0])
        : (trimEnv("GEMINI_BACKUP_MODEL") ?? tierBackups[0]);
    const geminiIds = [backup, ...tierBackups.filter((id) => id !== backup)];
    for (const id of geminiIds) {
      models.push(google(id));
    }
  }

  return models;
}
