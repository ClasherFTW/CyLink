import { useMemo, useState } from "react";
import { markdownToHtml } from "../../utils/markdown";

function MarkdownEditor({ label, value, onChange, minLength = 20, placeholder, rows = 8 }) {
  const [tab, setTab] = useState("write");

  const previewHtml = useMemo(() => markdownToHtml(value), [value]);

  return (
    <div className="md-editor">
      <div className="md-editor__head">
        <strong>{label}</strong>
        <div className="md-editor__tabs">
          <button
            type="button"
            className={tab === "write" ? "is-active" : ""}
            onClick={() => setTab("write")}
          >
            Write
          </button>
          <button
            type="button"
            className={tab === "preview" ? "is-active" : ""}
            onClick={() => setTab("preview")}
          >
            Preview
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          minLength={minLength}
          placeholder={placeholder}
        />
      ) : (
        <div className="md-preview" dangerouslySetInnerHTML={{ __html: previewHtml || "<p>Nothing to preview.</p>" }} />
      )}
    </div>
  );
}

export default MarkdownEditor;
