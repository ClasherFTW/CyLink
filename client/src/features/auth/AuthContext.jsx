import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getCurrentUser, logoutUser, syncFirebaseProfile } from "./authApi";
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  persistSession,
} from "../../lib/session";
import { getApiBaseUrl } from "../../lib/config";
import { AUTH_INVALID_EVENT } from "../../lib/apiClient";
import { closeSocket } from "../chat/socketClient";
import {
  getCurrentFirebaseUser,
  registerWithEmailPassword,
  signInWithEmailPassword,
  signInWithGooglePopup,
  signOutFirebase,
  subscribeToFirebaseIdTokenChanges,
  updateFirebaseDisplayName,
} from "./firebase";

const AuthContext = createContext(null);

const sanitizeUsername = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);

const resolvePreferredUsername = (firebaseUser, fallbackUsername) => {
  const preferredFromPayload = sanitizeUsername(fallbackUsername);
  if (preferredFromPayload) return preferredFromPayload;

  const fromDisplayName = sanitizeUsername(firebaseUser?.displayName || "");
  if (fromDisplayName) return fromDisplayName;

  const fromEmail = sanitizeUsername(
    String(firebaseUser?.email || "")
      .split("@")[0]
      .trim()
  );
  if (fromEmail) return fromEmail;

  return "";
};

const normalizeAuthErrorMessage = (error) => {
  const raw = String(error?.message || "").trim();
  if (!raw) {
    return "Could not complete backend session.";
  }

  if (/failed to fetch/i.test(raw)) {
    return `Could not reach backend at ${getApiBaseUrl()}. Make sure server is running.`;
  }

  return raw;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [authError, setAuthError] = useState("");
  const pendingUsernameRef = useRef("");
  const isEstablishingRef = useRef(false);
  const isHandlingForcedLogoutRef = useRef(false);

  const clearLocalAuthState = useCallback(() => {
    closeSocket();
    clearSession();
    setUser(null);
    setToken(null);
  }, []);

  const resolveSafeSyncPayload = useCallback((firebaseUser, preferredUsername) => {
    const safeUsername = String(preferredUsername || "").trim();
    const safeAvatarUrl = String(firebaseUser?.photoURL || "").trim();

    return {
      username: safeUsername.length >= 3 ? safeUsername : undefined,
      avatarUrl: /^https?:\/\//i.test(safeAvatarUrl) ? safeAvatarUrl : undefined,
    };
  }, []);

  const establishBackendSession = useCallback(
    async (firebaseUser, fallbackUsername = "") => {
      const idToken = await firebaseUser.getIdToken();
      const preferredUsername = resolvePreferredUsername(
        firebaseUser,
        fallbackUsername || pendingUsernameRef.current
      );

      persistSession({ token: idToken });
      setToken(idToken);

      await syncFirebaseProfile(
        resolveSafeSyncPayload(firebaseUser, preferredUsername),
        idToken
      );

      const profile = await getCurrentUser(idToken);
      persistSession({ token: idToken, user: profile });
      setUser(profile);
      setToken(idToken);
      setAuthError("");
      pendingUsernameRef.current = "";

      return profile;
    },
    [resolveSafeSyncPayload]
  );

  const forceLogoutFromInvalidSession = useCallback(async (message = "") => {
    if (isHandlingForcedLogoutRef.current) return;
    isHandlingForcedLogoutRef.current = true;

    try {
      await signOutFirebase();
    } catch (_error) {
      // Ignore sign-out errors and still clear local state.
    } finally {
      clearLocalAuthState();
      pendingUsernameRef.current = "";
      if (message) {
        setAuthError(message);
      }
      isEstablishingRef.current = false;
      setIsBootstrapping(false);
      isHandlingForcedLogoutRef.current = false;
    }
  }, [clearLocalAuthState]);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeToFirebaseIdTokenChanges(async (firebaseUser) => {
      if (!mounted) return;

      if (isEstablishingRef.current) {
        return;
      }

      setIsBootstrapping(true);

      if (!firebaseUser) {
        clearLocalAuthState();
        setAuthError("");
        isEstablishingRef.current = false;
        setIsBootstrapping(false);
        return;
      }

      isEstablishingRef.current = true;

      try {
        await establishBackendSession(firebaseUser);
      } catch (_error) {
        try {
          await signOutFirebase();
        } catch (__error) {
          // Ignore sign-out errors.
        }

        clearLocalAuthState();
        setAuthError(normalizeAuthErrorMessage(_error));
        pendingUsernameRef.current = "";
      } finally {
        isEstablishingRef.current = false;
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [clearLocalAuthState, establishBackendSession]);

  useEffect(() => {
    const handleAuthInvalid = async (event) => {
      const message =
        event?.detail?.message || "Your session expired. Please login again.";
      await forceLogoutFromInvalidSession(message);
    };

    const handleStorageChange = async (event) => {
      if (event.key === "citrus_token" && !event.newValue) {
        await forceLogoutFromInvalidSession("");
      }
    };

    window.addEventListener(AUTH_INVALID_EVENT, handleAuthInvalid);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(AUTH_INVALID_EVENT, handleAuthInvalid);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [forceLogoutFromInvalidSession]);

  const login = useCallback(
    async ({ email, password }) => {
      setAuthError("");
      await signInWithEmailPassword({ email, password });
      return null;
    },
    []
  );

  const register = useCallback(
    async ({ username, email, password }) => {
      setAuthError("");
      pendingUsernameRef.current = username || "";
      const credential = await registerWithEmailPassword({ email, password });
      if (username) {
        await updateFirebaseDisplayName(credential.user, username);
      }

      return null;
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    setAuthError("");
    await signInWithGooglePopup();
    return null;
  }, []);

  const logout = useCallback(async () => {
    const current = getCurrentFirebaseUser();
    try {
      if (current) {
        const idToken = await current.getIdToken();
        await logoutUser(idToken);
      }
    } catch (_error) {
      // Ignore network/logout endpoint errors.
    } finally {
      await signOutFirebase();
      clearLocalAuthState();
    }
  }, [clearLocalAuthState]);

  const value = useMemo(
    () => ({
      user,
      token,
      authError,
      isBootstrapping,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [
      user,
      token,
      authError,
      isBootstrapping,
      login,
      register,
      loginWithGoogle,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return ctx;
}
