import spec from "../openapi.json";

export const dynamic = "force-dynamic";

/**
 * GET /api/docs
 *
 * Serves the OpenAPI 3.1 specification as JSON.
 * Used by the admin Swagger UI page at /admin/api-docs.
 * No authentication required — the spec itself contains no sensitive data.
 */
export async function GET() {
  return Response.json(spec);
}
