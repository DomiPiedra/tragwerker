"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type CommandInputAuraProps = {
  children: React.ReactNode;
  className?: string;
  hasQuery: boolean;
  listeningAura: boolean;
  isTyping: boolean;
  isRecording: boolean;
  ringOpacity: number;
  spinDuration: number;
};

export function CommandInputAura({
  children,
  className,
  hasQuery,
  listeningAura,
  isTyping,
  isRecording,
  ringOpacity,
  spinDuration,
}: CommandInputAuraProps) {
  return (
    <div className={cn("relative rounded-2xl p-px", className)}>
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9), rgba(59,130,246,0.9), rgba(99,102,241,0.9))",
        }}
        animate={{
          rotate: 360,
          opacity: ringOpacity,
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: spinDuration,
          ease: "linear",
        }}
        initial={false}
        whileHover={!hasQuery && !listeningAura ? { opacity: 0.22 } : undefined}
      />
      <div className="relative rounded-2xl">
        <AnimatePresence>
          {isTyping && !isRecording ? (
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(99,102,241,0.5), 0 0 34px rgba(139,92,246,0.45), 0 0 72px rgba(59,130,246,0.25)",
                }}
                animate={{ opacity: [0.38, 0.82, 0.38] }}
                transition={{
                  duration: 1.35,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
        <AnimatePresence>
          {isRecording ? (
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(99,102,241,0.35), 0 0 30px rgba(99,102,241,0.35), 0 0 60px rgba(59,130,246,0.2)",
                }}
                animate={{ opacity: [0.45, 0.85, 0.45] }}
                transition={{
                  duration: 1.2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
        {children}
      </div>
    </div>
  );
}
