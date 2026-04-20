# Task: Profile Birth City Autocomplete

## Description
The "Birth City" field in the community profile form should be an autocomplete dropdown instead of a simple text input.

## Requirements
- Replace the `Birth City` text input in `src/components/community/profile-form.tsx` with an autocomplete component.
- The component should call the API endpoint: `/api/community/nativity-chart/city-search?q={query}`.
- As the user types (minimum 2 characters), the dropdown should display matching cities.
- When a city is selected, the field should be updated with the city name.

## API Details
- **Endpoint**: `/api/community/nativity-chart/city-search`
- **Method**: GET
- **Params**: `q` (search string)
- **Response Format**: 
  ```json
  {
    "results": [
      {
        "label": "Miami, FL, USA",
        "lat": 25.7617,
        "lng": -80.1918,
        "tzone": "-05:00"
      }
    ]
  }
  ```

## Implementation Notes
- Use a debounce of ~300ms to avoid excessive API calls.
- Display a loading state while fetching.
- Ensure the selected value is properly synced with the form state.
