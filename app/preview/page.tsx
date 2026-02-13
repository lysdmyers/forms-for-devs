"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormDefinition } from "@/lib/form-types";
import basicContact from "@/templates/basic-contact.json";
import { loadFormFromStorage } from "@/lib/storage";
import FormRenderer from "@/components/preview/FormRenderer";

/**
 * PreviewPage
 *
 * Renders the currently active form definition as an interactive form.
 *
 * Purpose:
 * - Demonstrate how the saved FormDefinition becomes real UI
 * - Validate inputs using the same rules the Builder configures
 * - Provide a quick QA loop while building forms
 *
 * Data source:
 * - The "active form" is loaded from localStorage via loadFormFromStorage()
 * - Falls back to the starter template if nothing has been saved yet
 */
export default function PreviewPage() {
  const starter = basicContact as unknown as FormDefinition;

  /**
   * We initialize once on mount and keep the form stable for the session.
   *
   * Note:
   * If you want *true* live updates while the user edits Builder/Studio in
   * another tab, you can listen to the `storage` event and update state.
   * (Not required for MVP.)
   */
  const [form] = useState<FormDefinition>(() => {
    const saved = loadFormFromStorage();
    return saved ?? starter;
  });

  return (
    <main className="mx-auto max-w-3xl p-8">
      {/* Page header + quick navigation */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Preview</h1>
          <p className="mt-2 text-sm text-gray-600">
            Live rendering of the active form definition with validation.
          </p>
        </div>

        <div className="flex gap-3">
          {/* Use Next.js Link for client-side navigation */}
          <Link
            href="/builder"
            className="rounded-md border bg-white px-4 py-2 hover:bg-gray-50"
          >
            Builder
          </Link>

          <Link
            href="/export"
            className="rounded-md border bg-white px-4 py-2 hover:bg-gray-50"
          >
            Export
          </Link>
        </div>
      </div>

      {/* Preview card */}
      <div className="mt-10 rounded-lg border bg-white p-6">
        {/* Form metadata */}
        <h2 className="text-xl font-semibold">{form.title}</h2>

        {form.description ? (
          <p className="mt-2 text-gray-600">{form.description}</p>
        ) : null}

        {/* Actual form renderer driven by the FormDefinition */}
        <div className="mt-6">
          <FormRenderer form={form} />
        </div>
      </div>
    </main>
  );
}
