# Task 05: Public Player and Link-Out Rendering Rules

## Goal

Make public live rendering follow platform capability policy instead of assuming only YouTube and Facebook are embeddable forever.

## Why This Is Needed

`src/components/public/live-stream-section.tsx` currently hardcodes:

- platform labels
- platform emoji
- embeddable set
- embed URL builders

That is too rigid for admin-controlled platform governance.

## Required Rendering Model

### 1. Capability-aware rendering

Public live rendering should consult:

- effective platform availability
- playback mode
- embed support

### 2. Rendering modes

Support these modes:

- embedded player
- branded external watch CTA
- generic manual live badge when no supported playback is available

### 3. Platform-specific behavior

Recommended default posture:

- YouTube: embedded player
- Twitch: embedded player and optional chat region later
- Facebook: embedded player where policy allows
- Instagram: external watch CTA
- TikTok: external watch CTA
- Zoom: external join/watch CTA or owned-session pathway depending on event type
- Other: external link fallback

### 4. Public safety

If admin disables a platform globally or for the diviner:

- public page should not render that provider even if the diviner still has stored config rows

## Acceptance Criteria

- public live section renders from platform capability policy
- link-out/manual platforms no longer need special-case hacks spread through the component
