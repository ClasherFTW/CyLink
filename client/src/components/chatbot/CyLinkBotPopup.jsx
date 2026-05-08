import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useCyLinkBot } from "../../features/ai/CyLinkBotContext";

function CyLinkBotPopup() {
  const location = useLocation();
  const {
    isOpen,
    setIsOpen,
    isLoading,
    error,
    messages,
    askFreeform,
    clear,
  } = useCyLinkBot();
  const [draft, setDraft] = useState("");

  if (!location.pathname.startsWith("/app")) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const prompt = draft.trim();
    if (!prompt || isLoading) return;
    setDraft("");
    await askFreeform(prompt);
  }

  return (
    <aside className="bot-popup">
      <button
        type="button"
        className="bot-widget__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>CyLink Bot</span>
        <span className="ask-tag">ask CyLink</span>
      </button>

      {isOpen ? (
        <div className="bot-widget__panel">
          <div className="bot-widget__panel-head">
            <p>Available on all app pages.</p>
            <button type="button" className="soft-action" onClick={clear}>
              Reset
            </button>
          </div>

          <div className="bot-widget__messages">
            {messages.map((message) => (
              <p
                key={message.id}
                className={`chat-bubble chat-bubble--${message.role} ${
                  message.isStreaming ? "chat-bubble--streaming" : ""
                }`}
              >
                {message.content}
                {message.isStreaming ? <span className="chat-caret" aria-hidden="true" /> : null}
              </p>
            ))}
          </div>

          <form className="bot-widget__form" onSubmit={handleSubmit}>
            <textarea
              rows={3}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask CyLink"
              required
            />

            {error ? <p className="inline-error">{error}</p> : null}

            <button type="submit" className="btn btn--primary" disabled={isLoading}>
              {isLoading ? "Generating..." : "Send"}
            </button>
          </form>
        </div>
      ) : null}
    </aside>
  );
}

export default CyLinkBotPopup;
