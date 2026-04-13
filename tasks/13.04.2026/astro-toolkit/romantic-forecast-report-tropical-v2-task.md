# Task: Recreate Romantic Forecast Report (Tropical V2)

This document outlines the requirements and technical details for recreating the `romantic_forecast_report_tropical_v2` route in another project.

## 1. Components Involved

To replicate this functionality, you will need the following components:

### Core Components
- **RomanticForcastReportV2Component**: The main container component handling data flow, orchestration, and UI rendering.
- **NatalChartComponent**: A helper component used multiple times to fetch specific subsets of astrological data (Synastry, Composite, Natal, Transits).
- **lib-showform**: A dynamic form component for collecting user birth data (Self and Partner).
- **AnimationLoaderComponent**: A visual loader used while AI is generating interpretations.

### Shared UI/Modals
- **natalImageModal**: A dialog for displaying full-sized natal wheel charts.
- **showMoreModal**: A dialog for displaying detailed AI-generated interpretations and pictorial representations.

### Utilities
- **Pipes**:
  - `classModiratorPipe`: Sanitizes/formats titles for CSS classes.
  - `globalHeaderReturner`: Likely injects icons or specific formatting into headers.

---

## 2. API Architecture

The feature relies on a multi-stage API process:

### A. Data Retrieval (Astro API)
These endpoints provide the raw mathematical data:
- **`western_horoscope`**: Fetches planets, houses, and aspects for a single profile.
- **`synastry_horoscope`**: Calculates relationship dynamics between two profiles.
- **`composite_horoscope`**: Merges two charts into a single "relationship" chart.
- **`tropical_transits/monthly`**: Fetches monthly transit data for individual profiles.
- **`natal_wheel_chart`**: Generates image URLs for standard natal wheels.

### B. Artificial Intelligence (Interpretations)
- **`astro-ai/get-http-horoscope-post`**: The primary endpoint for AI-generated text. It takes a "condition" (prompt) and "json" (data from Astro API) to return professional astrological interpretations.
- **Usage Contexts**:
  - Synastry Horoscope
  - Composite Horoscope
  - Davison Relationship
  - Major Aspects & Connections
  - Compatibility Summary
  - Elemental Balance
  - Karmic & Soulmate Indicators
  - Timing & Transits

### C. Supporting APIs
- **`astro-ai/fetch_city_with_latLon`**: Used for city search and coordinate/timezone retrieval.
- **`astro_decan_new_infos/get-free-natal-wheel-chart`**: Provides high-quality alternative natal wheel images.
- **`astro-picture-content/fetch_image_from_aws`**: Fetches planetary/aspect icons for interpretations.

### D. Sharing & Persistence
- **`astro-ai/save-astro-AI-Response`**: Saves the full report state to generate a shareable link.
- **`astro-ai/fetch-save-astro-AI-Response`**: Retrieves a saved report for public viewing.
- **`user/save-customer-astro-responce`**: Persists the report for the user's dashboard history.

---

## 3. Implementation Workflow

1.  **Initialization**: Component loads and initializes form via `configForm()`.
2.  **Form Submission**: `listenFormFieldChange` processes input coordinates and dates using `moment.js`.
3.  **Concurrent Data Fetching**:
    - Calls `imgFetch` for initial wheels.
    - Multiple `app-natal-chart-component` instances trigger parallel calls to Synastry, Composite, Natal, and Transit endpoints.
4.  **AI Generation**:
    - As raw data arrives via event emitters (e.g., `selfNatalchartData`), the parent calls `stringModifiear`.
    - `stringModifiear` formats a complex prompt including birth details and raw scientific data.
    - AI API is called via `extraFetch`.
5.  **Rendering**: Interpretations are parsed from JSON strings returned by the AI and displayed using `*ngFor`.

---

## 4. Key Data Structures

### Profile Payload (Used in most requests)
```json
{
  "hour": 0,
  "min": 0,
  "day": 0,
  "month": 0,
  "year": 0,
  "lat": 0.0,
  "lon": 0.0,
  "tzone": "+00:00"
}
```

### AI Result Array
Values are stored as objects where the key is the section name (e.g., `synastry_horoscope`) and the value is a parsed JSON object containing titles and interpretations.

### Shareable Payload
A massive object containing:
- `toolname`: "romantic_forecast_report_tropical_v2"
- `ai_response`: Full `airesultArray`
- `natal_chart`: self and partner chart data
- `formData`: Birth details
- `astro_api_data`: Merged raw data from all Astro API calls.


USED API PAYLOAD AND RESPONSE FORMAT 


Romantic Relation Ships											
											
Inputs											
			Date Of Birth			Time Of Birth			City		
											
Self			7/24/2002			01:00			Bardhaman,West Bengal, India		
											
Partner			5/18/2000			01:00			Bardhaman,West Bengal, India		
Api List											
CONTEXT			API NAMES			PAYLOADS			RESPONSE		
											
Fetch Lat Lon			API : https://d36fwfwo4vnk9h.cloudfront.net/astro-ai/fetch_city_with_latLon			PAYLOAD : {"formvalue":{"p_date_of_birth":"2000-05-17T18:30:00.000Z","p_time_of_birth":"1:00 AM","p_city":"kolkata","s_date_of_birth":"","s_time_of_birth":"","s_city":""},"searchcondition":{"search_string":"kolkata"},"secret":"na","token":""}			"RESULTS : {
    ""status"": ""success"",
    ""res"": [
        {
            ""val"": ""Kolkata, West Bengal, India"",
            ""key"": {
                ""timezone"": {
                    ""name"": ""Asia/Kolkata"",
                    ""utcOffset"": ""+05:30"",
                    ""offset_string"": ""+05:30""
                },
                ""lat"": 22.5706,
                ""lng"": 88.37132,
                ""label"": ""Kolkata, West Bengal, India""
            }
        }
    ]
}"		
											
Fetch Natal Chart			API : https://json.astrologyapi.com/v1/natal_wheel_chart			PAYLOAD : {"hour":1,"min":0,"day":18,"month":5,"year":2000,"lat":22.5706,"lon":88.37132,"tzone":"+05:30"}			"RESULTS : {
    ""status"": true,
    ""chart_url"": ""https://s3.ap-south-1.amazonaws.com/western-chart/40293500-5d4e-11f0-bf0a-ab091148e0c8.svg"",
    ""msg"": ""Chart created successfully!""
}"		
											
Fetch Natal Chart			API : https://json.astrologyapi.com/v1/natal_wheel_chart			PAYLOAD : {"hour":1,"min":0,"day":24,"month":7,"year":2002,"lat":22.5706,"lon":88.37132,"tzone":"+05:30"}			"RESULTS :{
    ""status"": true,
    ""chart_url"": ""https://s3.ap-south-1.amazonaws.com/western-chart/3fe54e30-5d4e-11f0-9b19-a5bcc53d5897.svg"",
    ""msg"": ""Chart created successfully!""
}"		
											
synastry_horoscope			API : https://json.astrologyapi.com/v1/synastry_horoscope			PAYLOAD : {"p_hour":1,"p_min":0,"p_day":18,"p_month":5,"p_year":2000,"p_lat":22.5706,"p_lon":88.37132,"p_tzone":"+05:30","s_hour":1,"s_min":0,"s_day":24,"s_month":7,"s_year":2002,"s_lat":22.5706,"s_lon":88.37132,"s_tzone":"+05:30"}			"RESULTS :{
    ""first"": [
        {
            ""name"": ""Sun"",
            ""full_degree"": 57.2003,
            ""norm_degree"": 27.2003,
            ""speed"": 0.9629,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 2
        },
        {
            ""name"": ""Moon"",
            ""full_degree"": 231.7352,
            ""norm_degree"": 21.7352,
            ""speed"": 12.3389,
            ""is_retro"": ""false"",
            ""sign_id"": 8,
            ""sign"": ""Scorpio"",
            ""house"": 8
        },
        {
            ""name"": ""Mars"",
            ""full_degree"": 69.7763,
            ""norm_degree"": 9.7763,
            ""speed"": 0.6914,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 3
        },
        {
            ""name"": ""Mercury"",
            ""full_degree"": 67.4912,
            ""norm_degree"": 7.4912,
            ""speed"": 2.0745,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 3
        },
        {
            ""name"": ""Jupiter"",
            ""full_degree"": 50.172,
            ""norm_degree"": 20.172,
            ""speed"": 0.2368,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 2
        },
        {
            ""name"": ""Venus"",
            ""full_degree"": 50.5645,
            ""norm_degree"": 20.5645,
            ""speed"": 1.2292,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 2
        },
        {
            ""name"": ""Saturn"",
            ""full_degree"": 51.3412,
            ""norm_degree"": 21.3412,
            ""speed"": 0.1283,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 2
        },
        {
            ""name"": ""Uranus"",
            ""full_degree"": 320.8013,
            ""norm_degree"": 20.8013,
            ""speed"": 0.0061,
            ""is_retro"": ""false"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 12
        },
        {
            ""name"": ""Neptune"",
            ""full_degree"": 306.5494,
            ""norm_degree"": 6.5494,
            ""speed"": -0.005,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 11
        },
        {
            ""name"": ""Pluto"",
            ""full_degree"": 251.939,
            ""norm_degree"": 11.939,
            ""speed"": -0.0259,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 9
        },
        {
            ""name"": ""Node"",
            ""full_degree"": 116.3003,
            ""norm_degree"": 26.3003,
            ""speed"": -0.1751,
            ""is_retro"": ""true"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 5
        },
        {
            ""name"": ""Chiron"",
            ""full_degree"": 255.3443,
            ""norm_degree"": 15.3443,
            ""speed"": -0.0653,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 9
        },
        {
            ""name"": ""Part of Fortune"",
            ""full_degree"": 177.7521,
            ""norm_degree"": 27.7521,
            ""speed"": 0,
            ""is_retro"": ""false"",
            ""sign_id"": 6,
            ""sign"": ""Virgo"",
            ""house"": 7
        }
    ],
    ""second"": [
        {
            ""name"": ""Sun"",
            ""full_degree"": 120.7857,
            ""norm_degree"": 0.7857,
            ""speed"": 0.9547,
            ""is_retro"": ""false"",
            ""sign_id"": 5,
            ""sign"": ""Leo"",
            ""house"": 3
        },
        {
            ""name"": ""Moon"",
            ""full_degree"": 294.295,
            ""norm_degree"": 24.295,
            ""speed"": 12.889,
            ""is_retro"": ""false"",
            ""sign_id"": 10,
            ""sign"": ""Capricorn"",
            ""house"": 8
        },
        {
            ""name"": ""Mars"",
            ""full_degree"": 126.5393,
            ""norm_degree"": 6.5393,
            ""speed"": 0.6404,
            ""is_retro"": ""false"",
            ""sign_id"": 5,
            ""sign"": ""Leo"",
            ""house"": 3
        },
        {
            ""name"": ""Mercury"",
            ""full_degree"": 123.9658,
            ""norm_degree"": 3.9658,
            ""speed"": 2.0839,
            ""is_retro"": ""false"",
            ""sign_id"": 5,
            ""sign"": ""Leo"",
            ""house"": 3
        },
        {
            ""name"": ""Jupiter"",
            ""full_degree"": 118.0226,
            ""norm_degree"": 28.0226,
            ""speed"": 0.2231,
            ""is_retro"": ""false"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 2
        },
        {
            ""name"": ""Venus"",
            ""full_degree"": 164.4179,
            ""norm_degree"": 14.4179,
            ""speed"": 1.0955,
            ""is_retro"": ""false"",
            ""sign_id"": 6,
            ""sign"": ""Virgo"",
            ""house"": 4
        },
        {
            ""name"": ""Saturn"",
            ""full_degree"": 83.9703,
            ""norm_degree"": 23.9703,
            ""speed"": 0.1129,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 1
        },
        {
            ""name"": ""Uranus"",
            ""full_degree"": 327.8866,
            ""norm_degree"": 27.8866,
            ""speed"": -0.034,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 10
        },
        {
            ""name"": ""Neptune"",
            ""full_degree"": 309.8325,
            ""norm_degree"": 9.8325,
            ""speed"": -0.0267,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 9
        },
        {
            ""name"": ""Pluto"",
            ""full_degree"": 255.1901,
            ""norm_degree"": 15.1901,
            ""speed"": -0.0165,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 7
        },
        {
            ""name"": ""Node"",
            ""full_degree"": 77.216,
            ""norm_degree"": 17.216,
            ""speed"": -0.0886,
            ""is_retro"": ""true"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 1
        },
        {
            ""name"": ""Chiron"",
            ""full_degree"": 274.574,
            ""norm_degree"": 4.574,
            ""speed"": -0.0543,
            ""is_retro"": ""true"",
            ""sign_id"": 10,
            ""sign"": ""Capricorn"",
            ""house"": 7
        },
        {
            ""name"": ""Part of Fortune"",
            ""full_degree"": 257.5264,
            ""norm_degree"": 17.5264,
            ""speed"": 0,
            ""is_retro"": ""false"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 7
        }
    ],
    ""synastry"": {
        ""house_1"": [
            {
                ""name"": ""Sun"",
                ""synastry_house"": 12
            },
            {
                ""name"": ""Moon"",
                ""synastry_house"": 6
            },
            {
                ""name"": ""Mars"",
                ""synastry_house"": 12
            },
            {
                ""name"": ""Mercury"",
                ""synastry_house"": 12
            },
            {
                ""name"": ""Jupiter"",
                ""synastry_house"": 12
            },
            {
                ""name"": ""Venus"",
                ""synastry_house"": 12
            },
            {
                ""name"": ""Saturn"",
                ""synastry_house"": 12
            },
            {
                ""name"": ""Uranus"",
                ""synastry_house"": 9
            },
            {
                ""name"": ""Neptune"",
                ""synastry_house"": 9
            },
            {
                ""name"": ""Pluto"",
                ""synastry_house"": 7
            },
            {
                ""name"": ""Node"",
                ""synastry_house"": 2
            },
            {
                ""name"": ""Chiron"",
                ""synastry_house"": 7
            },
            {
                ""name"": ""Part of Fortune"",
                ""synastry_house"": 4
            }
        ],
        ""house_2"": [
            {
                ""name"": ""Sun"",
                ""synastry_house"": 5
            },
            {
                ""name"": ""Moon"",
                ""synastry_house"": 11
            },
            {
                ""name"": ""Mars"",
                ""synastry_house"": 5
            },
            {
                ""name"": ""Mercury"",
                ""synastry_house"": 5
            },
            {
                ""name"": ""Jupiter"",
                ""synastry_house"": 5
            },
            {
                ""name"": ""Venus"",
                ""synastry_house"": 6
            },
            {
                ""name"": ""Saturn"",
                ""synastry_house"": 3
            },
            {
                ""name"": ""Uranus"",
                ""synastry_house"": 12
            },
            {
                ""name"": ""Neptune"",
                ""synastry_house"": 11
            },
            {
                ""name"": ""Pluto"",
                ""synastry_house"": 9
            },
            {
                ""name"": ""Node"",
                ""synastry_house"": 3
            },
            {
                ""name"": ""Chiron"",
                ""synastry_house"": 10
            },
            {
                ""name"": ""Part of Fortune"",
                ""synastry_house"": 9
            }
        ],
        ""aspects"": [
            {
                ""first"": ""Sun"",
                ""second"": ""Sun"",
                ""type"": ""Sextile"",
                ""orb"": 3.59
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Moon"",
                ""type"": ""Trine"",
                ""orb"": 2.91
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Mars"",
                ""type"": ""Sextile"",
                ""orb"": 9.34
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Mercury"",
                ""type"": ""Sextile"",
                ""orb"": 6.77
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Jupiter"",
                ""type"": ""Sextile"",
                ""orb"": 0.82
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Uranus"",
                ""type"": ""Square"",
                ""orb"": 0.69
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Midheaven"",
                ""type"": ""Square"",
                ""orb"": 0.36
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Sun"",
                ""type"": ""Trine"",
                ""orb"": 9.05
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Moon"",
                ""type"": ""Sextile"",
                ""orb"": 2.56
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Jupiter"",
                ""type"": ""Trine"",
                ""orb"": 6.29
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Venus"",
                ""type"": ""Sextile"",
                ""orb"": 7.32
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Saturn"",
                ""type"": ""Quincunx"",
                ""orb"": 2.24
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Uranus"",
                ""type"": ""Square"",
                ""orb"": 6.15
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Chiron"",
                ""type"": ""Semi Square"",
                ""orb"": 2.16
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Midheaven"",
                ""type"": ""Square"",
                ""orb"": 5.82
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Sun"",
                ""type"": ""Sextile"",
                ""orb"": 8.99
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Mars"",
                ""type"": ""Sextile"",
                ""orb"": 3.24
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Mercury"",
                ""type"": ""Sextile"",
                ""orb"": 5.81
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Venus"",
                ""type"": ""Square"",
                ""orb"": 4.64
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Neptune"",
                ""type"": ""Trine"",
                ""orb"": 0.06
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Pluto"",
                ""type"": ""Opposition"",
                ""orb"": 5.41
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Node"",
                ""type"": ""Conjunction"",
                ""orb"": 7.44
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Opposition"",
                ""orb"": 7.75
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Ascendant"",
                ""type"": ""Conjunction"",
                ""orb"": 1.26
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Descendant"",
                ""type"": ""Opposition"",
                ""orb"": 1.26
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Sun"",
                ""type"": ""Sextile"",
                ""orb"": 6.71
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Mars"",
                ""type"": ""Sextile"",
                ""orb"": 0.95
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Mercury"",
                ""type"": ""Sextile"",
                ""orb"": 3.53
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Jupiter"",
                ""type"": ""Sextile"",
                ""orb"": 9.47
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Venus"",
                ""type"": ""Square"",
                ""orb"": 6.93
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Uranus"",
                ""type"": ""Square"",
                ""orb"": 9.6
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Neptune"",
                ""type"": ""Trine"",
                ""orb"": 2.34
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Pluto"",
                ""type"": ""Opposition"",
                ""orb"": 7.7
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Node"",
                ""type"": ""Conjunction"",
                ""orb"": 9.72
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Chiron"",
                ""type"": ""Quincunx"",
                ""orb"": 2.92
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Ascendant"",
                ""type"": ""Conjunction"",
                ""orb"": 3.54
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Midheaven"",
                ""type"": ""Square"",
                ""orb"": 9.93
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Descendant"",
                ""type"": ""Opposition"",
                ""orb"": 3.54
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Sun"",
                ""type"": ""Quintile"",
                ""orb"": 1.39
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Moon"",
                ""type"": ""Trine"",
                ""orb"": 4.12
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Mercury"",
                ""type"": ""Quintile"",
                ""orb"": 1.79
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Jupiter"",
                ""type"": ""Sextile"",
                ""orb"": 7.85
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Venus"",
                ""type"": ""Trine"",
                ""orb"": 5.75
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Uranus"",
                ""type"": ""Square"",
                ""orb"": 7.71
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Node"",
                ""type"": ""Semi Sextile"",
                ""orb"": 2.96
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Quincunx"",
                ""orb"": 2.65
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Midheaven"",
                ""type"": ""Square"",
                ""orb"": 7.39
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Sun"",
                ""type"": ""Quintile"",
                ""orb"": 1.78
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Moon"",
                ""type"": ""Trine"",
                ""orb"": 3.73
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Mercury"",
                ""type"": ""Quintile"",
                ""orb"": 1.4
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Jupiter"",
                ""type"": ""Sextile"",
                ""orb"": 7.46
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Venus"",
                ""type"": ""Trine"",
                ""orb"": 6.15
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Uranus"",
                ""type"": ""Square"",
                ""orb"": 7.32
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Midheaven"",
                ""type"": ""Square"",
                ""orb"": 7
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Sun"",
                ""type"": ""Sextile"",
                ""orb"": 9.44
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Moon"",
                ""type"": ""Trine"",
                ""orb"": 2.95
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Mercury"",
                ""type"": ""Quintile"",
                ""orb"": 0.62
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Jupiter"",
                ""type"": ""Sextile"",
                ""orb"": 6.68
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Venus"",
                ""type"": ""Trine"",
                ""orb"": 6.92
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Saturn"",
                ""type"": ""Semi Sextile"",
                ""orb"": 2.63
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Uranus"",
                ""type"": ""Square"",
                ""orb"": 6.55
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Midheaven"",
                ""type"": ""Square"",
                ""orb"": 6.22
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Saturn"",
                ""type"": ""Trine"",
                ""orb"": 3.17
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Uranus"",
                ""type"": ""Conjunction"",
                ""orb"": 7.09
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Pluto"",
                ""type"": ""Sextile"",
                ""orb"": 5.61
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Node"",
                ""type"": ""Trine"",
                ""orb"": 3.59
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Chiron"",
                ""type"": ""Semi Square"",
                ""orb"": 1.23
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Sextile"",
                ""orb"": 3.27
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Ascendant"",
                ""type"": ""Trine"",
                ""orb"": 9.77
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Midheaven"",
                ""type"": ""Conjunction"",
                ""orb"": 6.76
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Descendant"",
                ""type"": ""Sextile"",
                ""orb"": 9.77
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Sun"",
                ""type"": ""Opposition"",
                ""orb"": 5.76
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Mars"",
                ""type"": ""Opposition"",
                ""orb"": 0.01
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Mercury"",
                ""type"": ""Opposition"",
                ""orb"": 2.58
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Jupiter"",
                ""type"": ""Opposition"",
                ""orb"": 8.53
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Neptune"",
                ""type"": ""Conjunction"",
                ""orb"": 3.28
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Pluto"",
                ""type"": ""Sextile"",
                ""orb"": 8.64
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Chiron"",
                ""type"": ""Semi Sextile"",
                ""orb"": 1.98
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Ascendant"",
                ""type"": ""Trine"",
                ""orb"": 4.49
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Descendant"",
                ""type"": ""Sextile"",
                ""orb"": 4.49
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Moon"",
                ""type"": ""Semi Square"",
                ""orb"": 2.64
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Mars"",
                ""type"": ""Trine"",
                ""orb"": 5.4
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Mercury"",
                ""type"": ""Trine"",
                ""orb"": 7.97
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Venus"",
                ""type"": ""Square"",
                ""orb"": 2.48
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Neptune"",
                ""type"": ""Sextile"",
                ""orb"": 2.11
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Pluto"",
                ""type"": ""Conjunction"",
                ""orb"": 3.25
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Node"",
                ""type"": ""Opposition"",
                ""orb"": 5.28
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Conjunction"",
                ""orb"": 5.59
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Ascendant"",
                ""type"": ""Opposition"",
                ""orb"": 0.9
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Descendant"",
                ""type"": ""Conjunction"",
                ""orb"": 0.9
            },
            {
                ""first"": ""Node"",
                ""second"": ""Sun"",
                ""type"": ""Conjunction"",
                ""orb"": 4.49
            },
            {
                ""first"": ""Node"",
                ""second"": ""Moon"",
                ""type"": ""Opposition"",
                ""orb"": 2.01
            },
            {
                ""first"": ""Node"",
                ""second"": ""Mercury"",
                ""type"": ""Conjunction"",
                ""orb"": 7.67
            },
            {
                ""first"": ""Node"",
                ""second"": ""Jupiter"",
                ""type"": ""Conjunction"",
                ""orb"": 1.72
            },
            {
                ""first"": ""Node"",
                ""second"": ""Saturn"",
                ""type"": ""Semi Sextile"",
                ""orb"": 2.33
            },
            {
                ""first"": ""Node"",
                ""second"": ""Uranus"",
                ""type"": ""Quincunx"",
                ""orb"": 1.59
            },
            {
                ""first"": ""Node"",
                ""second"": ""Ascendant"",
                ""type"": ""Semi Square"",
                ""orb"": 0.26
            },
            {
                ""first"": ""Node"",
                ""second"": ""Midheaven"",
                ""type"": ""Quincunx"",
                ""orb"": 1.26
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Mars"",
                ""type"": ""Trine"",
                ""orb"": 8.81
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Venus"",
                ""type"": ""Square"",
                ""orb"": 0.93
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Saturn"",
                ""type"": ""Opposition"",
                ""orb"": 8.63
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Uranus"",
                ""type"": ""Quintile"",
                ""orb"": 0.54
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Neptune"",
                ""type"": ""Sextile"",
                ""orb"": 5.51
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Pluto"",
                ""type"": ""Conjunction"",
                ""orb"": 0.15
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Node"",
                ""type"": ""Opposition"",
                ""orb"": 1.87
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Conjunction"",
                ""orb"": 2.18
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Ascendant"",
                ""type"": ""Opposition"",
                ""orb"": 4.31
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Midheaven"",
                ""type"": ""Quintile"",
                ""orb"": 0.22
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Descendant"",
                ""type"": ""Conjunction"",
                ""orb"": 4.31
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Sun"",
                ""type"": ""Sextile"",
                ""orb"": 3.03
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Moon"",
                ""type"": ""Trine"",
                ""orb"": 3.46
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Mars"",
                ""type"": ""Sextile"",
                ""orb"": 8.79
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Mercury"",
                ""type"": ""Sextile"",
                ""orb"": 6.21
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Jupiter"",
                ""type"": ""Sextile"",
                ""orb"": 0.27
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Saturn"",
                ""type"": ""Square"",
                ""orb"": 3.78
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Uranus"",
                ""type"": ""Quincunx"",
                ""orb"": 0.13
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Chiron"",
                ""type"": ""Square"",
                ""orb"": 6.82
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Midheaven"",
                ""type"": ""Quincunx"",
                ""orb"": 0.19
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Descendant"",
                ""type"": ""Quintile"",
                ""orb"": 1.28
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Sun"",
                ""type"": ""Trine"",
                ""orb"": 8.5
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Moon"",
                ""type"": ""Sextile"",
                ""orb"": 2.01
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Jupiter"",
                ""type"": ""Trine"",
                ""orb"": 5.74
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Venus"",
                ""type"": ""Opposition"",
                ""orb"": 7.87
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Saturn"",
                ""type"": ""Square"",
                ""orb"": 1.68
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Neptune"",
                ""type"": ""Semi Square"",
                ""orb"": 2.55
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Pluto"",
                ""type"": ""Square"",
                ""orb"": 7.1
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Node"",
                ""type"": ""Square"",
                ""orb"": 5.07
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Square"",
                ""orb"": 4.76
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Moon"",
                ""type"": ""Semi Sextile"",
                ""orb"": 0.37
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Saturn"",
                ""type"": ""Opposition"",
                ""orb"": 0.7
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Uranus"",
                ""type"": ""Sextile"",
                ""orb"": 3.22
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Neptune"",
                ""type"": ""Semi Square"",
                ""orb"": 0.17
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Pluto"",
                ""type"": ""Conjunction"",
                ""orb"": 9.48
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Node"",
                ""type"": ""Opposition"",
                ""orb"": 7.45
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Chiron"",
                ""type"": ""Conjunction"",
                ""orb"": 9.91
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Conjunction"",
                ""orb"": 7.14
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Midheaven"",
                ""type"": ""Sextile"",
                ""orb"": 2.89
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Sun"",
                ""type"": ""Sextile"",
                ""orb"": 8.5
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Moon"",
                ""type"": ""Trine"",
                ""orb"": 2.01
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Mars"",
                ""type"": ""Semi Square"",
                ""orb"": 0.75
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Jupiter"",
                ""type"": ""Sextile"",
                ""orb"": 5.74
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Venus"",
                ""type"": ""Conjunction"",
                ""orb"": 7.87
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Saturn"",
                ""type"": ""Square"",
                ""orb"": 1.68
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Pluto"",
                ""type"": ""Square"",
                ""orb"": 7.1
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Node"",
                ""type"": ""Square"",
                ""orb"": 5.07
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Square"",
                ""orb"": 4.76
            }
        ]
    }
}"		
											
