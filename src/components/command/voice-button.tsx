"use client";

import { Mic } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function VoiceButton({
  isRecording,
  onClick,
}: {
  isRecording: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={isRecording ? "Stop voice input" : "Start voice input"}
      onClick={onClick}
      className={cn(
        "text-muted-foreground hover:text-foreground inline-flex size-7 items-center justify-center rounded-md transition-colors",
        isRecording && "text-foreground"
      )}
      animate={
        isRecording
          ? {
              scale: [1, 1.08, 1],
              boxShadow: [
                "0 0 0px rgba(99,102,241,0.15)",
                "0 0 18px rgba(99,102,241,0.5)",
                "0 0 0px rgba(99,102,241,0.15)",
              ],
            }
          : { scale: 1, boxShadow: "0 0 0px rgba(99,102,241,0)" }
      }
      transition={{ duration: 1.1, repeat: isRecording ? Number.POSITIVE_INFINITY : 0 }}
    >
      <Mic className="size-4" />
    </motion.button>
  );
}
