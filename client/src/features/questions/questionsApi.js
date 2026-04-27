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

export function listQuestions({
  page = 1,
  limit = 10,
  sortBy = "newest",
  search,
  tags,
  askedBy,
} = {}) {
  return apiRequest(
    `/questions${
      buildQuery({
        page,
        limit,
        sortBy,
        search,
        tags,
        askedBy,
      })
    }`
  );
}

export function getQuestionById(questionId) {
  return apiRequest(`/questions/${questionId}`);
}

export function createQuestion(payload) {
  return apiRequest("/questions", {
    method: "POST",
    body: payload,
  });
}

export function updateQuestion(questionId, payload) {
  return apiRequest(`/questions/${questionId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteQuestion(questionId) {
  return apiRequest(`/questions/${questionId}`, {
    method: "DELETE",
  });
}

export function voteQuestion(questionId, voteType) {
  return apiRequest(`/questions/${questionId}/vote`, {
    method: "POST",
    body: { voteType },
  });
}
