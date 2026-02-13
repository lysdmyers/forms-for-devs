"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormDefinition, Field, FieldType, FieldRules } from "@/lib/form-types";
import basicContact from "@/templates/basic-contact.json";
import { loadFormFromStorage, saveFormToStorage, clearFormStorage } from "@/lib/storage";
import PreviewPanel from "@/components/preview/PreviewPanel1";

/**
 * nowISO
 *
 * Centralized timestamp helper so created/updated fields stay consistent.
 */
function nowISO() {
  return new Date().toISOString();
}

/**
 * makeId
 *
 * Generates a lightweight unique ID for fields.
 * For MVP, Math.random is sufficient; for production use, consider crypto.randomUUID().
 */
function makeId(prefix = "f") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * isValidFieldName
 *
 * Validates that the "name" key can be safely used as:
 * - JSON key
 * - HTML input name/id
 * - JSON Schema property key
 */
function isValidFieldName(name: string) {
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
 * Keeps rule edits from creating NaN values in the form definition.
 */
function toNumberOrUndefined(value: string) {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * StudioPage
 *
 * All-in-one authoring view:
 * - Left: Builder/editor for the FormDefinition
 * - Right: Live preview driven by the same in-memory definition
 *
 * Important design decision:
 * This page operates on a single "active form" (stored in localStorage).
 * Later, multi-form support can be added by extending storage to a list and
 * selecting an active form id.
 */
export default function StudioPage() {
  const starter = basicContact as unknown as FormDefinition;

  /**
   * Initialize from localStorage if available.
   * If not present (or corrupt), fall back to the starter template.
   */
  const [form, setForm] = useState<FormDefinition>(() => {
    const saved = loadFormFromStorage();
    return saved ?? { ...starter, updatedAtISO: nowISO() };
  });

  /**
   * persist
   *
   * Single entry point for state updates:
   * - Writes to localStorage
   * - Updates React state
   *
   * Note:
   * This avoids useEffect persistence. It keeps updates explicit and can help
   * avoid lint rules around missing dependencies.
   */
  const persist = (next: FormDefinition) => {
    saveFormToStorage(next);
    setForm(next);
  };

  /**
   * addField
   *
   * Creates a new field with a unique name and appends it to the form.
   * Ensures `name` keys don't collide (important for exports and validation).
   */
  const addField = (type: FieldType) => {
    const existingNames = new Set(form.fields.map((f) => f.name));

    const baseName = type === "email" ? "email" : "field";
    let name = baseName;
    let i = 1;

    while (existingNames.has(name)) {
      name = `${baseName}${i}`;
      i++;
    }

    const newField: Field = {
      id: makeId("f"),
      name,
      label: "New Field",
      type,
      required: false,
      placeholder: "",
    };

    persist({
      ...form,
      fields: [...form.fields, newField],
      updatedAtISO: nowISO(),
    });
  };

  /**
   * updateField
   *
   * Applies a partial patch to a field by ID.
   * (We use ID rather than name since name can be edited.)
   */
  const updateField = (id: string, patch: Partial<Field>) => {
    persist({
      ...form,
      fields: form.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      updatedAtISO: nowISO(),
    });
  };

  /**
   * deleteField
   *
   * Removes a field from the definition.
   */
  const deleteField = (id: string) => {
    persist({
      ...form,
      fields: form.fields.filter((f) => f.id !== id),
      updatedAtISO: nowISO(),
    });
  };

  /**
   * moveField
   *
   * Reorders fields in-place by swapping the current index with its neighbor.
   * Maintains a stable visual order for:
   * - preview
   * - exported schema
   * - generated UI exports
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
   * Clears persisted storage and restores the starter template.
   * Useful for demos and quick "start over" workflows.
   */
  const resetToTemplate = () => {
    clearFormStorage();
    persist({ ...starter, updatedAtISO: nowISO() });
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      {/* Page header + navigation actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Studio</h1>
          <p className="mt-2 text-sm text-gray-600">
            Build on the left. Preview on the right. Everything updates instantly.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/" className="rounded-md border bg-white px-4 py-2 hover:bg-gray-50">
            Home
          </Link>

          {/* Prefer Link for internal navigation (Next.js), but <a> is fine for MVP */}
          <Link href="/export" className="rounded-md border bg-white px-4 py-2 hover:bg-gray-50">
            Export
          </Link>

          <button
            type="button"
            onClick={resetToTemplate}
            className="rounded-md border bg-white px-4 py-2 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Two-column layout: builder (left) + preview (right) */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* LEFT: BUILDER */}
        <div className="rounded-lg border bg-white p-5">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Builder</h2>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Form Title</label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    persist({ ...form, title: e.target.value, updatedAtISO: nowISO() })
                  }
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Form Description</label>
                <input
                  value={form.description ?? ""}
                  onChange={(e) =>
                    persist({ ...form, description: e.target.value, updatedAtISO: nowISO() })
                  }
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Add field controls */}
          <div className="mt-6 flex flex-wrap gap-2">
            <AddButton label="Text" onClick={() => addField("text")} />
            <AddButton label="Textarea" onClick={() => addField("textarea")} />
            <AddButton label="Email" onClick={() => addField("email")} />
            <AddButton label="Number" onClick={() => addField("number")} />
            <AddButton label="Date" onClick={() => addField("date")} />
            <AddButton label="Select" onClick={() => addField("select")} />
            <AddButton label="Checkbox" onClick={() => addField("checkbox")} />
          </div>

          {/* Field list editor */}
          <div className="mt-6 space-y-4">
            {form.fields.map((field, index) => (
              <div key={field.id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium">
                    {index + 1}. {field.label}{" "}
                    <span className="text-xs text-gray-500">({field.type})</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveField(field.id, "up")}
                      className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(field.id, "down")}
                      className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteField(field.id)}
                      className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Label</label>
                    <input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      className="mt-1 w-full rounded-md border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Name (key)</label>
                    <input
                      value={field.name}
                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                      className="mt-1 w-full rounded-md border px-3 py-2"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Use camelCase, no spaces. Example:{" "}
                      <span className="font-mono">fullName</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      checked={!!field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium">Required</span>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Placeholder</label>
                    <input
                      value={field.placeholder ?? ""}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                      className="mt-1 w-full rounded-md border px-3 py-2"
                    />
                  </div>
                </div>

                {/* Advanced rule editor (min/max/pattern/options) */}
                <AdvancedRules field={field} onPatch={(patch) => updateField(field.id, patch)} />

                {/* Inline validation feedback for field "name" */}
                {!isValidFieldName(field.name) ? (
                  <p className="mt-3 text-sm text-red-600">
                    Field name must start with a letter and contain only letters, numbers, or underscores.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <div className="flex min-h-[calc(100vh-220px)] flex-col gap-4">
          {/* Sticky preview header so users keep context while scrolling */}
          <div className="sticky top-4 z-10 rounded-lg border bg-white p-5">
            <h2 className="text-lg font-semibold">Live preview</h2>
            <p className="mt-2 text-sm text-gray-600">
              This preview is always the current left-side form definition.
            </p>
          </div>

          {/* 
            Preview container:
            - flex-1 lets it consume remaining height
            - min-h-0 enables children to scroll properly inside a flex column
            - overflow-auto prevents the page from growing infinitely
          */}
          <div className="flex-1 min-h-0 overflow-auto rounded-lg">
            <PreviewPanel form={form} />
          </div>
        </div>
      </section>
    </main>
  );
}

/**
 * AddButton
 *
 * Small reusable button for adding new fields.
 * Kept as a separate component to keep StudioPage readable.
 */
function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
    >
      {label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* AdvancedRules + SelectOptionsEditor                                         */
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

  // Keep rules typed loosely for the editor UI
  const rules = (field.rules ?? {}) as Partial<{
    minLength: number;
    maxLength: number;
    pattern: string;
    min: number;
    max: number;
    integer: boolean;
    options: Array<{ label: string; value: string }>;
  }>;

  const setRules = (next: FieldRules | undefined) => {
    onPatch({ rules: next });
  };

  const clearRules = () => setRules(undefined);

  // Helpers prevent uncontrolled -> controlled warnings for numeric inputs
  const numOrEmpty = (v: unknown) => (typeof v === "number" ? v : "");
  const boolOrFalse = (v: unknown) => (typeof v === "boolean" ? v : false);

  return (
    <div className="mt-4 rounded-md border bg-gray-50 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium underline"
      >
        {open ? "Hide advanced rules" : "Show advanced rules"}
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          {(field.type === "text" || field.type === "textarea" || field.type === "email") && (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Min Length</label>
                <input
                  inputMode="numeric"
                  value={numOrEmpty(rules.minLength)}
                  onChange={(e) =>
                    setRules({
                      ...(rules as object),
                      minLength: toNumberOrUndefined(e.target.value),
                    } as FieldRules)
                  }
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  placeholder="e.g., 2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Max Length</label>
                <input
                  inputMode="numeric"
                  value={numOrEmpty(rules.maxLength)}
                  onChange={(e) =>
                    setRules({
                      ...(rules as object),
                      maxLength: toNumberOrUndefined(e.target.value),
                    } as FieldRules)
                  }
                  className="mt-1 w-full rounded-md border px-3 py-2"
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
                  className="mt-1 w-full rounded-md border px-3 py-2"
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
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  placeholder="e.g., 100"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  checked={boolOrFalse(rules.integer)}
                  onChange={(e) =>
                    setRules({
                      ...(rules as object),
                      integer: e.target.checked,
                    } as FieldRules)
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Integers Only</span>
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
            <button
              type="button"
              onClick={clearRules}
              className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
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
 * We store the options as `{ label, value }` so exports can:
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
        <button
          type="button"
          onClick={add}
          className="rounded-md border bg-white px-3 py-1 text-sm hover:bg-gray-50"
        >
          Add option
        </button>
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-gray-600">No options yet. Add one to use this field.</p>
      ) : null}

      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="text-xs font-medium">Label</label>
              <input
                value={opt.label}
                onChange={(e) => update(idx, { label: e.target.value })}
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Value</label>
              <input
                value={opt.value}
                onChange={(e) => update(idx, { value: e.target.value })}
                className="mt-1 w-full rounded-md border px-3 py-2 font-mono"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => remove(idx)}
                className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
