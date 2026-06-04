import type { CommandCategory } from "@/types/command";

export type CommandMetadata = {
  id: string;
  title: string;
  description: string;
  category: CommandCategory;
  keywords: string[];
  aliases: string[];
  priority: number;
};

export type SemanticInterpretation = {
  commandId: string | null;
  confidence: number;
  reasoning: string;
};

export type SemanticRouterRequest = {
  input: string;
  commands: CommandMetadata[];
};

export type SemanticRouterResponse = {
  suggestion: SemanticInterpretation | null;
};

export interface AIProvider {
  interpretIntent(input: SemanticRouterRequest): Promise<SemanticInterpretation | null>;
}
