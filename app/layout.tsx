import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * Font configuration (Next.js Font Optimization)
 *
 * We use the built-in next/font system to:
 * - Automatically self-host fonts
 * - Avoid layout shift (CLS)
 * - Improve performance over manual <link> tags
 *
 * Fonts are exposed as CSS variables for easy theming.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Global metadata configuration (App Router)
 *
 * - `default`: base title
 * - `template`: enables per-page title overrides
 * - `metadataBase`: required for proper OpenGraph + canonical URLs
 *
 * In production, metadataBase should match the deployed domain.
 */
export const metadata: Metadata = {
  title: {
    default: "Forms For Devs",
    template: "%s | Forms For Devs",
  },
  description:
    "Build production-ready, accessible form definitions with live preview and schema export.",
  metadataBase: new URL("http://localhost:3000"), // Replace with production URL
};

/**
 * RootLayout
 *
 * This wraps the entire application.
 *
 * Responsibilities:
 * - Apply global fonts
 * - Apply global CSS
 * - Define accessibility landmarks
 * - Provide structural HTML scaffolding
 *
 * In Next.js App Router, this file is required and
 * acts as the persistent shell for all routes.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        /**
         * Font variables applied at root.
         * `antialiased` improves text rendering clarity.
         */
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 
          Accessibility: Skip Link

          - Visible only when tabbing via keyboard
          - Allows screen reader and keyboard users
            to jump directly to main content
          - Important for WCAG compliance
        */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-(--card) focus:px-4 focus:py-2 focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>

        {/* 
          Main landmark region
          - Required for accessibility
          - Targeted by the skip link
        */}
        <main id="main">
          {children}
        </main>
      </body>
    </html>
  );
}
