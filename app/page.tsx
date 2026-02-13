import Link from "next/link";

/**
 * HomePage
 *
 * Landing page for the Forms For Devs application.
 *
 * Purpose:
 * - Introduces the project concept (data-first form builder)
 * - Provides navigation entry points into feature areas
 * - Acts as a lightweight marketing/portfolio overview
 *
 * This page intentionally contains no state or side effects.
 * It is purely presentational and server-renderable.
 */
export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      {/* Intro Section */}
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Forms For Devs</h1>

        {/* High-level product positioning statement */}
        <p className="text-gray-600 max-w-2xl">
          A data-first form builder that generates validated UI and JSON Schema
          from a structured form definition. Build, preview, and export in one place.
        </p>
      </div>

      {/* Primary Navigation Cards */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {/* Studio route — planned unified interface */}
        <Link
          href="/studio/"
          className="rounded-lg border bg-white p-5 transition hover:shadow-sm hover:bg-gray-50"
        >
          <h2 className="font-medium text-gray-800">Studio</h2>
          <p className="mt-2 text-sm text-gray-600">
            (Future) All-in-one interface for building, previewing, and exporting.
          </p>
        </Link>

        {/* Export route — current JSON/schema output interface */}
        <Link
          href="/export/"
          className="rounded-lg border bg-white p-5 transition hover:shadow-sm hover:bg-gray-50"
        >
          <h2 className="font-medium text-gray-800">Export</h2>
          <p className="mt-2 text-sm text-gray-600">
            Copy or download generated JSON Schema.
          </p>
        </Link>
      </div>

      {/* Portfolio Context / Project Framing */}
      <div className="mt-16 border-t pt-6 text-sm text-gray-500">
        <p>
          Portfolio project — demonstrating dynamic UI generation, schema
          construction, and local state persistence.
        </p>
      </div>
    </main>
  );
}
