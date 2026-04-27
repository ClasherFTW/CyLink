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

export function listChats({ page = 1, limit = 20 } = {}) {
  return apiRequest(`/chat${buildQuery({ page, limit })}`);
}

export function startChat(participantId) {
  return apiRequest("/chat/start", {
    method: "POST",
    body: { participantId },
  });
}

export function listChatMessages(chatId, { page = 1, limit = 50 } = {}) {
  return apiRequest(`/chat/${chatId}/messages${buildQuery({ page, limit })}`);
}

export function sendChatMessage(chatId, content) {
  return apiRequest(`/chat/${chatId}/messages`, {
    method: "POST",
    body: { content },
  });
}
