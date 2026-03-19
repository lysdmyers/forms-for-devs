"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormDefinition } from "@/lib/form-types";
import basicContact from "@/templates/basic-contact.json";
import { loadFormFromStorage } from "@/lib/storage";
import AppShell from "@/components/layout/AppShell";
import { generateJsonSchema } from "@/lib/schema-generator";
import { generateReactTsComponent } from "@/lib/exporters/react-ts";
import { generateHtml } from "@/lib/exporters/html";
import { generateCss } from "@/lib/exporters/css";

/**
 * ExportPage
 *
 * Multi-format export surface for the currently active FormDefinition.
 *
 * Formats:
 * - Form JSON (the raw FormDefinition)
 * - JSON Schema (draft 2020-12)
 * - React + TypeScript component (dependency-free)
 * - Embedded HTML (single snippet with inline CSS)
 * - HTML + CSS (combined MVP output for download/copy)
 *
 * UX goals:
 * - Stable layout: export panel scrolls internally (doesn't grow the page forever)
 * - Clear affordances: Copy + Download for each output
 * - Consistent navigation across the app via AppShell
 */

type ExportFormat =
  | "form-json"
  | "json-schema"
  | "react-ts"
  | "html-css";

const FORMAT_LABEL: Record<ExportFormat, string> = {
  "form-json": "Form JSON",
  "json-schema": "JSON Schema",
  "react-ts": "React + TS",
  "html-css": "HTML + CSS",
};

export default function ExportPage() {
  const starter = basicContact as unknown as FormDefinition;

  /**
   * Load the active form once.
   * (Export page is a snapshot; live syncing via storage event is optional later.)
   */
  const [form] = useState<FormDefinition>(() => {
    const saved = loadFormFromStorage();
    return saved ?? starter;
  });

  const [format, setFormat] = useState<ExportFormat>("json-schema");

  /**
   * Generate the selected export output.
   * useMemo prevents re-generating large strings on every render.
   */
  const output = useMemo(() => {
    switch (format) {
      case "form-json":
        return JSON.stringify(form, null, 2);

      case "json-schema":
        return JSON.stringify(generateJsonSchema(form), null, 2);

      case "react-ts":
        return generateReactTsComponent(form);

      case "html-css":
        return `<!-- index.html -->\n${generateHtml(
          form
        )}\n\n/* styles.css */\n${generateCss()}`;

      default:
        return "";
    }
  }, [form, format]);

  const filename = useMemo(() => {
    const safeBase =
      (form.id || form.title || "form")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "form";

    if (format === "react-ts") return `${safeBase}.tsx`;
    if (format === "json-schema") return `${safeBase}.schema.json`;
    if (format === "html-css") return `${safeBase}.html`;
    return `${safeBase}.json`;
  }, [form.id, form.title, format]);

  /**
   * Copy output to clipboard.
   * Uses Clipboard API when available.
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
       
      alert("Copied to clipboard.");
    } catch {
       
      alert("Copy failed. Please select and copy manually.");
    }
  };

  /**
   * Download output as a file.
   */
  const downloadFile = () => {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Export"
      description="Copy or download generated outputs for developer workflows."
      actions={
        <>
          <Link href="/preview" className="ffd-btn-ghost">
            Preview
          </Link>
          <Link href="/studio" className="ffd-btn">
            Back to Studio
          </Link>
        </>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="ffd-card p-5">
          <h2 className="ffd-heading text-base font-semibold">Formats</h2>
          <p className="mt-1 text-sm ffd-muted">
            Choose an export target. Output updates instantly.
          </p>

          <div className="mt-4 grid gap-2">
            <FormatButton
              active={format === "json-schema"}
              label={FORMAT_LABEL["json-schema"]}
              onClick={() => setFormat("json-schema")}
            />
            <FormatButton
              active={format === "form-json"}
              label={FORMAT_LABEL["form-json"]}
              onClick={() => setFormat("form-json")}
            />
            <FormatButton
              active={format === "react-ts"}
              label={FORMAT_LABEL["react-ts"]}
              onClick={() => setFormat("react-ts")}
            />
            <FormatButton
              active={format === "html-css"}
              label={FORMAT_LABEL["html-css"]}
              onClick={() => setFormat("html-css")}
            />
          </div>

          <div className="mt-6 rounded-lg border border-(--border) bg-(--surface-2) p-3">
            <p className="text-xs ffd-muted">
              <span className="font-semibold">Tip:</span> JSON Schema is ideal
              for backend validation and API contracts. React+TS is a quick
              drop-in UI starting point. Embedded HTML is useful for code blocks
              and no-framework embeds.
            </p>
          </div>
        </aside>

        <div className="ffd-card flex min-h-[calc(100vh-220px)] min-w-0 flex-col p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="ffd-heading text-base font-semibold">
                {FORMAT_LABEL[format]}
              </h2>
              <p className="mt-1 text-sm ffd-muted">{filename}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyToClipboard}
                className="ffd-btn-ghost"
              >
                Copy
              </button>
              <button type="button" onClick={downloadFile} className="ffd-btn">
                Download
              </button>
            </div>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-lg border border-(--border) bg-(--surface)">
            <pre className="h-full overflow-auto whitespace-pre p-4 text-sm leading-6">
              <code className="whitespace-pre">{output}</code>
            </pre>
          </div>
        </div>
      </section>
    </AppShell>
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
      className={`ffd-btn-ghost w-full justify-start ${
        active ? "ring-2 ring-(--ring)" : ""
      }`}
    >
      {label}
    </button>
  );
}