import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { askCyLinkBotStream } from "./aiApi";

const CyLinkBotContext = createContext(null);

const createMessage = (role, content, extras = {}) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  ...extras,
});

const defaultMessages = () => [
  createMessage("assistant", "I am CyLink Bot. Ask CyLink anything."),
];

export function CyLinkBotProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState(defaultMessages);
  const requestRef = useRef(null);

  const runPrompt = useCallback(async ({ prompt, sourceLabel = "" }) => {
    const cleanPrompt = String(prompt || "").trim();
    if (!cleanPrompt || isLoading) return;

    const assistantMessageId = `assistant-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    setError("");
    setIsOpen(true);
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      createMessage("user", sourceLabel ? `${sourceLabel}\n${cleanPrompt}` : cleanPrompt),
      createMessage("assistant", "", {
        id: assistantMessageId,
        isStreaming: true,
      }),
    ]);

    try {
      const controller = new AbortController();
      requestRef.current = controller;

      const data = await askCyLinkBotStream({
        question: cleanPrompt,
        useRetrieval: true,
        signal: controller.signal,
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    content: `${message.content}${chunk}`,
                    isStreaming: true,
                  }
                : message
            )
          );
        },
      });

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: message.content.trim()
                  ? message.content
                  : data.answer || "No response returned.",
                isStreaming: false,
              }
            : message
        )
      );
    } catch (requestError) {
      const isAborted = requestError?.name === "AbortError";
      setError(
        isAborted
          ? "CyLink Bot request cancelled."
          : requestError.message || "Could not reach CyLink Bot."
      );
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: isAborted
                  ? "Generation cancelled."
                  : "I could not generate an answer right now. Please try again.",
                isStreaming: false,
              }
            : message
        )
      );
    } finally {
      requestRef.current = null;
      setIsLoading(false);
    }
  }, [isLoading]);

  const explainQuestion = useCallback(
    async (question) => {
      if (!question) return;
      const prompt = [
        "Explain this question in simple terms and suggest practical next debugging steps.",
        `Title: ${question.title || ""}`,
        `Description: ${question.description || ""}`,
        `Tags: ${(question.tags || []).join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n");

      await runPrompt({ prompt, sourceLabel: "Explain by CyLink" });
    },
    [runPrompt]
  );

  const askFreeform = useCallback(
    async (prompt) => {
      await runPrompt({ prompt });
    },
    [runPrompt]
  );

  const cancel = useCallback(() => {
    if (requestRef.current) {
      requestRef.current.abort();
      requestRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const clear = useCallback(() => {
    cancel();
    setError("");
    setMessages(defaultMessages());
  }, [cancel]);

  const value = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      isLoading,
      error,
      messages,
      explainQuestion,
      askFreeform,
      clear,
      cancel,
    }),
    [isOpen, isLoading, error, messages, explainQuestion, askFreeform, clear, cancel]
  );

  return (
    <CyLinkBotContext.Provider value={value}>{children}</CyLinkBotContext.Provider>
  );
}

export function useCyLinkBot() {
  const context = useContext(CyLinkBotContext);
  if (!context) {
    throw new Error("useCyLinkBot must be used inside CyLinkBotProvider.");
  }
  return context;
}