composite_horoscope			API : https://json.astrologyapi.com/v1/composite_horoscope			PAYLOAD : {"p_hour":1,"p_min":0,"p_day":18,"p_month":5,"p_year":2000,"p_lat":22.5706,"p_lon":88.37132,"p_tzone":"+05:30","s_hour":1,"s_min":0,"s_day":24,"s_month":7,"s_year":2002,"s_lat":22.5706,"s_lon":88.37132,"s_tzone":"+05:30"}			"RESULTS : {
    ""first"": [
        {
            ""name"": ""Sun"",
            ""full_degree"": 57.2003,
            ""norm_degree"": 27.2003,
            ""speed"": 0.9629,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 2
        },
        {
            ""name"": ""Moon"",
            ""full_degree"": 231.7352,
            ""norm_degree"": 21.7352,
            ""speed"": 12.3389,
            ""is_retro"": ""false"",
            ""sign_id"": 8,
            ""sign"": ""Scorpio"",
            ""house"": 8
        },
        {
            ""name"": ""Mars"",
            ""full_degree"": 69.7763,
            ""norm_degree"": 9.7763,
            ""speed"": 0.6914,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 3
        },
        {
            ""name"": ""Mercury"",
            ""full_degree"": 67.4912,
            ""norm_degree"": 7.4912,
            ""speed"": 2.0745,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 3
        },
        {
            ""name"": ""Jupiter"",
            ""full_degree"": 50.172,
            ""norm_degree"": 20.172,
            ""speed"": 0.2368,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 2
        },
        {
            ""name"": ""Venus"",
            ""full_degree"": 50.5645,
            ""norm_degree"": 20.5645,
            ""speed"": 1.2292,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 2
        },
        {
            ""name"": ""Saturn"",
            ""full_degree"": 51.3412,
            ""norm_degree"": 21.3412,
            ""speed"": 0.1283,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 2
        },
        {
            ""name"": ""Uranus"",
            ""full_degree"": 320.8013,
            ""norm_degree"": 20.8013,
            ""speed"": 0.0061,
            ""is_retro"": ""false"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 12
        },
        {
            ""name"": ""Neptune"",
            ""full_degree"": 306.5494,
            ""norm_degree"": 6.5494,
            ""speed"": -0.005,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 11
        },
        {
            ""name"": ""Pluto"",
            ""full_degree"": 251.939,
            ""norm_degree"": 11.939,
            ""speed"": -0.0259,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 9
        },
        {
            ""name"": ""Node"",
            ""full_degree"": 116.3003,
            ""norm_degree"": 26.3003,
            ""speed"": -0.1751,
            ""is_retro"": ""true"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 5
        },
        {
            ""name"": ""Chiron"",
            ""full_degree"": 255.3443,
            ""norm_degree"": 15.3443,
            ""speed"": -0.0653,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 9
        },
        {
            ""name"": ""Part of Fortune"",
            ""full_degree"": 177.7521,
            ""norm_degree"": 27.7521,
            ""speed"": 0,
            ""is_retro"": ""false"",
            ""sign_id"": 6,
            ""sign"": ""Virgo"",
            ""house"": 7
        }
    ],
    ""second"": [
        {
            ""name"": ""Sun"",
            ""full_degree"": 120.7857,
            ""norm_degree"": 0.7857,
            ""speed"": 0.9547,
            ""is_retro"": ""false"",
            ""sign_id"": 5,
            ""sign"": ""Leo"",
            ""house"": 3
        },
        {
            ""name"": ""Moon"",
            ""full_degree"": 294.295,
            ""norm_degree"": 24.295,
            ""speed"": 12.889,
            ""is_retro"": ""false"",
            ""sign_id"": 10,
            ""sign"": ""Capricorn"",
            ""house"": 8
        },
        {
            ""name"": ""Mars"",
            ""full_degree"": 126.5393,
            ""norm_degree"": 6.5393,
            ""speed"": 0.6404,
            ""is_retro"": ""false"",
            ""sign_id"": 5,
            ""sign"": ""Leo"",
            ""house"": 3
        },
        {
            ""name"": ""Mercury"",
            ""full_degree"": 123.9658,
            ""norm_degree"": 3.9658,
            ""speed"": 2.0839,
            ""is_retro"": ""false"",
            ""sign_id"": 5,
            ""sign"": ""Leo"",
            ""house"": 3
        },
        {
            ""name"": ""Jupiter"",
            ""full_degree"": 118.0226,
            ""norm_degree"": 28.0226,
            ""speed"": 0.2231,
            ""is_retro"": ""false"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 2
        },
        {
            ""name"": ""Venus"",
            ""full_degree"": 164.4179,
            ""norm_degree"": 14.4179,
            ""speed"": 1.0955,
            ""is_retro"": ""false"",
            ""sign_id"": 6,
            ""sign"": ""Virgo"",
            ""house"": 4
        },
        {
            ""name"": ""Saturn"",
            ""full_degree"": 83.9703,
            ""norm_degree"": 23.9703,
            ""speed"": 0.1129,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 1
        },
        {
            ""name"": ""Uranus"",
            ""full_degree"": 327.8866,
            ""norm_degree"": 27.8866,
            ""speed"": -0.034,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 10
        },
        {
            ""name"": ""Neptune"",
            ""full_degree"": 309.8325,
            ""norm_degree"": 9.8325,
            ""speed"": -0.0267,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 9
        },
        {
            ""name"": ""Pluto"",
            ""full_degree"": 255.1901,
            ""norm_degree"": 15.1901,
            ""speed"": -0.0165,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 7
        },
        {
            ""name"": ""Node"",
            ""full_degree"": 77.216,
            ""norm_degree"": 17.216,
            ""speed"": -0.0886,
            ""is_retro"": ""true"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 1
        },
        {
            ""name"": ""Chiron"",
            ""full_degree"": 274.574,
            ""norm_degree"": 4.574,
            ""speed"": -0.0543,
            ""is_retro"": ""true"",
            ""sign_id"": 10,
            ""sign"": ""Capricorn"",
            ""house"": 7
        },
        {
            ""name"": ""Part of Fortune"",
            ""full_degree"": 257.5264,
            ""norm_degree"": 17.5264,
            ""speed"": 0,
            ""is_retro"": ""false"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 7
        }
    ],
    ""composite"": {
        ""planets"": [
            {
                ""name"": ""Sun"",
                ""full_degree"": 88.993,
                ""norm_degree"": 28.993,
                ""sign_id"": 3,
                ""sign"": ""Gemini"",
                ""house"": 8
            },
            {
                ""name"": ""Moon"",
                ""full_degree"": 263.0151,
                ""norm_degree"": 23.0151,
                ""sign_id"": 9,
                ""sign"": ""Sagittarius"",
                ""house"": 2
            },
            {
                ""name"": ""Mars"",
                ""full_degree"": 98.15780000000001,
                ""norm_degree"": 8.1578,
                ""sign_id"": 4,
                ""sign"": ""Cancer"",
                ""house"": 9
            },
            {
                ""name"": ""Mercury"",
                ""full_degree"": 95.7285,
                ""norm_degree"": 5.7285,
                ""sign_id"": 4,
                ""sign"": ""Cancer"",
                ""house"": 9
            },
            {
                ""name"": ""Jupiter"",
                ""full_degree"": 84.09729999999999,
                ""norm_degree"": 24.0973,
                ""sign_id"": 3,
                ""sign"": ""Gemini"",
                ""house"": 8
            },
            {
                ""name"": ""Venus"",
                ""full_degree"": 107.4912,
                ""norm_degree"": 17.4912,
                ""sign_id"": 4,
                ""sign"": ""Cancer"",
                ""house"": 9
            },
            {
                ""name"": ""Saturn"",
                ""full_degree"": 67.65575,
                ""norm_degree"": 7.6557,
                ""sign_id"": 3,
                ""sign"": ""Gemini"",
                ""house"": 8
            },
            {
                ""name"": ""Uranus"",
                ""full_degree"": 324.34395,
                ""norm_degree"": 24.344,
                ""sign_id"": 11,
                ""sign"": ""Aquarius"",
                ""house"": 4
            },
            {
                ""name"": ""Neptune"",
                ""full_degree"": 308.19095,
                ""norm_degree"": 8.1909,
                ""sign_id"": 11,
                ""sign"": ""Aquarius"",
                ""house"": 4
            },
            {
                ""name"": ""Pluto"",
                ""full_degree"": 253.56455,
                ""norm_degree"": 13.5645,
                ""sign_id"": 9,
                ""sign"": ""Sagittarius"",
                ""house"": 2
            },
            {
                ""name"": ""Node"",
                ""full_degree"": 96.75815,
                ""norm_degree"": 6.7582,
                ""sign_id"": 4,
                ""sign"": ""Cancer"",
                ""house"": 9
            },
            {
                ""name"": ""Chiron"",
                ""full_degree"": 264.95915,
                ""norm_degree"": 24.9592,
                ""sign_id"": 9,
                ""sign"": ""Sagittarius"",
                ""house"": 2
            },
            {
                ""name"": ""Part of Fortune"",
                ""full_degree"": 217.63925,
                ""norm_degree"": 7.6393,
                ""sign_id"": 8,
                ""sign"": ""Scorpio"",
                ""house"": 1
            }
        ],
        ""houses"": [
            {
                ""house"": 1,
                ""sign"": ""Scorpio"",
                ""degree"": 211.66134499999998
            },
            {
                ""house"": 2,
                ""sign"": ""Gemini"",
                ""degree"": 62.75139
            },
            {
                ""house"": 3,
                ""sign"": ""Gemini"",
                ""degree"": 89.87979
            },
            {
                ""house"": 4,
                ""sign"": ""Cancer"",
                ""degree"": 116.113125
            },
            {
                ""house"": 5,
                ""sign"": ""Leo"",
                ""degree"": 144.53833
            },
            {
                ""house"": 6,
                ""sign"": ""Virgo"",
                ""degree"": 176.57773
            },
            {
                ""house"": 7,
                ""sign"": ""Scorpio"",
                ""degree"": 211.66134499999998
            },
            {
                ""house"": 8,
                ""sign"": ""Sagittarius"",
                ""degree"": 242.75139000000001
            },
            {
                ""house"": 9,
                ""sign"": ""Sagittarius"",
                ""degree"": 269.87979
            },
            {
                ""house"": 10,
                ""sign"": ""Capricorn"",
                ""degree"": 296.11312499999997
            },
            {
                ""house"": 11,
                ""sign"": ""Aquarius"",
                ""degree"": 324.53833
            },
            {
                ""house"": 12,
                ""sign"": ""Virgo"",
                ""degree"": 176.57773
            }
        ],
        ""ascendant"": 211.66134499999998,
        ""midheaven"": 296.11312499999997,
        ""aspects"": [
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Moon"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 1,
                ""aspect_type"": 2,
                ""type"": ""Opposition"",
                ""orb"": 5.98,
                ""diff"": 174.02
            },
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Mars"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 2,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 9.16,
                ""diff"": 9.16
            },
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Mercury"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 3,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 6.74,
                ""diff"": 6.74
            },
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Jupiter"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 4,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 4.9,
                ""diff"": 4.9
            },
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Uranus"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 7,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 4.65,
                ""diff"": 124.65
            },
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Node"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 10,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 7.77,
                ""diff"": 7.77
            },
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Chiron"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 11,
                ""aspect_type"": 2,
                ""type"": ""Opposition"",
                ""orb"": 4.03,
                ""diff"": 175.97
            },
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Ascendant"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 13,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 2.67,
                ""diff"": 122.67
            },
            {
                ""aspecting_planet"": ""Moon"",
                ""aspected_planet"": ""Jupiter"",
                ""aspecting_planet_id"": 1,
                ""aspected_planet_id"": 4,
                ""aspect_type"": 2,
                ""type"": ""Opposition"",
                ""orb"": 1.08,
                ""diff"": 178.92
            },
            {
                ""aspecting_planet"": ""Moon"",
                ""aspected_planet"": ""Uranus"",
                ""aspecting_planet_id"": 1,
                ""aspected_planet_id"": 7,
                ""aspect_type"": 5,
                ""type"": ""Sextile"",
                ""orb"": 1.33,
                ""diff"": 61.33
            },
            {
                ""aspecting_planet"": ""Moon"",
                ""aspected_planet"": ""Pluto"",
                ""aspecting_planet_id"": 1,
                ""aspected_planet_id"": 9,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 9.45,
                ""diff"": 9.45
            },
            {
                ""aspecting_planet"": ""Moon"",
                ""aspected_planet"": ""Chiron"",
                ""aspecting_planet_id"": 1,
                ""aspected_planet_id"": 11,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 1.94,
                ""diff"": 1.94
            },
            {
                ""aspecting_planet"": ""Mars"",
                ""aspected_planet"": ""Mercury"",
                ""aspecting_planet_id"": 2,
                ""aspected_planet_id"": 3,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 2.43,
                ""diff"": 2.43
            },
            {
                ""aspecting_planet"": ""Mars"",
                ""aspected_planet"": ""Venus"",
                ""aspecting_planet_id"": 2,
                ""aspected_planet_id"": 5,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 9.33,
                ""diff"": 9.33
            },
            {
                ""aspecting_planet"": ""Mars"",
                ""aspected_planet"": ""Node"",
                ""aspecting_planet_id"": 2,
                ""aspected_planet_id"": 10,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 1.4,
                ""diff"": 1.4
            },
            {
                ""aspecting_planet"": ""Mars"",
                ""aspected_planet"": ""Part of Fortune"",
                ""aspecting_planet_id"": 2,
                ""aspected_planet_id"": 12,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 0.52,
                ""diff"": 119.48
            },
            {
                ""aspecting_planet"": ""Mars"",
                ""aspected_planet"": ""Ascendant"",
                ""aspecting_planet_id"": 2,
                ""aspected_planet_id"": 13,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 6.5,
                ""diff"": 113.5
            },
            {
                ""aspecting_planet"": ""Mercury"",
                ""aspected_planet"": ""Node"",
                ""aspecting_planet_id"": 3,
                ""aspected_planet_id"": 10,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 1.03,
                ""diff"": 1.03
            },
            {
                ""aspecting_planet"": ""Mercury"",
                ""aspected_planet"": ""Part of Fortune"",
                ""aspecting_planet_id"": 3,
                ""aspected_planet_id"": 12,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 1.91,
                ""diff"": 121.91
            },
            {
                ""aspecting_planet"": ""Mercury"",
                ""aspected_planet"": ""Ascendant"",
                ""aspecting_planet_id"": 3,
                ""aspected_planet_id"": 13,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 4.07,
                ""diff"": 115.93
            },
            {
                ""aspecting_planet"": ""Jupiter"",
                ""aspected_planet"": ""Uranus"",
                ""aspecting_planet_id"": 4,
                ""aspected_planet_id"": 7,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 0.25,
                ""diff"": 119.75
            },
            {
                ""aspecting_planet"": ""Jupiter"",
                ""aspected_planet"": ""Chiron"",
                ""aspecting_planet_id"": 4,
                ""aspected_planet_id"": 11,
                ""aspect_type"": 2,
                ""type"": ""Opposition"",
                ""orb"": 0.86,
                ""diff"": 179.14
            },
            {
                ""aspecting_planet"": ""Jupiter"",
                ""aspected_planet"": ""Ascendant"",
                ""aspecting_planet_id"": 4,
                ""aspected_planet_id"": 13,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 7.56,
                ""diff"": 127.56
            },
            {
                ""aspecting_planet"": ""Venus"",
                ""aspected_planet"": ""Midheaven"",
                ""aspecting_planet_id"": 5,
                ""aspected_planet_id"": 14,
                ""aspect_type"": 2,
                ""type"": ""Opposition"",
                ""orb"": 8.62,
                ""diff"": 171.38
            },
            {
                ""aspecting_planet"": ""Saturn"",
                ""aspected_planet"": ""Neptune"",
                ""aspecting_planet_id"": 6,
                ""aspected_planet_id"": 8,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 0.54,
                ""diff"": 119.46
            },
            {
                ""aspecting_planet"": ""Saturn"",
                ""aspected_planet"": ""Pluto"",
                ""aspecting_planet_id"": 6,
                ""aspected_planet_id"": 9,
                ""aspect_type"": 2,
                ""type"": ""Opposition"",
                ""orb"": 5.91,
                ""diff"": 174.09
            },
            {
                ""aspecting_planet"": ""Uranus"",
                ""aspected_planet"": ""Chiron"",
                ""aspecting_planet_id"": 7,
                ""aspected_planet_id"": 11,
                ""aspect_type"": 5,
                ""type"": ""Sextile"",
                ""orb"": 0.62,
                ""diff"": 59.38
            },
            {
                ""aspecting_planet"": ""Uranus"",
                ""aspected_planet"": ""Ascendant"",
                ""aspecting_planet_id"": 7,
                ""aspected_planet_id"": 13,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 7.32,
                ""diff"": 112.68
            },
            {
                ""aspecting_planet"": ""Neptune"",
                ""aspected_planet"": ""Pluto"",
                ""aspecting_planet_id"": 8,
                ""aspected_planet_id"": 9,
                ""aspect_type"": 5,
                ""type"": ""Sextile"",
                ""orb"": 5.37,
                ""diff"": 54.63
            },
            {
                ""aspecting_planet"": ""Neptune"",
                ""aspected_planet"": ""Part of Fortune"",
                ""aspecting_planet_id"": 8,
                ""aspected_planet_id"": 12,
                ""aspect_type"": 4,
                ""type"": ""Square"",
                ""orb"": 0.55,
                ""diff"": 90.55
            },
            {
                ""aspecting_planet"": ""Neptune"",
                ""aspected_planet"": ""Ascendant"",
                ""aspecting_planet_id"": 8,
                ""aspected_planet_id"": 13,
                ""aspect_type"": 4,
                ""type"": ""Square"",
                ""orb"": 6.53,
                ""diff"": 96.53
            },
            {
                ""aspecting_planet"": ""Node"",
                ""aspected_planet"": ""Part of Fortune"",
                ""aspecting_planet_id"": 10,
                ""aspected_planet_id"": 12,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 0.88,
                ""diff"": 120.88
            },
            {
                ""aspecting_planet"": ""Node"",
                ""aspected_planet"": ""Ascendant"",
                ""aspecting_planet_id"": 10,
                ""aspected_planet_id"": 13,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 5.1,
                ""diff"": 114.9
            },
            {
                ""aspecting_planet"": ""Part of Fortune"",
                ""aspected_planet"": ""Ascendant"",
                ""aspecting_planet_id"": 12,
                ""aspected_planet_id"": 13,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 5.98,
                ""diff"": 5.98
            },
            {
                ""aspecting_planet"": ""Ascendant"",
                ""aspected_planet"": ""Midheaven"",
                ""aspecting_planet_id"": 13,
                ""aspected_planet_id"": 14,
                ""aspect_type"": 4,
                ""type"": ""Square"",
                ""orb"": 5.55,
                ""diff"": 84.45
            }
        ]
    }
}"		
											
western_horoscope			API : https://json.astrologyapi.com/v1/western_horoscope			PAYLOAD : {"hour":1,"min":0,"day":24,"month":7,"year":2002,"lat":22.5706,"lon":88.37132,"tzone":"+05:30"}			"RESULTS : {
    ""planets"": [
        {
            ""name"": ""Sun"",
            ""full_degree"": 120.7857,
            ""norm_degree"": 0.7857,
            ""speed"": 0.9547,
            ""is_retro"": ""false"",
            ""sign_id"": 5,
            ""sign"": ""Leo"",
            ""house"": 3
        },
        {
            ""name"": ""Moon"",
            ""full_degree"": 294.295,
            ""norm_degree"": 24.295,
            ""speed"": 12.889,
            ""is_retro"": ""false"",
            ""sign_id"": 10,
            ""sign"": ""Capricorn"",
            ""house"": 8
        },
        {
            ""name"": ""Mars"",
            ""full_degree"": 126.5393,
            ""norm_degree"": 6.5393,
            ""speed"": 0.6404,
            ""is_retro"": ""false"",
            ""sign_id"": 5,
            ""sign"": ""Leo"",
            ""house"": 3
        },
        {
            ""name"": ""Mercury"",
            ""full_degree"": 123.9658,
            ""norm_degree"": 3.9658,
            ""speed"": 2.0839,
            ""is_retro"": ""false"",
            ""sign_id"": 5,
            ""sign"": ""Leo"",
            ""house"": 3
        },
        {
            ""name"": ""Jupiter"",
            ""full_degree"": 118.0226,
            ""norm_degree"": 28.0226,
            ""speed"": 0.2231,
            ""is_retro"": ""false"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 2
        },
        {
            ""name"": ""Venus"",
            ""full_degree"": 164.4179,
            ""norm_degree"": 14.4179,
            ""speed"": 1.0955,
            ""is_retro"": ""false"",
            ""sign_id"": 6,
            ""sign"": ""Virgo"",
            ""house"": 4
        },
        {
            ""name"": ""Saturn"",
            ""full_degree"": 83.9703,
            ""norm_degree"": 23.9703,
            ""speed"": 0.1129,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 1
        },
        {
            ""name"": ""Uranus"",
            ""full_degree"": 327.8866,
            ""norm_degree"": 27.8866,
            ""speed"": -0.034,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 10
        },
        {
            ""name"": ""Neptune"",
            ""full_degree"": 309.8325,
            ""norm_degree"": 9.8325,
            ""speed"": -0.0267,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 9
        },
        {
            ""name"": ""Pluto"",
            ""full_degree"": 255.1901,
            ""norm_degree"": 15.1901,
            ""speed"": -0.0165,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 7
        },
        {
            ""name"": ""Node"",
            ""full_degree"": 77.216,
            ""norm_degree"": 17.216,
            ""speed"": -0.0886,
            ""is_retro"": ""true"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 1
        },
        {
            ""name"": ""Chiron"",
            ""full_degree"": 274.574,
            ""norm_degree"": 4.574,
            ""speed"": -0.0543,
            ""is_retro"": ""true"",
            ""sign_id"": 10,
            ""sign"": ""Capricorn"",
            ""house"": 7
        },
        {
            ""name"": ""Part of Fortune"",
            ""full_degree"": 257.5264,
            ""norm_degree"": 17.5264,
            ""speed"": 0,
            ""is_retro"": ""false"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 7
        }
    ],
    ""houses"": [
        {
            ""house"": 1,
            ""sign"": ""Gemini"",
            ""sign_id"": 3,
            ""degree"": 71.03565
        },
        {
            ""house"": 2,
            ""sign"": ""Cancer"",
            ""sign_id"": 4,
            ""degree"": 96.08341
        },
        {
            ""house"": 3,
            ""sign"": ""Leo"",
            ""sign_id"": 5,
            ""degree"": 120.46019
        },
        {
            ""house"": 4,
            ""sign"": ""Leo"",
            ""sign_id"": 5,
            ""degree"": 147.55982
        },
        {
            ""house"": 5,
            ""sign"": ""Virgo"",
            ""sign_id"": 6,
            ""degree"": 179.71154
        },
        {
            ""house"": 6,
            ""sign"": ""Scorpio"",
            ""sign_id"": 8,
            ""degree"": 215.87244
        },
        {
            ""house"": 7,
            ""sign"": ""Sagittarius"",
            ""sign_id"": 9,
            ""degree"": 251.03565
        },
        {
            ""house"": 8,
            ""sign"": ""Capricorn"",
            ""sign_id"": 10,
            ""degree"": 276.08341
        },
        {
            ""house"": 9,
            ""sign"": ""Aquarius"",
            ""sign_id"": 11,
            ""degree"": 300.46019
        },
        {
            ""house"": 10,
            ""sign"": ""Aquarius"",
            ""sign_id"": 11,
            ""degree"": 327.55982
        },
        {
            ""house"": 11,
            ""sign"": ""Pisces"",
            ""sign_id"": 12,
            ""degree"": 359.71154
        },
        {
            ""house"": 12,
            ""sign"": ""Taurus"",
            ""sign_id"": 2,
            ""degree"": 35.87244
        }
    ],
    ""ascendant"": 71.03565456897975,
    ""midheaven"": 327.5598198535195,
    ""vertex"": 211.32869379691815,
    ""lilith"": {
        ""name"": ""Lilith"",
        ""full_degree"": 7.5172,
        ""norm_degree"": 7.5172,
        ""speed"": 0.1119,
        ""is_retro"": ""false"",
        ""sign_id"": 1,
        ""sign"": ""Aries"",
        ""house"": 11
    },
    ""aspects"": [
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Moon"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 1,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 6.49,
            ""diff"": 173.51
        },
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Mars"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 2,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 5.75,
            ""diff"": 5.75
        },
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Mercury"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 3,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 3.18,
            ""diff"": 3.18
        },
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Jupiter"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 4,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 2.76,
            ""diff"": 2.76
        },
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Neptune"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 8,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 9.05,
            ""diff"": 170.95
        },
        {
            ""aspecting_planet"": ""Moon"",
            ""aspected_planet"": ""Mercury"",
            ""aspecting_planet_id"": 1,
            ""aspected_planet_id"": 3,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 9.67,
            ""diff"": 170.33
        },
        {
            ""aspecting_planet"": ""Moon"",
            ""aspected_planet"": ""Jupiter"",
            ""aspecting_planet_id"": 1,
            ""aspected_planet_id"": 4,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 3.73,
            ""diff"": 176.27
        },
        {
            ""aspecting_planet"": ""Mars"",
            ""aspected_planet"": ""Mercury"",
            ""aspecting_planet_id"": 2,
            ""aspected_planet_id"": 3,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 2.57,
            ""diff"": 2.57
        },
        {
            ""aspecting_planet"": ""Mars"",
            ""aspected_planet"": ""Jupiter"",
            ""aspecting_planet_id"": 2,
            ""aspected_planet_id"": 4,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 8.52,
            ""diff"": 8.52
        },
        {
            ""aspecting_planet"": ""Mars"",
            ""aspected_planet"": ""Neptune"",
            ""aspecting_planet_id"": 2,
            ""aspected_planet_id"": 8,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 3.29,
            ""diff"": 176.71
        },
        {
            ""aspecting_planet"": ""Mars"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 2,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 5,
            ""type"": ""Sextile"",
            ""orb"": 4.5,
            ""diff"": 55.5
        },
        {
            ""aspecting_planet"": ""Mercury"",
            ""aspected_planet"": ""Jupiter"",
            ""aspecting_planet_id"": 3,
            ""aspected_planet_id"": 4,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 5.94,
            ""diff"": 5.94
        },
        {
            ""aspecting_planet"": ""Mercury"",
            ""aspected_planet"": ""Neptune"",
            ""aspecting_planet_id"": 3,
            ""aspected_planet_id"": 8,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 5.87,
            ""diff"": 174.13
        },
        {
            ""aspecting_planet"": ""Venus"",
            ""aspected_planet"": ""Pluto"",
            ""aspecting_planet_id"": 5,
            ""aspected_planet_id"": 9,
            ""aspect_type"": 4,
            ""type"": ""Square"",
            ""orb"": 0.77,
            ""diff"": 90.77
        },
        {
            ""aspecting_planet"": ""Venus"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 5,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 4,
            ""type"": ""Square"",
            ""orb"": 3.38,
            ""diff"": 93.38
        },
        {
            ""aspecting_planet"": ""Saturn"",
            ""aspected_planet"": ""Uranus"",
            ""aspecting_planet_id"": 6,
            ""aspected_planet_id"": 7,
            ""aspect_type"": 3,
            ""type"": ""Trine"",
            ""orb"": 3.92,
            ""diff"": 116.08
        },
        {
            ""aspecting_planet"": ""Saturn"",
            ""aspected_planet"": ""Pluto"",
            ""aspecting_planet_id"": 6,
            ""aspected_planet_id"": 9,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 8.78,
            ""diff"": 171.22
        },
        {
            ""aspecting_planet"": ""Saturn"",
            ""aspected_planet"": ""Midheaven"",
            ""aspecting_planet_id"": 6,
            ""aspected_planet_id"": 11,
            ""aspect_type"": 3,
            ""type"": ""Trine"",
            ""orb"": 3.59,
            ""diff"": 116.41
        },
        {
            ""aspecting_planet"": ""Uranus"",
            ""aspected_planet"": ""Midheaven"",
            ""aspecting_planet_id"": 7,
            ""aspected_planet_id"": 11,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 0.33,
            ""diff"": 0.33
        },
        {
            ""aspecting_planet"": ""Neptune"",
            ""aspected_planet"": ""Pluto"",
            ""aspecting_planet_id"": 8,
            ""aspected_planet_id"": 9,
            ""aspect_type"": 5,
            ""type"": ""Sextile"",
            ""orb"": 5.36,
            ""diff"": 54.64
        },
        {
            ""aspecting_planet"": ""Neptune"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 8,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 3,
            ""type"": ""Trine"",
            ""orb"": 1.2,
            ""diff"": 121.2
        },
        {
            ""aspecting_planet"": ""Pluto"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 9,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 4.15,
            ""diff"": 175.85
        }
    ]
}"		
											
western_horoscope			API : https://json.astrologyapi.com/v1/western_horoscope			PAYLOAD : {"hour":1,"min":0,"day":18,"month":5,"year":2000,"lat":22.5706,"lon":88.37132,"tzone":"+05:30"}			"RESULTS : {
    ""planets"": [
        {
            ""name"": ""Sun"",
            ""full_degree"": 57.2003,
            ""norm_degree"": 27.2003,
            ""speed"": 0.9629,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 2
        },
        {
            ""name"": ""Moon"",
            ""full_degree"": 231.7352,
            ""norm_degree"": 21.7352,
            ""speed"": 12.3389,
            ""is_retro"": ""false"",
            ""sign_id"": 8,
            ""sign"": ""Scorpio"",
            ""house"": 8
        },
        {
            ""name"": ""Mars"",
            ""full_degree"": 69.7763,
            ""norm_degree"": 9.7763,
            ""speed"": 0.6914,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 3
        },
        {
            ""name"": ""Mercury"",
            ""full_degree"": 67.4912,
            ""norm_degree"": 7.4912,
            ""speed"": 2.0745,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 3
        },
        {
            ""name"": ""Jupiter"",
            ""full_degree"": 50.172,
            ""norm_degree"": 20.172,
            ""speed"": 0.2368,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 2
        },
        {
            ""name"": ""Venus"",
            ""full_degree"": 50.5645,
            ""norm_degree"": 20.5645,
            ""speed"": 1.2292,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 2
        },
        {
            ""name"": ""Saturn"",
            ""full_degree"": 51.3412,
            ""norm_degree"": 21.3412,
            ""speed"": 0.1283,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 2
        },
        {
            ""name"": ""Uranus"",
            ""full_degree"": 320.8013,
            ""norm_degree"": 20.8013,
            ""speed"": 0.0061,
            ""is_retro"": ""false"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 12
        },
        {
            ""name"": ""Neptune"",
            ""full_degree"": 306.5494,
            ""norm_degree"": 6.5494,
            ""speed"": -0.005,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 11
        },
        {
            ""name"": ""Pluto"",
            ""full_degree"": 251.939,
            ""norm_degree"": 11.939,
            ""speed"": -0.0259,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 9
        },
        {
            ""name"": ""Node"",
            ""full_degree"": 116.3003,
            ""norm_degree"": 26.3003,
            ""speed"": -0.1751,
            ""is_retro"": ""true"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 5
        },
        {
            ""name"": ""Chiron"",
            ""full_degree"": 255.3443,
            ""norm_degree"": 15.3443,
            ""speed"": -0.0653,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 9
        },
        {
            ""name"": ""Part of Fortune"",
            ""full_degree"": 177.7521,
            ""norm_degree"": 27.7521,
            ""speed"": 0,
            ""is_retro"": ""false"",
            ""sign_id"": 6,
            ""sign"": ""Virgo"",
            ""house"": 7
        }
    ],
    ""houses"": [
        {
            ""house"": 1,
            ""sign"": ""Pisces"",
            ""sign_id"": 12,
            ""degree"": 352.28704
        },
        {
            ""house"": 2,
            ""sign"": ""Aries"",
            ""sign_id"": 1,
            ""degree"": 29.41937
        },
        {
            ""house"": 3,
            ""sign"": ""Taurus"",
            ""sign_id"": 2,
            ""degree"": 59.29939
        },
        {
            ""house"": 4,
            ""sign"": ""Gemini"",
            ""sign_id"": 3,
            ""degree"": 84.66643
        },
        {
            ""house"": 5,
            ""sign"": ""Cancer"",
            ""sign_id"": 4,
            ""degree"": 109.36512
        },
        {
            ""house"": 6,
            ""sign"": ""Leo"",
            ""sign_id"": 5,
            ""degree"": 137.28302
        },
        {
            ""house"": 7,
            ""sign"": ""Virgo"",
            ""sign_id"": 6,
            ""degree"": 172.28704
        },
        {
            ""house"": 8,
            ""sign"": ""Libra"",
            ""sign_id"": 7,
            ""degree"": 209.41937
        },
        {
            ""house"": 9,
            ""sign"": ""Scorpio"",
            ""sign_id"": 8,
            ""degree"": 239.29939
        },
        {
            ""house"": 10,
            ""sign"": ""Sagittarius"",
            ""sign_id"": 9,
            ""degree"": 264.66643
        },
        {
            ""house"": 11,
            ""sign"": ""Capricorn"",
            ""sign_id"": 10,
            ""degree"": 289.36512
        },
        {
            ""house"": 12,
            ""sign"": ""Aquarius"",
            ""sign_id"": 11,
            ""degree"": 317.28302
        }
    ],
    ""ascendant"": 352.28704269998116,
    ""midheaven"": 264.6664338718442,
    ""vertex"": 176.90088242133072,
    ""lilith"": {
        ""name"": ""Lilith"",
        ""full_degree"": 278.7196,
        ""norm_degree"": 8.7196,
        ""speed"": 0.1109,
        ""is_retro"": ""false"",
        ""sign_id"": 10,
        ""sign"": ""Capricorn"",
        ""house"": 10
    },
    ""aspects"": [
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Moon"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 1,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 5.47,
            ""diff"": 174.53
        },
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Jupiter"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 4,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 7.03,
            ""diff"": 7.03
        },
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Venus"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 5,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 6.64,
            ""diff"": 6.64
        },
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Saturn"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 6,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 5.86,
            ""diff"": 5.86
        },
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Uranus"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 7,
            ""aspect_type"": 4,
            ""type"": ""Square"",
            ""orb"": 6.4,
            ""diff"": 96.4
        },
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 5,
            ""type"": ""Sextile"",
            ""orb"": 4.91,
            ""diff"": 64.91
        },
        {
            ""aspecting_planet"": ""Moon"",
            ""aspected_planet"": ""Jupiter"",
            ""aspecting_planet_id"": 1,
            ""aspected_planet_id"": 4,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 1.56,
            ""diff"": 178.44
        },
        {
            ""aspecting_planet"": ""Moon"",
            ""aspected_planet"": ""Venus"",
            ""aspecting_planet_id"": 1,
            ""aspected_planet_id"": 5,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 1.17,
            ""diff"": 178.83
        },
        {
            ""aspecting_planet"": ""Moon"",
            ""aspected_planet"": ""Saturn"",
            ""aspecting_planet_id"": 1,
            ""aspected_planet_id"": 6,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 0.39,
            ""diff"": 179.61
        },
        {
            ""aspecting_planet"": ""Moon"",
            ""aspected_planet"": ""Uranus"",
            ""aspecting_planet_id"": 1,
            ""aspected_planet_id"": 7,
            ""aspect_type"": 4,
            ""type"": ""Square"",
            ""orb"": 0.93,
            ""diff"": 89.07
        },
        {
            ""aspecting_planet"": ""Moon"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 1,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 3,
            ""type"": ""Trine"",
            ""orb"": 0.55,
            ""diff"": 120.55
        },
        {
            ""aspecting_planet"": ""Mars"",
            ""aspected_planet"": ""Mercury"",
            ""aspecting_planet_id"": 2,
            ""aspected_planet_id"": 3,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 2.29,
            ""diff"": 2.29
        },
        {
            ""aspecting_planet"": ""Mars"",
            ""aspected_planet"": ""Neptune"",
            ""aspecting_planet_id"": 2,
            ""aspected_planet_id"": 8,
            ""aspect_type"": 3,
            ""type"": ""Trine"",
            ""orb"": 3.23,
            ""diff"": 123.23
        },
        {
            ""aspecting_planet"": ""Mars"",
            ""aspected_planet"": ""Pluto"",
            ""aspecting_planet_id"": 2,
            ""aspected_planet_id"": 9,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 2.16,
            ""diff"": 177.84
        },
        {
            ""aspecting_planet"": ""Mercury"",
            ""aspected_planet"": ""Neptune"",
            ""aspecting_planet_id"": 3,
            ""aspected_planet_id"": 8,
            ""aspect_type"": 3,
            ""type"": ""Trine"",
            ""orb"": 0.94,
            ""diff"": 120.94
        },
        {
            ""aspecting_planet"": ""Mercury"",
            ""aspected_planet"": ""Pluto"",
            ""aspecting_planet_id"": 3,
            ""aspected_planet_id"": 9,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 4.45,
            ""diff"": 175.55
        },
        {
            ""aspecting_planet"": ""Jupiter"",
            ""aspected_planet"": ""Venus"",
            ""aspecting_planet_id"": 4,
            ""aspected_planet_id"": 5,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 0.39,
            ""diff"": 0.39
        },
        {
            ""aspecting_planet"": ""Jupiter"",
            ""aspected_planet"": ""Saturn"",
            ""aspecting_planet_id"": 4,
            ""aspected_planet_id"": 6,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 1.17,
            ""diff"": 1.17
        },
        {
            ""aspecting_planet"": ""Jupiter"",
            ""aspected_planet"": ""Uranus"",
            ""aspecting_planet_id"": 4,
            ""aspected_planet_id"": 7,
            ""aspect_type"": 4,
            ""type"": ""Square"",
            ""orb"": 0.63,
            ""diff"": 89.37
        },
        {
            ""aspecting_planet"": ""Jupiter"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 4,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 5,
            ""type"": ""Sextile"",
            ""orb"": 2.12,
            ""diff"": 57.88
        },
        {
            ""aspecting_planet"": ""Venus"",
            ""aspected_planet"": ""Saturn"",
            ""aspecting_planet_id"": 5,
            ""aspected_planet_id"": 6,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 0.78,
            ""diff"": 0.78
        },
        {
            ""aspecting_planet"": ""Venus"",
            ""aspected_planet"": ""Uranus"",
            ""aspecting_planet_id"": 5,
            ""aspected_planet_id"": 7,
            ""aspect_type"": 4,
            ""type"": ""Square"",
            ""orb"": 0.24,
            ""diff"": 89.76
        },
        {
            ""aspecting_planet"": ""Venus"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 5,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 5,
            ""type"": ""Sextile"",
            ""orb"": 1.72,
            ""diff"": 58.28
        },
        {
            ""aspecting_planet"": ""Saturn"",
            ""aspected_planet"": ""Uranus"",
            ""aspecting_planet_id"": 6,
            ""aspected_planet_id"": 7,
            ""aspect_type"": 4,
            ""type"": ""Square"",
            ""orb"": 0.54,
            ""diff"": 90.54
        },
        {
            ""aspecting_planet"": ""Saturn"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 6,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 5,
            ""type"": ""Sextile"",
            ""orb"": 0.95,
            ""diff"": 59.05
        },
        {
            ""aspecting_planet"": ""Uranus"",
            ""aspected_planet"": ""Midheaven"",
            ""aspecting_planet_id"": 7,
            ""aspected_planet_id"": 11,
            ""aspect_type"": 5,
            ""type"": ""Sextile"",
            ""orb"": 3.87,
            ""diff"": 56.13
        },
        {
            ""aspecting_planet"": ""Neptune"",
            ""aspected_planet"": ""Pluto"",
            ""aspecting_planet_id"": 8,
            ""aspected_planet_id"": 9,
            ""aspect_type"": 5,
            ""type"": ""Sextile"",
            ""orb"": 5.39,
            ""diff"": 54.61
        },
        {
            ""aspecting_planet"": ""Ascendant"",
            ""aspected_planet"": ""Midheaven"",
            ""aspecting_planet_id"": 10,
            ""aspected_planet_id"": 11,
            ""aspect_type"": 4,
            ""type"": ""Square"",
            ""orb"": 2.38,
            ""diff"": 87.62
        }
    ]
}"		
											
