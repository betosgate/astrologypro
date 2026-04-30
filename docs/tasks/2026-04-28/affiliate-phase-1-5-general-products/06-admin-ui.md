# Task 06 — Admin UI for Template Rate Config

- Status: Code complete 2026-04-30 in working tree (uncommitted). Six file changes: PATCH endpoint at `src/app/api/admin/service-templates/[id]/route.ts` validates the new affiliate fields (rejects on diviner-specific templates with `field_not_applicable`; enforces percent ≤ 100 + flat ≤ 100000); list endpoint extended to return the new columns; new `AffiliateProgramCard` client component on `/admin/service-templates/[id]/page.tsx` (general templates only); new bulk endpoint at `src/app/api/admin/service-templates/bulk-set-commission/route.ts` (writes admin_action_log row with action_kind `service_templates_bulk_commission_update`); new `BulkRateCard` at `/admin/service-templates/page.tsx` with a confirmation modal flagging the override-overwrite behavior; list table gains "Affiliate program" + "Rate" columns. Required folding three more changes into the Phase 1.5 migration (still unapplied): drop NOT NULL on `admin_action_log.target_resource_id`, add `payload JSONB`, extend `action_kind` CHECK with the new value.
- Priority: P1
- Depends on: 01
- Blocks: 08
- Spec: §10 Phase 1.5 — Admin UI

## Goal

Give admin a place to flip `affiliate_program_enabled` and set
`commission_type` + `commission_value` on general
`service_templates` rows. Without this UI, the admin has to use SQL or
the migration runner to seed initial values, which is friction we don't
want.

## A. `/admin/service-templates/[id]` — gain commission fields

In the existing edit form, add a new "Affiliate program" section that
renders ONLY when `template.is_general = true`:

```tsx
{template.is_general && (
  <Card>
    <CardHeader>
      <CardTitle>Affiliate program</CardTitle>
      <CardDescription>
        Active affiliates can earn commission when they refer a booking
        for this general product. Disable to stop accepting affiliate
        clicks.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch
          id="affiliate-enabled"
          checked={programEnabled}
          onCheckedChange={setProgramEnabled}
        />
        <Label htmlFor="affiliate-enabled">
          Accept affiliate referrals for this template
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="commission-type">Commission type</Label>
          <Select value={commissionType} onValueChange={setCommissionType}
                  disabled={!programEnabled}>
            <SelectTrigger id="commission-type">
              <SelectValue placeholder="Default (percentage)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="flat">Flat (cents)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="commission-value">
            {commissionType === 'flat' ? 'Cents' : 'Percent (%)'}
          </Label>
          <Input
            id="commission-value"
            type="number"
            min="0"
            value={commissionValue}
            onChange={(e) => setCommissionValue(e.target.value)}
            disabled={!programEnabled}
            placeholder="Leave blank for default 10%"
          />
        </div>
      </div>

      {programEnabled && !commissionValue && (
        <p className="text-xs text-muted-foreground">
          With no rate set, affiliates earn the system default of 10%.
        </p>
      )}
    </CardContent>
  </Card>
)}
```

PATCH body sent on save spreads the three fields when changed:
```ts
{
  affiliate_program_enabled: boolean,
  commission_type?: 'percentage' | 'flat' | null,  // null clears
  commission_value?: number | null,
}
```

**Validation rules** the PATCH endpoint at
`src/app/api/admin/service-templates/[id]/route.ts` must enforce
(admin-only, service-role):

| Rule | Response on violation |
|---|---|
| `commission_type IS NULL OR commission_type IN ('percentage','flat')` | 422 `validation_error` |
| `commission_value IS NULL OR commission_value >= 0` | 422 `validation_error` |
| `commission_type='percentage' AND commission_value > 100` | 422 `percent_over_100` |
| `commission_type='flat' AND commission_value > 100000` (sanity cap = $1000 in cents — adjust if business rules differ) | 422 `flat_over_cap` |
| `affiliate_program_enabled=true AND commission_value IS NULL` | **Allowed** — system applies the 10% default at stamp time per spec §10 decision #3. |
| `affiliate_program_enabled=true AND commission_type IS NULL` | **Allowed** — system defaults to `'percentage'` at stamp time. |
| `affiliate_program_enabled=false` plus any combination of type/value | **Allowed** — admin can pre-stage a rate before flipping the toggle. |

