"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Field, FieldRules, FieldType, FormDefinition } from "@/lib/form-types";
import basicContact from "@/templates/basic-contact.json";
import { loadFormFromStorage, saveFormToStorage, clearFormStorage } from "@/lib/storage";

/**
 * nowISO
 *
 * Centralized timestamp helper to keep our "last updated" metadata consistent.
 * We store ISO strings because they're:
 * - stable across time zones
 * - JSON-friendly
 * - easy to diff/debug in localStorage exports
 */
function nowISO() {
  return new Date().toISOString();
}

/**
 * makeId
 *
 * Creates a lightweight unique-ish id for client-side field items.
 * For MVP we avoid heavier UUID libs; collisions are extremely unlikely for
 * typical form-building usage.
 */
function makeId(prefix = "f") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * isValidFieldName
 *
 * Field "name" becomes:
 * - JSON keys in submissions
 * - JSON Schema property keys
 * - input name attributes
 *
 * We enforce a safe identifier pattern: starts with a letter,
 * then letters/numbers/underscores only.
 */
function isValidFieldName(name: string) {
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(name);
}

/**
 * toNumberOrUndefined
 *
 * Converts UI input strings into optional numbers.
 * - Empty string -> undefined (meaning: "no rule set")
 * - Non-numeric -> undefined (avoid writing NaN into rules)
 */
