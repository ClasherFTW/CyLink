import { formatRelativeTime, truncateText } from "../../utils/formatters";
import { getId, isSameId } from "../../utils/id";
import { markdownToText } from "../../utils/markdown";

function QuestionCard({
  question,
  currentUserId,
  isSaved,
  onOpen,
  onVote,
  onToggleSave,
  onStartChat,
  onExplain,
  onEdit,
  onDelete,
}) {
  const voteScore = question.voteScore || 0;
  const answerCount = question.answersCount || 0;
  const questionOwnerId = getId(question.userId);
  const isOwner = isSameId(questionOwnerId, currentUserId);

  return (
    <article className="question-item">
      <aside className="question-item__stats">
        <strong>{voteScore}</strong>
        <span>zesty</span>
        <strong className={answerCount > 0 ? "has-answer" : ""}>{answerCount}</strong>
        <span>answers</span>
      </aside>

      <div className="question-item__body">
        <h3>
          <button type="button" className="linklike" onClick={() => onOpen(question._id)}>
            {question.title}
          </button>
        </h3>

        <p>{truncateText(markdownToText(question.description), 220)}</p>

        <div className="question-item__footer">
          <div className="tag-row">
            {(question.tags || []).map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
              </span>
            ))}
          </div>

          <small>
            asked {formatRelativeTime(question.createdAt)} by {question.userId?.username || "anonymous"}
          </small>
        </div>
      </div>

      <div className="question-item__actions">
        <button type="button" className="vote-action" onClick={() => onVote(question._id, "upvote")}>ZESTY</button>
        <button type="button" className="vote-action" onClick={() => onVote(question._id, "downvote")}>NOT ZESTY</button>
        <button type="button" className="soft-action" onClick={() => onExplain(question)}>
          Explain by CyLink
        </button>
        <button type="button" className="soft-action" onClick={() => onToggleSave(question._id)}>
          {isSaved ? "Saved" : "Save"}
        </button>
        <button type="button" className="soft-action" onClick={() => onStartChat(questionOwnerId)}>
          Message
        </button>
        {isOwner ? (
          <>
            <button type="button" className="soft-action" onClick={() => onEdit(question)}>
              Edit
            </button>
            <button type="button" className="soft-action danger" onClick={() => onDelete(question)}>
              Delete
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export default QuestionCard;
