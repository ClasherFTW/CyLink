import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import QuestionComposer from "../components/questions/QuestionComposer";
import QuestionList from "../components/questions/QuestionList";
import { useAuth } from "../features/auth/AuthContext";
import {
  createQuestion,
  deleteQuestion,
  listQuestions,
  updateQuestion,
  voteQuestion,
} from "../features/questions/questionsApi";
import { useBookmarks } from "../features/bookmarks/BookmarksContext";
import { useToast } from "../features/ui/ToastContext";
import { formatShortDate } from "../utils/formatters";

const CLIENT_PAGE_SIZE = 10;

function inDateRange(question, dateRange) {
  if (dateRange === "any") return true;

  const now = Date.now();
  const createdAt = new Date(question.createdAt).getTime();
  const diff = now - createdAt;

  if (Number.isNaN(createdAt)) return true;

  const day = 24 * 60 * 60 * 1000;

  if (dateRange === "24h") return diff <= day;
  if (dateRange === "7d") return diff <= 7 * day;
  if (dateRange === "30d") return diff <= 30 * day;

  return true;
}

function MainPage() {
  const { user } = useAuth();
  const { bookmarks, toggle } = useBookmarks();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: "",
    tag: "",
    dateRange: "any",
    unansweredOnly: false,
    sort: "newest",
  });
  const [page, setPage] = useState(1);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const savedOnly = searchParams.get("saved") === "1";

  const serverSort = filters.sort === "topWeek" ? "votes" : filters.sort;

  const questionsQuery = useQuery({
    queryKey: ["questions", serverSort, filters.search, filters.tag],
    queryFn: () =>
      listQuestions({
        page: 1,
        limit: 50,
        sortBy: serverSort,
        search: filters.search,
        tags: filters.tag,
      }),
  });

  const voteMutation = useMutation({
    mutationFn: ({ questionId, voteType }) => voteQuestion(questionId, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Question posted", "Your new question is now live.");
    },
    onError: (error) => {
      toast.error("Could not post question", error.message || "Please try again.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ questionId, payload }) => updateQuestion(questionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      setEditingQuestion(null);
      toast.success("Question updated", "Your edits have been saved.");
    },
    onError: (error) => {
      toast.error("Could not update question", error.message || "Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast.info("Question deleted");
    },
    onError: (error) => {
      toast.error("Delete failed", error.message || "Please try again.");
    },
  });

  const rawQuestions = questionsQuery.data?.items || [];

  const filteredQuestions = useMemo(() => {
    const base = rawQuestions.filter((question) => {
      if (!inDateRange(question, filters.dateRange)) return false;
      if (filters.unansweredOnly && (question.answersCount || 0) > 0) return false;
      if (savedOnly && !bookmarks.includes(question._id)) return false;
      if (filters.sort === "topWeek") {
        return inDateRange(question, "7d");
      }
      return true;
    });

    if (filters.sort === "topWeek") {
      return [...base].sort((a, b) => (b.voteScore || 0) - (a.voteScore || 0));
    }

    return base;
  }, [rawQuestions, filters.dateRange, filters.unansweredOnly, filters.sort, savedOnly, bookmarks]);

  const availableTags = useMemo(() => {
    const tags = new Set();
    rawQuestions.forEach((question) => {
      (question.tags || []).forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).slice(0, 12);
  }, [rawQuestions]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / CLIENT_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedQuestions = useMemo(() => {
    const start = (safePage - 1) * CLIENT_PAGE_SIZE;
    return filteredQuestions.slice(start, start + CLIENT_PAGE_SIZE);
  }, [filteredQuestions, safePage]);

  async function handleQuestionSubmit(payload) {
    if (editingQuestion) {
      await updateMutation.mutateAsync({
        questionId: editingQuestion._id,
        payload,
      });
      return;
    }

    await createMutation.mutateAsync(payload);
  }

  async function handleDeleteQuestion(question) {
    if (!window.confirm("Delete this question and related answers?")) return;
    await deleteMutation.mutateAsync(question._id);
  }

  function handleVote(questionId, voteType) {
    voteMutation.mutate({ questionId, voteType });
  }

  function handleToggleSaved(questionId) {
    toggle(questionId);
    toast.info("Saved list updated");
  }

  function handleSavedFilterToggle() {
    const next = new URLSearchParams(searchParams);
    if (savedOnly) {
      next.delete("saved");
    } else {
      next.set("saved", "1");
    }
    setSearchParams(next, { replace: true });
    setPage(1);
  }

  return (
    <AppShell
      title="Newest Questions"
      subtitle={`${filteredQuestions.length} results${savedOnly ? " ? saved only" : ""}`}
      actions={
        <button type="button" className="btn btn--primary" onClick={() => setEditingQuestion(null)}>
          Ask Question
        </button>
      }
    >
      <section className="stats-strip content-panel compact">
        <div>
          <strong>{rawQuestions.length}</strong>
          <span>loaded</span>
        </div>
        <div>
          <strong>{rawQuestions.filter((item) => (item.answersCount || 0) > 0).length}</strong>
          <span>answered</span>
        </div>
        <div>
          <strong>{availableTags.length}</strong>
          <span>tags</span>
        </div>
        <div>
          <strong>{formatShortDate(new Date().toISOString())}</strong>
          <span>today</span>
        </div>
      </section>

      <section className="content-panel filter-panel">
        <div className="filters-grid">
          <label>
            Search
            <input
              value={filters.search}
              placeholder="Search questions"
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, search: event.target.value }));
                setPage(1);
              }}
            />
          </label>

          <label>
            Tag
            <select
              value={filters.tag}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, tag: event.target.value }));
                setPage(1);
              }}
            >
              <option value="">All tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date range
            <select
              value={filters.dateRange}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, dateRange: event.target.value }));
                setPage(1);
              }}
            >
              <option value="any">Any time</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </label>

          <label>
            Sort
            <select
              value={filters.sort}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, sort: event.target.value }));
                setPage(1);
              }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="votes">Top votes</option>
              <option value="answers">Most answered</option>
              <option value="topWeek">Most voted this week</option>
            </select>
          </label>
        </div>

        <div className="inline-actions">
          <button
            type="button"
            className={`btn ${filters.unansweredOnly ? "btn--primary" : "btn--ghost"}`}
            onClick={() => {
              setFilters((prev) => ({ ...prev, unansweredOnly: !prev.unansweredOnly }));
              setPage(1);
            }}
          >
            Unanswered only
          </button>

          <button
            type="button"
            className={`btn ${savedOnly ? "btn--primary" : "btn--ghost"}`}
            onClick={handleSavedFilterToggle}
          >
            Saved only
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setFilters({
                search: "",
                tag: "",
                dateRange: "any",
                unansweredOnly: false,
                sort: "newest",
              });
              setPage(1);
            }}
          >
            Reset
          </button>
        </div>
      </section>

      <QuestionComposer
        key={editingQuestion?._id || "new-question"}
        onSubmit={handleQuestionSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        initialValue={editingQuestion}
        submitLabel={editingQuestion ? "Save Changes" : "Publish Question"}
        onCancel={editingQuestion ? () => setEditingQuestion(null) : undefined}
      />

      <QuestionList
        questions={paginatedQuestions}
        loading={questionsQuery.isLoading}
        error={questionsQuery.isError ? questionsQuery.error?.message || "Failed to load." : ""}
        currentUserId={user?.id || user?._id}
        savedQuestionIds={bookmarks}
        onOpenQuestion={(questionId) => navigate(`/app/questions/${questionId}`)}
        onVoteQuestion={handleVote}
        onToggleSave={handleToggleSaved}
        onStartChat={(participantId) => navigate(`/app/chat?participant=${participantId}`)}
        onEditQuestion={(question) => setEditingQuestion(question)}
        onDeleteQuestion={handleDeleteQuestion}
        onRetry={questionsQuery.refetch}
      />

      <section className="pagination-row">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={safePage <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          Previous
        </button>

        <p>
          Page {safePage} of {totalPages}
        </p>

        <button
          type="button"
          className="btn btn--ghost"
          disabled={safePage >= totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        >
          Next
        </button>
      </section>
    </AppShell>
  );
}

export default MainPage;
