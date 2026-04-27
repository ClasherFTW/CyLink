import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

let sequence = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ title, message = "", variant = "info", duration = 3200 }) => {
      const id = ++sequence;

      setToasts((prev) => [
        ...prev,
        {
          id,
          title,
          message,
          variant,
        },
      ]);

      window.setTimeout(() => {
        dismissToast(id);
      }, duration);

      return id;
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({
      toasts,
      pushToast,
      dismissToast,
      success: (title, message = "") => pushToast({ title, message, variant: "success" }),
      error: (title, message = "") => pushToast({ title, message, variant: "error", duration: 4500 }),
      info: (title, message = "") => pushToast({ title, message, variant: "info" }),
    }),
    [toasts, pushToast, dismissToast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
