"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormDefinition } from "@/lib/form-types";
import basicContact from "@/templates/basic-contact.json";
import { loadFormFromStorage } from "@/lib/storage";
import FormRenderer from "@/components/preview/FormRenderer";
import AppShell from "@/components/layout/AppShell";

/**
 * PreviewPage
 *
 * Renders the currently active form definition as an interactive form.
 *
 * Purpose:
 * - Demonstrate how the saved FormDefinition becomes real UI
 * - Validate inputs using the same rules the Studio configures
 * - Provide a quick QA loop while building forms
 *
 * Data source:
 * - The "active form" is loaded from localStorage via loadFormFromStorage()
 * - Falls back to the starter template if nothing has been saved yet
 */
export default function PreviewPage() {
  const starter = basicContact as unknown as FormDefinition;

  /**
   * Initialize once on mount and keep the form stable for the session.
   *
   * Note:
   * If you want *true* live updates while editing Studio in another tab,
   * you can listen to the `storage` event and update state.
   * (Not required for MVP.)
   */
  const [form] = useState<FormDefinition>(() => {
    const saved = loadFormFromStorage();
    return saved ?? starter;
  });

  return (
    <AppShell
      title="Preview"
      description="Live rendering of the active form definition with validation."
      actions={
        <>
          <Link href="/exports" className="ffd-btn-ghost">
            Export
          </Link>
          <Link href="/studio" className="ffd-btn">
            Back to Studio
          </Link>
        </>
      }
    >
      {/* Preview card */}
      <section className="ffd-card p-6">
        {/* Form metadata */}
        <div className="space-y-2">
          <h2 className="ffd-heading text-xl font-semibold">{form.title}</h2>
          {form.description ? (
            <p className="text-sm ffd-muted">{form.description}</p>
          ) : null}
        </div>

        {/* Actual form renderer driven by the FormDefinition */}
        <div className="mt-6">
          <FormRenderer form={form} />
        </div>
      </section>
    </AppShell>
  );
}
