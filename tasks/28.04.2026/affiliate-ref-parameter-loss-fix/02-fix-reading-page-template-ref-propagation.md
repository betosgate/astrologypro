# 02 Fix Reading Page Template Ref Propagation - 2026-04-28

- Depends on: `01-audit-ref-parameter-flow.md`
- Task File: `tasks/28.04.2026/affiliate-ref-parameter-loss-fix/02-fix-reading-page-template-ref-propagation.md`

## Problem

`ReadingPageTemplate` component generates links to diviner profiles without including the `ref` parameter, breaking affiliate attribution.

## Changes Required

### 1. Update ReadingPageTemplateProps Interface

Add `ref?: string` to the props interface.

```typescript
export interface ReadingPageTemplateProps {
  // ... existing props
  ref?: string;
  // ... rest
}
```

### 2. Modify DivinerCard Component

Update `DivinerCard` to accept `ref` prop and include it in booking URLs.

```typescript
function DivinerCard({
  diviner,
  serviceSlug,
  ref,
}: {
  diviner: DivinerLandingCard;
  serviceSlug: string;
  ref?: string;
}) {
  const refParam = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const bookingHref = serviceSlug 
    ? `/${diviner.username}/book/${serviceSlug}${refParam}` 
    : `/${diviner.username}${refParam}`;

  // ... rest of component
}
```

### 3. Update Component Usage

Pass `ref` prop to `DivinerCard` in the template.

```typescript
<DivinerCard 
  key={d.username} 
  diviner={d} 
  serviceSlug={readingSlug} 
  ref={props.ref} 
/>
```

### 4. Update Reading Page Components

Modify all reading page components (`/src/app/readings/*/page.tsx`) to extract `ref` from searchParams and pass to `ReadingPageTemplate`.

```typescript
export default async function ReadingPage({ params, searchParams }: PageProps) {
  const { ref } = await searchParams;
  
  return (
    <ReadingPageTemplate
      // ... existing props
      ref={ref}
    />
  );
}
```

## Files to Modify

- `src/components/marketing/reading-page-template.tsx`
- `src/app/readings/saturn-return/page.tsx`
- `src/app/readings/jupiter-return/page.tsx`
- `src/app/readings/solar-return/page.tsx`
- `src/app/readings/nativity-birth-chart/page.tsx`
- `src/app/readings/uranus-opposition/page.tsx`
- `src/app/readings/mars-return/page.tsx`
- `src/app/readings/monthly-transits-lunar-return/page.tsx`
- `src/app/readings/predictive-event-horary/page.tsx`
- `src/app/readings/3-card-basic-question-spread/page.tsx`
- `src/app/readings/5-card-complex-question-spread/page.tsx`
- `src/app/readings/7-card-6-month-forward-review/page.tsx`
- `src/app/readings/7-card-horseshoe-spread-major-read/page.tsx`
- `src/app/readings/10-card-celtic-cross-major-read/page.tsx`
- `src/app/readings/10-card-relationship-spread/page.tsx`
- `src/app/readings/12-card-astrological-spread-major-read/page.tsx`
- `src/app/readings/business-relationship/page.tsx`
- `src/app/readings/friendship-relationships/page.tsx`
- `src/app/readings/romantic-relationships/page.tsx`
- `src/app/readings/weekly-transits/page.tsx`

## Testing

After changes, test that:
- Affiliate links to reading pages carry ref
- Links from reading pages to diviner profiles include ref
- Ref reaches booking page