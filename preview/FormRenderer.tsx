"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { FormDefinition, Field } from "@/lib/form-types";

type FormValues = Record<string, any>;

function buildDefaultValues(fields: Field[]): FormValues {
  const defaults: FormValues = {};
  for (const field of fields) {
    // checkbox defaults to false, everything else defaults to empty string
    defaults[field.name] = field.type === "checkbox" ? false : "";
  }
  return defaults;
}

function validateValue(field: Field, value: any): string | null {
  // Required validation
  if (field.required) {
    const isEmpty =
      field.type === "checkbox" ? value !== true : value === "" || value == null;

    if (isEmpty) return `${field.label} is required.`;
  }

  // Type-specific rules
  const rules: any = field.rules;

  if (field.type === "text" || field.type === "textarea" || field.type === "email") {
    if (typeof value === "string") {
      if (rules?.minLength != null && value.length < rules.minLength) {
        return `${field.label} must be at least ${rules.minLength} characters.`;
      }
      if (rules?.maxLength != null && value.length > rules.maxLength) {
        return `${field.label} must be at most ${rules.maxLength} characters.`;
      }
      if (rules?.pattern) {
        try {
          const re = new RegExp(rules.pattern);
          if (!re.test(value)) return `${field.label} format is invalid.`;
        } catch {
          // If pattern is invalid, we don't block the user in MVP
        }
      }
    }
  }

  if (field.type === "number") {
    if (value !== "" && value != null) {
      const num = Number(value);
      if (Number.isNaN(num)) return `${field.label} must be a number.`;
      if (rules?.integer && !Number.isInteger(num)) return `${field.label} must be a whole number.`;
      if (rules?.min != null && num < rules.min) return `${field.label} must be at least ${rules.min}.`;
      if (rules?.max != null && num > rules.max) return `${field.label} must be at most ${rules.max}.`;
    }
  }

  return null;
}

export default function FormRenderer({ form }: { form: FormDefinition }) {
  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  const defaultValues = useMemo(() => buildDefaultValues(form.fields), [form.fields]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ defaultValues });

  const onSubmit = async (values: FormValues) => {
    // Manual validation against our FormDefinition (MVP approach)
    let hasError = false;

    for (const field of form.fields) {
      const message = validateValue(field, values[field.name]);
      if (message) {
        hasError = true;
        setError(field.name, { type: "manual", message });
      }
    }

    if (hasError) return;

    // For MVP, we just display the result
    setSubmitted(values);
  };

  const onReset = () => {
    reset(defaultValues);
    setSubmitted(null);
  };

  return (
    <div className="rounded-lg border bg-white p-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {form.fields.map((field) => (
          <FieldRow key={field.id} field={field} register={register} error={errors[field.name]?.message as string | undefined} />
        ))}

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

      {submitted ? (
        <div className="mt-6 rounded-md border bg-gray-50 p-4">
          <p className="font-medium">Submitted values</p>
          <pre className="mt-2 overflow-auto text-sm">{JSON.stringify(submitted, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}

function FieldRow({
  field,
  register,
  error,
}: {
  field: Field;
  register: any;
  error?: string;
}) {
  const commonLabel = (
    <div className="flex items-baseline justify-between">
      <label className="font-medium">
        {field.label}
        {field.required ? <span className="text-red-600"> *</span> : null}
      </label>
      {field.helperText ? <span className="text-xs text-gray-500">{field.helperText}</span> : null}
    </div>
  );

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

  if (field.type === "select") {
    const rules: any = field.rules;
    const options = rules?.options ?? [];
    return (
      <div className="space-y-1">
        {commonLabel}
        <select {...register(field.name)} className="w-full rounded-md border px-3 py-2">
          <option value="">Select an option</option>
          {options.map((o: any) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <div className="space-y-1">
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register(field.name)} className="h-4 w-4" />
          <span className="font-medium">{field.label}{field.required ? <span className="text-red-600"> *</span> : null}</span>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

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
