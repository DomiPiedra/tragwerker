"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Paperclip } from "lucide-react";

import { CommandAttachmentChips } from "@/components/command/command-attachment-chips";
import { CommandInputAura } from "@/components/command/command-input-aura";
import { CommandMediaPicker } from "@/components/command/command-media-picker";
import { VoiceButton } from "@/components/command/voice-button";
import { useCommandInput } from "@/hooks/use-command-input";
import { cn } from "@/lib/utils";

export function DashboardCreateInput({ className }: { className?: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const {
    query,
    onQueryChange,
    isRecording,
    toggleVoice,
    isExecuting,
    canSubmit,
    attachments,
    attachmentUploading,
    attachmentError,
    addAttachments,
    removeAttachment,
    listeningAura,
    isTyping,
    ringOpacity,
    spinDuration,
    toastMessage,
    submit,
  } = useCommandInput({ useStore: false });

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  const feedback = attachmentError ?? toastMessage;

  return (
    <div className={cn("flex w-full max-w-3xl flex-col", className)}>
      <CommandInputAura
        hasQuery={canSubmit}
        listeningAura={listeningAura}
        isTyping={isTyping}
        isRecording={isRecording}
        ringOpacity={ringOpacity}
        spinDuration={spinDuration}
      >
        <div className="flex flex-col rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/6">
          <textarea
            ref={textareaRef}
            value={query}
            rows={1}
            placeholder="Describe what you want to create..."
            className="placeholder:text-muted-foreground field-sizing-content max-h-40 min-h-[1.5rem] w-full resize-none border-0 bg-transparent text-[15px] leading-relaxed text-foreground outline-none"
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Describe what you want to create"
          />

          <CommandAttachmentChips
            attachments={attachments}
            uploading={attachmentUploading}
            onRemove={removeAttachment}
            className="mt-3"
          />

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              className="text-muted-foreground inline-flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
              aria-label="Attach files"
              onClick={() => setPickerOpen(true)}
            >
              <Paperclip className="size-4" />
            </button>
            <VoiceButton isRecording={isRecording} onClick={toggleVoice} />
            <button
              type="button"
              disabled={!canSubmit || isExecuting}
              className="inline-flex size-8 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              aria-label="Run command"
              onClick={() => void submit()}
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>
      </CommandInputAura>

      <CommandMediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedIds={attachments.map((a) => a.id)}
        onAdd={addAttachments}
      />

      <AnimatePresence>
        {feedback ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className={cn(
              "mt-2 text-center text-xs",
              attachmentError ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {feedback}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
