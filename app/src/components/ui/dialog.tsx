import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  HelpCircle,
  Loader2,
  X,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type DialogKind = "success" | "error" | "warning" | "confirmation";

type DialogOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => Promise<void> | void;
};

type DialogRequest = DialogOptions & {
  id: number;
  kind: DialogKind;
  showCancel: boolean;
  resolve: (value: boolean) => void;
};

type DialogContextValue = {
  success: (options: DialogOptions) => Promise<void>;
  error: (options: DialogOptions) => Promise<void>;
  warning: (options: DialogOptions) => Promise<void>;
  confirmation: (options: DialogOptions) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

const kindConfig = {
  success: {
    icon: CheckCircle2,
    label: "Success",
    iconClassName: "bg-green-500/10 text-green-400 ring-green-500/20",
    buttonClassName: "bg-green-500 text-white hover:bg-green-500/90",
  },
  error: {
    icon: XCircle,
    label: "Error",
    iconClassName: "bg-red-500/10 text-red-400 ring-red-500/20",
    buttonClassName: "bg-red-500 text-white hover:bg-red-500/90",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    iconClassName: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20",
    buttonClassName: "bg-orange-500 text-white hover:bg-orange-500/90",
  },
  confirmation: {
    icon: HelpCircle,
    label: "Confirmation",
    iconClassName: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
    buttonClassName: "bg-orange-500 text-white hover:bg-orange-500/90",
  },
} satisfies Record<
  DialogKind,
  {
    icon: typeof CheckCircle2;
    label: string;
    iconClassName: string;
    buttonClassName: string;
  }
>;

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [activeDialog, setActiveDialog] = useState<DialogRequest | null>(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const queueRef = useRef<DialogRequest[]>([]);
  const idRef = useRef(0);

  const showNextDialog = useCallback(() => {
    const nextDialog = queueRef.current.shift() ?? null;
    setActionError(null);
    setPending(false);
    setActiveDialog(nextDialog);
  }, []);

  const openDialog = useCallback(
    (kind: DialogKind, options: DialogOptions, showCancel: boolean) => {
      return new Promise<boolean>((resolve) => {
        const request: DialogRequest = {
          ...options,
          id: idRef.current + 1,
          kind,
          showCancel,
          resolve,
        };

        idRef.current = request.id;

        setActiveDialog((currentDialog) => {
          if (currentDialog) {
            queueRef.current.push(request);
            return currentDialog;
          }

          setActionError(null);
          setPending(false);
          return request;
        });
      });
    },
    [],
  );

  const closeDialog = useCallback(
    (value: boolean) => {
      if (!activeDialog || pending) return;

      activeDialog.resolve(value);
      showNextDialog();
    },
    [activeDialog, pending, showNextDialog],
  );

  const handleConfirm = useCallback(async () => {
    if (!activeDialog || pending) return;

    if (!activeDialog.onConfirm) {
      activeDialog.resolve(true);
      showNextDialog();
      return;
    }

    setPending(true);
    setActionError(null);

    try {
      await activeDialog.onConfirm();
      activeDialog.resolve(true);
      showNextDialog();
    } catch (error) {
      const message = error instanceof Error ? error.message : "The action could not be completed.";
      setActionError(message);
      setPending(false);
    }
  }, [activeDialog, pending, showNextDialog]);

  const dialog = {
    success: (options: DialogOptions) =>
      openDialog("success", { confirmLabel: "Done", ...options }, false).then(() => undefined),
    error: (options: DialogOptions) =>
      openDialog("error", { confirmLabel: "Close", ...options }, false).then(() => undefined),
    warning: (options: DialogOptions) =>
      openDialog("warning", { confirmLabel: "Got it", ...options }, false).then(() => undefined),
    confirmation: (options: DialogOptions) =>
      openDialog("confirmation", { confirmLabel: "Confirm", cancelLabel: "Cancel", ...options }, true),
  } satisfies DialogContextValue;

  return (
    <DialogContext.Provider value={dialog}>
      {children}
      {activeDialog && (
        <DialogSurface
          dialog={activeDialog}
          pending={pending}
          actionError={actionError}
          onCancel={() => closeDialog(false)}
          onConfirm={handleConfirm}
        />
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error("useDialog must be used within DialogProvider");
  }

  return context;
}

function DialogSurface({
  dialog,
  pending,
  actionError,
  onCancel,
  onConfirm,
}: {
  dialog: DialogRequest;
  pending: boolean;
  actionError: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const config = kindConfig[dialog.kind];
  const Icon = config.icon;

  useEffect(() => {
    previouslyFocusedElement.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const timeout = window.setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      previouslyFocusedElement.current?.focus();
    };
  }, [dialog.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, pending]);

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm fade-in"
      aria-hidden={false}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={dialog.description ? descriptionId : undefined}
        className="scale-in w-full max-w-md rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-start gap-4">
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1", config.iconClassName)}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">{config.label}</p>
            <h2 id={titleId} className="mt-2 text-xl font-bold tracking-tight">
              {dialog.title}
            </h2>
            {dialog.description && (
              <p id={descriptionId} className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {dialog.description}
              </p>
            )}
          </div>

          {!pending && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl p-2 text-[var(--muted)] transition hover:bg-white/5 hover:text-white"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {actionError && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{actionError}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {dialog.showCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
              {dialog.cancelLabel ?? "Cancel"}
            </Button>
          )}
          <Button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={config.buttonClassName}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {pending ? "Working..." : dialog.confirmLabel ?? "Confirm"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