monthly			API : https://json.astrologyapi.com/v1/tropical_transits/monthly			PAYLOAD : {"hour":1,"min":0,"day":24,"month":7,"year":2002,"lat":22.5706,"lon":88.37132,"tzone":"+05:30"}			"RESULTS : {
    ""month_start_date"": ""1-7-2025"",
    ""month_end_date"": ""31-7-2025"",
    ""ascendant"": ""Gemini"",
    ""transit_relation"": [
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Moon"",
            ""type"": ""Trine"",
            ""orb"": 2.02,
            ""date"": ""1-7-2025""
        },
        {
            ""transit_planet"": ""Pluto"",
            ""natal_planet"": ""Mercury"",
            ""type"": ""Opposition"",
            ""orb"": 0.83,
            ""date"": ""1-7-2025""
        },
        {
            ""transit_planet"": ""Mercury"",
            ""natal_planet"": ""Mars"",
            ""type"": ""Conjunction"",
            ""orb"": 0.03,
            ""date"": ""2-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Sun"",
            ""type"": ""Sextile"",
            ""orb"": 0.07,
            ""date"": ""5-7-2025""
        },
        {
            ""transit_planet"": ""Mars"",
            ""natal_planet"": ""Ascendant"",
            ""type"": ""Square"",
            ""orb"": 0.19,
            ""date"": ""6-7-2025""
        },
        {
            ""transit_planet"": ""Mars"",
            ""natal_planet"": ""Venus"",
            ""type"": ""Conjunction"",
            ""orb"": 0.03,
            ""date"": ""12-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Ascendant"",
            ""type"": ""Conjunction"",
            ""orb"": 0.29,
            ""date"": ""14-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Saturn"",
            ""type"": ""Conjunction"",
            ""orb"": 0.41,
            ""date"": ""26-7-2025""
        },
        {
            ""transit_planet"": ""Uranus"",
            ""natal_planet"": ""Sun"",
            ""type"": ""Sextile"",
            ""orb"": 0.01,
            ""date"": ""27-7-2025""
        },
        {
            ""transit_planet"": ""Mars"",
            ""natal_planet"": ""Moon"",
            ""type"": ""Trine"",
            ""orb"": 0.27,
            ""date"": ""28-7-2025""
        },
        {
            ""transit_planet"": ""Mercury"",
            ""natal_planet"": ""Ascendant"",
            ""type"": ""Sextile"",
            ""orb"": 0.03,
            ""date"": ""29-7-2025""
        },
        {
            ""transit_planet"": ""Saturn"",
            ""natal_planet"": ""Sun"",
            ""type"": ""Trine"",
            ""orb"": 0.87,
            ""date"": ""31-7-2025""
        }
    ],
    ""retrogrades"": [],
    ""moon_phase"": []
}"		
											
monthly			API : https://json.astrologyapi.com/v1/tropical_transits/monthly			PAYLOAD : {"hour":1,"min":0,"day":18,"month":5,"year":2000,"lat":22.5706,"lon":88.37132,"tzone":"+05:30"}			"RESULTS : {
    ""month_start_date"": ""1-7-2025"",
    ""month_end_date"": ""31-7-2025"",
    ""ascendant"": ""Pisces"",
    ""transit_relation"": [
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Moon"",
            ""type"": ""Opposition"",
            ""orb"": 4.58,
            ""date"": ""1-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Sun"",
            ""type"": ""Conjunction"",
            ""orb"": 0.21,
            ""date"": ""2-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Mercury"",
            ""type"": ""Conjunction"",
            ""orb"": 0.11,
            ""date"": ""11-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Mars"",
            ""type"": ""Conjunction"",
            ""orb"": 0.16,
            ""date"": ""13-7-2025""
        },
        {
            ""transit_planet"": ""Mars"",
            ""natal_planet"": ""Moon"",
            ""type"": ""Sextile"",
            ""orb"": 0.15,
            ""date"": ""24-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Ascendant"",
            ""type"": ""Square"",
            ""orb"": 0.19,
            ""date"": ""24-7-2025""
        },
        {
            ""transit_planet"": ""Mars"",
            ""natal_planet"": ""Ascendant"",
            ""type"": ""Opposition"",
            ""orb"": 0.09,
            ""date"": ""25-7-2025""
        }
    ],
    ""retrogrades"": [],
    ""moon_phase"": []
}"		
											
