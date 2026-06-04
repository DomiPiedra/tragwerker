import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";
import type {
  AIProvider,
  SemanticRouterRequest,
  SemanticRouterResponse,
} from "@/lib/ai/types";

export class SemanticRouter {
  constructor(private readonly provider: AIProvider) {}

  async route(request: SemanticRouterRequest): Promise<SemanticRouterResponse> {
    const suggestion = await this.provider.interpretIntent(request);
    return { suggestion };
  }
}

export function createSemanticRouter() {
  return new SemanticRouter(new GeminiProvider());
}
