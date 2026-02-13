// lib/form-types.ts

/**
 * FieldType
 *
 * Enumerates all supported field types in the MVP.
 *
 * Design note:
 * - This union drives rendering (FormRenderer)
 * - It also influences JSON Schema generation
 * - New types can be added incrementally without breaking existing forms
 */
export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "date"
  | "select"
  | "checkbox";

/**
 * BaseField
 *
 * Core properties shared by every field type.
 *
 * Architectural role:
 * - This is the minimal "shape contract" required to render and identify a field.
 * - The `name` becomes:
 *   - The JSON submission key
 *   - The JSON Schema property key
 *   - The input `name` attribute
 *
 * Keeping this clean and predictable ensures stable exports.
 */
export type BaseField = {
  /**
   * Stable unique identifier used internally for:
   * - Editing
   * - Reordering
   * - React keying
   *
   * This is NOT exposed in submissions.
   */
  id: string;

  /**
   * Data key used in submissions and JSON Schema.
   * Must be a safe identifier (validated in Builder).
   */
  name: string;

  /**
   * Human-readable label displayed to end users.
   */
  label: string;

  /**
   * Determines rendering behavior and rule applicability.
   */
  type: FieldType;

  /**
   * If true, the user must provide a value.
   */
  required?: boolean;

  /**
   * Optional supporting text shown near the label.
   */
  helperText?: string;

  /**
   * Optional input placeholder text.
   */
  placeholder?: string;
};

/**
 * TextRules
 *
 * Validation constraints for text-like inputs:
 * - text
 * - textarea
 * - email
 *
 * pattern is stored as a string (not RegExp) so:
 * - It serializes cleanly to JSON
 * - It can be exported into JSON Schema
 */
export type TextRules = {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // e.g. "^[A-Za-z]+$"
};

/**
 * NumberRules
 *
 * Validation constraints for numeric fields.
 *
 * integer:
 * - If true, restricts values to whole numbers only.
 * - Influences both runtime validation and JSON Schema output.
 */
export type NumberRules = {
  min?: number;
  max?: number;
  integer?: boolean;
};

/**
 * SelectRules
 *
 * Validation/configuration for dropdown fields.
 *
 * options:
 * - label: user-facing display value
 * - value: submitted data value
 *
 * These values are exported into JSON Schema as enum values.
 */
export type SelectRules = {
  options: Array<{ label: string; value: string }>;
};

/**
 * FieldRules
 *
 * Union of all rule types.
 *
 * Design decision:
 * We use a simple union instead of discriminated unions for MVP flexibility.
 * In a future version, this could evolve into a stricter discriminated model:
 *
 *   type Field =
 *     | { type: "text"; rules?: TextRules }
 *     | { type: "number"; rules?: NumberRules }
 *     ...
 *
 * For now, flexibility > strict exhaustiveness.
 */
export type FieldRules = TextRules | NumberRules | SelectRules;

/**
 * Field
 *
 * Combines the BaseField with optional rules.
 *
 * This is the atomic building block of:
 * - Builder
 * - Preview
 * - JSON Schema generator
 * - React export generator
 */
export type Field = BaseField & {
  rules?: FieldRules;
};

/**
 * FormDefinition
 *
 * The top-level, data-first representation of a form.
 *
 * This object is:
 * - Stored in localStorage
 * - Used to generate JSON Schema
 * - Used to generate React/TS exports
 * - Used to render the live preview
 *
 * It is the single source of truth in the application.
 */
export type FormDefinition = {
  /**
   * Stable form identifier.
   * Used in export filenames and future multi-form support.
   */
  id: string;

  /**
   * Display title shown in UI and exported schemas.
   */
  title: string;

  /**
   * Optional description shown above the form.
   */
  description?: string;

  /**
   * Schema versioning support.
   * Enables:
   * - Future migrations
   * - Backward compatibility
   * - Safe storage upgrades
   */
  version: number;

  /**
   * Ordered list of fields.
   * Order determines render order and submission structure.
   */
  fields: Field[];

  /**
   * Metadata timestamps (ISO format for portability).
   */
  createdAtISO: string;
  updatedAtISO: string;
};
