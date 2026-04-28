const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toNormalizedOrigin = (value) => String(value || "").trim().replace(/\/+$/, "");

const isTrustedPreviewOrLocalhost = (origin) => {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();

    if (host === "localhost" || host === "127.0.0.1") {
      return true;
    }

    if (host.endsWith(".vercel.app")) {
      return true;
    }
  } catch (_error) {
    return false;
  }

  return false;
};

const compileOriginRule = (rule) => {
  const normalized = toNormalizedOrigin(rule);
  if (!normalized) return null;

  if (normalized === "*") {
    return {
      test: () => true,
    };
  }

  if (!normalized.includes("*")) {
    return {
      test: (origin) => toNormalizedOrigin(origin) === normalized,
    };
  }

  const wildcardRegex = new RegExp(
    `^${escapeRegex(normalized).replace(/\\\*/g, ".*")}$`,
    "i"
  );

  return {
    test: (origin) => wildcardRegex.test(toNormalizedOrigin(origin)),
  };
};

const parseOriginRules = () => {
  const raw = String(process.env.CORS_ORIGIN || "").trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => compileOriginRule(entry))
    .filter(Boolean);
};

const buildCorsOriginDelegate = () => {
  const rules = parseOriginRules();

  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowedByRule = rules.some((rule) => rule.test(origin));
    if (allowedByRule || isTrustedPreviewOrLocalhost(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  };
};

module.exports = {
  buildCorsOriginDelegate,
};

