# Task: Standard Ritual Presets

## Objective
Provide a simplified creation experience using pre-defined ritual configurations.

## Requirements
- [ ] **Preset Options**: Implement the following 4 primary choices (exact names):
    1. Standard Banishing Ritual of the Pentagram
    2. Standard Invocation Ritual of the Pentagram
    3. Divine Infinite Being Invocation Ritual of the Pentagram
    4. Planetary Zodiacal Invocation Ritual of the Pentagram
- [ ] **Functional Mapping**:
    - Standard Banishing -> Map to specific banishing tags.
    - Standard Invocation -> Map to specific invocation tags.
    - Divine Infinite -> Map to core invocation tags.
- [ ] **Create Workflow**:
    - Immediate submission when a preset is selected.
    - Automatic navigation to the resulting ritual playback page upon success.
- [ ] **UI Feedback**:
    - Show loading state during creation.
    - handle error/success toast notifications.

## Technical Details
- Submit the user ID and the mapped tag array for the selected preset.
- Do NOT redirect to the custom configurator for standard presets.