function toNumberOrUndefined(value: string) {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * BuilderPage
 *
 * Responsibilities:
 * - Load the active form definition (localStorage or template fallback)
 * - Allow CRUD editing of fields and form metadata
 * - Persist changes to localStorage automatically
 * - Provide a lightweight live preview for fast feedback
 *
 * Notes:
 * - This is a client component because it reads/writes localStorage.
 * - The Builder is the source of truth for the active form state in MVP.
 */
export default function BuilderPage() {
  // Template used when no saved form exists. This keeps the app usable on first run.
  const starter = basicContact as unknown as FormDefinition;

  /**
   * Initialize state from localStorage exactly once on mount.
   * We also ensure updatedAtISO is set when falling back to template.
   */
  const [form, setForm] = useState<FormDefinition>(() => {
    const saved = loadFormFromStorage();
    return saved ?? { ...starter, updatedAtISO: nowISO() };
  });

  /**
   * Persist the active form to localStorage on every change.
   * In MVP, this is our entire persistence strategy.
   */
  useEffect(() => {
    saveFormToStorage(form);
  }, [form]);

  /**
   * Memoized set of existing field names for fast uniqueness checks.
   * Used when generating a new field.name so we don't collide.
   */
  const fieldNameSet = useMemo(() => new Set(form.fields.map((f) => f.name)), [form.fields]);

  /**
   * addField
   *
   * Adds a new field to the form with a unique name.
   * Naming strategy:
   * - email fields prefer "email" / "email1" / "email2" ...
   * - everything else defaults to "field" / "field1" / "field2" ...
   *
   * This keeps exports predictable and prevents schema key collisions.
   */
  const addField = (type: FieldType) => {
    const baseName = type === "email" ? "email" : "field";
    let name = baseName;
    let i = 1;

    // Ensure `name` is unique among existing fields.
    while (fieldNameSet.has(name)) {
      name = `${baseName}${i}`;
      i++;
    }

    // Default field settings. Users can customize immediately after adding.
    const newField: Field = {
      id: makeId("f"),
      name,
      label: "New Field",
      type,
      required: false,
      placeholder: "",
    };

    setForm((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
      updatedAtISO: nowISO(),
    }));
  };

  /**
   * updateField
   *
   * Patch-update a specific field by id.
   * We keep this centralized so all mutations:
   * - are immutable
   * - update updatedAtISO consistently
   */
  const updateField = (id: string, patch: Partial<Field>) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      updatedAtISO: nowISO(),
    }));
  };

  /**
   * deleteField
   *
   * Removes a field from the definition by id.
   */
  const deleteField = (id: string) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== id),
      updatedAtISO: nowISO(),
    }));
  };

  /**
   * moveField
   *
   * Reorders fields up/down by swapping with an adjacent index.
   * Guard rails:
   * - no-op if field not found
   * - no-op if target index would go out of bounds
   */
  const moveField = (id: string, direction: "up" | "down") => {
    setForm((prev) => {
      const idx = prev.fields.findIndex((f) => f.id === id);
      if (idx === -1) return prev;

      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.fields.length) return prev;

      const next = [...prev.fields];
      [next[idx], next[target]] = [next[target], next[idx]];

      return { ...prev, fields: next, updatedAtISO: nowISO() };
    });
  };

  /**
   * resetToTemplate
   *
   * Reverts the active form back to the bundled starter template.
   * We clear and re-save to keep localStorage consistent and predictable.
   */
  const resetToTemplate = () => {
    const next = { ...starter, updatedAtISO: nowISO() };
    clearFormStorage();
    saveFormToStorage(next);
    setForm(next);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header: title + basic metadata editing + navigation */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <h1 className="ffd-heading">Builder</h1>

          {/* Form-level metadata (applies to schema titles + UI headings) */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Form Title</label>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                    updatedAtISO: nowISO(),
                  }))
                }
                className="mt-1 w-full ffd-input"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Form Description</label>
              <input
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                    updatedAtISO: nowISO(),
                  }))
                }
                className="mt-1 w-full ffd-input"
              />
            </div>
          </div>

          <p className="text-sm ffd-muted">Edit your form definition. Changes auto-save locally.</p>
        </div>

        {/* Primary actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/preview" className="ffd-btn-ghost">
            Preview
          </Link>
          <Link href="/export" className="ffd-btn-ghost">
            Export
          </Link>
          <button type="button" onClick={resetToTemplate} className="ffd-btn-ghost">
            Reset to Template
          </button>
        </div>
      </div>

      {/* Main layout: editor (left) + tools/preview (right) */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Fields editor */}
        <div className="ffd-card p-5">
          <h2 className="ffd-heading">Fields</h2>

          <div className="mt-4 space-y-4">
            {form.fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                {/* Field header: index/label + reorder/delete controls */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium">
                    {index + 1}. {field.label}{" "}
                    <span className="text-xs ffd-muted">({field.type})</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveField(field.id, "up")}
                      className="ffd-btn px-3 py-1"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(field.id, "down")}
                      className="ffd-btn px-3 py-1"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteField(field.id)}
                      className="ffd-btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Field core properties */}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Label</label>
                    <input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      className="mt-1 w-full ffd-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Name (key)</label>
                    <input
                      value={field.name}
                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                      className="mt-1 w-full ffd-input"
                    />
                    <p className="text-xs ffd-muted">
                      Use camelCase, no spaces. Example:{" "}
                      <span className="font-mono">fullName</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      checked={!!field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="h-4 w-4 accent-[var(--ring)]"
                    />
                    <span className="text-sm font-medium">Required</span>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Placeholder</label>
                    <input
                      value={field.placeholder ?? ""}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                      className="mt-1 w-full ffd-input"
                    />
                  </div>
                </div>

                {/* Rules are optional and only relevant to certain field types */}
                <AdvancedRules field={field} onPatch={(patch) => updateField(field.id, patch)} />

                {/* Validation: warn if the field name can't be safely used as a key */}
                {!isValidFieldName(field.name) ? (
                  <p className="mt-3 text-sm text-red-600">
                    Field name must start with a letter and contain only letters, numbers, or
                    underscores.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Tools sidebar: add field + live preview */}
        <aside className="ffd-card p-5 space-y-6">
          {/* Add field controls */}
          <div>
            <h2 className="ffd-heading">Add Field</h2>
            <p className="text-sm ffd-muted">Add a new field type to your form.</p>

            <div className="mt-4 grid gap-2">
              <AddButton label="Text" onClick={() => addField("text")} />
              <AddButton label="Textarea" onClick={() => addField("textarea")} />
              <AddButton label="Email" onClick={() => addField("email")} />
              <AddButton label="Number" onClick={() => addField("number")} />
              <AddButton label="Date" onClick={() => addField("date")} />
              <AddButton label="Select" onClick={() => addField("select")} />
              <AddButton label="Checkbox" onClick={() => addField("checkbox")} />
            </div>
          </div>

          {/* Live preview: quick feedback without leaving the builder */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Live Preview</h3>
              <span className="text-xs ffd-muted">Updates as you edit!</span>
            </div>

            <div className="mt-3">
              <FormLivePreview form={form} />
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

/**
 * AddButton
 *
 * Small UI helper for the sidebar "Add field" list.
 * Keeping it as a component reduces repetitive button markup.
 */
function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ffd-btn-ghost w-full text-left">
      {label}
    </button>
  );
}

/**
 * AdvancedRules
 *
 * Optional rule editor for additional validation constraints.
 * Rules are stored on the field definition and later used for:
 * - generating JSON Schema
 * - (future) generating runtime UI validation
 */
function AdvancedRules({
  field,
  onPatch,
}: {
  field: Field;
  onPatch: (patch: Partial<Field>) => void;
}) {
  const [open, setOpen] = useState(false);

  /**
   * We keep rules loosely typed because rules are optional and vary by field type.
   * This matches the builder's flexible MVP approach.
   */
  const rules = (field.rules ?? {}) as Partial<{
    minLength: number;
    maxLength: number;
    pattern: string;
    min: number;
    max: number;
    integer: boolean;
    options: Array<{ label: string; value: string }>;
  }>;

  // Centralized setter so rules updates always patch the parent field.
  const setRules = (next: FieldRules | undefined) => {
    onPatch({ rules: next });
  };

  const clearRules = () => setRules(undefined);

  // Helpers for controlled inputs: keep empty display when value is unset.
  const numOrEmpty = (v: unknown) => (typeof v === "number" ? v : "");
  const boolOrFalse = (v: unknown) => (typeof v === "boolean" ? v : false);

  return (
    <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium underline decoration-[var(--border)] underline-offset-4"
      >
        {open ? "Hide advanced rules" : "Show advanced rules"}
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          {/* String-ish rules */}
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
                  className="mt-1 w-full ffd-input"
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
                  className="mt-1 w-full ffd-input"
                  placeholder="e.g., 80"
                />
              </div>
            </div>
          )}

          {/* Number rules */}
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
                  className="h-4 w-4 accent-[var(--ring)]"
                />
                <span className="text-sm font-medium">Integers Only</span>
              </div>
            </div>
          )}

          {/* Select options */}
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
            <button type="button" onClick={clearRules} className="ffd-btn">
              Clear Rules
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
 * Specialized editor for select field options.
 * Each option has:
 * - label: what the user sees
 * - value: what is stored/submitted
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

  const add = () =>
    onChange([...options, { label: "Option", value: `option${options.length + 1}` }]);

  const remove = (idx: number) => onChange(options.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Options</p>
        <button type="button" onClick={add} className="ffd-btn px-3 py-1">
          Add Option
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

/**
 * FormLivePreview
 *
 * Lightweight preview that renders the form definition with "best effort" HTML controls.
 * This preview is intentionally non-functional (submission disabled) and exists purely
 * to validate layout and options as the user edits.
 */
function FormLivePreview({ form }: { form: FormDefinition }) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        // Prevent navigation/reload if someone hits Enter inside the preview.
        e.preventDefault();
      }}
    >
      <div className="space-y-1">
        <div className="text-base font-semibold">{form.title}</div>
        {form.description ? <div className="text-sm ffd-muted">{form.description}</div> : null}
      </div>

      {form.fields.length === 0 ? (
        <p className="text-sm ffd-muted">No fields yet. Add one to preview.</p>
      ) : (
        <div className="space-y-3">
          {form.fields.map((field) => (
            <PreviewField key={field.id} field={field} />
          ))}
        </div>
      )}

      <button type="button" className="ffd-btn w-full" disabled>
        Submit (Preview)
      </button>
    </form>
  );
}

