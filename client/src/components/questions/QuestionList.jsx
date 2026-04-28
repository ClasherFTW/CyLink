import QuestionCard from "./QuestionCard";
import EmptyState from "../shared/EmptyState";
import SkeletonRows from "../shared/SkeletonRows";

function QuestionList({
  questions,
  loading,
  error,
  currentUserId,
  savedQuestionIds,
  onOpenQuestion,
  onVoteQuestion,
  onToggleSave,
  onStartChat,
  onExplainQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onRetry,
}) {
  if (loading) {
    return (
      <section className="content-panel">
        <SkeletonRows count={5} />
      </section>
    );
  }

  if (error) {
    return (
      <section className="content-panel">
        <EmptyState
          title="Could not load questions"
          description={error}
          action={
            <button type="button" className="btn btn--primary" onClick={onRetry}>
              Retry
            </button>
          }
        />
      </section>
    );
  }

  if (!questions.length) {
    return (
      <section className="content-panel">
        <EmptyState
          title="No matching questions"
          description="Try changing filters or create a new question."
        />
      </section>
    );
  }

  return (
    <section className="content-panel question-list-panel">
      {questions.map((question) => (
        <QuestionCard
          key={question._id}
          question={question}
          currentUserId={currentUserId}
          isSaved={savedQuestionIds.includes(question._id)}
          onOpen={onOpenQuestion}
          onVote={onVoteQuestion}
          onToggleSave={onToggleSave}
          onStartChat={onStartChat}
          onExplain={onExplainQuestion}
          onEdit={onEditQuestion}
          onDelete={onDeleteQuestion}
        />
      ))}
    </section>
  );
}

export default QuestionList;
