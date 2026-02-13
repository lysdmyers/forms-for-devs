// lib/exporters/react-ts.ts
import type { FormDefinition } from "@/lib/form-types";

/**
 * generateReactTsComponent
 *
 * Generates a minimal, dependency-free React + TypeScript form component.
 * Intended as a "drop-in" export target: paste into a React/Next codebase and customize.
 *
 * MVP output:
 * - Controlled inputs with local state
 * - Required attribute support
 * - Type-aware inputs (text/textarea/email/number/date/select/checkbox)
 * - Basic rule support (min/max, minLength/maxLength, pattern, enum)
 * - No backend integration (consumer wires onSubmit / API route)
 */
export function generateReactTsComponent(form: FormDefinition): string {
  // Ensure the generated component name is always a valid identifier.
  const componentName = makeSafeComponentName(form.id || form.title || "GeneratedForm");

  const fieldsLiteral = JSON.stringify(form.fields, null, 2);

  // Build a stable initial values object based on field types.
  // (We store values as string/boolean to keep the export lightweight.)
  const initLines = form.fields
    .map((f) => {
      const key = JSON.stringify(f.name);
      if (f.type === "checkbox") return `  ${key}: false,`;
      return `  ${key}: "",`;
    })
    .join("\n");

  const title = escapeTemplateString(form.title);
  const description = form.description ? escapeTemplateString(form.description) : "";

  return `import { useState } from "react";

type FieldType = "text" | "textarea" | "email" | "number" | "date" | "select" | "checkbox";

type FieldRules = Partial<{
  minLength: number;
  maxLength: number;
  pattern: string;
  min: number;
  max: number;
  integer: boolean;
  options: Array<{ label: string; value: string }>;
}>;

type Field = {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  rules?: FieldRules;
};

export type Values = Record<string, string | boolean>;

export type ${componentName}Props = {
  /**
   * Called with the current form values when the user submits the form.
   * Recommended: validate server-side using the exported JSON Schema.
   */
  onSubmit?: (values: Values) => void;

  /** Optionally override the default button label. */
  submitLabel?: string;

  /** Optional wrapper className for styling integration. */
  className?: string;
};

const FIELDS: Field[] = ${fieldsLiteral};

const DEFAULT_VALUES: Values = {
${initLines}
};

// Precompute required field names as a module constant.
// (Stable and avoids hook dependency linting.)
const REQUIRED_NAMES = new Set(FIELDS.filter((f) => !!f.required).map((f) => f.name));

export default function ${componentName}(props: ${componentName}Props) {
  const { onSubmit, submitLabel = "Submit", className } = props;

  // Local controlled state keeps the export simple and framework-agnostic.
  const [values, setValues] = useState<Values>({ ...DEFAULT_VALUES });

  const setValue = (name: string, next: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: next }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>${title}</div>
          ${description ? `<div style={{ color: "#666", fontSize: 14 }}>${description}</div>` : ""}
        </div>

        {FIELDS.map((field) => {
          const rules = field.rules ?? {};
          const isRequired = REQUIRED_NAMES.has(field.name);

          const label = (
            <label htmlFor={field.name} style={{ fontSize: 14, fontWeight: 600 }}>
              {field.label}
              {isRequired ? <span style={{ color: "#b00020" }}> *</span> : null}
            </label>
          );

          if (field.type === "checkbox") {
            return (
              <div key={field.id} style={{ display: "grid", gap: 6 }}>
                {label}
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    id={field.name}
                    name={field.name}
                    type="checkbox"
                    checked={Boolean(values[field.name])}
                    required={isRequired}
                    onChange={(e) => setValue(field.name, e.target.checked)}
                  />
                  <span style={{ fontSize: 14 }}>
                    {field.placeholder?.trim() ? field.placeholder : "Yes"}
                  </span>
                </label>
              </div>
            );
          }

          if (field.type === "textarea") {
            return (
              <div key={field.id} style={{ display: "grid", gap: 6 }}>
                {label}
                <textarea
                  id={field.name}
                  name={field.name}
                  value={String(values[field.name] ?? "")}
                  placeholder={field.placeholder ?? ""}
                  required={isRequired}
                  minLength={typeof rules.minLength === "number" ? rules.minLength : undefined}
                  maxLength={typeof rules.maxLength === "number" ? rules.maxLength : undefined}
                  style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
                  rows={4}
                  onChange={(e) => setValue(field.name, e.target.value)}
                />
              </div>
            );
          }

          if (field.type === "select") {
            const opts = Array.isArray(rules.options) ? rules.options : [];
            return (
              <div key={field.id} style={{ display: "grid", gap: 6 }}>
                {label}
                <select
                  id={field.name}
                  name={field.name}
                  value={String(values[field.name] ?? "")}
                  required={isRequired}
                  style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
                  onChange={(e) => setValue(field.name, e.target.value)}
                >
                  <option value="" disabled>
                    {field.placeholder?.trim() ? field.placeholder : "Select an option"}
                  </option>
                  {opts.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          // Default: input field (text/email/number/date)
          const inputType =
            field.type === "text" ? "text" : field.type === "email" ? "email" : field.type;

          return (
            <div key={field.id} style={{ display: "grid", gap: 6 }}>
              {label}
              <input
                id={field.name}
                name={field.name}
                type={inputType}
                value={String(values[field.name] ?? "")}
                placeholder={field.placeholder ?? ""}
                required={isRequired}
                minLength={typeof rules.minLength === "number" ? rules.minLength : undefined}
                maxLength={typeof rules.maxLength === "number" ? rules.maxLength : undefined}
                pattern={typeof rules.pattern === "string" ? rules.pattern : undefined}
                min={typeof rules.min === "number" ? rules.min : undefined}
                max={typeof rules.max === "number" ? rules.max : undefined}
                step={field.type === "number" ? (rules.integer ? 1 : "any") : undefined}
                style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
                onChange={(e) => setValue(field.name, e.target.value)}
              />
            </div>
          );
        })}

        <button
          type="submit"
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
`;
}

/**
 * Ensures the exported component name is always a valid TS identifier:
 * - PascalCase words
 * - If it starts with a digit, prefix with "Form"
 * - Fallback to "GeneratedForm"
 */
function makeSafeComponentName(input: string): string {
  const base = toPascalCase(safeIdentifier(input));
  const fallback = base.length ? base : "GeneratedForm";
  return /^[A-Za-z_]/.test(fallback) ? fallback : `Form${fallback}`;
}

/**
 * Converts arbitrary text into a safe identifier string (best-effort).
 * We preserve letters/numbers/spaces/_/- and drop everything else.
 */
function safeIdentifier(input: string): string {
  const cleaned = String(input).replace(/[^A-Za-z0-9_\-\s]/g, " ").trim();
  return cleaned.length ? cleaned : "GeneratedForm";
}

/** Converts string -> PascalCase. */
function toPascalCase(input: string): string {
  return input
    .replace(/[_\-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Escapes backslashes, backticks, and template markers so we can safely embed
 * form titles/descriptions inside a template literal.
 */
function escapeTemplateString(input: string): string {
  return String(input)
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}
