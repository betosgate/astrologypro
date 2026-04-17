# Task 04 - Update Campaign Creation UI with Destination Selection - 2026-04-17

- Status: Not Started
- Priority: P0
- Owner: Frontend
- Parent: `00-master-task.md`
- Phase: 4 - Campaign Creation UI Update
- Depends On: Tasks 01, 02, 03
- Blocks: Task 05

## Goal

Update the existing campaign creation/edit UI at `/dashboard/campaigns` to include destination selection (profile or enabled service). Show generated campaign URL after creation. Add auto-pause indicators and destination status badges.

## Current State

**File:** `src/app/dashboard/campaigns/page.tsx`

Current campaign form fields:
- Campaign name
- Description
- Start date / End date
- Status (draft/active/paused/completed)
- Commission type / value
- Budget cap
- Target product type
- UTM source / medium / campaign

**What's missing:**
- No destination type selection (PROFILE / SERVICE)
- No service picker from enabled services
- No channel selector
- No campaign URL display / copy button
- No auto-pause indicator

## Implementation Steps

### Step 1: Update Campaign Creation Dialog/Form

**File to modify:** `src/app/dashboard/campaigns/page.tsx`

**Add new form sections to the existing campaign creation dialog:**

```
EXISTING FORM FIELDS:
  Campaign Name:    [________________________]
  Description:      [________________________]
  Start Date:       [____________]
  End Date:         [____________]

NEW SECTION — DESTINATION (insert after name/description):
  ┌─────────────────────────────────────────────┐
  │  Where should this campaign send visitors?   │
  │                                              │
  │  ○ My Profile Page                           │
  │    /debasis                                  │
  │                                              │
  │  ● One of My Services                        │
  │    ┌─────────────────────────────────────┐   │
  │    │ Select a service...              v  │   │
  │    └─────────────────────────────────────┘   │
  │    ┌─────────────────────────────────────┐   │
  │    │ ★ Nativity Birth Chart              │   │
  │    │   Astrology | 90 min | $175         │   │
  │    │   Published ✓                       │   │
  │    ├─────────────────────────────────────┤   │
  │    │ ★ 3 Card Basic Question             │   │
  │    │   Tarot | 20 min | $35              │   │
  │    │   Published ✓                       │   │
  │    ├─────────────────────────────────────┤   │
  │    │ ★ Weekly Transits                   │   │
  │    │   Astrology | 30 min | $65          │   │
  │    │   Draft ⚠ (not published yet)       │   │
  │    └─────────────────────────────────────┘   │
  │                                              │
  │  ⚠ Note: Only services enabled for your     │
  │    account are shown. Draft services can be  │
  │    selected but won't be publicly visible    │
  │    until published.                          │
  └─────────────────────────────────────────────┘

NEW SECTION — CHANNEL (insert after destination):
  Channel:          [Select channel...        v]
                    Facebook | Instagram | WhatsApp |
                    YouTube | Email | Twitter | TikTok |
                    LinkedIn | Direct | Other
  Content Variant:  [________________________] (optional, for A/B testing)

EXISTING FIELDS (keep as-is):
  Commission Type:  [Percentage v]
  Commission Value: [10]
  Budget Cap:       [________________________]
  UTM Source:       [________________________]
  UTM Medium:       [________________________]
  UTM Campaign:     [________________________]

AFTER CREATION — SHOW:
  ┌─────────────────────────────────────────────┐
  │  ✓ Campaign Created!                        │
  │                                              │
  │  Campaign URL:                               │
  │  ┌─────────────────────────────────────┐     │
  │  │ https://astrologypro.com/r/cmp_8FK2 │ [Copy] │
  │  └─────────────────────────────────────┘     │
  │                                              │
  │  Destination: Nativity Birth Chart           │
  │  Code: cmp_8FK29XQ                           │
  │                                              │
  │  [View Campaign]  [Create Another]            │
  └─────────────────────────────────────────────┘
```

### Step 2: Destination Selection Component

**File to create:** `src/components/dashboard/campaign-destination-picker.tsx`

```typescript
interface CampaignDestinationPickerProps {
  value: {
    destination_type: 'PROFILE' | 'SERVICE' | null;
    destination_service_template_id: string | null;
  };
  onChange: (destination: {
    destination_type: 'PROFILE' | 'SERVICE';
    destination_service_template_id: string | null;
  }) => void;
  disabled?: boolean;
}
```

**Component behavior:**
1. On mount: fetch `/api/dashboard/campaigns/destinations`
2. Show radio buttons: "My Profile Page" / "One of My Services"
3. When "My Profile" selected: set destination_type = 'PROFILE', clear service selection
4. When "My Services" selected: show service picker
5. Service picker shows only enabled services from the API response
6. Each service option shows: name, category badge, price, duration, publish status
7. Unpublished services show warning: "Not published yet — visitors will be redirected to your profile"
8. If no services are enabled: show message "No services available. Contact support to enable services."

### Step 3: Update Campaign List Table

**File to modify:** `src/app/dashboard/campaigns/page.tsx`

**Add columns to the campaign list table:**

Current columns: Campaign Name, Status, Affiliates, Conversions, Commission, Created

