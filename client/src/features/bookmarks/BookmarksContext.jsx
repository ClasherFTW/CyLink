import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";

const BookmarksContext = createContext(null);
const BOOKMARKS_KEY = "citrus_bookmarks";

function readStore() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function writeStore(value) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(value));
}

export function BookmarksProvider({ children }) {
  const { user } = useAuth();
  const namespace = user?.id || user?._id || "guest";

  const [store, setStore] = useState(() => readStore());

  useEffect(() => {
    writeStore(store);
  }, [store]);

  const value = useMemo(() => {
    const bookmarks = Array.isArray(store[namespace]) ? store[namespace] : [];

    const has = (questionId) => bookmarks.includes(questionId);

    const toggle = (questionId) => {
      setStore((prev) => {
        const existing = Array.isArray(prev[namespace]) ? prev[namespace] : [];
        const next = existing.includes(questionId)
          ? existing.filter((item) => item !== questionId)
          : [...existing, questionId];

        return {
          ...prev,
          [namespace]: next,
        };
      });
    };

    return {
      bookmarks,
      has,
      toggle,
    };
  }, [namespace, store]);

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
}

export function useBookmarks() {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error("useBookmarks must be used inside BookmarksProvider.");
  }

  return context;
}