Synastry Horoscope			API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for a To conduct a detailed synastry chart analysis, you will need precise birth data from both parties, including the exact birth time, date, and location, to accurately calculate their astrological charts. Start by examining the aspects between each person's personal planets (Sun, Moon, Venus, Mars) and the other's outer planets (Jupiter, Saturn, Uranus, Neptune, Pluto) to uncover dynamics of attraction, compatibility, and potential friction points. Assess the house overlays by noting where each individual's planets land in the other’s astrological houses, which sheds light on the influence they exert over various life areas of their partner. Analyze the interactions between each person's Ascendant (self-expression) and Descendant (partnership qualities) to gauge core compatibility and relational dynamics. Additionally, explore the North and South Nodes to delve into themes of karmic connections or shared life purposes. Utilizing advanced astrology software or reliable online resources can facilitate this complex analysis, while reference books from respected astrologers can provide deeper interpretive frameworks. For a nuanced understanding, especially in complicated synastry situations, consulting with a professional astrologer is advisable.","user_content":"I was born on August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on  June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30' I have added birth chart details of mine and my love relationship partner both now calculate our synastry chart of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 3 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response  "},"toolname":"other","json":{"first":[{"name":"Sun","full_degree":57.2003,"norm_degree":27.2003,"speed":0.9629,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Moon","full_degree":231.7352,"norm_degree":21.7352,"speed":12.3389,"is_retro":"false","sign_id":8,"sign":"Scorpio","house":8},{"name":"Mars","full_degree":69.7763,"norm_degree":9.7763,"speed":0.6914,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Mercury","full_degree":67.4912,"norm_degree":7.4912,"speed":2.0745,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Jupiter","full_degree":50.172,"norm_degree":20.172,"speed":0.2368,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Venus","full_degree":50.5645,"norm_degree":20.5645,"speed":1.2292,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Saturn","full_degree":51.3412,"norm_degree":21.3412,"speed":0.1283,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Uranus","full_degree":320.8013,"norm_degree":20.8013,"speed":0.0061,"is_retro":"false","sign_id":11,"sign":"Aquarius","house":12},{"name":"Neptune","full_degree":306.5494,"norm_degree":6.5494,"speed":-0.005,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":11},{"name":"Pluto","full_degree":251.939,"norm_degree":11.939,"speed":-0.0259,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Node","full_degree":116.3003,"norm_degree":26.3003,"speed":-0.1751,"is_retro":"true","sign_id":4,"sign":"Cancer","house":5},{"name":"Chiron","full_degree":255.3443,"norm_degree":15.3443,"speed":-0.0653,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Part of Fortune","full_degree":177.7521,"norm_degree":27.7521,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":7}],"second":[{"name":"Sun","full_degree":120.7857,"norm_degree":0.7857,"speed":0.9547,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Moon","full_degree":294.295,"norm_degree":24.295,"speed":12.889,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":8},{"name":"Mars","full_degree":126.5393,"norm_degree":6.5393,"speed":0.6404,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Mercury","full_degree":123.9658,"norm_degree":3.9658,"speed":2.0839,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Jupiter","full_degree":118.0226,"norm_degree":28.0226,"speed":0.2231,"is_retro":"false","sign_id":4,"sign":"Cancer","house":2},{"name":"Venus","full_degree":164.4179,"norm_degree":14.4179,"speed":1.0955,"is_retro":"false","sign_id":6,"sign":"Virgo","house":4},{"name":"Saturn","full_degree":83.9703,"norm_degree":23.9703,"speed":0.1129,"is_retro":"false","sign_id":3,"sign":"Gemini","house":1},{"name":"Uranus","full_degree":327.8866,"norm_degree":27.8866,"speed":-0.034,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":10},{"name":"Neptune","full_degree":309.8325,"norm_degree":9.8325,"speed":-0.0267,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":9},{"name":"Pluto","full_degree":255.1901,"norm_degree":15.1901,"speed":-0.0165,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":7},{"name":"Node","full_degree":77.216,"norm_degree":17.216,"speed":-0.0886,"is_retro":"true","sign_id":3,"sign":"Gemini","house":1},{"name":"Chiron","full_degree":274.574,"norm_degree":4.574,"speed":-0.0543,"is_retro":"true","sign_id":10,"sign":"Capricorn","house":7},{"name":"Part of Fortune","full_degree":257.5264,"norm_degree":17.5264,"speed":0,"is_retro":"false","sign_id":9,"sign":"Sagittarius","house":7}],"synastry":{"house_1":[{"name":"Sun","synastry_house":12},{"name":"Moon","synastry_house":6},{"name":"Mars","synastry_house":12},{"name":"Mercury","synastry_house":12},{"name":"Jupiter","synastry_house":12},{"name":"Venus","synastry_house":12},{"name":"Saturn","synastry_house":12},{"name":"Uranus","synastry_house":9},{"name":"Neptune","synastry_house":9},{"name":"Pluto","synastry_house":7},{"name":"Node","synastry_house":2},{"name":"Chiron","synastry_house":7},{"name":"Part of Fortune","synastry_house":4}],"house_2":[{"name":"Sun","synastry_house":5},{"name":"Moon","synastry_house":11},{"name":"Mars","synastry_house":5},{"name":"Mercury","synastry_house":5},{"name":"Jupiter","synastry_house":5},{"name":"Venus","synastry_house":6},{"name":"Saturn","synastry_house":3},{"name":"Uranus","synastry_house":12},{"name":"Neptune","synastry_house":11},{"name":"Pluto","synastry_house":9},{"name":"Node","synastry_house":3},{"name":"Chiron","synastry_house":10},{"name":"Part of Fortune","synastry_house":9}],"aspects":[{"first":"Sun","second":"Sun","type":"Sextile","orb":3.59},{"first":"Sun","second":"Moon","type":"Trine","orb":2.91},{"first":"Sun","second":"Mars","type":"Sextile","orb":9.34},{"first":"Sun","second":"Mercury","type":"Sextile","orb":6.77},{"first":"Sun","second":"Jupiter","type":"Sextile","orb":0.82},{"first":"Sun","second":"Uranus","type":"Square","orb":0.69},{"first":"Sun","second":"Midheaven","type":"Square","orb":0.36},{"first":"Moon","second":"Sun","type":"Trine","orb":9.05},{"first":"Moon","second":"Moon","type":"Sextile","orb":2.56},{"first":"Moon","second":"Jupiter","type":"Trine","orb":6.29},{"first":"Moon","second":"Venus","type":"Sextile","orb":7.32},{"first":"Moon","second":"Saturn","type":"Quincunx","orb":2.24},{"first":"Moon","second":"Uranus","type":"Square","orb":6.15},{"first":"Moon","second":"Chiron","type":"Semi Square","orb":2.16},{"first":"Moon","second":"Midheaven","type":"Square","orb":5.82},{"first":"Mars","second":"Sun","type":"Sextile","orb":8.99},{"first":"Mars","second":"Mars","type":"Sextile","orb":3.24},{"first":"Mars","second":"Mercury","type":"Sextile","orb":5.81},{"first":"Mars","second":"Venus","type":"Square","orb":4.64},{"first":"Mars","second":"Neptune","type":"Trine","orb":0.06},{"first":"Mars","second":"Pluto","type":"Opposition","orb":5.41},{"first":"Mars","second":"Node","type":"Conjunction","orb":7.44},{"first":"Mars","second":"Part of Fortune","type":"Opposition","orb":7.75},{"first":"Mars","second":"Ascendant","type":"Conjunction","orb":1.26},{"first":"Mars","second":"Descendant","type":"Opposition","orb":1.26},{"first":"Mercury","second":"Sun","type":"Sextile","orb":6.71},{"first":"Mercury","second":"Mars","type":"Sextile","orb":0.95},{"first":"Mercury","second":"Mercury","type":"Sextile","orb":3.53},{"first":"Mercury","second":"Jupiter","type":"Sextile","orb":9.47},{"first":"Mercury","second":"Venus","type":"Square","orb":6.93},{"first":"Mercury","second":"Uranus","type":"Square","orb":9.6},{"first":"Mercury","second":"Neptune","type":"Trine","orb":2.34},{"first":"Mercury","second":"Pluto","type":"Opposition","orb":7.7},{"first":"Mercury","second":"Node","type":"Conjunction","orb":9.72},{"first":"Mercury","second":"Chiron","type":"Quincunx","orb":2.92},{"first":"Mercury","second":"Ascendant","type":"Conjunction","orb":3.54},{"first":"Mercury","second":"Midheaven","type":"Square","orb":9.93},{"first":"Mercury","second":"Descendant","type":"Opposition","orb":3.54},{"first":"Jupiter","second":"Sun","type":"Quintile","orb":1.39},{"first":"Jupiter","second":"Moon","type":"Trine","orb":4.12},{"first":"Jupiter","second":"Mercury","type":"Quintile","orb":1.79},{"first":"Jupiter","second":"Jupiter","type":"Sextile","orb":7.85},{"first":"Jupiter","second":"Venus","type":"Trine","orb":5.75},{"first":"Jupiter","second":"Uranus","type":"Square","orb":7.71},{"first":"Jupiter","second":"Node","type":"Semi Sextile","orb":2.96},{"first":"Jupiter","second":"Part of Fortune","type":"Quincunx","orb":2.65},{"first":"Jupiter","second":"Midheaven","type":"Square","orb":7.39},{"first":"Venus","second":"Sun","type":"Quintile","orb":1.78},{"first":"Venus","second":"Moon","type":"Trine","orb":3.73},{"first":"Venus","second":"Mercury","type":"Quintile","orb":1.4},{"first":"Venus","second":"Jupiter","type":"Sextile","orb":7.46},{"first":"Venus","second":"Venus","type":"Trine","orb":6.15},{"first":"Venus","second":"Uranus","type":"Square","orb":7.32},{"first":"Venus","second":"Midheaven","type":"Square","orb":7},{"first":"Saturn","second":"Sun","type":"Sextile","orb":9.44},{"first":"Saturn","second":"Moon","type":"Trine","orb":2.95},{"first":"Saturn","second":"Mercury","type":"Quintile","orb":0.62},{"first":"Saturn","second":"Jupiter","type":"Sextile","orb":6.68},{"first":"Saturn","second":"Venus","type":"Trine","orb":6.92},{"first":"Saturn","second":"Saturn","type":"Semi Sextile","orb":2.63},{"first":"Saturn","second":"Uranus","type":"Square","orb":6.55},{"first":"Saturn","second":"Midheaven","type":"Square","orb":6.22},{"first":"Uranus","second":"Saturn","type":"Trine","orb":3.17},{"first":"Uranus","second":"Uranus","type":"Conjunction","orb":7.09},{"first":"Uranus","second":"Pluto","type":"Sextile","orb":5.61},{"first":"Uranus","second":"Node","type":"Trine","orb":3.59},{"first":"Uranus","second":"Chiron","type":"Semi Square","orb":1.23},{"first":"Uranus","second":"Part of Fortune","type":"Sextile","orb":3.27},{"first":"Uranus","second":"Ascendant","type":"Trine","orb":9.77},{"first":"Uranus","second":"Midheaven","type":"Conjunction","orb":6.76},{"first":"Uranus","second":"Descendant","type":"Sextile","orb":9.77},{"first":"Neptune","second":"Sun","type":"Opposition","orb":5.76},{"first":"Neptune","second":"Mars","type":"Opposition","orb":0.01},{"first":"Neptune","second":"Mercury","type":"Opposition","orb":2.58},{"first":"Neptune","second":"Jupiter","type":"Opposition","orb":8.53},{"first":"Neptune","second":"Neptune","type":"Conjunction","orb":3.28},{"first":"Neptune","second":"Pluto","type":"Sextile","orb":8.64},{"first":"Neptune","second":"Chiron","type":"Semi Sextile","orb":1.98},{"first":"Neptune","second":"Ascendant","type":"Trine","orb":4.49},{"first":"Neptune","second":"Descendant","type":"Sextile","orb":4.49},{"first":"Pluto","second":"Moon","type":"Semi Square","orb":2.64},{"first":"Pluto","second":"Mars","type":"Trine","orb":5.4},{"first":"Pluto","second":"Mercury","type":"Trine","orb":7.97},{"first":"Pluto","second":"Venus","type":"Square","orb":2.48},{"first":"Pluto","second":"Neptune","type":"Sextile","orb":2.11},{"first":"Pluto","second":"Pluto","type":"Conjunction","orb":3.25},{"first":"Pluto","second":"Node","type":"Opposition","orb":5.28},{"first":"Pluto","second":"Part of Fortune","type":"Conjunction","orb":5.59},{"first":"Pluto","second":"Ascendant","type":"Opposition","orb":0.9},{"first":"Pluto","second":"Descendant","type":"Conjunction","orb":0.9},{"first":"Node","second":"Sun","type":"Conjunction","orb":4.49},{"first":"Node","second":"Moon","type":"Opposition","orb":2.01},{"first":"Node","second":"Mercury","type":"Conjunction","orb":7.67},{"first":"Node","second":"Jupiter","type":"Conjunction","orb":1.72},{"first":"Node","second":"Saturn","type":"Semi Sextile","orb":2.33},{"first":"Node","second":"Uranus","type":"Quincunx","orb":1.59},{"first":"Node","second":"Ascendant","type":"Semi Square","orb":0.26},{"first":"Node","second":"Midheaven","type":"Quincunx","orb":1.26},{"first":"Chiron","second":"Mars","type":"Trine","orb":8.81},{"first":"Chiron","second":"Venus","type":"Square","orb":0.93},{"first":"Chiron","second":"Saturn","type":"Opposition","orb":8.63},{"first":"Chiron","second":"Uranus","type":"Quintile","orb":0.54},{"first":"Chiron","second":"Neptune","type":"Sextile","orb":5.51},{"first":"Chiron","second":"Pluto","type":"Conjunction","orb":0.15},{"first":"Chiron","second":"Node","type":"Opposition","orb":1.87},{"first":"Chiron","second":"Part of Fortune","type":"Conjunction","orb":2.18},{"first":"Chiron","second":"Ascendant","type":"Opposition","orb":4.31},{"first":"Chiron","second":"Midheaven","type":"Quintile","orb":0.22},{"first":"Chiron","second":"Descendant","type":"Conjunction","orb":4.31},{"first":"Part of Fortune","second":"Sun","type":"Sextile","orb":3.03},{"first":"Part of Fortune","second":"Moon","type":"Trine","orb":3.46},{"first":"Part of Fortune","second":"Mars","type":"Sextile","orb":8.79},{"first":"Part of Fortune","second":"Mercury","type":"Sextile","orb":6.21},{"first":"Part of Fortune","second":"Jupiter","type":"Sextile","orb":0.27},{"first":"Part of Fortune","second":"Saturn","type":"Square","orb":3.78},{"first":"Part of Fortune","second":"Uranus","type":"Quincunx","orb":0.13},{"first":"Part of Fortune","second":"Chiron","type":"Square","orb":6.82},{"first":"Part of Fortune","second":"Midheaven","type":"Quincunx","orb":0.19},{"first":"Part of Fortune","second":"Descendant","type":"Quintile","orb":1.28},{"first":"Ascendant","second":"Sun","type":"Trine","orb":8.5},{"first":"Ascendant","second":"Moon","type":"Sextile","orb":2.01},{"first":"Ascendant","second":"Jupiter","type":"Trine","orb":5.74},{"first":"Ascendant","second":"Venus","type":"Opposition","orb":7.87},{"first":"Ascendant","second":"Saturn","type":"Square","orb":1.68},{"first":"Ascendant","second":"Neptune","type":"Semi Square","orb":2.55},{"first":"Ascendant","second":"Pluto","type":"Square","orb":7.1},{"first":"Ascendant","second":"Node","type":"Square","orb":5.07},{"first":"Ascendant","second":"Part of Fortune","type":"Square","orb":4.76},{"first":"Midheaven","second":"Moon","type":"Semi Sextile","orb":0.37},{"first":"Midheaven","second":"Saturn","type":"Opposition","orb":0.7},{"first":"Midheaven","second":"Uranus","type":"Sextile","orb":3.22},{"first":"Midheaven","second":"Neptune","type":"Semi Square","orb":0.17},{"first":"Midheaven","second":"Pluto","type":"Conjunction","orb":9.48},{"first":"Midheaven","second":"Node","type":"Opposition","orb":7.45},{"first":"Midheaven","second":"Chiron","type":"Conjunction","orb":9.91},{"first":"Midheaven","second":"Part of Fortune","type":"Conjunction","orb":7.14},{"first":"Midheaven","second":"Midheaven","type":"Sextile","orb":2.89},{"first":"Descendant","second":"Sun","type":"Sextile","orb":8.5},{"first":"Descendant","second":"Moon","type":"Trine","orb":2.01},{"first":"Descendant","second":"Mars","type":"Semi Square","orb":0.75},{"first":"Descendant","second":"Jupiter","type":"Sextile","orb":5.74},{"first":"Descendant","second":"Venus","type":"Conjunction","orb":7.87},{"first":"Descendant","second":"Saturn","type":"Square","orb":1.68},{"first":"Descendant","second":"Pluto","type":"Square","orb":7.1},{"first":"Descendant","second":"Node","type":"Square","orb":5.07},{"first":"Descendant","second":"Part of Fortune","type":"Square","orb":4.76}]}}}			"RESULTS : ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Sun-Sun Sextile\"",      \""data\"": \""The sextile aspect between your Suns suggests a harmonious connection that fosters mutual understanding and support. This aspect indicates that both of you are likely to appreciate each other's individuality and encourage personal growth. The Sun represents core identity, and this positive aspect can enhance the overall compatibility of your relationship, allowing you to work together effectively towards common goals.\""    },    {      \""title\"": \""Moon-Moon Sextile\"",      \""data\"": \""The sextile between your Moons indicates emotional compatibility and ease in expressing feelings to each other. This aspect suggests that you both have a natural understanding of each other's emotional needs, which can lead to a nurturing and supportive relationship. The Moon governs emotions and instincts, and this harmonious aspect can create a strong emotional bond between you.\""    },    {      \""title\"": \""Mars-Mars Sextile\"",      \""data\"": \""The sextile aspect between your Mars placements suggests a dynamic and energetic connection. This aspect indicates that you both have a similar approach to taking action and pursuing desires, which can lead to a productive partnership. Mars represents drive and ambition, and this positive aspect can enhance your ability to collaborate on projects and overcome challenges together.\""    },    {      \""title\"": \""Venus-Venus Trine\"",      \""data\"": \""The trine between your Venus placements indicates a natural affinity and attraction towards each other. This aspect suggests that you both share similar values and tastes, which can lead to a harmonious and pleasurable relationship. Venus governs love and aesthetics, and this harmonious aspect can enhance the romantic and affectionate aspects of your partnership.\""    },    {      \""title\"": \""Sun-Uranus Square\"",      \""data\"": \""The square aspect between your Sun and Uranus suggests potential challenges related to individuality and freedom within the relationship. This aspect indicates that there may be moments of unpredictability or sudden changes that require adaptation. Uranus represents innovation and change, and this challenging aspect may require both of you to find a balance between personal freedom and relationship stability.\""    },    {      \""title\"": \""Moon-Saturn Quincunx\"",      \""data\"": \""The quincunx aspect between your Moon and Saturn suggests a need for adjustment in emotional expression and responsibility. This aspect indicates that there may be challenges in finding a balance between emotional needs and practical obligations. Saturn represents structure and discipline, and this aspect may require both of you to work on aligning emotional support with practical commitments.\""    },    {      \""title\"": \""Mars-Neptune Trine\"",      \""data\"": \""The trine aspect between your Mars and Neptune suggests a harmonious blend of action and imagination. This aspect indicates that you both have the ability to inspire each other creatively and pursue dreams with enthusiasm. Neptune represents intuition and dreams, and this positive aspect can enhance your ability to work together towards shared visions and ideals.\""    },    {      \""title\"": \""Mercury-Mercury Sextile\"",      \""data\"": \""The sextile between your Mercury placements indicates effective communication and intellectual compatibility. This aspect suggests that you both have a natural ability to understand each other's thoughts and ideas, which can lead to productive discussions and problem-solving. Mercury governs communication and intellect, and this harmonious aspect can enhance your ability to connect on a mental level.\""    },    {      \""title\"": \""Jupiter-Jupiter Sextile\"",      \""data\"": \""The sextile aspect between your Jupiter placements suggests a shared sense of optimism and growth. This aspect indicates that you both have similar philosophies and beliefs, which can lead to a supportive and expansive relationship. Jupiter represents expansion and abundance, and this positive aspect can enhance your ability to explore new opportunities and experiences together.\""    },    {      \""title\"": \""Saturn-Saturn Semi Sextile\"",      \""data\"": \""The semi-sextile aspect between your Saturn placements suggests a subtle connection in terms of responsibility and discipline. This aspect indicates that you both have a complementary approach to handling duties and commitments, which can lead to a stable and reliable partnership. Saturn represents structure and maturity, and this aspect can enhance your ability to support each other in achieving long-term goals.\""    },    {      \""title\"": \""Uranus-Uranus Conjunction\"",      \""data\"": \""The conjunction between your Uranus placements suggests a strong alignment in terms of innovation and change. This aspect indicates that you both have a shared vision for the future and a willingness to embrace new ideas and experiences. Uranus represents originality and freedom, and this conjunction can enhance your ability to support each other's individuality and growth.\""    },    {      \""title\"": \""Neptune-Neptune Conjunction\"",      \""data\"": \""The conjunction between your Neptune placements suggests a deep spiritual and intuitive connection. This aspect indicates that you both have a shared understanding of dreams and ideals, which can lead to a compassionate and empathetic relationship. Neptune represents intuition and spirituality, and this conjunction can enhance your ability to connect on a deeper, more meaningful level.\""    },    {      \""title\"": \""Pluto-Pluto Conjunction\"",      \""data\"": \""The conjunction between your Pluto placements suggests a powerful transformative connection. This aspect indicates that you both have the potential to undergo significant personal growth and change through your relationship. Pluto represents transformation and regeneration, and this conjunction can enhance your ability to support each other in overcoming challenges and evolving together.\""    },    {      \""title\"": \""Node-Node Opposition\"",      \""data\"": \""The opposition between your Nodes suggests a karmic connection with lessons to be learned from each other. This aspect indicates that you both have a shared life purpose and the potential for significant growth through your relationship. The Nodes represent destiny and life path, and this opposition can enhance your ability to support each other in fulfilling your individual and collective missions.\""    },    {      \""title\"": \""Summary\"",      \""data\"": \""Overall, your synastry chart reveals a complex and dynamic relationship with both harmonious and challenging aspects. The positive aspects suggest a strong potential for mutual support, understanding, and growth, while the challenging aspects indicate areas that may require effort and compromise. The presence of multiple conjunctions and trines suggests a deep connection and shared vision for the future.\""    },    {      \""title\"": \""Recommendations\"",      \""data\"": \""To enhance your relationship, focus on open communication and understanding each other's needs and desires. Embrace the positive aspects of your connection, such as shared values and goals, while working on addressing any challenges that arise. Consider seeking guidance from a professional astrologer for a more in-depth analysis and personalized advice. Remember to nurture your individuality and support each other's growth and transformation.\""    }  ]}```"",
    ""prompt_tokens"": 5243,"		
											
Davison Relationship			API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for a To conduct a For  major aspects and connections between planets play a critical role in understanding the dynamics between partners.Venus and Mars aspects** are fundamental for assessing attraction, romance, and compatibility in terms of love and physical intimacy. These aspects can indicate how energy and affection are expressed and reciprocated between partners. **Moon aspects** are crucial for evaluating emotional harmony, comfort, and nurturing behaviors, revealing how well partners connect emotionally and support each other in times of need.Mercury aspects** shed light on communication styles and intellectual compatibility, highlighting how partners think, communicate, and understand each other. This can determine the ease of everyday interactions and the ability to resolve conflicts through dialogue. **Jupiter and Saturn aspects** reflect the balance of growth, optimism, commitment, and stability within the relationship. Jupiter's aspects tend to encourage expansion and optimism, while Saturn's influence can either stabilize or challenge the relationship, depending on the nature of the aspects.**Aspects involving outer planets** like Uranus, Neptune, and Pluto introduce elements of excitement, idealism, and transformation. **Uranus aspects** can bring excitement and change, potentially leading to sudden shifts in the relationship dynamics. **Neptune aspects** often deal with idealism and illusions, which can either enchant or deceive, affecting the clarity and reality of the relationship. **Pluto aspects** are intense and can deal with power dynamics and deep transformational changes, often touching on karmic or deeply ingrained patterns within the relationship.Analyzing these aspects provides a comprehensive view of how the relationship functions on multiple levels, from everyday interactions to deeper, spiritual or karmic connections. Understanding these dynamics helps partners navigate their relationship with greater awareness and empathy.","user_content":"I was born on  August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on  June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30' I have added birth chart details of mine and my love relationship partner both now calculate Aspect and Conjunction of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response "},"toolname":"other","json":{"mydetails":{"ascendant":71.03565456897975,"midheaven":327.5598198535195,"vertex":211.32869379691815,"houses":[{"house":1,"sign":"Gemini","sign_id":3,"degree":71.03565},{"house":2,"sign":"Cancer","sign_id":4,"degree":96.08341},{"house":3,"sign":"Leo","sign_id":5,"degree":120.46019},{"house":4,"sign":"Leo","sign_id":5,"degree":147.55982},{"house":5,"sign":"Virgo","sign_id":6,"degree":179.71154},{"house":6,"sign":"Scorpio","sign_id":8,"degree":215.87244},{"house":7,"sign":"Sagittarius","sign_id":9,"degree":251.03565},{"house":8,"sign":"Capricorn","sign_id":10,"degree":276.08341},{"house":9,"sign":"Aquarius","sign_id":11,"degree":300.46019},{"house":10,"sign":"Aquarius","sign_id":11,"degree":327.55982},{"house":11,"sign":"Pisces","sign_id":12,"degree":359.71154},{"house":12,"sign":"Taurus","sign_id":2,"degree":35.87244}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":6.49,"diff":173.51},{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":5.75,"diff":5.75},{"aspecting_planet":"Sun","aspected_planet":"Mercury","aspecting_planet_id":0,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":3.18,"diff":3.18},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":2.76,"diff":2.76},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":9.05,"diff":170.95},{"aspecting_planet":"Moon","aspected_planet":"Mercury","aspecting_planet_id":1,"aspected_planet_id":3,"aspect_type":2,"type":"Opposition","orb":9.67,"diff":170.33},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":3.73,"diff":176.27},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.57,"diff":2.57},{"aspecting_planet":"Mars","aspected_planet":"Jupiter","aspecting_planet_id":2,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":8.52,"diff":8.52},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":3.29,"diff":176.71},{"aspecting_planet":"Mars","aspected_planet":"Ascendant","aspecting_planet_id":2,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.5,"diff":55.5},{"aspecting_planet":"Mercury","aspected_planet":"Jupiter","aspecting_planet_id":3,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":5.94,"diff":5.94},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":5.87,"diff":174.13},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":4,"type":"Square","orb":0.77,"diff":90.77},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":3.38,"diff":93.38},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":3.92,"diff":116.08},{"aspecting_planet":"Saturn","aspected_planet":"Pluto","aspecting_planet_id":6,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":8.78,"diff":171.22},{"aspecting_planet":"Saturn","aspected_planet":"Midheaven","aspecting_planet_id":6,"aspected_planet_id":11,"aspect_type":3,"type":"Trine","orb":3.59,"diff":116.41},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":0.33,"diff":0.33},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.36,"diff":54.64},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":1.2,"diff":121.2},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":2,"type":"Opposition","orb":4.15,"diff":175.85}],"planets":[{"name":"Sun","full_degree":120.7857,"norm_degree":0.7857,"speed":0.9547,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Moon","full_degree":294.295,"norm_degree":24.295,"speed":12.889,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":8},{"name":"Mars","full_degree":126.5393,"norm_degree":6.5393,"speed":0.6404,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Mercury","full_degree":123.9658,"norm_degree":3.9658,"speed":2.0839,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Jupiter","full_degree":118.0226,"norm_degree":28.0226,"speed":0.2231,"is_retro":"false","sign_id":4,"sign":"Cancer","house":2},{"name":"Venus","full_degree":164.4179,"norm_degree":14.4179,"speed":1.0955,"is_retro":"false","sign_id":6,"sign":"Virgo","house":4},{"name":"Saturn","full_degree":83.9703,"norm_degree":23.9703,"speed":0.1129,"is_retro":"false","sign_id":3,"sign":"Gemini","house":1},{"name":"Uranus","full_degree":327.8866,"norm_degree":27.8866,"speed":-0.034,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":10},{"name":"Neptune","full_degree":309.8325,"norm_degree":9.8325,"speed":-0.0267,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":9},{"name":"Pluto","full_degree":255.1901,"norm_degree":15.1901,"speed":-0.0165,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":7},{"name":"Node","full_degree":77.216,"norm_degree":17.216,"speed":-0.0886,"is_retro":"true","sign_id":3,"sign":"Gemini","house":1},{"name":"Chiron","full_degree":274.574,"norm_degree":4.574,"speed":-0.0543,"is_retro":"true","sign_id":10,"sign":"Capricorn","house":7},{"name":"Part of Fortune","full_degree":257.5264,"norm_degree":17.5264,"speed":0,"is_retro":"false","sign_id":9,"sign":"Sagittarius","house":7}],"lilith":{"name":"Lilith","full_degree":7.5172,"norm_degree":7.5172,"speed":0.1119,"is_retro":"false","sign_id":1,"sign":"Aries","house":11}},"fiend_details":{"ascendant":352.28704269998116,"midheaven":264.6664338718442,"vertex":176.90088242133072,"houses":[{"house":1,"sign":"Pisces","sign_id":12,"degree":352.28704},{"house":2,"sign":"Aries","sign_id":1,"degree":29.41937},{"house":3,"sign":"Taurus","sign_id":2,"degree":59.29939},{"house":4,"sign":"Gemini","sign_id":3,"degree":84.66643},{"house":5,"sign":"Cancer","sign_id":4,"degree":109.36512},{"house":6,"sign":"Leo","sign_id":5,"degree":137.28302},{"house":7,"sign":"Virgo","sign_id":6,"degree":172.28704},{"house":8,"sign":"Libra","sign_id":7,"degree":209.41937},{"house":9,"sign":"Scorpio","sign_id":8,"degree":239.29939},{"house":10,"sign":"Sagittarius","sign_id":9,"degree":264.66643},{"house":11,"sign":"Capricorn","sign_id":10,"degree":289.36512},{"house":12,"sign":"Aquarius","sign_id":11,"degree":317.28302}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":5.47,"diff":174.53},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":7.03,"diff":7.03},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":6.64,"diff":6.64},{"aspecting_planet":"Sun","aspected_planet":"Saturn","aspecting_planet_id":0,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":5.86,"diff":5.86},{"aspecting_planet":"Sun","aspected_planet":"Uranus","aspecting_planet_id":0,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":6.4,"diff":96.4},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.91,"diff":64.91},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":1.56,"diff":178.44},{"aspecting_planet":"Moon","aspected_planet":"Venus","aspecting_planet_id":1,"aspected_planet_id":5,"aspect_type":2,"type":"Opposition","orb":1.17,"diff":178.83},{"aspecting_planet":"Moon","aspected_planet":"Saturn","aspecting_planet_id":1,"aspected_planet_id":6,"aspect_type":2,"type":"Opposition","orb":0.39,"diff":179.61},{"aspecting_planet":"Moon","aspected_planet":"Uranus","aspecting_planet_id":1,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.93,"diff":89.07},{"aspecting_planet":"Moon","aspected_planet":"Ascendant","aspecting_planet_id":1,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.55,"diff":120.55},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.29,"diff":2.29},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.23,"diff":123.23},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":2.16,"diff":177.84},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.94,"diff":120.94},{"aspecting_planet":"Mercury","aspected_planet":"Pluto","aspecting_planet_id":3,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.45,"diff":175.55},{"aspecting_planet":"Jupiter","aspected_planet":"Venus","aspecting_planet_id":4,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":0.39,"diff":0.39},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":1.17,"diff":1.17},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.63,"diff":89.37},{"aspecting_planet":"Jupiter","aspected_planet":"Ascendant","aspecting_planet_id":4,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":2.12,"diff":57.88},{"aspecting_planet":"Venus","aspected_planet":"Saturn","aspecting_planet_id":5,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.78,"diff":0.78},{"aspecting_planet":"Venus","aspected_planet":"Uranus","aspecting_planet_id":5,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.24,"diff":89.76},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":1.72,"diff":58.28},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.54,"diff":90.54},{"aspecting_planet":"Saturn","aspected_planet":"Ascendant","aspecting_planet_id":6,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":0.95,"diff":59.05},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.87,"diff":56.13},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.39,"diff":54.61},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":2.38,"diff":87.62}],"planets":[{"name":"Sun","full_degree":57.2003,"norm_degree":27.2003,"speed":0.9629,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Moon","full_degree":231.7352,"norm_degree":21.7352,"speed":12.3389,"is_retro":"false","sign_id":8,"sign":"Scorpio","house":8},{"name":"Mars","full_degree":69.7763,"norm_degree":9.7763,"speed":0.6914,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Mercury","full_degree":67.4912,"norm_degree":7.4912,"speed":2.0745,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Jupiter","full_degree":50.172,"norm_degree":20.172,"speed":0.2368,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Venus","full_degree":50.5645,"norm_degree":20.5645,"speed":1.2292,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Saturn","full_degree":51.3412,"norm_degree":21.3412,"speed":0.1283,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Uranus","full_degree":320.8013,"norm_degree":20.8013,"speed":0.0061,"is_retro":"false","sign_id":11,"sign":"Aquarius","house":12},{"name":"Neptune","full_degree":306.5494,"norm_degree":6.5494,"speed":-0.005,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":11},{"name":"Pluto","full_degree":251.939,"norm_degree":11.939,"speed":-0.0259,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Node","full_degree":116.3003,"norm_degree":26.3003,"speed":-0.1751,"is_retro":"true","sign_id":4,"sign":"Cancer","house":5},{"name":"Chiron","full_degree":255.3443,"norm_degree":15.3443,"speed":-0.0653,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Part of Fortune","full_degree":177.7521,"norm_degree":27.7521,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":7}],"lilith":{"name":"Lilith","full_degree":278.7196,"norm_degree":8.7196,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":10}}}}			"RESULTS : ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Sun Conjunct Mercury\"",      \""data\"": \""In both charts, the Sun is conjunct Mercury, indicating a strong intellectual connection and mutual understanding. This aspect suggests that communication flows naturally between you, allowing for easy exchange of ideas and thoughts. The conjunction in Leo for you and Gemini for your partner highlights creativity and adaptability in your communication styles. This aspect fosters a lively and engaging dialogue, making it easier to resolve conflicts and share interests. The presence of this conjunction in the 3rd house for both charts emphasizes the importance of communication in your relationship.\""    },    {      \""title\"": \""Moon Opposition Sun\"",      \""data\"": \""The opposition between the Moon and Sun in both charts suggests a dynamic tension between emotional needs and personal identity. This aspect can create a push-pull dynamic where one partner's emotional needs may feel at odds with the other's self-expression. In your chart, the Moon in Capricorn opposes the Sun in Leo, indicating a need for emotional security that may conflict with a desire for recognition and creativity. For your partner, the Moon in Scorpio opposes the Sun in Taurus, highlighting a tension between emotional depth and stability. This aspect requires conscious effort to balance emotional needs with personal expression.\""    },    {      \""title\"": \""Venus Square Pluto\"",      \""data\"": \""In your chart, Venus square Pluto indicates intense and transformative experiences in love and relationships. This aspect suggests a potential for power struggles and deep emotional connections that can lead to profound changes. The square aspect creates tension that may manifest as a need to control or transform the relationship. In your partner's chart, Venus conjunct Jupiter in Taurus suggests a more expansive and optimistic approach to love, which may clash with the intensity of your Venus-Pluto square. Navigating these differences requires open communication and a willingness to embrace transformation.\""    },    {      \""title\"": \""Mars Conjunct Mercury\"",      \""data\"": \""The conjunction of Mars and Mercury in both charts indicates a dynamic and energetic communication style. This aspect suggests that conversations are lively and may sometimes become heated due to the assertive nature of Mars. In your chart, this conjunction in Leo emphasizes a dramatic and expressive communication style, while in your partner's chart, the conjunction in Gemini highlights adaptability and quick thinking. This aspect can lead to productive discussions and debates, but it's important to be mindful of potential arguments or misunderstandings.\""    },    {      \""title\"": \""Saturn Trine Uranus\"",      \""data\"": \""In your chart, Saturn trine Uranus suggests a harmonious balance between tradition and innovation. This aspect indicates an ability to integrate new ideas with established structures, fostering growth and stability. The trine aspect creates a supportive energy that encourages change without disrupting the foundation of the relationship. In your partner's chart, the presence of Saturn conjunct Venus and Jupiter in Taurus suggests a more grounded and stable approach to love, which complements your innovative tendencies. This aspect supports long-term growth and adaptability in the relationship.\""    },    {      \""title\"": \""Neptune Trine Ascendant\"",      \""data\"": \""The trine between Neptune and the Ascendant in your chart indicates a natural empathy and sensitivity in your interactions with others. This aspect suggests an intuitive understanding of your partner's needs and emotions, fostering a deep emotional connection. The trine aspect creates a harmonious flow of energy, allowing for a compassionate and supportive relationship. In your partner's chart, Neptune in Aquarius suggests a visionary and idealistic approach to relationships, which aligns well with your empathetic nature. This aspect enhances the spiritual and emotional bond between you.\""    },    {      \""title\"": \""Summary\"",      \""data\"": \""The synastry between your charts reveals a complex interplay of energies that influence your relationship dynamics. Key aspects such as Sun conjunct Mercury and Mars conjunct Mercury highlight strong communication and intellectual connection. However, challenging aspects like Moon opposition Sun and Venus square Pluto indicate areas where tension and transformation may occur. The harmonious aspects, such as Saturn trine Uranus and Neptune trine Ascendant, provide stability and empathy, supporting long-term growth and understanding. Overall, your relationship is characterized by a blend of dynamic communication, emotional depth, and transformative experiences.\""    },    {      \""title\"": \""Recommendations\"",      \""data\"": \""To navigate the challenges and enhance the strengths in your relationship, focus on open and honest communication, especially when addressing emotional needs and personal expression. Embrace the transformative potential of Venus square Pluto by being open to change and growth in your relationship. Utilize the harmonious energy of Saturn trine Uranus to integrate new ideas and maintain stability. Foster empathy and understanding through Neptune trine Ascendant, allowing for a deeper emotional connection. By balancing these energies, you can create a supportive and fulfilling partnership.\""    }  ]}```"",
    ""prompt_tokens"": 5330,"		
											
Major Aspects and Connections			API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for a To conduct a For a The Davison Relationship Chart is another valuable tool in relationship astrology, calculated using the midpoints of both individuals' birth dates and locations. This method results in an actual time and location that reflects a birth of the relationship itself, essentially treating the relationship as if it were its own entity with a specific birth chart. This type of chart offers a unique, event-oriented perspective on the relationship's journey and purpose, providing insights into significant themes and potential turning points within the partnership. By examining the planetary placements, house distributions, and aspects in the Davison chart, you can explore the dynamics, challenges, and growth opportunities that characterize the relationship over time. This approach adds a temporal dimension to relationship analysis, highlighting how external events and transitions may impact the relationship's development. To effectively use the Davison Relationship Chart, you might employ specialized astrology software capable of calculating these specific midpoints and interpreting the resulting chart in the context of significant life events shared by the couple.","user_content":"I was born on August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on  June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30' I have added birth chart details of mine and my love relationship partner both now calculate our davison relation ship chart of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 3 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response  "},"toolname":"other","json":{"mydetails":{"ascendant":71.03565456897975,"midheaven":327.5598198535195,"vertex":211.32869379691815,"houses":[{"house":1,"sign":"Gemini","sign_id":3,"degree":71.03565},{"house":2,"sign":"Cancer","sign_id":4,"degree":96.08341},{"house":3,"sign":"Leo","sign_id":5,"degree":120.46019},{"house":4,"sign":"Leo","sign_id":5,"degree":147.55982},{"house":5,"sign":"Virgo","sign_id":6,"degree":179.71154},{"house":6,"sign":"Scorpio","sign_id":8,"degree":215.87244},{"house":7,"sign":"Sagittarius","sign_id":9,"degree":251.03565},{"house":8,"sign":"Capricorn","sign_id":10,"degree":276.08341},{"house":9,"sign":"Aquarius","sign_id":11,"degree":300.46019},{"house":10,"sign":"Aquarius","sign_id":11,"degree":327.55982},{"house":11,"sign":"Pisces","sign_id":12,"degree":359.71154},{"house":12,"sign":"Taurus","sign_id":2,"degree":35.87244}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":6.49,"diff":173.51},{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":5.75,"diff":5.75},{"aspecting_planet":"Sun","aspected_planet":"Mercury","aspecting_planet_id":0,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":3.18,"diff":3.18},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":2.76,"diff":2.76},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":9.05,"diff":170.95},{"aspecting_planet":"Moon","aspected_planet":"Mercury","aspecting_planet_id":1,"aspected_planet_id":3,"aspect_type":2,"type":"Opposition","orb":9.67,"diff":170.33},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":3.73,"diff":176.27},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.57,"diff":2.57},{"aspecting_planet":"Mars","aspected_planet":"Jupiter","aspecting_planet_id":2,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":8.52,"diff":8.52},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":3.29,"diff":176.71},{"aspecting_planet":"Mars","aspected_planet":"Ascendant","aspecting_planet_id":2,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.5,"diff":55.5},{"aspecting_planet":"Mercury","aspected_planet":"Jupiter","aspecting_planet_id":3,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":5.94,"diff":5.94},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":5.87,"diff":174.13},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":4,"type":"Square","orb":0.77,"diff":90.77},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":3.38,"diff":93.38},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":3.92,"diff":116.08},{"aspecting_planet":"Saturn","aspected_planet":"Pluto","aspecting_planet_id":6,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":8.78,"diff":171.22},{"aspecting_planet":"Saturn","aspected_planet":"Midheaven","aspecting_planet_id":6,"aspected_planet_id":11,"aspect_type":3,"type":"Trine","orb":3.59,"diff":116.41},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":0.33,"diff":0.33},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.36,"diff":54.64},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":1.2,"diff":121.2},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":2,"type":"Opposition","orb":4.15,"diff":175.85}],"planets":[{"name":"Sun","full_degree":120.7857,"norm_degree":0.7857,"speed":0.9547,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Moon","full_degree":294.295,"norm_degree":24.295,"speed":12.889,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":8},{"name":"Mars","full_degree":126.5393,"norm_degree":6.5393,"speed":0.6404,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Mercury","full_degree":123.9658,"norm_degree":3.9658,"speed":2.0839,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Jupiter","full_degree":118.0226,"norm_degree":28.0226,"speed":0.2231,"is_retro":"false","sign_id":4,"sign":"Cancer","house":2},{"name":"Venus","full_degree":164.4179,"norm_degree":14.4179,"speed":1.0955,"is_retro":"false","sign_id":6,"sign":"Virgo","house":4},{"name":"Saturn","full_degree":83.9703,"norm_degree":23.9703,"speed":0.1129,"is_retro":"false","sign_id":3,"sign":"Gemini","house":1},{"name":"Uranus","full_degree":327.8866,"norm_degree":27.8866,"speed":-0.034,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":10},{"name":"Neptune","full_degree":309.8325,"norm_degree":9.8325,"speed":-0.0267,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":9},{"name":"Pluto","full_degree":255.1901,"norm_degree":15.1901,"speed":-0.0165,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":7},{"name":"Node","full_degree":77.216,"norm_degree":17.216,"speed":-0.0886,"is_retro":"true","sign_id":3,"sign":"Gemini","house":1},{"name":"Chiron","full_degree":274.574,"norm_degree":4.574,"speed":-0.0543,"is_retro":"true","sign_id":10,"sign":"Capricorn","house":7},{"name":"Part of Fortune","full_degree":257.5264,"norm_degree":17.5264,"speed":0,"is_retro":"false","sign_id":9,"sign":"Sagittarius","house":7}],"lilith":{"name":"Lilith","full_degree":7.5172,"norm_degree":7.5172,"speed":0.1119,"is_retro":"false","sign_id":1,"sign":"Aries","house":11}},"fiend_details":{"ascendant":352.28704269998116,"midheaven":264.6664338718442,"vertex":176.90088242133072,"houses":[{"house":1,"sign":"Pisces","sign_id":12,"degree":352.28704},{"house":2,"sign":"Aries","sign_id":1,"degree":29.41937},{"house":3,"sign":"Taurus","sign_id":2,"degree":59.29939},{"house":4,"sign":"Gemini","sign_id":3,"degree":84.66643},{"house":5,"sign":"Cancer","sign_id":4,"degree":109.36512},{"house":6,"sign":"Leo","sign_id":5,"degree":137.28302},{"house":7,"sign":"Virgo","sign_id":6,"degree":172.28704},{"house":8,"sign":"Libra","sign_id":7,"degree":209.41937},{"house":9,"sign":"Scorpio","sign_id":8,"degree":239.29939},{"house":10,"sign":"Sagittarius","sign_id":9,"degree":264.66643},{"house":11,"sign":"Capricorn","sign_id":10,"degree":289.36512},{"house":12,"sign":"Aquarius","sign_id":11,"degree":317.28302}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":5.47,"diff":174.53},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":7.03,"diff":7.03},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":6.64,"diff":6.64},{"aspecting_planet":"Sun","aspected_planet":"Saturn","aspecting_planet_id":0,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":5.86,"diff":5.86},{"aspecting_planet":"Sun","aspected_planet":"Uranus","aspecting_planet_id":0,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":6.4,"diff":96.4},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.91,"diff":64.91},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":1.56,"diff":178.44},{"aspecting_planet":"Moon","aspected_planet":"Venus","aspecting_planet_id":1,"aspected_planet_id":5,"aspect_type":2,"type":"Opposition","orb":1.17,"diff":178.83},{"aspecting_planet":"Moon","aspected_planet":"Saturn","aspecting_planet_id":1,"aspected_planet_id":6,"aspect_type":2,"type":"Opposition","orb":0.39,"diff":179.61},{"aspecting_planet":"Moon","aspected_planet":"Uranus","aspecting_planet_id":1,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.93,"diff":89.07},{"aspecting_planet":"Moon","aspected_planet":"Ascendant","aspecting_planet_id":1,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.55,"diff":120.55},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.29,"diff":2.29},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.23,"diff":123.23},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":2.16,"diff":177.84},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.94,"diff":120.94},{"aspecting_planet":"Mercury","aspected_planet":"Pluto","aspecting_planet_id":3,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.45,"diff":175.55},{"aspecting_planet":"Jupiter","aspected_planet":"Venus","aspecting_planet_id":4,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":0.39,"diff":0.39},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":1.17,"diff":1.17},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.63,"diff":89.37},{"aspecting_planet":"Jupiter","aspected_planet":"Ascendant","aspecting_planet_id":4,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":2.12,"diff":57.88},{"aspecting_planet":"Venus","aspected_planet":"Saturn","aspecting_planet_id":5,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.78,"diff":0.78},{"aspecting_planet":"Venus","aspected_planet":"Uranus","aspecting_planet_id":5,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.24,"diff":89.76},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":1.72,"diff":58.28},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.54,"diff":90.54},{"aspecting_planet":"Saturn","aspected_planet":"Ascendant","aspecting_planet_id":6,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":0.95,"diff":59.05},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.87,"diff":56.13},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.39,"diff":54.61},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":2.38,"diff":87.62}],"planets":[{"name":"Sun","full_degree":57.2003,"norm_degree":27.2003,"speed":0.9629,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Moon","full_degree":231.7352,"norm_degree":21.7352,"speed":12.3389,"is_retro":"false","sign_id":8,"sign":"Scorpio","house":8},{"name":"Mars","full_degree":69.7763,"norm_degree":9.7763,"speed":0.6914,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Mercury","full_degree":67.4912,"norm_degree":7.4912,"speed":2.0745,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Jupiter","full_degree":50.172,"norm_degree":20.172,"speed":0.2368,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Venus","full_degree":50.5645,"norm_degree":20.5645,"speed":1.2292,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Saturn","full_degree":51.3412,"norm_degree":21.3412,"speed":0.1283,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Uranus","full_degree":320.8013,"norm_degree":20.8013,"speed":0.0061,"is_retro":"false","sign_id":11,"sign":"Aquarius","house":12},{"name":"Neptune","full_degree":306.5494,"norm_degree":6.5494,"speed":-0.005,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":11},{"name":"Pluto","full_degree":251.939,"norm_degree":11.939,"speed":-0.0259,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Node","full_degree":116.3003,"norm_degree":26.3003,"speed":-0.1751,"is_retro":"true","sign_id":4,"sign":"Cancer","house":5},{"name":"Chiron","full_degree":255.3443,"norm_degree":15.3443,"speed":-0.0653,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Part of Fortune","full_degree":177.7521,"norm_degree":27.7521,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":7}],"lilith":{"name":"Lilith","full_degree":278.7196,"norm_degree":8.7196,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":10}}}}			"RESULTS : ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Sun in the Davison Chart\"",      \""data\"": \""The Sun in the Davison Relationship Chart represents the core identity and purpose of the relationship. In this chart, the Sun is positioned in the 3rd house, indicating that communication and intellectual exchange are central to the relationship's vitality. The Sun's placement in Leo suggests a dynamic and expressive partnership, where creativity and self-expression play significant roles. The conjunction with Mercury enhances the importance of dialogue and mutual understanding, while the opposition to Neptune may introduce challenges related to idealism and potential misunderstandings.\""    },    {      \""title\"": \""Moon in the Davison Chart\"",      \""data\"": \""The Moon in the Davison Chart reflects the emotional undercurrents and instinctual responses within the relationship. Positioned in the 8th house, the Moon indicates a deep emotional bond and a focus on shared resources and transformation. The Moon's placement in Capricorn suggests a need for stability and structure in emotional matters. The opposition to the Sun highlights a dynamic tension between emotional needs and the relationship's core identity, requiring balance and compromise.\""    },    {      \""title\"": \""Mars in the Davison Chart\"",      \""data\"": \""Mars in the Davison Chart signifies the relationship's drive, passion, and potential conflicts. Located in the 3rd house, Mars emphasizes the importance of assertive communication and active engagement in intellectual pursuits. The conjunction with Mercury suggests a dynamic exchange of ideas, but the opposition to Neptune warns of potential misunderstandings or deceptive communication. The sextile to the Ascendant indicates a harmonious expression of energy and assertiveness in the relationship's outward presentation.\""    },    {      \""title\"": \""Venus in the Davison Chart\"",      \""data\"": \""Venus represents love, harmony, and attraction within the relationship. In the 4th house, Venus emphasizes the importance of creating a harmonious and nurturing home environment. The placement in Virgo suggests a practical and detail-oriented approach to love and partnership. The square to Pluto indicates potential power struggles or intense emotional transformations, requiring conscious effort to maintain balance and avoid manipulation.\""    },    {      \""title\"": \""Jupiter in the Davison Chart\"",      \""data\"": \""Jupiter in the Davison Chart highlights areas of growth, expansion, and shared beliefs. Positioned in the 2nd house, Jupiter suggests that financial matters and shared values are significant themes in the relationship. The conjunction with the Sun enhances optimism and a sense of purpose, while the opposition to the Moon indicates a need to balance emotional security with material aspirations. The sextile to the Ascendant supports a positive and expansive outlook in the relationship's public image.\""    },    {      \""title\"": \""Saturn in the Davison Chart\"",      \""data\"": \""Saturn represents structure, responsibility, and challenges within the relationship. In the 1st house, Saturn emphasizes the importance of establishing a solid foundation and taking a disciplined approach to the partnership. The trine to Uranus suggests an ability to balance tradition with innovation, while the opposition to Pluto indicates potential power struggles or transformative challenges that require resilience and maturity.\""    },    {      \""title\"": \""Uranus in the Davison Chart\"",      \""data\"": \""Uranus in the Davison Chart signifies innovation, change, and unpredictability. Positioned in the 10th house, Uranus highlights the potential for sudden changes in the relationship's public image or career-related matters. The conjunction with the Midheaven suggests a unique and unconventional approach to shared goals, while the square to Venus indicates potential disruptions in harmony or unexpected shifts in values.\""    },    {      \""title\"": \""Neptune in the Davison Chart\"",      \""data\"": \""Neptune represents dreams, idealism, and potential illusions within the relationship. In the 9th house, Neptune emphasizes the importance of shared spiritual or philosophical beliefs. The trine to the Ascendant supports a compassionate and empathetic approach to the relationship's outward expression, while the opposition to Mars warns of potential confusion or deception in communication and assertive actions.\""    },    {      \""title\"": \""Pluto in the Davison Chart\"",      \""data\"": \""Pluto signifies transformation, power, and deep psychological dynamics within the relationship. Positioned in the 7th house, Pluto highlights the potential for intense and transformative experiences in partnership matters. The opposition to Saturn indicates potential power struggles or challenges related to control and authority, requiring conscious effort to navigate these dynamics constructively.\""    },    {      \""title\"": \""Summary\"",      \""data\"": \""The Davison Relationship Chart for this partnership reveals a dynamic and expressive relationship with a strong focus on communication and intellectual exchange. Emotional depth and transformation are significant themes, with a need for balance between emotional security and material aspirations. The relationship may experience challenges related to power dynamics and potential misunderstandings, requiring conscious effort to maintain harmony and mutual understanding.\""    },    {      \""title\"": \""Recommendations\"",      \""data\"": \""To enhance the relationship, focus on open and honest communication, ensuring that both partners feel heard and understood. Embrace the creative and expressive aspects of the partnership, while remaining mindful of potential power struggles or misunderstandings. Cultivate a nurturing and harmonious home environment, and strive for balance between emotional needs and material goals. Embrace change and innovation, while maintaining a solid foundation of trust and responsibility.\""    }  ]}```"",
    ""prompt_tokens"": 5187,"		
											
Compatibility Score or Summary			API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for For generating a compatibility score or summary in relationship astrology, you'd synthesize the insights gathered from analyzing planetary aspects, house placements, and elemental compositions to craft a comprehensive overview of the relationship's harmony and potential challenges.**Overall Compatibility Summary**: This summary integrates the findings from different astrological factors, including the aspects between personal and outer planets, the interplay of planets across each other's houses, and the balance of elements (fire, earth, air, water) between both charts. By examining how these factors interact, you can identify the overall tone of the relationship—whether it's predominantly harmonious, challenging, or a mix of both. For instance, harmonious aspects (like trines and sextiles) and complementary elements (such as earth with water, or air with fire) suggest ease and natural compatibility. In contrast, challenging aspects (like squares and oppositions) and clashing elements might indicate areas where the partners may frequently encounter difficulties or need to put in more effort to maintain balance.**Relationship Strengths and Weaknesses**: Delve into specific areas of support and friction by highlighting which aspects and house placements contribute positively to the relationship and which present obstacles. Strengths might be seen in supportive Venus and Mars aspects that enhance romantic and sexual compatibility, or in harmonious Mercury aspects that foster good communication. Weaknesses could be identified in difficult aspects involving Saturn which might indicate blockages or restrictions, or challenging aspects to Neptune which could lead to misunderstandings or disillusionment.By combining these insights, the compatibility score or summary provides a nuanced view of the relationship's potential, pointing out both the strong foundations upon which it can build and the challenging areas that may require conscious effort or compromise to navigate successfully. This holistic view aids partners in understanding their relationship more deeply and offers practical advice on areas to cherish or improve.","user_content":"I was born on  August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30' I have added birth chart details of mine and my love relationship partner both now calculate compatibility score or summery of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 3 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response  "},"toolname":"other","json":{"mydetails":{"ascendant":71.03565456897975,"midheaven":327.5598198535195,"vertex":211.32869379691815,"houses":[{"house":1,"sign":"Gemini","sign_id":3,"degree":71.03565},{"house":2,"sign":"Cancer","sign_id":4,"degree":96.08341},{"house":3,"sign":"Leo","sign_id":5,"degree":120.46019},{"house":4,"sign":"Leo","sign_id":5,"degree":147.55982},{"house":5,"sign":"Virgo","sign_id":6,"degree":179.71154},{"house":6,"sign":"Scorpio","sign_id":8,"degree":215.87244},{"house":7,"sign":"Sagittarius","sign_id":9,"degree":251.03565},{"house":8,"sign":"Capricorn","sign_id":10,"degree":276.08341},{"house":9,"sign":"Aquarius","sign_id":11,"degree":300.46019},{"house":10,"sign":"Aquarius","sign_id":11,"degree":327.55982},{"house":11,"sign":"Pisces","sign_id":12,"degree":359.71154},{"house":12,"sign":"Taurus","sign_id":2,"degree":35.87244}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":6.49,"diff":173.51},{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":5.75,"diff":5.75},{"aspecting_planet":"Sun","aspected_planet":"Mercury","aspecting_planet_id":0,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":3.18,"diff":3.18},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":2.76,"diff":2.76},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":9.05,"diff":170.95},{"aspecting_planet":"Moon","aspected_planet":"Mercury","aspecting_planet_id":1,"aspected_planet_id":3,"aspect_type":2,"type":"Opposition","orb":9.67,"diff":170.33},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":3.73,"diff":176.27},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.57,"diff":2.57},{"aspecting_planet":"Mars","aspected_planet":"Jupiter","aspecting_planet_id":2,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":8.52,"diff":8.52},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":3.29,"diff":176.71},{"aspecting_planet":"Mars","aspected_planet":"Ascendant","aspecting_planet_id":2,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.5,"diff":55.5},{"aspecting_planet":"Mercury","aspected_planet":"Jupiter","aspecting_planet_id":3,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":5.94,"diff":5.94},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":5.87,"diff":174.13},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":4,"type":"Square","orb":0.77,"diff":90.77},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":3.38,"diff":93.38},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":3.92,"diff":116.08},{"aspecting_planet":"Saturn","aspected_planet":"Pluto","aspecting_planet_id":6,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":8.78,"diff":171.22},{"aspecting_planet":"Saturn","aspected_planet":"Midheaven","aspecting_planet_id":6,"aspected_planet_id":11,"aspect_type":3,"type":"Trine","orb":3.59,"diff":116.41},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":0.33,"diff":0.33},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.36,"diff":54.64},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":1.2,"diff":121.2},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":2,"type":"Opposition","orb":4.15,"diff":175.85}],"planets":[{"name":"Sun","full_degree":120.7857,"norm_degree":0.7857,"speed":0.9547,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Moon","full_degree":294.295,"norm_degree":24.295,"speed":12.889,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":8},{"name":"Mars","full_degree":126.5393,"norm_degree":6.5393,"speed":0.6404,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Mercury","full_degree":123.9658,"norm_degree":3.9658,"speed":2.0839,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Jupiter","full_degree":118.0226,"norm_degree":28.0226,"speed":0.2231,"is_retro":"false","sign_id":4,"sign":"Cancer","house":2},{"name":"Venus","full_degree":164.4179,"norm_degree":14.4179,"speed":1.0955,"is_retro":"false","sign_id":6,"sign":"Virgo","house":4},{"name":"Saturn","full_degree":83.9703,"norm_degree":23.9703,"speed":0.1129,"is_retro":"false","sign_id":3,"sign":"Gemini","house":1},{"name":"Uranus","full_degree":327.8866,"norm_degree":27.8866,"speed":-0.034,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":10},{"name":"Neptune","full_degree":309.8325,"norm_degree":9.8325,"speed":-0.0267,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":9},{"name":"Pluto","full_degree":255.1901,"norm_degree":15.1901,"speed":-0.0165,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":7},{"name":"Node","full_degree":77.216,"norm_degree":17.216,"speed":-0.0886,"is_retro":"true","sign_id":3,"sign":"Gemini","house":1},{"name":"Chiron","full_degree":274.574,"norm_degree":4.574,"speed":-0.0543,"is_retro":"true","sign_id":10,"sign":"Capricorn","house":7},{"name":"Part of Fortune","full_degree":257.5264,"norm_degree":17.5264,"speed":0,"is_retro":"false","sign_id":9,"sign":"Sagittarius","house":7}],"lilith":{"name":"Lilith","full_degree":7.5172,"norm_degree":7.5172,"speed":0.1119,"is_retro":"false","sign_id":1,"sign":"Aries","house":11}},"fiend_details":{"ascendant":352.28704269998116,"midheaven":264.6664338718442,"vertex":176.90088242133072,"houses":[{"house":1,"sign":"Pisces","sign_id":12,"degree":352.28704},{"house":2,"sign":"Aries","sign_id":1,"degree":29.41937},{"house":3,"sign":"Taurus","sign_id":2,"degree":59.29939},{"house":4,"sign":"Gemini","sign_id":3,"degree":84.66643},{"house":5,"sign":"Cancer","sign_id":4,"degree":109.36512},{"house":6,"sign":"Leo","sign_id":5,"degree":137.28302},{"house":7,"sign":"Virgo","sign_id":6,"degree":172.28704},{"house":8,"sign":"Libra","sign_id":7,"degree":209.41937},{"house":9,"sign":"Scorpio","sign_id":8,"degree":239.29939},{"house":10,"sign":"Sagittarius","sign_id":9,"degree":264.66643},{"house":11,"sign":"Capricorn","sign_id":10,"degree":289.36512},{"house":12,"sign":"Aquarius","sign_id":11,"degree":317.28302}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":5.47,"diff":174.53},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":7.03,"diff":7.03},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":6.64,"diff":6.64},{"aspecting_planet":"Sun","aspected_planet":"Saturn","aspecting_planet_id":0,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":5.86,"diff":5.86},{"aspecting_planet":"Sun","aspected_planet":"Uranus","aspecting_planet_id":0,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":6.4,"diff":96.4},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.91,"diff":64.91},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":1.56,"diff":178.44},{"aspecting_planet":"Moon","aspected_planet":"Venus","aspecting_planet_id":1,"aspected_planet_id":5,"aspect_type":2,"type":"Opposition","orb":1.17,"diff":178.83},{"aspecting_planet":"Moon","aspected_planet":"Saturn","aspecting_planet_id":1,"aspected_planet_id":6,"aspect_type":2,"type":"Opposition","orb":0.39,"diff":179.61},{"aspecting_planet":"Moon","aspected_planet":"Uranus","aspecting_planet_id":1,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.93,"diff":89.07},{"aspecting_planet":"Moon","aspected_planet":"Ascendant","aspecting_planet_id":1,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.55,"diff":120.55},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.29,"diff":2.29},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.23,"diff":123.23},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":2.16,"diff":177.84},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.94,"diff":120.94},{"aspecting_planet":"Mercury","aspected_planet":"Pluto","aspecting_planet_id":3,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.45,"diff":175.55},{"aspecting_planet":"Jupiter","aspected_planet":"Venus","aspecting_planet_id":4,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":0.39,"diff":0.39},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":1.17,"diff":1.17},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.63,"diff":89.37},{"aspecting_planet":"Jupiter","aspected_planet":"Ascendant","aspecting_planet_id":4,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":2.12,"diff":57.88},{"aspecting_planet":"Venus","aspected_planet":"Saturn","aspecting_planet_id":5,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.78,"diff":0.78},{"aspecting_planet":"Venus","aspected_planet":"Uranus","aspecting_planet_id":5,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.24,"diff":89.76},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":1.72,"diff":58.28},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.54,"diff":90.54},{"aspecting_planet":"Saturn","aspected_planet":"Ascendant","aspecting_planet_id":6,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":0.95,"diff":59.05},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.87,"diff":56.13},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.39,"diff":54.61},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":2.38,"diff":87.62}],"planets":[{"name":"Sun","full_degree":57.2003,"norm_degree":27.2003,"speed":0.9629,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Moon","full_degree":231.7352,"norm_degree":21.7352,"speed":12.3389,"is_retro":"false","sign_id":8,"sign":"Scorpio","house":8},{"name":"Mars","full_degree":69.7763,"norm_degree":9.7763,"speed":0.6914,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Mercury","full_degree":67.4912,"norm_degree":7.4912,"speed":2.0745,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Jupiter","full_degree":50.172,"norm_degree":20.172,"speed":0.2368,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Venus","full_degree":50.5645,"norm_degree":20.5645,"speed":1.2292,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Saturn","full_degree":51.3412,"norm_degree":21.3412,"speed":0.1283,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Uranus","full_degree":320.8013,"norm_degree":20.8013,"speed":0.0061,"is_retro":"false","sign_id":11,"sign":"Aquarius","house":12},{"name":"Neptune","full_degree":306.5494,"norm_degree":6.5494,"speed":-0.005,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":11},{"name":"Pluto","full_degree":251.939,"norm_degree":11.939,"speed":-0.0259,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Node","full_degree":116.3003,"norm_degree":26.3003,"speed":-0.1751,"is_retro":"true","sign_id":4,"sign":"Cancer","house":5},{"name":"Chiron","full_degree":255.3443,"norm_degree":15.3443,"speed":-0.0653,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Part of Fortune","full_degree":177.7521,"norm_degree":27.7521,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":7}],"lilith":{"name":"Lilith","full_degree":278.7196,"norm_degree":8.7196,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":10}}}}			"RESULTS : ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Sun-Moon Opposition\"",      \""data\"": \""The opposition between your Sun in Leo and your partner's Moon in Scorpio suggests a dynamic tension in the relationship. This aspect can create a push-pull dynamic where your expressive and vibrant nature may clash with your partner's intense and private emotional world. However, this tension can also lead to growth and understanding if both partners are willing to embrace each other's differences. The opposition aspect indicates a need for balance and compromise, as both partners may have to work on understanding and respecting each other's emotional needs and expressions.\""    },    {      \""title\"": \""Sun Conjunct Mars and Mercury\"",      \""data\"": \""Your Sun's conjunction with Mars and Mercury in Leo indicates a strong drive and assertive communication style. This alignment suggests that you bring enthusiasm and energy to the relationship, with a focus on direct and open communication. The conjunction aspect enhances your ability to express yourself confidently, which can be appealing to your partner. However, it's important to be mindful of potential impatience or impulsiveness in discussions, as the fiery energy of Leo can sometimes lead to heated exchanges.\""    },    {      \""title\"": \""Moon Opposite Jupiter and Venus\"",      \""data\"": \""Your partner's Moon in Scorpio opposing Jupiter and Venus in Taurus highlights a potential challenge in balancing emotional intensity with a desire for stability and comfort. This aspect suggests that your partner may experience fluctuations between wanting deep emotional connections and seeking security in the relationship. The opposition aspect requires both partners to find a middle ground where emotional needs are met without compromising the stability and harmony of the relationship. Open communication and understanding can help navigate these differences.\""    },    {      \""title\"": \""Mars Conjunct Mercury\"",      \""data\"": \""The conjunction of Mars and Mercury in Gemini in your partner's chart indicates a quick and agile mind, with a strong ability to articulate thoughts and ideas. This aspect suggests that your partner is likely to be intellectually stimulating and enjoys engaging in lively discussions. The conjunction aspect enhances mental agility and communication skills, making it easier for your partner to express their thoughts and opinions. However, it's important to be aware of potential restlessness or impatience in conversations, as the Gemini energy can sometimes lead to scattered focus.\""    },    {      \""title\"": \""Venus Square Pluto\"",      \""data\"": \""Your Venus in Virgo square Pluto in Sagittarius indicates a potential challenge in balancing love and intensity in the relationship. This aspect suggests that there may be power struggles or issues of control that need to be addressed. The square aspect creates tension and requires both partners to work on understanding and respecting each other's boundaries. It's important to cultivate trust and open communication to navigate any potential conflicts and ensure a healthy and harmonious relationship.\""    },    {      \""title\"": \""Saturn Trine Uranus\"",      \""data\"": \""The trine between Saturn in Gemini and Uranus in Aquarius in your chart suggests a harmonious blend of structure and innovation. This aspect indicates that you have the ability to balance tradition with a desire for change and progress. The trine aspect enhances your ability to adapt to new situations while maintaining a sense of stability and responsibility. This can be beneficial in the relationship, as it allows you to approach challenges with a practical and open-minded perspective.\""    },    {      \""title\"": \""Overall Compatibility Summary\"",      \""data\"": \""The overall compatibility between you and your partner is a mix of harmonious and challenging aspects. The presence of conjunctions and trines suggests areas of natural compatibility and ease, while oppositions and squares highlight potential areas of tension and growth. The relationship may require conscious effort and compromise to navigate differences and maintain balance. By embracing each other's strengths and working through challenges, the partnership has the potential for growth and mutual understanding.\""    },    {      \""title\"": \""Relationship Strengths and Weaknesses\"",      \""data\"": \""The strengths of the relationship lie in the supportive aspects between personal planets, such as the Sun conjunct Mars and Mercury, which enhance communication and enthusiasm. The trine between Saturn and Uranus also provides a stable foundation for growth and adaptability. However, challenges may arise from the oppositions involving the Moon and Jupiter, as well as the square between Venus and Pluto. These aspects require both partners to work on understanding and respecting each other's emotional needs and boundaries. By focusing on open communication and compromise, the relationship can thrive despite potential obstacles.\""    }  ]}```"",
    ""prompt_tokens"": 5351,"		
											
Elemental Balance			API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for In relationship astrology, **Elemental Balance** and **Modalities** play crucial roles in assessing compatibility and dynamics. The four elements—Fire, Earth, Air, and Water—reveal how partners emotionally, intellectually, physically, and practically align or clash. Fire brings energy and creativity, synergizing well with Air, which provides intellectual stimulation. Earth offers grounding and practicality, finding emotional support and depth in Water. Air stimulates communication and fosters a lively intellectual environment, complemented by Fire's action-oriented nature. Water's emotional depth and intuition create a profound connection with Earth’s stability. The modalities—Cardinal, Fixed, and Mutable—further define the relationship's dynamics: Cardinal signs are initiators but may clash over control, Fixed signs offer stability yet struggle with change, and Mutable signs provide adaptability but may lack direction. Together, these astrological components help map out where harmony naturally occurs, where challenges might arise, and how best to navigate them, offering a nuanced understanding of the potential and pitfalls within the relationship.","user_content":"I was born on August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30' I have added birth chart details of mine and my love relationship partner both now calculate elemental balance of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 3 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response  "},"toolname":"other","json":{"mydetails":{"ascendant":71.03565456897975,"midheaven":327.5598198535195,"vertex":211.32869379691815,"houses":[{"house":1,"sign":"Gemini","sign_id":3,"degree":71.03565},{"house":2,"sign":"Cancer","sign_id":4,"degree":96.08341},{"house":3,"sign":"Leo","sign_id":5,"degree":120.46019},{"house":4,"sign":"Leo","sign_id":5,"degree":147.55982},{"house":5,"sign":"Virgo","sign_id":6,"degree":179.71154},{"house":6,"sign":"Scorpio","sign_id":8,"degree":215.87244},{"house":7,"sign":"Sagittarius","sign_id":9,"degree":251.03565},{"house":8,"sign":"Capricorn","sign_id":10,"degree":276.08341},{"house":9,"sign":"Aquarius","sign_id":11,"degree":300.46019},{"house":10,"sign":"Aquarius","sign_id":11,"degree":327.55982},{"house":11,"sign":"Pisces","sign_id":12,"degree":359.71154},{"house":12,"sign":"Taurus","sign_id":2,"degree":35.87244}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":6.49,"diff":173.51},{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":5.75,"diff":5.75},{"aspecting_planet":"Sun","aspected_planet":"Mercury","aspecting_planet_id":0,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":3.18,"diff":3.18},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":2.76,"diff":2.76},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":9.05,"diff":170.95},{"aspecting_planet":"Moon","aspected_planet":"Mercury","aspecting_planet_id":1,"aspected_planet_id":3,"aspect_type":2,"type":"Opposition","orb":9.67,"diff":170.33},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":3.73,"diff":176.27},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.57,"diff":2.57},{"aspecting_planet":"Mars","aspected_planet":"Jupiter","aspecting_planet_id":2,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":8.52,"diff":8.52},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":3.29,"diff":176.71},{"aspecting_planet":"Mars","aspected_planet":"Ascendant","aspecting_planet_id":2,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.5,"diff":55.5},{"aspecting_planet":"Mercury","aspected_planet":"Jupiter","aspecting_planet_id":3,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":5.94,"diff":5.94},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":5.87,"diff":174.13},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":4,"type":"Square","orb":0.77,"diff":90.77},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":3.38,"diff":93.38},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":3.92,"diff":116.08},{"aspecting_planet":"Saturn","aspected_planet":"Pluto","aspecting_planet_id":6,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":8.78,"diff":171.22},{"aspecting_planet":"Saturn","aspected_planet":"Midheaven","aspecting_planet_id":6,"aspected_planet_id":11,"aspect_type":3,"type":"Trine","orb":3.59,"diff":116.41},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":0.33,"diff":0.33},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.36,"diff":54.64},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":1.2,"diff":121.2},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":2,"type":"Opposition","orb":4.15,"diff":175.85}],"planets":[{"name":"Sun","full_degree":120.7857,"norm_degree":0.7857,"speed":0.9547,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Moon","full_degree":294.295,"norm_degree":24.295,"speed":12.889,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":8},{"name":"Mars","full_degree":126.5393,"norm_degree":6.5393,"speed":0.6404,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Mercury","full_degree":123.9658,"norm_degree":3.9658,"speed":2.0839,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Jupiter","full_degree":118.0226,"norm_degree":28.0226,"speed":0.2231,"is_retro":"false","sign_id":4,"sign":"Cancer","house":2},{"name":"Venus","full_degree":164.4179,"norm_degree":14.4179,"speed":1.0955,"is_retro":"false","sign_id":6,"sign":"Virgo","house":4},{"name":"Saturn","full_degree":83.9703,"norm_degree":23.9703,"speed":0.1129,"is_retro":"false","sign_id":3,"sign":"Gemini","house":1},{"name":"Uranus","full_degree":327.8866,"norm_degree":27.8866,"speed":-0.034,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":10},{"name":"Neptune","full_degree":309.8325,"norm_degree":9.8325,"speed":-0.0267,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":9},{"name":"Pluto","full_degree":255.1901,"norm_degree":15.1901,"speed":-0.0165,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":7},{"name":"Node","full_degree":77.216,"norm_degree":17.216,"speed":-0.0886,"is_retro":"true","sign_id":3,"sign":"Gemini","house":1},{"name":"Chiron","full_degree":274.574,"norm_degree":4.574,"speed":-0.0543,"is_retro":"true","sign_id":10,"sign":"Capricorn","house":7},{"name":"Part of Fortune","full_degree":257.5264,"norm_degree":17.5264,"speed":0,"is_retro":"false","sign_id":9,"sign":"Sagittarius","house":7}],"lilith":{"name":"Lilith","full_degree":7.5172,"norm_degree":7.5172,"speed":0.1119,"is_retro":"false","sign_id":1,"sign":"Aries","house":11}},"fiend_details":{"ascendant":352.28704269998116,"midheaven":264.6664338718442,"vertex":176.90088242133072,"houses":[{"house":1,"sign":"Pisces","sign_id":12,"degree":352.28704},{"house":2,"sign":"Aries","sign_id":1,"degree":29.41937},{"house":3,"sign":"Taurus","sign_id":2,"degree":59.29939},{"house":4,"sign":"Gemini","sign_id":3,"degree":84.66643},{"house":5,"sign":"Cancer","sign_id":4,"degree":109.36512},{"house":6,"sign":"Leo","sign_id":5,"degree":137.28302},{"house":7,"sign":"Virgo","sign_id":6,"degree":172.28704},{"house":8,"sign":"Libra","sign_id":7,"degree":209.41937},{"house":9,"sign":"Scorpio","sign_id":8,"degree":239.29939},{"house":10,"sign":"Sagittarius","sign_id":9,"degree":264.66643},{"house":11,"sign":"Capricorn","sign_id":10,"degree":289.36512},{"house":12,"sign":"Aquarius","sign_id":11,"degree":317.28302}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":5.47,"diff":174.53},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":7.03,"diff":7.03},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":6.64,"diff":6.64},{"aspecting_planet":"Sun","aspected_planet":"Saturn","aspecting_planet_id":0,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":5.86,"diff":5.86},{"aspecting_planet":"Sun","aspected_planet":"Uranus","aspecting_planet_id":0,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":6.4,"diff":96.4},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.91,"diff":64.91},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":1.56,"diff":178.44},{"aspecting_planet":"Moon","aspected_planet":"Venus","aspecting_planet_id":1,"aspected_planet_id":5,"aspect_type":2,"type":"Opposition","orb":1.17,"diff":178.83},{"aspecting_planet":"Moon","aspected_planet":"Saturn","aspecting_planet_id":1,"aspected_planet_id":6,"aspect_type":2,"type":"Opposition","orb":0.39,"diff":179.61},{"aspecting_planet":"Moon","aspected_planet":"Uranus","aspecting_planet_id":1,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.93,"diff":89.07},{"aspecting_planet":"Moon","aspected_planet":"Ascendant","aspecting_planet_id":1,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.55,"diff":120.55},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.29,"diff":2.29},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.23,"diff":123.23},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":2.16,"diff":177.84},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.94,"diff":120.94},{"aspecting_planet":"Mercury","aspected_planet":"Pluto","aspecting_planet_id":3,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.45,"diff":175.55},{"aspecting_planet":"Jupiter","aspected_planet":"Venus","aspecting_planet_id":4,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":0.39,"diff":0.39},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":1.17,"diff":1.17},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.63,"diff":89.37},{"aspecting_planet":"Jupiter","aspected_planet":"Ascendant","aspecting_planet_id":4,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":2.12,"diff":57.88},{"aspecting_planet":"Venus","aspected_planet":"Saturn","aspecting_planet_id":5,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.78,"diff":0.78},{"aspecting_planet":"Venus","aspected_planet":"Uranus","aspecting_planet_id":5,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.24,"diff":89.76},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":1.72,"diff":58.28},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.54,"diff":90.54},{"aspecting_planet":"Saturn","aspected_planet":"Ascendant","aspecting_planet_id":6,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":0.95,"diff":59.05},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.87,"diff":56.13},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.39,"diff":54.61},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":2.38,"diff":87.62}],"planets":[{"name":"Sun","full_degree":57.2003,"norm_degree":27.2003,"speed":0.9629,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Moon","full_degree":231.7352,"norm_degree":21.7352,"speed":12.3389,"is_retro":"false","sign_id":8,"sign":"Scorpio","house":8},{"name":"Mars","full_degree":69.7763,"norm_degree":9.7763,"speed":0.6914,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Mercury","full_degree":67.4912,"norm_degree":7.4912,"speed":2.0745,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Jupiter","full_degree":50.172,"norm_degree":20.172,"speed":0.2368,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Venus","full_degree":50.5645,"norm_degree":20.5645,"speed":1.2292,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Saturn","full_degree":51.3412,"norm_degree":21.3412,"speed":0.1283,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Uranus","full_degree":320.8013,"norm_degree":20.8013,"speed":0.0061,"is_retro":"false","sign_id":11,"sign":"Aquarius","house":12},{"name":"Neptune","full_degree":306.5494,"norm_degree":6.5494,"speed":-0.005,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":11},{"name":"Pluto","full_degree":251.939,"norm_degree":11.939,"speed":-0.0259,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Node","full_degree":116.3003,"norm_degree":26.3003,"speed":-0.1751,"is_retro":"true","sign_id":4,"sign":"Cancer","house":5},{"name":"Chiron","full_degree":255.3443,"norm_degree":15.3443,"speed":-0.0653,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Part of Fortune","full_degree":177.7521,"norm_degree":27.7521,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":7}],"lilith":{"name":"Lilith","full_degree":278.7196,"norm_degree":8.7196,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":10}}}}			"RESULTS : ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Elemental Balance\"",      \""data\"": \""Your elemental balance shows a strong presence of Fire and Earth elements, with your Sun, Mars, and Mercury in Leo (Fire), and your partner's Sun, Jupiter, Venus, and Saturn in Taurus (Earth). This combination suggests a dynamic where your fiery enthusiasm and creativity can be grounded by your partner's practical and stable nature. However, the lack of Water elements might indicate challenges in emotional expression and sensitivity, requiring conscious effort to nurture emotional understanding.\""    },    {      \""title\"": \""Fire and Earth Synergy\"",      \""data\"": \""The Fire element in your chart, represented by Leo, brings vitality and a desire for self-expression. This is complemented by your partner's Earth element in Taurus, which offers stability and a practical approach to life. This synergy can create a balanced relationship where your enthusiasm is supported by your partner's reliability. However, the fixed nature of both signs can lead to stubbornness, requiring compromise and flexibility.\""    },    {      \""title\"": \""Air and Communication\"",      \""data\"": \""Your Gemini Ascendant and your partner's Mercury in Gemini highlight the importance of communication in your relationship. Gemini's Air element fosters intellectual connection and adaptability, making communication a strong point. This can help bridge any differences arising from the elemental imbalance, as both partners are likely to engage in open dialogue and exchange of ideas.\""    },    {      \""title\"": \""Modalities and Relationship Dynamics\"",      \""data\"": \""The modalities in your charts reveal a mix of Fixed and Mutable signs. Your Leo planets are Fixed, indicating a strong will and determination, while your partner's Taurus planets are also Fixed, suggesting stability but potential resistance to change. The Mutable influence from your Gemini Ascendant and your partner's Gemini Mercury adds adaptability, helping to navigate any rigidity in the relationship. Balancing these modalities can lead to a dynamic yet stable partnership.\""    },    {      \""title\"": \""Sun-Moon Opposition\"",      \""data\"": \""The opposition between your Sun in Leo and your partner's Moon in Scorpio suggests a dynamic tension between self-expression and emotional depth. This aspect can create a push-pull dynamic where your need for recognition and creativity may clash with your partner's emotional intensity and need for privacy. Understanding and respecting each other's emotional needs can transform this tension into a source of growth and mutual support.\""    },    {      \""title\"": \""Venus-Pluto Square\"",      \""data\"": \""Your Venus in Virgo square your partner's Pluto in Sagittarius indicates potential challenges in love and intimacy. This aspect can bring intense emotions and power struggles, requiring both partners to work on trust and vulnerability. By addressing these challenges, the relationship can deepen and transform, leading to a more profound connection.\""    },    {      \""title\"": \""Saturn-Uranus Trine\"",      \""data\"": \""The trine between your Saturn in Gemini and your partner's Uranus in Aquarius suggests a harmonious blend of tradition and innovation. This aspect supports stability while encouraging growth and change, allowing the relationship to evolve over time. Embracing new ideas and approaches can strengthen the bond and keep the relationship dynamic.\""    }  ],  \""summary\"": [    {      \""title\"": \""Summary\"",      \""data\"": \""The elemental balance in your relationship highlights a strong Fire and Earth presence, with Air facilitating communication. The Fixed modality suggests stability but potential rigidity, while the Mutable influence adds adaptability. Key aspects such as the Sun-Moon opposition and Venus-Pluto square indicate areas for growth through understanding and compromise.\""    }  ],  \""recommendations\"": [    {      \""title\"": \""Recommendations\"",      \""data\"": \""To enhance your relationship, focus on nurturing emotional expression and sensitivity, given the lack of Water elements. Embrace open communication to bridge differences and foster understanding. Work on flexibility and compromise to balance the Fixed nature of your signs. Address any power struggles with trust and vulnerability, and embrace new ideas to keep the relationship dynamic and evolving.\""    }  ]}```"",
    ""prompt_tokens"": 5189,"		
											
Timing and Transits			API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation important aspects of assessing the potential for In relationship astrology, **Timing and Transits** are critical for understanding the dynamics at play through the lens of current and future planetary movements. Analyzing the **Current Transits to the Composite Chart** reveals how external influences affect the relationship, with transits like Saturn highlighting themes of commitment and structural testing, while Uranus might bring unexpected changes. Simultaneously, **Personal Transits and Progressions** to each individual’s chart show personal growth and challenges that directly impact the relationship; for instance, Jupiter transiting over a personal Venus could enhance romantic and social aspects, whereas Saturn over the Moon might prompt emotional maturing that affects interpersonal dynamics. Looking at **Long-Term Growth Patterns**, upcoming transits and progressions forecast potential growth areas and upcoming challenges, providing a roadmap for navigating and fostering the relationship's development. This comprehensive approach not only helps in understanding and managing current dynamics but also in strategically planning for future phases, aligning personal growth with the relationship’s evolution for enhanced harmony and understanding.","user_content":"I was born on August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30' I have added birth chart details of mine and my love relationship partner both now calculate timing and transit of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 3 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response "},"toolname":"other","json":{"mydetails":{"month_start_date":"1-7-2025","month_end_date":"31-7-2025","ascendant":"Gemini","transit_relation":[{"transit_planet":"Venus","natal_planet":"Moon","type":"Trine","orb":2.02,"date":"1-7-2025"},{"transit_planet":"Pluto","natal_planet":"Mercury","type":"Opposition","orb":0.83,"date":"1-7-2025"},{"transit_planet":"Mercury","natal_planet":"Mars","type":"Conjunction","orb":0.03,"date":"2-7-2025"},{"transit_planet":"Venus","natal_planet":"Sun","type":"Sextile","orb":0.07,"date":"5-7-2025"},{"transit_planet":"Mars","natal_planet":"Ascendant","type":"Square","orb":0.19,"date":"6-7-2025"},{"transit_planet":"Mars","natal_planet":"Venus","type":"Conjunction","orb":0.03,"date":"12-7-2025"},{"transit_planet":"Venus","natal_planet":"Ascendant","type":"Conjunction","orb":0.29,"date":"14-7-2025"},{"transit_planet":"Venus","natal_planet":"Saturn","type":"Conjunction","orb":0.41,"date":"26-7-2025"},{"transit_planet":"Uranus","natal_planet":"Sun","type":"Sextile","orb":0.01,"date":"27-7-2025"},{"transit_planet":"Mars","natal_planet":"Moon","type":"Trine","orb":0.27,"date":"28-7-2025"},{"transit_planet":"Mercury","natal_planet":"Ascendant","type":"Sextile","orb":0.03,"date":"29-7-2025"},{"transit_planet":"Saturn","natal_planet":"Sun","type":"Trine","orb":0.87,"date":"31-7-2025"}],"retrogrades":[],"moon_phase":[]},"fiend_details":{"month_start_date":"1-7-2025","month_end_date":"31-7-2025","ascendant":"Pisces","transit_relation":[{"transit_planet":"Venus","natal_planet":"Moon","type":"Opposition","orb":4.58,"date":"1-7-2025"},{"transit_planet":"Venus","natal_planet":"Sun","type":"Conjunction","orb":0.21,"date":"2-7-2025"},{"transit_planet":"Venus","natal_planet":"Mercury","type":"Conjunction","orb":0.11,"date":"11-7-2025"},{"transit_planet":"Venus","natal_planet":"Mars","type":"Conjunction","orb":0.16,"date":"13-7-2025"},{"transit_planet":"Mars","natal_planet":"Moon","type":"Sextile","orb":0.15,"date":"24-7-2025"},{"transit_planet":"Venus","natal_planet":"Ascendant","type":"Square","orb":0.19,"date":"24-7-2025"},{"transit_planet":"Mars","natal_planet":"Ascendant","type":"Opposition","orb":0.09,"date":"25-7-2025"}],"retrogrades":[],"moon_phase":[]}}}			"RESULTS : ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Current Transits to the Composite Chart\"",      \""data\"": \""The current transits to your composite chart reveal significant dynamics in your relationship. With Venus trine Moon in your chart, there is a harmonious flow of emotional and romantic energy, suggesting a period of increased affection and understanding. However, Pluto opposing Mercury indicates potential communication challenges or power struggles, urging both partners to engage in deep, transformative conversations to overcome misunderstandings.\""    },    {      \""title\"": \""Personal Transits and Progressions\"",      \""data\"": \""For you, Mercury conjunct Mars suggests a time of assertive communication and dynamic action, which can be beneficial for expressing desires and goals within the relationship. Meanwhile, your partner's Venus conjunct Sun transit highlights a period of personal charm and attraction, enhancing their ability to draw positive attention and affection. These personal transits indicate a time of personal growth that can positively influence the relationship if managed well.\""    },    {      \""title\"": \""Long-Term Growth Patterns\"",      \""data\"": \""Looking ahead, Uranus sextile Sun in your chart suggests upcoming opportunities for innovation and change, encouraging you to embrace new experiences and perspectives within the relationship. Saturn trine Sun indicates a period of stability and maturity, where long-term commitments and responsibilities can be solidified. These patterns suggest a promising future for growth and development in your partnership, provided both partners are willing to adapt and mature together.\""    },    {      \""title\"": \""Summary\"",      \""data\"": \""The astrological analysis highlights a period of emotional harmony and potential communication challenges. Personal growth is evident for both partners, with opportunities for innovation and stability in the long term. Embracing these dynamics can enhance the relationship's evolution.\""    },    {      \""title\"": \""Recommendations\"",      \""data\"": \""To navigate these transits effectively, focus on open and honest communication, especially during challenging periods. Embrace the harmonious energy of Venus trine Moon by spending quality time together and expressing affection. Utilize the transformative potential of Pluto opposing Mercury by engaging in deep, meaningful conversations. Encourage each other's personal growth and be open to change, as indicated by Uranus sextile Sun, to foster a resilient and evolving partnership.\""    }  ]}```"",
    ""prompt_tokens"": 1328,"		
											
Karmic and Soulmate Indicators			API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation important aspects of assessing the potential for In relationship astrology, **Karmic and Soulmate Indicators** focus on deeper, often spiritual dimensions of connections through specific astrological markers. **Chiron and the Nodes (North and South)** are pivotal in identifying healing themes and karmic lessons within a relationship. Chiron's placement can reveal the core wounds that partners may help each other to heal, whereas the Nodes indicate soul growth directions and past life connections, offering insights into the developmental tasks that the relationship facilitates for each individual. Adding to this, **optional asteroids** like Juno, Eros, and Psyche provide further layers of understanding: Juno highlights the dynamics of commitment and true partnership; Eros explores the sexual and passionate attraction; and Psyche delves into the spiritual and emotional connection that binds souls on a deeper level. These elements together sketch a complex portrait of the potential spiritual and karmic significance of a relationship, revealing how partners are intertwined not just in the present but potentially across lifetimes, highlighting a path towards mutual growth and healing.","user_content":"I was born on August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on  June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30' I have added birth chart details of mine and my love relationship partner both now calculate Karmic and Soulmate Indicators of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 3 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response "},"toolname":"other","json":{"mydetails":{"ascendant":71.03565456897975,"midheaven":327.5598198535195,"vertex":211.32869379691815,"houses":[{"house":1,"sign":"Gemini","sign_id":3,"degree":71.03565},{"house":2,"sign":"Cancer","sign_id":4,"degree":96.08341},{"house":3,"sign":"Leo","sign_id":5,"degree":120.46019},{"house":4,"sign":"Leo","sign_id":5,"degree":147.55982},{"house":5,"sign":"Virgo","sign_id":6,"degree":179.71154},{"house":6,"sign":"Scorpio","sign_id":8,"degree":215.87244},{"house":7,"sign":"Sagittarius","sign_id":9,"degree":251.03565},{"house":8,"sign":"Capricorn","sign_id":10,"degree":276.08341},{"house":9,"sign":"Aquarius","sign_id":11,"degree":300.46019},{"house":10,"sign":"Aquarius","sign_id":11,"degree":327.55982},{"house":11,"sign":"Pisces","sign_id":12,"degree":359.71154},{"house":12,"sign":"Taurus","sign_id":2,"degree":35.87244}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":6.49,"diff":173.51},{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":5.75,"diff":5.75},{"aspecting_planet":"Sun","aspected_planet":"Mercury","aspecting_planet_id":0,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":3.18,"diff":3.18},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":2.76,"diff":2.76},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":9.05,"diff":170.95},{"aspecting_planet":"Moon","aspected_planet":"Mercury","aspecting_planet_id":1,"aspected_planet_id":3,"aspect_type":2,"type":"Opposition","orb":9.67,"diff":170.33},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":3.73,"diff":176.27},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.57,"diff":2.57},{"aspecting_planet":"Mars","aspected_planet":"Jupiter","aspecting_planet_id":2,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":8.52,"diff":8.52},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":3.29,"diff":176.71},{"aspecting_planet":"Mars","aspected_planet":"Ascendant","aspecting_planet_id":2,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.5,"diff":55.5},{"aspecting_planet":"Mercury","aspected_planet":"Jupiter","aspecting_planet_id":3,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":5.94,"diff":5.94},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":5.87,"diff":174.13},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":4,"type":"Square","orb":0.77,"diff":90.77},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":3.38,"diff":93.38},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":3.92,"diff":116.08},{"aspecting_planet":"Saturn","aspected_planet":"Pluto","aspecting_planet_id":6,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":8.78,"diff":171.22},{"aspecting_planet":"Saturn","aspected_planet":"Midheaven","aspecting_planet_id":6,"aspected_planet_id":11,"aspect_type":3,"type":"Trine","orb":3.59,"diff":116.41},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":0.33,"diff":0.33},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.36,"diff":54.64},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":1.2,"diff":121.2},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":2,"type":"Opposition","orb":4.15,"diff":175.85}],"planets":[{"name":"Sun","full_degree":120.7857,"norm_degree":0.7857,"speed":0.9547,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Moon","full_degree":294.295,"norm_degree":24.295,"speed":12.889,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":8},{"name":"Mars","full_degree":126.5393,"norm_degree":6.5393,"speed":0.6404,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Mercury","full_degree":123.9658,"norm_degree":3.9658,"speed":2.0839,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Jupiter","full_degree":118.0226,"norm_degree":28.0226,"speed":0.2231,"is_retro":"false","sign_id":4,"sign":"Cancer","house":2},{"name":"Venus","full_degree":164.4179,"norm_degree":14.4179,"speed":1.0955,"is_retro":"false","sign_id":6,"sign":"Virgo","house":4},{"name":"Saturn","full_degree":83.9703,"norm_degree":23.9703,"speed":0.1129,"is_retro":"false","sign_id":3,"sign":"Gemini","house":1},{"name":"Uranus","full_degree":327.8866,"norm_degree":27.8866,"speed":-0.034,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":10},{"name":"Neptune","full_degree":309.8325,"norm_degree":9.8325,"speed":-0.0267,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":9},{"name":"Pluto","full_degree":255.1901,"norm_degree":15.1901,"speed":-0.0165,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":7},{"name":"Node","full_degree":77.216,"norm_degree":17.216,"speed":-0.0886,"is_retro":"true","sign_id":3,"sign":"Gemini","house":1},{"name":"Chiron","full_degree":274.574,"norm_degree":4.574,"speed":-0.0543,"is_retro":"true","sign_id":10,"sign":"Capricorn","house":7},{"name":"Part of Fortune","full_degree":257.5264,"norm_degree":17.5264,"speed":0,"is_retro":"false","sign_id":9,"sign":"Sagittarius","house":7}],"lilith":{"name":"Lilith","full_degree":7.5172,"norm_degree":7.5172,"speed":0.1119,"is_retro":"false","sign_id":1,"sign":"Aries","house":11}},"fiend_details":{"ascendant":352.28704269998116,"midheaven":264.6664338718442,"vertex":176.90088242133072,"houses":[{"house":1,"sign":"Pisces","sign_id":12,"degree":352.28704},{"house":2,"sign":"Aries","sign_id":1,"degree":29.41937},{"house":3,"sign":"Taurus","sign_id":2,"degree":59.29939},{"house":4,"sign":"Gemini","sign_id":3,"degree":84.66643},{"house":5,"sign":"Cancer","sign_id":4,"degree":109.36512},{"house":6,"sign":"Leo","sign_id":5,"degree":137.28302},{"house":7,"sign":"Virgo","sign_id":6,"degree":172.28704},{"house":8,"sign":"Libra","sign_id":7,"degree":209.41937},{"house":9,"sign":"Scorpio","sign_id":8,"degree":239.29939},{"house":10,"sign":"Sagittarius","sign_id":9,"degree":264.66643},{"house":11,"sign":"Capricorn","sign_id":10,"degree":289.36512},{"house":12,"sign":"Aquarius","sign_id":11,"degree":317.28302}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":5.47,"diff":174.53},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":7.03,"diff":7.03},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":6.64,"diff":6.64},{"aspecting_planet":"Sun","aspected_planet":"Saturn","aspecting_planet_id":0,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":5.86,"diff":5.86},{"aspecting_planet":"Sun","aspected_planet":"Uranus","aspecting_planet_id":0,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":6.4,"diff":96.4},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.91,"diff":64.91},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":1.56,"diff":178.44},{"aspecting_planet":"Moon","aspected_planet":"Venus","aspecting_planet_id":1,"aspected_planet_id":5,"aspect_type":2,"type":"Opposition","orb":1.17,"diff":178.83},{"aspecting_planet":"Moon","aspected_planet":"Saturn","aspecting_planet_id":1,"aspected_planet_id":6,"aspect_type":2,"type":"Opposition","orb":0.39,"diff":179.61},{"aspecting_planet":"Moon","aspected_planet":"Uranus","aspecting_planet_id":1,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.93,"diff":89.07},{"aspecting_planet":"Moon","aspected_planet":"Ascendant","aspecting_planet_id":1,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.55,"diff":120.55},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.29,"diff":2.29},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.23,"diff":123.23},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":2.16,"diff":177.84},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.94,"diff":120.94},{"aspecting_planet":"Mercury","aspected_planet":"Pluto","aspecting_planet_id":3,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.45,"diff":175.55},{"aspecting_planet":"Jupiter","aspected_planet":"Venus","aspecting_planet_id":4,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":0.39,"diff":0.39},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":1.17,"diff":1.17},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.63,"diff":89.37},{"aspecting_planet":"Jupiter","aspected_planet":"Ascendant","aspecting_planet_id":4,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":2.12,"diff":57.88},{"aspecting_planet":"Venus","aspected_planet":"Saturn","aspecting_planet_id":5,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.78,"diff":0.78},{"aspecting_planet":"Venus","aspected_planet":"Uranus","aspecting_planet_id":5,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.24,"diff":89.76},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":1.72,"diff":58.28},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.54,"diff":90.54},{"aspecting_planet":"Saturn","aspected_planet":"Ascendant","aspecting_planet_id":6,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":0.95,"diff":59.05},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.87,"diff":56.13},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.39,"diff":54.61},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":2.38,"diff":87.62}],"planets":[{"name":"Sun","full_degree":57.2003,"norm_degree":27.2003,"speed":0.9629,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Moon","full_degree":231.7352,"norm_degree":21.7352,"speed":12.3389,"is_retro":"false","sign_id":8,"sign":"Scorpio","house":8},{"name":"Mars","full_degree":69.7763,"norm_degree":9.7763,"speed":0.6914,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Mercury","full_degree":67.4912,"norm_degree":7.4912,"speed":2.0745,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Jupiter","full_degree":50.172,"norm_degree":20.172,"speed":0.2368,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Venus","full_degree":50.5645,"norm_degree":20.5645,"speed":1.2292,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Saturn","full_degree":51.3412,"norm_degree":21.3412,"speed":0.1283,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Uranus","full_degree":320.8013,"norm_degree":20.8013,"speed":0.0061,"is_retro":"false","sign_id":11,"sign":"Aquarius","house":12},{"name":"Neptune","full_degree":306.5494,"norm_degree":6.5494,"speed":-0.005,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":11},{"name":"Pluto","full_degree":251.939,"norm_degree":11.939,"speed":-0.0259,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Node","full_degree":116.3003,"norm_degree":26.3003,"speed":-0.1751,"is_retro":"true","sign_id":4,"sign":"Cancer","house":5},{"name":"Chiron","full_degree":255.3443,"norm_degree":15.3443,"speed":-0.0653,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Part of Fortune","full_degree":177.7521,"norm_degree":27.7521,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":7}],"lilith":{"name":"Lilith","full_degree":278.7196,"norm_degree":8.7196,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":10}}}}			"RESULTS : ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Chiron and Healing Themes\"",      \""data\"": \""Chiron in your chart is positioned in Capricorn in the 7th house, indicating that your core wounds are related to relationships and partnerships. Your partner's Chiron is in Sagittarius in the 9th house, suggesting wounds around beliefs and higher learning. Together, you may help each other heal by providing stability and understanding in your relationship, allowing for growth in both personal beliefs and partnership dynamics.\""    },    {      \""title\"": \""North and South Nodes - Karmic Lessons\"",      \""data\"": \""Your North Node is in Gemini in the 1st house, pointing towards a life path of self-discovery and communication. Your partner's North Node is in Cancer in the 5th house, indicating a journey towards nurturing and creative expression. The relationship encourages you both to embrace these paths, with you learning to express yourself more openly and your partner finding joy in nurturing and creativity.\""    },    {      \""title\"": \""Juno - Commitment and Partnership\"",      \""data\"": \""Juno's placement in your charts can reveal the dynamics of commitment. While Juno is not explicitly listed in your data, the aspects involving Venus and Saturn in both charts suggest a strong emphasis on loyalty and long-term commitment. This indicates a potential for a stable and enduring partnership, where both partners value dedication and responsibility.\""    },    {      \""title\"": \""Eros - Passionate Attraction\"",      \""data\"": \""Eros, though not directly mentioned, can be inferred through the aspects involving Mars and Venus. In your chart, Mars in Leo conjunct Mercury and Jupiter suggests a vibrant and enthusiastic approach to love, while your partner's Venus in Taurus conjunct Jupiter and Saturn indicates a sensual and grounded attraction. Together, these placements suggest a passionate and dynamic connection, blending enthusiasm with sensuality.\""    },    {      \""title\"": \""Psyche - Spiritual and Emotional Connection\"",      \""data\"": \""Psyche's influence can be seen through the Moon's aspects in both charts. Your Moon in Capricorn in the 8th house opposite your partner's Moon in Scorpio in the 8th house suggests a deep emotional and spiritual bond. This connection may feel intense and transformative, allowing both partners to explore the depths of their emotions and spiritual understanding together.\""    },    {      \""title\"": \""Sun and Moon Aspects - Core Identity and Emotions\"",      \""data\"": \""The Sun and Moon aspects in your charts highlight the core dynamics of your relationship. Your Sun in Leo conjunct Mars and Mercury suggests a vibrant and communicative identity, while your partner's Sun in Taurus conjunct Venus and Saturn indicates a stable and loving nature. The opposition between your Moon in Capricorn and your partner's Moon in Scorpio suggests emotional challenges, but also the potential for deep emotional growth and understanding.\""    },    {      \""title\"": \""Saturn and Uranus - Stability and Change\"",      \""data\"": \""Saturn's trine with Uranus in your chart suggests a harmonious balance between stability and change, indicating that you are capable of adapting to new circumstances while maintaining a solid foundation. In your partner's chart, Saturn's conjunction with Venus and Jupiter in Taurus suggests a strong desire for stability in love, but the square with Uranus indicates potential disruptions. Together, these placements suggest a relationship that can weather changes while maintaining a strong commitment.\""    }  ],  \""summary\"": \""The astrological analysis of your relationship highlights a complex interplay of karmic lessons, healing themes, and deep emotional connections. The presence of Chiron and the Nodes suggests that your relationship is a significant part of your soul's journey, offering opportunities for growth and healing. The aspects involving Venus, Mars, and the Moon indicate a passionate and emotionally intense connection, while the influence of Saturn and Uranus suggests a balance between stability and change. Overall, the relationship holds the potential for mutual growth and a deep, transformative bond.\"",  \""recommendations\"": \""To nurture this relationship, focus on open communication and understanding each other's emotional needs. Embrace the karmic lessons and healing opportunities presented by Chiron and the Nodes, and work together to support each other's growth. Balance the passionate energy of Mars and Venus with the stability offered by Saturn, and be open to changes and new experiences. By doing so, you can create a harmonious and fulfilling partnership that supports both individuals' spiritual and emotional development.\""}```"",
    ""prompt_tokens"": 5194,"		
											
Synastry Horoscope More Data			API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else and always answer as astrolger not AI BOT","user_content":"I was born on August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on  June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30 .  Keeping western astrology in mind and keeping this as main source info I need to know details of Sun-Sun Sextile  in love relationship partner as paragraph and also need to know the significance and impact  in my life, you have planet , aspect and house info given in json reposne must be in json format as {Sun-Sun Sextile:data} here data is dynamic data form bot and must be a paragraph with 3 sentences (minimum 6 paragraphs ) for Sun-Sun Sextile  in love relationship partner  make it real for me I don't need theory context in response you must add context of planet , aspect and house if any. Dont give any Additional JSON data in response "},"toolname":"other","json":{"first":[{"name":"Sun","full_degree":57.2003,"norm_degree":27.2003,"speed":0.9629,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Moon","full_degree":231.7352,"norm_degree":21.7352,"speed":12.3389,"is_retro":"false","sign_id":8,"sign":"Scorpio","house":8},{"name":"Mars","full_degree":69.7763,"norm_degree":9.7763,"speed":0.6914,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Mercury","full_degree":67.4912,"norm_degree":7.4912,"speed":2.0745,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Jupiter","full_degree":50.172,"norm_degree":20.172,"speed":0.2368,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Venus","full_degree":50.5645,"norm_degree":20.5645,"speed":1.2292,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Saturn","full_degree":51.3412,"norm_degree":21.3412,"speed":0.1283,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Uranus","full_degree":320.8013,"norm_degree":20.8013,"speed":0.0061,"is_retro":"false","sign_id":11,"sign":"Aquarius","house":12},{"name":"Neptune","full_degree":306.5494,"norm_degree":6.5494,"speed":-0.005,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":11},{"name":"Pluto","full_degree":251.939,"norm_degree":11.939,"speed":-0.0259,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Node","full_degree":116.3003,"norm_degree":26.3003,"speed":-0.1751,"is_retro":"true","sign_id":4,"sign":"Cancer","house":5},{"name":"Chiron","full_degree":255.3443,"norm_degree":15.3443,"speed":-0.0653,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Part of Fortune","full_degree":177.7521,"norm_degree":27.7521,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":7}],"second":[{"name":"Sun","full_degree":120.7857,"norm_degree":0.7857,"speed":0.9547,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Moon","full_degree":294.295,"norm_degree":24.295,"speed":12.889,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":8},{"name":"Mars","full_degree":126.5393,"norm_degree":6.5393,"speed":0.6404,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Mercury","full_degree":123.9658,"norm_degree":3.9658,"speed":2.0839,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Jupiter","full_degree":118.0226,"norm_degree":28.0226,"speed":0.2231,"is_retro":"false","sign_id":4,"sign":"Cancer","house":2},{"name":"Venus","full_degree":164.4179,"norm_degree":14.4179,"speed":1.0955,"is_retro":"false","sign_id":6,"sign":"Virgo","house":4},{"name":"Saturn","full_degree":83.9703,"norm_degree":23.9703,"speed":0.1129,"is_retro":"false","sign_id":3,"sign":"Gemini","house":1},{"name":"Uranus","full_degree":327.8866,"norm_degree":27.8866,"speed":-0.034,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":10},{"name":"Neptune","full_degree":309.8325,"norm_degree":9.8325,"speed":-0.0267,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":9},{"name":"Pluto","full_degree":255.1901,"norm_degree":15.1901,"speed":-0.0165,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":7},{"name":"Node","full_degree":77.216,"norm_degree":17.216,"speed":-0.0886,"is_retro":"true","sign_id":3,"sign":"Gemini","house":1},{"name":"Chiron","full_degree":274.574,"norm_degree":4.574,"speed":-0.0543,"is_retro":"true","sign_id":10,"sign":"Capricorn","house":7},{"name":"Part of Fortune","full_degree":257.5264,"norm_degree":17.5264,"speed":0,"is_retro":"false","sign_id":9,"sign":"Sagittarius","house":7}],"synastry":{"house_1":[{"name":"Sun","synastry_house":12},{"name":"Moon","synastry_house":6},{"name":"Mars","synastry_house":12},{"name":"Mercury","synastry_house":12},{"name":"Jupiter","synastry_house":12},{"name":"Venus","synastry_house":12},{"name":"Saturn","synastry_house":12},{"name":"Uranus","synastry_house":9},{"name":"Neptune","synastry_house":9},{"name":"Pluto","synastry_house":7},{"name":"Node","synastry_house":2},{"name":"Chiron","synastry_house":7},{"name":"Part of Fortune","synastry_house":4}],"house_2":[{"name":"Sun","synastry_house":5},{"name":"Moon","synastry_house":11},{"name":"Mars","synastry_house":5},{"name":"Mercury","synastry_house":5},{"name":"Jupiter","synastry_house":5},{"name":"Venus","synastry_house":6},{"name":"Saturn","synastry_house":3},{"name":"Uranus","synastry_house":12},{"name":"Neptune","synastry_house":11},{"name":"Pluto","synastry_house":9},{"name":"Node","synastry_house":3},{"name":"Chiron","synastry_house":10},{"name":"Part of Fortune","synastry_house":9}],"aspects":[{"first":"Sun","second":"Sun","type":"Sextile","orb":3.59},{"first":"Sun","second":"Moon","type":"Trine","orb":2.91},{"first":"Sun","second":"Mars","type":"Sextile","orb":9.34},{"first":"Sun","second":"Mercury","type":"Sextile","orb":6.77},{"first":"Sun","second":"Jupiter","type":"Sextile","orb":0.82},{"first":"Sun","second":"Uranus","type":"Square","orb":0.69},{"first":"Sun","second":"Midheaven","type":"Square","orb":0.36},{"first":"Moon","second":"Sun","type":"Trine","orb":9.05},{"first":"Moon","second":"Moon","type":"Sextile","orb":2.56},{"first":"Moon","second":"Jupiter","type":"Trine","orb":6.29},{"first":"Moon","second":"Venus","type":"Sextile","orb":7.32},{"first":"Moon","second":"Saturn","type":"Quincunx","orb":2.24},{"first":"Moon","second":"Uranus","type":"Square","orb":6.15},{"first":"Moon","second":"Chiron","type":"Semi Square","orb":2.16},{"first":"Moon","second":"Midheaven","type":"Square","orb":5.82},{"first":"Mars","second":"Sun","type":"Sextile","orb":8.99},{"first":"Mars","second":"Mars","type":"Sextile","orb":3.24},{"first":"Mars","second":"Mercury","type":"Sextile","orb":5.81},{"first":"Mars","second":"Venus","type":"Square","orb":4.64},{"first":"Mars","second":"Neptune","type":"Trine","orb":0.06},{"first":"Mars","second":"Pluto","type":"Opposition","orb":5.41},{"first":"Mars","second":"Node","type":"Conjunction","orb":7.44},{"first":"Mars","second":"Part of Fortune","type":"Opposition","orb":7.75},{"first":"Mars","second":"Ascendant","type":"Conjunction","orb":1.26},{"first":"Mars","second":"Descendant","type":"Opposition","orb":1.26},{"first":"Mercury","second":"Sun","type":"Sextile","orb":6.71},{"first":"Mercury","second":"Mars","type":"Sextile","orb":0.95},{"first":"Mercury","second":"Mercury","type":"Sextile","orb":3.53},{"first":"Mercury","second":"Jupiter","type":"Sextile","orb":9.47},{"first":"Mercury","second":"Venus","type":"Square","orb":6.93},{"first":"Mercury","second":"Uranus","type":"Square","orb":9.6},{"first":"Mercury","second":"Neptune","type":"Trine","orb":2.34},{"first":"Mercury","second":"Pluto","type":"Opposition","orb":7.7},{"first":"Mercury","second":"Node","type":"Conjunction","orb":9.72},{"first":"Mercury","second":"Chiron","type":"Quincunx","orb":2.92},{"first":"Mercury","second":"Ascendant","type":"Conjunction","orb":3.54},{"first":"Mercury","second":"Midheaven","type":"Square","orb":9.93},{"first":"Mercury","second":"Descendant","type":"Opposition","orb":3.54},{"first":"Jupiter","second":"Sun","type":"Quintile","orb":1.39},{"first":"Jupiter","second":"Moon","type":"Trine","orb":4.12},{"first":"Jupiter","second":"Mercury","type":"Quintile","orb":1.79},{"first":"Jupiter","second":"Jupiter","type":"Sextile","orb":7.85},{"first":"Jupiter","second":"Venus","type":"Trine","orb":5.75},{"first":"Jupiter","second":"Uranus","type":"Square","orb":7.71},{"first":"Jupiter","second":"Node","type":"Semi Sextile","orb":2.96},{"first":"Jupiter","second":"Part of Fortune","type":"Quincunx","orb":2.65},{"first":"Jupiter","second":"Midheaven","type":"Square","orb":7.39},{"first":"Venus","second":"Sun","type":"Quintile","orb":1.78},{"first":"Venus","second":"Moon","type":"Trine","orb":3.73},{"first":"Venus","second":"Mercury","type":"Quintile","orb":1.4},{"first":"Venus","second":"Jupiter","type":"Sextile","orb":7.46},{"first":"Venus","second":"Venus","type":"Trine","orb":6.15},{"first":"Venus","second":"Uranus","type":"Square","orb":7.32},{"first":"Venus","second":"Midheaven","type":"Square","orb":7},{"first":"Saturn","second":"Sun","type":"Sextile","orb":9.44},{"first":"Saturn","second":"Moon","type":"Trine","orb":2.95},{"first":"Saturn","second":"Mercury","type":"Quintile","orb":0.62},{"first":"Saturn","second":"Jupiter","type":"Sextile","orb":6.68},{"first":"Saturn","second":"Venus","type":"Trine","orb":6.92},{"first":"Saturn","second":"Saturn","type":"Semi Sextile","orb":2.63},{"first":"Saturn","second":"Uranus","type":"Square","orb":6.55},{"first":"Saturn","second":"Midheaven","type":"Square","orb":6.22},{"first":"Uranus","second":"Saturn","type":"Trine","orb":3.17},{"first":"Uranus","second":"Uranus","type":"Conjunction","orb":7.09},{"first":"Uranus","second":"Pluto","type":"Sextile","orb":5.61},{"first":"Uranus","second":"Node","type":"Trine","orb":3.59},{"first":"Uranus","second":"Chiron","type":"Semi Square","orb":1.23},{"first":"Uranus","second":"Part of Fortune","type":"Sextile","orb":3.27},{"first":"Uranus","second":"Ascendant","type":"Trine","orb":9.77},{"first":"Uranus","second":"Midheaven","type":"Conjunction","orb":6.76},{"first":"Uranus","second":"Descendant","type":"Sextile","orb":9.77},{"first":"Neptune","second":"Sun","type":"Opposition","orb":5.76},{"first":"Neptune","second":"Mars","type":"Opposition","orb":0.01},{"first":"Neptune","second":"Mercury","type":"Opposition","orb":2.58},{"first":"Neptune","second":"Jupiter","type":"Opposition","orb":8.53},{"first":"Neptune","second":"Neptune","type":"Conjunction","orb":3.28},{"first":"Neptune","second":"Pluto","type":"Sextile","orb":8.64},{"first":"Neptune","second":"Chiron","type":"Semi Sextile","orb":1.98},{"first":"Neptune","second":"Ascendant","type":"Trine","orb":4.49},{"first":"Neptune","second":"Descendant","type":"Sextile","orb":4.49},{"first":"Pluto","second":"Moon","type":"Semi Square","orb":2.64},{"first":"Pluto","second":"Mars","type":"Trine","orb":5.4},{"first":"Pluto","second":"Mercury","type":"Trine","orb":7.97},{"first":"Pluto","second":"Venus","type":"Square","orb":2.48},{"first":"Pluto","second":"Neptune","type":"Sextile","orb":2.11},{"first":"Pluto","second":"Pluto","type":"Conjunction","orb":3.25},{"first":"Pluto","second":"Node","type":"Opposition","orb":5.28},{"first":"Pluto","second":"Part of Fortune","type":"Conjunction","orb":5.59},{"first":"Pluto","second":"Ascendant","type":"Opposition","orb":0.9},{"first":"Pluto","second":"Descendant","type":"Conjunction","orb":0.9},{"first":"Node","second":"Sun","type":"Conjunction","orb":4.49},{"first":"Node","second":"Moon","type":"Opposition","orb":2.01},{"first":"Node","second":"Mercury","type":"Conjunction","orb":7.67},{"first":"Node","second":"Jupiter","type":"Conjunction","orb":1.72},{"first":"Node","second":"Saturn","type":"Semi Sextile","orb":2.33},{"first":"Node","second":"Uranus","type":"Quincunx","orb":1.59},{"first":"Node","second":"Ascendant","type":"Semi Square","orb":0.26},{"first":"Node","second":"Midheaven","type":"Quincunx","orb":1.26},{"first":"Chiron","second":"Mars","type":"Trine","orb":8.81},{"first":"Chiron","second":"Venus","type":"Square","orb":0.93},{"first":"Chiron","second":"Saturn","type":"Opposition","orb":8.63},{"first":"Chiron","second":"Uranus","type":"Quintile","orb":0.54},{"first":"Chiron","second":"Neptune","type":"Sextile","orb":5.51},{"first":"Chiron","second":"Pluto","type":"Conjunction","orb":0.15},{"first":"Chiron","second":"Node","type":"Opposition","orb":1.87},{"first":"Chiron","second":"Part of Fortune","type":"Conjunction","orb":2.18},{"first":"Chiron","second":"Ascendant","type":"Opposition","orb":4.31},{"first":"Chiron","second":"Midheaven","type":"Quintile","orb":0.22},{"first":"Chiron","second":"Descendant","type":"Conjunction","orb":4.31},{"first":"Part of Fortune","second":"Sun","type":"Sextile","orb":3.03},{"first":"Part of Fortune","second":"Moon","type":"Trine","orb":3.46},{"first":"Part of Fortune","second":"Mars","type":"Sextile","orb":8.79},{"first":"Part of Fortune","second":"Mercury","type":"Sextile","orb":6.21},{"first":"Part of Fortune","second":"Jupiter","type":"Sextile","orb":0.27},{"first":"Part of Fortune","second":"Saturn","type":"Square","orb":3.78},{"first":"Part of Fortune","second":"Uranus","type":"Quincunx","orb":0.13},{"first":"Part of Fortune","second":"Chiron","type":"Square","orb":6.82},{"first":"Part of Fortune","second":"Midheaven","type":"Quincunx","orb":0.19},{"first":"Part of Fortune","second":"Descendant","type":"Quintile","orb":1.28},{"first":"Ascendant","second":"Sun","type":"Trine","orb":8.5},{"first":"Ascendant","second":"Moon","type":"Sextile","orb":2.01},{"first":"Ascendant","second":"Jupiter","type":"Trine","orb":5.74},{"first":"Ascendant","second":"Venus","type":"Opposition","orb":7.87},{"first":"Ascendant","second":"Saturn","type":"Square","orb":1.68},{"first":"Ascendant","second":"Neptune","type":"Semi Square","orb":2.55},{"first":"Ascendant","second":"Pluto","type":"Square","orb":7.1},{"first":"Ascendant","second":"Node","type":"Square","orb":5.07},{"first":"Ascendant","second":"Part of Fortune","type":"Square","orb":4.76},{"first":"Midheaven","second":"Moon","type":"Semi Sextile","orb":0.37},{"first":"Midheaven","second":"Saturn","type":"Opposition","orb":0.7},{"first":"Midheaven","second":"Uranus","type":"Sextile","orb":3.22},{"first":"Midheaven","second":"Neptune","type":"Semi Square","orb":0.17},{"first":"Midheaven","second":"Pluto","type":"Conjunction","orb":9.48},{"first":"Midheaven","second":"Node","type":"Opposition","orb":7.45},{"first":"Midheaven","second":"Chiron","type":"Conjunction","orb":9.91},{"first":"Midheaven","second":"Part of Fortune","type":"Conjunction","orb":7.14},{"first":"Midheaven","second":"Midheaven","type":"Sextile","orb":2.89},{"first":"Descendant","second":"Sun","type":"Sextile","orb":8.5},{"first":"Descendant","second":"Moon","type":"Trine","orb":2.01},{"first":"Descendant","second":"Mars","type":"Semi Square","orb":0.75},{"first":"Descendant","second":"Jupiter","type":"Sextile","orb":5.74},{"first":"Descendant","second":"Venus","type":"Conjunction","orb":7.87},{"first":"Descendant","second":"Saturn","type":"Square","orb":1.68},{"first":"Descendant","second":"Pluto","type":"Square","orb":7.1},{"first":"Descendant","second":"Node","type":"Square","orb":5.07},{"first":"Descendant","second":"Part of Fortune","type":"Square","orb":4.76}]}}}			"RESULTS : ""ai_response"": ""```json{    \""Sun-Sun Sextile\"": \""The Sun-Sun Sextile in your relationship indicates a harmonious connection between your core identities, fostering mutual understanding and respect. This aspect suggests that both of you are likely to support each other's ambitions and personal growth, creating a nurturing environment for your relationship to thrive. The energy of this sextile can bring a sense of ease and cooperation, allowing you to work together effectively towards common goals. In your life, this aspect can enhance your confidence and self-expression, as your partner's presence encourages you to shine brightly. The supportive nature of this sextile may also help you overcome challenges with a positive outlook, knowing that you have a reliable ally by your side. As the Sun represents the self and vitality, this aspect can infuse your relationship with warmth and vitality, making it a source of joy and inspiration. The Sun's placement in your second house emphasizes the importance of shared values and resources, suggesting that financial stability and material comfort may play a significant role in your partnership. Meanwhile, your partner's Sun in the third house highlights the significance of communication and intellectual connection, indicating that stimulating conversations and shared interests can strengthen your bond. Overall, the Sun-Sun Sextile in your synastry chart is a promising indicator of a balanced and fulfilling relationship, where both partners can grow individually and together.\""}```"",
    ""prompt_tokens"": 4922,"		
											
fetch_image_from_aws			API : https://d36fwfwo4vnk9h.cloudfront.net/astro-picture-content/fetch_image_from_aws			PAYLOAD : {"filename":"undefined-undefined-undefined","foldername":"aspect"}			RESULTS : {"status":"success","data":{"url":null}}		
											
Composite Horoscope More Data			API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else and always answer as astrolger not AI BOT","user_content":"I was born on August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on  June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30 .  Keeping western astrology in mind and keeping this as main source info I need to know details of Composite Sun in Gemini, 8th House  in love relationship partner as paragraph and also need to know the significance and impact  in my life, you have planet , aspect and house info given in json reposne must be in json format as {Composite Sun in Gemini, 8th House:data} here data is dynamic data form bot and must be a paragraph with 3 sentences (minimum 6 paragraphs ) for Composite Sun in Gemini, 8th House  in love relationship partner  make it real for me I don't need theory context in response you must add context of planet , aspect and house if any. Dont give any Additional JSON data in response "},"toolname":"other","json":{"first":[{"name":"Sun","full_degree":57.2003,"norm_degree":27.2003,"speed":0.9629,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Moon","full_degree":231.7352,"norm_degree":21.7352,"speed":12.3389,"is_retro":"false","sign_id":8,"sign":"Scorpio","house":8},{"name":"Mars","full_degree":69.7763,"norm_degree":9.7763,"speed":0.6914,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Mercury","full_degree":67.4912,"norm_degree":7.4912,"speed":2.0745,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Jupiter","full_degree":50.172,"norm_degree":20.172,"speed":0.2368,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Venus","full_degree":50.5645,"norm_degree":20.5645,"speed":1.2292,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Saturn","full_degree":51.3412,"norm_degree":21.3412,"speed":0.1283,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Uranus","full_degree":320.8013,"norm_degree":20.8013,"speed":0.0061,"is_retro":"false","sign_id":11,"sign":"Aquarius","house":12},{"name":"Neptune","full_degree":306.5494,"norm_degree":6.5494,"speed":-0.005,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":11},{"name":"Pluto","full_degree":251.939,"norm_degree":11.939,"speed":-0.0259,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Node","full_degree":116.3003,"norm_degree":26.3003,"speed":-0.1751,"is_retro":"true","sign_id":4,"sign":"Cancer","house":5},{"name":"Chiron","full_degree":255.3443,"norm_degree":15.3443,"speed":-0.0653,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Part of Fortune","full_degree":177.7521,"norm_degree":27.7521,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":7}],"second":[{"name":"Sun","full_degree":120.7857,"norm_degree":0.7857,"speed":0.9547,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Moon","full_degree":294.295,"norm_degree":24.295,"speed":12.889,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":8},{"name":"Mars","full_degree":126.5393,"norm_degree":6.5393,"speed":0.6404,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Mercury","full_degree":123.9658,"norm_degree":3.9658,"speed":2.0839,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Jupiter","full_degree":118.0226,"norm_degree":28.0226,"speed":0.2231,"is_retro":"false","sign_id":4,"sign":"Cancer","house":2},{"name":"Venus","full_degree":164.4179,"norm_degree":14.4179,"speed":1.0955,"is_retro":"false","sign_id":6,"sign":"Virgo","house":4},{"name":"Saturn","full_degree":83.9703,"norm_degree":23.9703,"speed":0.1129,"is_retro":"false","sign_id":3,"sign":"Gemini","house":1},{"name":"Uranus","full_degree":327.8866,"norm_degree":27.8866,"speed":-0.034,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":10},{"name":"Neptune","full_degree":309.8325,"norm_degree":9.8325,"speed":-0.0267,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":9},{"name":"Pluto","full_degree":255.1901,"norm_degree":15.1901,"speed":-0.0165,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":7},{"name":"Node","full_degree":77.216,"norm_degree":17.216,"speed":-0.0886,"is_retro":"true","sign_id":3,"sign":"Gemini","house":1},{"name":"Chiron","full_degree":274.574,"norm_degree":4.574,"speed":-0.0543,"is_retro":"true","sign_id":10,"sign":"Capricorn","house":7},{"name":"Part of Fortune","full_degree":257.5264,"norm_degree":17.5264,"speed":0,"is_retro":"false","sign_id":9,"sign":"Sagittarius","house":7}],"composite":{"planets":[{"name":"Sun","full_degree":88.993,"norm_degree":28.993,"sign_id":3,"sign":"Gemini","house":8},{"name":"Moon","full_degree":263.0151,"norm_degree":23.0151,"sign_id":9,"sign":"Sagittarius","house":2},{"name":"Mars","full_degree":98.15780000000001,"norm_degree":8.1578,"sign_id":4,"sign":"Cancer","house":9},{"name":"Mercury","full_degree":95.7285,"norm_degree":5.7285,"sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":84.09729999999999,"norm_degree":24.0973,"sign_id":3,"sign":"Gemini","house":8},{"name":"Venus","full_degree":107.4912,"norm_degree":17.4912,"sign_id":4,"sign":"Cancer","house":9},{"name":"Saturn","full_degree":67.65575,"norm_degree":7.6557,"sign_id":3,"sign":"Gemini","house":8},{"name":"Uranus","full_degree":324.34395,"norm_degree":24.344,"sign_id":11,"sign":"Aquarius","house":4},{"name":"Neptune","full_degree":308.19095,"norm_degree":8.1909,"sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":253.56455,"norm_degree":13.5645,"sign_id":9,"sign":"Sagittarius","house":2},{"name":"Node","full_degree":96.75815,"norm_degree":6.7582,"sign_id":4,"sign":"Cancer","house":9},{"name":"Chiron","full_degree":264.95915,"norm_degree":24.9592,"sign_id":9,"sign":"Sagittarius","house":2},{"name":"Part of Fortune","full_degree":217.63925,"norm_degree":7.6393,"sign_id":8,"sign":"Scorpio","house":1}],"houses":[{"house":1,"sign":"Scorpio","degree":211.66134499999998},{"house":2,"sign":"Gemini","degree":62.75139},{"house":3,"sign":"Gemini","degree":89.87979},{"house":4,"sign":"Cancer","degree":116.113125},{"house":5,"sign":"Leo","degree":144.53833},{"house":6,"sign":"Virgo","degree":176.57773},{"house":7,"sign":"Scorpio","degree":211.66134499999998},{"house":8,"sign":"Sagittarius","degree":242.75139000000001},{"house":9,"sign":"Sagittarius","degree":269.87979},{"house":10,"sign":"Capricorn","degree":296.11312499999997},{"house":11,"sign":"Aquarius","degree":324.53833},{"house":12,"sign":"Virgo","degree":176.57773}],"ascendant":211.66134499999998,"midheaven":296.11312499999997,"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":5.98,"diff":174.02},{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":9.16,"diff":9.16},{"aspecting_planet":"Sun","aspected_planet":"Mercury","aspecting_planet_id":0,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":6.74,"diff":6.74},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":4.9,"diff":4.9},{"aspecting_planet":"Sun","aspected_planet":"Uranus","aspecting_planet_id":0,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":4.65,"diff":124.65},{"aspecting_planet":"Sun","aspected_planet":"Node","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":1,"type":"Conjunction","orb":7.77,"diff":7.77},{"aspecting_planet":"Sun","aspected_planet":"Chiron","aspecting_planet_id":0,"aspected_planet_id":11,"aspect_type":2,"type":"Opposition","orb":4.03,"diff":175.97},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":13,"aspect_type":3,"type":"Trine","orb":2.67,"diff":122.67},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":1.08,"diff":178.92},{"aspecting_planet":"Moon","aspected_planet":"Uranus","aspecting_planet_id":1,"aspected_planet_id":7,"aspect_type":5,"type":"Sextile","orb":1.33,"diff":61.33},{"aspecting_planet":"Moon","aspected_planet":"Pluto","aspecting_planet_id":1,"aspected_planet_id":9,"aspect_type":1,"type":"Conjunction","orb":9.45,"diff":9.45},{"aspecting_planet":"Moon","aspected_planet":"Chiron","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":1.94,"diff":1.94},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.43,"diff":2.43},{"aspecting_planet":"Mars","aspected_planet":"Venus","aspecting_planet_id":2,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":9.33,"diff":9.33},{"aspecting_planet":"Mars","aspected_planet":"Node","aspecting_planet_id":2,"aspected_planet_id":10,"aspect_type":1,"type":"Conjunction","orb":1.4,"diff":1.4},{"aspecting_planet":"Mars","aspected_planet":"Part of Fortune","aspecting_planet_id":2,"aspected_planet_id":12,"aspect_type":3,"type":"Trine","orb":0.52,"diff":119.48},{"aspecting_planet":"Mars","aspected_planet":"Ascendant","aspecting_planet_id":2,"aspected_planet_id":13,"aspect_type":3,"type":"Trine","orb":6.5,"diff":113.5},{"aspecting_planet":"Mercury","aspected_planet":"Node","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":1,"type":"Conjunction","orb":1.03,"diff":1.03},{"aspecting_planet":"Mercury","aspected_planet":"Part of Fortune","aspecting_planet_id":3,"aspected_planet_id":12,"aspect_type":3,"type":"Trine","orb":1.91,"diff":121.91},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":13,"aspect_type":3,"type":"Trine","orb":4.07,"diff":115.93},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":0.25,"diff":119.75},{"aspecting_planet":"Jupiter","aspected_planet":"Chiron","aspecting_planet_id":4,"aspected_planet_id":11,"aspect_type":2,"type":"Opposition","orb":0.86,"diff":179.14},{"aspecting_planet":"Jupiter","aspected_planet":"Ascendant","aspecting_planet_id":4,"aspected_planet_id":13,"aspect_type":3,"type":"Trine","orb":7.56,"diff":127.56},{"aspecting_planet":"Venus","aspected_planet":"Midheaven","aspecting_planet_id":5,"aspected_planet_id":14,"aspect_type":2,"type":"Opposition","orb":8.62,"diff":171.38},{"aspecting_planet":"Saturn","aspected_planet":"Neptune","aspecting_planet_id":6,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.54,"diff":119.46},{"aspecting_planet":"Saturn","aspected_planet":"Pluto","aspecting_planet_id":6,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":5.91,"diff":174.09},{"aspecting_planet":"Uranus","aspected_planet":"Chiron","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":0.62,"diff":59.38},{"aspecting_planet":"Uranus","aspected_planet":"Ascendant","aspecting_planet_id":7,"aspected_planet_id":13,"aspect_type":3,"type":"Trine","orb":7.32,"diff":112.68},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.37,"diff":54.63},{"aspecting_planet":"Neptune","aspected_planet":"Part of Fortune","aspecting_planet_id":8,"aspected_planet_id":12,"aspect_type":4,"type":"Square","orb":0.55,"diff":90.55},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":13,"aspect_type":4,"type":"Square","orb":6.53,"diff":96.53},{"aspecting_planet":"Node","aspected_planet":"Part of Fortune","aspecting_planet_id":10,"aspected_planet_id":12,"aspect_type":3,"type":"Trine","orb":0.88,"diff":120.88},{"aspecting_planet":"Node","aspected_planet":"Ascendant","aspecting_planet_id":10,"aspected_planet_id":13,"aspect_type":3,"type":"Trine","orb":5.1,"diff":114.9},{"aspecting_planet":"Part of Fortune","aspected_planet":"Ascendant","aspecting_planet_id":12,"aspected_planet_id":13,"aspect_type":1,"type":"Conjunction","orb":5.98,"diff":5.98},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":13,"aspected_planet_id":14,"aspect_type":4,"type":"Square","orb":5.55,"diff":84.45}]}}}			"RESULTS : {
    ""ai_response"": ""```json{    \""Composite Sun in Gemini, 8th House\"": \""The Composite Sun in Gemini in the 8th House suggests a relationship that thrives on deep intellectual exploration and transformation. This placement indicates that communication is a key element in your partnership, with both of you drawn to uncovering hidden truths and exploring the mysteries of life together. The 8th House influence brings an intensity to your connection, where you may find yourselves delving into topics that challenge your perspectives and encourage growth. The Gemini influence encourages adaptability and curiosity, allowing you both to navigate the complexities of your relationship with a sense of wonder and openness. This placement can also signify a shared interest in exploring the psychological and emotional depths of your bond, leading to profound insights and personal evolution. The Sun's aspects, such as its conjunction with Mercury and Jupiter, enhance your ability to communicate effectively and expand your understanding of each other, fostering a dynamic and intellectually stimulating partnership. The trine to Uranus suggests that your relationship may experience sudden insights and breakthroughs, bringing a sense of excitement and innovation to your shared journey. Overall, the Composite Sun in Gemini in the 8th House highlights a relationship that is both intellectually engaging and transformative, with the potential for deep emotional and psychological growth.\""}```"",
    ""prompt_tokens"": 4094,
    ""completion_tokens"": 255,
    ""total_tokens"": 4349,
    ""cache_status"": ""Hit"",
    ""database_identifier"": ""cb674e14fe8c01761c496c33b7e2206d1576161645ad35d00add82f1877aa436"",
    ""request_body"": {
        ""condition"": {
            ""system_content"": ""give response only in json format as a whole , nothing else and always answer as astrolger not AI BOT"",
            ""user_content"": ""I was born on August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on  June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30 .  Keeping western astrology in mind and keeping this as main source info I need to know details of Composite Sun in Gemini, 8th House  in love relationship partner as paragraph and also need to know the significance and impact  in my life, you have planet , aspect and house info given in json reposne must be in json format as {Composite Sun in Gemini, 8th House:data} here data is dynamic data form bot and must be a paragraph with 3 sentences (minimum 6 paragraphs ) for Composite Sun in Gemini, 8th House  in love relationship partner  make it real for me I don't need theory context in response you must add context of planet , aspect and house if any. Dont give any Additional JSON data in response ""
        },
        ""toolname"": ""other"",
        ""json"": {
            ""first"": [
                {
                    ""name"": ""Sun"",
                    ""full_degree"": 57.2003,
                    ""norm_degree"": 27.2003,
                    ""speed"": 0.9629,
                    ""is_retro"": ""false"",
                    ""sign_id"": 2,
                    ""sign"": ""Taurus"",
                    ""house"": 2
                },
                {
                    ""name"": ""Moon"",
                    ""full_degree"": 231.7352,
                    ""norm_degree"": 21.7352,
                    ""speed"": 12.3389,
                    ""is_retro"": ""false"",
                    ""sign_id"": 8,
                    ""sign"": ""Scorpio"",
                    ""house"": 8
                },
                {
                    ""name"": ""Mars"",
                    ""full_degree"": 69.7763,
                    ""norm_degree"": 9.7763,
                    ""speed"": 0.6914,
                    ""is_retro"": ""false"",
                    ""sign_id"": 3,
                    ""sign"": ""Gemini"",
                    ""house"": 3
                },
                {
                    ""name"": ""Mercury"",
                    ""full_degree"": 67.4912,
                    ""norm_degree"": 7.4912,
                    ""speed"": 2.0745,
                    ""is_retro"": ""false"",
                    ""sign_id"": 3,
                    ""sign"": ""Gemini"",
                    ""house"": 3
                },
                {
                    ""name"": ""Jupiter"",
                    ""full_degree"": 50.172,
                    ""norm_degree"": 20.172,
                    ""speed"": 0.2368,
                    ""is_retro"": ""false"",
                    ""sign_id"": 2,
                    ""sign"": ""Taurus"",
                    ""house"": 2
                },
                {
                    ""name"": ""Venus"",
                    ""full_degree"": 50.5645,
                    ""norm_degree"": 20.5645,
                    ""speed"": 1.2292,
                    ""is_retro"": ""false"",
                    ""sign_id"": 2,
                    ""sign"": ""Taurus"",
                    ""house"": 2
                },
                {
                    ""name"": ""Saturn"",
                    ""full_degree"": 51.3412,
                    ""norm_degree"": 21.3412,
                    ""speed"": 0.1283,
                    ""is_retro"": ""false"",
                    ""sign_id"": 2,
                    ""sign"": ""Taurus"",
                    ""house"": 2
                },
                {
                    ""name"": ""Uranus"",
                    ""full_degree"": 320.8013,
                    ""norm_degree"": 20.8013,
                    ""speed"": 0.0061,
                    ""is_retro"": ""false"",
                    ""sign_id"": 11,
                    ""sign"": ""Aquarius"",
                    ""house"": 12
                },
                {
                    ""name"": ""Neptune"",
                    ""full_degree"": 306.5494,
                    ""norm_degree"": 6.5494,
                    ""speed"": -0.005,
                    ""is_retro"": ""true"",
                    ""sign_id"": 11,
                    ""sign"": ""Aquarius"",
                    ""house"": 11
                },
                {
                    ""name"": ""Pluto"",
                    ""full_degree"": 251.939,
                    ""norm_degree"": 11.939,
                    ""speed"": -0.0259,
                    ""is_retro"": ""true"",
                    ""sign_id"": 9,
                    ""sign"": ""Sagittarius"",
                    ""house"": 9
                },
                {
                    ""name"": ""Node"",
                    ""full_degree"": 116.3003,
                    ""norm_degree"": 26.3003,
                    ""speed"": -0.1751,
                    ""is_retro"": ""true"",
                    ""sign_id"": 4,
                    ""sign"": ""Cancer"",
                    ""house"": 5
                },
                {
                    ""name"": ""Chiron"",
                    ""full_degree"": 255.3443,
                    ""norm_degree"": 15.3443,
                    ""speed"": -0.0653,
                    ""is_retro"": ""true"",
                    ""sign_id"": 9,
                    ""sign"": ""Sagittarius"",
                    ""house"": 9
                },
                {
                    ""name"": ""Part of Fortune"",
                    ""full_degree"": 177.7521,
                    ""norm_degree"": 27.7521,
                    ""speed"": 0,
                    ""is_retro"": ""false"",
                    ""sign_id"": 6,
                    ""sign"": ""Virgo"",
                    ""house"": 7
                }
            ],
            ""second"": [
                {
                    ""name"": ""Sun"",
                    ""full_degree"": 120.7857,
                    ""norm_degree"": 0.7857,
                    ""speed"": 0.9547,
                    ""is_retro"": ""false"",
                    ""sign_id"": 5,
                    ""sign"": ""Leo"",
                    ""house"": 3
                },
                {
                    ""name"": ""Moon"",
                    ""full_degree"": 294.295,
                    ""norm_degree"": 24.295,
                    ""speed"": 12.889,
                    ""is_retro"": ""false"",
                    ""sign_id"": 10,
                    ""sign"": ""Capricorn"",
                    ""house"": 8
                },
                {
                    ""name"": ""Mars"",
                    ""full_degree"": 126.5393,
                    ""norm_degree"": 6.5393,
                    ""speed"": 0.6404,
                    ""is_retro"": ""false"",
                    ""sign_id"": 5,
                    ""sign"": ""Leo"",
                    ""house"": 3
                },
                {
                    ""name"": ""Mercury"",
                    ""full_degree"": 123.9658,
                    ""norm_degree"": 3.9658,
                    ""speed"": 2.0839,
                    ""is_retro"": ""false"",
                    ""sign_id"": 5,
                    ""sign"": ""Leo"",
                    ""house"": 3
                },
                {
                    ""name"": ""Jupiter"",
                    ""full_degree"": 118.0226,
                    ""norm_degree"": 28.0226,
                    ""speed"": 0.2231,
                    ""is_retro"": ""false"",
                    ""sign_id"": 4,
                    ""sign"": ""Cancer"",
                    ""house"": 2
                },
                {
                    ""name"": ""Venus"",
                    ""full_degree"": 164.4179,
                    ""norm_degree"": 14.4179,
                    ""speed"": 1.0955,
                    ""is_retro"": ""false"",
                    ""sign_id"": 6,
                    ""sign"": ""Virgo"",
                    ""house"": 4
                },
                {
                    ""name"": ""Saturn"",
                    ""full_degree"": 83.9703,
                    ""norm_degree"": 23.9703,
                    ""speed"": 0.1129,
                    ""is_retro"": ""false"",
                    ""sign_id"": 3,
                    ""sign"": ""Gemini"",
                    ""house"": 1
                },
                {
                    ""name"": ""Uranus"",
                    ""full_degree"": 327.8866,
                    ""norm_degree"": 27.8866,
                    ""speed"": -0.034,
                    ""is_retro"": ""true"",
                    ""sign_id"": 11,
                    ""sign"": ""Aquarius"",
                    ""house"": 10
                },
                {
                    ""name"": ""Neptune"",
                    ""full_degree"": 309.8325,
                    ""norm_degree"": 9.8325,
                    ""speed"": -0.0267,
                    ""is_retro"": ""true"",
                    ""sign_id"": 11,
                    ""sign"": ""Aquarius"",
                    ""house"": 9
                },
                {
                    ""name"": ""Pluto"",
                    ""full_degree"": 255.1901,
                    ""norm_degree"": 15.1901,
                    ""speed"": -0.0165,
                    ""is_retro"": ""true"",
                    ""sign_id"": 9,
                    ""sign"": ""Sagittarius"",
                    ""house"": 7
                },
                {
                    ""name"": ""Node"",
                    ""full_degree"": 77.216,
                    ""norm_degree"": 17.216,
                    ""speed"": -0.0886,
                    ""is_retro"": ""true"",
                    ""sign_id"": 3,
                    ""sign"": ""Gemini"",
                    ""house"": 1
                },
                {
                    ""name"": ""Chiron"",
                    ""full_degree"": 274.574,
                    ""norm_degree"": 4.574,
                    ""speed"": -0.0543,
                    ""is_retro"": ""true"",
                    ""sign_id"": 10,
                    ""sign"": ""Capricorn"",
                    ""house"": 7
                },
                {
                    ""name"": ""Part of Fortune"",
                    ""full_degree"": 257.5264,
                    ""norm_degree"": 17.5264,
                    ""speed"": 0,
                    ""is_retro"": ""false"",
                    ""sign_id"": 9,
                    ""sign"": ""Sagittarius"",
                    ""house"": 7
                }
            ],
            ""composite"": {
                ""planets"": [
                    {
                        ""name"": ""Sun"",
                        ""full_degree"": 88.993,
                        ""norm_degree"": 28.993,
                        ""sign_id"": 3,
                        ""sign"": ""Gemini"",
                        ""house"": 8
                    },
                    {
                        ""name"": ""Moon"",
                        ""full_degree"": 263.0151,
                        ""norm_degree"": 23.0151,
                        ""sign_id"": 9,
                        ""sign"": ""Sagittarius"",
                        ""house"": 2
                    },
                    {
                        ""name"": ""Mars"",
                        ""full_degree"": 98.15780000000001,
                        ""norm_degree"": 8.1578,
                        ""sign_id"": 4,
                        ""sign"": ""Cancer"",
                        ""house"": 9
                    },
                    {
                        ""name"": ""Mercury"",
                        ""full_degree"": 95.7285,
                        ""norm_degree"": 5.7285,
                        ""sign_id"": 4,
                        ""sign"": ""Cancer"",
                        ""house"": 9
                    },
                    {
                        ""name"": ""Jupiter"",
                        ""full_degree"": 84.09729999999999,
                        ""norm_degree"": 24.0973,
                        ""sign_id"": 3,
                        ""sign"": ""Gemini"",
                        ""house"": 8
                    },
                    {
                        ""name"": ""Venus"",
                        ""full_degree"": 107.4912,
                        ""norm_degree"": 17.4912,
                        ""sign_id"": 4,
                        ""sign"": ""Cancer"",
                        ""house"": 9
                    },
                    {
                        ""name"": ""Saturn"",
                        ""full_degree"": 67.65575,
                        ""norm_degree"": 7.6557,
                        ""sign_id"": 3,
                        ""sign"": ""Gemini"",
                        ""house"": 8
                    },
                    {
                        ""name"": ""Uranus"",
                        ""full_degree"": 324.34395,
                        ""norm_degree"": 24.344,
                        ""sign_id"": 11,
                        ""sign"": ""Aquarius"",
                        ""house"": 4
                    },
                    {
                        ""name"": ""Neptune"",
                        ""full_degree"": 308.19095,
                        ""norm_degree"": 8.1909,
                        ""sign_id"": 11,
                        ""sign"": ""Aquarius"",
                        ""house"": 4
                    },
                    {
                        ""name"": ""Pluto"",
                        ""full_degree"": 253.56455,
                        ""norm_degree"": 13.5645,
                        ""sign_id"": 9,
                        ""sign"": ""Sagittarius"",
                        ""house"": 2
                    },
                    {
                        ""name"": ""Node"",
                        ""full_degree"": 96.75815,
                        ""norm_degree"": 6.7582,
                        ""sign_id"": 4,
                        ""sign"": ""Cancer"",
                        ""house"": 9
                    },
                    {
                        ""name"": ""Chiron"",
                        ""full_degree"": 264.95915,
                        ""norm_degree"": 24.9592,
                        ""sign_id"": 9,
                        ""sign"": ""Sagittarius"",
                        ""house"": 2
                    },
                    {
                        ""name"": ""Part of Fortune"",
                        ""full_degree"": 217.63925,
                        ""norm_degree"": 7.6393,
                        ""sign_id"": 8,
                        ""sign"": ""Scorpio"",
                        ""house"": 1
                    }
                ],
                ""houses"": [
                    {
                        ""house"": 1,
                        ""sign"": ""Scorpio"",
                        ""degree"": 211.66134499999998
                    },
                    {
                        ""house"": 2,
                        ""sign"": ""Gemini"",
                        ""degree"": 62.75139
                    },
                    {
                        ""house"": 3,
                        ""sign"": ""Gemini"",
                        ""degree"": 89.87979
                    },
                    {
                        ""house"": 4,
                        ""sign"": ""Cancer"",
                        ""degree"": 116.113125
                    },
                    {
                        ""house"": 5,
                        ""sign"": ""Leo"",
                        ""degree"": 144.53833
                    },
                    {
                        ""house"": 6,
                        ""sign"": ""Virgo"",
                        ""degree"": 176.57773
                    },
                    {
                        ""house"": 7,
                        ""sign"": ""Scorpio"",
                        ""degree"": 211.66134499999998
                    },
                    {
                        ""house"": 8,
                        ""sign"": ""Sagittarius"",
                        ""degree"": 242.75139000000001
                    },
                    {
                        ""house"": 9,
                        ""sign"": ""Sagittarius"",
                        ""degree"": 269.87979
                    },
                    {
                        ""house"": 10,
                        ""sign"": ""Capricorn"",
                        ""degree"": 296.11312499999997
                    },
                    {
                        ""house"": 11,
                        ""sign"": ""Aquarius"",
                        ""degree"": 324.53833
                    },
                    {
                        ""house"": 12,
                        ""sign"": ""Virgo"",
                        ""degree"": 176.57773
                    }
                ],
                ""ascendant"": 211.66134499999998,
                ""midheaven"": 296.11312499999997,
                ""aspects"": [
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Moon"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 1,
                        ""aspect_type"": 2,
                        ""type"": ""Opposition"",
                        ""orb"": 5.98,
                        ""diff"": 174.02
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Mars"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 2,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 9.16,
                        ""diff"": 9.16
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Mercury"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 3,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 6.74,
                        ""diff"": 6.74
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Jupiter"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 4,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 4.9,
                        ""diff"": 4.9
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Uranus"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 7,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 4.65,
                        ""diff"": 124.65
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Node"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 10,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 7.77,
                        ""diff"": 7.77
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Chiron"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 11,
                        ""aspect_type"": 2,
                        ""type"": ""Opposition"",
                        ""orb"": 4.03,
                        ""diff"": 175.97
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 13,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 2.67,
                        ""diff"": 122.67
                    },
                    {
                        ""aspecting_planet"": ""Moon"",
                        ""aspected_planet"": ""Jupiter"",
                        ""aspecting_planet_id"": 1,
                        ""aspected_planet_id"": 4,
                        ""aspect_type"": 2,
                        ""type"": ""Opposition"",
                        ""orb"": 1.08,
                        ""diff"": 178.92
                    },
                    {
                        ""aspecting_planet"": ""Moon"",
                        ""aspected_planet"": ""Uranus"",
                        ""aspecting_planet_id"": 1,
                        ""aspected_planet_id"": 7,
                        ""aspect_type"": 5,
                        ""type"": ""Sextile"",
                        ""orb"": 1.33,
                        ""diff"": 61.33
                    },
                    {
                        ""aspecting_planet"": ""Moon"",
                        ""aspected_planet"": ""Pluto"",
                        ""aspecting_planet_id"": 1,
                        ""aspected_planet_id"": 9,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 9.45,
                        ""diff"": 9.45
                    },
                    {
                        ""aspecting_planet"": ""Moon"",
                        ""aspected_planet"": ""Chiron"",
                        ""aspecting_planet_id"": 1,
                        ""aspected_planet_id"": 11,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 1.94,
                        ""diff"": 1.94
                    },
                    {
                        ""aspecting_planet"": ""Mars"",
                        ""aspected_planet"": ""Mercury"",
                        ""aspecting_planet_id"": 2,
                        ""aspected_planet_id"": 3,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 2.43,
                        ""diff"": 2.43
                    },
                    {
                        ""aspecting_planet"": ""Mars"",
                        ""aspected_planet"": ""Venus"",
                        ""aspecting_planet_id"": 2,
                        ""aspected_planet_id"": 5,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 9.33,
                        ""diff"": 9.33
                    },
                    {
                        ""aspecting_planet"": ""Mars"",
                        ""aspected_planet"": ""Node"",
                        ""aspecting_planet_id"": 2,
                        ""aspected_planet_id"": 10,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 1.4,
                        ""diff"": 1.4
                    },
                    {
                        ""aspecting_planet"": ""Mars"",
                        ""aspected_planet"": ""Part of Fortune"",
                        ""aspecting_planet_id"": 2,
                        ""aspected_planet_id"": 12,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 0.52,
                        ""diff"": 119.48
                    },
                    {
                        ""aspecting_planet"": ""Mars"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 2,
                        ""aspected_planet_id"": 13,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 6.5,
                        ""diff"": 113.5
                    },
                    {
                        ""aspecting_planet"": ""Mercury"",
                        ""aspected_planet"": ""Node"",
                        ""aspecting_planet_id"": 3,
                        ""aspected_planet_id"": 10,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 1.03,
                        ""diff"": 1.03
                    },
                    {
                        ""aspecting_planet"": ""Mercury"",
                        ""aspected_planet"": ""Part of Fortune"",
                        ""aspecting_planet_id"": 3,
                        ""aspected_planet_id"": 12,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 1.91,
                        ""diff"": 121.91
                    },
                    {
                        ""aspecting_planet"": ""Mercury"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 3,
                        ""aspected_planet_id"": 13,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 4.07,
                        ""diff"": 115.93
                    },
                    {
                        ""aspecting_planet"": ""Jupiter"",
                        ""aspected_planet"": ""Uranus"",
                        ""aspecting_planet_id"": 4,
                        ""aspected_planet_id"": 7,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 0.25,
                        ""diff"": 119.75
                    },
                    {
                        ""aspecting_planet"": ""Jupiter"",
                        ""aspected_planet"": ""Chiron"",
                        ""aspecting_planet_id"": 4,
                        ""aspected_planet_id"": 11,
                        ""aspect_type"": 2,
                        ""type"": ""Opposition"",
                        ""orb"": 0.86,
                        ""diff"": 179.14
                    },
                    {
                        ""aspecting_planet"": ""Jupiter"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 4,
                        ""aspected_planet_id"": 13,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 7.56,
                        ""diff"": 127.56
                    },
                    {
                        ""aspecting_planet"": ""Venus"",
                        ""aspected_planet"": ""Midheaven"",
                        ""aspecting_planet_id"": 5,
                        ""aspected_planet_id"": 14,
                        ""aspect_type"": 2,
                        ""type"": ""Opposition"",
                        ""orb"": 8.62,
                        ""diff"": 171.38
                    },
                    {
                        ""aspecting_planet"": ""Saturn"",
                        ""aspected_planet"": ""Neptune"",
                        ""aspecting_planet_id"": 6,
                        ""aspected_planet_id"": 8,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 0.54,
                        ""diff"": 119.46
                    },
                    {
                        ""aspecting_planet"": ""Saturn"",
                        ""aspected_planet"": ""Pluto"",
                        ""aspecting_planet_id"": 6,
                        ""aspected_planet_id"": 9,
                        ""aspect_type"": 2,
                        ""type"": ""Opposition"",
                        ""orb"": 5.91,
                        ""diff"": 174.09
                    },
                    {
                        ""aspecting_planet"": ""Uranus"",
                        ""aspected_planet"": ""Chiron"",
                        ""aspecting_planet_id"": 7,
                        ""aspected_planet_id"": 11,
                        ""aspect_type"": 5,
                        ""type"": ""Sextile"",
                        ""orb"": 0.62,
                        ""diff"": 59.38
                    },
                    {
                        ""aspecting_planet"": ""Uranus"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 7,
                        ""aspected_planet_id"": 13,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 7.32,
                        ""diff"": 112.68
                    },
                    {
                        ""aspecting_planet"": ""Neptune"",
                        ""aspected_planet"": ""Pluto"",
                        ""aspecting_planet_id"": 8,
                        ""aspected_planet_id"": 9,
                        ""aspect_type"": 5,
                        ""type"": ""Sextile"",
                        ""orb"": 5.37,
                        ""diff"": 54.63
                    },
                    {
                        ""aspecting_planet"": ""Neptune"",
                        ""aspected_planet"": ""Part of Fortune"",
                        ""aspecting_planet_id"": 8,
                        ""aspected_planet_id"": 12,
                        ""aspect_type"": 4,
                        ""type"": ""Square"",
                        ""orb"": 0.55,
                        ""diff"": 90.55
                    },
                    {
                        ""aspecting_planet"": ""Neptune"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 8,
                        ""aspected_planet_id"": 13,
                        ""aspect_type"": 4,
                        ""type"": ""Square"",
                        ""orb"": 6.53,
                        ""diff"": 96.53
                    },
                    {
                        ""aspecting_planet"": ""Node"",
                        ""aspected_planet"": ""Part of Fortune"",
                        ""aspecting_planet_id"": 10,
                        ""aspected_planet_id"": 12,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 0.88,
                        ""diff"": 120.88
                    },
                    {
                        ""aspecting_planet"": ""Node"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 10,
                        ""aspected_planet_id"": 13,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 5.1,
                        ""diff"": 114.9
                    },
                    {
                        ""aspecting_planet"": ""Part of Fortune"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 12,
                        ""aspected_planet_id"": 13,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 5.98,
                        ""diff"": 5.98
                    },
                    {
                        ""aspecting_planet"": ""Ascendant"",
                        ""aspected_planet"": ""Midheaven"",
                        ""aspecting_planet_id"": 13,
                        ""aspected_planet_id"": 14,
                        ""aspect_type"": 4,
                        ""type"": ""Square"",
                        ""orb"": 5.55,
                        ""diff"": 84.45
                    }
                ]
            }
        }
    }
}"		
											
