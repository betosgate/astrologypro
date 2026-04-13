import type { IntakeField, IntakeTemplate } from "@/lib/intake-fields";
import { getServiceQuestions, isRelationshipService } from "@/lib/intake-questions";

export type PurchaseFieldKey =
  | "full_name"
  | "email"
  | "phone"
  | "birth_details"
  | "partner_birth_details"
  | "focus_question"
  | "additional_notes";

export interface ServicePurchaseShape {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  category?: string | null;
  requires_birth_data?: boolean | null;
  intake_template_id?: string | null;
  product_kind?: string | null;
  is_subscription?: boolean | null;
  requires_birth_time?: boolean | null;
  requires_birth_city?: boolean | null;
  requires_partner_data?: boolean | null;
  pre_checkout_fields?: unknown;
  post_checkout_fields?: unknown;
}

export interface ServicePurchaseConfig {
  productKind: string;
  isSubscription: boolean;
  preCheckoutFields: PurchaseFieldKey[];
  postCheckoutFields: PurchaseFieldKey[];
  requiresBirthTime: boolean;
  requiresBirthCity: boolean;
  requiresPartnerData: boolean;
  requiresPostPaymentIntake: boolean;
}

function readFieldList(value: unknown): PurchaseFieldKey[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is PurchaseFieldKey => {
    return typeof item === "string";
  });
}

function dedupeFields(fields: PurchaseFieldKey[]): PurchaseFieldKey[] {
  return Array.from(new Set(fields));
}

export function getServicePurchaseConfig(
  service: ServicePurchaseShape | null | undefined
): ServicePurchaseConfig {
  const slug = service?.slug ?? "";
  const category = service?.category ?? "";
  const name = service?.name ?? "";

  const explicitPreCheckout = readFieldList(service?.pre_checkout_fields);
  const explicitPostCheckout = readFieldList(service?.post_checkout_fields);

  const relationshipService =
    Boolean(service?.requires_partner_data) ||
    isRelationshipService(slug, category);
  const tarotLike = /tarot|oracle|card|spread/i.test(`${slug} ${category} ${name}`);
  const serviceHasCustomQuestions = getServiceQuestions(slug).length > 0;

  const requiresBirthTime =
    service?.requires_birth_time ?? service?.requires_birth_data ?? false;
  const requiresBirthCity =
    service?.requires_birth_city ?? service?.requires_birth_data ?? false;

  const derivedPostCheckout: PurchaseFieldKey[] = [];

  if (service?.requires_birth_data || requiresBirthTime || requiresBirthCity) {
    derivedPostCheckout.push("birth_details");
  }

  if (relationshipService) {
    derivedPostCheckout.push("partner_birth_details");
  }

  if (tarotLike || serviceHasCustomQuestions || !service?.requires_birth_data) {
    derivedPostCheckout.push("focus_question");
  }

  if (derivedPostCheckout.length > 0) {
    derivedPostCheckout.push("additional_notes");
  }

  const postCheckoutFields = dedupeFields(
    explicitPostCheckout.length > 0 ? explicitPostCheckout : derivedPostCheckout
  );
  const preCheckoutFields = dedupeFields(
    explicitPreCheckout.length > 0
      ? explicitPreCheckout
      : ["full_name", "email", "phone"]
  );

  return {
    productKind: service?.product_kind ?? "session",
    isSubscription: service?.is_subscription ?? false,
    preCheckoutFields,
    postCheckoutFields,
    requiresBirthTime,
    requiresBirthCity,
    requiresPartnerData: relationshipService,
    requiresPostPaymentIntake:
      Boolean(service?.intake_template_id) || postCheckoutFields.length > 0,
  };
}

function buildField(
  id: string,
  type: IntakeField["type"],
  label: string,
  required: boolean,
  sortOrder: number,
  extra?: Partial<IntakeField>
): IntakeField {
  return {
    id,
    type,
    label,
    required,
    sort_order: sortOrder,
    ...extra,
  };
}

export function buildFallbackIntakeTemplate(
  service: ServicePurchaseShape | null | undefined
): IntakeTemplate | null {
  if (!service) return null;

  const config = getServicePurchaseConfig(service);
  if (!config.requiresPostPaymentIntake) return null;

  const slug = service.slug ?? "service";
  const fields: IntakeField[] = [];
  let sortOrder = 0;

  for (const field of config.postCheckoutFields) {
    switch (field) {
      case "birth_details":
        fields.push(
          buildField(
            `${slug}-birth-details`,
            "birth_details",
            "Birth Details",
            true,
            sortOrder++,
            {
              help_text:
                "We’ll use this for the chart or time-based reading after your purchase.",
            }
          )
        );
        break;
      case "partner_birth_details":
        fields.push(
          buildField(
            `${slug}-partner-birth-details`,
            "partner_birth_details",
            "Partner's Birth Details",
            true,
            sortOrder++,
            {
              help_text:
                "Required for compatibility, relationship, or synastry-style readings.",
            }
          )
        );
        break;
      case "focus_question":
        fields.push(
          buildField(
            `${slug}-focus-question`,
            "textarea",
            /tarot|oracle|card|spread/i.test(
              `${service.slug ?? ""} ${service.category ?? ""} ${service.name ?? ""}`
            )
              ? "Your Question"
              : "What would you like to focus on?",
            true,
            sortOrder++,
            {
              placeholder:
                "Share the question, theme, or area you want this reading to focus on.",
            }
          )
        );
        break;
      case "additional_notes":
        fields.push(
          buildField(
            `${slug}-additional-notes`,
            "textarea",
            "Additional Notes",
            false,
            sortOrder++,
            {
              placeholder:
                "Anything else that would help your diviner prepare for this session.",
            }
          )
        );
        break;
      default:
        break;
    }
  }

  return {
    id: `fallback-${slug}`,
    diviner_id: "",
    name: `${service.name ?? "Reading"} Intake`,
    description:
      "Complete these details after payment so your diviner has the right context before the reading.",
    is_default: false,
    fields,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  };
}
