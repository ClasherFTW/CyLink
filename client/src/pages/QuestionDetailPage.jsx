import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import AnswerComposer from "../components/questions/AnswerComposer";
import AnswerList from "../components/questions/AnswerList";
import QuestionComposer from "../components/questions/QuestionComposer";
import SkeletonRows from "../components/shared/SkeletonRows";
import EmptyState from "../components/shared/EmptyState";
import {
  createAnswer,
  deleteAnswer,
  listAnswersByQuestion,
  updateAnswer,
  voteAnswer,
} from "../features/answers/answersApi";
import { useAuth } from "../features/auth/AuthContext";
import { useBookmarks } from "../features/bookmarks/BookmarksContext";
import { useToast } from "../features/ui/ToastContext";
import { useCitrusBot } from "../features/ai/CitrusBotContext";
import {
  deleteQuestion,
  getQuestionById,
  updateQuestion,
  voteQuestion,
} from "../features/questions/questionsApi";
import { formatRelativeTime } from "../utils/formatters";
import { getId, isSameId } from "../utils/id";
import { markdownToHtml } from "../utils/markdown";

function QuestionDetailPage() {
  const { questionId } = useParams();
  const { user } = useAuth();
  const { has: isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const { explainQuestion, askFreeform } = useCitrusBot();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState(null);

  const questionQuery = useQuery({
    queryKey: ["question", questionId],
    queryFn: () => getQuestionById(questionId),
  });

  const answersQuery = useQuery({
    queryKey: ["answers", questionId],
    queryFn: () => listAnswersByQuestion(questionId, { page: 1, limit: 100, sortBy: "votes" }),
  });

  const questionVoteMutation = useMutation({
    mutationFn: (voteType) => voteQuestion(questionId, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  const answerVoteMutation = useMutation({
    mutationFn: ({ answerId, voteType }) => voteAnswer(answerId, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["answers", questionId] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  const createAnswerMutation = useMutation({
    mutationFn: (content) =>
      createAnswer({
        questionId,
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["answers", questionId] });
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Answer posted");
    },
    onError: (error) => {
      toast.error("Could not post answer", error.message || "Please try again.");
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: (payload) => updateQuestion(questionId, payload),
    onSuccess: () => {
      setIsEditingQuestion(false);
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Question updated");
    },
    onError: (error) => {
      toast.error("Could not update question", error.message || "Please try again.");
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: () => deleteQuestion(questionId),
    onSuccess: () => {
      toast.info("Question deleted");
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      navigate("/app");
    },
    onError: (error) => {
      toast.error("Could not delete question", error.message || "Please try again.");
    },
  });

  const updateAnswerMutation = useMutation({
    mutationFn: ({ answerId, content }) => updateAnswer(answerId, { content }),
    onSuccess: () => {
      setEditingAnswer(null);
      queryClient.invalidateQueries({ queryKey: ["answers", questionId] });
      toast.success("Answer updated");
    },
    onError: (error) => {
      toast.error("Could not update answer", error.message || "Please try again.");
    },
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: (answerId) => deleteAnswer(answerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["answers", questionId] });
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
      toast.info("Answer deleted");
    },
    onError: (error) => {
      toast.error("Could not delete answer", error.message || "Please try again.");
    },
  });

  const question = questionQuery.data;
  const answers = answersQuery.data?.items || [];

  const isOwner = useMemo(() => {
    if (!question) return false;
    return isSameId(getId(question.userId), user?.id || user?._id);
  }, [question, user?.id, user?._id]);

  async function handleExplainQuestion() {
    if (!question) return;
    await explainQuestion(question);
  }

  async function handleExplainAnswer(questionItem, answer) {
    const prompt = [
      "Explain this question and answer in simple terms and suggest a practical next action.",
      `Question title: ${questionItem?.title || ""}`,
      `Question description: ${questionItem?.description || ""}`,
      `Answer: ${answer?.content || ""}`,
    ]
      .filter(Boolean)
      .join("\n");

    await askFreeform(prompt);
  }

  if (questionQuery.isLoading) {
    return (
      <AppShell title="Question" subtitle="Loading">
        <section className="content-panel">
          <SkeletonRows count={3} />
        </section>
      </AppShell>
    );
  }

  if (questionQuery.isError || !question) {
    return (
      <AppShell title="Question" subtitle="Not available">
        <EmptyState
          title="Question not found"
          description={questionQuery.error?.message || "The question may have been removed."}
          action={
            <Link to="/app" className="btn btn--primary">
              Back to Questions
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Question Details"
      subtitle={`Asked ${formatRelativeTime(question.createdAt)}`}
      actions={
        <>
          <button
            type="button"
            className={`btn ${isBookmarked(questionId) ? "btn--primary" : "btn--ghost"}`}
            onClick={() => {
              toggleBookmark(questionId);
              toast.info(isBookmarked(questionId) ? "Removed from saved" : "Added to saved");
            }}
          >
            {isBookmarked(questionId) ? "Saved" : "Save"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => navigate(`/app/chat?participant=${getId(question.userId)}`)}>
            Message Author
          </button>
        </>
      }
    >
      {isEditingQuestion ? (
        <QuestionComposer
          key={`edit-question-${questionId}`}
          initialValue={question}
          isSubmitting={updateQuestionMutation.isPending}
          onSubmit={(payload) => updateQuestionMutation.mutateAsync(payload)}
          submitLabel="Save Question"
          onCancel={() => setIsEditingQuestion(false)}
        />
      ) : (
        <section className="content-panel question-view-panel">
          <div className="question-view-panel__head">
            <h2>{question.title}</h2>
            <div className="inline-actions compact">
              <button type="button" className="vote-action" onClick={() => questionVoteMutation.mutate("upvote")}>
                ZESTY
              </button>
              <strong>{question.voteScore || 0}</strong>
              <button type="button" className="vote-action" onClick={() => questionVoteMutation.mutate("downvote")}>
                NOT ZESTY
              </button>
              <button type="button" className="soft-action" onClick={handleExplainQuestion}>
                Explain by Citrus
              </button>
            </div>
          </div>

          <div className="question-view-panel__body" dangerouslySetInnerHTML={{ __html: markdownToHtml(question.description) }} />

          <div className="question-view-panel__footer">
            <div className="tag-row">
              {(question.tags || []).map((tag) => (
                <span className="tag-chip" key={tag}>
                  {tag}
                </span>
              ))}
            </div>

            <small>
              by {question.userId?.username || "anonymous"} | {formatRelativeTime(question.createdAt)}
            </small>
          </div>

          {isOwner ? (
            <div className="inline-actions compact">
              <button type="button" className="btn btn--ghost" onClick={() => setIsEditingQuestion(true)}>
                Edit Question
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  if (window.confirm("Delete this question and all related answers?")) {
                    deleteQuestionMutation.mutate();
                  }
                }}
              >
                Delete Question
              </button>
            </div>
          ) : null}
        </section>
      )}

      {editingAnswer ? (
        <AnswerComposer
          key={`edit-answer-${editingAnswer._id}`}
          heading="Edit your answer"
          submitLabel="Save Answer"
          initialContent={editingAnswer.content}
          isSubmitting={updateAnswerMutation.isPending}
          onSubmit={(content) =>
            updateAnswerMutation.mutateAsync({
              answerId: editingAnswer._id,
              content,
            })
          }
          onCancel={() => setEditingAnswer(null)}
        />
      ) : (
        <AnswerComposer
          heading="Write your answer"
          submitLabel="Post Answer"
          initialContent=""
          isSubmitting={createAnswerMutation.isPending}
          onSubmit={(content) => createAnswerMutation.mutateAsync(content)}
        />
      )}

      <AnswerList
        question={question}
        answers={answers}
        currentUserId={user?.id || user?._id}
        onVote={(answerId, voteType) => answerVoteMutation.mutate({ answerId, voteType })}
        onStartEdit={(answer) => setEditingAnswer(answer)}
        onDelete={(answer) => {
          if (window.confirm("Delete this answer?")) {
            deleteAnswerMutation.mutate(answer._id);
          }
        }}
        onExplain={(questionItem, answer) => handleExplainAnswer(questionItem, answer)}
      />
    </AppShell>
  );
}

export default QuestionDetailPage;
