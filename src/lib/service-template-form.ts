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

export function normalizeServiceTemplateIntakeState(
  value: unknown,
): ServiceTemplateIntakeState | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Partial<ServiceTemplateIntakeState>;

  function normalizeBirth(birth: unknown): ServiceTemplateBirthInput {
    const next = birth as Partial<ServiceTemplateBirthInput> | null | undefined;
    const city =
      next?.city &&
      typeof next.city === "object" &&
      typeof next.city.label === "string" &&
      typeof next.city.lat === "number" &&
      typeof next.city.lng === "number" &&
      next.city.timezone &&
      typeof next.city.timezone === "object"
        ? {
            label: next.city.label,
            lat: next.city.lat,
            lng: next.city.lng,
            timezone: {
              name:
                typeof next.city.timezone.name === "string" ? next.city.timezone.name : "",
              offset_string:
                typeof next.city.timezone.offset_string === "string"
                  ? next.city.timezone.offset_string
                  : "+00:00",
              utcOffset:
                typeof next.city.timezone.utcOffset === "string"
                  ? next.city.timezone.utcOffset
                  : "+00:00",
            },
          }
        : null;

    return {
      dob: typeof next?.dob === "string" ? next.dob : "",
      tob: typeof next?.tob === "string" ? next.tob : "",
      city,
    };
  }

  return {
    person1: normalizeBirth(input.person1),
    person2: normalizeBirth(input.person2),
    areaOfInquiry: typeof input.areaOfInquiry === "string" ? input.areaOfInquiry : "",
    question: typeof input.question === "string" ? input.question : "",
    futureWeek: typeof input.futureWeek === "string" ? input.futureWeek : "",
    futureMonth: typeof input.futureMonth === "string" ? input.futureMonth : "",
  };
}

export function validateServiceTemplateIntakeState(
  config: ServiceTemplateFormConfig,
  state: ServiceTemplateIntakeState,
) {
  if (!state.person1.dob || !state.person1.tob || !state.person1.city) {
    return "Please complete the primary birth details.";
  }

  if (
    config.mode === "couple" &&
    (!state.person2.dob || !state.person2.tob || !state.person2.city)
  ) {
    return "Please complete the second person's birth details.";
  }

  if (config.fields.question && !state.question.trim()) {
    return "Please add the core question for this reading.";
  }

  return null;
}
