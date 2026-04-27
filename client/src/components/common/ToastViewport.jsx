import { useToast } from "../../features/ui/ToastContext";

function ToastViewport() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <article key={toast.id} className={`toast toast--${toast.variant}`}>
          <div>
            <h4>{toast.title}</h4>
            {toast.message ? <p>{toast.message}</p> : null}
          </div>
          <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification">
            x
          </button>
        </article>
      ))}
    </div>
  );
}

export default ToastViewport;