Davison Relationship More Data			API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else and always answer as astrolger not AI BOT","user_content":"I was born on August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on  June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30 .  Keeping western astrology in mind and keeping this as main source info I need to know details of Sun Conjunct Mercury  in love relationship partner as paragraph and also need to know the significance and impact  in my life, you have planet , aspect and house info given in json reposne must be in json format as {Sun Conjunct Mercury:data} here data is dynamic data form bot and must be a paragraph with 3 sentences (minimum 6 paragraphs ) for Sun Conjunct Mercury  in love relationship partner  make it real for me I don't need theory context in response you must add context of planet , aspect and house if any. Dont give any Additional JSON data in response "},"toolname":"other","json":{"mydetails":{"ascendant":71.03565456897975,"midheaven":327.5598198535195,"vertex":211.32869379691815,"houses":[{"house":1,"sign":"Gemini","sign_id":3,"degree":71.03565},{"house":2,"sign":"Cancer","sign_id":4,"degree":96.08341},{"house":3,"sign":"Leo","sign_id":5,"degree":120.46019},{"house":4,"sign":"Leo","sign_id":5,"degree":147.55982},{"house":5,"sign":"Virgo","sign_id":6,"degree":179.71154},{"house":6,"sign":"Scorpio","sign_id":8,"degree":215.87244},{"house":7,"sign":"Sagittarius","sign_id":9,"degree":251.03565},{"house":8,"sign":"Capricorn","sign_id":10,"degree":276.08341},{"house":9,"sign":"Aquarius","sign_id":11,"degree":300.46019},{"house":10,"sign":"Aquarius","sign_id":11,"degree":327.55982},{"house":11,"sign":"Pisces","sign_id":12,"degree":359.71154},{"house":12,"sign":"Taurus","sign_id":2,"degree":35.87244}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":6.49,"diff":173.51},{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":5.75,"diff":5.75},{"aspecting_planet":"Sun","aspected_planet":"Mercury","aspecting_planet_id":0,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":3.18,"diff":3.18},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":2.76,"diff":2.76},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":9.05,"diff":170.95},{"aspecting_planet":"Moon","aspected_planet":"Mercury","aspecting_planet_id":1,"aspected_planet_id":3,"aspect_type":2,"type":"Opposition","orb":9.67,"diff":170.33},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":3.73,"diff":176.27},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.57,"diff":2.57},{"aspecting_planet":"Mars","aspected_planet":"Jupiter","aspecting_planet_id":2,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":8.52,"diff":8.52},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":3.29,"diff":176.71},{"aspecting_planet":"Mars","aspected_planet":"Ascendant","aspecting_planet_id":2,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.5,"diff":55.5},{"aspecting_planet":"Mercury","aspected_planet":"Jupiter","aspecting_planet_id":3,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":5.94,"diff":5.94},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":5.87,"diff":174.13},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":4,"type":"Square","orb":0.77,"diff":90.77},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":3.38,"diff":93.38},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":3.92,"diff":116.08},{"aspecting_planet":"Saturn","aspected_planet":"Pluto","aspecting_planet_id":6,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":8.78,"diff":171.22},{"aspecting_planet":"Saturn","aspected_planet":"Midheaven","aspecting_planet_id":6,"aspected_planet_id":11,"aspect_type":3,"type":"Trine","orb":3.59,"diff":116.41},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":0.33,"diff":0.33},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.36,"diff":54.64},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":1.2,"diff":121.2},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":2,"type":"Opposition","orb":4.15,"diff":175.85}],"planets":[{"name":"Sun","full_degree":120.7857,"norm_degree":0.7857,"speed":0.9547,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Moon","full_degree":294.295,"norm_degree":24.295,"speed":12.889,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":8},{"name":"Mars","full_degree":126.5393,"norm_degree":6.5393,"speed":0.6404,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Mercury","full_degree":123.9658,"norm_degree":3.9658,"speed":2.0839,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Jupiter","full_degree":118.0226,"norm_degree":28.0226,"speed":0.2231,"is_retro":"false","sign_id":4,"sign":"Cancer","house":2},{"name":"Venus","full_degree":164.4179,"norm_degree":14.4179,"speed":1.0955,"is_retro":"false","sign_id":6,"sign":"Virgo","house":4},{"name":"Saturn","full_degree":83.9703,"norm_degree":23.9703,"speed":0.1129,"is_retro":"false","sign_id":3,"sign":"Gemini","house":1},{"name":"Uranus","full_degree":327.8866,"norm_degree":27.8866,"speed":-0.034,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":10},{"name":"Neptune","full_degree":309.8325,"norm_degree":9.8325,"speed":-0.0267,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":9},{"name":"Pluto","full_degree":255.1901,"norm_degree":15.1901,"speed":-0.0165,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":7},{"name":"Node","full_degree":77.216,"norm_degree":17.216,"speed":-0.0886,"is_retro":"true","sign_id":3,"sign":"Gemini","house":1},{"name":"Chiron","full_degree":274.574,"norm_degree":4.574,"speed":-0.0543,"is_retro":"true","sign_id":10,"sign":"Capricorn","house":7},{"name":"Part of Fortune","full_degree":257.5264,"norm_degree":17.5264,"speed":0,"is_retro":"false","sign_id":9,"sign":"Sagittarius","house":7}],"lilith":{"name":"Lilith","full_degree":7.5172,"norm_degree":7.5172,"speed":0.1119,"is_retro":"false","sign_id":1,"sign":"Aries","house":11}},"fiend_details":{"ascendant":352.28704269998116,"midheaven":264.6664338718442,"vertex":176.90088242133072,"houses":[{"house":1,"sign":"Pisces","sign_id":12,"degree":352.28704},{"house":2,"sign":"Aries","sign_id":1,"degree":29.41937},{"house":3,"sign":"Taurus","sign_id":2,"degree":59.29939},{"house":4,"sign":"Gemini","sign_id":3,"degree":84.66643},{"house":5,"sign":"Cancer","sign_id":4,"degree":109.36512},{"house":6,"sign":"Leo","sign_id":5,"degree":137.28302},{"house":7,"sign":"Virgo","sign_id":6,"degree":172.28704},{"house":8,"sign":"Libra","sign_id":7,"degree":209.41937},{"house":9,"sign":"Scorpio","sign_id":8,"degree":239.29939},{"house":10,"sign":"Sagittarius","sign_id":9,"degree":264.66643},{"house":11,"sign":"Capricorn","sign_id":10,"degree":289.36512},{"house":12,"sign":"Aquarius","sign_id":11,"degree":317.28302}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":5.47,"diff":174.53},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":7.03,"diff":7.03},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":6.64,"diff":6.64},{"aspecting_planet":"Sun","aspected_planet":"Saturn","aspecting_planet_id":0,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":5.86,"diff":5.86},{"aspecting_planet":"Sun","aspected_planet":"Uranus","aspecting_planet_id":0,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":6.4,"diff":96.4},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.91,"diff":64.91},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":1.56,"diff":178.44},{"aspecting_planet":"Moon","aspected_planet":"Venus","aspecting_planet_id":1,"aspected_planet_id":5,"aspect_type":2,"type":"Opposition","orb":1.17,"diff":178.83},{"aspecting_planet":"Moon","aspected_planet":"Saturn","aspecting_planet_id":1,"aspected_planet_id":6,"aspect_type":2,"type":"Opposition","orb":0.39,"diff":179.61},{"aspecting_planet":"Moon","aspected_planet":"Uranus","aspecting_planet_id":1,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.93,"diff":89.07},{"aspecting_planet":"Moon","aspected_planet":"Ascendant","aspecting_planet_id":1,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.55,"diff":120.55},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.29,"diff":2.29},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.23,"diff":123.23},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":2.16,"diff":177.84},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.94,"diff":120.94},{"aspecting_planet":"Mercury","aspected_planet":"Pluto","aspecting_planet_id":3,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.45,"diff":175.55},{"aspecting_planet":"Jupiter","aspected_planet":"Venus","aspecting_planet_id":4,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":0.39,"diff":0.39},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":1.17,"diff":1.17},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.63,"diff":89.37},{"aspecting_planet":"Jupiter","aspected_planet":"Ascendant","aspecting_planet_id":4,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":2.12,"diff":57.88},{"aspecting_planet":"Venus","aspected_planet":"Saturn","aspecting_planet_id":5,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.78,"diff":0.78},{"aspecting_planet":"Venus","aspected_planet":"Uranus","aspecting_planet_id":5,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.24,"diff":89.76},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":1.72,"diff":58.28},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.54,"diff":90.54},{"aspecting_planet":"Saturn","aspected_planet":"Ascendant","aspecting_planet_id":6,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":0.95,"diff":59.05},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.87,"diff":56.13},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.39,"diff":54.61},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":2.38,"diff":87.62}],"planets":[{"name":"Sun","full_degree":57.2003,"norm_degree":27.2003,"speed":0.9629,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Moon","full_degree":231.7352,"norm_degree":21.7352,"speed":12.3389,"is_retro":"false","sign_id":8,"sign":"Scorpio","house":8},{"name":"Mars","full_degree":69.7763,"norm_degree":9.7763,"speed":0.6914,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Mercury","full_degree":67.4912,"norm_degree":7.4912,"speed":2.0745,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Jupiter","full_degree":50.172,"norm_degree":20.172,"speed":0.2368,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Venus","full_degree":50.5645,"norm_degree":20.5645,"speed":1.2292,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Saturn","full_degree":51.3412,"norm_degree":21.3412,"speed":0.1283,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Uranus","full_degree":320.8013,"norm_degree":20.8013,"speed":0.0061,"is_retro":"false","sign_id":11,"sign":"Aquarius","house":12},{"name":"Neptune","full_degree":306.5494,"norm_degree":6.5494,"speed":-0.005,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":11},{"name":"Pluto","full_degree":251.939,"norm_degree":11.939,"speed":-0.0259,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Node","full_degree":116.3003,"norm_degree":26.3003,"speed":-0.1751,"is_retro":"true","sign_id":4,"sign":"Cancer","house":5},{"name":"Chiron","full_degree":255.3443,"norm_degree":15.3443,"speed":-0.0653,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Part of Fortune","full_degree":177.7521,"norm_degree":27.7521,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":7}],"lilith":{"name":"Lilith","full_degree":278.7196,"norm_degree":8.7196,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":10}}}}			"RESULTS : ""ai_response"": ""```json{    \""Sun Conjunct Mercury\"": \""In your partner's chart, the Sun conjunct Mercury aspect suggests a strong alignment between their core identity and their communication style. This conjunction often indicates a person who is articulate and expresses themselves with clarity and confidence. In relationships, this aspect can manifest as a partner who is intellectually stimulating and enjoys engaging in deep conversations, which can be both enlightening and challenging for you. The presence of this aspect in their chart can significantly impact your relationship by fostering a strong mental connection and mutual understanding. It encourages open dialogue and the sharing of ideas, which can help resolve conflicts and strengthen your bond. However, it may also lead to occasional debates or disagreements, as both of you may have strong opinions and a desire to express them. The house placement of this conjunction in their chart can further influence its impact, potentially highlighting areas of life where communication plays a crucial role, such as in social settings or career pursuits. Overall, the Sun conjunct Mercury in your partner's chart can enhance your relationship by promoting intellectual growth and a deeper connection through communication. It encourages you to embrace their communicative nature and find balance in expressing your own thoughts and feelings.\""}```"",
    ""prompt_tokens"": 4892,"		
											
