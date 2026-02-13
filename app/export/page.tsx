"use client";

import { useMemo, useState } from "react";
import type { FormDefinition } from "@/lib/form-types";
import basicContact from "@/templates/basic-contact.json";
import { loadFormFromStorage } from "@/lib/storage";
import { generateJsonSchema } from "@/lib/schema-generator";
import { generateReactTsComponent } from "@/lib/exporters/react-ts";
import Link from "next/link";

/**
 * ExportFormat
 *
 * Supported export targets for v1:
 * - form: raw form definition (source-of-truth JSON)
 * - schema: JSON Schema (validation spec)
 * - reactTs: drop-in React + TypeScript component
 */
type ExportFormat = "form" | "schema" | "reactTs";

/**
 * downloadText
 *
 * Generic client-side download helper for text-based exports
 * (JSON, TS/TSX, etc.).
 */
function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const starter = basicContact as unknown as FormDefinition;

  // UI state for export selection + copy confirmation.
  const [format, setFormat] = useState<ExportFormat>("schema");
  const [copied, setCopied] = useState(false);

  /**
   * Load the active form definition once.
   * Export is read-only: it reflects the current builder state.
   */
  const [form] = useState<FormDefinition>(() => {
    const saved = loadFormFromStorage();
    return saved ?? starter;
  });

  /**
   * Compute all export outputs once per form.
   * This keeps the UI snappy when toggling formats.
   */
  const outputs = useMemo(() => {
    const schema = generateJsonSchema(form);
    const reactTs = generateReactTsComponent(form);

    return {
      formJson: JSON.stringify(form, null, 2),
      schemaJson: JSON.stringify(schema, null, 2),
      reactTs,
    };
  }, [form]);

  /**
   * Derive the currently displayed export text + filename + mime type.
   */
  const current = useMemo(() => {
    const base = form.id || "form";

    switch (format) {
      case "form":
        return {
          label: "Form Definition (JSON)",
          filename: `${base}.form.json`,
          mime: "application/json",
          text: outputs.formJson,
        };

      case "schema":
        return {
          label: "JSON Schema (draft 2020-12)",
          filename: `${base}.schema.json`,
          mime: "application/json",
          text: outputs.schemaJson,
        };

      case "reactTs":
        return {
          label: "React + TypeScript Component",
          filename: `${base}.tsx`,
          mime: "text/plain",
          text: outputs.reactTs,
        };
    }
  }, [format, form.id, outputs]);

  /**
   * Copy current export text to clipboard.
   * MVP behavior: minimal failure UI.
   */
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(current.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    // Flex layout ensures the output area can take remaining height and scroll internally.
    <main className="mx-auto max-w-5xl p-6 min-h-screen flex flex-col">
      {/* Header Section (fixed height; does not scroll) */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Export</h1>
          <p className="mt-2 text-sm text-gray-600">
            Export the active form as JSON, JSON Schema, or a drop-in React + TypeScript component.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/builder/" className="rounded-md border bg-white px-4 py-2 hover:bg-gray-50">
            Builder
          </Link>
          <Link href="/preview/" className="rounded-md border bg-white px-4 py-2 hover:bg-gray-50">
            Preview
          </Link>

          <button
            type="button"
            onClick={onCopy}
            className="rounded-md bg-black px-4 py-2 text-white hover:opacity-90"
          >
            {copied ? "Copied!" : "Copy"}
          </button>

          <button
            type="button"
            onClick={() => downloadText(current.filename, current.text, current.mime)}
            className="rounded-md border bg-white px-4 py-2 hover:bg-gray-50"
          >
            Download
          </button>
        </div>
      </div>

      {/* Content Area: fills remaining height; children must use min-h-0 to allow scrolling */}
      <div className="mt-6 flex-1 min-h-0">
        <div className="h-full grid gap-4 lg:grid-cols-[260px_1fr] min-h-0">
          <aside className="rounded-lg border bg-white p-4 self-start">
            <p className="text-sm font-semibold text-gray-800">Format</p>
            <p className="mt-1 text-xs text-gray-600">
              Choose an export target. Copy/download updates automatically.
            </p>

            <div className="mt-4 grid gap-2">
              <FormatButton active={format === "form"} label="Form JSON" onClick={() => setFormat("form")} />
              <FormatButton active={format === "schema"} label="JSON Schema" onClick={() => setFormat("schema")} />
              <FormatButton active={format === "reactTs"} label="React + TSX" onClick={() => setFormat("reactTs")} />
            </div>

            <div className="mt-5 rounded-md border bg-gray-50 p-3 text-xs text-gray-700">
              <div className="font-semibold">{current.label}</div>
              <div className="mt-1 text-gray-600">File: {current.filename}</div>
            </div>
          </aside>

          {/* Output panel takes remaining height; content scrolls without expanding the card */}
          <section className="rounded-lg border bg-white overflow-hidden min-h-0">
            <div className="h-full overflow-auto p-4">
              <pre className="text-sm whitespace-pre">{current.text}</pre>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function FormatButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-md border px-3 py-2 text-left text-sm transition",
        active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
