Root Properties
id: Unique identifier for this form template.
title: Display name shown in the UI.
description: Explains the purpose of the form.
version: Schema version number.
fields: Array of dynamic field definitions.
createdAtISO / updatedAtISO: ISO timestamps for auditing.
Field Structure
Each field contains:
id: Unique field ID.
name: Submission key used in form data.
label: Visible label shown to the user.
type: Input type (text, email, textarea, etc.).
required: Boolean indicating validation requirement.
placeholder: Optional hint text.
rules: Optional validation constraints (minLength, maxLength).