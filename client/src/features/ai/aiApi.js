import { apiRequest } from "../../lib/apiClient";

export function askCitrusBot({ question, useRetrieval = true }) {
  return apiRequest("/ai/chat", {
    method: "POST",
    body: {
      question,
      useRetrieval,
    },
  });
}
