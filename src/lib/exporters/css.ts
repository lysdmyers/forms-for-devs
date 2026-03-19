export function generateCss(): string {
  return `.ffd-form {
  max-width: 640px;
  margin: 0 auto;
  display: grid;
  gap: 1rem;
  font-family: Arial, sans-serif;
}

.ffd-title {
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.2;
}

.ffd-description {
  margin: -0.25rem 0 0;
  color: #4b5563;
  font-size: 0.95rem;
  line-height: 1.5;
}

.ffd-field {
  display: grid;
  gap: 0.45rem;
  margin: 0;
  border: 0;
  padding: 0;
}

.ffd-label {
  font-size: 0.95rem;
  font-weight: 600;
}

.ffd-input {
  width: 100%;
  padding: 0.75rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font: inherit;
  box-sizing: border-box;
  background: #ffffff;
  color: #111827;
}

textarea.ffd-input {
  min-height: 120px;
  resize: vertical;
}

.ffd-choice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.ffd-button {
  appearance: none;
  border: 0;
  border-radius: 0.5rem;
  padding: 0.85rem 1rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  background: #111827;
  color: #ffffff;
}`;
}