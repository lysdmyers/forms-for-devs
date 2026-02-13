"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegister } from "react-hook-form";
import type { FormDefinition, Field } from "@/lib/form-types";

/**
 * FieldRules
 *
 * A lightweight, UI-oriented view of the optional rules a field may carry.
 * These rules are authored in the Builder and reused here for runtime validation.
 *
 * Note: This intentionally stays flexible. Different field types support different
 * subsets of rules (e.g., minLength for text, min/max for number, options for select).
 */
type FieldRules = {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  integer?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
};

/**
 * FormValues
 *
 * React Hook Form stores values in a dictionary keyed by field.name.
 * For MVP, we allow unknown because:
 * - checkbox values are booleans
 * - number inputs arrive as strings unless coerced
 * - text/email/date are strings
 *
 * The form definition drives validation/interpretation.
 */
type FormValues = Record<string, unknown>;

/**
 * buildDefaultValues
 *
 * Creates initial values for the form based on field type.
 * - checkbox defaults to false (unchecked)
 * - all other inputs default to empty string
 *
 * Keeping defaults explicit avoids uncontrolled->controlled warnings and ensures
 * reset() works reliably.
 */
function buildDefaultValues(fields: Field[]): FormValues {
  const defaults: FormValues = {};
  for (const field of fields) {
    defaults[field.name] = field.type === "checkbox" ? false : "";
  }
  return defaults;
}

/**
 * validateValue
 *
 * Manual validation layer based on the active FormDefinition.
 * This is a "data-first" approach:
 * - Builder defines the rules
 * - Runtime enforces them
 *
 * In a future iteration, you can swap this with an Ajv-based validator using the
 * exported JSON Schema — but this is a clean MVP that keeps dependencies low.
 *
 * Returns:
 * - string: user-facing error message
 * - null: valid
 */
function validateValue(field: Field, value: unknown): string | null {
  // --- Required validation ---------------------------------------------------
  if (field.required) {
    const isEmpty =
      field.type === "checkbox" ? value !== true : value === "" || value == null;

    if (isEmpty) return `${field.label} is required.`;
  }

  // --- Type-specific rules ---------------------------------------------------
  const rules: FieldRules = field.rules as FieldRules;

  // Text-like fields: minLength/maxLength/pattern
  if (field.type === "text" || field.type === "textarea" || field.type === "email") {
    if (typeof value === "string") {
      if (rules.minLength != null && value.length < rules.minLength) {
        return `${field.label} must be at least ${rules.minLength} characters.`;
      }
      if (rules.maxLength != null && value.length > rules.maxLength) {
        return `${field.label} must be at most ${rules.maxLength} characters.`;
      }
      if (rules.pattern) {
        try {
          const re = new RegExp(rules.pattern);
          if (!re.test(value)) return `${field.label} format is invalid.`;
        } catch {
          // If pattern is invalid, we don't block the user in MVP.
          // (Builder can later validate pattern syntax to prevent this.)
        }
      }
    }
  }

  // Number fields: integer/min/max
  // NOTE: HTML inputs return strings; we coerce to Number for validation.
  if (field.type === "number") {
    if (value !== "" && value != null) {
      const num = Number(value);
      if (Number.isNaN(num)) return `${field.label} must be a number.`;
      if (rules.integer && !Number.isInteger(num)) return `${field.label} must be a whole number.`;
      if (rules.min != null && num < rules.min) return `${field.label} must be at least ${rules.min}.`;
      if (rules.max != null && num > rules.max) return `${field.label} must be at most ${rules.max}.`;
    }
  }

  return null;
}

/**
 * FormRenderer
 *
 * A dynamic form renderer driven entirely by a FormDefinition.
 * This is used by Preview (and can also be reused in "Studio" later).
 *
 * Current behaviors:
 * - Renders controls based on field.type
 * - Uses react-hook-form for lightweight state management
 * - Performs manual validation on submit using the same rules created in Builder
 * - Displays submitted payload for quick iteration/testing
 */
