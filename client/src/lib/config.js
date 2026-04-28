const DEFAULT_DEV_API_URL = "http://localhost:5000";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function getApiBaseUrl() {
  const fromEnv = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  const fromLocalEnv = String(import.meta.env.VITE_API_BASE_URL_LOCAL || "").trim();

  if (typeof window !== "undefined" && LOCAL_HOSTS.has(window.location.hostname)) {
    if (fromLocalEnv) {
      return fromLocalEnv;
    }
    return DEFAULT_DEV_API_URL;
  }

  if (fromEnv) {
    return fromEnv;
  }

  if (import.meta.env.PROD) {
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin;
    }
  }

  return DEFAULT_DEV_API_URL;
}
