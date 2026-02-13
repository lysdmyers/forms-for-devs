"use client";

import * as React from "react";

type ToastVariant = "default" | "success" | "destructive";

export type ToastInput = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms
};

export type ToastItem = ToastInput & {
  id: string;
  createdAt: number;
};

type ToastStore = {
  toasts: ToastItem[];
  listeners: Set<(toasts: ToastItem[]) => void>;
};

const store: ToastStore = {
  toasts: [],
  listeners: new Set(),
};

function emit() {
  for (const l of store.listeners) l(store.toasts);
}

function makeId(prefix = "t") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function toast(input: ToastInput) {
  const id = makeId();
  const item: ToastItem = {
    id,
    createdAt: Date.now(),
    variant: input.variant ?? "default",
    duration: input.duration ?? 3200,
    title: input.title,
    description: input.description,
  };

  store.toasts = [item, ...store.toasts].slice(0, 5);
  emit();

  if ((item.duration ?? 0) > 0) {
    window.setTimeout(() => dismiss(id), item.duration);
  }

  return { id, dismiss: () => dismiss(id) };
}

export function dismiss(id: string) {
  store.toasts = store.toasts.filter((t) => t.id !== id);
  emit();
}

export function dismissAll() {
  store.toasts = [];
  emit();
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>(() => store.toasts);

  React.useEffect(() => {
    const listener = (next: ToastItem[]) => setToasts(next);
    store.listeners.add(listener);
    return () => {
      store.listeners.delete(listener);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss,
    dismissAll,
  };
}
