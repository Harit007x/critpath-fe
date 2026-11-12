import { streamPost } from "@/lib/api";

/** Mirrors critpath-be's POST /api/ai/chat, which passes critpath-ai's events through. */
export type ChatTurn = { role: "user" | "assistant"; content: string };

export type AiEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; label: string; state: "started" | "finished" | "failed" }
  | { type: "done"; model: string; rounds: number; input_tokens: number; output_tokens: number }
  | { type: "error"; code: string; message: string };

export const aiService = {
  /**
   * Asks about a stored upload (`fileId`), with the conversation so far ending in the question.
   * Resolves when the answer ends; rejects with a StreamError when it never started.
   */
  ask(fileId: string, messages: ChatTurn[], onEvent: (event: AiEvent) => void, signal: AbortSignal) {
    return streamPost(
      "/ai/chat",
      { fileId, messages },
      (event, data) => onEvent({ type: event, ...(data as object) } as AiEvent),
      signal,
    );
  },
};