/**
 * PreviewField
 *
 * Renders a single field in the live preview.
 * Uses simple HTML controls and mirrors a subset of rules so the preview reflects:
 * - required markers
 * - select options
 * - basic numeric/text constraints
 */
function PreviewField({ field }: { field: Field }) {
  const rules = (field.rules ?? {}) as Partial<{
    minLength: number;
    maxLength: number;
    pattern: string;
    min: number;
    max: number;
    integer: boolean;
    options: Array<{ label: string; value: string }>;
  }>;

  const common = {
    name: field.name,
    required: !!field.required,
    placeholder: field.placeholder ?? "",
    className: "mt-1 w-full ffd-input",
  };

  return (
    <div>
      <label className="text-sm font-medium">
        {field.label}
        {field.required ? <span className="text-red-600"> *</span> : null}
      </label>

      {field.type === "textarea" ? (
        <textarea
          {...common}
          rows={4}
          minLength={typeof rules.minLength === "number" ? rules.minLength : undefined}
          maxLength={typeof rules.maxLength === "number" ? rules.maxLength : undefined}
        />
      ) : field.type === "select" ? (
        <select {...common} defaultValue="">
          <option value="" disabled>
            {field.placeholder?.trim() ? field.placeholder : "Select an option"}
          </option>
          {(Array.isArray(rules.options) ? rules.options : []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.type === "checkbox" ? (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            name={field.name}
            required={!!field.required}
            className="h-4 w-4 accent-[var(--ring)]"
          />
          <span className="text-sm">{field.placeholder?.trim() ? field.placeholder : "Yes"}</span>
        </div>
      ) : (
        <input
          {...common}
          type={field.type === "text" ? "text" : field.type === "email" ? "email" : field.type}
          minLength={typeof rules.minLength === "number" ? rules.minLength : undefined}
          maxLength={typeof rules.maxLength === "number" ? rules.maxLength : undefined}
          pattern={typeof rules.pattern === "string" ? rules.pattern : undefined}
          min={typeof rules.min === "number" ? rules.min : undefined}
          max={typeof rules.max === "number" ? rules.max : undefined}
          step={field.type === "number" ? (rules.integer ? 1 : "any") : undefined}
        />
      )}
    </div>
  );
}
