import { IntentProvider } from "@/lib/ai/providers/intent-provider";
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
  return new SemanticRouter(new IntentProvider());
}
