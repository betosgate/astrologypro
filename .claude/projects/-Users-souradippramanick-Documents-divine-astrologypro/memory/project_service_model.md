---
name: Service assignment model
description: Services are admin-managed. Admin assigns services to diviners via diviner_id. Diviners cannot create/edit services. Price comes from pricing assignment, not base_price field.
type: project
---

Services are controlled by admin only — diviners see assigned services read-only.

**Why:** Business model requires admin to control service catalog and pricing. Diviners should not be able to set their own prices or create arbitrary services.

**How to apply:**
- Never add create/edit service UI to the diviner dashboard
- `base_price` on services table is hardcoded to 0 — actual price comes from pricing assignment system
- Admin assigns services at `/admin/service-config` by selecting a diviner from the dropdown
- Diviner's `/dashboard/services` page only shows services where `diviner_id` matches
