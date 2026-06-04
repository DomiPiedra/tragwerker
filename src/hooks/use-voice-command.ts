"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type VoiceHookInput = {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export function useVoiceCommand({ onInterim, onFinal, onError }: VoiceHookInput) {
  const SILENCE_TIMEOUT_MS = 350;
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTextRef = useRef("");
  const latestTranscriptRef = useRef("");
  const silenceTimerRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      onError("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    finalTextRef.current = "";
    latestTranscriptRef.current = "";
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) finalText += transcript;
        else interim += transcript;
      }

      const merged = `${finalTextRef.current} ${finalText} ${interim}`.trim();
      if (merged.length > 0) {
        latestTranscriptRef.current = merged;
        onInterim(merged);
        if (silenceTimerRef.current) {
          window.clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = window.setTimeout(() => {
          recognitionRef.current?.stop();
        }, SILENCE_TIMEOUT_MS);
      }
      if (finalText.trim().length > 0) finalTextRef.current = `${finalTextRef.current} ${finalText}`.trim();
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        onError("Microphone permission was denied.");
      } else {
        onError("Voice recognition failed. Please try again.");
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) {
        window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setIsRecording(false);
      const text = (finalTextRef.current.trim() || latestTranscriptRef.current.trim()).trim();
      if (text.length > 0) onFinal(text);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      onError("Unable to start voice recognition.");
      setIsRecording(false);
    }
  }, [onError, onFinal, onInterim]);

  const toggle = useCallback(() => {
    if (isRecording) stop();
    else start();
  }, [isRecording, start, stop]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        window.clearTimeout(silenceTimerRef.current);
      }
      recognitionRef.current?.stop();
    };
  }, []);

  return { isRecording, start, stop, toggle };
}
