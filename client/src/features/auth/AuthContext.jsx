import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "./authApi";
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  persistSession,
} from "../../lib/session";
import { closeSocket } from "../chat/socketClient";

const AuthContext = createContext(null);

function sanitizeUsername(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

function buildGoogleUsernameCandidates({ displayName, email, uid }) {
  const emailPrefix = String(email || "")
    .split("@")[0]
    .trim();

  const base = sanitizeUsername(displayName) || sanitizeUsername(emailPrefix) || "citrus_user";
  const uidTail = String(uid || "").slice(-6).toLowerCase();
  const randomTail = Math.floor(Math.random() * 9000 + 1000);

  return [
    base,
    `${base}_${uidTail}`.slice(0, 30),
    `${base}_${randomTail}`.slice(0, 30),
  ];
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const profile = await getCurrentUser();
        if (!mounted) return;

        setUser(profile);
        persistSession({ token, user: profile });
      } catch (_error) {
        if (!mounted) return;

        clearSession();
        setUser(null);
        setToken(null);
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [token]);

  const login = useCallback(async (payload) => {
    const data = await loginUser(payload);
    setToken(data.token);
    setUser(data.user);
    persistSession({ token: data.token, user: data.user });
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    setToken(data.token);
    setUser(data.user);
    persistSession({ token: data.token, user: data.user });
    return data.user;
  }, []);

  const loginWithGoogle = useCallback(
    async ({ uid, email, displayName }) => {
      if (!uid || !email) {
        throw new Error("Google account is missing email or uid.");
      }

      const password = `google_${uid}_citrus`;

      try {
        return await login({
          email,
          password,
        });
      } catch (loginError) {
        if (![400, 401, 404].includes(loginError?.status)) {
          throw loginError;
        }
      }

      const candidates = buildGoogleUsernameCandidates({ displayName, email, uid });
      for (const username of candidates) {
        try {
          return await register({
            username,
            email,
            password,
          });
        } catch (registerError) {
          // Retry with the next username candidate when possible.
          if (registerError?.status === 409) {
            try {
              return await login({
                email,
                password,
              });
            } catch (_ignored) {
              continue;
            }
          }

          throw registerError;
        }
      }

      throw new Error(
        "Google sign-in could not be linked with backend auth. Try email login or a different account."
      );
    },
    [login, register]
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (_error) {
      // Ignore network/logout errors and always clear local session.
    } finally {
      closeSocket();
      clearSession();
      setUser(null);
      setToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isBootstrapping,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [user, token, isBootstrapping, login, register, loginWithGoogle, logout]
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
