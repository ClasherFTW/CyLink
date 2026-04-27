import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import MarkdownEditor from "./MarkdownEditor";

const schema = z.object({
  content: z.string().trim().min(10, "Answer must be at least 10 characters."),
});

function AnswerComposer({
  heading = "Write your answer",
  submitLabel = "Post Answer",
  initialContent = "",
  isSubmitting,
  onSubmit,
  onCancel,
}) {
  const [content, setContent] = useState(initialContent);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      content: initialContent,
    },
  });

  function handleContentChange(nextValue) {
    setContent(nextValue);
    setValue("content", nextValue, { shouldDirty: true, shouldValidate: true });
  }

  async function submitForm(values) {
    try {
      await onSubmit(values.content.trim());
      if (!initialContent) {
        handleContentChange("");
      }
    } catch (error) {
      setError("root", {
        type: "manual",
        message: error.message || "Could not submit answer.",
      });
    }
  }

  return (
    <form className="content-panel composer-panel" onSubmit={handleSubmit(submitForm)}>
      <div className="panel-header">
        <h3>{heading}</h3>
      </div>

      <MarkdownEditor
        label="Answer"
        value={content}
        onChange={handleContentChange}
        minLength={10}
        placeholder="Share your analysis, fix, and why it works."
        rows={7}
      />
      <input type="hidden" {...register("content")} />

      {errors.content ? <p className="inline-error">{errors.content.message}</p> : null}
      {errors.root ? <p className="inline-error">{errors.root.message}</p> : null}

      <div className="inline-actions">
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>

        {onCancel ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default AnswerComposer;
