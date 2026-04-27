import { apiRequest } from "../../lib/apiClient";

function buildQuery(params) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });

  const asString = query.toString();
  return asString ? `?${asString}` : "";
}

export function listAnswersByQuestion(questionId, { page = 1, limit = 20, sortBy = "votes" } = {}) {
  return apiRequest(
    `/answers/question/${questionId}${buildQuery({
      page,
      limit,
      sortBy,
    })}`
  );
}

export function createAnswer(payload) {
  return apiRequest("/answers", {
    method: "POST",
    body: payload,
  });
}

export function updateAnswer(answerId, payload) {
  return apiRequest(`/answers/${answerId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteAnswer(answerId) {
  return apiRequest(`/answers/${answerId}`, {
    method: "DELETE",
  });
}

export function voteAnswer(answerId, voteType) {
  return apiRequest(`/answers/${answerId}/vote`, {
    method: "POST",
    body: { voteType },
  });
}
