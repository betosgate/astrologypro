export const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox (yes/no)" },
  { value: "birth_details", label: "Birth Details (date + time + city)" },
  { value: "partner_birth_details", label: "Partner Birth Details" },
] as const;

export type FieldType = (typeof FIELD_TYPES)[number]["value"];

export interface IntakeField {
  id: string; // uuid v4 generated client-side
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select type
  help_text?: string;
  sort_order: number;
}

export interface IntakeTemplate {
  id: string;
  diviner_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  fields: IntakeField[];
  created_at: string;
  updated_at: string;
}

// Preset templates for common reading types
export const PRESET_TEMPLATES: Record<
  string,
  { name: string; fields: Omit<IntakeField, "id">[] }
> = {
  natal_chart: {
    name: "Natal Chart / Birth Chart",
    fields: [
      { type: "birth_details", label: "Birth Details", required: true, sort_order: 0 },
      {
        type: "textarea",
        label: "What would you like to focus on?",
        placeholder: "e.g. career, relationships, life purpose...",
        required: false,
        sort_order: 1,
      },
    ],
  },
  relationship_chart: {
    name: "Relationship / Synastry Chart",
    fields: [
      { type: "birth_details", label: "Your Birth Details", required: true, sort_order: 0 },
      {
        type: "partner_birth_details",
        label: "Partner's Birth Details",
        required: true,
        sort_order: 1,
      },
      {
        type: "textarea",
        label: "Questions or focus areas",
        required: false,
        sort_order: 2,
      },
    ],
  },
  tarot: {
    name: "Tarot Reading",
    fields: [
      {
        type: "textarea",
        label: "Your Question",
        placeholder: "What is your main question or situation?",
        required: true,
        sort_order: 0,
      },
      {
        type: "birth_details",
        label: "Birth Details (optional)",
        required: false,
        sort_order: 1,
      },
    ],
  },
  general: {
    name: "General Reading",
    fields: [
      { type: "birth_details", label: "Birth Details", required: true, sort_order: 0 },
      {
        type: "textarea",
        label: "Your Question or Context",
        required: true,
        sort_order: 1,
      },
      { type: "text", label: "Additional Notes", required: false, sort_order: 2 },
    ],
  },
};

// Default label suggestions per field type
export const FIELD_TYPE_DEFAULT_LABELS: Record<FieldType, string> = {
  text: "Short Answer",
  textarea: "Your Question or Context",
  email: "Email Address",
  date: "Date",
  time: "Time",
  select: "Select an Option",
  checkbox: "Yes / No",
  birth_details: "Birth Details",
  partner_birth_details: "Partner's Birth Details",
};