Major Aspects and Connections more data			API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else and always answer as astrolger not AI BOT","user_content":"I was born on August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on  June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30 .  Keeping western astrology in mind and keeping this as main source info I need to know details of Sun in the Davison Chart  in love relationship partner as paragraph and also need to know the significance and impact  in my life, you have planet , aspect and house info given in json reposne must be in json format as {Sun in the Davison Chart:data} here data is dynamic data form bot and must be a paragraph with 3 sentences (minimum 6 paragraphs ) for Sun in the Davison Chart  in love relationship partner  make it real for me I don't need theory context in response you must add context of planet , aspect and house if any. Dont give any Additional JSON data in response "},"toolname":"other","json":{"mydetails":{"ascendant":71.03565456897975,"midheaven":327.5598198535195,"vertex":211.32869379691815,"houses":[{"house":1,"sign":"Gemini","sign_id":3,"degree":71.03565},{"house":2,"sign":"Cancer","sign_id":4,"degree":96.08341},{"house":3,"sign":"Leo","sign_id":5,"degree":120.46019},{"house":4,"sign":"Leo","sign_id":5,"degree":147.55982},{"house":5,"sign":"Virgo","sign_id":6,"degree":179.71154},{"house":6,"sign":"Scorpio","sign_id":8,"degree":215.87244},{"house":7,"sign":"Sagittarius","sign_id":9,"degree":251.03565},{"house":8,"sign":"Capricorn","sign_id":10,"degree":276.08341},{"house":9,"sign":"Aquarius","sign_id":11,"degree":300.46019},{"house":10,"sign":"Aquarius","sign_id":11,"degree":327.55982},{"house":11,"sign":"Pisces","sign_id":12,"degree":359.71154},{"house":12,"sign":"Taurus","sign_id":2,"degree":35.87244}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":6.49,"diff":173.51},{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":5.75,"diff":5.75},{"aspecting_planet":"Sun","aspected_planet":"Mercury","aspecting_planet_id":0,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":3.18,"diff":3.18},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":2.76,"diff":2.76},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":9.05,"diff":170.95},{"aspecting_planet":"Moon","aspected_planet":"Mercury","aspecting_planet_id":1,"aspected_planet_id":3,"aspect_type":2,"type":"Opposition","orb":9.67,"diff":170.33},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":3.73,"diff":176.27},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.57,"diff":2.57},{"aspecting_planet":"Mars","aspected_planet":"Jupiter","aspecting_planet_id":2,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":8.52,"diff":8.52},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":3.29,"diff":176.71},{"aspecting_planet":"Mars","aspected_planet":"Ascendant","aspecting_planet_id":2,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.5,"diff":55.5},{"aspecting_planet":"Mercury","aspected_planet":"Jupiter","aspecting_planet_id":3,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":5.94,"diff":5.94},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":5.87,"diff":174.13},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":4,"type":"Square","orb":0.77,"diff":90.77},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":3.38,"diff":93.38},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":3.92,"diff":116.08},{"aspecting_planet":"Saturn","aspected_planet":"Pluto","aspecting_planet_id":6,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":8.78,"diff":171.22},{"aspecting_planet":"Saturn","aspected_planet":"Midheaven","aspecting_planet_id":6,"aspected_planet_id":11,"aspect_type":3,"type":"Trine","orb":3.59,"diff":116.41},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":0.33,"diff":0.33},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.36,"diff":54.64},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":1.2,"diff":121.2},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":2,"type":"Opposition","orb":4.15,"diff":175.85}],"planets":[{"name":"Sun","full_degree":120.7857,"norm_degree":0.7857,"speed":0.9547,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Moon","full_degree":294.295,"norm_degree":24.295,"speed":12.889,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":8},{"name":"Mars","full_degree":126.5393,"norm_degree":6.5393,"speed":0.6404,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Mercury","full_degree":123.9658,"norm_degree":3.9658,"speed":2.0839,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Jupiter","full_degree":118.0226,"norm_degree":28.0226,"speed":0.2231,"is_retro":"false","sign_id":4,"sign":"Cancer","house":2},{"name":"Venus","full_degree":164.4179,"norm_degree":14.4179,"speed":1.0955,"is_retro":"false","sign_id":6,"sign":"Virgo","house":4},{"name":"Saturn","full_degree":83.9703,"norm_degree":23.9703,"speed":0.1129,"is_retro":"false","sign_id":3,"sign":"Gemini","house":1},{"name":"Uranus","full_degree":327.8866,"norm_degree":27.8866,"speed":-0.034,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":10},{"name":"Neptune","full_degree":309.8325,"norm_degree":9.8325,"speed":-0.0267,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":9},{"name":"Pluto","full_degree":255.1901,"norm_degree":15.1901,"speed":-0.0165,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":7},{"name":"Node","full_degree":77.216,"norm_degree":17.216,"speed":-0.0886,"is_retro":"true","sign_id":3,"sign":"Gemini","house":1},{"name":"Chiron","full_degree":274.574,"norm_degree":4.574,"speed":-0.0543,"is_retro":"true","sign_id":10,"sign":"Capricorn","house":7},{"name":"Part of Fortune","full_degree":257.5264,"norm_degree":17.5264,"speed":0,"is_retro":"false","sign_id":9,"sign":"Sagittarius","house":7}],"lilith":{"name":"Lilith","full_degree":7.5172,"norm_degree":7.5172,"speed":0.1119,"is_retro":"false","sign_id":1,"sign":"Aries","house":11}},"fiend_details":{"ascendant":352.28704269998116,"midheaven":264.6664338718442,"vertex":176.90088242133072,"houses":[{"house":1,"sign":"Pisces","sign_id":12,"degree":352.28704},{"house":2,"sign":"Aries","sign_id":1,"degree":29.41937},{"house":3,"sign":"Taurus","sign_id":2,"degree":59.29939},{"house":4,"sign":"Gemini","sign_id":3,"degree":84.66643},{"house":5,"sign":"Cancer","sign_id":4,"degree":109.36512},{"house":6,"sign":"Leo","sign_id":5,"degree":137.28302},{"house":7,"sign":"Virgo","sign_id":6,"degree":172.28704},{"house":8,"sign":"Libra","sign_id":7,"degree":209.41937},{"house":9,"sign":"Scorpio","sign_id":8,"degree":239.29939},{"house":10,"sign":"Sagittarius","sign_id":9,"degree":264.66643},{"house":11,"sign":"Capricorn","sign_id":10,"degree":289.36512},{"house":12,"sign":"Aquarius","sign_id":11,"degree":317.28302}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":5.47,"diff":174.53},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":7.03,"diff":7.03},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":6.64,"diff":6.64},{"aspecting_planet":"Sun","aspected_planet":"Saturn","aspecting_planet_id":0,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":5.86,"diff":5.86},{"aspecting_planet":"Sun","aspected_planet":"Uranus","aspecting_planet_id":0,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":6.4,"diff":96.4},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.91,"diff":64.91},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":1.56,"diff":178.44},{"aspecting_planet":"Moon","aspected_planet":"Venus","aspecting_planet_id":1,"aspected_planet_id":5,"aspect_type":2,"type":"Opposition","orb":1.17,"diff":178.83},{"aspecting_planet":"Moon","aspected_planet":"Saturn","aspecting_planet_id":1,"aspected_planet_id":6,"aspect_type":2,"type":"Opposition","orb":0.39,"diff":179.61},{"aspecting_planet":"Moon","aspected_planet":"Uranus","aspecting_planet_id":1,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.93,"diff":89.07},{"aspecting_planet":"Moon","aspected_planet":"Ascendant","aspecting_planet_id":1,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.55,"diff":120.55},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.29,"diff":2.29},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.23,"diff":123.23},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":2.16,"diff":177.84},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.94,"diff":120.94},{"aspecting_planet":"Mercury","aspected_planet":"Pluto","aspecting_planet_id":3,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.45,"diff":175.55},{"aspecting_planet":"Jupiter","aspected_planet":"Venus","aspecting_planet_id":4,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":0.39,"diff":0.39},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":1.17,"diff":1.17},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.63,"diff":89.37},{"aspecting_planet":"Jupiter","aspected_planet":"Ascendant","aspecting_planet_id":4,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":2.12,"diff":57.88},{"aspecting_planet":"Venus","aspected_planet":"Saturn","aspecting_planet_id":5,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.78,"diff":0.78},{"aspecting_planet":"Venus","aspected_planet":"Uranus","aspecting_planet_id":5,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.24,"diff":89.76},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":1.72,"diff":58.28},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.54,"diff":90.54},{"aspecting_planet":"Saturn","aspected_planet":"Ascendant","aspecting_planet_id":6,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":0.95,"diff":59.05},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.87,"diff":56.13},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.39,"diff":54.61},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":2.38,"diff":87.62}],"planets":[{"name":"Sun","full_degree":57.2003,"norm_degree":27.2003,"speed":0.9629,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Moon","full_degree":231.7352,"norm_degree":21.7352,"speed":12.3389,"is_retro":"false","sign_id":8,"sign":"Scorpio","house":8},{"name":"Mars","full_degree":69.7763,"norm_degree":9.7763,"speed":0.6914,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Mercury","full_degree":67.4912,"norm_degree":7.4912,"speed":2.0745,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Jupiter","full_degree":50.172,"norm_degree":20.172,"speed":0.2368,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Venus","full_degree":50.5645,"norm_degree":20.5645,"speed":1.2292,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Saturn","full_degree":51.3412,"norm_degree":21.3412,"speed":0.1283,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Uranus","full_degree":320.8013,"norm_degree":20.8013,"speed":0.0061,"is_retro":"false","sign_id":11,"sign":"Aquarius","house":12},{"name":"Neptune","full_degree":306.5494,"norm_degree":6.5494,"speed":-0.005,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":11},{"name":"Pluto","full_degree":251.939,"norm_degree":11.939,"speed":-0.0259,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Node","full_degree":116.3003,"norm_degree":26.3003,"speed":-0.1751,"is_retro":"true","sign_id":4,"sign":"Cancer","house":5},{"name":"Chiron","full_degree":255.3443,"norm_degree":15.3443,"speed":-0.0653,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Part of Fortune","full_degree":177.7521,"norm_degree":27.7521,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":7}],"lilith":{"name":"Lilith","full_degree":278.7196,"norm_degree":8.7196,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":10}}}}			"RESULTS : ""ai_response"": ""```json{    \""Sun in the Davison Chart\"": \""In the Davison Chart, the Sun is positioned in Taurus in the 2nd house, highlighting the importance of stability and security in your relationship. This placement suggests that your connection is grounded in shared values and a mutual desire for comfort and material well-being. The Sun's conjunction with Venus and Jupiter in this house enhances the warmth and affection between you, indicating a strong bond built on love and generosity. The Sun's opposition to the Moon in Scorpio in the 8th house introduces a dynamic tension between your need for security and the emotional intensity of your partner. This aspect can lead to transformative experiences in your relationship, as you both learn to balance stability with emotional depth. The Sun's sextile to the Ascendant in Pisces suggests that your relationship has a gentle and compassionate nature, allowing you both to express your true selves. Overall, the Sun in the Davison Chart indicates a relationship that is both nurturing and transformative, with a strong foundation in shared values and emotional growth.\""}```"",
    ""prompt_tokens"": 4895,"		
											
Compatibility Score or Summary			API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else and always answer as astrolger not AI BOT","user_content":"I was born on August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on  June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30 .  Keeping western astrology in mind and keeping this as main source info I need to know details of Sun-Moon Opposition  in love relationship partner as paragraph and also need to know the significance and impact  in my life, you have planet , aspect and house info given in json reposne must be in json format as {Sun-Moon Opposition:data} here data is dynamic data form bot and must be a paragraph with 3 sentences (minimum 6 paragraphs ) for Sun-Moon Opposition  in love relationship partner  make it real for me I don't need theory context in response you must add context of planet , aspect and house if any. Dont give any Additional JSON data in response "},"toolname":"other","json":{"mydetails":{"ascendant":71.03565456897975,"midheaven":327.5598198535195,"vertex":211.32869379691815,"houses":[{"house":1,"sign":"Gemini","sign_id":3,"degree":71.03565},{"house":2,"sign":"Cancer","sign_id":4,"degree":96.08341},{"house":3,"sign":"Leo","sign_id":5,"degree":120.46019},{"house":4,"sign":"Leo","sign_id":5,"degree":147.55982},{"house":5,"sign":"Virgo","sign_id":6,"degree":179.71154},{"house":6,"sign":"Scorpio","sign_id":8,"degree":215.87244},{"house":7,"sign":"Sagittarius","sign_id":9,"degree":251.03565},{"house":8,"sign":"Capricorn","sign_id":10,"degree":276.08341},{"house":9,"sign":"Aquarius","sign_id":11,"degree":300.46019},{"house":10,"sign":"Aquarius","sign_id":11,"degree":327.55982},{"house":11,"sign":"Pisces","sign_id":12,"degree":359.71154},{"house":12,"sign":"Taurus","sign_id":2,"degree":35.87244}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":6.49,"diff":173.51},{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":5.75,"diff":5.75},{"aspecting_planet":"Sun","aspected_planet":"Mercury","aspecting_planet_id":0,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":3.18,"diff":3.18},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":2.76,"diff":2.76},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":9.05,"diff":170.95},{"aspecting_planet":"Moon","aspected_planet":"Mercury","aspecting_planet_id":1,"aspected_planet_id":3,"aspect_type":2,"type":"Opposition","orb":9.67,"diff":170.33},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":3.73,"diff":176.27},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.57,"diff":2.57},{"aspecting_planet":"Mars","aspected_planet":"Jupiter","aspecting_planet_id":2,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":8.52,"diff":8.52},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":3.29,"diff":176.71},{"aspecting_planet":"Mars","aspected_planet":"Ascendant","aspecting_planet_id":2,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.5,"diff":55.5},{"aspecting_planet":"Mercury","aspected_planet":"Jupiter","aspecting_planet_id":3,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":5.94,"diff":5.94},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":5.87,"diff":174.13},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":4,"type":"Square","orb":0.77,"diff":90.77},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":3.38,"diff":93.38},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":3.92,"diff":116.08},{"aspecting_planet":"Saturn","aspected_planet":"Pluto","aspecting_planet_id":6,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":8.78,"diff":171.22},{"aspecting_planet":"Saturn","aspected_planet":"Midheaven","aspecting_planet_id":6,"aspected_planet_id":11,"aspect_type":3,"type":"Trine","orb":3.59,"diff":116.41},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":0.33,"diff":0.33},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.36,"diff":54.64},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":1.2,"diff":121.2},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":2,"type":"Opposition","orb":4.15,"diff":175.85}],"planets":[{"name":"Sun","full_degree":120.7857,"norm_degree":0.7857,"speed":0.9547,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Moon","full_degree":294.295,"norm_degree":24.295,"speed":12.889,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":8},{"name":"Mars","full_degree":126.5393,"norm_degree":6.5393,"speed":0.6404,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Mercury","full_degree":123.9658,"norm_degree":3.9658,"speed":2.0839,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Jupiter","full_degree":118.0226,"norm_degree":28.0226,"speed":0.2231,"is_retro":"false","sign_id":4,"sign":"Cancer","house":2},{"name":"Venus","full_degree":164.4179,"norm_degree":14.4179,"speed":1.0955,"is_retro":"false","sign_id":6,"sign":"Virgo","house":4},{"name":"Saturn","full_degree":83.9703,"norm_degree":23.9703,"speed":0.1129,"is_retro":"false","sign_id":3,"sign":"Gemini","house":1},{"name":"Uranus","full_degree":327.8866,"norm_degree":27.8866,"speed":-0.034,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":10},{"name":"Neptune","full_degree":309.8325,"norm_degree":9.8325,"speed":-0.0267,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":9},{"name":"Pluto","full_degree":255.1901,"norm_degree":15.1901,"speed":-0.0165,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":7},{"name":"Node","full_degree":77.216,"norm_degree":17.216,"speed":-0.0886,"is_retro":"true","sign_id":3,"sign":"Gemini","house":1},{"name":"Chiron","full_degree":274.574,"norm_degree":4.574,"speed":-0.0543,"is_retro":"true","sign_id":10,"sign":"Capricorn","house":7},{"name":"Part of Fortune","full_degree":257.5264,"norm_degree":17.5264,"speed":0,"is_retro":"false","sign_id":9,"sign":"Sagittarius","house":7}],"lilith":{"name":"Lilith","full_degree":7.5172,"norm_degree":7.5172,"speed":0.1119,"is_retro":"false","sign_id":1,"sign":"Aries","house":11}},"fiend_details":{"ascendant":352.28704269998116,"midheaven":264.6664338718442,"vertex":176.90088242133072,"houses":[{"house":1,"sign":"Pisces","sign_id":12,"degree":352.28704},{"house":2,"sign":"Aries","sign_id":1,"degree":29.41937},{"house":3,"sign":"Taurus","sign_id":2,"degree":59.29939},{"house":4,"sign":"Gemini","sign_id":3,"degree":84.66643},{"house":5,"sign":"Cancer","sign_id":4,"degree":109.36512},{"house":6,"sign":"Leo","sign_id":5,"degree":137.28302},{"house":7,"sign":"Virgo","sign_id":6,"degree":172.28704},{"house":8,"sign":"Libra","sign_id":7,"degree":209.41937},{"house":9,"sign":"Scorpio","sign_id":8,"degree":239.29939},{"house":10,"sign":"Sagittarius","sign_id":9,"degree":264.66643},{"house":11,"sign":"Capricorn","sign_id":10,"degree":289.36512},{"house":12,"sign":"Aquarius","sign_id":11,"degree":317.28302}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":5.47,"diff":174.53},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":7.03,"diff":7.03},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":6.64,"diff":6.64},{"aspecting_planet":"Sun","aspected_planet":"Saturn","aspecting_planet_id":0,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":5.86,"diff":5.86},{"aspecting_planet":"Sun","aspected_planet":"Uranus","aspecting_planet_id":0,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":6.4,"diff":96.4},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.91,"diff":64.91},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":1.56,"diff":178.44},{"aspecting_planet":"Moon","aspected_planet":"Venus","aspecting_planet_id":1,"aspected_planet_id":5,"aspect_type":2,"type":"Opposition","orb":1.17,"diff":178.83},{"aspecting_planet":"Moon","aspected_planet":"Saturn","aspecting_planet_id":1,"aspected_planet_id":6,"aspect_type":2,"type":"Opposition","orb":0.39,"diff":179.61},{"aspecting_planet":"Moon","aspected_planet":"Uranus","aspecting_planet_id":1,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.93,"diff":89.07},{"aspecting_planet":"Moon","aspected_planet":"Ascendant","aspecting_planet_id":1,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.55,"diff":120.55},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.29,"diff":2.29},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.23,"diff":123.23},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":2.16,"diff":177.84},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.94,"diff":120.94},{"aspecting_planet":"Mercury","aspected_planet":"Pluto","aspecting_planet_id":3,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.45,"diff":175.55},{"aspecting_planet":"Jupiter","aspected_planet":"Venus","aspecting_planet_id":4,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":0.39,"diff":0.39},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":1.17,"diff":1.17},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.63,"diff":89.37},{"aspecting_planet":"Jupiter","aspected_planet":"Ascendant","aspecting_planet_id":4,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":2.12,"diff":57.88},{"aspecting_planet":"Venus","aspected_planet":"Saturn","aspecting_planet_id":5,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.78,"diff":0.78},{"aspecting_planet":"Venus","aspected_planet":"Uranus","aspecting_planet_id":5,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.24,"diff":89.76},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":1.72,"diff":58.28},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.54,"diff":90.54},{"aspecting_planet":"Saturn","aspected_planet":"Ascendant","aspecting_planet_id":6,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":0.95,"diff":59.05},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.87,"diff":56.13},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.39,"diff":54.61},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":2.38,"diff":87.62}],"planets":[{"name":"Sun","full_degree":57.2003,"norm_degree":27.2003,"speed":0.9629,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Moon","full_degree":231.7352,"norm_degree":21.7352,"speed":12.3389,"is_retro":"false","sign_id":8,"sign":"Scorpio","house":8},{"name":"Mars","full_degree":69.7763,"norm_degree":9.7763,"speed":0.6914,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Mercury","full_degree":67.4912,"norm_degree":7.4912,"speed":2.0745,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Jupiter","full_degree":50.172,"norm_degree":20.172,"speed":0.2368,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Venus","full_degree":50.5645,"norm_degree":20.5645,"speed":1.2292,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Saturn","full_degree":51.3412,"norm_degree":21.3412,"speed":0.1283,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Uranus","full_degree":320.8013,"norm_degree":20.8013,"speed":0.0061,"is_retro":"false","sign_id":11,"sign":"Aquarius","house":12},{"name":"Neptune","full_degree":306.5494,"norm_degree":6.5494,"speed":-0.005,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":11},{"name":"Pluto","full_degree":251.939,"norm_degree":11.939,"speed":-0.0259,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Node","full_degree":116.3003,"norm_degree":26.3003,"speed":-0.1751,"is_retro":"true","sign_id":4,"sign":"Cancer","house":5},{"name":"Chiron","full_degree":255.3443,"norm_degree":15.3443,"speed":-0.0653,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Part of Fortune","full_degree":177.7521,"norm_degree":27.7521,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":7}],"lilith":{"name":"Lilith","full_degree":278.7196,"norm_degree":8.7196,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":10}}}}			"RESULTS : ""ai_response"": ""```json{    \""Sun-Moon Opposition\"": \""In your partner's chart, the Sun in Taurus opposing the Moon in Scorpio creates a dynamic tension between stability and transformation. This aspect often brings a push-pull dynamic in relationships, where the need for security and comfort clashes with the desire for deep emotional change. The Sun in the 2nd house emphasizes values and possessions, while the Moon in the 8th house highlights shared resources and intimacy, suggesting a need to balance personal values with shared emotional depths. This opposition can manifest as a struggle between maintaining the status quo and embracing emotional vulnerability, which can lead to growth if navigated consciously. The influence of Taurus and Scorpio suggests a powerful attraction, yet also potential power struggles, as both signs are known for their determination and intensity. In your life, this aspect may challenge you to find harmony between your own need for security and your partner's emotional intensity, encouraging mutual understanding and compromise. The Sun-Moon opposition in your partner's chart can serve as a catalyst for personal growth, urging both of you to explore deeper emotional connections and shared values.\""}```"",
    ""prompt_tokens"": 4889,"		
											
Elemental Balance More Data			API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else and always answer as astrolger not AI BOT","user_content":"I was born on August 24, 2002,  1:0 in  Kolkata, West Bengal, India  'lat:22.5706,lon:88.37132,tzone:+05:30'. my love relation partner was born on  June 18, 2000 1:0 at Kolkata, West Bengal, India   'lat:22.5706,lon:88.37132,tzone:+05:30 .  Keeping western astrology in mind and keeping this as main source info I need to know details of Elemental Balance  in love relationship partner as paragraph and also need to know the significance and impact  in my life, you have planet , aspect and house info given in json reposne must be in json format as {Elemental Balance:data} here data is dynamic data form bot and must be a paragraph with 3 sentences (minimum 6 paragraphs ) for Elemental Balance  in love relationship partner  make it real for me I don't need theory context in response you must add context of planet , aspect and house if any. Dont give any Additional JSON data in response "},"toolname":"other","json":{"mydetails":{"ascendant":71.03565456897975,"midheaven":327.5598198535195,"vertex":211.32869379691815,"houses":[{"house":1,"sign":"Gemini","sign_id":3,"degree":71.03565},{"house":2,"sign":"Cancer","sign_id":4,"degree":96.08341},{"house":3,"sign":"Leo","sign_id":5,"degree":120.46019},{"house":4,"sign":"Leo","sign_id":5,"degree":147.55982},{"house":5,"sign":"Virgo","sign_id":6,"degree":179.71154},{"house":6,"sign":"Scorpio","sign_id":8,"degree":215.87244},{"house":7,"sign":"Sagittarius","sign_id":9,"degree":251.03565},{"house":8,"sign":"Capricorn","sign_id":10,"degree":276.08341},{"house":9,"sign":"Aquarius","sign_id":11,"degree":300.46019},{"house":10,"sign":"Aquarius","sign_id":11,"degree":327.55982},{"house":11,"sign":"Pisces","sign_id":12,"degree":359.71154},{"house":12,"sign":"Taurus","sign_id":2,"degree":35.87244}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":6.49,"diff":173.51},{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":5.75,"diff":5.75},{"aspecting_planet":"Sun","aspected_planet":"Mercury","aspecting_planet_id":0,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":3.18,"diff":3.18},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":2.76,"diff":2.76},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":9.05,"diff":170.95},{"aspecting_planet":"Moon","aspected_planet":"Mercury","aspecting_planet_id":1,"aspected_planet_id":3,"aspect_type":2,"type":"Opposition","orb":9.67,"diff":170.33},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":3.73,"diff":176.27},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.57,"diff":2.57},{"aspecting_planet":"Mars","aspected_planet":"Jupiter","aspecting_planet_id":2,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":8.52,"diff":8.52},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":3.29,"diff":176.71},{"aspecting_planet":"Mars","aspected_planet":"Ascendant","aspecting_planet_id":2,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.5,"diff":55.5},{"aspecting_planet":"Mercury","aspected_planet":"Jupiter","aspecting_planet_id":3,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":5.94,"diff":5.94},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":2,"type":"Opposition","orb":5.87,"diff":174.13},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":4,"type":"Square","orb":0.77,"diff":90.77},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":3.38,"diff":93.38},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":3.92,"diff":116.08},{"aspecting_planet":"Saturn","aspected_planet":"Pluto","aspecting_planet_id":6,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":8.78,"diff":171.22},{"aspecting_planet":"Saturn","aspected_planet":"Midheaven","aspecting_planet_id":6,"aspected_planet_id":11,"aspect_type":3,"type":"Trine","orb":3.59,"diff":116.41},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":0.33,"diff":0.33},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.36,"diff":54.64},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":1.2,"diff":121.2},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":2,"type":"Opposition","orb":4.15,"diff":175.85}],"planets":[{"name":"Sun","full_degree":120.7857,"norm_degree":0.7857,"speed":0.9547,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Moon","full_degree":294.295,"norm_degree":24.295,"speed":12.889,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":8},{"name":"Mars","full_degree":126.5393,"norm_degree":6.5393,"speed":0.6404,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Mercury","full_degree":123.9658,"norm_degree":3.9658,"speed":2.0839,"is_retro":"false","sign_id":5,"sign":"Leo","house":3},{"name":"Jupiter","full_degree":118.0226,"norm_degree":28.0226,"speed":0.2231,"is_retro":"false","sign_id":4,"sign":"Cancer","house":2},{"name":"Venus","full_degree":164.4179,"norm_degree":14.4179,"speed":1.0955,"is_retro":"false","sign_id":6,"sign":"Virgo","house":4},{"name":"Saturn","full_degree":83.9703,"norm_degree":23.9703,"speed":0.1129,"is_retro":"false","sign_id":3,"sign":"Gemini","house":1},{"name":"Uranus","full_degree":327.8866,"norm_degree":27.8866,"speed":-0.034,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":10},{"name":"Neptune","full_degree":309.8325,"norm_degree":9.8325,"speed":-0.0267,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":9},{"name":"Pluto","full_degree":255.1901,"norm_degree":15.1901,"speed":-0.0165,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":7},{"name":"Node","full_degree":77.216,"norm_degree":17.216,"speed":-0.0886,"is_retro":"true","sign_id":3,"sign":"Gemini","house":1},{"name":"Chiron","full_degree":274.574,"norm_degree":4.574,"speed":-0.0543,"is_retro":"true","sign_id":10,"sign":"Capricorn","house":7},{"name":"Part of Fortune","full_degree":257.5264,"norm_degree":17.5264,"speed":0,"is_retro":"false","sign_id":9,"sign":"Sagittarius","house":7}],"lilith":{"name":"Lilith","full_degree":7.5172,"norm_degree":7.5172,"speed":0.1119,"is_retro":"false","sign_id":1,"sign":"Aries","house":11}},"fiend_details":{"ascendant":352.28704269998116,"midheaven":264.6664338718442,"vertex":176.90088242133072,"houses":[{"house":1,"sign":"Pisces","sign_id":12,"degree":352.28704},{"house":2,"sign":"Aries","sign_id":1,"degree":29.41937},{"house":3,"sign":"Taurus","sign_id":2,"degree":59.29939},{"house":4,"sign":"Gemini","sign_id":3,"degree":84.66643},{"house":5,"sign":"Cancer","sign_id":4,"degree":109.36512},{"house":6,"sign":"Leo","sign_id":5,"degree":137.28302},{"house":7,"sign":"Virgo","sign_id":6,"degree":172.28704},{"house":8,"sign":"Libra","sign_id":7,"degree":209.41937},{"house":9,"sign":"Scorpio","sign_id":8,"degree":239.29939},{"house":10,"sign":"Sagittarius","sign_id":9,"degree":264.66643},{"house":11,"sign":"Capricorn","sign_id":10,"degree":289.36512},{"house":12,"sign":"Aquarius","sign_id":11,"degree":317.28302}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Moon","aspecting_planet_id":0,"aspected_planet_id":1,"aspect_type":2,"type":"Opposition","orb":5.47,"diff":174.53},{"aspecting_planet":"Sun","aspected_planet":"Jupiter","aspecting_planet_id":0,"aspected_planet_id":4,"aspect_type":1,"type":"Conjunction","orb":7.03,"diff":7.03},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":6.64,"diff":6.64},{"aspecting_planet":"Sun","aspected_planet":"Saturn","aspecting_planet_id":0,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":5.86,"diff":5.86},{"aspecting_planet":"Sun","aspected_planet":"Uranus","aspecting_planet_id":0,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":6.4,"diff":96.4},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":4.91,"diff":64.91},{"aspecting_planet":"Moon","aspected_planet":"Jupiter","aspecting_planet_id":1,"aspected_planet_id":4,"aspect_type":2,"type":"Opposition","orb":1.56,"diff":178.44},{"aspecting_planet":"Moon","aspected_planet":"Venus","aspecting_planet_id":1,"aspected_planet_id":5,"aspect_type":2,"type":"Opposition","orb":1.17,"diff":178.83},{"aspecting_planet":"Moon","aspected_planet":"Saturn","aspecting_planet_id":1,"aspected_planet_id":6,"aspect_type":2,"type":"Opposition","orb":0.39,"diff":179.61},{"aspecting_planet":"Moon","aspected_planet":"Uranus","aspecting_planet_id":1,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.93,"diff":89.07},{"aspecting_planet":"Moon","aspected_planet":"Ascendant","aspecting_planet_id":1,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.55,"diff":120.55},{"aspecting_planet":"Mars","aspected_planet":"Mercury","aspecting_planet_id":2,"aspected_planet_id":3,"aspect_type":1,"type":"Conjunction","orb":2.29,"diff":2.29},{"aspecting_planet":"Mars","aspected_planet":"Neptune","aspecting_planet_id":2,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.23,"diff":123.23},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":2.16,"diff":177.84},{"aspecting_planet":"Mercury","aspected_planet":"Neptune","aspecting_planet_id":3,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.94,"diff":120.94},{"aspecting_planet":"Mercury","aspected_planet":"Pluto","aspecting_planet_id":3,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.45,"diff":175.55},{"aspecting_planet":"Jupiter","aspected_planet":"Venus","aspecting_planet_id":4,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":0.39,"diff":0.39},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":1.17,"diff":1.17},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.63,"diff":89.37},{"aspecting_planet":"Jupiter","aspected_planet":"Ascendant","aspecting_planet_id":4,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":2.12,"diff":57.88},{"aspecting_planet":"Venus","aspected_planet":"Saturn","aspecting_planet_id":5,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.78,"diff":0.78},{"aspecting_planet":"Venus","aspected_planet":"Uranus","aspecting_planet_id":5,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.24,"diff":89.76},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":1.72,"diff":58.28},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":0.54,"diff":90.54},{"aspecting_planet":"Saturn","aspected_planet":"Ascendant","aspecting_planet_id":6,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":0.95,"diff":59.05},{"aspecting_planet":"Uranus","aspected_planet":"Midheaven","aspecting_planet_id":7,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.87,"diff":56.13},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.39,"diff":54.61},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":2.38,"diff":87.62}],"planets":[{"name":"Sun","full_degree":57.2003,"norm_degree":27.2003,"speed":0.9629,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Moon","full_degree":231.7352,"norm_degree":21.7352,"speed":12.3389,"is_retro":"false","sign_id":8,"sign":"Scorpio","house":8},{"name":"Mars","full_degree":69.7763,"norm_degree":9.7763,"speed":0.6914,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Mercury","full_degree":67.4912,"norm_degree":7.4912,"speed":2.0745,"is_retro":"false","sign_id":3,"sign":"Gemini","house":3},{"name":"Jupiter","full_degree":50.172,"norm_degree":20.172,"speed":0.2368,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Venus","full_degree":50.5645,"norm_degree":20.5645,"speed":1.2292,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Saturn","full_degree":51.3412,"norm_degree":21.3412,"speed":0.1283,"is_retro":"false","sign_id":2,"sign":"Taurus","house":2},{"name":"Uranus","full_degree":320.8013,"norm_degree":20.8013,"speed":0.0061,"is_retro":"false","sign_id":11,"sign":"Aquarius","house":12},{"name":"Neptune","full_degree":306.5494,"norm_degree":6.5494,"speed":-0.005,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":11},{"name":"Pluto","full_degree":251.939,"norm_degree":11.939,"speed":-0.0259,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Node","full_degree":116.3003,"norm_degree":26.3003,"speed":-0.1751,"is_retro":"true","sign_id":4,"sign":"Cancer","house":5},{"name":"Chiron","full_degree":255.3443,"norm_degree":15.3443,"speed":-0.0653,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":9},{"name":"Part of Fortune","full_degree":177.7521,"norm_degree":27.7521,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":7}],"lilith":{"name":"Lilith","full_degree":278.7196,"norm_degree":8.7196,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":10}}}}			"RESULTS : ""ai_response"": ""```json{    \""Elemental Balance\"": \""Your love relationship partner, born on June 18, 2000, has a strong Earth element presence in their chart, primarily due to the Sun, Jupiter, Venus, and Saturn all residing in Taurus. This Earth dominance suggests a grounded, practical, and reliable nature, which can bring stability and security to your relationship. The presence of Mars and Mercury in Gemini adds a touch of Air, indicating a quick-witted and communicative side, enhancing intellectual connection and adaptability. The Moon in Scorpio introduces a Water element, bringing depth, emotional intensity, and a need for profound connections, which can lead to transformative experiences in your partnership. The Air influence from Uranus and Neptune in Aquarius suggests a visionary and innovative approach to life, encouraging growth and evolution in your relationship. The balance of Earth and Water elements in their chart indicates a nurturing and supportive partner, capable of providing both emotional and material support. This elemental combination can significantly impact your life by offering a harmonious blend of stability, communication, and emotional depth, fostering a well-rounded and fulfilling relationship.\""}```"",
    ""prompt_tokens"": 4886,"		