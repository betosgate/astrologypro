# Task: Ritual Result Playback Logic

## Objective
Implement the logic to fetch, sequence, and play back a saved ritual configuration based on its unique ID.

## Requirements
- [ ] **Initial Fetch**:
    - Load the saved ritual configuration using the `config_id` from the URL.
    - Extract the `ritual_tags` associated with that configuration.
- [ ] **Video Library Integration**:
    - Fetch the master list of ritual videos matching the saved tags.
    - **Custom Video Support**: Allow for "Override" or "Custom" video markers if the configuration specifies them.
    - Normalize video responses (URLs, Titles, Thumbnails).
- [ ] **Planetary Ritual Logic (The "Last" Ritual)**:
    - Implement specific sequencing for the `Planetary Zodiacal Invocation` (the 4th option).
    - Ensure zodiacal gates are prioritized correctly in the video stack.
- [ ] **Sequencing Engine**:
    - Sort videos into the canonical ritual order:
        1. Opening content
        2. Gate content (Planets/Zodiacs)
        3. Invocation/Banishing content
        4. Closing content
- [ ] **Ritual Lifecycle**:
    - **Dynamic Gating**: If multiple tags are present, show a "Prepare Sacred Space" overlay.
    - **Action**: Require a "Begin the Ritual" click before starting playback.
    - **Non-Dynamic**: Single-video rituals can play immediately.

## Technical Details
- Do NOT rely on URL query parameters for tag data; use the saved config as the single source of truth.
- Handle edge cases where a video might be missing or the tag returns no content.
