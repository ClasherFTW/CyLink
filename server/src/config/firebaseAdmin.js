const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const SERVICE_ACCOUNT_FILENAME = "cylink-5589a-firebase-adminsdk-fbsvc-6f43e26d92.json";

const buildCredential = () => {
  // Method 1: Load from service account JSON file on disk (highest priority)
  const serviceAccountPath = path.resolve(__dirname, "..", "..", SERVICE_ACCOUNT_FILENAME);
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    console.log("[Firebase] Initialized using service account JSON file.");
    return admin.credential.cert(serviceAccount);
  }

  // Method 2: Load from FIREBASE_SERVICE_ACCOUNT_JSON env var (full JSON string)
  const rawServiceAccountJson = String(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON || ""
  ).trim();
  if (rawServiceAccountJson) {
    try {
      const serviceAccount = JSON.parse(rawServiceAccountJson);
      console.log("[Firebase] Initialized using FIREBASE_SERVICE_ACCOUNT_JSON env var.");
      return admin.credential.cert(serviceAccount);
    } catch (_error) {
      throw new Error(
        "[Firebase] FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON."
      );
    }
  }

  // Method 3: Load from individual env var fields
  const projectId = String(process.env.FIREBASE_PROJECT_ID || "").trim();
  const clientEmail = String(process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  const privateKey = String(process.env.FIREBASE_PRIVATE_KEY || "").trim();

  if (projectId && clientEmail && privateKey) {
    console.log("[Firebase] Initialized using individual env var fields.");
    return admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    });
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[Firebase] Missing Admin credentials in production. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY."
    );
  }

  // Method 4: Fall back to Application Default Credentials
  console.log("[Firebase] Falling back to Application Default Credentials.");
  return admin.credential.applicationDefault();
};

const getFirebaseAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: buildCredential(),
  });
};

const verifyFirebaseIdToken = async (token, checkRevoked = false) => {
  const app = getFirebaseAdminApp();
  return app.auth().verifyIdToken(token, checkRevoked);
};

const revokeFirebaseUserSessions = async (uid) => {
  if (!uid) return;
  const app = getFirebaseAdminApp();
  await app.auth().revokeRefreshTokens(uid);
};

module.exports = {
  getFirebaseAdminApp,
  verifyFirebaseIdToken,
  revokeFirebaseUserSessions,
};
