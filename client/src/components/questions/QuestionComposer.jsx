import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import MarkdownEditor from "./MarkdownEditor";
import { normalizeTagList } from "../../utils/formatters";

const schema = z.object({
  title: z.string().trim().min(10, "Title must be at least 10 characters.").max(200),
  description: z.string().trim().min(20, "Description must be at least 20 characters."),
  tags: z.string().optional(),
});

function QuestionComposer({ onSubmit, isSubmitting, initialValue = null, submitLabel = "Publish Question", onCancel }) {
  const [description, setDescription] = useState(initialValue?.description || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialValue?.title || "",
      description: initialValue?.description || "",
      tags: (initialValue?.tags || []).join(", "),
    },
  });

  async function submitForm(values) {
    try {
      await onSubmit({
        title: values.title.trim(),
        description: description.trim(),
        tags: normalizeTagList(values.tags),
      });
    } catch (error) {
      setError("root", {
        type: "manual",
        message: error.message || "Failed to submit question.",
      });
    }
  }

  function handleDescriptionChange(nextValue) {
    setDescription(nextValue);
    setValue("description", nextValue, { shouldValidate: true, shouldDirty: true });
  }

  return (
    <form className="content-panel composer-panel" onSubmit={handleSubmit(submitForm)}>
      <div className="panel-header">
        <h2>{initialValue ? "Edit question" : "Ask Question"}</h2>
        <p>Use markdown, include code blocks, and provide enough context.</p>
      </div>

      <label>
        Title
        <input {...register("title")} placeholder="Describe your issue clearly" />
      </label>
      {errors.title ? <p className="inline-error">{errors.title.message}</p> : null}

      <MarkdownEditor
        label="Description"
        value={description}
        onChange={handleDescriptionChange}
        minLength={20}
        placeholder="Explain expected behavior, actual behavior, and steps to reproduce."
      />
      <input type="hidden" {...register("description")} />
      {errors.description ? <p className="inline-error">{errors.description.message}</p> : null}

      <label>
        Tags (comma separated)
        <input {...register("tags")} placeholder="react, node.js, mongodb" />
      </label>

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

export default QuestionComposer;