Only general templates (`is_general=true`) accept these fields. PATCH
on a diviner-specific template with these fields → 422
`field_not_applicable`.

## B. Bulk-edit helper at `/admin/service-templates`

Above the templates list, a small "Set rate for all enabled general
templates" form:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Bulk rate update</CardTitle>
    <CardDescription>
      Apply one commission rate to all enabled general templates. Useful
      when launching the program or running a platform-wide promo.
    </CardDescription>
  </CardHeader>
  <CardContent className="flex flex-wrap items-end gap-4">
    <div className="space-y-2 w-32">
      <Label>Type</Label>
      <Select value={bulkType} onValueChange={setBulkType}>
        ...
      </Select>
    </div>
    <div className="space-y-2 w-32">
      <Label>Value</Label>
      <Input type="number" value={bulkValue} ... />
    </div>
    <Button onClick={applyBulk}>Apply to all</Button>
  </CardContent>
</Card>
```

Backed by a new endpoint:

```
POST /api/admin/service-templates/bulk-set-commission
body: { commission_type, commission_value }
effect: UPDATE service_templates
        SET commission_type = $1, commission_value = $2
        WHERE is_general = true AND affiliate_program_enabled = true;
returns: { updated_count }
```

**Bulk update is destructive of per-template overrides.** If admin
previously customized one template at 20% and runs a bulk-set to 10%,
that 20% is lost. The confirmation modal must call this out
explicitly:

> *"This will overwrite any per-template commission rates you've
> customized. N templates will be affected. Continue?"*

Confirmation modal before applying. Logs to `admin_action_log` with
action_kind `service_templates_bulk_commission_update` and reason
defaulting to "bulk admin update" (no min-length CHECK like the override
endpoints since this isn't an emergency action).

## What disable does NOT do (and why)

When admin flips `affiliate_program_enabled` from `true` to `false`:
- Existing `affiliate_campaigns` rows pointing at that template are
  **NOT** auto-archived. They keep `status='active'` in the DB.
- BUT the `/r/<code>` handler (Task 03) returns 410 for any of those
  campaigns' share URLs — so the customer-facing impact is immediate.
- Bookings already-stamped via that template **continue to credit at
  the stamped rate** (rate-stamping invariant).
- Bookings made AFTER the disable through any of these campaigns get
  no stamp (Task 02's `program_disabled` reason).

If admin wants to also clean up the campaign rows (e.g. surface fewer
"active" campaigns to the affiliate), they archive them manually via
the existing affiliate-side archive flow — there's no auto-archive
because that would conflate "admin paused the program" with "the
specific campaigns are bad", which are different concepts.

## C. Visibility of program status in the templates list

Add two columns to the existing list table at
`/admin/service-templates`:
- **Affiliate program**: badge — Enabled (green) / Disabled (muted) /
  N/A (only on diviner-specific rows)
- **Rate**: `<value>%` or `<value>¢ flat` or `default (10%)` or `—`

Sortable on these columns is nice-to-have, not required.

## Acceptance

- [ ] Admin can toggle `affiliate_program_enabled` on a general
      template and the change is persisted.
- [ ] Admin can set `commission_type` + `commission_value` for an
      enabled template.
- [ ] Bulk endpoint updates all enabled general templates in one call.
- [ ] Bulk endpoint writes an `admin_action_log` row.
- [ ] Diviner-specific templates don't show the affiliate-program
      section in the edit form (just hidden — no separate route).
- [ ] List view shows program status + rate per template.
- [ ] Disabling a template via this UI immediately makes the
      `/r/<code>` handler return 410 for any affiliate share URL
      pointing at it (verifying integration with Task 03).

## Suggested files

- `src/app/admin/service-templates/[id]/page.tsx` (extended)
- `src/app/admin/service-templates/page.tsx` (list — add columns +
  bulk-edit card)
- `src/app/api/admin/service-templates/[id]/route.ts` (PATCH — accept
  new fields)
- `src/app/api/admin/service-templates/bulk-set-commission/route.ts`
  (new)
