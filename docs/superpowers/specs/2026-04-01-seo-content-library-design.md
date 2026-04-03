# AstrologyPro SEO Content Library — Design Spec

**Date**: 2026-04-01
**Goal**: Build 130+ rich content pages, full SEO infrastructure, redesigned footer with resource library, and mobile optimization to dominate astrology/tarot search for both professional diviners (B2B) and clients seeking readings (B2C).

## Architecture

**Approach**: Data-driven dynamic routes with `generateStaticParams` for static generation at build time. Content defined in TypeScript data files under `src/data/`. Shared SEO components for JSON-LD, breadcrumbs, and meta tags.

### New Route Structure

```
src/app/
├── zodiac/[sign]/page.tsx          # 12 zodiac sign pages
├── tarot/
│   ├── page.tsx                     # Tarot hub/index page
│   ├── [card]/page.tsx              # 78 tarot card meaning pages
│   └── spreads/
│       ├── page.tsx                 # Spreads hub
│       └── [spread]/page.tsx        # 8 spread guide pages
├── learn/
│   ├── page.tsx                     # Learning hub
│   ├── houses/[house]/page.tsx      # 12 house pages
│   ├── planets/[planet]/page.tsx    # 12 planet pages (Sun-Pluto + Chiron + North Node)
│   └── aspects/[aspect]/page.tsx    # 5 aspect pages
├── glossary/page.tsx                # A-Z astrology glossary
├── guides/
│   ├── page.tsx                     # Guides hub
│   ├── saturn-return/page.tsx       # Evergreen guide
│   ├── mercury-retrograde/page.tsx  # Evergreen guide
│   ├── start-astrology-business/page.tsx
│   ├── start-tarot-business/page.tsx
│   ├── pricing-your-readings/page.tsx
│   └── how-astrology-readings-work/page.tsx
├── for-astrologers/page.tsx         # B2B landing page
├── privacy/page.tsx                 # Privacy policy
├── terms/page.tsx                   # Terms of service
├── sitemap.ts                       # Dynamic sitemap
└── robots.ts                        # Robots.txt
```

**Total new pages: ~135**

### Data Files

```
src/data/
├── zodiac-signs.ts        # 12 signs with full content
├── tarot-cards.ts         # 78 cards with meanings
├── tarot-spreads.ts       # 8 spread guides
├── houses.ts              # 12 houses
├── planets.ts             # 12 celestial bodies
├── aspects.ts             # 5 major aspects
└── glossary.ts            # 150+ terms A-Z
```

### Shared SEO Components

```
src/components/seo/
├── json-ld.tsx            # JSON-LD script injector
├── breadcrumbs.tsx        # Visual + schema.org breadcrumbs
├── faq-section.tsx        # FAQ with FAQPage schema
└── cta-banner.tsx         # "Book a Reading" / "Start Your Practice" CTA
```

### Content Page Layout

Every content page follows this structure:
1. Breadcrumbs (visual + JSON-LD BreadcrumbList)
2. Hero/title section with relevant imagery
3. Rich content body (2000-4000 words per page)
4. FAQ section (3-5 questions with FAQPage schema)
5. Related content links (internal linking web)
6. CTA banner (clients → Find a Reader, practitioners → Get Started)

### SEO Infrastructure

**sitemap.ts**: Dynamic sitemap including all static pages + all content pages + all diviner profiles from Supabase.

**robots.ts**: Allow all crawlers, disallow /dashboard/*, /portal/*, /api/*, /auth/*.

**JSON-LD schemas per page type**:
- Zodiac pages: Article + FAQPage + BreadcrumbList
- Tarot cards: Article + FAQPage + BreadcrumbList
- Guides: Article + HowTo + FAQPage + BreadcrumbList
- Diviner profiles: Service + Person + AggregateRating (existing pages, enhanced)
- Homepage: WebSite + Organization
- Glossary: DefinedTermSet + FAQPage

**Meta tags**: Every page gets unique title, description, OG title, OG description, OG image (default branded), canonical URL, Twitter card.

### Footer Redesign

Expand from 4 columns to a mega-footer with resource library:

```
Footer
├── Row 1: 6-column grid
│   ├── Brand + tagline
│   ├── Platform: Features, Pricing, How It Works, For Astrologers, Demo
│   ├── Learn Astrology: Zodiac Signs, Houses, Planets, Aspects, Glossary
│   ├── Tarot Guide: Card Meanings, Spreads, Major Arcana, Minor Arcana
│   ├── Guides: Saturn Return, Mercury Retrograde, Start Your Business, Pricing Guide
│   └── Support: Getting Started, Refund Policy, Privacy, Terms, Contact
├── Row 2: "Explore by Sign" — 12 zodiac links in a horizontal strip
├── Divider
└── Copyright + social links
```

### Mobile Optimization

- All content pages: single-column on mobile, comfortable reading typography
- Footer collapses to accordion on mobile
- Touch-friendly card grids
- Proper viewport, font-size (no zoom-on-input issues)
- Lazy-load images below fold
- Core Web Vitals: target LCP < 2.5s, CLS < 0.1

### Page Content Depth

Each page type has rich, unique content:

**Zodiac signs** (~3000 words each): Overview, element/modality/ruler, personality, strengths/weaknesses, love & compatibility, career, famous people, current transits, FAQ, related signs.

**Tarot cards** (~1500 words each): Upright meaning, reversed meaning, love meaning, career meaning, yes/no, advice, card combinations, FAQ.

**Houses** (~2000 words each): Life areas governed, planets in this house, signs on the cusp, transits, FAQ.

**Planets** (~2500 words each): Symbolism, mythology, sign rulership, retrograde meaning, in each house (brief), current transit, FAQ.

**Aspects** (~2000 words each): What it means, how it manifests, examples with planet pairs, in synastry vs natal, FAQ.

**Glossary**: 150+ terms, each with 2-3 sentence definition, linked to relevant content pages.

### Internal Linking Strategy

Every content page links to related pages:
- Zodiac → ruled planet, compatible signs, element siblings
- Tarot → related cards, spreads that use this card
- Houses → ruling sign, planets commonly found
- Planets → signs ruled, houses associated
- Aspects → example planet pairs
- All pages → glossary terms linked inline
- All pages → CTA to Find a Reader or Get Started

### Existing Page SEO Enhancements

- Add unique metadata to /features, /pricing, /get-started, /login
- Add JSON-LD Organization schema to homepage
- Add JSON-LD Service schema to diviner profile pages
- Add canonical URLs to all existing pages
