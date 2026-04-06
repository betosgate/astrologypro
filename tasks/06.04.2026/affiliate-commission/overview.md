# Diviner Affiliate Commission Management — Task Overview

**Source doc:** `Diviner Affiliate Commission Requirements.docx`
**Scope:** Full affiliate management + commission tracking + payout system for Diviners

---

## Summary

A financially-sensitive, production-grade module with 3 roles:
- **Admin** — full control, override, audit, disputes
- **Diviner** — manages own affiliate network, records payouts
- **Affiliate** — views own dashboard, links, commissions, payouts

---

## Core Submodules (20 sections)

| # | Submodule | Priority |
|---|---|---|
| 6.1 | Diviner Management | MVP |
| 6.2 | Affiliate Onboarding + Assignment | MVP |
| 6.3 | Commission Configuration (% / fixed / product / tier) | MVP |
| 6.4 | Product-Targeted Unique Referral Links | MVP |
| 6.5 | Referral Click + Conversion Tracking | MVP |
| 6.6 | Order and Sale Attribution Engine | MVP |
| 6.7 | Commission Ledger (finance-style, not summary) | MVP |
| 6.8 | Payout Tracking (external, diviner records) | MVP |
| 6.9 | Adjustments, Holds, Disputes | Phase 2 |
| 6.10 | Notifications and Reminders | MVP |
| 6.11 | Dashboards (Admin / Diviner / Affiliate) | MVP |
| 6.12 | Search, Filter, Sort, Export | Phase 2 |
| 6.13 | Audit Log (mandatory — financial system) | MVP |

---

## Key DB Tables (from doc section 10)

```
users, roles, diviner_profiles, affiliate_profiles,
diviner_affiliate_relationships, products, campaigns,
affiliate_links, affiliate_clicks, orders, order_line_items,
affiliate_attributions, commission_rules, commission_ledger_entries,
payout_records, payout_allocations, commission_adjustments,
disputes, notifications, audit_logs
```

---

## Commission Status Flow
`pending → approved → payable → paid`
(also: `rejected`, `reversed`, `adjusted`, `on_hold`)

## Payout Status Flow
`draft → recorded → verified` (also: `failed`, `reversed`, `cancelled`)

---

## MVP Scope (Phase 1)
- Admin + Diviner + Affiliate roles
- Affiliate creation by diviner/admin + assignment
- Basic commission rules (% and fixed)
- Product-specific referral links
- Order attribution
- Commission ledger
- Payout recording
- Basic dashboards
- Audit logs

---

## Architecture Notes (Next.js / Supabase)
- Commission logic in dedicated backend service (not UI)
- PostgreSQL — strong relational integrity required
- Treat commission entries as immutable ledger rows
- Never overwrite historical entries silently
- Full audit trail on every money-impacting action
- Separate: attribution service | commission service | payout allocation service

---

## Recommended Deliverable Order
1. DB schema design
2. API contract per module
3. Screen-by-screen UI requirement
4. RBAC matrix
5. Commission calculation spec with examples
6. Payout accounting flow with edge cases
