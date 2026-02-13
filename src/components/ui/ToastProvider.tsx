"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import ToastStack from "@/components/ui/ToastStack";

/**
 * Toast
 *
 * Represents a single toast notification.
 * Keep this small and serializable; the UI can decide how to display it.
 */
export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number; // ms; 0 disables auto-dismiss
}

/**
 * ToastContextType
 *
 * Public API exposed to the app:
 * - `addToast`: enqueue a toast
 * - `removeToast`: manually dismiss
 * - `toasts`: current toast queue for rendering
 */
interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: Toast["type"], duration?: number) => void;
  removeToast: (id: string) => void;
}

/**
 * ToastContext
 *
 * Context is undefined by default so we can throw a helpful error
 * when `useToast()` is used outside the provider.
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * useToast
 *
 * Hook for any component to enqueue a toast:
 * const { addToast } = useToast();
 * addToast("Saved!", "success");
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

/**
 * makeToastId
 *
 * Generates a reasonably collision-resistant id for each toast.
 * - Uses crypto.randomUUID when available (modern browsers)
 * - Falls back to a timestamp + counter for older environments
 */
function makeToastId(counter: number) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${counter}`;
}

/**
 * ToastProvider
 *
 * Global provider that owns the toast queue and renders ToastStack.
 *
 * Design notes:
 * - Provider lives at the app root (layout.tsx) so any page/component can toast.
 * - ToastStack is rendered once, outside page layouts, for consistent placement.
 */
export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Counter used only for id fallback (avoids rare Date.now collisions).
  const idCounter = useRef(0);

  /**
   * removeToast
   *
   * Removes a toast from the queue by id (manual dismiss or timer).
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * addToast
   *
   * Enqueues a toast and optionally schedules auto-dismiss.
   * duration:
   * - default 3000ms
   * - set to 0 to make a toast persistent until dismissed
   */
  const addToast = useCallback(
    (message: string, type: Toast["type"], duration = 3000) => {
      idCounter.current += 1;
      const id = makeToastId(idCounter.current);

      setToasts((prev) => [...prev, { id, message, type, duration }]);

      if (duration > 0) {
        window.setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  /**
   * Memoize context value to avoid re-rendering consumers unnecessarily.
   */
  const value = useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Render the toast UI once at the root for consistent placement */}
      <ToastStack />
    </ToastContext.Provider>
  );
}