import Link from "next/link";
import type { ReactNode } from "react";
import Toaster from "@/components/ui/Toaster";

/**
 * AppShell
 *
 * Shared application chrome for all pages:
 * - Top navigation (consistent across routes)
 * - Optional action slot on the right (page-specific controls like Reset)
 * - Footer
 *
 * Usage:
 * <AppShell title="Studio" description="..." actions={<MyButtons/>}>
 *   ...page content...
 * </AppShell>
 *
 * For Home page:
 * <AppShell>
 *   ...hero content...
 * </AppShell>
 */
export default function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title?: string; // ✅ now optional
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Header / Nav */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Brand */}
            <Link
              href="/"
              className="ffd-heading text-base font-semibold tracking-tight hover:opacity-80 transition"
            >
              Forms For Devs
            </Link>
          </div>

          {/* Right-side action slot (page-specific) */}
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      </header>

      {/* Page Title + Description (only render if provided) */}
      {title ? (
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <h1 className="ffd-heading text-3xl font-semibold tracking-tight">
            {title}
          </h1>

          {description ? (
            <p className="mt-3 max-w-2xl text-base ffd-muted">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Page Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}

        {/* Toaster for global notifications */}
        <Toaster />
      </main>

      {/* Footer */}
      <footer className="mt-10 border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm sm:px-6 lg:px-8">
          <p className="ffd-muted">
            Portfolio project — schema-first form builder + exports.
          </p>
          <p className="ffd-muted">
            © {new Date().getFullYear()} Forms For Devs
          </p>
        </div>
      </footer>
    </div>
  );
}