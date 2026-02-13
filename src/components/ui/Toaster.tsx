"use client";

import * as React from "react";
import { useToast, dismiss } from "@/components/ui/use-toast";

function variantClasses(variant: "default" | "success" | "destructive") {
  if (variant === "success") return "border-emerald-500/30 bg-[var(--surface)]";
  if (variant === "destructive") return "border-red-500/30 bg-[var(--surface)]";
  return "border-[var(--border)] bg-[var(--surface)]";
}

function titleClasses(variant: "default" | "success" | "destructive") {
  if (variant === "success") return "text-emerald-700";
  if (variant === "destructive") return "text-red-700";
  return "text-[var(--text)]";
}

export default function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 pb-4 sm:justify-end"
    >
      <div className="pointer-events-none w-full max-w-[420px] space-y-2 sm:mr-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto rounded-2xl border p-4 shadow-lg backdrop-blur",
              variantClasses(t.variant ?? "default"),
            ].join(" ")}
            role="status"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {t.title ? (
                  <div className={["text-sm font-semibold", titleClasses(t.variant ?? "default")].join(" ")}>
                    {t.title}
                  </div>
                ) : null}

                {t.description ? <div className="mt-1 text-sm ffd-muted">{t.description}</div> : null}
              </div>

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="ffd-btn-ghost pointer-events-auto px-3 py-1"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}