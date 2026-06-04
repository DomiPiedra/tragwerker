"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { processCommandBarIntent } from "@/app/actions/processCommandBarIntent";
import type { CommandBarIntentPayload } from "@/types/command-intent";
import { useCommandAttachments } from "@/hooks/use-command-attachments";
import { useCommandResults } from "@/hooks/use-command-results";
import { useSemanticNavigation } from "@/hooks/use-semantic-navigation";
import { useVoiceCommand } from "@/hooks/use-voice-command";
import { getCommandMetadata } from "@/lib/commands/registry";
import { useCommandBarStore } from "@/store/command-bar-store";

type UseCommandInputOptions = {
  /** When true, reads/writes query and activeIndex from the global command bar store. */
  useStore?: boolean;
};

export function useCommandInput(options: UseCommandInputOptions = {}) {
  const useStore = options.useStore ?? false;
  const router = useRouter();

  const storeQuery = useCommandBarStore((state) => state.query);
  const setStoreQuery = useCommandBarStore((state) => state.setQuery);
  const storeActiveIndex = useCommandBarStore((state) => state.activeIndex);
  const setStoreActiveIndex = useCommandBarStore((state) => state.setActiveIndex);
  const close = useCommandBarStore((state) => state.close);
  const pushRecent = useCommandBarStore((state) => state.pushRecent);
  const semanticLoading = useCommandBarStore((state) => state.semanticLoading);

  const [localQuery, setLocalQuery] = useState("");
  const [localActiveIndex, setLocalActiveIndex] = useState(0);
  const query = useStore ? storeQuery : localQuery;
  const setQuery = useStore ? setStoreQuery : setLocalQuery;
  const activeIndex = useStore ? storeActiveIndex : localActiveIndex;
  const setActiveIndex = useStore ? setStoreActiveIndex : setLocalActiveIndex;

  const [aiAuraBoost, setAiAuraBoost] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const {
    attachments,
    hasAttachments,
    uploading: attachmentUploading,
    error: attachmentError,
    setError: setAttachmentError,
    addAttachments,
    removeAttachment,
    clearAttachments,
    uploadFiles,
  } = useCommandAttachments();

  const { commands, results, contentLoading, contentFillSuggestions } = useCommandResults(query);
  const semanticCommands = useMemo(
    () => commands.filter((command) => command.category !== "Content"),
    [commands]
  );
  const semanticResults = useMemo(
    () => results.filter((result) => result.command.category !== "Content"),
    [results]
  );
  const { interpretedCommand, interpretedConfidence } = useSemanticNavigation({
    query,
    commands: semanticCommands,
    results: semanticResults,
  });
  const commandMetadata = useMemo(() => getCommandMetadata(semanticCommands), [semanticCommands]);

  const onClose = useCallback(() => {
    if (useStore) close();
  }, [close, useStore]);

  const hasQuery = query.trim().length > 0;
  const canSubmit = hasQuery || hasAttachments;

  const actionContext = useCallback(
    (intent?: CommandBarIntentPayload) => ({
      close: onClose,
      navigate: (path: string) => router.push(path),
      attachments: attachments.length > 0 ? attachments : undefined,
      intent,
    }),
    [attachments, onClose, router]
  );

  const resolveIntent = useCallback(
    async (transcript: string) => {
      return processCommandBarIntent({
        transcript,
        commands: commandMetadata,
        attachments,
      });
    },
    [attachments, commandMetadata]
  );

  useEffect(() => {
    if (activeIndex < results.length) return;
    setActiveIndex(Math.max(0, results.length - 1));
  }, [activeIndex, results.length, setActiveIndex]);

  useEffect(() => {
    if (query.trim().length === 0) {
      setIsTyping(false);
      return;
    }
    setIsTyping(true);
    const timer = window.setTimeout(() => setIsTyping(false), 420);
    return () => window.clearTimeout(timer);
  }, [query]);

  const execute = useCallback(
    async (index: number) => {
      const result = results[index];
      if (!result) return;
      const command = result.command;
      pushRecent(command.id);
      setIsExecuting(true);
      try {
        await command.action(actionContext());
        clearAttachments();
      } finally {
        setIsExecuting(false);
      }
    },
    [actionContext, clearAttachments, pushRecent, results]
  );

  const executeCommandById = useCallback(
    async (commandId: string, intentPayload?: CommandBarIntentPayload) => {
      const index = results.findIndex((result) => result.command.id === commandId);
      if (index >= 0) {
        const result = results[index];
        if (!result) return;
        pushRecent(result.command.id);
        setIsExecuting(true);
        try {
          await result.command.action(actionContext(intentPayload));
          clearAttachments();
        } finally {
          setIsExecuting(false);
        }
        return;
      }
      const command = commands.find((x) => x.id === commandId);
      if (!command) return;
      pushRecent(command.id);
      setIsExecuting(true);
      try {
        await command.action(actionContext(intentPayload));
        clearAttachments();
      } finally {
        setIsExecuting(false);
      }
    },
    [actionContext, clearAttachments, commands, pushRecent, results]
  );

  const runResolvedIntent = useCallback(
    async (transcript: string) => {
      const trimmed = transcript.trim();
      if (!trimmed && attachments.length === 0) return false;

      const resolved = await resolveIntent(
        trimmed || attachments.map((f) => f.title || f.originalName).join(", ")
      );
      if (!resolved.commandId || resolved.confidence < 0.35) return false;

      setAiAuraBoost(true);
      window.setTimeout(() => setAiAuraBoost(false), 700);
      await executeCommandById(resolved.commandId, resolved.payload);
      return true;
    },
    [attachments, executeCommandById, resolveIntent]
  );

  const handleAICommand = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed && attachments.length === 0) return;
      await runResolvedIntent(trimmed);
    },
    [attachments.length, runResolvedIntent]
  );

  const { isRecording, toggle: toggleVoice } = useVoiceCommand({
    onInterim: (text) => {
      setQuery(text);
      setActiveIndex(0);
    },
    onFinal: (text) => {
      void (async () => {
        setIsExecuting(true);
        try {
          await handleAICommand(text);
          if (!useStore) setQuery("");
          clearAttachments();
        } finally {
          setIsExecuting(false);
        }
      })();
    },
    onError: (message) => {
      setToastMessage(message);
      window.setTimeout(() => setToastMessage(null), 2600);
    },
  });

  const listeningAura =
    semanticLoading ||
    contentLoading ||
    aiAuraBoost ||
    isRecording ||
    isTyping ||
    isExecuting ||
    attachmentUploading;
  const ringOpacity = isTyping ? 0.92 : listeningAura ? 0.56 : canSubmit ? 0.14 : 0.06;
  const spinDuration = isTyping ? 3.4 : 7;

  const submit = useCallback(async () => {
    const trimmed = query.trim();
    if (!canSubmit || isExecuting) return;

    const transcript =
      trimmed ||
      attachments.map((file) => file.title || file.originalName).join(", ");

    setIsExecuting(true);
    try {
      const ran = await runResolvedIntent(transcript);
      if (!ran && interpretedCommand && (interpretedConfidence ?? 0) >= 0.35) {
        const resolved = await resolveIntent(transcript);
        setAiAuraBoost(true);
        window.setTimeout(() => setAiAuraBoost(false), 700);
        await executeCommandById(
          interpretedCommand.id,
          resolved.commandId === interpretedCommand.id ? resolved.payload : undefined
        );
      } else if (!ran && results.length > 0) {
        const top = results[activeIndex]?.command;
        if (top) {
          const resolved = await resolveIntent(transcript);
          if (interpretedCommand) {
            setAiAuraBoost(true);
            window.setTimeout(() => setAiAuraBoost(false), 700);
          }
          await executeCommandById(
            top.id,
            resolved.commandId === top.id ? resolved.payload : undefined
          );
        }
      }
      if (!useStore) setQuery("");
      clearAttachments();
    } finally {
      setIsExecuting(false);
    }
  }, [
    activeIndex,
    attachments.length,
    canSubmit,
    clearAttachments,
    executeCommandById,
    interpretedCommand,
    interpretedConfidence,
    isExecuting,
    query,
    resolveIntent,
    results,
    runResolvedIntent,
    setQuery,
    useStore,
  ]);

  const onQueryChange = useCallback(
    (value: string) => {
      setIsTyping(true);
      setQuery(value);
      setActiveIndex(0);
    },
    [setActiveIndex, setQuery]
  );

  const clearQuery = useCallback(() => {
    setQuery("");
    setActiveIndex(0);
  }, [setActiveIndex, setQuery]);

  return {
    query,
    setQuery,
    onQueryChange,
    clearQuery,
    activeIndex,
    setActiveIndex,
    commands,
    results,
    contentLoading,
    contentFillSuggestions,
    interpretedCommand,
    interpretedConfidence,
    semanticLoading,
    isRecording,
    toggleVoice,
    isExecuting,
    hasQuery,
    canSubmit,
    attachments,
    hasAttachments,
    attachmentUploading,
    attachmentError,
    setAttachmentError,
    addAttachments,
    removeAttachment,
    uploadFiles,
    listeningAura,
    isTyping,
    ringOpacity,
    spinDuration,
    aiAuraBoost,
    toastMessage,
    execute,
    executeCommandById,
    handleAICommand,
    submit,
    setAiAuraBoost,
  };
}
