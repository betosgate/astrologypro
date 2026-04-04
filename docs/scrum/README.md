# Divine Infinite Being — Scrum Documentation Index

> **Project:** `betoparedes-v3-angular` (Sales & Backoffice Angular App)
> **Last audited:** 2026-04-03
> **Source meeting:** `docs/meetings/2026-04-03_meeting_notes.md`
> **Scrum Master:** AI-assisted (Debasis)

---

## Documents in this folder

| File | Description |
|---|---|
| `01_app_audit.md` | Full technical audit — what exists in the Angular app today |
| `02_role_feature_map.md` | Every role's current features and what's missing |
| `03_module_inventory.md` | Module-by-module component and API inventory |
| `04_product_backlog.md` | Full Scrum product backlog (Epics → User Stories → Tasks) |
| `05_sprint_plan.md` | Suggested sprint breakdown (Sprints 1–8) |

---

## Platform Ecosystem Overview

The Divine Infinite Being platform consists of **two codebases** that work together:

| Codebase | Technology | Purpose |
|---|---|---|
| `betoparedes-v3-angular` | Angular 16 | Sales backoffice for Reps & Admins |
| `AstrologyPro` (Next.js) | Next.js 14 / Supabase | Public-facing diviner platform & portals |

These need to be treated as **one product** from a scrum perspective — features that touch the business (certification, community, mystery school) require work in both.

---

## Roles in the Platform

| Role | Portal | Codebase |
|---|---|---|
| Admin | `/admin-dashboard` | Angular |
| Sales Rep | `/rep-dashboard` | Angular |
| Diviner | `/dashboard` | Next.js |
| Client | `/portal` | Next.js |
| Trainee | `/trainee` | Next.js |
| Social Advocate | `/advocate` | Next.js |
| Community Member | `/community` | Next.js |
| Mystery School Student | `/community` (inner) | Next.js (to build) |

---

## Epics Summary

| # | Epic | Codebase | Priority |
|---|---|---|---|
| E1 | Authentication & Role Management | Angular + Next.js | High |
| E2 | Lead Management Enhancements | Angular | High |
| E3 | Training / Certification School | Angular + Next.js | High |
| E4 | Community Membership Portal | Next.js | High |
| E5 | Mystery School (Perennial Mandalism) | Next.js | Medium |
| E6 | Calendar & Booking System | Angular + Next.js | High |
| E7 | Contract & Payment Management | Angular | Medium |
| E8 | Reporting & Analytics | Angular | Medium |
| E9 | Marketing & Content Tools | Angular + Next.js | Medium |
| E10 | Platform Ops (DevOps, Security, Config) | Both | Ongoing |
