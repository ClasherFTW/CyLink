import { useEffect, useMemo, useRef, useState } from "react";
import { askCitrusBot } from "../../features/ai/aiApi";

const STORAGE_KEY = "citrus_bot_threads";

function getThread(questionId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return Array.isArray(parsed[questionId]) ? parsed[questionId] : null;
  } catch (_error) {
    return null;
  }
}

function saveThread(questionId, messages) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...(typeof parsed === "object" && parsed ? parsed : {}),
        [questionId]: messages,
      })
    );
  } catch (_error) {
    // Ignore storage errors.
  }
}

function CitrusBotPanel({ questionId, post, selectedContext, onClearContext }) {
  const [isOpen, setIsOpen] = useState(true);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState(() =>
    getThread(questionId) || [
      {
        role: "assistant",
        content: "I am Citrus Bot. Ask Citrus anything about this question.",
      },
    ]
  );
  const endRef = useRef(null);

  useEffect(() => {
    const stored = getThread(questionId);
    setMessages(
      stored || [
        {
          role: "assistant",
          content: "I am Citrus Bot. Ask Citrus anything about this question.",
        },
      ]
    );
  }, [questionId]);

  useEffect(() => {
    saveThread(questionId, messages);
  }, [questionId, messages]);

  const postContext = useMemo(() => {
    if (!post) return "";

    return [
      `Question title: ${post.title}`,
      `Question description: ${post.description}`,
      `Tags: ${(post.tags || []).join(", ")}`,
    ].join("\n");
  }, [post]);

  async function handleSubmit(event) {
    event.preventDefault();

    const prompt = draft.trim();
    if (!prompt) return;

    setError("");
    setIsLoading(true);
    setDraft("");

    setMessages((prev) => [...prev, { role: "user", content: prompt }]);

    try {
      const payload = [
        "Citrus context:",
        postContext,
        selectedContext ? `Selected answer context:\n${selectedContext}` : "",
        `User prompt: ${prompt}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const data = await askCitrusBot({
        question: payload,
        useRetrieval: true,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "No response returned.",
        },
      ]);
    } catch (requestError) {
      setError(requestError.message || "Could not reach Citrus Bot.");
    } finally {
      setIsLoading(false);
      window.requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }

  function clearThread() {
    setMessages([
      {
        role: "assistant",
        content: "Thread reset. Ask a fresh question whenever you want.",
      },
    ]);
  }

  return (
    <aside className="bot-widget">
      <button type="button" className="bot-widget__trigger" onClick={() => setIsOpen((prev) => !prev)}>
        <span>Citrus Bot</span>
        <span className="ask-tag">ask citrus</span>
      </button>

      {isOpen ? (
        <div className="bot-widget__panel">
          <div className="bot-widget__panel-head">
            {selectedContext ? (
              <p>
                Using selected answer context.
                <button type="button" className="text-button" onClick={onClearContext}>
                  Clear
                </button>
              </p>
            ) : (
              <p>No answer context selected.</p>
            )}
            <button type="button" className="soft-action" onClick={clearThread}>
              Reset
            </button>
          </div>

          <div className="bot-widget__messages">
            {messages.map((msg, index) => (
              <p key={`${msg.role}-${index}`} className={`chat-bubble chat-bubble--${msg.role}`}>
                {msg.content}
              </p>
            ))}

            {isLoading ? <p className="chat-bubble chat-bubble--assistant">Thinking...</p> : null}
            <div ref={endRef} />
          </div>

          <form className="bot-widget__form" onSubmit={handleSubmit}>
            <textarea
              rows={3}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Citrus about this issue"
              required
            />

            {error ? <p className="inline-error">{error}</p> : null}

            <button type="submit" className="btn btn--primary" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      ) : null}
    </aside>
  );
}

export default CitrusBotPanel;