export default function FormRenderer({ form }: { form: FormDefinition }) {
  // Stores the last successfully submitted payload (MVP feedback loop).
  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  /**
   * Default values are computed from the field list.
   * Memoization prevents recalculating on every render and keeps reset stable.
   */
  const defaultValues = useMemo(() => buildDefaultValues(form.fields), [form.fields]);

  /**
   * react-hook-form setup.
   * - register: binds inputs
   * - handleSubmit: manages submit lifecycle
   * - setError: manual validation errors
   * - reset: reset back to defaults
   */
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ defaultValues });

  /**
   * onSubmit
   *
   * Runs our definition-driven validation and, if valid,
   * stores the payload for display (MVP behavior).
   */
  const onSubmit = async (values: FormValues) => {
    let hasError = false;

    // Validate each field based on our definition.
    for (const field of form.fields) {
      const message = validateValue(field, values[field.name]);
      if (message) {
        hasError = true;
        setError(field.name, { type: "manual", message });
      }
    }

    if (hasError) return;

    // MVP: display the result rather than posting to a backend.
    setSubmitted(values);
  };

  /**
   * onReset
   *
   * Resets input state to our computed defaults and clears any prior submission output.
   */
  const onReset = () => {
    reset(defaultValues);
    setSubmitted(null);
  };

  return (
    <div className="rounded-lg border bg-white p-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Render each field dynamically */}
        {form.fields.map((field) => (
          <FieldRow
            key={field.id}
            field={field}
            register={register}
            // RHF error messages are unknown-ish; we narrow for display.
            error={errors[field.name]?.message as string | undefined}
          />
        ))}

        {/* Primary form actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
          >
            Submit
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-md border px-4 py-2 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Submission output (MVP only) */}
      {submitted ? (
        <div className="mt-6 rounded-md border bg-gray-50 p-4">
          <p className="font-medium">Submitted values</p>
          <pre className="mt-2 overflow-auto text-sm">{JSON.stringify(submitted, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}

/**
 * FieldRow
 *
 * Renders a single field row (label + control + error).
 * This is isolated from FormRenderer for readability and testability.
 *
 * Props:
 * - register: typed react-hook-form register function for our values dictionary
 * - error: optional display string for this field
 */
function FieldRow({
  field,
  register,
  error,
}: {
  field: Field;
  register: UseFormRegister<FormValues>;
  error?: string;
}) {
  /**
   * commonLabel
   *
   * Shared label layout across most field types.
   * Includes:
   * - required indicator
   * - optional helper text (if supported by your Field type)
   */
  const commonLabel = (
    <div className="flex items-baseline justify-between">
      <label className="font-medium">
        {field.label}
        {field.required ? <span className="text-red-600"> *</span> : null}
      </label>
      {field.helperText ? <span className="text-xs text-gray-500">{field.helperText}</span> : null}
    </div>
  );

  // --- Textarea --------------------------------------------------------------
  if (field.type === "textarea") {
    return (
      <div className="space-y-1">
        {commonLabel}
        <textarea
          {...register(field.name)}
          placeholder={field.placeholder}
          className="w-full rounded-md border px-3 py-2"
          rows={4}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  // --- Select ----------------------------------------------------------------
  if (field.type === "select") {
    const rules: FieldRules = field.rules as FieldRules;
    const options = Array.isArray(rules?.options) ? rules.options : [];

    return (
      <div className="space-y-1">
        {commonLabel}
        <select
          {...register(field.name)}
          className="w-full rounded-md border px-3 py-2"
          defaultValue=""
        >
          <option value="">Select an option</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  // --- Checkbox --------------------------------------------------------------
  if (field.type === "checkbox") {
    return (
      <div className="space-y-1">
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register(field.name)} className="h-4 w-4" />
          <span className="font-medium">
            {field.label}
            {field.required ? <span className="text-red-600"> *</span> : null}
          </span>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  // --- Default input types ---------------------------------------------------
  const inputType =
    field.type === "email"
      ? "email"
      : field.type === "number"
      ? "number"
      : field.type === "date"
      ? "date"
      : "text";

  return (
    <div className="space-y-1">
      {commonLabel}
      <input
        type={inputType}
        {...register(field.name)}
        placeholder={field.placeholder}
        className="w-full rounded-md border px-3 py-2"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
