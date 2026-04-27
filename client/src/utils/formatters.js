export function formatRelativeTime(isoDate) {
  if (!isoDate) return "just now";

  const now = Date.now();
  const value = new Date(isoDate).getTime();
  const diffMs = now - value;

  if (Number.isNaN(value) || diffMs < 0) {
    return "just now";
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "just now";
  }

  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  }

  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  const days = Math.floor(diffMs / day);
  if (days < 30) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  return new Date(isoDate).toLocaleDateString();
}

export function formatShortDate(isoDate) {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function normalizeTagList(tagsInput) {
  return String(tagsInput || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function truncateText(text, length = 170) {
  const raw = String(text || "");
  if (raw.length <= length) return raw;
  return `${raw.slice(0, length).trimEnd()}...`;
}
