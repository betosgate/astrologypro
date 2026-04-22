import { ASTROLOGY_TAB_MAP } from "@/lib/service-toolkit-mapping";

export interface ServiceTemplateCityOption {
  label: string;
  lat: number;
  lng: number;
  timezone: {
    name: string;
    offset_string: string;
    utcOffset: string;
  };
}

export interface ServiceTemplateBirthInput {
  dob: string;
  tob: string;
  city: ServiceTemplateCityOption | null;
}

export interface ServiceTemplateIntakeState {
  person1: ServiceTemplateBirthInput;
  person2: ServiceTemplateBirthInput;
  areaOfInquiry: string;
  question: string;
  futureWeek: string;
  futureMonth: string;
}

export type ServiceTemplateFormMode = "single" | "couple";

export interface ServiceTemplateFormConfig {
  version: 1;
  kind: "astrology_intake";
  mode: ServiceTemplateFormMode;
  fields: {
    areaOfInquiry: boolean;
    question: boolean;
    futureWeek: boolean;
    futureMonth: boolean;
  };
}

export const DEFAULT_BIRTH_INPUT: ServiceTemplateBirthInput = {
  dob: "",
  tob: "",
  city: null,
};

export function createEmptyIntakeState(): ServiceTemplateIntakeState {
  return {
    person1: { ...DEFAULT_BIRTH_INPUT },
    person2: { ...DEFAULT_BIRTH_INPUT },
    areaOfInquiry: "",
    question: "",
    futureWeek: "",
    futureMonth: "",
  };
}

function createAstrologyConfig(
  mode: ServiceTemplateFormMode,
  fields: Partial<ServiceTemplateFormConfig["fields"]> = {},
): ServiceTemplateFormConfig {
  return {
    version: 1,
    kind: "astrology_intake",
    mode,
    fields: {
      areaOfInquiry: false,
      question: false,
      futureWeek: false,
      futureMonth: false,
      ...fields,
    },
  };
}

const ASTROLOGY_FORM_PRESETS: Record<string, ServiceTemplateFormConfig> = {
  "nativity-birth-chart": createAstrologyConfig("single", { areaOfInquiry: true }),
  "solar-return": createAstrologyConfig("single", { areaOfInquiry: true }),
  "weekly-transits": createAstrologyConfig("single", {
    areaOfInquiry: true,
    futureWeek: true,
  }),
  "monthly-transits-lunar-return": createAstrologyConfig("single", {
    areaOfInquiry: true,
    futureMonth: true,
  }),
  "romantic-relationships": createAstrologyConfig("couple", { areaOfInquiry: true }),
  "friendship-relationships": createAstrologyConfig("couple", { areaOfInquiry: true }),
  "business-relationship": createAstrologyConfig("couple", { areaOfInquiry: true }),
  "predictive-event-horary": createAstrologyConfig("single", { question: true }),
  "jupiter-return": createAstrologyConfig("single", { areaOfInquiry: true }),
  "saturn-return": createAstrologyConfig("single", { areaOfInquiry: true }),
  "mars-return": createAstrologyConfig("single", { areaOfInquiry: true }),
  "uranus-opposition": createAstrologyConfig("single", { areaOfInquiry: true }),
};

export function getBaseServiceTemplateSlug(slug: string) {
  return slug.startsWith("general-") ? slug.slice("general-".length) : slug;
}

export function getAstrologyTemplateFormPreset(slug: string) {
  const baseSlug = getBaseServiceTemplateSlug(slug.trim());
  const preset = ASTROLOGY_FORM_PRESETS[baseSlug];
  return preset ? structuredClone(preset) : null;
}

export function normalizeServiceTemplateFormConfig(
  value: unknown,
): ServiceTemplateFormConfig | null {
  if (!value || typeof value !== "object") return null;
  const config = value as Partial<ServiceTemplateFormConfig>;

  if (config.version !== 1 || config.kind !== "astrology_intake") return null;
  if (config.mode !== "single" && config.mode !== "couple") return null;
  if (!config.fields || typeof config.fields !== "object") return null;

  const fields = config.fields as Partial<ServiceTemplateFormConfig["fields"]>;

  return {
    version: 1,
    kind: "astrology_intake",
    mode: config.mode,
    fields: {
      areaOfInquiry: fields.areaOfInquiry === true,
      question: fields.question === true,
      futureWeek: fields.futureWeek === true,
      futureMonth: fields.futureMonth === true,
    },
  };
}

export function resolveServiceTemplateFormConfig(input: {
  category: string | null | undefined;
  slug: string | null | undefined;
  form_config: unknown;
}) {
  const explicit = normalizeServiceTemplateFormConfig(input.form_config);
  if (explicit) return explicit;
  if (input.category !== "astrology" || !input.slug) return null;
  return getAstrologyTemplateFormPreset(input.slug);
}

export function hasRenderableServiceTemplateForm(input: {
  form_enabled?: boolean | null;
  category: string | null | undefined;
  slug: string | null | undefined;
  form_config: unknown;
}) {
  if (input.form_enabled === false) return false;
  return !!resolveServiceTemplateFormConfig(input);
}

export function getServiceTemplateToolkitTabSlug(slug: string) {
  return ASTROLOGY_TAB_MAP[getBaseServiceTemplateSlug(slug)] ?? null;
}
