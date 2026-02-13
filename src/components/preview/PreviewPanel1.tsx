"use client";

import type { FormDefinition } from "@/lib/form-types";
import FormRenderer from "@/components/preview/FormRenderer";

/**
 * PreviewPanel
 *
 * A thin wrapper around the dynamic FormRenderer that provides:
 * - A consistent card container (spacing + border)
 * - A heading/description area derived from the current FormDefinition
 *
 * Why this exists:
 * - Separates "page layout concerns" (title/description/card styling)
 *   from "form rendering concerns" (inputs/validation/submission behavior).
 * - Makes it easy to reuse the same preview UI in multiple places:
 *   Preview page, Builder sidebar preview, future Studio view, etc.
 */
export default function PreviewPanel({ form }: { form: FormDefinition }) {
  return (
    <div className="rounded-lg border bg-white p-6">
      {/* Form metadata (display-only) */}
      <header>
        <h2 className="text-xl font-semibold">{form.title}</h2>

        {/* Description is optional in the FormDefinition */}
        {form.description ? (
          <p className="mt-2 text-gray-600">{form.description}</p>
        ) : null}
      </header>

      {/* Dynamic form renderer driven by the FormDefinition */}
      <div className="mt-6">
        <FormRenderer form={form} />
      </div>
    </div>
  );
}
