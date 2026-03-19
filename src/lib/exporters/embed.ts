import type { FormDefinition } from "@/lib/form-types";
import { generateHtml } from "@/lib/exporters/html";
import { generateCss } from "@/lib/exporters/css";

export function generateEmbeddedHtml(form: FormDefinition): string {
  return `${generateHtml(form)}

<style>
${generateCss()}
</style>`;
}