// lib/schema-generator.ts
import type { Field, FormDefinition } from "./form-types";

/**
 * Minimal JSON Schema types used by this project.
 * We keep this intentionally small to avoid dependency bloat while still
 * generating valid, predictable schema for MVP.
 *
 * Draft: 2020-12
 */
export type JsonSchema = {
  $schema: string;
  title: string;
  type: "object";
  additionalProperties: boolean;
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
};

/**
 * Property schemas we emit for fields.
 * (This is the value type inside the schema's `properties` object.)
 */
type JsonSchemaProperty = StringSchema | NumberSchema | BooleanSchema;

type StringSchema = {
  type: "string";
  format?: "email" | "date";
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
};

type NumberSchema = {
  type: "number" | "integer";
  minimum?: number;
  maximum?: number;
};

type BooleanSchema = {
  type: "boolean";
};

/**
 * Small helpers to safely read unknown rule values without using `any`
 * (and without depending on FieldRules' exact shape).
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  return typeof v === "number" ? v : undefined;
}

function readBoolean(obj: Record<string, unknown>, key: string): boolean | undefined {
  const v = obj[key];
  return typeof v === "boolean" ? v : undefined;
}

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

function readOptionsValues(rules: unknown): string[] {
  // Expected shape: { options: Array<{ label: string; value: string }> }
  if (!isRecord(rules)) return [];

  const rawOptions = rules.options;
  if (!Array.isArray(rawOptions)) return [];

  // Only keep valid string `value`s
  return rawOptions
    .map((opt: unknown) => (isRecord(opt) ? opt.value : undefined))
    .filter((v: unknown): v is string => typeof v === "string");
}

/**
 * Converts a single Field definition into the corresponding JSON Schema property.
 *
 * Notes:
 * - `textarea` is still a string in JSON Schema.
 * - `email` uses format: "email"
 * - `date` uses format: "date"
 * - `select` becomes enum: [...] based on option values
 */
function fieldToJsonSchema(field: Field): JsonSchemaProperty {
  const rules = field.rules; // unknown shape (by design for MVP)

  switch (field.type) {
    case "text":
    case "textarea":
    case "email": {
      const s: StringSchema = { type: "string" };

      if (field.type === "email") s.format = "email";

      if (isRecord(rules)) {
        const minLength = readNumber(rules, "minLength");
        const maxLength = readNumber(rules, "maxLength");
        const pattern = readString(rules, "pattern");

        if (minLength !== undefined) s.minLength = minLength;
        if (maxLength !== undefined) s.maxLength = maxLength;
        if (pattern && pattern.trim() !== "") s.pattern = pattern;
      }

      return s;
    }

    case "number": {
      // Default to "number"; upgrade to "integer" if rules.integer is true
      const s: NumberSchema = { type: "number" };

      if (isRecord(rules)) {
        const integer = readBoolean(rules, "integer");
        const min = readNumber(rules, "min");
        const max = readNumber(rules, "max");

        if (integer === true) s.type = "integer";
        if (min !== undefined) s.minimum = min;
        if (max !== undefined) s.maximum = max;
      }

      return s;
    }

    case "date": {
      const s: StringSchema = { type: "string", format: "date" };
      return s;
    }

    case "select": {
      const values = readOptionsValues(rules);
      const s: StringSchema = { type: "string", enum: values };
      return s;
    }

    case "checkbox": {
      const s: BooleanSchema = { type: "boolean" };
      return s;
    }

    default: {
      // Future-proof default: unknown field types are treated as strings.
      const s: StringSchema = { type: "string" };
      return s;
    }
  }
}

/**
 * Generates a JSON Schema (draft 2020-12) from a FormDefinition.
 *
 * MVP behavior:
 * - Each field.name becomes a property key
 * - `required` controls the top-level `required[]` list
 * - `additionalProperties` is false (extra keys are not allowed)
 */
export function generateJsonSchema(form: FormDefinition): JsonSchema {
  const properties: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];

  for (const field of form.fields) {
    properties[field.name] = fieldToJsonSchema(field);
    if (field.required) required.push(field.name);
  }

  const schema: JsonSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: form.title,
    type: "object",
    additionalProperties: false,
    properties,
  };

  // Keep schema output minimal/clean by omitting empty `required`.
  if (required.length > 0) schema.required = required;

  return schema;
}
