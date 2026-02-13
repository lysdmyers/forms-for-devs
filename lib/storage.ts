import type { FormDefinition } from "./form-types";

/**
 * STORAGE_KEY
 *
 * Namespaced key used to store the active form definition in localStorage.
 *
 * Versioning (`v1`) allows us to:
 * - Change schema shape later
 * - Migrate data safely
 * - Avoid collisions with future storage strategies
 */
const STORAGE_KEY = "forms-for-devs:activeForm:v1";

/**
 * loadFormFromStorage
 *
 * Attempts to load the persisted FormDefinition from localStorage.
 *
 * Returns:
 * - FormDefinition if found and valid JSON
 * - null if:
 *   - running in a non-browser environment (SSR)
 *   - no saved value exists
 *   - JSON parsing fails (corrupt or incompatible data)
 *
 * We intentionally fail gracefully instead of throwing —
 * the Builder will fall back to the starter template.
 */
export function loadFormFromStorage(): FormDefinition | null {
  // Guard against server-side rendering (Next.js)
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as FormDefinition;
  } catch {
    // Corrupt JSON or incompatible version — treat as empty state
    return null;
  }
}

/**
 * saveFormToStorage
 *
 * Persists the current FormDefinition to localStorage.
 *
 * Notes:
 * - No-op during SSR
 * - Overwrites previous saved form
 * - JSON.stringify ensures consistent serialization
 *
 * This is our MVP persistence layer.
 */
export function saveFormToStorage(form: FormDefinition): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
}

/**
 * clearFormStorage
 *
 * Removes the active form from localStorage.
 *
 * Used when:
 * - Resetting to template
 * - Implementing future "New Form" behavior
 */
export function clearFormStorage(): void {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(STORAGE_KEY);
}
