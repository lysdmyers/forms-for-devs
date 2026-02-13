import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * Font configuration (Next.js Font Optimization)
 *
 * Uses next/font to:
 * - Self-host fonts automatically
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
 * - `metadataBase`: used for OpenGraph + canonical URLs
 *
 * NOTE:
 * In production, set metadataBase to your deployed domain.
 */
export const metadata: Metadata = {
  title: {
    default: "Forms For Devs",
    template: "%s | Forms For Devs",
  },
  description:
    "Build production-ready, accessible form definitions with live preview and schema export.",
  metadataBase: new URL("http://localhost:3000"),
};

/**
 * RootLayout
 *
 * Persistent app shell for all routes.
 *
 * Responsibilities:
 * - Apply global fonts + CSS
 * - Provide accessibility landmarks (skip link, main region)
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
         * Apply font variables at root.
         * `antialiased` improves text rendering clarity.
         */
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
