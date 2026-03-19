import type { FormDefinition } from "@/lib/form-types";

type ExportableOption = {
  label: string;
  value: string;
};

type ExportableField = {
  id: string;
  name?: string;
  type: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: ExportableOption[];
  rules?: {
    options?: ExportableOption[];
  };
};

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getFieldName(field: ExportableField): string {
  return field.name?.trim() || field.id;
}

function getFieldOptions(field: ExportableField): ExportableOption[] {
  if (Array.isArray(field.options)) return field.options;
  if (Array.isArray(field.rules?.options)) return field.rules.options;
  return [];
}

function renderInput(field: ExportableField): string {
  const id = escapeHtml(field.id);
  const name = escapeHtml(getFieldName(field));
  const label = escapeHtml(field.label || "Untitled Field");
  const placeholder = field.placeholder
    ? ` placeholder="${escapeHtml(field.placeholder)}"`
    : "";
  const required = field.required ? " required" : "";
  const options = getFieldOptions(field);

  if (field.type === "textarea") {
    return `<div class="ffd-field">
  <label for="${id}" class="ffd-label">${label}</label>
  <textarea id="${id}" name="${name}" class="ffd-input"${placeholder}${required}></textarea>
</div>`;
  }

  if (field.type === "select") {
    const optionMarkup = options
      .map(
        (option) =>
          `    <option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`
      )
      .join("\n");

    const promptOption = field.placeholder
      ? `    <option value="">${escapeHtml(field.placeholder)}</option>\n`
      : "";

    return `<div class="ffd-field">
  <label for="${id}" class="ffd-label">${label}</label>
  <select id="${id}" name="${name}" class="ffd-input"${required}>
${promptOption}${optionMarkup}
  </select>
</div>`;
  }

  if (field.type === "radio") {
    const optionMarkup = options
      .map((option, index) => {
        const optionId = `${id}-${index}`;
        return `  <label for="${optionId}" class="ffd-choice">
    <input type="radio" id="${optionId}" name="${name}" value="${escapeHtml(option.value)}"${required} />
    <span>${escapeHtml(option.label)}</span>
  </label>`;
      })
      .join("\n");

    return `<fieldset class="ffd-field">
  <legend class="ffd-label">${label}</legend>
${optionMarkup}
</fieldset>`;
  }

  if (field.type === "checkbox" && options.length > 0) {
    const optionMarkup = options
      .map((option, index) => {
        const optionId = `${id}-${index}`;
        return `  <label for="${optionId}" class="ffd-choice">
    <input type="checkbox" id="${optionId}" name="${name}" value="${escapeHtml(option.value)}" />
    <span>${escapeHtml(option.label)}</span>
  </label>`;
      })
      .join("\n");

    return `<fieldset class="ffd-field">
  <legend class="ffd-label">${label}</legend>
${optionMarkup}
</fieldset>`;
  }

  if (field.type === "checkbox") {
    return `<div class="ffd-field">
  <label for="${id}" class="ffd-choice">
    <input type="checkbox" id="${id}" name="${name}"${required} />
    <span>${label}</span>
  </label>
</div>`;
  }

  const inputType = escapeHtml(field.type || "text");

  return `<div class="ffd-field">
  <label for="${id}" class="ffd-label">${label}</label>
  <input type="${inputType}" id="${id}" name="${name}" class="ffd-input"${placeholder}${required} />
</div>`;
}

export function generateHtml(form: FormDefinition): string {
  const fields = (form.fields as ExportableField[]).map(renderInput).join("\n\n");
  const title = form.title?.trim()
    ? `  <h2 class="ffd-title">${escapeHtml(form.title)}</h2>\n`
    : "";
  const description = form.description?.trim()
    ? `  <p class="ffd-description">${escapeHtml(form.description)}</p>\n`
    : "";

  return `<form class="ffd-form">
${title}${description}${fields}
  <button type="submit" class="ffd-button">Submit</button>
</form>`;
}