import { apiRequest } from "../../lib/apiClient";

export function getMyProfile() {
  return apiRequest("/users/me");
}

export function getUserProfile(userId) {
  return apiRequest(`/users/${userId}`);
}
