const DEFAULT_DEV_API_URL = "http://localhost:5000";

export function getApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim();
  }

  if (import.meta.env.PROD) {
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin;
    }
  }

  return DEFAULT_DEV_API_URL;
}
