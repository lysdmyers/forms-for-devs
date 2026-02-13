"use client";

import React from "react";
import { useToast } from "@/components/ui/ToastProvider";

/**
 * ToastStack
 *
 * Visual renderer for the toast queue.
 *
 * Placement:
 * - Fixed to bottom-right
 * - Uses pointer-events rules so toasts remain clickable without blocking the page
 *
 * Accessibility:
 * - aria-live="polite" for non-blocking announcements
 */
export default function ToastStack() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto rounded-xl border p-3 shadow-sm"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: toastLabelColor(t.type) }}>
                {t.type}
              </div>
              <div className="mt-1 break-words text-sm">{t.message}</div>
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="rounded-md border px-2 py-1 text-xs font-semibold hover:opacity-90"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
              }}
              aria-label="Dismiss notification"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * toastLabelColor
 *
 * Small helper to color the toast label without introducing a full design system.
 * Uses existing tokens where possible.
 */
function toastLabelColor(type: "success" | "error" | "info") {
  switch (type) {
    case "success":
      return "color-mix(in oklab, var(--ring) 65%, #16a34a)";
    case "error":
      return "color-mix(in oklab, var(--danger) 85%, var(--text))";
    case "info":
    default:
      return "color-mix(in oklab, var(--text-muted) 70%, var(--text))";
  }
}