**Add:**
| Column | Content |
|---|---|
| Destination | Icon + label: "Profile" or service name |
| Campaign URL | Truncated URL with copy button |
| Clicks | Total / Unique clicks |

**Auto-pause indicator:**
If `auto_paused_at` is not null, show a warning badge:
```
⚠ Auto-paused: Linked service was disabled
[Reactivate] (only if service is re-enabled)
```

### Step 4: Update Campaign Detail Page

**File to modify:** `src/app/dashboard/campaigns/[id]/page.tsx`

**Add destination section to campaign detail:**

```
CAMPAIGN DETAIL

  ┌─ Destination ──────────────────────────────┐
  │  Type: Service Landing Page                │
  │  Service: Nativity Birth Chart             │
  │  URL: /debasis/services/nativity-birth-ch  │
  │  Status: Published ✓                       │
  │                                             │
  │  Campaign URL:                              │
  │  https://astrologypro.com/r/cmp_8FK29XQ    │
  │  [Copy URL]  [Open in New Tab]              │
  │                                             │
  │  Code: cmp_8FK29XQ                          │
  └─────────────────────────────────────────────┘

  ┌─ Click Summary ────────────────────────────┐
  │  Total Clicks: 245                          │
  │  Unique Clicks: 180                         │
  │  Bot Clicks: 12 (filtered)                  │
  │  Conversion Rate: 6.1%                      │
  └─────────────────────────────────────────────┘

  [Existing sections: Affiliates, Conversions, etc.]
```

### Step 5: Update Campaign Edit Form

**File to modify:** `src/app/dashboard/campaigns/[id]/page.tsx` (or wherever the edit dialog is)

When editing an existing campaign:
- Pre-populate destination selection with current values
- Allow changing destination (with validation)
- If campaign is active and destination changes: show confirmation "Changing the destination will redirect all future clicks to the new target. Continue?"
- If campaign was auto-paused: show the reason and allow changing destination before reactivation

### Step 6: Campaign Status Badges Update

**File to modify:** `src/app/dashboard/campaigns/page.tsx`

Update the status badge rendering to handle auto-pause:

```typescript
function getStatusBadge(campaign: Campaign) {
  if (campaign.auto_paused_at) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Auto-Paused
      </Badge>
    );
  }
  // ... existing status badge logic
}
```

### Step 7: Copy URL to Clipboard

**Add copy-to-clipboard functionality for campaign URLs:**

```typescript
function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}
```

### Step 8: Update Admin Campaign Pages

**File to modify:** `src/app/admin/campaigns/page.tsx`

Admin campaign list should also show:
- Destination type and name per campaign
- Campaign URL with copy button
- Total clicks / unique clicks
- Auto-pause status and reason
- Filter by destination type (Profile / Service / All)

Admin campaign create/edit should:
- Allow selecting destination for any diviner
- Show all services for the selected diviner (respect their diviner_services enablement)
- Allow creating campaigns without destination (backward compatible)

### Step 9: Form Validation (Client-Side)

```typescript
// Validation rules for campaign form
const validateCampaignForm = (values: CampaignFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!values.name?.trim()) {
    errors.name = 'Campaign name is required';
  }

  if (!values.start_date) {
    errors.start_date = 'Start date is required';
  }

  if (values.end_date && values.start_date && values.end_date < values.start_date) {
    errors.end_date = 'End date cannot be before start date';
  }

  if (!values.destination_type) {
    errors.destination_type = 'Please choose a destination';
  }

  if (values.destination_type === 'SERVICE' && !values.destination_service_template_id) {
    errors.destination_service_template_id = 'Please select a service';
  }

  return errors;
};
```

## Component Structure

```
src/components/dashboard/
  campaign-destination-picker.tsx    -- Destination type radio + service selector
  campaign-url-display.tsx           -- URL display with copy button
  campaign-auto-pause-banner.tsx     -- Auto-pause warning with reactivate option
  campaign-destination-badge.tsx     -- Compact destination indicator for list view
```

## Verification Plan

1. Open campaign creation form → destination section visible
2. Select "My Profile" → profile URL preview shown
3. Select "My Services" → only enabled services listed
4. Disabled services NOT shown in picker
5. Select a service → service details displayed
6. Submit campaign → campaign URL generated and displayed
7. Copy URL button → URL copied to clipboard
8. Campaign list shows destination column with correct data
9. Campaign detail shows destination section with URL
10. Auto-paused campaign shows warning badge and reason
11. Edit campaign → can change destination
12. Activate auto-paused campaign with re-enabled service → works
13. Activate auto-paused campaign with still-disabled service → error message
14. Admin can create campaign with destination for any diviner
15. Backward compatible: existing campaigns without destination still display correctly
16. Mobile responsive: form layout adapts to small screens

## Edge Cases

- Diviner has zero enabled services: "My Services" option shows "No services available" message, still allows "My Profile" selection
- Service becomes unpublished after campaign created: destination badge shows warning "Draft" indicator, campaign still works (redirects to profile as fallback)
- Very long service name in picker: truncate with ellipsis
- Campaign URL very long: truncate display with "..." but copy full URL
- Multiple campaigns pointing to same service: each has unique code and URL
- Form submitted while destinations API is loading: show loading spinner, disable submit button
