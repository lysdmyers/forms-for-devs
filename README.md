# Forms For Devs

Forms For Devs is a schema-driven form builder and live preview application built with Next.js and TypeScript.

The application allows developers to define forms using structured JSON, edit them through a builder interface, and preview validation behavior in real time.

---

## Overview

Instead of hardcoding form structures, this project uses a schema-based approach where form behavior is driven by configuration.

The application separates:

- Form definition (JSON schema)
- Builder interface (editing the schema)
- Preview renderer (dynamic UI output)
- Validation rules (configuration-based)

This mirrors how internal tools and enterprise systems manage dynamic forms.

---

## Features

- Visual form builder
- Live preview rendering
- Field-level validation rules
- Type-safe form definitions
- Local storage persistence
- Starter contact form template

---

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Browser Local Storage

---

## Project Structure

src/
  app/
    builder/      Form editing interface
    preview/      Live form rendering
  components/     Reusable UI and renderer components
  lib/            Types and utilities
  templates/      JSON form templates

---

## Getting Started

Install dependencies:

npm install

Run locally:

npm run dev

Open in your browser:

http://localhost:3000

---

## Example Workflow

1. Navigate to the Builder page.
2. Add or edit form fields.
3. Configure validation rules.
4. Switch to Preview.
5. Test validation behavior live.

Changes persist locally in browser storage.

---

## Future Improvements

- Export form definitions as JSON
- Import external JSON schemas
- Conditional field logic
- Backend persistence
- Public demo deployment

---

## License

MIT