# Perennial Ritual Module - User Dashboard Overview

## Goal
Achieve functional parity with the legacy Ritual workflow, allowing users to view, create, and experience saved ritual configurations within the **Perennial User Dashboard**.

## Key Objectives
- **Ritual Management**: A centralized hub to view previously saved ritual configurations.
- **Simplified Creation**: Quick-entry presets for standard rituals.
- **Planetary Zodiacal Configuration**: A detailed planetary and zodiacal ritual builder with specific validation rules.
- **Dynamic Experience**: A video-driven ritual playback system that sequences content based on ritual structure.

## Task Index

1.  **[01-ritual-list-and-navigation.md](./01-ritual-list-and-navigation.md)**
    - User-specific ritual history list.
    - Status tracking and direct navigation to ritual results.

2.  **[02-standard-ritual-presets.md](./02-standard-ritual-presets.md)**
    - Fast-track creation for common ritual types.
    - Pre-defined tag mapping for standard banishing and invocations.

3.  **[03-custom-ritual-configurator.md](./03-custom-ritual-configurator.md)**
    - Advanced UI for selecting Planets and Zodiac signs for the **Planetary Zodiacal Invocation**.
    - Mode-switching (Invocation vs. Banishing) with dynamic validation.

4.  **[04-ritual-result-playback-logic.md](./04-ritual-result-playback-logic.md)**
    - Video library fetching and sequencing logic.
    - Pre-start gating and "Begin the Ritual" flow for dynamic sessions.

## Technical Constraints
- **Config-Driven**: Everything must serve from the saved `config_id`.
- **Sequencing**: Videos must follow the canonical ritual order (Opening -> Gates -> Planets/Zodiacs -> Closing).
- **Parity**: Matching legacy behavior for validation and tag generation is critical.
