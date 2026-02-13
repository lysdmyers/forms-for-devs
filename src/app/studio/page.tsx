"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { FormDefinition, Field, FieldType, FieldRules } from "@/lib/form-types";
import basicContact from "@/templates/basic-contact.json";
import { loadFormFromStorage, saveFormToStorage, clearFormStorage } from "@/lib/storage";
import PreviewPanel from "@/components/preview/PreviewPanel1";
import AppShell from "@/components/layout/AppShell";
import { toast } from "@/components/ui/use-toast";

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * nowISO
 *
 * Centralized timestamp helper so created/updated timestamps stay consistent.
 * Keeping this as a helper prevents drift across different update sites.
 */
function nowISO(): string {
  return new Date().toISOString();
}

/**
 * makeId
 *
 * Lightweight unique ID generator.
 * MVP-safe (Math.random). For production, prefer crypto.randomUUID().
 */
function makeId(prefix = "f"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * isValidFieldName
 *
 * Validates that the field `name` can safely be used as:
 * - JSON key
 * - HTML input name/id
 * - JSON Schema property key
 */
function isValidFieldName(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(name);
}

/**
 * toNumberOrUndefined
 *
 * Converts a numeric input string into:
 * - undefined (when blank)
 * - number (when parseable)
 * - undefined (when invalid)
 *
 * Prevents NaN from being persisted into rule definitions.
 */
function toNumberOrUndefined(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

/* -------------------------------------------------------------------------- */
/* Studio Page                                                                */
/* -------------------------------------------------------------------------- */

/**
 * StudioPage
 *
 * Visual flow v3:
 * - Left column: "accordion" field builder (each field expands inline)
 * - Right column: live preview (internal scroll)
 * - Preview can be toggled off to give the builder more space.
 *
 * Layout goals:
 * - Both columns match height (one grid row, items-stretch, h-full cards)
 * - Each column scrolls internally where needed (min-h-0 + overflow-auto)
 */
export default function StudioPage() {
  const starter = basicContact as unknown as FormDefinition;

  /**
   * Load persisted form definition (localStorage).
   * Studio is intentionally "single active form" for MVP.
   */
  const [form, setForm] = useState<FormDefinition>(() => {
    const saved = loadFormFromStorage();
    return saved ?? { ...starter, updatedAtISO: nowISO() };
  });

  /**
   * Expanded field id (accordion behavior).
   * - Only one field expands at a time for a calmer editing surface.
   * - New fields auto-expand.
   */
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(() => {
    const saved = loadFormFromStorage();
    return (saved ?? starter)?.fields?.[0]?.id ?? null;
  });

  /**
   * Preview visibility toggle.
   * - Desktop keeps preview on the right by default.
   * - Users can hide it for "focused editing" sessions.
   */
  const [showPreview, setShowPreview] = useState(true);

  /**
   * Ephemeral highlight for a newly-added field.
   * Used for a subtle "where did it go?" affordance.
   */
  const [flashFieldId, setFlashFieldId] = useState<string | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  /**
   * Field-name set for collision-safe field creation.
   * Memoized for stable behavior and efficiency.
   */
  const fieldNameSet = useMemo(() => new Set(form.fields.map((f) => f.name)), [form.fields]);

  /**
   * persist
   *
   * Single entry point for committing updates:
   * - Write to localStorage
   * - Update React state
   */
  const persist = (next: FormDefinition) => {
    saveFormToStorage(next);
    setForm(next);
  };

  /**
   * flashField
   *
   * Adds a short-lived highlight ring to a field row for orientation.
   * Intentionally subtle (no heavy animation libs) for "seamless" feel.
   */
  const flashField = (id: string) => {
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    setFlashFieldId(id);
    flashTimerRef.current = window.setTimeout(() => setFlashFieldId(null), 900);
  };

  /**
   * addField
   *
   * Creates a new field with a unique name and appends it to the form.
   * New fields auto-expand so the user can edit immediately.
   */
  const addField = (type: FieldType) => {
    const baseName = type === "email" ? "email" : "field";
    let name = baseName;
    let i = 1;

    while (fieldNameSet.has(name)) {
      name = `${baseName}${i}`;
      i++;
    }

    const newField: Field = {
      id: makeId("f"),
      name,
      label: "New field",
      type,
      required: false,
      placeholder: "",
    };

    const nextForm: FormDefinition = {
      ...form,
      fields: [...form.fields, newField],
      updatedAtISO: nowISO(),
    };

    persist(nextForm);

    // Focus the user on the newly created field.
    setExpandedFieldId(newField.id);
    flashField(newField.id);

    toast({
      title: "Field Added",
      description: `Added a new ${type} field.`,
      variant: "success",
    });
  };

  /**
   * updateField
   *
   * Applies a partial patch to a field by ID.
   * We toast only on a transition from valid → invalid for the key to avoid spam.
   */
  const updateField = (id: string, patch: Partial<Field>) => {
    const prev = form.fields.find((f) => f.id === id);

    const nextFields = form.fields.map((f) => (f.id === id ? { ...f, ...patch } : f));
    persist({ ...form, fields: nextFields, updatedAtISO: nowISO() });

    if (patch.name !== undefined) {
      const nextField = nextFields.find((f) => f.id === id);
      const wasValid = prev ? isValidFieldName(prev.name) : true;
      const isValid = nextField ? isValidFieldName(nextField.name) : true;

      if (wasValid && !isValid) {
        toast({
          title: "Invalid field key",
          description: "Field name must start with a letter and use only letters, numbers, or underscores.",
          variant: "destructive",
          duration: 4500,
        });
      }
    }
  };

  /**
   * deleteField
   *
   * Removes a field from the definition.
   * If the deleted field was expanded, we expand the next available one.
   */
  const deleteField = (id: string) => {
    const targetField = form.fields.find((f) => f.id === id);
    const nextFields = form.fields.filter((f) => f.id !== id);

    persist({ ...form, fields: nextFields, updatedAtISO: nowISO() });

    if (expandedFieldId === id) {
      setExpandedFieldId(nextFields[0]?.id ?? null);
    }

    toast({
      title: "Field Deleted",
      description: targetField ? `Removed “${targetField.label}”.` : "Removed field.",
      variant: "destructive",
    });
  };

  /**
   * moveField
   *
   * Reorders fields by swapping the current index with its neighbor.
   * Keeps a stable order for preview and exports.
   */
  const moveField = (id: string, direction: "up" | "down") => {
    const idx = form.fields.findIndex((f) => f.id === id);
    if (idx === -1) return;

    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= form.fields.length) return;

    const next = [...form.fields];
    [next[idx], next[target]] = [next[target], next[idx]];

    persist({ ...form, fields: next, updatedAtISO: nowISO() });
  };

  /**
   * resetToTemplate
   *
   * Clears storage and restores the starter template.
   * Also restores the expanded field to the first field, if present.
   */
  const resetToTemplate = () => {
    clearFormStorage();

    const next = { ...starter, updatedAtISO: nowISO() };
    persist(next);

    setExpandedFieldId(next.fields?.[0]?.id ?? null);

    toast({
      title: "Studio Reset",
      description: "Restored the starter template and cleared saved edits.",
      variant: "destructive",
    });
  };

  const gridCols = showPreview ? "lg:grid-cols-[1fr_520px]" : "lg:grid-cols-[1fr]";
  const expandedField = expandedFieldId
    ? form.fields.find((f) => f.id === expandedFieldId) ?? null
    : null;

  return (
    <AppShell
      title="Studio"
      description="Build on the left. Preview on the right. Toggle preview when you want full focus."
      actions={
        <>
          <Link href="/exports" className="ffd-btn">
            Export
          </Link>

          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="ffd-btn-ghost"
            aria-pressed={showPreview}
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>

          {/* Reset should be "danger" since it destroys local work */}
          <button type="button" onClick={resetToTemplate} className="ffd-btn-danger">
            Reset
          </button>
        </>
      }
    >
      {/* One stretched grid row; both columns fill height and scroll internally. */}
      <section className={`grid gap-6 items-stretch ${gridCols}`}>
        {/* ------------------------------------------------------------------ */}
        {/* LEFT: BUILDER (accordion fields)                                    */}
        {/* ------------------------------------------------------------------ */}
        <div className="ffd-card flex h-full min-h-0 flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="ffd-heading text-lg font-semibold">Builder</h2>
              <p className="mt-1 text-sm ffd-muted">
                Add fields and edit them inline. Click a field to expand details.
              </p>
            </div>
            <span className="text-xs ffd-muted">{form.fields.length} fields</span>
          </div>

          {/* Form metadata */}
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Form Title</label>
              <input
                value={form.title}
                onChange={(e) => persist({ ...form, title: e.target.value, updatedAtISO: nowISO() })}
                className="mt-1 w-full ffd-input"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Form Description</label>
              <input
                value={form.description ?? ""}
                onChange={(e) =>
                  persist({ ...form, description: e.target.value, updatedAtISO: nowISO() })
                }
                className="mt-1 w-full ffd-input"
              />
            </div>
          </div>

          {/* Add field controls */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Add Field</p>
              <p className="text-xs ffd-muted">Choose Type</p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <AddButton label="Text" onClick={() => addField("text")} />
              <AddButton label="Textarea" onClick={() => addField("textarea")} />
              <AddButton label="Email" onClick={() => addField("email")} />
              <AddButton label="Number" onClick={() => addField("number")} />
              <AddButton label="Date" onClick={() => addField("date")} />
              <AddButton label="Select" onClick={() => addField("select")} />
              <AddButton label="Checkbox" onClick={() => addField("checkbox")} />
            </div>
          </div>

          {/* Scroll region: this is what keeps the builder height aligned with the preview. */}
          <div className="mt-8 min-h-0 flex-1 overflow-auto pr-1">
            <div className="space-y-3">
              {form.fields.length === 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm ffd-muted">
                  No fields yet. Add one above to get started.
                </div>
              ) : null}

              {form.fields.map((field, index) => {
                const isOpen = field.id === expandedFieldId;
                const isFlashing = field.id === flashFieldId;

                return (
                  <FieldAccordion
                    key={field.id}
                    field={field}
                    index={index}
                    total={form.fields.length}
                    open={isOpen}
                    flashing={isFlashing}
                    onToggle={() =>
                      setExpandedFieldId((curr) => (curr === field.id ? null : field.id))
                    }
                    onMoveUp={() => moveField(field.id, "up")}
                    onMoveDown={() => moveField(field.id, "down")}
                    onDelete={() => deleteField(field.id)}
                  >
                    <FieldProperties field={field} onPatch={(patch) => updateField(field.id, patch)} />
                  </FieldAccordion>
                );
              })}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT: PREVIEW (optional)                                           */}
        {/* ------------------------------------------------------------------ */}
        {showPreview ? (
          <div className="ffd-card flex h-full min-h-0 min-w-0 flex-col">
            <div className="shrink-0 border-b border-[var(--border)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="ffd-heading text-lg font-semibold">Live preview</h2>
                  <p className="mt-2 text-sm ffd-muted">
                    The preview renders the active form definition in real time.
                  </p>
                </div>

                {expandedField ? (
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs ffd-muted">
                    Editing: {expandedField.label || "Untitled"}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Scroll container: preview ALWAYS scrolls internally */}
            <div className="min-h-0 flex-1 overflow-auto p-5">
              <PreviewPanel form={form} />
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Small UI Components                                                        */
/* -------------------------------------------------------------------------- */

/**
 * AddButton
 *
 * Simple reusable button for "Add Field" controls.
 * Kept separate to keep StudioPage readable.
 */
function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ffd-btn-ghost w-full justify-start">
      {label}
    </button>
  );
}

/**
 * FieldAccordion
 *
 * Compact "accordion row" for a field.
 * - Closed: summary row (label, type, required, reorder/delete controls)
 * - Open: renders children as inline properties editor
 *
 * Button styling requests:
 * - Delete: red (danger)
 * - Up/Down: black (primary)
 */
function FieldAccordion({
  field,
  index,
  total,
  open,
  flashing,
  onToggle,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
}: {
  field: Field;
  index: number;
  total: number;
  open: boolean;
  flashing: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        "rounded-2xl border bg-[var(--surface)] shadow-sm transition-all duration-200",
        open ? "border-[var(--ring)]" : "border-[var(--border)]",
        flashing ? "ring-2 ring-[var(--ring)]" : "",
      ].join(" ")}
    >
      {/* Summary row */}
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs ffd-muted">{index + 1}.</span>
            <span className="truncate text-sm font-semibold">{field.label || "Untitled field"}</span>
            {field.required ? <span className="text-xs text-red-600">*</span> : null}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px] ffd-muted">
              {field.type}
            </span>
            <span className="truncate text-[11px] ffd-muted font-mono">{field.name}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className="hidden text-xs ffd-muted md:inline">{open ? "Hide" : "Edit"}</span>
          <span className="ffd-btn-ghost px-2 py-1" aria-hidden="true">
            {open ? "▾" : "▸"}
          </span>
        </div>
      </button>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-2 px-4 pb-3">
        <div className="text-xs ffd-muted">Actions</div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="ffd-btn px-3 py-1 disabled:opacity-40"
            aria-label={`Move ${field.label} up`}
          >
            Up
          </button>

          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="ffd-btn px-3 py-1 disabled:opacity-40"
            aria-label={`Move ${field.label} down`}
          >
            Down
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="ffd-btn-danger px-3 py-1"
            aria-label={`Delete ${field.label}`}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <div
        className={[
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden border-t border-[var(--border)] bg-[var(--surface-2)] p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * FieldProperties
 *
 * Inline editor that lives inside the accordion panel.
 * This keeps the object (field) and its properties in the same visual context.
 */
function FieldProperties({
  field,
  onPatch,
}: {
  field: Field;
  onPatch: (patch: Partial<Field>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Label</label>
          <input
            value={field.label}
            onChange={(e) => onPatch({ label: e.target.value })}
            className="mt-1 w-full ffd-input"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Name (key)</label>
          <input
            value={field.name}
            onChange={(e) => onPatch({ name: e.target.value })}
            className="mt-1 w-full ffd-input font-mono"
          />
          {!isValidFieldName(field.name) ? (
            <p className="mt-2 text-sm text-red-600">
              Field name must start with a letter and contain only letters, numbers, or underscores.
            </p>
          ) : (
            <p className="mt-2 text-xs ffd-muted">
              Use camelCase, no spaces. Example: <span className="font-mono">firstName</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            checked={!!field.required}
            onChange={(e) => onPatch({ required: e.target.checked })}
            className="h-4 w-4 accent-(--ring)"
          />
          <span className="text-sm font-medium">Required</span>
        </div>

        <div>
          <label className="text-sm font-medium">Placeholder</label>
          <input
            value={field.placeholder ?? ""}
            onChange={(e) => onPatch({ placeholder: e.target.value })}
            className="mt-1 w-full ffd-input"
          />
        </div>
      </div>

      <AdvancedRules field={field} onPatch={onPatch} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Advanced Rules + Select Options Editor                                     */
/* -------------------------------------------------------------------------- */

/**
 * AdvancedRules
 *
 * Collapsible editor for optional validation rules.
 * Rules are stored on the field definition so they can be reused by:
 * - runtime validation in Preview
 * - JSON Schema export
 * - React/TS export generator
 */
function AdvancedRules({
  field,
  onPatch,
}: {
  field: Field;
  onPatch: (patch: Partial<Field>) => void;
}) {
  const [open, setOpen] = useState(false);

  const rules = (field.rules ?? {}) as Partial<{
    minLength: number;
    maxLength: number;
    pattern: string;
    min: number;
    max: number;
    integer: boolean;
    options: Array<{ label: string; value: string }>;
  }>;

  const setRules = (next: FieldRules | undefined) => onPatch({ rules: next });

  const clearRules = () => {
    setRules(undefined);
    toast({
      title: "Rules cleared",
      description: "Advanced validation rules removed for this field.",
      variant: "default",
    });
  };

  const numOrEmpty = (v: unknown) => (typeof v === "number" ? v : "");
  const boolOrFalse = (v: unknown) => (typeof v === "boolean" ? v : false);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium underline decoration-(--border) underline-offset-4"
      >
        {open ? "Hide advanced rules" : "Show advanced rules"}
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          {(field.type === "text" || field.type === "textarea" || field.type === "email") && (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Min length</label>
                <input
                  inputMode="numeric"
                  value={numOrEmpty(rules.minLength)}
                  onChange={(e) =>
                    setRules({
                      ...(rules as object),
                      minLength: toNumberOrUndefined(e.target.value),
                    } as FieldRules)
                  }
                  className="mt-1 w-full ffd-input"
                  placeholder="e.g., 2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Max length</label>
                <input
                  inputMode="numeric"
                  value={numOrEmpty(rules.maxLength)}
                  onChange={(e) =>
                    setRules({
                      ...(rules as object),
                      maxLength: toNumberOrUndefined(e.target.value),
                    } as FieldRules)
                  }
                  className="mt-1 w-full ffd-input"
                  placeholder="e.g., 80"
                />
              </div>
            </div>
          )}

          {field.type === "number" && (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Min</label>
                <input
                  inputMode="numeric"
                  value={numOrEmpty(rules.min)}
                  onChange={(e) =>
                    setRules({
                      ...(rules as object),
                      min: toNumberOrUndefined(e.target.value),
                    } as FieldRules)
                  }
                  className="mt-1 w-full ffd-input"
                  placeholder="e.g., 0"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Max</label>
                <input
                  inputMode="numeric"
                  value={numOrEmpty(rules.max)}
                  onChange={(e) =>
                    setRules({
                      ...(rules as object),
                      max: toNumberOrUndefined(e.target.value),
                    } as FieldRules)
                  }
                  className="mt-1 w-full ffd-input"
                  placeholder="e.g., 100"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 md:col-span-2">
                <input
                  type="checkbox"
                  checked={boolOrFalse(rules.integer)}
                  onChange={(e) =>
                    setRules({
                      ...(rules as object),
                      integer: e.target.checked,
                    } as FieldRules)
                  }
                  className="h-4 w-4 accent-(--ring)"
                />
                <span className="text-sm font-medium">Whole numbers only (integer)</span>
              </div>
            </div>
          )}

          {field.type === "select" && (
            <SelectOptionsEditor
              options={Array.isArray(rules.options) ? rules.options : []}
              onChange={(options) =>
                setRules({
                  ...(rules as object),
                  options,
                } as FieldRules)
              }
            />
          )}

          <div className="pt-2">
            <button type="button" onClick={clearRules} className="ffd-btn-ghost">
              Clear rules
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * SelectOptionsEditor
 *
 * Editor UI for select dropdown options.
 * Options are stored as `{ label, value }` so exports can:
 * - render correct labels
 * - submit stable values
 */
function SelectOptionsEditor({
  options,
  onChange,
}: {
  options: Array<{ label: string; value: string }>;
  onChange: (next: Array<{ label: string; value: string }>) => void;
}) {
  const update = (idx: number, patch: Partial<{ label: string; value: string }>) => {
    const next = options.map((o, i) => (i === idx ? { ...o, ...patch } : o));
    onChange(next);
  };

  const add = () => onChange([...options, { label: "Option", value: `option${options.length + 1}` }]);

  const remove = (idx: number) => onChange(options.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Options</p>
        <button type="button" onClick={add} className="ffd-btn-ghost px-3 py-1">
          Add option
        </button>
      </div>

      {options.length === 0 ? (
        <p className="text-sm ffd-muted">No options yet. Add one to use this field.</p>
      ) : null}

      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="text-xs font-medium">Label</label>
              <input
                value={opt.label}
                onChange={(e) => update(idx, { label: e.target.value })}
                className="mt-1 w-full ffd-input"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Value</label>
              <input
                value={opt.value}
                onChange={(e) => update(idx, { value: e.target.value })}
                className="mt-1 w-full ffd-input font-mono"
              />
            </div>
            <div className="flex items-end">
              <button type="button" onClick={() => remove(idx)} className="ffd-btn-danger">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}