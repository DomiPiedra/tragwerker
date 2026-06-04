import { create } from "zustand";

type SemanticCachedResult = {
  commandId: string | null;
  confidence: number;
  reasoning: string;
  createdAt: number;
};

type CommandBarState = {
  isOpen: boolean;
  query: string;
  activeIndex: number;
  recentCommandIds: string[];
  pinnedCommandIds: string[];
  semanticLoading: boolean;
  interpretedCommandId: string | null;
  interpretedConfidence: number | null;
  semanticReasoning: string | null;
  semanticCache: Record<string, SemanticCachedResult>;
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  setActiveIndex: (index: number) => void;
  pushRecent: (id: string) => void;
  togglePinned: (id: string) => void;
  setSemanticLoading: (loading: boolean) => void;
  setSemanticResult: (result: {
    commandId: string | null;
    confidence: number;
    reasoning: string;
  } | null) => void;
  cacheSemanticResult: (
    query: string,
    result: { commandId: string | null; confidence: number; reasoning: string }
  ) => void;
  resetSessionState: () => void;
};

const MAX_RECENTS = 12;

export const useCommandBarStore = create<CommandBarState>((set) => ({
  isOpen: false,
  query: "",
  activeIndex: 0,
  recentCommandIds: [],
  pinnedCommandIds: [],
  semanticLoading: false,
  interpretedCommandId: null,
  interpretedConfidence: null,
  semanticReasoning: null,
  semanticCache: {},
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setQuery: (query) => set({ query }),
  setActiveIndex: (activeIndex) => set({ activeIndex }),
  pushRecent: (id) =>
    set((state) => ({
      recentCommandIds: [id, ...state.recentCommandIds.filter((x) => x !== id)].slice(
        0,
        MAX_RECENTS
      ),
    })),
  togglePinned: (id) =>
    set((state) => ({
      pinnedCommandIds: state.pinnedCommandIds.includes(id)
        ? state.pinnedCommandIds.filter((x) => x !== id)
        : [id, ...state.pinnedCommandIds],
    })),
  setSemanticLoading: (semanticLoading) => set({ semanticLoading }),
  setSemanticResult: (result) =>
    set({
      interpretedCommandId: result?.commandId ?? null,
      interpretedConfidence: result?.confidence ?? null,
      semanticReasoning: result?.reasoning ?? null,
      semanticLoading: false,
    }),
  cacheSemanticResult: (query, result) =>
    set((state) => ({
      semanticCache: {
        ...state.semanticCache,
        [query.toLowerCase()]: {
          commandId: result.commandId,
          confidence: result.confidence,
          reasoning: result.reasoning,
          createdAt: Date.now(),
        },
      },
    })),
  resetSessionState: () =>
    set({
      query: "",
      activeIndex: 0,
      semanticLoading: false,
      interpretedCommandId: null,
      interpretedConfidence: null,
      semanticReasoning: null,
    }),
}));
