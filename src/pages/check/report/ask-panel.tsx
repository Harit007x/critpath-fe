import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { RiSendPlane2Line, RiSparkling2Line, RiStopCircleLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShimmerText } from "@/components/ui/shimmer-text";
import { Textarea } from "@/components/ui/textarea";
import { StreamError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { aiService, type AiEvent, type ChatTurn } from "@/services/ai.service";

/** Starting points that the assistant's tools can answer. */
const SUGGESTIONS = [
  "What's the overall status of this schedule?",
  "How many rows are broken, and why?",
  "Which activities have the most float?",
  "Which activities are missing links?",
];

const MAX_CHARS = 4000;

type Message = ChatTurn & {
  /** Set on an assistant message that stopped with an error. */
  error?: string;
};

/**
 * Ask questions about one stored upload. The answer streams from critpath-ai (through
 * critpath-be); every number in it comes from the checker's stored results.
 *
 * Mount it with `key={fileId}` so opening another file starts a new conversation.
 */
export function AskPanel({ fileId }: { fileId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  // Stop an answer that is still streaming when the panel goes away.
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => bottom.current?.scrollIntoView({ block: "nearest" }), [messages, status]);

  const updateAnswer = (change: (answer: Message) => Message) =>
    setMessages((current) => [...current.slice(0, -1), change(current[current.length - 1])]);

  const ask = async (text: string) => {
    const content = text.trim();
    if (!content || pending) return;
    // Earlier answers that failed are shown but not sent back.
    const history: ChatTurn[] = [
      ...messages.filter((m) => !m.error && m.content).map(({ role, content }) => ({ role, content })),
      { role: "user", content },
    ];
    setMessages((current) => [...current, { role: "user", content }, { role: "assistant", content: "" }]);
    setQuestion("");
    setPending(true);
    const controller = new AbortController();
    abort.current = controller;
    // A tool call between two pieces of text starts a new paragraph.
    let breakBeforeText = false;

    const onEvent = (event: AiEvent) => {
      if (event.type === "text") {
        updateAnswer((answer) => ({
          ...answer,
          content: answer.content + (breakBeforeText && answer.content ? "\n\n" : "") + event.text,
        }));
        breakBeforeText = false;
        setStatus(null);
      } else if (event.type === "tool") {
        breakBeforeText = true;
        setStatus(event.state === "started" ? event.label : "Writing the answer");
      } else if (event.type === "error") {
        updateAnswer((answer) => ({ ...answer, error: event.message }));
      }
    };

    try {
      await aiService.ask(fileId, history, onEvent, controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) updateAnswer((answer) => ({ ...answer, error: describe(error) }));
    } finally {
      setPending(false);
      setStatus(null);
      abort.current = null;
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void ask(question);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void ask(question);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiSparkling2Line className="size-4 text-primary" /> Ask about this schedule
        </CardTitle>
        <CardDescription>Answers come from this file's check results.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <Button key={suggestion} variant="outline" size="sm" onClick={() => void ask(suggestion)}>
                {suggestion}
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex max-h-[480px] flex-col gap-3 overflow-y-auto" aria-live="polite">
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            {status && <ShimmerText className="text-xs">{`${status}…`}</ShimmerText>}
            <div ref={bottom} />
          </div>
        )}

        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={onKeyDown}
            maxLength={MAX_CHARS}
            placeholder="Ask about status, broken rows, links or float…"
            aria-label="Your question"
            className="min-h-10 sm:min-h-10"
            rows={1}
          />
          {pending ? (
            <Button type="button" variant="outline" onClick={() => abort.current?.abort()} aria-label="Stop">
              <RiStopCircleLine /> Stop
            </Button>
          ) : (
            <Button type="submit" disabled={!question.trim()} aria-label="Send">
              <RiSendPlane2Line /> Ask
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const mine = message.role === "user";
  if (!mine && !message.content && !message.error) return null;
  return (
    <div className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
      {message.content && (
        <div
          className={cn(
            "max-w-[85%] rounded-lg px-3 py-2 text-xs/relaxed whitespace-pre-wrap",
            mine ? "bg-primary text-primary-foreground" : "border border-border bg-muted/40",
          )}
        >
          {message.content}
        </div>
      )}
      {message.error && <p className="text-xs text-destructive">{message.error}</p>}
    </div>
  );
}

function describe(error: unknown): string {
  if (error instanceof StreamError) {
    if (error.status === 429) return "Too many questions for now. Wait a minute and try again.";
    if (error.code === "AI_DISABLED") return "The assistant isn't switched on for this server.";
    return error.message;
  }
  return "The assistant could not be reached. Try again.";
}
