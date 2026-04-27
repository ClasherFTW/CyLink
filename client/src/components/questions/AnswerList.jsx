import { formatRelativeTime } from "../../utils/formatters";
import { getId, isSameId } from "../../utils/id";
import { markdownToHtml } from "../../utils/markdown";

function AnswerList({
  answers,
  currentUserId,
  selectedAnswerId,
  onVote,
  onStartEdit,
  onDelete,
  onUseAsContext,
}) {
  if (!answers.length) {
    return (
      <section className="content-panel">
        <h3>Answers</h3>
        <p className="muted">No answers yet. Be the first to help.</p>
      </section>
    );
  }

  return (
    <section className="content-panel">
      <div className="panel-header panel-header--row">
        <h3>Answers ({answers.length})</h3>
      </div>

      <div className="answer-list">
        {answers.map((answer) => {
          const isOwner = isSameId(getId(answer.userId), currentUserId);
          const isSelected = selectedAnswerId === answer._id;

          return (
            <article key={answer._id} className={`answer-item ${isSelected ? "is-context" : ""}`}>
              <div className="answer-item__votes">
                <button type="button" className="vote-action" onClick={() => onVote(answer._id, "upvote")}>
                  +1
                </button>
                <strong>{answer.voteScore || 0}</strong>
                <button type="button" className="vote-action" onClick={() => onVote(answer._id, "downvote")}>
                  -1
                </button>
              </div>

              <div className="answer-item__body">
                <div className="answer-item__content" dangerouslySetInnerHTML={{ __html: markdownToHtml(answer.content) }} />

                <div className="answer-item__footer">
                  <small>
                    by {answer.userId?.username || "anonymous"} ? {formatRelativeTime(answer.createdAt)}
                  </small>

                  <div className="inline-actions compact">
                    <button type="button" className="soft-action" onClick={() => onUseAsContext(answer)}>
                      {isSelected ? "Selected" : "Use in Ask Citrus"}
                    </button>

                    {isOwner ? (
                      <>
                        <button type="button" className="soft-action" onClick={() => onStartEdit(answer)}>
                          Edit
                        </button>
                        <button type="button" className="soft-action danger" onClick={() => onDelete(answer)}>
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default AnswerList;
