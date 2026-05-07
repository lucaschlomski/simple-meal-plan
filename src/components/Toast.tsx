import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState
} from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type ToastKind = "error" | "success" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  show: (kind: ToastKind, message: string) => void;
};

// Auto-dismiss delays: errors linger slightly longer so they can be read.
const DISMISS_MS: Record<ToastKind, number> = {
  success: 2000,
  info: 2000,
  error: 4000
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => dismiss(id), DISMISS_MS[kind]);
    },
    [dismiss]
  );

  const api: ToastApi = {
    show,
    showError: (m) => show("error", m),
    showSuccess: (m) => show("success", m)
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.kind === "error" ? (
              <AlertCircle size={13} />
            ) : (
              <CheckCircle2 size={13} />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast outside ToastProvider");
  return ctx;
}
