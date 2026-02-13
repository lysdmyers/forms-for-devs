// app/page.tsx
"use client";

import Link from "next/link";
import AppShell from "@/components/layout/AppShell";

export default function HomePage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border bg-white p-10 shadow-sm">
          {/* subtle background accents */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gray-100 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gray-100 blur-3xl" />

          <div className="relative">
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              A data-first form builder that stays developer-friendly.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-700">
              Build forms from a structured definition, get consistent validation, and export a clean JSON
              Schema. No guessing. No drifting UI rules. Just a predictable pipeline from definition → UI → schema.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/studio"
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Open Studio
              </Link>
              <Link
                href="/preview"
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Sample Form
              </Link>
            </div>

            {/* Value bullets */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Data-first</p>
                <p className="mt-1 text-sm text-gray-700">
                  A single source of truth for labels, types, rules, and defaults.
                </p>
              </div>
              <div className="rounded-xl border bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Validated UI</p>
                <p className="mt-1 text-sm text-gray-700">
                  Required fields, min/max, patterns, and constraints enforced consistently.
                </p>
              </div>
              <div className="rounded-xl border bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Export-ready</p>
                <p className="mt-1 text-sm text-gray-700">
                  Generate JSON Schema to share with teams, APIs, or other systems.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cards (omit Preview/Export initially) */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Get started</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">
            Start in Studio to build your form definition. You can add Preview and Export into your workflow as
            the project grows — the home page will scale with it.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/* Studio card */}
            <Link
              href="/builder"
              className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-gray-900">Studio</p>
                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    Build a form definition with fields, types, and rules. Your changes persist locally so you
                    can iterate quickly without losing work.
                  </p>
                </div>
                <span className="rounded-full border bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 group-hover:bg-gray-100">
                  Build
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-900">
                Open Studio <span aria-hidden>→</span>
              </div>
            </Link>

            {/* “What it’s for” card */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-base font-semibold text-gray-900">Why this exists</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Forms often break when UI, validation, and schema drift apart. Forms For Devs keeps them aligned
                by treating the form definition as the source of truth — so the UI and schema stay consistent as
                you iterate.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                  Portfolio-ready
                </span>
                <span className="rounded-full border bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                  Local persistence
                </span>
                <span className="rounded-full border bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                  Schema generation
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Future sections (kept subtle) */}
        <section className="mt-10 rounded-2xl border bg-gray-50 p-6">
          <h3 className="text-base font-semibold text-gray-900">Roadmap-friendly</h3>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            As you expand, you can surface Preview and Export here (or keep Home focused). This layout is set up
            so adding more cards later won’t feel crowded.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700">
              Add more field types
            </span>
            <span className="rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700">
              More export formats
            </span>
            <span className="rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700">
              Shareable templates
            </span>
          </div>
        </section>

        {/* Footer note */}
        <p className="mt-10 text-center text-xs text-gray-500">
          Portfolio project — demonstrating dynamic UI generation, schema construction, and local state
          persistence.
        </p>
      </main>
    </AppShell>
  );
}