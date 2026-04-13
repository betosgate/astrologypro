
# Friendship Report (Tropical V2) Recreation Task

This document details the specific requirements for recreating the `horoscope?tab=friendship_report_tropical_v2` functionality from the `astrologypro` project.

## 1. Overview
The Friendship Report is a "two-person" analysis tool that compares the birth charts of two individuals to determine their platonic compatibility and relationship dynamics. It uses a combination of Synastry, Composite, and Davison charts, all processed through an AI interpretation engine.

---

## 2. Components Used

### A. Core Page Structure
- **`HoroscopePage`**: Handles the `tab=friendship_report_tropical_v2` state and orchestrates multi-step data fetching.
- **`RelationshipSection`**: The primary container for rendering the 8 distinct AI-driven analysis blocks.

### B. Custom Visualization Components
- **`RelationshipHeading`**: A dynamic component that parses interpretation titles to render planet-aspect-planet icon sequences.
    - *Example*: "Sun Conjunct Moon" -> `[Sun Icon] [Conjunct Icon] [Moon Icon]`
- **`SectionSkeleton` & `SectionError`**: Handling loading and error states for individual blocks.
- **`ShowMoreModal`**: The heavy-duty modal for displaying the full interpretation, word associations, and pictorial data.

### C. Specific Sections (AI Blocks)
1. **Synastry Horoscope**: Comparison of individual planetary placements.
2. **Composite Horoscope**: Analysis of the "third entity" chart formed by the midpoint of both individuals.
3. **Davison Relationship**: A different approach to relationship charting using the time-space midpoint.
4. **Major Aspects & Connections**: Focus on the strongest astrological links between the two.
5. **Compatibility Score / Summary**: A high-level overview and numerical/qualitative assessment.
6. **Elemental Balance**: Comparison of Fire, Earth, Air, and Water placements.
7. **Timing & Transits**: Potential trends and windows of opportunity/challenge.
8. **Karmic & Soulmate Indicators**: Specific focus on North/South Nodes and Saturn links (enabled for friendship tabs).

---

## 3. Data & API Workflow

### Step 1: Birth Data Capture
- Captures birth info (Date, Time, Place) for both **Person 1** and **Person 2**.
- Uses `CityAutocomplete` for accurate coordinates.

### Step 2: Compute API Call
- **Endpoint**: `/api/admin/astro/compute`
- **Method**: POST
- **Payload**: Contains Person 1 and Person 2 birth data.
- **Result**: Comprehensive synastry data used as context for the AI.

### Step 3: AI Interpretation Calls
- **Endpoint**: `/api/admin/astro/ai-interpret`
- **Method**: POST
- **Frequency**: One call per section (8 total) to ensure detailed responses.
- **Prompt Logic**: `buildAiPrompts` uses specific labels like "friendship partner" to tune the AI's perspective towards platonic relationships rather than romantic ones.

---

## 4. Key Logic (Friendship Specific)

### Relationship Context
The AI prompt for friendship uses the following context modifier:
- `context`: "friendship"
- `relationshipContext`: "friendship partner"

This ensures the interpretation avoids romantic language and focuses on themes of loyalty, shared interests, communication, and platonic support.

### Heading Parsing
The `RelationshipHeading` uses Regex to identify planet names within the AI-returned titles and maps them to `PLANET_IMAGES` and `ASPECT_IMAGES`.

---

## 5. Aesthetics & Design
- **Theme**: Dark Mode with Amber/Gold accents (`#eb910a`).
- **Cards**: Each AI section is wrapped in a `rounded-lg border` with a specific `horoscope-section-header` and `interp-gradient-default`.
- **Typography**: Interpretations are rendered in `Roboto` at `20px` with `leading-relaxed` to provide a premium, readable experience.

---

## 6. Implementation Checklist
1. [ ] **Dual Input State**: Ensure the UI can toggle between single and two-person modes correctly.
2. [ ] **AI Orchestration**: Implement a sequence of 8 API calls with appropriate loading skeletons.
3. [ ] **Prompt Tuning**: Port the exact Friendship-specific string modifiers from `buildAiPrompts`.
4. [ ] **Image Maps**: Ensure all S3 links for planets and aspects are correctly mapped in the new project.


API USED Payload and response sample :


Friendship Relation Ships											
											
Inputs											
			Date Of Birth			Time Of Birth			City		
											
Self			7/24/2002			01:00			Bardhaman,West Bengal, India		
											
Partner			5/31/2000			01:00			Bardhaman,West Bengal, India		
Api List											
CONTEXT			API NAMES			PAYLOADS			RESPONSE		
Fetch lat lon			 API : https://d36fwfwo4vnk9h.cloudfront.net/astro-ai/fetch_city_with_latLon			PAYLOAD : {"formvalue":{"date_of_birth":"2000-05-30T18:30:00.000Z","time_of_birth":"1:00 PM","city":"bardhaman"},"searchcondition":{"search_string":"bardhaman"},"secret":"na","token":""}			"RESULTS : {
    ""status"": ""success"",
    ""res"": [
        {
            ""val"": ""Bardhaman, West Bengal, India"",
            ""key"": {
                ""timezone"": {
                    ""name"": ""Asia/Kolkata"",
                    ""utcOffset"": ""+05:30"",
                    ""offset_string"": ""+05:30""
                },
                ""lat"": 23.24073,
                ""lng"": 87.86733,
                ""label"": ""Bardhaman, West Bengal, India""
            }
        }
    ]
}"		
											
natal_wheel_chart			 API : https://json.astrologyapi.com/v1/natal_wheel_chart			PAYLOAD : {"hour":13,"min":0,"day":31,"month":5,"year":2000,"lat":23.24073,"lon":87.86733,"tzone":"+05:30"}			"RESULTS : {
    ""status"": true,
    ""chart_url"": ""https://s3.ap-south-1.amazonaws.com/western-chart/4d98f7c0-5d76-11f0-8234-1b262974afc5.svg"",
    ""msg"": ""Chart created successfully!""
}"		
											
Fetch lat lon			 API : https://d36fwfwo4vnk9h.cloudfront.net/astro-ai/fetch_city_with_latLon			PAYLOAD : {"hour":13,"min":0,"day":31,"month":5,"year":2000,"lat":23.24073,"lon":87.86733,"tzone":"+05:30"}			"RESULTS : {
    ""status"": true,
    ""chart_url"": ""https://s3.ap-south-1.amazonaws.com/western-chart/4d972300-5d76-11f0-b9d2-7b8e69b1b2ba.svg"",
    ""msg"": ""Chart created successfully!""
}"		
											
synastry_horoscope			 API : https://json.astrologyapi.com/v1/synastry_horoscope			PAYLOAD : {"p_hour":13,"p_min":0,"p_day":31,"p_month":5,"p_year":2000,"p_lat":23.24073,"p_lon":87.86733,"p_tzone":"+05:30","s_hour":13,"s_min":0,"s_day":31,"s_month":5,"s_year":2000,"s_lat":23.24073,"s_lon":87.86733,"s_tzone":"+05:30"}			"RESULTS : {
    ""first"": [
        {
            ""name"": ""Sun"",
            ""full_degree"": 70.1697,
            ""norm_degree"": 10.1697,
            ""speed"": 0.9589,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Moon"",
            ""full_degree"": 40.092,
            ""norm_degree"": 10.092,
            ""speed"": 14.4256,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Mars"",
            ""full_degree"": 79.0466,
            ""norm_degree"": 19.0466,
            ""speed"": 0.6821,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Mercury"",
            ""full_degree"": 91.7231,
            ""norm_degree"": 1.7231,
            ""speed"": 1.4718,
            ""is_retro"": ""false"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 9
        },
        {
            ""name"": ""Jupiter"",
            ""full_degree"": 53.3416,
            ""norm_degree"": 23.3416,
            ""speed"": 0.2322,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Venus"",
            ""full_degree"": 67.1558,
            ""norm_degree"": 7.1558,
            ""speed"": 1.2289,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Saturn"",
            ""full_degree"": 53.056,
            ""norm_degree"": 23.056,
            ""speed"": 0.1252,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Uranus"",
            ""full_degree"": 320.8098,
            ""norm_degree"": 20.8098,
            ""speed"": -0.0049,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 5
        },
        {
            ""name"": ""Neptune"",
            ""full_degree"": 306.435,
            ""norm_degree"": 6.435,
            ""speed"": -0.0118,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 4
        },
        {
            ""name"": ""Pluto"",
            ""full_degree"": 251.579,
            ""norm_degree"": 11.579,
            ""speed"": -0.0271,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 3
        },
        {
            ""name"": ""Node"",
            ""full_degree"": 115.5338,
            ""norm_degree"": 25.5338,
            ""speed"": -0.1159,
            ""is_retro"": ""true"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 10
        },
        {
            ""name"": ""Chiron"",
            ""full_degree"": 254.42,
            ""norm_degree"": 14.42,
            ""speed"": -0.0705,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 3
        },
        {
            ""name"": ""Part of Fortune"",
            ""full_degree"": 156.3446,
            ""norm_degree"": 6.3446,
            ""speed"": 0,
            ""is_retro"": ""false"",
            ""sign_id"": 6,
            ""sign"": ""Virgo"",
            ""house"": 11
        }
    ],
    ""second"": [
        {
            ""name"": ""Sun"",
            ""full_degree"": 70.1697,
            ""norm_degree"": 10.1697,
            ""speed"": 0.9589,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Moon"",
            ""full_degree"": 40.092,
            ""norm_degree"": 10.092,
            ""speed"": 14.4256,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Mars"",
            ""full_degree"": 79.0466,
            ""norm_degree"": 19.0466,
            ""speed"": 0.6821,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Mercury"",
            ""full_degree"": 91.7231,
            ""norm_degree"": 1.7231,
            ""speed"": 1.4718,
            ""is_retro"": ""false"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 9
        },
        {
            ""name"": ""Jupiter"",
            ""full_degree"": 53.3416,
            ""norm_degree"": 23.3416,
            ""speed"": 0.2322,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Venus"",
            ""full_degree"": 67.1558,
            ""norm_degree"": 7.1558,
            ""speed"": 1.2289,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Saturn"",
            ""full_degree"": 53.056,
            ""norm_degree"": 23.056,
            ""speed"": 0.1252,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Uranus"",
            ""full_degree"": 320.8098,
            ""norm_degree"": 20.8098,
            ""speed"": -0.0049,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 5
        },
        {
            ""name"": ""Neptune"",
            ""full_degree"": 306.435,
            ""norm_degree"": 6.435,
            ""speed"": -0.0118,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 4
        },
        {
            ""name"": ""Pluto"",
            ""full_degree"": 251.579,
            ""norm_degree"": 11.579,
            ""speed"": -0.0271,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 3
        },
        {
            ""name"": ""Node"",
            ""full_degree"": 115.5338,
            ""norm_degree"": 25.5338,
            ""speed"": -0.1159,
            ""is_retro"": ""true"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 10
        },
        {
            ""name"": ""Chiron"",
            ""full_degree"": 254.42,
            ""norm_degree"": 14.42,
            ""speed"": -0.0705,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 3
        },
        {
            ""name"": ""Part of Fortune"",
            ""full_degree"": 156.3446,
            ""norm_degree"": 6.3446,
            ""speed"": 0,
            ""is_retro"": ""false"",
            ""sign_id"": 6,
            ""sign"": ""Virgo"",
            ""house"": 11
        }
    ],
    ""synastry"": {
        ""house_1"": [
            {
                ""name"": ""Sun"",
                ""synastry_house"": 9
            },
            {
                ""name"": ""Moon"",
                ""synastry_house"": 8
            },
            {
                ""name"": ""Mars"",
                ""synastry_house"": 9
            },
            {
                ""name"": ""Mercury"",
                ""synastry_house"": 9
            },
            {
                ""name"": ""Jupiter"",
                ""synastry_house"": 8
            },
            {
                ""name"": ""Venus"",
                ""synastry_house"": 9
            },
            {
                ""name"": ""Saturn"",
                ""synastry_house"": 8
            },
            {
                ""name"": ""Uranus"",
                ""synastry_house"": 5
            },
            {
                ""name"": ""Neptune"",
                ""synastry_house"": 4
            },
            {
                ""name"": ""Pluto"",
                ""synastry_house"": 3
            },
            {
                ""name"": ""Node"",
                ""synastry_house"": 10
            },
            {
                ""name"": ""Chiron"",
                ""synastry_house"": 3
            },
            {
                ""name"": ""Part of Fortune"",
                ""synastry_house"": 11
            }
        ],
        ""house_2"": [
            {
                ""name"": ""Sun"",
                ""synastry_house"": 9
            },
            {
                ""name"": ""Moon"",
                ""synastry_house"": 8
            },
            {
                ""name"": ""Mars"",
                ""synastry_house"": 9
            },
            {
                ""name"": ""Mercury"",
                ""synastry_house"": 9
            },
            {
                ""name"": ""Jupiter"",
                ""synastry_house"": 8
            },
            {
                ""name"": ""Venus"",
                ""synastry_house"": 9
            },
            {
                ""name"": ""Saturn"",
                ""synastry_house"": 8
            },
            {
                ""name"": ""Uranus"",
                ""synastry_house"": 5
            },
            {
                ""name"": ""Neptune"",
                ""synastry_house"": 4
            },
            {
                ""name"": ""Pluto"",
                ""synastry_house"": 3
            },
            {
                ""name"": ""Node"",
                ""synastry_house"": 10
            },
            {
                ""name"": ""Chiron"",
                ""synastry_house"": 3
            },
            {
                ""name"": ""Part of Fortune"",
                ""synastry_house"": 11
            }
        ],
        ""aspects"": [
            {
                ""first"": ""Sun"",
                ""second"": ""Sun"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Moon"",
                ""type"": ""Semi Sextile"",
                ""orb"": 0.08
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Mars"",
                ""type"": ""Conjunction"",
                ""orb"": 8.88
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Venus"",
                ""type"": ""Conjunction"",
                ""orb"": 3.01
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Neptune"",
                ""type"": ""Trine"",
                ""orb"": 3.73
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Pluto"",
                ""type"": ""Opposition"",
                ""orb"": 1.41
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Node"",
                ""type"": ""Semi Square"",
                ""orb"": 0.36
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Chiron"",
                ""type"": ""Opposition"",
                ""orb"": 4.25
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Square"",
                ""orb"": 3.83
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Ascendant"",
                ""type"": ""Trine"",
                ""orb"": 3.75
            },
            {
                ""first"": ""Sun"",
                ""second"": ""Descendant"",
                ""type"": ""Sextile"",
                ""orb"": 3.75
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Sun"",
                ""type"": ""Semi Sextile"",
                ""orb"": 0.08
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Moon"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Mercury"",
                ""type"": ""Sextile"",
                ""orb"": 8.37
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Venus"",
                ""type"": ""Semi Sextile"",
                ""orb"": 2.94
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Neptune"",
                ""type"": ""Square"",
                ""orb"": 3.66
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Pluto"",
                ""type"": ""Quincunx"",
                ""orb"": 1.49
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Trine"",
                ""orb"": 3.75
            },
            {
                ""first"": ""Moon"",
                ""second"": ""Midheaven"",
                ""type"": ""Sextile"",
                ""orb"": 3.67
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Sun"",
                ""type"": ""Conjunction"",
                ""orb"": 8.88
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Mars"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Uranus"",
                ""type"": ""Trine"",
                ""orb"": 1.76
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Pluto"",
                ""type"": ""Opposition"",
                ""orb"": 7.47
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Chiron"",
                ""type"": ""Opposition"",
                ""orb"": 4.63
            },
            {
                ""first"": ""Mars"",
                ""second"": ""Descendant"",
                ""type"": ""Quintile"",
                ""orb"": 0.62
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Moon"",
                ""type"": ""Sextile"",
                ""orb"": 8.37
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Mercury"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Sextile"",
                ""orb"": 4.62
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Ascendant"",
                ""type"": ""Square"",
                ""orb"": 4.7
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Midheaven"",
                ""type"": ""Conjunction"",
                ""orb"": 4.7
            },
            {
                ""first"": ""Mercury"",
                ""second"": ""Descendant"",
                ""type"": ""Square"",
                ""orb"": 4.7
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Jupiter"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Saturn"",
                ""type"": ""Conjunction"",
                ""orb"": 0.29
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Uranus"",
                ""type"": ""Square"",
                ""orb"": 2.53
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Node"",
                ""type"": ""Sextile"",
                ""orb"": 2.19
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Midheaven"",
                ""type"": ""Semi Square"",
                ""orb"": 1.92
            },
            {
                ""first"": ""Jupiter"",
                ""second"": ""Descendant"",
                ""type"": ""Semi Square"",
                ""orb"": 1.92
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Sun"",
                ""type"": ""Conjunction"",
                ""orb"": 3.01
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Moon"",
                ""type"": ""Semi Sextile"",
                ""orb"": 2.94
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Venus"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Neptune"",
                ""type"": ""Trine"",
                ""orb"": 0.72
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Pluto"",
                ""type"": ""Opposition"",
                ""orb"": 4.42
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Chiron"",
                ""type"": ""Opposition"",
                ""orb"": 7.26
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Square"",
                ""orb"": 0.81
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Ascendant"",
                ""type"": ""Trine"",
                ""orb"": 0.73
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Midheaven"",
                ""type"": ""Semi Sextile"",
                ""orb"": 0.74
            },
            {
                ""first"": ""Venus"",
                ""second"": ""Descendant"",
                ""type"": ""Sextile"",
                ""orb"": 0.73
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Jupiter"",
                ""type"": ""Conjunction"",
                ""orb"": 0.29
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Saturn"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Uranus"",
                ""type"": ""Square"",
                ""orb"": 2.25
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Node"",
                ""type"": ""Sextile"",
                ""orb"": 2.48
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Midheaven"",
                ""type"": ""Semi Square"",
                ""orb"": 1.64
            },
            {
                ""first"": ""Saturn"",
                ""second"": ""Descendant"",
                ""type"": ""Semi Square"",
                ""orb"": 1.63
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Mars"",
                ""type"": ""Trine"",
                ""orb"": 1.76
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Jupiter"",
                ""type"": ""Square"",
                ""orb"": 2.53
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Saturn"",
                ""type"": ""Square"",
                ""orb"": 2.25
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Uranus"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Pluto"",
                ""type"": ""Sextile"",
                ""orb"": 9.23
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Chiron"",
                ""type"": ""Sextile"",
                ""orb"": 6.39
            },
            {
                ""first"": ""Uranus"",
                ""second"": ""Descendant"",
                ""type"": ""Semi Square"",
                ""orb"": 0.61
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Sun"",
                ""type"": ""Trine"",
                ""orb"": 3.73
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Moon"",
                ""type"": ""Square"",
                ""orb"": 3.66
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Venus"",
                ""type"": ""Trine"",
                ""orb"": 0.72
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Neptune"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Pluto"",
                ""type"": ""Sextile"",
                ""orb"": 5.14
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Chiron"",
                ""type"": ""Sextile"",
                ""orb"": 7.98
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Quincunx"",
                ""orb"": 0.09
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Ascendant"",
                ""type"": ""Trine"",
                ""orb"": 0.01
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Midheaven"",
                ""type"": ""Quincunx"",
                ""orb"": 0.01
            },
            {
                ""first"": ""Neptune"",
                ""second"": ""Descendant"",
                ""type"": ""Sextile"",
                ""orb"": 0.01
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Sun"",
                ""type"": ""Opposition"",
                ""orb"": 1.41
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Moon"",
                ""type"": ""Quincunx"",
                ""orb"": 1.49
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Mars"",
                ""type"": ""Opposition"",
                ""orb"": 7.47
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Venus"",
                ""type"": ""Opposition"",
                ""orb"": 4.42
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Uranus"",
                ""type"": ""Sextile"",
                ""orb"": 9.23
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Neptune"",
                ""type"": ""Sextile"",
                ""orb"": 5.14
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Pluto"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Chiron"",
                ""type"": ""Conjunction"",
                ""orb"": 2.84
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Square"",
                ""orb"": 5.23
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Ascendant"",
                ""type"": ""Sextile"",
                ""orb"": 5.16
            },
            {
                ""first"": ""Pluto"",
                ""second"": ""Descendant"",
                ""type"": ""Trine"",
                ""orb"": 5.16
            },
            {
                ""first"": ""Node"",
                ""second"": ""Sun"",
                ""type"": ""Semi Square"",
                ""orb"": 0.36
            },
            {
                ""first"": ""Node"",
                ""second"": ""Jupiter"",
                ""type"": ""Sextile"",
                ""orb"": 2.19
            },
            {
                ""first"": ""Node"",
                ""second"": ""Saturn"",
                ""type"": ""Sextile"",
                ""orb"": 2.48
            },
            {
                ""first"": ""Node"",
                ""second"": ""Node"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Node"",
                ""second"": ""Ascendant"",
                ""type"": ""Quintile"",
                ""orb"": 1.11
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Sun"",
                ""type"": ""Opposition"",
                ""orb"": 4.25
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Mars"",
                ""type"": ""Opposition"",
                ""orb"": 4.63
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Venus"",
                ""type"": ""Opposition"",
                ""orb"": 7.26
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Uranus"",
                ""type"": ""Sextile"",
                ""orb"": 6.39
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Neptune"",
                ""type"": ""Sextile"",
                ""orb"": 7.98
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Pluto"",
                ""type"": ""Conjunction"",
                ""orb"": 2.84
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Chiron"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Square"",
                ""orb"": 8.08
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Ascendant"",
                ""type"": ""Sextile"",
                ""orb"": 8
            },
            {
                ""first"": ""Chiron"",
                ""second"": ""Descendant"",
                ""type"": ""Trine"",
                ""orb"": 8
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Sun"",
                ""type"": ""Square"",
                ""orb"": 3.83
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Moon"",
                ""type"": ""Trine"",
                ""orb"": 3.75
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Mercury"",
                ""type"": ""Sextile"",
                ""orb"": 4.62
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Venus"",
                ""type"": ""Square"",
                ""orb"": 0.81
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Neptune"",
                ""type"": ""Quincunx"",
                ""orb"": 0.09
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Pluto"",
                ""type"": ""Square"",
                ""orb"": 5.23
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Chiron"",
                ""type"": ""Square"",
                ""orb"": 8.08
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Ascendant"",
                ""type"": ""Semi Sextile"",
                ""orb"": 0.08
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Midheaven"",
                ""type"": ""Sextile"",
                ""orb"": 0.08
            },
            {
                ""first"": ""Part of Fortune"",
                ""second"": ""Descendant"",
                ""type"": ""Quincunx"",
                ""orb"": 0.08
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Sun"",
                ""type"": ""Trine"",
                ""orb"": 3.75
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Mercury"",
                ""type"": ""Square"",
                ""orb"": 4.7
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Venus"",
                ""type"": ""Trine"",
                ""orb"": 0.73
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Neptune"",
                ""type"": ""Trine"",
                ""orb"": 0.01
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Pluto"",
                ""type"": ""Sextile"",
                ""orb"": 5.16
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Node"",
                ""type"": ""Quintile"",
                ""orb"": 1.11
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Chiron"",
                ""type"": ""Sextile"",
                ""orb"": 8
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Semi Sextile"",
                ""orb"": 0.08
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Ascendant"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Midheaven"",
                ""type"": ""Square"",
                ""orb"": 0
            },
            {
                ""first"": ""Ascendant"",
                ""second"": ""Descendant"",
                ""type"": ""Opposition"",
                ""orb"": 0
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Moon"",
                ""type"": ""Sextile"",
                ""orb"": 3.67
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Mercury"",
                ""type"": ""Conjunction"",
                ""orb"": 4.7
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Jupiter"",
                ""type"": ""Semi Square"",
                ""orb"": 1.92
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Venus"",
                ""type"": ""Semi Sextile"",
                ""orb"": 0.74
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Saturn"",
                ""type"": ""Semi Square"",
                ""orb"": 1.64
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Neptune"",
                ""type"": ""Quincunx"",
                ""orb"": 0.01
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Sextile"",
                ""orb"": 0.08
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Ascendant"",
                ""type"": ""Square"",
                ""orb"": 0
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Midheaven"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            },
            {
                ""first"": ""Midheaven"",
                ""second"": ""Descendant"",
                ""type"": ""Square"",
                ""orb"": 0
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Sun"",
                ""type"": ""Sextile"",
                ""orb"": 3.75
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Mars"",
                ""type"": ""Quintile"",
                ""orb"": 0.62
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Mercury"",
                ""type"": ""Square"",
                ""orb"": 4.7
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Jupiter"",
                ""type"": ""Semi Square"",
                ""orb"": 1.92
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Venus"",
                ""type"": ""Sextile"",
                ""orb"": 0.73
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Saturn"",
                ""type"": ""Semi Square"",
                ""orb"": 1.63
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Uranus"",
                ""type"": ""Semi Square"",
                ""orb"": 0.61
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Neptune"",
                ""type"": ""Sextile"",
                ""orb"": 0.01
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Pluto"",
                ""type"": ""Trine"",
                ""orb"": 5.16
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Chiron"",
                ""type"": ""Trine"",
                ""orb"": 8
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Part of Fortune"",
                ""type"": ""Quincunx"",
                ""orb"": 0.08
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Ascendant"",
                ""type"": ""Opposition"",
                ""orb"": 0
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Midheaven"",
                ""type"": ""Square"",
                ""orb"": 0
            },
            {
                ""first"": ""Descendant"",
                ""second"": ""Descendant"",
                ""type"": ""Conjunction"",
                ""orb"": 0
            }
        ]
    }
}"		
											
composite_horoscope			 API : https://json.astrologyapi.com/v1/composite_horoscope			PAYLOAD : {"p_hour":13,"p_min":0,"p_day":31,"p_month":5,"p_year":2000,"p_lat":23.24073,"p_lon":87.86733,"p_tzone":"+05:30","s_hour":13,"s_min":0,"s_day":31,"s_month":5,"s_year":2000,"s_lat":23.24073,"s_lon":87.86733,"s_tzone":"+05:30"}			"RESULTS : {
    ""first"": [
        {
            ""name"": ""Sun"",
            ""full_degree"": 70.1697,
            ""norm_degree"": 10.1697,
            ""speed"": 0.9589,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Moon"",
            ""full_degree"": 40.092,
            ""norm_degree"": 10.092,
            ""speed"": 14.4256,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Mars"",
            ""full_degree"": 79.0466,
            ""norm_degree"": 19.0466,
            ""speed"": 0.6821,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Mercury"",
            ""full_degree"": 91.7231,
            ""norm_degree"": 1.7231,
            ""speed"": 1.4718,
            ""is_retro"": ""false"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 9
        },
        {
            ""name"": ""Jupiter"",
            ""full_degree"": 53.3416,
            ""norm_degree"": 23.3416,
            ""speed"": 0.2322,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Venus"",
            ""full_degree"": 67.1558,
            ""norm_degree"": 7.1558,
            ""speed"": 1.2289,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Saturn"",
            ""full_degree"": 53.056,
            ""norm_degree"": 23.056,
            ""speed"": 0.1252,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Uranus"",
            ""full_degree"": 320.8098,
            ""norm_degree"": 20.8098,
            ""speed"": -0.0049,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 5
        },
        {
            ""name"": ""Neptune"",
            ""full_degree"": 306.435,
            ""norm_degree"": 6.435,
            ""speed"": -0.0118,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 4
        },
        {
            ""name"": ""Pluto"",
            ""full_degree"": 251.579,
            ""norm_degree"": 11.579,
            ""speed"": -0.0271,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 3
        },
        {
            ""name"": ""Node"",
            ""full_degree"": 115.5338,
            ""norm_degree"": 25.5338,
            ""speed"": -0.1159,
            ""is_retro"": ""true"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 10
        },
        {
            ""name"": ""Chiron"",
            ""full_degree"": 254.42,
            ""norm_degree"": 14.42,
            ""speed"": -0.0705,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 3
        },
        {
            ""name"": ""Part of Fortune"",
            ""full_degree"": 156.3446,
            ""norm_degree"": 6.3446,
            ""speed"": 0,
            ""is_retro"": ""false"",
            ""sign_id"": 6,
            ""sign"": ""Virgo"",
            ""house"": 11
        }
    ],
    ""second"": [
        {
            ""name"": ""Sun"",
            ""full_degree"": 70.1697,
            ""norm_degree"": 10.1697,
            ""speed"": 0.9589,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Moon"",
            ""full_degree"": 40.092,
            ""norm_degree"": 10.092,
            ""speed"": 14.4256,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Mars"",
            ""full_degree"": 79.0466,
            ""norm_degree"": 19.0466,
            ""speed"": 0.6821,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Mercury"",
            ""full_degree"": 91.7231,
            ""norm_degree"": 1.7231,
            ""speed"": 1.4718,
            ""is_retro"": ""false"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 9
        },
        {
            ""name"": ""Jupiter"",
            ""full_degree"": 53.3416,
            ""norm_degree"": 23.3416,
            ""speed"": 0.2322,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Venus"",
            ""full_degree"": 67.1558,
            ""norm_degree"": 7.1558,
            ""speed"": 1.2289,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Saturn"",
            ""full_degree"": 53.056,
            ""norm_degree"": 23.056,
            ""speed"": 0.1252,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Uranus"",
            ""full_degree"": 320.8098,
            ""norm_degree"": 20.8098,
            ""speed"": -0.0049,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 5
        },
        {
            ""name"": ""Neptune"",
            ""full_degree"": 306.435,
            ""norm_degree"": 6.435,
            ""speed"": -0.0118,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 4
        },
        {
            ""name"": ""Pluto"",
            ""full_degree"": 251.579,
            ""norm_degree"": 11.579,
            ""speed"": -0.0271,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 3
        },
        {
            ""name"": ""Node"",
            ""full_degree"": 115.5338,
            ""norm_degree"": 25.5338,
            ""speed"": -0.1159,
            ""is_retro"": ""true"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 10
        },
        {
            ""name"": ""Chiron"",
            ""full_degree"": 254.42,
            ""norm_degree"": 14.42,
            ""speed"": -0.0705,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 3
        },
        {
            ""name"": ""Part of Fortune"",
            ""full_degree"": 156.3446,
            ""norm_degree"": 6.3446,
            ""speed"": 0,
            ""is_retro"": ""false"",
            ""sign_id"": 6,
            ""sign"": ""Virgo"",
            ""house"": 11
        }
    ],
    ""composite"": {
        ""planets"": [
            {
                ""name"": ""Sun"",
                ""full_degree"": 70.1697,
                ""norm_degree"": 10.1697,
                ""sign_id"": 3,
                ""sign"": ""Gemini"",
                ""house"": 9
            },
            {
                ""name"": ""Moon"",
                ""full_degree"": 40.092,
                ""norm_degree"": 10.092,
                ""sign_id"": 2,
                ""sign"": ""Taurus"",
                ""house"": 8
            },
            {
                ""name"": ""Mars"",
                ""full_degree"": 79.0466,
                ""norm_degree"": 19.0466,
                ""sign_id"": 3,
                ""sign"": ""Gemini"",
                ""house"": 9
            },
            {
                ""name"": ""Mercury"",
                ""full_degree"": 91.7231,
                ""norm_degree"": 1.7231,
                ""sign_id"": 4,
                ""sign"": ""Cancer"",
                ""house"": 10
            },
            {
                ""name"": ""Jupiter"",
                ""full_degree"": 53.3416,
                ""norm_degree"": 23.3416,
                ""sign_id"": 2,
                ""sign"": ""Taurus"",
                ""house"": 8
            },
            {
                ""name"": ""Venus"",
                ""full_degree"": 67.1558,
                ""norm_degree"": 7.1558,
                ""sign_id"": 3,
                ""sign"": ""Gemini"",
                ""house"": 9
            },
            {
                ""name"": ""Saturn"",
                ""full_degree"": 53.056,
                ""norm_degree"": 23.056,
                ""sign_id"": 2,
                ""sign"": ""Taurus"",
                ""house"": 8
            },
            {
                ""name"": ""Uranus"",
                ""full_degree"": 320.8098,
                ""norm_degree"": 20.8098,
                ""sign_id"": 11,
                ""sign"": ""Aquarius"",
                ""house"": 5
            },
            {
                ""name"": ""Neptune"",
                ""full_degree"": 306.435,
                ""norm_degree"": 6.435,
                ""sign_id"": 11,
                ""sign"": ""Aquarius"",
                ""house"": 5
            },
            {
                ""name"": ""Pluto"",
                ""full_degree"": 251.579,
                ""norm_degree"": 11.579,
                ""sign_id"": 9,
                ""sign"": ""Sagittarius"",
                ""house"": 3
            },
            {
                ""name"": ""Node"",
                ""full_degree"": 115.5338,
                ""norm_degree"": 25.5338,
                ""sign_id"": 4,
                ""sign"": ""Cancer"",
                ""house"": 10
            },
            {
                ""name"": ""Chiron"",
                ""full_degree"": 254.42,
                ""norm_degree"": 14.42,
                ""sign_id"": 9,
                ""sign"": ""Sagittarius"",
                ""house"": 3
            },
            {
                ""name"": ""Part of Fortune"",
                ""full_degree"": 156.3446,
                ""norm_degree"": 6.3446,
                ""sign_id"": 6,
                ""sign"": ""Virgo"",
                ""house"": 12
            }
        ],
        ""houses"": [
            {
                ""house"": 1,
                ""sign"": ""Libra"",
                ""degree"": 186.42234
            },
            {
                ""house"": 2,
                ""sign"": ""Scorpio"",
                ""degree"": 215.39624
            },
            {
                ""house"": 3,
                ""sign"": ""Sagittarius"",
                ""degree"": 245.69053
            },
            {
                ""house"": 4,
                ""sign"": ""Capricorn"",
                ""degree"": 276.42033
            },
            {
                ""house"": 5,
                ""sign"": ""Aquarius"",
                ""degree"": 307.33237
            },
            {
                ""house"": 6,
                ""sign"": ""Pisces"",
                ""degree"": 337.81387
            },
            {
                ""house"": 7,
                ""sign"": ""Aries"",
                ""degree"": 6.42234
            },
            {
                ""house"": 8,
                ""sign"": ""Taurus"",
                ""degree"": 35.39624
            },
            {
                ""house"": 9,
                ""sign"": ""Gemini"",
                ""degree"": 65.69053
            },
            {
                ""house"": 10,
                ""sign"": ""Cancer"",
                ""degree"": 96.42033
            },
            {
                ""house"": 11,
                ""sign"": ""Leo"",
                ""degree"": 127.33237
            },
            {
                ""house"": 12,
                ""sign"": ""Virgo"",
                ""degree"": 157.81387
            }
        ],
        ""ascendant"": 186.42234,
        ""midheaven"": 96.42033,
        ""aspects"": [
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Mars"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 2,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 8.88,
                ""diff"": 8.88
            },
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Venus"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 5,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 3.01,
                ""diff"": 3.01
            },
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Neptune"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 8,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 3.73,
                ""diff"": 123.73
            },
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Pluto"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 9,
                ""aspect_type"": 2,
                ""type"": ""Opposition"",
                ""orb"": 1.41,
                ""diff"": 178.59
            },
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Chiron"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 11,
                ""aspect_type"": 2,
                ""type"": ""Opposition"",
                ""orb"": 4.25,
                ""diff"": 175.75
            },
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Part of Fortune"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 12,
                ""aspect_type"": 4,
                ""type"": ""Square"",
                ""orb"": 3.83,
                ""diff"": 86.17
            },
            {
                ""aspecting_planet"": ""Sun"",
                ""aspected_planet"": ""Ascendant"",
                ""aspecting_planet_id"": 0,
                ""aspected_planet_id"": 13,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 3.75,
                ""diff"": 116.25
            },
            {
                ""aspecting_planet"": ""Moon"",
                ""aspected_planet"": ""Neptune"",
                ""aspecting_planet_id"": 1,
                ""aspected_planet_id"": 8,
                ""aspect_type"": 4,
                ""type"": ""Square"",
                ""orb"": 3.66,
                ""diff"": 93.66
            },
            {
                ""aspecting_planet"": ""Moon"",
                ""aspected_planet"": ""Midheaven"",
                ""aspecting_planet_id"": 1,
                ""aspected_planet_id"": 14,
                ""aspect_type"": 5,
                ""type"": ""Sextile"",
                ""orb"": 3.67,
                ""diff"": 56.33
            },
            {
                ""aspecting_planet"": ""Mars"",
                ""aspected_planet"": ""Uranus"",
                ""aspecting_planet_id"": 2,
                ""aspected_planet_id"": 7,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 1.76,
                ""diff"": 118.24
            },
            {
                ""aspecting_planet"": ""Mars"",
                ""aspected_planet"": ""Pluto"",
                ""aspecting_planet_id"": 2,
                ""aspected_planet_id"": 9,
                ""aspect_type"": 2,
                ""type"": ""Opposition"",
                ""orb"": 7.47,
                ""diff"": 172.53
            },
            {
                ""aspecting_planet"": ""Mars"",
                ""aspected_planet"": ""Chiron"",
                ""aspecting_planet_id"": 2,
                ""aspected_planet_id"": 11,
                ""aspect_type"": 2,
                ""type"": ""Opposition"",
                ""orb"": 4.63,
                ""diff"": 175.37
            },
            {
                ""aspecting_planet"": ""Mercury"",
                ""aspected_planet"": ""Part of Fortune"",
                ""aspecting_planet_id"": 3,
                ""aspected_planet_id"": 12,
                ""aspect_type"": 5,
                ""type"": ""Sextile"",
                ""orb"": 4.62,
                ""diff"": 64.62
            },
            {
                ""aspecting_planet"": ""Mercury"",
                ""aspected_planet"": ""Ascendant"",
                ""aspecting_planet_id"": 3,
                ""aspected_planet_id"": 13,
                ""aspect_type"": 4,
                ""type"": ""Square"",
                ""orb"": 4.7,
                ""diff"": 94.7
            },
            {
                ""aspecting_planet"": ""Mercury"",
                ""aspected_planet"": ""Midheaven"",
                ""aspecting_planet_id"": 3,
                ""aspected_planet_id"": 14,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 4.7,
                ""diff"": 4.7
            },
            {
                ""aspecting_planet"": ""Jupiter"",
                ""aspected_planet"": ""Saturn"",
                ""aspecting_planet_id"": 4,
                ""aspected_planet_id"": 6,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 0.29,
                ""diff"": 0.29
            },
            {
                ""aspecting_planet"": ""Jupiter"",
                ""aspected_planet"": ""Uranus"",
                ""aspecting_planet_id"": 4,
                ""aspected_planet_id"": 7,
                ""aspect_type"": 4,
                ""type"": ""Square"",
                ""orb"": 2.53,
                ""diff"": 92.53
            },
            {
                ""aspecting_planet"": ""Jupiter"",
                ""aspected_planet"": ""Node"",
                ""aspecting_planet_id"": 4,
                ""aspected_planet_id"": 10,
                ""aspect_type"": 5,
                ""type"": ""Sextile"",
                ""orb"": 2.19,
                ""diff"": 62.19
            },
            {
                ""aspecting_planet"": ""Venus"",
                ""aspected_planet"": ""Neptune"",
                ""aspecting_planet_id"": 5,
                ""aspected_planet_id"": 8,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 0.72,
                ""diff"": 120.72
            },
            {
                ""aspecting_planet"": ""Venus"",
                ""aspected_planet"": ""Pluto"",
                ""aspecting_planet_id"": 5,
                ""aspected_planet_id"": 9,
                ""aspect_type"": 2,
                ""type"": ""Opposition"",
                ""orb"": 4.42,
                ""diff"": 175.58
            },
            {
                ""aspecting_planet"": ""Venus"",
                ""aspected_planet"": ""Chiron"",
                ""aspecting_planet_id"": 5,
                ""aspected_planet_id"": 11,
                ""aspect_type"": 2,
                ""type"": ""Opposition"",
                ""orb"": 7.26,
                ""diff"": 172.74
            },
            {
                ""aspecting_planet"": ""Venus"",
                ""aspected_planet"": ""Part of Fortune"",
                ""aspecting_planet_id"": 5,
                ""aspected_planet_id"": 12,
                ""aspect_type"": 4,
                ""type"": ""Square"",
                ""orb"": 0.81,
                ""diff"": 89.19
            },
            {
                ""aspecting_planet"": ""Venus"",
                ""aspected_planet"": ""Ascendant"",
                ""aspecting_planet_id"": 5,
                ""aspected_planet_id"": 13,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 0.73,
                ""diff"": 119.27
            },
            {
                ""aspecting_planet"": ""Saturn"",
                ""aspected_planet"": ""Uranus"",
                ""aspecting_planet_id"": 6,
                ""aspected_planet_id"": 7,
                ""aspect_type"": 4,
                ""type"": ""Square"",
                ""orb"": 2.25,
                ""diff"": 92.25
            },
            {
                ""aspecting_planet"": ""Saturn"",
                ""aspected_planet"": ""Node"",
                ""aspecting_planet_id"": 6,
                ""aspected_planet_id"": 10,
                ""aspect_type"": 5,
                ""type"": ""Sextile"",
                ""orb"": 2.48,
                ""diff"": 62.48
            },
            {
                ""aspecting_planet"": ""Neptune"",
                ""aspected_planet"": ""Pluto"",
                ""aspecting_planet_id"": 8,
                ""aspected_planet_id"": 9,
                ""aspect_type"": 5,
                ""type"": ""Sextile"",
                ""orb"": 5.14,
                ""diff"": 54.86
            },
            {
                ""aspecting_planet"": ""Neptune"",
                ""aspected_planet"": ""Ascendant"",
                ""aspecting_planet_id"": 8,
                ""aspected_planet_id"": 13,
                ""aspect_type"": 3,
                ""type"": ""Trine"",
                ""orb"": 0.01,
                ""diff"": 120.01
            },
            {
                ""aspecting_planet"": ""Pluto"",
                ""aspected_planet"": ""Chiron"",
                ""aspecting_planet_id"": 9,
                ""aspected_planet_id"": 11,
                ""aspect_type"": 1,
                ""type"": ""Conjunction"",
                ""orb"": 2.84,
                ""diff"": 2.84
            },
            {
                ""aspecting_planet"": ""Pluto"",
                ""aspected_planet"": ""Part of Fortune"",
                ""aspecting_planet_id"": 9,
                ""aspected_planet_id"": 12,
                ""aspect_type"": 4,
                ""type"": ""Square"",
                ""orb"": 5.23,
                ""diff"": 95.23
            },
            {
                ""aspecting_planet"": ""Pluto"",
                ""aspected_planet"": ""Ascendant"",
                ""aspecting_planet_id"": 9,
                ""aspected_planet_id"": 13,
                ""aspect_type"": 5,
                ""type"": ""Sextile"",
                ""orb"": 5.16,
                ""diff"": 65.16
            },
            {
                ""aspecting_planet"": ""Part of Fortune"",
                ""aspected_planet"": ""Midheaven"",
                ""aspecting_planet_id"": 12,
                ""aspected_planet_id"": 14,
                ""aspect_type"": 5,
                ""type"": ""Sextile"",
                ""orb"": 0.08,
                ""diff"": 59.92
            },
            {
                ""aspecting_planet"": ""Ascendant"",
                ""aspected_planet"": ""Midheaven"",
                ""aspecting_planet_id"": 13,
                ""aspected_planet_id"": 14,
                ""aspect_type"": 4,
                ""type"": ""Square"",
                ""orb"": 0,
                ""diff"": 90
            }
        ]
    }
}"		
											
western_horoscope			 API : https://json.astrologyapi.com/v1/western_horoscope			PAYLOAD : {"hour":13,"min":0,"day":31,"month":5,"year":2000,"lat":23.24073,"lon":87.86733,"tzone":"+05:30"}			"RESULTS : {
    ""planets"": [
        {
            ""name"": ""Sun"",
            ""full_degree"": 70.1697,
            ""norm_degree"": 10.1697,
            ""speed"": 0.9589,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Moon"",
            ""full_degree"": 40.092,
            ""norm_degree"": 10.092,
            ""speed"": 14.4256,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Mars"",
            ""full_degree"": 79.0466,
            ""norm_degree"": 19.0466,
            ""speed"": 0.6821,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Mercury"",
            ""full_degree"": 91.7231,
            ""norm_degree"": 1.7231,
            ""speed"": 1.4718,
            ""is_retro"": ""false"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 9
        },
        {
            ""name"": ""Jupiter"",
            ""full_degree"": 53.3416,
            ""norm_degree"": 23.3416,
            ""speed"": 0.2322,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Venus"",
            ""full_degree"": 67.1558,
            ""norm_degree"": 7.1558,
            ""speed"": 1.2289,
            ""is_retro"": ""false"",
            ""sign_id"": 3,
            ""sign"": ""Gemini"",
            ""house"": 9
        },
        {
            ""name"": ""Saturn"",
            ""full_degree"": 53.056,
            ""norm_degree"": 23.056,
            ""speed"": 0.1252,
            ""is_retro"": ""false"",
            ""sign_id"": 2,
            ""sign"": ""Taurus"",
            ""house"": 8
        },
        {
            ""name"": ""Uranus"",
            ""full_degree"": 320.8098,
            ""norm_degree"": 20.8098,
            ""speed"": -0.0049,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 5
        },
        {
            ""name"": ""Neptune"",
            ""full_degree"": 306.435,
            ""norm_degree"": 6.435,
            ""speed"": -0.0118,
            ""is_retro"": ""true"",
            ""sign_id"": 11,
            ""sign"": ""Aquarius"",
            ""house"": 4
        },
        {
            ""name"": ""Pluto"",
            ""full_degree"": 251.579,
            ""norm_degree"": 11.579,
            ""speed"": -0.0271,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 3
        },
        {
            ""name"": ""Node"",
            ""full_degree"": 115.5338,
            ""norm_degree"": 25.5338,
            ""speed"": -0.1159,
            ""is_retro"": ""true"",
            ""sign_id"": 4,
            ""sign"": ""Cancer"",
            ""house"": 10
        },
        {
            ""name"": ""Chiron"",
            ""full_degree"": 254.42,
            ""norm_degree"": 14.42,
            ""speed"": -0.0705,
            ""is_retro"": ""true"",
            ""sign_id"": 9,
            ""sign"": ""Sagittarius"",
            ""house"": 3
        },
        {
            ""name"": ""Part of Fortune"",
            ""full_degree"": 156.3446,
            ""norm_degree"": 6.3446,
            ""speed"": 0,
            ""is_retro"": ""false"",
            ""sign_id"": 6,
            ""sign"": ""Virgo"",
            ""house"": 11
        }
    ],
    ""houses"": [
        {
            ""house"": 1,
            ""sign"": ""Libra"",
            ""sign_id"": 7,
            ""degree"": 186.42234
        },
        {
            ""house"": 2,
            ""sign"": ""Scorpio"",
            ""sign_id"": 8,
            ""degree"": 215.39624
        },
        {
            ""house"": 3,
            ""sign"": ""Sagittarius"",
            ""sign_id"": 9,
            ""degree"": 245.69053
        },
        {
            ""house"": 4,
            ""sign"": ""Capricorn"",
            ""sign_id"": 10,
            ""degree"": 276.42033
        },
        {
            ""house"": 5,
            ""sign"": ""Aquarius"",
            ""sign_id"": 11,
            ""degree"": 307.33237
        },
        {
            ""house"": 6,
            ""sign"": ""Pisces"",
            ""sign_id"": 12,
            ""degree"": 337.81387
        },
        {
            ""house"": 7,
            ""sign"": ""Aries"",
            ""sign_id"": 1,
            ""degree"": 6.42234
        },
        {
            ""house"": 8,
            ""sign"": ""Taurus"",
            ""sign_id"": 2,
            ""degree"": 35.39624
        },
        {
            ""house"": 9,
            ""sign"": ""Gemini"",
            ""sign_id"": 3,
            ""degree"": 65.69053
        },
        {
            ""house"": 10,
            ""sign"": ""Cancer"",
            ""sign_id"": 4,
            ""degree"": 96.42033
        },
        {
            ""house"": 11,
            ""sign"": ""Leo"",
            ""sign_id"": 5,
            ""degree"": 127.33237
        },
        {
            ""house"": 12,
            ""sign"": ""Virgo"",
            ""sign_id"": 6,
            ""degree"": 157.81387
        }
    ],
    ""ascendant"": 186.42234480081225,
    ""midheaven"": 96.4203334296655,
    ""vertex"": 277.2781580258426,
    ""lilith"": {
        ""name"": ""Lilith"",
        ""full_degree"": 280.2163,
        ""norm_degree"": 10.2163,
        ""speed"": 0.1109,
        ""is_retro"": ""false"",
        ""sign_id"": 10,
        ""sign"": ""Capricorn"",
        ""house"": 4
    },
    ""aspects"": [
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Mars"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 2,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 8.88,
            ""diff"": 8.88
        },
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Venus"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 5,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 3.01,
            ""diff"": 3.01
        },
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Neptune"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 8,
            ""aspect_type"": 3,
            ""type"": ""Trine"",
            ""orb"": 3.73,
            ""diff"": 123.73
        },
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Pluto"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 9,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 1.41,
            ""diff"": 178.59
        },
        {
            ""aspecting_planet"": ""Sun"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 0,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 3,
            ""type"": ""Trine"",
            ""orb"": 3.75,
            ""diff"": 116.25
        },
        {
            ""aspecting_planet"": ""Moon"",
            ""aspected_planet"": ""Neptune"",
            ""aspecting_planet_id"": 1,
            ""aspected_planet_id"": 8,
            ""aspect_type"": 4,
            ""type"": ""Square"",
            ""orb"": 3.66,
            ""diff"": 93.66
        },
        {
            ""aspecting_planet"": ""Moon"",
            ""aspected_planet"": ""Midheaven"",
            ""aspecting_planet_id"": 1,
            ""aspected_planet_id"": 11,
            ""aspect_type"": 5,
            ""type"": ""Sextile"",
            ""orb"": 3.67,
            ""diff"": 56.33
        },
        {
            ""aspecting_planet"": ""Mars"",
            ""aspected_planet"": ""Uranus"",
            ""aspecting_planet_id"": 2,
            ""aspected_planet_id"": 7,
            ""aspect_type"": 3,
            ""type"": ""Trine"",
            ""orb"": 1.76,
            ""diff"": 118.24
        },
        {
            ""aspecting_planet"": ""Mars"",
            ""aspected_planet"": ""Pluto"",
            ""aspecting_planet_id"": 2,
            ""aspected_planet_id"": 9,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 7.47,
            ""diff"": 172.53
        },
        {
            ""aspecting_planet"": ""Mercury"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 3,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 4,
            ""type"": ""Square"",
            ""orb"": 4.7,
            ""diff"": 94.7
        },
        {
            ""aspecting_planet"": ""Mercury"",
            ""aspected_planet"": ""Midheaven"",
            ""aspecting_planet_id"": 3,
            ""aspected_planet_id"": 11,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 4.7,
            ""diff"": 4.7
        },
        {
            ""aspecting_planet"": ""Jupiter"",
            ""aspected_planet"": ""Saturn"",
            ""aspecting_planet_id"": 4,
            ""aspected_planet_id"": 6,
            ""aspect_type"": 1,
            ""type"": ""Conjunction"",
            ""orb"": 0.29,
            ""diff"": 0.29
        },
        {
            ""aspecting_planet"": ""Jupiter"",
            ""aspected_planet"": ""Uranus"",
            ""aspecting_planet_id"": 4,
            ""aspected_planet_id"": 7,
            ""aspect_type"": 4,
            ""type"": ""Square"",
            ""orb"": 2.53,
            ""diff"": 92.53
        },
        {
            ""aspecting_planet"": ""Venus"",
            ""aspected_planet"": ""Neptune"",
            ""aspecting_planet_id"": 5,
            ""aspected_planet_id"": 8,
            ""aspect_type"": 3,
            ""type"": ""Trine"",
            ""orb"": 0.72,
            ""diff"": 120.72
        },
        {
            ""aspecting_planet"": ""Venus"",
            ""aspected_planet"": ""Pluto"",
            ""aspecting_planet_id"": 5,
            ""aspected_planet_id"": 9,
            ""aspect_type"": 2,
            ""type"": ""Opposition"",
            ""orb"": 4.42,
            ""diff"": 175.58
        },
        {
            ""aspecting_planet"": ""Venus"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 5,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 3,
            ""type"": ""Trine"",
            ""orb"": 0.73,
            ""diff"": 119.27
        },
        {
            ""aspecting_planet"": ""Saturn"",
            ""aspected_planet"": ""Uranus"",
            ""aspecting_planet_id"": 6,
            ""aspected_planet_id"": 7,
            ""aspect_type"": 4,
            ""type"": ""Square"",
            ""orb"": 2.25,
            ""diff"": 92.25
        },
        {
            ""aspecting_planet"": ""Neptune"",
            ""aspected_planet"": ""Pluto"",
            ""aspecting_planet_id"": 8,
            ""aspected_planet_id"": 9,
            ""aspect_type"": 5,
            ""type"": ""Sextile"",
            ""orb"": 5.14,
            ""diff"": 54.86
        },
        {
            ""aspecting_planet"": ""Neptune"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 8,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 3,
            ""type"": ""Trine"",
            ""orb"": 0.01,
            ""diff"": 120.01
        },
        {
            ""aspecting_planet"": ""Pluto"",
            ""aspected_planet"": ""Ascendant"",
            ""aspecting_planet_id"": 9,
            ""aspected_planet_id"": 10,
            ""aspect_type"": 5,
            ""type"": ""Sextile"",
            ""orb"": 5.16,
            ""diff"": 65.16
        },
        {
            ""aspecting_planet"": ""Ascendant"",
            ""aspected_planet"": ""Midheaven"",
            ""aspecting_planet_id"": 10,
            ""aspected_planet_id"": 11,
            ""aspect_type"": 4,
            ""type"": ""Square"",
            ""orb"": 0,
            ""diff"": 90
        }
    ]
}"		
											
monthly			" API : https://json.astrologyapi.com/v1/tropical_transits/monthly
"			PAYLOAD : {"hour":13,"min":0,"day":31,"month":5,"year":2000,"lat":23.24073,"lon":87.86733,"tzone":"+05:30"}			"RESULTS : {
    ""month_start_date"": ""1-7-2025"",
    ""month_end_date"": ""31-7-2025"",
    ""ascendant"": ""Libra"",
    ""transit_relation"": [
        {
            ""transit_planet"": ""Mercury"",
            ""natal_planet"": ""Ascendant"",
            ""type"": ""Sextile"",
            ""orb"": 0.08,
            ""date"": ""2-7-2025""
        },
        {
            ""transit_planet"": ""Mars"",
            ""natal_planet"": ""Moon"",
            ""type"": ""Trine"",
            ""orb"": 0.17,
            ""date"": ""5-7-2025""
        },
        {
            ""transit_planet"": ""Mars"",
            ""natal_planet"": ""Sun"",
            ""type"": ""Square"",
            ""orb"": 0.1,
            ""date"": ""5-7-2025""
        },
        {
            ""transit_planet"": ""Jupiter"",
            ""natal_planet"": ""Ascendant"",
            ""type"": ""Square"",
            ""orb"": 0.05,
            ""date"": ""8-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Ascendant"",
            ""type"": ""Trine"",
            ""orb"": 0.16,
            ""date"": ""10-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Venus"",
            ""type"": ""Conjunction"",
            ""orb"": 0.22,
            ""date"": ""11-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Sun"",
            ""type"": ""Conjunction"",
            ""orb"": 0.55,
            ""date"": ""13-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Mars"",
            ""type"": ""Conjunction"",
            ""orb"": 0.38,
            ""date"": ""21-7-2025""
        },
        {
            ""transit_planet"": ""Jupiter"",
            ""natal_planet"": ""Moon"",
            ""type"": ""Sextile"",
            ""orb"": 0.05,
            ""date"": ""24-7-2025""
        },
        {
            ""transit_planet"": ""Saturn"",
            ""natal_planet"": ""Mercury"",
            ""type"": ""Square"",
            ""orb"": 0.01,
            ""date"": ""29-7-2025""
        },
        {
            ""transit_planet"": ""Mercury"",
            ""natal_planet"": ""Moon"",
            ""type"": ""Square"",
            ""orb"": 0.18,
            ""date"": ""30-7-2025""
        },
        {
            ""transit_planet"": ""Mercury"",
            ""natal_planet"": ""Sun"",
            ""type"": ""Sextile"",
            ""orb"": 0.1,
            ""date"": ""30-7-2025""
        },
        {
            ""transit_planet"": ""Neptune"",
            ""natal_planet"": ""Mercury"",
            ""type"": ""Square"",
            ""orb"": 0.27,
            ""date"": ""31-7-2025""
        }
    ],
    ""retrogrades"": [],
    ""moon_phase"": []
}"		
											
monthly			" API : https://json.astrologyapi.com/v1/tropical_transits/monthly
"			PAYLOAD : {"hour":13,"min":0,"day":31,"month":5,"year":2000,"lat":23.24073,"lon":87.86733,"tzone":"+05:30"}			"RESULTS : {
    ""month_start_date"": ""1-7-2025"",
    ""month_end_date"": ""31-7-2025"",
    ""ascendant"": ""Libra"",
    ""transit_relation"": [
        {
            ""transit_planet"": ""Mercury"",
            ""natal_planet"": ""Ascendant"",
            ""type"": ""Sextile"",
            ""orb"": 0.08,
            ""date"": ""2-7-2025""
        },
        {
            ""transit_planet"": ""Mars"",
            ""natal_planet"": ""Moon"",
            ""type"": ""Trine"",
            ""orb"": 0.17,
            ""date"": ""5-7-2025""
        },
        {
            ""transit_planet"": ""Mars"",
            ""natal_planet"": ""Sun"",
            ""type"": ""Square"",
            ""orb"": 0.1,
            ""date"": ""5-7-2025""
        },
        {
            ""transit_planet"": ""Jupiter"",
            ""natal_planet"": ""Ascendant"",
            ""type"": ""Square"",
            ""orb"": 0.05,
            ""date"": ""8-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Ascendant"",
            ""type"": ""Trine"",
            ""orb"": 0.16,
            ""date"": ""10-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Venus"",
            ""type"": ""Conjunction"",
            ""orb"": 0.22,
            ""date"": ""11-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Sun"",
            ""type"": ""Conjunction"",
            ""orb"": 0.55,
            ""date"": ""13-7-2025""
        },
        {
            ""transit_planet"": ""Venus"",
            ""natal_planet"": ""Mars"",
            ""type"": ""Conjunction"",
            ""orb"": 0.38,
            ""date"": ""21-7-2025""
        },
        {
            ""transit_planet"": ""Jupiter"",
            ""natal_planet"": ""Moon"",
            ""type"": ""Sextile"",
            ""orb"": 0.05,
            ""date"": ""24-7-2025""
        },
        {
            ""transit_planet"": ""Saturn"",
            ""natal_planet"": ""Mercury"",
            ""type"": ""Square"",
            ""orb"": 0.01,
            ""date"": ""29-7-2025""
        },
        {
            ""transit_planet"": ""Mercury"",
            ""natal_planet"": ""Moon"",
            ""type"": ""Square"",
            ""orb"": 0.18,
            ""date"": ""30-7-2025""
        },
        {
            ""transit_planet"": ""Mercury"",
            ""natal_planet"": ""Sun"",
            ""type"": ""Sextile"",
            ""orb"": 0.1,
            ""date"": ""30-7-2025""
        },
        {
            ""transit_planet"": ""Neptune"",
            ""natal_planet"": ""Mercury"",
            ""type"": ""Square"",
            ""orb"": 0.27,
            ""date"": ""31-7-2025""
        }
    ],
    ""retrogrades"": [],
    ""moon_phase"": []
}"		
											
Synastry Horoscope			" API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/
"			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation of inportant aspects of assessing the potential for  synastry chart analysis for friendships, aspects between personal planets like the Sun, Moon, and Mercury are key indicators of compatibility, illuminating how well the individuals understand, support, and communicate with each other. For example, harmonious Sun aspects (trine or sextile) suggest an effortless alignment in core values and life approach, while challenging aspects (square or opposition) may indicate differences that require compromise. The Moon’s aspects reveal emotional resonance, indicating whether friends find comfort and understanding in each other’s presence. Positive Moon aspects, such as a Moon trine, foster emotional safety and nurture, while challenging aspects can highlight areas of emotional growth or sensitivity. Mercury aspects reveal intellectual compatibility and communication styles—conjunctions and trines suggest clear, engaging conversations, while squares or oppositions might indicate occasional misunderstandings or different perspectives. House overlays show how each person impacts the other’s life areas; for instance, if one person’s planets fall in the other’s 11th house (the house of friendship and community), it indicates a strong influence on social life and shared activities, emphasizing companionship. Connections between the Ascendant and Midheaven highlight how each friend’s self-expression (Ascendant) and goals or public life (Midheaven) resonate or diverge, revealing alignment in personal identity and ambition. Lastly, the Nodes (North and South) reflect karmic ties and life lessons; connections here often suggest a meaningful relationship focused on personal growth and mutual support, even suggesting past-life or fated links. These aspects, taken together, create a nuanced map of how the friendship may evolve, where harmony exists, and which areas might require understanding and adaptability. ","user_content":"I was born on May 31, 2000,  13:0 in  Bardhaman, West Bengal, India  'lat:23.24073,lon:87.86733,tzone:+05:30'. my friendship relation partner was born on May 31, 2000 13:0 at Bardhaman, West Bengal, India   'lat:23.24073,lon:87.86733,tzone:+05:30' I have added birth chart details of mine and my friendship  relationship partner both now calculate our synastry chart of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response "},"toolname":"other","json":{"first":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"second":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"synastry":{"house_1":[{"name":"Sun","synastry_house":9},{"name":"Moon","synastry_house":8},{"name":"Mars","synastry_house":9},{"name":"Mercury","synastry_house":9},{"name":"Jupiter","synastry_house":8},{"name":"Venus","synastry_house":9},{"name":"Saturn","synastry_house":8},{"name":"Uranus","synastry_house":5},{"name":"Neptune","synastry_house":4},{"name":"Pluto","synastry_house":3},{"name":"Node","synastry_house":10},{"name":"Chiron","synastry_house":3},{"name":"Part of Fortune","synastry_house":11}],"house_2":[{"name":"Sun","synastry_house":9},{"name":"Moon","synastry_house":8},{"name":"Mars","synastry_house":9},{"name":"Mercury","synastry_house":9},{"name":"Jupiter","synastry_house":8},{"name":"Venus","synastry_house":9},{"name":"Saturn","synastry_house":8},{"name":"Uranus","synastry_house":5},{"name":"Neptune","synastry_house":4},{"name":"Pluto","synastry_house":3},{"name":"Node","synastry_house":10},{"name":"Chiron","synastry_house":3},{"name":"Part of Fortune","synastry_house":11}],"aspects":[{"first":"Sun","second":"Sun","type":"Conjunction","orb":0},{"first":"Sun","second":"Moon","type":"Semi Sextile","orb":0.08},{"first":"Sun","second":"Mars","type":"Conjunction","orb":8.88},{"first":"Sun","second":"Venus","type":"Conjunction","orb":3.01},{"first":"Sun","second":"Neptune","type":"Trine","orb":3.73},{"first":"Sun","second":"Pluto","type":"Opposition","orb":1.41},{"first":"Sun","second":"Node","type":"Semi Square","orb":0.36},{"first":"Sun","second":"Chiron","type":"Opposition","orb":4.25},{"first":"Sun","second":"Part of Fortune","type":"Square","orb":3.83},{"first":"Sun","second":"Ascendant","type":"Trine","orb":3.75},{"first":"Sun","second":"Descendant","type":"Sextile","orb":3.75},{"first":"Moon","second":"Sun","type":"Semi Sextile","orb":0.08},{"first":"Moon","second":"Moon","type":"Conjunction","orb":0},{"first":"Moon","second":"Mercury","type":"Sextile","orb":8.37},{"first":"Moon","second":"Venus","type":"Semi Sextile","orb":2.94},{"first":"Moon","second":"Neptune","type":"Square","orb":3.66},{"first":"Moon","second":"Pluto","type":"Quincunx","orb":1.49},{"first":"Moon","second":"Part of Fortune","type":"Trine","orb":3.75},{"first":"Moon","second":"Midheaven","type":"Sextile","orb":3.67},{"first":"Mars","second":"Sun","type":"Conjunction","orb":8.88},{"first":"Mars","second":"Mars","type":"Conjunction","orb":0},{"first":"Mars","second":"Uranus","type":"Trine","orb":1.76},{"first":"Mars","second":"Pluto","type":"Opposition","orb":7.47},{"first":"Mars","second":"Chiron","type":"Opposition","orb":4.63},{"first":"Mars","second":"Descendant","type":"Quintile","orb":0.62},{"first":"Mercury","second":"Moon","type":"Sextile","orb":8.37},{"first":"Mercury","second":"Mercury","type":"Conjunction","orb":0},{"first":"Mercury","second":"Part of Fortune","type":"Sextile","orb":4.62},{"first":"Mercury","second":"Ascendant","type":"Square","orb":4.7},{"first":"Mercury","second":"Midheaven","type":"Conjunction","orb":4.7},{"first":"Mercury","second":"Descendant","type":"Square","orb":4.7},{"first":"Jupiter","second":"Jupiter","type":"Conjunction","orb":0},{"first":"Jupiter","second":"Saturn","type":"Conjunction","orb":0.29},{"first":"Jupiter","second":"Uranus","type":"Square","orb":2.53},{"first":"Jupiter","second":"Node","type":"Sextile","orb":2.19},{"first":"Jupiter","second":"Midheaven","type":"Semi Square","orb":1.92},{"first":"Jupiter","second":"Descendant","type":"Semi Square","orb":1.92},{"first":"Venus","second":"Sun","type":"Conjunction","orb":3.01},{"first":"Venus","second":"Moon","type":"Semi Sextile","orb":2.94},{"first":"Venus","second":"Venus","type":"Conjunction","orb":0},{"first":"Venus","second":"Neptune","type":"Trine","orb":0.72},{"first":"Venus","second":"Pluto","type":"Opposition","orb":4.42},{"first":"Venus","second":"Chiron","type":"Opposition","orb":7.26},{"first":"Venus","second":"Part of Fortune","type":"Square","orb":0.81},{"first":"Venus","second":"Ascendant","type":"Trine","orb":0.73},{"first":"Venus","second":"Midheaven","type":"Semi Sextile","orb":0.74},{"first":"Venus","second":"Descendant","type":"Sextile","orb":0.73},{"first":"Saturn","second":"Jupiter","type":"Conjunction","orb":0.29},{"first":"Saturn","second":"Saturn","type":"Conjunction","orb":0},{"first":"Saturn","second":"Uranus","type":"Square","orb":2.25},{"first":"Saturn","second":"Node","type":"Sextile","orb":2.48},{"first":"Saturn","second":"Midheaven","type":"Semi Square","orb":1.64},{"first":"Saturn","second":"Descendant","type":"Semi Square","orb":1.63},{"first":"Uranus","second":"Mars","type":"Trine","orb":1.76},{"first":"Uranus","second":"Jupiter","type":"Square","orb":2.53},{"first":"Uranus","second":"Saturn","type":"Square","orb":2.25},{"first":"Uranus","second":"Uranus","type":"Conjunction","orb":0},{"first":"Uranus","second":"Pluto","type":"Sextile","orb":9.23},{"first":"Uranus","second":"Chiron","type":"Sextile","orb":6.39},{"first":"Uranus","second":"Descendant","type":"Semi Square","orb":0.61},{"first":"Neptune","second":"Sun","type":"Trine","orb":3.73},{"first":"Neptune","second":"Moon","type":"Square","orb":3.66},{"first":"Neptune","second":"Venus","type":"Trine","orb":0.72},{"first":"Neptune","second":"Neptune","type":"Conjunction","orb":0},{"first":"Neptune","second":"Pluto","type":"Sextile","orb":5.14},{"first":"Neptune","second":"Chiron","type":"Sextile","orb":7.98},{"first":"Neptune","second":"Part of Fortune","type":"Quincunx","orb":0.09},{"first":"Neptune","second":"Ascendant","type":"Trine","orb":0.01},{"first":"Neptune","second":"Midheaven","type":"Quincunx","orb":0.01},{"first":"Neptune","second":"Descendant","type":"Sextile","orb":0.01},{"first":"Pluto","second":"Sun","type":"Opposition","orb":1.41},{"first":"Pluto","second":"Moon","type":"Quincunx","orb":1.49},{"first":"Pluto","second":"Mars","type":"Opposition","orb":7.47},{"first":"Pluto","second":"Venus","type":"Opposition","orb":4.42},{"first":"Pluto","second":"Uranus","type":"Sextile","orb":9.23},{"first":"Pluto","second":"Neptune","type":"Sextile","orb":5.14},{"first":"Pluto","second":"Pluto","type":"Conjunction","orb":0},{"first":"Pluto","second":"Chiron","type":"Conjunction","orb":2.84},{"first":"Pluto","second":"Part of Fortune","type":"Square","orb":5.23},{"first":"Pluto","second":"Ascendant","type":"Sextile","orb":5.16},{"first":"Pluto","second":"Descendant","type":"Trine","orb":5.16},{"first":"Node","second":"Sun","type":"Semi Square","orb":0.36},{"first":"Node","second":"Jupiter","type":"Sextile","orb":2.19},{"first":"Node","second":"Saturn","type":"Sextile","orb":2.48},{"first":"Node","second":"Node","type":"Conjunction","orb":0},{"first":"Node","second":"Ascendant","type":"Quintile","orb":1.11},{"first":"Chiron","second":"Sun","type":"Opposition","orb":4.25},{"first":"Chiron","second":"Mars","type":"Opposition","orb":4.63},{"first":"Chiron","second":"Venus","type":"Opposition","orb":7.26},{"first":"Chiron","second":"Uranus","type":"Sextile","orb":6.39},{"first":"Chiron","second":"Neptune","type":"Sextile","orb":7.98},{"first":"Chiron","second":"Pluto","type":"Conjunction","orb":2.84},{"first":"Chiron","second":"Chiron","type":"Conjunction","orb":0},{"first":"Chiron","second":"Part of Fortune","type":"Square","orb":8.08},{"first":"Chiron","second":"Ascendant","type":"Sextile","orb":8},{"first":"Chiron","second":"Descendant","type":"Trine","orb":8},{"first":"Part of Fortune","second":"Sun","type":"Square","orb":3.83},{"first":"Part of Fortune","second":"Moon","type":"Trine","orb":3.75},{"first":"Part of Fortune","second":"Mercury","type":"Sextile","orb":4.62},{"first":"Part of Fortune","second":"Venus","type":"Square","orb":0.81},{"first":"Part of Fortune","second":"Neptune","type":"Quincunx","orb":0.09},{"first":"Part of Fortune","second":"Pluto","type":"Square","orb":5.23},{"first":"Part of Fortune","second":"Chiron","type":"Square","orb":8.08},{"first":"Part of Fortune","second":"Part of Fortune","type":"Conjunction","orb":0},{"first":"Part of Fortune","second":"Ascendant","type":"Semi Sextile","orb":0.08},{"first":"Part of Fortune","second":"Midheaven","type":"Sextile","orb":0.08},{"first":"Part of Fortune","second":"Descendant","type":"Quincunx","orb":0.08},{"first":"Ascendant","second":"Sun","type":"Trine","orb":3.75},{"first":"Ascendant","second":"Mercury","type":"Square","orb":4.7},{"first":"Ascendant","second":"Venus","type":"Trine","orb":0.73},{"first":"Ascendant","second":"Neptune","type":"Trine","orb":0.01},{"first":"Ascendant","second":"Pluto","type":"Sextile","orb":5.16},{"first":"Ascendant","second":"Node","type":"Quintile","orb":1.11},{"first":"Ascendant","second":"Chiron","type":"Sextile","orb":8},{"first":"Ascendant","second":"Part of Fortune","type":"Semi Sextile","orb":0.08},{"first":"Ascendant","second":"Ascendant","type":"Conjunction","orb":0},{"first":"Ascendant","second":"Midheaven","type":"Square","orb":0},{"first":"Ascendant","second":"Descendant","type":"Opposition","orb":0},{"first":"Midheaven","second":"Moon","type":"Sextile","orb":3.67},{"first":"Midheaven","second":"Mercury","type":"Conjunction","orb":4.7},{"first":"Midheaven","second":"Jupiter","type":"Semi Square","orb":1.92},{"first":"Midheaven","second":"Venus","type":"Semi Sextile","orb":0.74},{"first":"Midheaven","second":"Saturn","type":"Semi Square","orb":1.64},{"first":"Midheaven","second":"Neptune","type":"Quincunx","orb":0.01},{"first":"Midheaven","second":"Part of Fortune","type":"Sextile","orb":0.08},{"first":"Midheaven","second":"Ascendant","type":"Square","orb":0},{"first":"Midheaven","second":"Midheaven","type":"Conjunction","orb":0},{"first":"Midheaven","second":"Descendant","type":"Square","orb":0},{"first":"Descendant","second":"Sun","type":"Sextile","orb":3.75},{"first":"Descendant","second":"Mars","type":"Quintile","orb":0.62},{"first":"Descendant","second":"Mercury","type":"Square","orb":4.7},{"first":"Descendant","second":"Jupiter","type":"Semi Square","orb":1.92},{"first":"Descendant","second":"Venus","type":"Sextile","orb":0.73},{"first":"Descendant","second":"Saturn","type":"Semi Square","orb":1.63},{"first":"Descendant","second":"Uranus","type":"Semi Square","orb":0.61},{"first":"Descendant","second":"Neptune","type":"Sextile","orb":0.01},{"first":"Descendant","second":"Pluto","type":"Trine","orb":5.16},{"first":"Descendant","second":"Chiron","type":"Trine","orb":8},{"first":"Descendant","second":"Part of Fortune","type":"Quincunx","orb":0.08},{"first":"Descendant","second":"Ascendant","type":"Opposition","orb":0},{"first":"Descendant","second":"Midheaven","type":"Square","orb":0},{"first":"Descendant","second":"Descendant","type":"Conjunction","orb":0}]}}}			"RESULTS :""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Sun Conjunction Sun\"",      \""data\"": \""The Sun conjunction in both charts indicates a profound alignment in core values and life approach. This aspect suggests that both individuals share similar life goals and perspectives, making it easier to understand and support each other. The conjunction enhances mutual respect and admiration, fostering a strong sense of camaraderie. It can also amplify each other's strengths, encouraging personal growth and development. However, it is essential to be mindful of potential ego clashes, as both may have strong personalities that need balancing.\""    },    {      \""title\"": \""Moon Conjunction Moon\"",      \""data\"": \""The Moon conjunction signifies a deep emotional resonance between the two individuals. This aspect suggests that both friends find comfort and understanding in each other's presence, creating a nurturing and supportive environment. It enhances emotional safety, allowing both to express their feelings openly without fear of judgment. This emotional alignment can lead to a strong bond, where both individuals feel seen and heard. However, it is crucial to be aware of potential emotional dependency, as the close connection might lead to over-reliance on each other for emotional support.\""    },    {      \""title\"": \""Mercury Conjunction Mercury\"",      \""data\"": \""The Mercury conjunction indicates a high level of intellectual compatibility and similar communication styles. This aspect suggests that conversations between the two are likely to be engaging and stimulating, with both individuals understanding each other's thought processes. It fosters clear communication, reducing the likelihood of misunderstandings and promoting effective problem-solving. The conjunction also encourages the exchange of ideas, enhancing mutual learning and growth. However, it is important to be mindful of potential intellectual competition, as both may have strong opinions that need balancing.\""    },    {      \""title\"": \""Venus Conjunction Venus\"",      \""data\"": \""The Venus conjunction suggests a harmonious alignment in values related to love, beauty, and pleasure. This aspect indicates that both individuals share similar tastes and preferences, making it easier to enjoy shared activities and experiences. It enhances mutual appreciation and affection, fostering a warm and loving friendship. The conjunction also encourages cooperation and compromise, promoting a balanced and harmonious relationship. However, it is essential to be aware of potential complacency, as the ease of connection might lead to taking each other for granted.\""    },    {      \""title\"": \""Mars Conjunction Mars\"",      \""data\"": \""The Mars conjunction indicates a strong alignment in energy levels and assertiveness. This aspect suggests that both individuals share similar approaches to taking action and pursuing goals, making it easier to collaborate and support each other's ambitions. It enhances motivation and drive, encouraging both to push each other towards success. The conjunction also fosters a sense of adventure and excitement, promoting a dynamic and active friendship. However, it is crucial to be mindful of potential conflicts, as both may have strong wills that need balancing.\""    },    {      \""title\"": \""Jupiter Conjunction Saturn\"",      \""data\"": \""The Jupiter-Saturn conjunction suggests a balance between expansion and discipline in the friendship. This aspect indicates that both individuals can support each other's growth while maintaining a sense of responsibility and structure. It enhances mutual respect and understanding, promoting a stable and grounded relationship. The conjunction also encourages the pursuit of long-term goals, fostering a sense of purpose and direction. However, it is essential to be aware of potential tension between optimism and caution, as both may have different approaches to risk-taking.\""    },    {      \""title\"": \""Sun Trine Neptune\"",      \""data\"": \""The Sun trine Neptune indicates a harmonious alignment in spiritual and creative pursuits. This aspect suggests that both individuals share a deep sense of empathy and compassion, making it easier to support each other's dreams and aspirations. It enhances intuition and imagination, encouraging both to explore new possibilities and perspectives. The trine also fosters a sense of inspiration and creativity, promoting a rich and fulfilling friendship. However, it is important to be mindful of potential idealization, as the ease of connection might lead to unrealistic expectations.\""    },    {      \""title\"": \""Moon Sextile Mercury\"",      \""data\"": \""The Moon sextile Mercury suggests a supportive alignment in emotional expression and communication. This aspect indicates that both individuals can easily articulate their feelings and thoughts, fostering a sense of understanding and empathy. It enhances emotional intelligence, allowing both to navigate complex emotions with ease. The sextile also encourages open and honest communication, promoting a transparent and trusting relationship. However, it is essential to be aware of potential over-analysis, as both may have a tendency to intellectualize emotions.\""    },    {      \""title\"": \""Venus Trine Neptune\"",      \""data\"": \""The Venus trine Neptune indicates a harmonious alignment in romantic and artistic values. This aspect suggests that both individuals share a deep appreciation for beauty and creativity, making it easier to enjoy shared experiences and activities. It enhances mutual admiration and affection, fostering a loving and supportive friendship. The trine also encourages the exploration of artistic and spiritual pursuits, promoting a rich and fulfilling relationship. However, it is important to be mindful of potential idealization, as the ease of connection might lead to unrealistic expectations.\""    },    {      \""title\"": \""Mars Trine Uranus\"",      \""data\"": \""The Mars trine Uranus indicates a harmonious alignment in innovation and action. This aspect suggests that both individuals share a strong desire for excitement and change, making it easier to pursue new experiences and adventures together. It enhances spontaneity and creativity, encouraging both to think outside the box and embrace unconventional approaches. The trine also fosters a sense of independence and freedom, promoting a dynamic and stimulating friendship. However, it is crucial to be mindful of potential impulsiveness, as the ease of connection might lead to hasty decisions.\""    },    {      \""title\"": \""Summary\"",      \""data\"": \""The synastry chart reveals a strong alignment in core values, emotional resonance, and communication styles, suggesting a harmonious and supportive friendship. The conjunctions between personal planets indicate a deep understanding and mutual respect, fostering a sense of camaraderie and cooperation. The trines and sextiles enhance creativity, empathy, and spontaneity, promoting a rich and fulfilling relationship. However, it is important to be mindful of potential challenges, such as ego clashes, emotional dependency, and impulsiveness, which may require understanding and adaptability.\""    },    {      \""title\"": \""Recommendations\"",      \""data\"": \""To nurture this friendship, it is essential to maintain open and honest communication, allowing both individuals to express their thoughts and feelings freely. Embrace the shared interests and values, exploring new experiences and adventures together to strengthen the bond. Be mindful of potential challenges, such as ego clashes and emotional dependency, and address them with empathy and understanding. Encourage each other's growth and development, supporting each other's dreams and aspirations. Lastly, maintain a balance between independence and togetherness, allowing both individuals to thrive individually and as a pair.\""    }  ]}```"",
    ""prompt_tokens"": 5232,"		
											
Composite Horoscope			" API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/
"			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for a To conduct a For a composite chart analysis, which synthesizes both individuals' charts into a single chart representing the relationship, you'll employ the midpoint method to merge the planetary positions from each chart, creating a new set of placements that reflect the relationship as a unit. Focus on analyzing the composite Sun, Moon, and Ascendant to decode the core identity, emotional nature, and outward expression of the relationship. The positions and aspects of the composite Sun and Moon are particularly telling, revealing the relationship's purpose and underlying emotional themes. Moreover, investigate the house placements of planets within the composite chart to discern how each planet influences specific areas of the relationship, highlighting both strengths and challenges. This analysis helps uncover how the relationship functions collectively, providing insights into its dynamics and potential areas for growth or difficulty. Utilizing astrology software tailored for composite chart calculations can streamline this process, while insights from astrology literature and professional consultations can further enrich the understanding of the chart's implications.","user_content":"I was born on May 31, 2000,  13:0 in  Bardhaman, West Bengal, India  'lat:23.24073,lon:87.86733,tzone:+05:30'. my love relation partner was born on May 31, 2000 13:0 at Bardhaman, West Bengal, India   'lat:23.24073,lon:87.86733,tzone:+05:30' I have added birth chart details of mine and my love relationship partner both now calculate our composite chart of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response "},"toolname":"other","json":{"first":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"second":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"composite":{"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"sign_id":4,"sign":"Cancer","house":10},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"sign_id":11,"sign":"Aquarius","house":5},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"sign_id":6,"sign":"Virgo","house":12}],"houses":[{"house":1,"sign":"Libra","degree":186.42234},{"house":2,"sign":"Scorpio","degree":215.39624},{"house":3,"sign":"Sagittarius","degree":245.69053},{"house":4,"sign":"Capricorn","degree":276.42033},{"house":5,"sign":"Aquarius","degree":307.33237},{"house":6,"sign":"Pisces","degree":337.81387},{"house":7,"sign":"Aries","degree":6.42234},{"house":8,"sign":"Taurus","degree":35.39624},{"house":9,"sign":"Gemini","degree":65.69053},{"house":10,"sign":"Cancer","degree":96.42033},{"house":11,"sign":"Leo","degree":127.33237},{"house":12,"sign":"Virgo","degree":157.81387}],"ascendant":186.42234,"midheaven":96.42033,"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Chiron","aspecting_planet_id":0,"aspected_planet_id":11,"aspect_type":2,"type":"Opposition","orb":4.25,"diff":175.75},{"aspecting_planet":"Sun","aspected_planet":"Part of Fortune","aspecting_planet_id":0,"aspected_planet_id":12,"aspect_type":4,"type":"Square","orb":3.83,"diff":86.17},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":13,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":14,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mars","aspected_planet":"Chiron","aspecting_planet_id":2,"aspected_planet_id":11,"aspect_type":2,"type":"Opposition","orb":4.63,"diff":175.37},{"aspecting_planet":"Mercury","aspected_planet":"Part of Fortune","aspecting_planet_id":3,"aspected_planet_id":12,"aspect_type":5,"type":"Sextile","orb":4.62,"diff":64.62},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":13,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":14,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Jupiter","aspected_planet":"Node","aspecting_planet_id":4,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":2.19,"diff":62.19},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Chiron","aspecting_planet_id":5,"aspected_planet_id":11,"aspect_type":2,"type":"Opposition","orb":7.26,"diff":172.74},{"aspecting_planet":"Venus","aspected_planet":"Part of Fortune","aspecting_planet_id":5,"aspected_planet_id":12,"aspect_type":4,"type":"Square","orb":0.81,"diff":89.19},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":13,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Saturn","aspected_planet":"Node","aspecting_planet_id":6,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":2.48,"diff":62.48},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":13,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Chiron","aspecting_planet_id":9,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":2.84,"diff":2.84},{"aspecting_planet":"Pluto","aspected_planet":"Part of Fortune","aspecting_planet_id":9,"aspected_planet_id":12,"aspect_type":4,"type":"Square","orb":5.23,"diff":95.23},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":13,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Part of Fortune","aspected_planet":"Midheaven","aspecting_planet_id":12,"aspected_planet_id":14,"aspect_type":5,"type":"Sextile","orb":0.08,"diff":59.92},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":13,"aspected_planet_id":14,"aspect_type":4,"type":"Square","orb":0,"diff":90}]}}}			"RESULTS : ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Composite Sun in Gemini, 9th House\"",      \""data\"": \""The composite Sun in Gemini suggests a relationship centered around communication, learning, and intellectual pursuits. Gemini's influence brings curiosity and a desire for variety, indicating that the relationship thrives on mental stimulation and shared ideas. Positioned in the 9th house, this Sun placement emphasizes a shared interest in philosophy, travel, and expanding horizons together. The 9th house influence suggests that the relationship may involve exploration of different cultures or belief systems, enhancing mutual growth. The conjunction with Mars and Venus in Gemini further energizes this dynamic, fostering a lively and engaging partnership.\""    },    {      \""title\"": \""Composite Moon in Taurus, 8th House\"",      \""data\"": \""The composite Moon in Taurus indicates a stable and nurturing emotional foundation within the relationship. Taurus brings a sense of security and comfort, emphasizing the importance of physical and emotional stability. Located in the 8th house, the Moon suggests that the relationship involves deep emotional bonds and transformative experiences. The 8th house placement can bring challenges related to shared resources or intimacy, but it also offers opportunities for profound emotional growth. The Moon's square to Neptune highlights potential illusions or misunderstandings, urging both partners to maintain clarity and honesty.\""    },    {      \""title\"": \""Composite Ascendant in Libra\"",      \""data\"": \""With a Libra Ascendant, the relationship is perceived as harmonious and balanced, with a focus on partnership and cooperation. Libra's influence encourages diplomacy and a desire to maintain peace and fairness within the relationship. The Ascendant's trine to Neptune suggests a dreamy and idealistic quality, enhancing the romantic and artistic aspects of the partnership. However, the square to the Midheaven indicates potential tension between personal goals and the relationship's public image, requiring careful navigation to maintain balance.\""    },    {      \""title\"": \""Composite Mercury in Cancer, 10th House\"",      \""data\"": \""Composite Mercury in Cancer suggests communication within the relationship is emotionally driven and nurturing. Cancer's influence brings sensitivity and a focus on family or home-related discussions. Positioned in the 10th house, Mercury emphasizes the importance of communication in achieving shared goals and ambitions. The conjunction with the Midheaven indicates that the relationship's communication style significantly impacts its public perception and career-related matters. The square to the Ascendant highlights potential challenges in expressing emotions clearly, necessitating patience and understanding.\""    },    {      \""title\"": \""Composite Venus in Gemini, 9th House\"",      \""data\"": \""Composite Venus in Gemini highlights a love for variety and intellectual stimulation within the relationship. Gemini's influence brings playfulness and a desire for social interaction, enhancing the partnership's dynamic nature. Positioned in the 9th house, Venus suggests that shared adventures and learning experiences strengthen the bond. The trine to Neptune adds a romantic and idealistic quality, fostering creativity and spiritual connection. However, the opposition to Pluto warns of potential power struggles or intense emotional dynamics, requiring conscious effort to maintain harmony.\""    },    {      \""title\"": \""Composite Mars in Gemini, 9th House\"",      \""data\"": \""Composite Mars in Gemini indicates an energetic and dynamic relationship, driven by intellectual pursuits and curiosity. Gemini's influence brings adaptability and a desire for mental challenges, encouraging both partners to explore new ideas together. Positioned in the 9th house, Mars emphasizes a shared passion for travel, philosophy, or higher learning. The trine to Uranus suggests a willingness to embrace change and innovation, enhancing the relationship's excitement. However, the opposition to Pluto indicates potential conflicts or power struggles, necessitating open communication and compromise.\""    },    {      \""title\"": \""Composite Jupiter in Taurus, 8th House\"",      \""data\"": \""Composite Jupiter in Taurus suggests a relationship that values stability and abundance, with a focus on shared resources and values. Taurus brings a sense of security and appreciation for the finer things in life, enhancing the relationship's material and emotional wealth. Positioned in the 8th house, Jupiter emphasizes growth through deep emotional connections and transformative experiences. The conjunction with Saturn highlights the importance of responsibility and commitment in managing shared resources. The square to Uranus suggests potential disruptions or unexpected changes, requiring flexibility and adaptability.\""    },    {      \""title\"": \""Composite Saturn in Taurus, 8th House\"",      \""data\"": \""Composite Saturn in Taurus emphasizes the importance of stability and responsibility in managing shared resources and emotional bonds. Taurus brings a practical and grounded approach, encouraging both partners to build a secure foundation. Positioned in the 8th house, Saturn suggests that the relationship may face challenges related to intimacy or financial matters, requiring patience and perseverance. The sextile to the Node highlights opportunities for growth through shared goals and commitments. The square to Uranus warns of potential disruptions or resistance to change, necessitating careful planning and communication.\""    },    {      \""title\"": \""Composite Uranus in Aquarius, 5th House\"",      \""data\"": \""Composite Uranus in Aquarius suggests a relationship characterized by innovation and a desire for freedom and individuality. Aquarius brings a progressive and unconventional approach, encouraging both partners to embrace change and new experiences. Positioned in the 5th house, Uranus emphasizes creativity and spontaneity, enhancing the relationship's excitement and passion. The trine to Mars indicates a harmonious blend of energy and innovation, fostering dynamic and adventurous pursuits. However, the square to Jupiter and Saturn warns of potential conflicts between freedom and responsibility, requiring balance and compromise.\""    },    {      \""title\"": \""Composite Neptune in Aquarius, 5th House\"",      \""data\"": \""Composite Neptune in Aquarius suggests a relationship with a strong spiritual or idealistic dimension, characterized by creativity and imagination. Aquarius brings a visionary and humanitarian approach, encouraging both partners to explore new possibilities and ideals. Positioned in the 5th house, Neptune emphasizes artistic expression and romantic ideals, enhancing the relationship's dreamlike quality. The trine to the Ascendant adds a sense of enchantment and inspiration, fostering a deep emotional connection. However, the square to the Moon warns of potential illusions or misunderstandings, necessitating clarity and honesty.\""    },    {      \""title\"": \""Composite Pluto in Sagittarius, 3rd House\"",      \""data\"": \""Composite Pluto in Sagittarius suggests a relationship characterized by transformative communication and a desire for truth and understanding. Sagittarius brings a philosophical and adventurous approach, encouraging both partners to explore new ideas and perspectives. Positioned in the 3rd house, Pluto emphasizes the importance of communication in achieving personal and shared growth. The conjunction with Chiron highlights opportunities for healing and transformation through honest and open dialogue. However, the opposition to the Sun and Venus warns of potential power struggles or intense emotional dynamics, requiring conscious effort to maintain harmony.\""    },    {      \""title\"": \""Composite Chiron in Sagittarius, 3rd House\"",      \""data\"": \""Composite Chiron in Sagittarius suggests a relationship with a focus on healing and growth through communication and shared beliefs. Sagittarius brings a philosophical and adventurous approach, encouraging both partners to explore new ideas and perspectives. Positioned in the 3rd house, Chiron emphasizes the importance of communication in addressing wounds and fostering understanding. The conjunction with Pluto highlights opportunities for deep transformation and healing through honest and open dialogue. However, the opposition to the Sun and Venus warns of potential challenges in balancing personal desires with the relationship's needs, requiring conscious effort to maintain harmony.\""    },    {      \""title\"": \""Composite Part of Fortune in Virgo, 12th House\"",      \""data\"": \""Composite Part of Fortune in Virgo suggests a relationship that finds joy and fulfillment through service, organization, and attention to detail. Virgo brings a practical and analytical approach, encouraging both partners to focus on improving and refining their relationship. Positioned in the 12th house, the Part of Fortune emphasizes the importance of spiritual growth and self-awareness, enhancing the relationship's depth and meaning. The sextile to the Midheaven highlights opportunities for achieving shared goals and ambitions through dedication and hard work. However, the square to the Sun warns of potential conflicts between personal desires and the relationship's needs, requiring balance and compromise.\""    },    {      \""title\"": \""Summary\"",      \""data\"": \""The composite chart reveals a relationship characterized by intellectual stimulation, emotional depth, and a desire for growth and transformation. The strong Gemini influence highlights the importance of communication and shared ideas, while the Taurus placements emphasize stability and security. The presence of Uranus and Neptune in Aquarius suggests a progressive and idealistic approach, encouraging both partners to embrace change and new experiences. However, the oppositions and squares indicate potential challenges related to power dynamics, communication, and balancing personal desires with the relationship's needs. Overall, the relationship offers opportunities for profound growth and transformation, requiring conscious effort and communication to navigate challenges.\""    },    {      \""title\"": \""Recommendations\"",      \""data\"": \""To enhance the relationship's potential, focus on open and honest communication, addressing any misunderstandings or power struggles. Embrace the relationship's dynamic and adventurous nature, exploring new ideas and experiences together. Balance personal desires with the relationship's needs, ensuring that both partners feel valued and supported. Utilize the relationship's strengths in communication and intellectual pursuits to achieve shared goals and ambitions. Consider seeking professional guidance or engaging in activities that promote mutual growth and understanding, enhancing the relationship's depth and meaning.\""    }  ]}```"",
    ""prompt_tokens"": 4178,"		
											
Davison Relationship			" API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/
"			PAYLOAD :{"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for a To conduct a For The Time and Location Midpoint in the Davison Relationship Chart represents a composite focal point that bridges both time and space, offering a dynamic snapshot of the relationship's unfolding journey. This midpoint reflects the collective essence of the relationship—its purpose, key themes, and significant moments in the context of both temporal and geographical influences. Astrologically, it reveals periods of the relationship's growth, challenges, and turning points by showing how the relationship interacts with planetary placements and aspects in the sky at specific moments. The aspects formed to the Time and Location Midpoint, whether harmonious or challenging, offer insights into the evolving emotional tone, intellectual exchanges, and potential shifts in the relationship. For example, a conjunction to the Sun or Moon may indicate pivotal phases where personal growth, emotional bonding, or a sense of destiny is felt, while squares or oppositions to outer planets like Saturn or Pluto can mark times of crisis, transformation, or deep restructuring. The location of the midpoint also ties the relationship to specific geographical energies, subtly influencing where the most significant growth or challenges may unfold geographically. This midpoint can thus provide a rich, time-sensitive layer to the relationship's astrological story, revealing underlying currents that may not be immediately obvious through traditional synastry or composite charts alone.","user_content":"I was born on May 31, 2000,  13:0 in  Bardhaman, West Bengal, India  'lat:23.24073,lon:87.86733,tzone:+05:30'. my friendship  relationship partner was born on May 31, 2000 13:0 at Bardhaman, West Bengal, India   'lat:23.24073,lon:87.86733,tzone:+05:30' I have added birth chart details of mine and my friendship  relationship partner both now calculate our davison relation ship chart of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response "},"toolname":"other","json":{"mydetails":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}},"fiend_details":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}}}}			"RESULTS : {
    ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Sun in Gemini in the 9th House\"",      \""data\"": \""The Sun in Gemini in the 9th house of the Davison Relationship Chart suggests a relationship that thrives on intellectual exploration and philosophical discussions. This placement indicates a shared love for learning, travel, and expanding horizons together. The 9th house emphasizes growth through experiences and education, suggesting that this friendship is likely to involve mutual encouragement to pursue higher knowledge and understanding. The Sun's presence here also highlights a strong sense of purpose and direction in the relationship, with both individuals likely to inspire each other to reach their full potential. The Gemini influence brings a lively, communicative energy, making conversations a central theme in this partnership.\""    },    {      \""title\"": \""Moon in Taurus in the 8th House\"",      \""data\"": \""The Moon in Taurus in the 8th house indicates a deep emotional bond that is both stable and transformative. This placement suggests that the friendship is built on a foundation of trust and emotional security, with both individuals valuing loyalty and consistency. The 8th house is associated with transformation and shared resources, indicating that this relationship may involve significant emotional growth and change. The Taurus Moon brings a nurturing, comforting energy, emphasizing the importance of creating a safe space for emotional expression. This placement also suggests that the friendship may involve exploring deeper psychological or spiritual themes together.\""    },    {      \""title\"": \""Mercury in Cancer in the 9th House\"",      \""data\"": \""Mercury in Cancer in the 9th house suggests a relationship that values emotional communication and intuitive understanding. This placement indicates that both individuals are likely to share a deep connection through meaningful conversations and shared beliefs. The 9th house emphasizes the importance of exploring new ideas and perspectives, suggesting that this friendship may involve learning and growing together. Mercury in Cancer brings a sensitive, empathetic energy, highlighting the importance of listening and understanding each other's feelings. This placement also suggests that the friendship may involve exploring cultural or philosophical themes that resonate on an emotional level.\""    },    {      \""title\"": \""Venus in Gemini in the 9th House\"",      \""data\"": \""Venus in Gemini in the 9th house indicates a relationship that is characterized by a love of learning and exploration. This placement suggests that both individuals are likely to enjoy engaging in intellectual pursuits and sharing new experiences together. The 9th house emphasizes the importance of growth and expansion, suggesting that this friendship may involve exploring new horizons and broadening each other's perspectives. Venus in Gemini brings a playful, communicative energy, highlighting the importance of maintaining an open and curious mindset. This placement also suggests that the friendship may involve a shared appreciation for art, culture, and beauty.\""    },    {      \""title\"": \""Mars in Gemini in the 9th House\"",      \""data\"": \""Mars in Gemini in the 9th house suggests a dynamic and energetic relationship that is driven by a desire for adventure and exploration. This placement indicates that both individuals are likely to be motivated by a shared passion for learning and discovery. The 9th house emphasizes the importance of pursuing new experiences and expanding horizons, suggesting that this friendship may involve taking risks and embracing challenges together. Mars in Gemini brings a lively, adaptable energy, highlighting the importance of staying flexible and open to change. This placement also suggests that the friendship may involve engaging in debates or discussions that stimulate intellectual growth.\""    },    {      \""title\"": \""Jupiter in Taurus in the 8th House\"",      \""data\"": \""Jupiter in Taurus in the 8th house indicates a relationship that is characterized by a deep sense of trust and mutual support. This placement suggests that both individuals are likely to benefit from shared resources and emotional growth. The 8th house is associated with transformation and regeneration, suggesting that this friendship may involve significant changes and personal development. Jupiter in Taurus brings a stable, grounded energy, highlighting the importance of building a solid foundation for the relationship. This placement also suggests that the friendship may involve exploring themes of abundance, prosperity, and shared values.\""    },    {      \""title\"": \""Saturn in Taurus in the 8th House\"",      \""data\"": \""Saturn in Taurus in the 8th house suggests a relationship that is built on a foundation of responsibility and commitment. This placement indicates that both individuals are likely to take their friendship seriously and work towards creating a stable, secure bond. The 8th house is associated with transformation and shared resources, suggesting that this relationship may involve overcoming challenges and building resilience together. Saturn in Taurus brings a disciplined, patient energy, highlighting the importance of perseverance and dedication. This placement also suggests that the friendship may involve exploring themes of trust, loyalty, and emotional depth.\""    },    {      \""title\"": \""Uranus in Aquarius in the 5th House\"",      \""data\"": \""Uranus in Aquarius in the 5th house indicates a relationship that is characterized by creativity, innovation, and a sense of freedom. This placement suggests that both individuals are likely to enjoy engaging in unique, unconventional activities together. The 5th house is associated with self-expression and enjoyment, suggesting that this friendship may involve exploring new forms of creativity and having fun. Uranus in Aquarius brings an independent, forward-thinking energy, highlighting the importance of embracing individuality and originality. This placement also suggests that the friendship may involve exploring themes of technology, social change, and progressive ideas.\""    },    {      \""title\"": \""Neptune in Aquarius in the 4th House\"",      \""data\"": \""Neptune in Aquarius in the 4th house suggests a relationship that is characterized by a deep sense of empathy and understanding. This placement indicates that both individuals are likely to share a strong emotional connection and a sense of belonging. The 4th house is associated with home and family, suggesting that this friendship may involve creating a supportive, nurturing environment. Neptune in Aquarius brings a compassionate, visionary energy, highlighting the importance of dreaming big and supporting each other's aspirations. This placement also suggests that the friendship may involve exploring themes of spirituality, intuition, and collective consciousness.\""    },    {      \""title\"": \""Pluto in Sagittarius in the 3rd House\"",      \""data\"": \""Pluto in Sagittarius in the 3rd house indicates a relationship that is characterized by intense communication and transformative ideas. This placement suggests that both individuals are likely to engage in deep, meaningful conversations that challenge their perspectives. The 3rd house is associated with communication and learning, suggesting that this friendship may involve exploring new concepts and expanding each other's minds. Pluto in Sagittarius brings a powerful, transformative energy, highlighting the importance of embracing change and growth. This placement also suggests that the friendship may involve exploring themes of philosophy, truth, and higher learning.\""    }  ],  \""summary\"": \""The Davison Relationship Chart for this friendship reveals a dynamic and intellectually stimulating connection. With multiple planets in the 9th house, there is a strong emphasis on learning, exploration, and personal growth. The presence of Venus and Mars in Gemini suggests a lively, communicative energy, while the Moon and Jupiter in Taurus provide stability and emotional depth. Uranus and Neptune in Aquarius highlight the importance of creativity and empathy, while Pluto in Sagittarius encourages transformative communication. Overall, this friendship is likely to involve a shared passion for discovery and a deep emotional bond.\"",  \""recommendations\"": \""To nurture this friendship, focus on maintaining open communication and embracing new experiences together. Engage in activities that stimulate intellectual growth and encourage personal development. Be open to exploring new ideas and perspectives, and support each other's aspirations and dreams. Create a safe, supportive environment where both individuals feel valued and understood. Embrace the unique qualities of the relationship and celebrate the shared journey of growth and transformation.\""}```"",
    ""prompt_tokens"": 4812,
    ""completion_tokens"": 1593,
    ""total_tokens"": 6405,
    ""cache_status"": ""Hit"",
    ""database_identifier"": ""530ef40589f0e9dfaf941ed090fc57c38f3bb6699d3cf583313da38907134957"",
    ""request_body"": {
        ""condition"": {
            ""system_content"": ""give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for a To conduct a For The Time and Location Midpoint in the Davison Relationship Chart represents a composite focal point that bridges both time and space, offering a dynamic snapshot of the relationship's unfolding journey. This midpoint reflects the collective essence of the relationship—its purpose, key themes, and significant moments in the context of both temporal and geographical influences. Astrologically, it reveals periods of the relationship's growth, challenges, and turning points by showing how the relationship interacts with planetary placements and aspects in the sky at specific moments. The aspects formed to the Time and Location Midpoint, whether harmonious or challenging, offer insights into the evolving emotional tone, intellectual exchanges, and potential shifts in the relationship. For example, a conjunction to the Sun or Moon may indicate pivotal phases where personal growth, emotional bonding, or a sense of destiny is felt, while squares or oppositions to outer planets like Saturn or Pluto can mark times of crisis, transformation, or deep restructuring. The location of the midpoint also ties the relationship to specific geographical energies, subtly influencing where the most significant growth or challenges may unfold geographically. This midpoint can thus provide a rich, time-sensitive layer to the relationship's astrological story, revealing underlying currents that may not be immediately obvious through traditional synastry or composite charts alone."",
            ""user_content"": ""I was born on May 31, 2000,  13:0 in  Bardhaman, West Bengal, India  'lat:23.24073,lon:87.86733,tzone:+05:30'. my friendship  relationship partner was born on May 31, 2000 13:0 at Bardhaman, West Bengal, India   'lat:23.24073,lon:87.86733,tzone:+05:30' I have added birth chart details of mine and my friendship  relationship partner both now calculate our davison relation ship chart of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response ""
        },
        ""toolname"": ""other"",
        ""json"": {
            ""mydetails"": {
                ""ascendant"": 186.42234480081225,
                ""midheaven"": 96.4203334296655,
                ""vertex"": 277.2781580258426,
                ""houses"": [
                    {
                        ""house"": 1,
                        ""sign"": ""Libra"",
                        ""sign_id"": 7,
                        ""degree"": 186.42234
                    },
                    {
                        ""house"": 2,
                        ""sign"": ""Scorpio"",
                        ""sign_id"": 8,
                        ""degree"": 215.39624
                    },
                    {
                        ""house"": 3,
                        ""sign"": ""Sagittarius"",
                        ""sign_id"": 9,
                        ""degree"": 245.69053
                    },
                    {
                        ""house"": 4,
                        ""sign"": ""Capricorn"",
                        ""sign_id"": 10,
                        ""degree"": 276.42033
                    },
                    {
                        ""house"": 5,
                        ""sign"": ""Aquarius"",
                        ""sign_id"": 11,
                        ""degree"": 307.33237
                    },
                    {
                        ""house"": 6,
                        ""sign"": ""Pisces"",
                        ""sign_id"": 12,
                        ""degree"": 337.81387
                    },
                    {
                        ""house"": 7,
                        ""sign"": ""Aries"",
                        ""sign_id"": 1,
                        ""degree"": 6.42234
                    },
                    {
                        ""house"": 8,
                        ""sign"": ""Taurus"",
                        ""sign_id"": 2,
                        ""degree"": 35.39624
                    },
                    {
                        ""house"": 9,
                        ""sign"": ""Gemini"",
                        ""sign_id"": 3,
                        ""degree"": 65.69053
                    },
                    {
                        ""house"": 10,
                        ""sign"": ""Cancer"",
                        ""sign_id"": 4,
                        ""degree"": 96.42033
                    },
                    {
                        ""house"": 11,
                        ""sign"": ""Leo"",
                        ""sign_id"": 5,
                        ""degree"": 127.33237
                    },
                    {
                        ""house"": 12,
                        ""sign"": ""Virgo"",
                        ""sign_id"": 6,
                        ""degree"": 157.81387
                    }
                ],
                ""aspects"": [
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Mars"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 2,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 8.88,
                        ""diff"": 8.88
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Venus"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 5,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 3.01,
                        ""diff"": 3.01
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Neptune"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 8,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 3.73,
                        ""diff"": 123.73
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Pluto"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 9,
                        ""aspect_type"": 2,
                        ""type"": ""Opposition"",
                        ""orb"": 1.41,
                        ""diff"": 178.59
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 10,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 3.75,
                        ""diff"": 116.25
                    },
                    {
                        ""aspecting_planet"": ""Moon"",
                        ""aspected_planet"": ""Neptune"",
                        ""aspecting_planet_id"": 1,
                        ""aspected_planet_id"": 8,
                        ""aspect_type"": 4,
                        ""type"": ""Square"",
                        ""orb"": 3.66,
                        ""diff"": 93.66
                    },
                    {
                        ""aspecting_planet"": ""Moon"",
                        ""aspected_planet"": ""Midheaven"",
                        ""aspecting_planet_id"": 1,
                        ""aspected_planet_id"": 11,
                        ""aspect_type"": 5,
                        ""type"": ""Sextile"",
                        ""orb"": 3.67,
                        ""diff"": 56.33
                    },
                    {
                        ""aspecting_planet"": ""Mars"",
                        ""aspected_planet"": ""Uranus"",
                        ""aspecting_planet_id"": 2,
                        ""aspected_planet_id"": 7,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 1.76,
                        ""diff"": 118.24
                    },
                    {
                        ""aspecting_planet"": ""Mars"",
                        ""aspected_planet"": ""Pluto"",
                        ""aspecting_planet_id"": 2,
                        ""aspected_planet_id"": 9,
                        ""aspect_type"": 2,
                        ""type"": ""Opposition"",
                        ""orb"": 7.47,
                        ""diff"": 172.53
                    },
                    {
                        ""aspecting_planet"": ""Mercury"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 3,
                        ""aspected_planet_id"": 10,
                        ""aspect_type"": 4,
                        ""type"": ""Square"",
                        ""orb"": 4.7,
                        ""diff"": 94.7
                    },
                    {
                        ""aspecting_planet"": ""Mercury"",
                        ""aspected_planet"": ""Midheaven"",
                        ""aspecting_planet_id"": 3,
                        ""aspected_planet_id"": 11,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 4.7,
                        ""diff"": 4.7
                    },
                    {
                        ""aspecting_planet"": ""Jupiter"",
                        ""aspected_planet"": ""Saturn"",
                        ""aspecting_planet_id"": 4,
                        ""aspected_planet_id"": 6,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 0.29,
                        ""diff"": 0.29
                    },
                    {
                        ""aspecting_planet"": ""Jupiter"",
                        ""aspected_planet"": ""Uranus"",
                        ""aspecting_planet_id"": 4,
                        ""aspected_planet_id"": 7,
                        ""aspect_type"": 4,
                        ""type"": ""Square"",
                        ""orb"": 2.53,
                        ""diff"": 92.53
                    },
                    {
                        ""aspecting_planet"": ""Venus"",
                        ""aspected_planet"": ""Neptune"",
                        ""aspecting_planet_id"": 5,
                        ""aspected_planet_id"": 8,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 0.72,
                        ""diff"": 120.72
                    },
                    {
                        ""aspecting_planet"": ""Venus"",
                        ""aspected_planet"": ""Pluto"",
                        ""aspecting_planet_id"": 5,
                        ""aspected_planet_id"": 9,
                        ""aspect_type"": 2,
                        ""type"": ""Opposition"",
                        ""orb"": 4.42,
                        ""diff"": 175.58
                    },
                    {
                        ""aspecting_planet"": ""Venus"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 5,
                        ""aspected_planet_id"": 10,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 0.73,
                        ""diff"": 119.27
                    },
                    {
                        ""aspecting_planet"": ""Saturn"",
                        ""aspected_planet"": ""Uranus"",
                        ""aspecting_planet_id"": 6,
                        ""aspected_planet_id"": 7,
                        ""aspect_type"": 4,
                        ""type"": ""Square"",
                        ""orb"": 2.25,
                        ""diff"": 92.25
                    },
                    {
                        ""aspecting_planet"": ""Neptune"",
                        ""aspected_planet"": ""Pluto"",
                        ""aspecting_planet_id"": 8,
                        ""aspected_planet_id"": 9,
                        ""aspect_type"": 5,
                        ""type"": ""Sextile"",
                        ""orb"": 5.14,
                        ""diff"": 54.86
                    },
                    {
                        ""aspecting_planet"": ""Neptune"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 8,
                        ""aspected_planet_id"": 10,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 0.01,
                        ""diff"": 120.01
                    },
                    {
                        ""aspecting_planet"": ""Pluto"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 9,
                        ""aspected_planet_id"": 10,
                        ""aspect_type"": 5,
                        ""type"": ""Sextile"",
                        ""orb"": 5.16,
                        ""diff"": 65.16
                    },
                    {
                        ""aspecting_planet"": ""Ascendant"",
                        ""aspected_planet"": ""Midheaven"",
                        ""aspecting_planet_id"": 10,
                        ""aspected_planet_id"": 11,
                        ""aspect_type"": 4,
                        ""type"": ""Square"",
                        ""orb"": 0,
                        ""diff"": 90
                    }
                ],
                ""planets"": [
                    {
                        ""name"": ""Sun"",
                        ""full_degree"": 70.1697,
                        ""norm_degree"": 10.1697,
                        ""speed"": 0.9589,
                        ""is_retro"": ""false"",
                        ""sign_id"": 3,
                        ""sign"": ""Gemini"",
                        ""house"": 9
                    },
                    {
                        ""name"": ""Moon"",
                        ""full_degree"": 40.092,
                        ""norm_degree"": 10.092,
                        ""speed"": 14.4256,
                        ""is_retro"": ""false"",
                        ""sign_id"": 2,
                        ""sign"": ""Taurus"",
                        ""house"": 8
                    },
                    {
                        ""name"": ""Mars"",
                        ""full_degree"": 79.0466,
                        ""norm_degree"": 19.0466,
                        ""speed"": 0.6821,
                        ""is_retro"": ""false"",
                        ""sign_id"": 3,
                        ""sign"": ""Gemini"",
                        ""house"": 9
                    },
                    {
                        ""name"": ""Mercury"",
                        ""full_degree"": 91.7231,
                        ""norm_degree"": 1.7231,
                        ""speed"": 1.4718,
                        ""is_retro"": ""false"",
                        ""sign_id"": 4,
                        ""sign"": ""Cancer"",
                        ""house"": 9
                    },
                    {
                        ""name"": ""Jupiter"",
                        ""full_degree"": 53.3416,
                        ""norm_degree"": 23.3416,
                        ""speed"": 0.2322,
                        ""is_retro"": ""false"",
                        ""sign_id"": 2,
                        ""sign"": ""Taurus"",
                        ""house"": 8
                    },
                    {
                        ""name"": ""Venus"",
                        ""full_degree"": 67.1558,
                        ""norm_degree"": 7.1558,
                        ""speed"": 1.2289,
                        ""is_retro"": ""false"",
                        ""sign_id"": 3,
                        ""sign"": ""Gemini"",
                        ""house"": 9
                    },
                    {
                        ""name"": ""Saturn"",
                        ""full_degree"": 53.056,
                        ""norm_degree"": 23.056,
                        ""speed"": 0.1252,
                        ""is_retro"": ""false"",
                        ""sign_id"": 2,
                        ""sign"": ""Taurus"",
                        ""house"": 8
                    },
                    {
                        ""name"": ""Uranus"",
                        ""full_degree"": 320.8098,
                        ""norm_degree"": 20.8098,
                        ""speed"": -0.0049,
                        ""is_retro"": ""true"",
                        ""sign_id"": 11,
                        ""sign"": ""Aquarius"",
                        ""house"": 5
                    },
                    {
                        ""name"": ""Neptune"",
                        ""full_degree"": 306.435,
                        ""norm_degree"": 6.435,
                        ""speed"": -0.0118,
                        ""is_retro"": ""true"",
                        ""sign_id"": 11,
                        ""sign"": ""Aquarius"",
                        ""house"": 4
                    },
                    {
                        ""name"": ""Pluto"",
                        ""full_degree"": 251.579,
                        ""norm_degree"": 11.579,
                        ""speed"": -0.0271,
                        ""is_retro"": ""true"",
                        ""sign_id"": 9,
                        ""sign"": ""Sagittarius"",
                        ""house"": 3
                    },
                    {
                        ""name"": ""Node"",
                        ""full_degree"": 115.5338,
                        ""norm_degree"": 25.5338,
                        ""speed"": -0.1159,
                        ""is_retro"": ""true"",
                        ""sign_id"": 4,
                        ""sign"": ""Cancer"",
                        ""house"": 10
                    },
                    {
                        ""name"": ""Chiron"",
                        ""full_degree"": 254.42,
                        ""norm_degree"": 14.42,
                        ""speed"": -0.0705,
                        ""is_retro"": ""true"",
                        ""sign_id"": 9,
                        ""sign"": ""Sagittarius"",
                        ""house"": 3
                    },
                    {
                        ""name"": ""Part of Fortune"",
                        ""full_degree"": 156.3446,
                        ""norm_degree"": 6.3446,
                        ""speed"": 0,
                        ""is_retro"": ""false"",
                        ""sign_id"": 6,
                        ""sign"": ""Virgo"",
                        ""house"": 11
                    }
                ],
                ""lilith"": {
                    ""name"": ""Lilith"",
                    ""full_degree"": 280.2163,
                    ""norm_degree"": 10.2163,
                    ""speed"": 0.1109,
                    ""is_retro"": ""false"",
                    ""sign_id"": 10,
                    ""sign"": ""Capricorn"",
                    ""house"": 4
                }
            },
            ""fiend_details"": {
                ""ascendant"": 186.42234480081225,
                ""midheaven"": 96.4203334296655,
                ""vertex"": 277.2781580258426,
                ""houses"": [
                    {
                        ""house"": 1,
                        ""sign"": ""Libra"",
                        ""sign_id"": 7,
                        ""degree"": 186.42234
                    },
                    {
                        ""house"": 2,
                        ""sign"": ""Scorpio"",
                        ""sign_id"": 8,
                        ""degree"": 215.39624
                    },
                    {
                        ""house"": 3,
                        ""sign"": ""Sagittarius"",
                        ""sign_id"": 9,
                        ""degree"": 245.69053
                    },
                    {
                        ""house"": 4,
                        ""sign"": ""Capricorn"",
                        ""sign_id"": 10,
                        ""degree"": 276.42033
                    },
                    {
                        ""house"": 5,
                        ""sign"": ""Aquarius"",
                        ""sign_id"": 11,
                        ""degree"": 307.33237
                    },
                    {
                        ""house"": 6,
                        ""sign"": ""Pisces"",
                        ""sign_id"": 12,
                        ""degree"": 337.81387
                    },
                    {
                        ""house"": 7,
                        ""sign"": ""Aries"",
                        ""sign_id"": 1,
                        ""degree"": 6.42234
                    },
                    {
                        ""house"": 8,
                        ""sign"": ""Taurus"",
                        ""sign_id"": 2,
                        ""degree"": 35.39624
                    },
                    {
                        ""house"": 9,
                        ""sign"": ""Gemini"",
                        ""sign_id"": 3,
                        ""degree"": 65.69053
                    },
                    {
                        ""house"": 10,
                        ""sign"": ""Cancer"",
                        ""sign_id"": 4,
                        ""degree"": 96.42033
                    },
                    {
                        ""house"": 11,
                        ""sign"": ""Leo"",
                        ""sign_id"": 5,
                        ""degree"": 127.33237
                    },
                    {
                        ""house"": 12,
                        ""sign"": ""Virgo"",
                        ""sign_id"": 6,
                        ""degree"": 157.81387
                    }
                ],
                ""aspects"": [
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Mars"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 2,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 8.88,
                        ""diff"": 8.88
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Venus"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 5,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 3.01,
                        ""diff"": 3.01
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Neptune"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 8,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 3.73,
                        ""diff"": 123.73
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Pluto"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 9,
                        ""aspect_type"": 2,
                        ""type"": ""Opposition"",
                        ""orb"": 1.41,
                        ""diff"": 178.59
                    },
                    {
                        ""aspecting_planet"": ""Sun"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 0,
                        ""aspected_planet_id"": 10,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 3.75,
                        ""diff"": 116.25
                    },
                    {
                        ""aspecting_planet"": ""Moon"",
                        ""aspected_planet"": ""Neptune"",
                        ""aspecting_planet_id"": 1,
                        ""aspected_planet_id"": 8,
                        ""aspect_type"": 4,
                        ""type"": ""Square"",
                        ""orb"": 3.66,
                        ""diff"": 93.66
                    },
                    {
                        ""aspecting_planet"": ""Moon"",
                        ""aspected_planet"": ""Midheaven"",
                        ""aspecting_planet_id"": 1,
                        ""aspected_planet_id"": 11,
                        ""aspect_type"": 5,
                        ""type"": ""Sextile"",
                        ""orb"": 3.67,
                        ""diff"": 56.33
                    },
                    {
                        ""aspecting_planet"": ""Mars"",
                        ""aspected_planet"": ""Uranus"",
                        ""aspecting_planet_id"": 2,
                        ""aspected_planet_id"": 7,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 1.76,
                        ""diff"": 118.24
                    },
                    {
                        ""aspecting_planet"": ""Mars"",
                        ""aspected_planet"": ""Pluto"",
                        ""aspecting_planet_id"": 2,
                        ""aspected_planet_id"": 9,
                        ""aspect_type"": 2,
                        ""type"": ""Opposition"",
                        ""orb"": 7.47,
                        ""diff"": 172.53
                    },
                    {
                        ""aspecting_planet"": ""Mercury"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 3,
                        ""aspected_planet_id"": 10,
                        ""aspect_type"": 4,
                        ""type"": ""Square"",
                        ""orb"": 4.7,
                        ""diff"": 94.7
                    },
                    {
                        ""aspecting_planet"": ""Mercury"",
                        ""aspected_planet"": ""Midheaven"",
                        ""aspecting_planet_id"": 3,
                        ""aspected_planet_id"": 11,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 4.7,
                        ""diff"": 4.7
                    },
                    {
                        ""aspecting_planet"": ""Jupiter"",
                        ""aspected_planet"": ""Saturn"",
                        ""aspecting_planet_id"": 4,
                        ""aspected_planet_id"": 6,
                        ""aspect_type"": 1,
                        ""type"": ""Conjunction"",
                        ""orb"": 0.29,
                        ""diff"": 0.29
                    },
                    {
                        ""aspecting_planet"": ""Jupiter"",
                        ""aspected_planet"": ""Uranus"",
                        ""aspecting_planet_id"": 4,
                        ""aspected_planet_id"": 7,
                        ""aspect_type"": 4,
                        ""type"": ""Square"",
                        ""orb"": 2.53,
                        ""diff"": 92.53
                    },
                    {
                        ""aspecting_planet"": ""Venus"",
                        ""aspected_planet"": ""Neptune"",
                        ""aspecting_planet_id"": 5,
                        ""aspected_planet_id"": 8,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 0.72,
                        ""diff"": 120.72
                    },
                    {
                        ""aspecting_planet"": ""Venus"",
                        ""aspected_planet"": ""Pluto"",
                        ""aspecting_planet_id"": 5,
                        ""aspected_planet_id"": 9,
                        ""aspect_type"": 2,
                        ""type"": ""Opposition"",
                        ""orb"": 4.42,
                        ""diff"": 175.58
                    },
                    {
                        ""aspecting_planet"": ""Venus"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 5,
                        ""aspected_planet_id"": 10,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 0.73,
                        ""diff"": 119.27
                    },
                    {
                        ""aspecting_planet"": ""Saturn"",
                        ""aspected_planet"": ""Uranus"",
                        ""aspecting_planet_id"": 6,
                        ""aspected_planet_id"": 7,
                        ""aspect_type"": 4,
                        ""type"": ""Square"",
                        ""orb"": 2.25,
                        ""diff"": 92.25
                    },
                    {
                        ""aspecting_planet"": ""Neptune"",
                        ""aspected_planet"": ""Pluto"",
                        ""aspecting_planet_id"": 8,
                        ""aspected_planet_id"": 9,
                        ""aspect_type"": 5,
                        ""type"": ""Sextile"",
                        ""orb"": 5.14,
                        ""diff"": 54.86
                    },
                    {
                        ""aspecting_planet"": ""Neptune"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 8,
                        ""aspected_planet_id"": 10,
                        ""aspect_type"": 3,
                        ""type"": ""Trine"",
                        ""orb"": 0.01,
                        ""diff"": 120.01
                    },
                    {
                        ""aspecting_planet"": ""Pluto"",
                        ""aspected_planet"": ""Ascendant"",
                        ""aspecting_planet_id"": 9,
                        ""aspected_planet_id"": 10,
                        ""aspect_type"": 5,
                        ""type"": ""Sextile"",
                        ""orb"": 5.16,
                        ""diff"": 65.16
                    },
                    {
                        ""aspecting_planet"": ""Ascendant"",
                        ""aspected_planet"": ""Midheaven"",
                        ""aspecting_planet_id"": 10,
                        ""aspected_planet_id"": 11,
                        ""aspect_type"": 4,
                        ""type"": ""Square"",
                        ""orb"": 0,
                        ""diff"": 90
                    }
                ],
                ""planets"": [
                    {
                        ""name"": ""Sun"",
                        ""full_degree"": 70.1697,
                        ""norm_degree"": 10.1697,
                        ""speed"": 0.9589,
                        ""is_retro"": ""false"",
                        ""sign_id"": 3,
                        ""sign"": ""Gemini"",
                        ""house"": 9
                    },
                    {
                        ""name"": ""Moon"",
                        ""full_degree"": 40.092,
                        ""norm_degree"": 10.092,
                        ""speed"": 14.4256,
                        ""is_retro"": ""false"",
                        ""sign_id"": 2,
                        ""sign"": ""Taurus"",
                        ""house"": 8
                    },
                    {
                        ""name"": ""Mars"",
                        ""full_degree"": 79.0466,
                        ""norm_degree"": 19.0466,
                        ""speed"": 0.6821,
                        ""is_retro"": ""false"",
                        ""sign_id"": 3,
                        ""sign"": ""Gemini"",
                        ""house"": 9
                    },
                    {
                        ""name"": ""Mercury"",
                        ""full_degree"": 91.7231,
                        ""norm_degree"": 1.7231,
                        ""speed"": 1.4718,
                        ""is_retro"": ""false"",
                        ""sign_id"": 4,
                        ""sign"": ""Cancer"",
                        ""house"": 9
                    },
                    {
                        ""name"": ""Jupiter"",
                        ""full_degree"": 53.3416,
                        ""norm_degree"": 23.3416,
                        ""speed"": 0.2322,
                        ""is_retro"": ""false"",
                        ""sign_id"": 2,
                        ""sign"": ""Taurus"",
                        ""house"": 8
                    },
                    {
                        ""name"": ""Venus"",
                        ""full_degree"": 67.1558,
                        ""norm_degree"": 7.1558,
                        ""speed"": 1.2289,
                        ""is_retro"": ""false"",
                        ""sign_id"": 3,
                        ""sign"": ""Gemini"",
                        ""house"": 9
                    },
                    {
                        ""name"": ""Saturn"",
                        ""full_degree"": 53.056,
                        ""norm_degree"": 23.056,
                        ""speed"": 0.1252,
                        ""is_retro"": ""false"",
                        ""sign_id"": 2,
                        ""sign"": ""Taurus"",
                        ""house"": 8
                    },
                    {
                        ""name"": ""Uranus"",
                        ""full_degree"": 320.8098,
                        ""norm_degree"": 20.8098,
                        ""speed"": -0.0049,
                        ""is_retro"": ""true"",
                        ""sign_id"": 11,
                        ""sign"": ""Aquarius"",
                        ""house"": 5
                    },
                    {
                        ""name"": ""Neptune"",
                        ""full_degree"": 306.435,
                        ""norm_degree"": 6.435,
                        ""speed"": -0.0118,
                        ""is_retro"": ""true"",
                        ""sign_id"": 11,
                        ""sign"": ""Aquarius"",
                        ""house"": 4
                    },
                    {
                        ""name"": ""Pluto"",
                        ""full_degree"": 251.579,
                        ""norm_degree"": 11.579,
                        ""speed"": -0.0271,
                        ""is_retro"": ""true"",
                        ""sign_id"": 9,
                        ""sign"": ""Sagittarius"",
                        ""house"": 3
                    },
                    {
                        ""name"": ""Node"",
                        ""full_degree"": 115.5338,
                        ""norm_degree"": 25.5338,
                        ""speed"": -0.1159,
                        ""is_retro"": ""true"",
                        ""sign_id"": 4,
                        ""sign"": ""Cancer"",
                        ""house"": 10
                    },
                    {
                        ""name"": ""Chiron"",
                        ""full_degree"": 254.42,
                        ""norm_degree"": 14.42,
                        ""speed"": -0.0705,
                        ""is_retro"": ""true"",
                        ""sign_id"": 9,
                        ""sign"": ""Sagittarius"",
                        ""house"": 3
                    },
                    {
                        ""name"": ""Part of Fortune"",
                        ""full_degree"": 156.3446,
                        ""norm_degree"": 6.3446,
                        ""speed"": 0,
                        ""is_retro"": ""false"",
                        ""sign_id"": 6,
                        ""sign"": ""Virgo"",
                        ""house"": 11
                    }
                ],
                ""lilith"": {
                    ""name"": ""Lilith"",
                    ""full_degree"": 280.2163,
                    ""norm_degree"": 10.2163,
                    ""speed"": 0.1109,
                    ""is_retro"": ""false"",
                    ""sign_id"": 10,
                    ""sign"": ""Capricorn"",
                    ""house"": 4
                }
            }
        }
    }
}"		
											
Major Aspects and Connections			" API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/
"			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for a To conduct a For  Major Aspects and Connections are crucial in understanding the depth and dynamics of a friendship. Mercury aspects often play a pivotal role, highlighting the ease of communication, intellectual compatibility, and shared interests that form the foundation of a strong and lasting bond. Harmonious Moon aspects suggest emotional resonance, mutual nurturing, and a deep sense of comfort with one another, indicating how well friends support and understand each other on an emotional level. Venus aspects reflect compatibility in the areas of enjoyment, aesthetics, and social activities, showing how friends appreciate and connect through shared values and fun experiences, without the influence of romantic attraction. Jupiter aspects bring a sense of optimism, mutual growth, and expansion to the relationship, often through shared adventures, philosophical explorations, or common goals, while Saturn aspects provide stability, responsibility, and long-term commitment, indicating how the friends support each other's ambitions and can rely on one another through challenges. Outer planet aspects introduce deeper, transformative layers to the friendship: Pluto aspects suggest profound personal change or growth triggered by the relationship, while Neptune aspects speak to shared ideals, empathy, and sometimes a sense of spiritual connection. Uranus aspects bring an element of unpredictability and freedom, encouraging individuality and a sense of adventure, while also allowing for the expansion of perspectives and new experiences. Together, these aspects offer a rich tapestry of connections that define the unique dynamic of a friendship.","user_content":"I was born on May 31, 2000,  13:0 in  Bardhaman, West Bengal, India  'lat:23.24073,lon:87.86733,tzone:+05:30'. my friendship  relationship partner was born on May 31, 2000 13:0 at Bardhaman, West Bengal, India   'lat:23.24073,lon:87.86733,tzone:+05:30' I have added birth chart details of mine and friendship  relationship partner both now calculate Aspect and Conjunction of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response "},"toolname":"other","json":{"mydetails":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}},"fiend_details":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}}}}			"RESULTS : ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Sun Conjunct Venus\"",      \""data\"": \""The Sun conjunct Venus in both charts suggests a harmonious and pleasant connection, emphasizing shared values and mutual appreciation. This aspect indicates a natural affinity and enjoyment of each other's company, fostering a sense of camaraderie and warmth. In Gemini, this conjunction enhances communication and intellectual rapport, making conversations lively and engaging. The presence of Venus adds a layer of aesthetic appreciation, suggesting that both individuals may enjoy similar tastes in art, music, or social activities. This aspect is often associated with a strong sense of friendship and mutual respect, devoid of romantic complications, making it ideal for a platonic relationship.\""    },    {      \""title\"": \""Mercury Conjunct Midheaven\"",      \""data\"": \""Mercury conjunct Midheaven in both charts highlights a strong intellectual connection and shared ambitions. This aspect suggests that both individuals are likely to support each other's career goals and public image, providing valuable insights and advice. The conjunction in Cancer indicates a nurturing communication style, where both friends feel comfortable discussing personal and professional matters. This aspect enhances the ability to collaborate on projects or ideas, making them effective partners in any joint endeavors. The mutual understanding of each other's aspirations can lead to a supportive and motivating friendship.\""    },    {      \""title\"": \""Moon Square Neptune\"",      \""data\"": \""The Moon square Neptune in both charts introduces a layer of emotional complexity and sensitivity to the friendship. This aspect can lead to misunderstandings or idealizations, where one or both individuals may project unrealistic expectations onto the other. In Taurus and Aquarius, this square suggests a potential clash between emotional needs and idealistic visions, requiring conscious effort to maintain clarity and honesty. Despite these challenges, the aspect also fosters empathy and compassion, encouraging both friends to support each other through emotional ups and downs. Awareness of this dynamic can help mitigate potential misunderstandings and strengthen the bond.\""    },    {      \""title\"": \""Jupiter Conjunct Saturn\"",      \""data\"": \""Jupiter conjunct Saturn in both charts indicates a balanced approach to growth and responsibility within the friendship. This aspect suggests that both individuals can provide a stabilizing influence on each other, combining optimism with practicality. In Taurus, this conjunction emphasizes shared values related to security and material stability, encouraging mutual support in achieving long-term goals. The aspect fosters a sense of commitment and reliability, where both friends can depend on each other during challenging times. This balance of expansion and discipline can lead to a lasting and productive friendship.\""    },    {      \""title\"": \""Venus Trine Neptune\"",      \""data\"": \""Venus trine Neptune in both charts enhances the friendship with a sense of idealism and creativity. This aspect suggests a shared appreciation for beauty and art, where both individuals may inspire each other's creative pursuits. In Gemini and Aquarius, the trine facilitates open-mindedness and a willingness to explore new ideas and experiences together. The aspect fosters a sense of spiritual connection and empathy, allowing both friends to understand and support each other's dreams and aspirations. This harmonious connection can lead to a deeply fulfilling and inspiring friendship.\""    }  ],  \""summary\"": \""The astrological aspects in both charts reveal a strong foundation for a harmonious and supportive friendship. The conjunctions and trines indicate shared values, intellectual rapport, and mutual appreciation, while the squares introduce opportunities for growth through understanding and empathy. The presence of both personal and outer planet aspects suggests a dynamic and multifaceted relationship, capable of enduring challenges and fostering personal development.\"",  \""recommendations\"": \""To enhance the friendship, focus on open communication and mutual support, especially in areas highlighted by the conjunctions and trines. Be mindful of potential misunderstandings indicated by the squares, and strive for clarity and honesty in interactions. Embrace shared interests and creative pursuits to strengthen the bond, and provide encouragement and stability to support each other's goals and aspirations.\""}```"",
    ""prompt_tokens"": 4831,"		
											
Major Aspects and Connections			" API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/
"			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for a To conduct a For  Major Aspects and Connections are crucial in understanding the depth and dynamics of a friendship. Mercury aspects often play a pivotal role, highlighting the ease of communication, intellectual compatibility, and shared interests that form the foundation of a strong and lasting bond. Harmonious Moon aspects suggest emotional resonance, mutual nurturing, and a deep sense of comfort with one another, indicating how well friends support and understand each other on an emotional level. Venus aspects reflect compatibility in the areas of enjoyment, aesthetics, and social activities, showing how friends appreciate and connect through shared values and fun experiences, without the influence of romantic attraction. Jupiter aspects bring a sense of optimism, mutual growth, and expansion to the relationship, often through shared adventures, philosophical explorations, or common goals, while Saturn aspects provide stability, responsibility, and long-term commitment, indicating how the friends support each other's ambitions and can rely on one another through challenges. Outer planet aspects introduce deeper, transformative layers to the friendship: Pluto aspects suggest profound personal change or growth triggered by the relationship, while Neptune aspects speak to shared ideals, empathy, and sometimes a sense of spiritual connection. Uranus aspects bring an element of unpredictability and freedom, encouraging individuality and a sense of adventure, while also allowing for the expansion of perspectives and new experiences. Together, these aspects offer a rich tapestry of connections that define the unique dynamic of a friendship.","user_content":"I was born on May 31, 2000,  13:0 in  Bardhaman, West Bengal, India  'lat:23.24073,lon:87.86733,tzone:+05:30'. my friendship  relationship partner was born on May 31, 2000 13:0 at Bardhaman, West Bengal, India   'lat:23.24073,lon:87.86733,tzone:+05:30' I have added birth chart details of mine and friendship  relationship partner both now calculate Aspect and Conjunction of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response "},"toolname":"other","json":{"mydetails":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}},"fiend_details":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}}}}			"RESULTS : ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Sun Conjunct Venus\"",      \""data\"": \""The Sun conjunct Venus in both charts suggests a harmonious and pleasant connection, emphasizing shared values and mutual appreciation. This aspect indicates a natural affinity and enjoyment of each other's company, fostering a sense of camaraderie and warmth. In Gemini, this conjunction enhances communication and intellectual rapport, making conversations lively and engaging. The presence of Venus adds a layer of aesthetic appreciation, suggesting that both individuals may enjoy similar tastes in art, music, or social activities. This aspect is often associated with a strong sense of friendship and mutual respect, devoid of romantic complications, making it ideal for a platonic relationship.\""    },    {      \""title\"": \""Mercury Conjunct Midheaven\"",      \""data\"": \""Mercury conjunct Midheaven in both charts highlights a strong intellectual connection and shared ambitions. This aspect suggests that both individuals are likely to support each other's career goals and public image, providing valuable insights and advice. The conjunction in Cancer indicates a nurturing communication style, where both friends feel comfortable discussing personal and professional matters. This aspect enhances the ability to collaborate on projects or ideas, making them effective partners in any joint endeavors. The mutual understanding of each other's aspirations can lead to a supportive and motivating friendship.\""    },    {      \""title\"": \""Moon Square Neptune\"",      \""data\"": \""The Moon square Neptune in both charts introduces a layer of emotional complexity and sensitivity to the friendship. This aspect can lead to misunderstandings or idealizations, where one or both individuals may project unrealistic expectations onto the other. In Taurus and Aquarius, this square suggests a potential clash between emotional needs and idealistic visions, requiring conscious effort to maintain clarity and honesty. Despite these challenges, the aspect also fosters empathy and compassion, encouraging both friends to support each other through emotional ups and downs. Awareness of this dynamic can help mitigate potential misunderstandings and strengthen the bond.\""    },    {      \""title\"": \""Jupiter Conjunct Saturn\"",      \""data\"": \""Jupiter conjunct Saturn in both charts indicates a balanced approach to growth and responsibility within the friendship. This aspect suggests that both individuals can provide a stabilizing influence on each other, combining optimism with practicality. In Taurus, this conjunction emphasizes shared values related to security and material stability, encouraging mutual support in achieving long-term goals. The aspect fosters a sense of commitment and reliability, where both friends can depend on each other during challenging times. This balance of expansion and discipline can lead to a lasting and productive friendship.\""    },    {      \""title\"": \""Venus Trine Neptune\"",      \""data\"": \""Venus trine Neptune in both charts enhances the friendship with a sense of idealism and creativity. This aspect suggests a shared appreciation for beauty and art, where both individuals may inspire each other's creative pursuits. In Gemini and Aquarius, the trine facilitates open-mindedness and a willingness to explore new ideas and experiences together. The aspect fosters a sense of spiritual connection and empathy, allowing both friends to understand and support each other's dreams and aspirations. This harmonious connection can lead to a deeply fulfilling and inspiring friendship.\""    }  ],  \""summary\"": \""The astrological aspects in both charts reveal a strong foundation for a harmonious and supportive friendship. The conjunctions and trines indicate shared values, intellectual rapport, and mutual appreciation, while the squares introduce opportunities for growth through understanding and empathy. The presence of both personal and outer planet aspects suggests a dynamic and multifaceted relationship, capable of enduring challenges and fostering personal development.\"",  \""recommendations\"": \""To enhance the friendship, focus on open communication and mutual support, especially in areas highlighted by the conjunctions and trines. Be mindful of potential misunderstandings indicated by the squares, and strive for clarity and honesty in interactions. Embrace shared interests and creative pursuits to strengthen the bond, and provide encouragement and stability to support each other's goals and aspirations.\""}```"",
    ""prompt_tokens"": 4831,"		
											
Compatibility Score or Summary			" API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/
"			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for For generating The overall compatibility of this friendship can be assessed through the astrological lenses of planetary aspects, house placements, and elemental balance. If the Sun, Moon, or Ascendant are well-aligned between the two charts, there will be a natural flow of understanding and shared energy. For example, harmonious aspects between the Suns of both individuals (such as a trine or sextile) create a sense of ease and mutual respect, with each person understanding the other's core identity. If there are supportive aspects between the Moon and Venus, emotional needs will be met, and the friendship can feel nurturing and affectionate. Shared planetary placements in complementary houses, such as one person's Venus in the other's 7th house, can foster strong mutual attraction and a sense of partnership. However, challenging aspects such as squares or oppositions (e.g., Mars square Mars or Saturn opposing the Sun) may indicate areas of friction, such as differences in approach or long-term goals, requiring conscious effort to navigate. Additionally, an imbalance in elemental energies—where one individual has a predominance of fire or earth, and the other has more water or air—could lead to misunderstandings. For example, a water-dominant person might seek emotional depth, while a fire-dominant person may be more action-oriented, which could cause tension if not understood. Growth in the friendship will come through acknowledging and embracing each other's differences while capitalizing on shared strengths, especially in emotional support (Moon/Venus) and communication (Mercury aspects).","user_content":"I was born on May 31, 2000,  13:0 in  Bardhaman, West Bengal, India  'lat:23.24073,lon:87.86733,tzone:+05:30'. my friendship  relationship partner was born on May 31, 2000 13:0 at Bardhaman, West Bengal, India   'lat:23.24073,lon:87.86733' I have added birth chart details of mine and friendship  relationship partner both now calculate compatibility score or summery of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response "},"toolname":"other","json":{"mydetails":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}},"fiend_details":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}}}}			"RESULTS : ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Sun Conjunction Mars\"",      \""data\"": \""The Sun in conjunction with Mars in both charts indicates a strong drive and energy in this friendship. This aspect suggests that both individuals are likely to be highly motivated and action-oriented, sharing a dynamic and enthusiastic approach to life. The conjunction can lead to a competitive spirit, which, if channeled positively, can result in mutual encouragement and support. However, there is a potential for clashes if both parties are not mindful of each other's need for independence and leadership. Astrologically, this aspect enhances the potential for a vibrant and energetic connection, but it requires conscious effort to avoid conflicts.\""    },    {      \""title\"": \""Venus Trine Neptune\"",      \""data\"": \""The trine between Venus and Neptune in both charts suggests a harmonious and idealistic connection in the friendship. This aspect indicates a shared appreciation for beauty, art, and spirituality, fostering a sense of compassion and understanding. The trine allows for a natural flow of affection and empathy, making it easy for both individuals to support each other's dreams and aspirations. Astrologically, this aspect enhances the emotional and creative bond, providing a sense of inspiration and mutual admiration. However, there is a need to remain grounded to avoid unrealistic expectations or idealization.\""    },    {      \""title\"": \""Moon Square Neptune\"",      \""data\"": \""The square between the Moon and Neptune in both charts indicates potential challenges in emotional understanding. This aspect can lead to misunderstandings or confusion in expressing feelings, as Neptune's influence may cloud the Moon's emotional clarity. Astrologically, this square suggests that both individuals need to work on clear communication and setting realistic emotional boundaries. While there is a potential for deep emotional connection, it requires effort to avoid misinterpretations and emotional disillusionment. Embracing honesty and transparency can help navigate this challenging aspect.\""    },    {      \""title\"": \""Jupiter Conjunction Saturn\"",      \""data\"": \""The conjunction of Jupiter and Saturn in both charts indicates a balanced approach to growth and responsibility in the friendship. This aspect suggests that both individuals can support each other's ambitions while maintaining a sense of discipline and structure. Astrologically, this conjunction provides a stable foundation for long-term goals and mutual support, as Jupiter's optimism is tempered by Saturn's realism. However, there is a need to balance expansion with caution, ensuring that both parties remain aligned in their shared objectives. This aspect enhances the potential for a productive and enduring friendship.\""    },    {      \""title\"": \""Mercury Conjunction Midheaven\"",      \""data\"": \""The conjunction of Mercury with the Midheaven in both charts highlights a strong focus on communication and shared goals in the friendship. This aspect suggests that both individuals are likely to engage in intellectual pursuits and discussions, supporting each other's career and public aspirations. Astrologically, this conjunction enhances the potential for collaboration and mutual understanding in professional or public endeavors. However, there is a need to ensure that communication remains clear and constructive, avoiding misunderstandings that could impact shared objectives. This aspect fosters a sense of purpose and direction in the friendship.\""    },    {      \""title\"": \""Summary\"",      \""data\"": \""Overall, the compatibility of this friendship is marked by a blend of dynamic energy and harmonious connections. The presence of conjunctions and trines suggests a strong potential for mutual support and understanding, while squares indicate areas that require conscious effort. The shared aspects in both charts highlight a balance between action and reflection, with a focus on communication and shared goals. Astrologically, this friendship has the potential to be both inspiring and productive, provided that both individuals remain mindful of each other's needs and boundaries.\""    },    {      \""title\"": \""Recommendations\"",      \""data\"": \""To enhance the compatibility of this friendship, it is important to focus on clear communication and setting realistic expectations. Embracing each other's strengths and differences can foster a deeper connection, while addressing potential challenges with honesty and transparency. Astrologically, nurturing the harmonious aspects and working on the challenging ones can lead to a more balanced and fulfilling friendship. Engaging in shared activities that align with both individuals' interests can strengthen the bond, while maintaining a sense of independence and personal growth.\""    }  ]}```"",
    ""prompt_tokens"": 4851,"		
											
Elemental Balance			" API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/
"			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for In relationship astrology, Elemental Balance between two individuals' charts reveals the harmony or imbalance of the four classical elements—Fire, Earth, Air, and Water—and how these elements manifest in their emotional, intellectual, and practical interactions. Fire signs (Aries, Leo, Sagittarius) bring passion, energy, and enthusiasm, while Earth signs (Taurus, Virgo, Capricorn) offer groundedness, stability, and a practical approach. Air signs (Gemini, Libra, Aquarius) emphasize communication, intellectual connection, and adaptability, whereas Water signs (Cancer, Scorpio, Pisces) are sensitive, intuitive, and emotionally deep. A balanced elemental composition fosters a natural flow between the two individuals, with each element complementing the others. However, if one element is overly dominant or lacking, it can create friction or unmet needs within the friendship, such as emotional disconnect (lack of Water) or intellectual tension (lack of Air). Modalities of the signs—Cardinal, Fixed, and Mutable—further refine how each person approaches challenges and shared experiences. Cardinal signs (Aries, Cancer, Libra, Capricorn) are initiators, eager to start new projects and lead the way. Fixed signs (Taurus, Leo, Scorpio, Aquarius) are steady, determined, and focused on maintaining consistency and follow-through. Mutable signs (Gemini, Virgo, Sagittarius, Pisces) are adaptable and flexible, capable of adjusting to changing circumstances. The interaction of modalities between friends can reveal how they handle conflict, cooperation, and change: Cardinal signs might push for action, Fixed signs will seek stability, and Mutable signs will provide flexibility. A balanced mix of these modalities can foster a dynamic, harmonious relationship, where each person’s approach is respected and valued.","user_content":"I was born on May 31, 2000,  13:0 in  Bardhaman, West Bengal, India  'lat:23.24073,lon:87.86733,tzone:+05:30'. my friendship  relationship partner was born on May 31, 2000 13:0 at Bardhaman, West Bengal, India   'lat:23.24073,lon:87.86733'  I have added birth chart details of mine and my friendship  relationship partner both now calculate elemental balance of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response "},"toolname":"other","json":{"mydetails":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}},"fiend_details":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}}}}			"RESULTS :     ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Elemental Balance\"",      \""data\"": \""Both you and your friendship partner have a strong presence of Air elements, with the Sun, Mars, and Venus in Gemini. This indicates a relationship that thrives on communication, intellectual exchange, and adaptability. The lack of Water elements in both charts suggests a potential challenge in connecting on an emotional level, which might lead to feelings of emotional disconnect. The Earth element is present through the Moon, Jupiter, and Saturn in Taurus, providing some stability and practicality to the relationship. However, the absence of Fire elements could mean a lack of passion and spontaneity, which might need to be consciously cultivated.\""    },    {      \""title\"": \""Modalities\"",      \""data\"": \""Your charts are dominated by Mutable signs, with Gemini and Sagittarius being prominent. This suggests a relationship that is flexible, adaptable, and open to change. However, the lack of Cardinal signs might indicate a challenge in initiating new projects or taking decisive actions together. The presence of Fixed signs through Taurus and Aquarius provides some stability and consistency, but the absence of a strong Cardinal influence might require conscious effort to take the lead in the relationship. The balance of modalities suggests a dynamic where adaptability is key, but leadership and initiative might need to be developed.\""    },    {      \""title\"": \""Sun and Mars Conjunction\"",      \""data\"": \""The Sun and Mars are conjunct in Gemini in both charts, indicating a shared drive and energy in intellectual pursuits and communication. This aspect fosters a strong mental connection and a shared enthusiasm for learning and exploring new ideas. However, the conjunction can also lead to competitiveness or impatience if not managed well. The placement in the 9th house emphasizes a shared interest in philosophy, travel, and higher learning. This aspect suggests a relationship that is energized by shared intellectual goals and pursuits.\""    },    {      \""title\"": \""Venus and Neptune Trine\"",      \""data\"": \""Venus in Gemini trines Neptune in Aquarius in both charts, suggesting a harmonious and idealistic connection in matters of love and friendship. This aspect fosters creativity, imagination, and a sense of spiritual connection. The trine aspect indicates an easy flow of energy, allowing both individuals to inspire and uplift each other. However, there is a potential for idealizing the relationship, which might lead to unrealistic expectations. The placement of Neptune in the 4th house suggests that this idealism might be rooted in shared values or a sense of home and belonging.\""    },    {      \""title\"": \""Moon and Midheaven Sextile\"",      \""data\"": \""The Moon in Taurus sextiles the Midheaven in Cancer in both charts, indicating a supportive and nurturing connection in terms of career and public image. This aspect suggests that both individuals can provide emotional support and encouragement in each other's professional endeavors. The sextile aspect indicates opportunities for growth and collaboration in achieving shared goals. The placement of the Moon in the 8th house suggests that this support might also extend to shared resources or financial matters. This aspect fosters a sense of security and mutual support in the relationship.\""    },    {      \""title\"": \""Summary\"",      \""data\"": \""The elemental balance in your friendship suggests a strong intellectual connection, but a potential challenge in emotional bonding. The dominance of Mutable signs indicates adaptability, but a lack of initiative might be a challenge. The conjunction of Sun and Mars suggests shared energy and enthusiasm, while the trine of Venus and Neptune indicates a harmonious and idealistic connection. The sextile of the Moon and Midheaven suggests mutual support in professional matters. Overall, the relationship is characterized by intellectual stimulation and adaptability, but emotional connection and initiative might need conscious effort.\""    },    {      \""title\"": \""Recommendations\"",      \""data\"": \""To enhance the emotional connection, consider engaging in activities that foster emotional bonding, such as sharing personal experiences or engaging in creative pursuits together. To address the lack of initiative, set shared goals and encourage each other to take the lead in different areas of the relationship. Cultivate spontaneity and passion by trying new activities or exploring new interests together. Embrace the intellectual connection by engaging in stimulating conversations and learning experiences. Overall, focus on balancing the elements and modalities to create a harmonious and fulfilling friendship.\""    }  ]}```"",
"		
											
Timing and Transits			" API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/
"			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation important aspects of assessing the potential for In relationship astrology,In the Timing and Transits in astrology offer a deep look into how the current planetary movements influence the dynamics of a relationship, specifically focusing on a composite chart, which represents the relationship itself. When examining current transits to the composite chart, the positions of transiting planets such as Saturn, Uranus, or Pluto can reveal pivotal moments when the friendship might undergo significant changes—whether deepening, facing challenges, or needing more space. For instance, transiting Saturn square the composite Sun could indicate a time when responsibilities or boundaries are tested, while a harmonious transit from Venus might enhance affection and mutual support. Personal transits and progressions further illuminate how each individual’s personal growth intersects with the relationship. For example, if one friend is experiencing a Pluto square to their natal Moon, they may feel emotionally intense or transformative, which could affect the emotional tone of the friendship. Meanwhile, the other person might be going through a Jupiter return, signaling a time of expansion and optimism that could help counterbalance any tension. Lastly, long-term friendship dynamics are guided by the upcoming transits and progressions to both the composite and individual charts, forecasting periods of collective growth, shared activities, or potential shifts in the bond. For example, a future Neptune trine to the composite Midheaven could bring shared spiritual or creative pursuits, while a Uranus opposition to the composite Moon could signal a sudden, unexpected shift in emotional intimacy. All these planetary movements can indicate times when the friendship might strengthen, face challenges, or evolve into a new phase.","user_content":"I was born on May 31, 2000,  13:0 in  Bardhaman, West Bengal, India  'lat:23.24073,lon:87.86733,tzone:+05:30'. my friendship  relationship partner was born on May 31, 2000 13:0 at Bardhaman, West Bengal, India   'lat:23.24073,lon:87.86733' I have added birth chart details of mine and my friendship  relationship partner both now calculate timing and transit of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response  "},"toolname":"other","json":{"mydetails":{"month_start_date":"1-7-2025","month_end_date":"31-7-2025","ascendant":"Libra","transit_relation":[{"transit_planet":"Mercury","natal_planet":"Ascendant","type":"Sextile","orb":0.08,"date":"2-7-2025"},{"transit_planet":"Mars","natal_planet":"Moon","type":"Trine","orb":0.17,"date":"5-7-2025"},{"transit_planet":"Mars","natal_planet":"Sun","type":"Square","orb":0.1,"date":"5-7-2025"},{"transit_planet":"Jupiter","natal_planet":"Ascendant","type":"Square","orb":0.05,"date":"8-7-2025"},{"transit_planet":"Venus","natal_planet":"Ascendant","type":"Trine","orb":0.16,"date":"10-7-2025"},{"transit_planet":"Venus","natal_planet":"Venus","type":"Conjunction","orb":0.22,"date":"11-7-2025"},{"transit_planet":"Venus","natal_planet":"Sun","type":"Conjunction","orb":0.55,"date":"13-7-2025"},{"transit_planet":"Venus","natal_planet":"Mars","type":"Conjunction","orb":0.38,"date":"21-7-2025"},{"transit_planet":"Jupiter","natal_planet":"Moon","type":"Sextile","orb":0.05,"date":"24-7-2025"},{"transit_planet":"Saturn","natal_planet":"Mercury","type":"Square","orb":0.01,"date":"29-7-2025"},{"transit_planet":"Mercury","natal_planet":"Moon","type":"Square","orb":0.18,"date":"30-7-2025"},{"transit_planet":"Mercury","natal_planet":"Sun","type":"Sextile","orb":0.1,"date":"30-7-2025"},{"transit_planet":"Neptune","natal_planet":"Mercury","type":"Square","orb":0.27,"date":"31-7-2025"}],"retrogrades":[],"moon_phase":[]},"fiend_details":{"month_start_date":"1-7-2025","month_end_date":"31-7-2025","ascendant":"Libra","transit_relation":[{"transit_planet":"Mercury","natal_planet":"Ascendant","type":"Sextile","orb":0.08,"date":"2-7-2025"},{"transit_planet":"Mars","natal_planet":"Moon","type":"Trine","orb":0.17,"date":"5-7-2025"},{"transit_planet":"Mars","natal_planet":"Sun","type":"Square","orb":0.1,"date":"5-7-2025"},{"transit_planet":"Jupiter","natal_planet":"Ascendant","type":"Square","orb":0.05,"date":"8-7-2025"},{"transit_planet":"Venus","natal_planet":"Ascendant","type":"Trine","orb":0.16,"date":"10-7-2025"},{"transit_planet":"Venus","natal_planet":"Venus","type":"Conjunction","orb":0.22,"date":"11-7-2025"},{"transit_planet":"Venus","natal_planet":"Sun","type":"Conjunction","orb":0.55,"date":"13-7-2025"},{"transit_planet":"Venus","natal_planet":"Mars","type":"Conjunction","orb":0.38,"date":"21-7-2025"},{"transit_planet":"Jupiter","natal_planet":"Moon","type":"Sextile","orb":0.05,"date":"24-7-2025"},{"transit_planet":"Saturn","natal_planet":"Mercury","type":"Square","orb":0.01,"date":"29-7-2025"},{"transit_planet":"Mercury","natal_planet":"Moon","type":"Square","orb":0.18,"date":"30-7-2025"},{"transit_planet":"Mercury","natal_planet":"Sun","type":"Sextile","orb":0.1,"date":"30-7-2025"},{"transit_planet":"Neptune","natal_planet":"Mercury","type":"Square","orb":0.27,"date":"31-7-2025"}],"retrogrades":[],"moon_phase":[]}}}			"RESULTS :     ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Mercury Sextile Ascendant\"",      \""data\"": \""The transit of Mercury sextile your Ascendant on July 2, 2025, suggests a period where communication flows smoothly in your friendship. This aspect enhances mutual understanding and the ability to articulate thoughts clearly, making it an excellent time for discussions and planning. The sextile aspect indicates a harmonious interaction, allowing both of you to express yourselves without misunderstandings. This transit can also bring new ideas and perspectives into the friendship, fostering growth and learning. The influence of Mercury, the planet of communication, ensures that any conversations during this time are likely to be productive and insightful.\""    },    {      \""title\"": \""Mars Trine Moon\"",      \""data\"": \""On July 5, 2025, Mars trines your Moon, bringing a surge of energy and emotional drive to your friendship. This aspect is known for its ability to boost confidence and assertiveness, allowing both of you to pursue shared goals with enthusiasm. The trine aspect signifies ease and flow, suggesting that emotional exchanges are likely to be positive and supportive. Mars' influence can also bring a sense of adventure and spontaneity, encouraging you both to engage in activities that strengthen your bond. This is a time when emotional connections can deepen, as you both feel more in tune with each other's needs and desires.\""    },    {      \""title\"": \""Mars Square Sun\"",      \""data\"": \""The transit of Mars square your Sun on July 5, 2025, indicates a period of potential tension and conflict in your friendship. This aspect can bring challenges related to ego and assertiveness, as both of you may feel more competitive or defensive. The square aspect suggests friction, requiring conscious effort to navigate disagreements and avoid unnecessary arguments. Mars' influence can lead to impulsive actions or words, so it's important to practice patience and understanding. This transit is a test of your ability to balance individual desires with the needs of the friendship, encouraging growth through conflict resolution.\""    },    {      \""title\"": \""Venus Trine Ascendant\"",      \""data\"": \""On July 10, 2025, Venus trines your Ascendant, bringing harmony and affection into your friendship. This aspect enhances the sense of camaraderie and mutual appreciation, making it a wonderful time for social activities and bonding. The trine aspect indicates ease and flow, allowing both of you to enjoy each other's company without tension. Venus' influence can also bring a sense of beauty and pleasure, encouraging you to engage in activities that bring joy and relaxation. This transit is an opportunity to strengthen your friendship through shared experiences and expressions of gratitude.\""    },    {      \""title\"": \""Saturn Square Mercury\"",      \""data\"": \""The transit of Saturn square your Mercury on July 29, 2025, suggests a period of potential communication challenges in your friendship. This aspect can bring delays or misunderstandings, requiring patience and careful consideration in conversations. The square aspect indicates tension, suggesting that both of you may need to work harder to express yourselves clearly and avoid misinterpretations. Saturn's influence can also bring a sense of seriousness or responsibility, encouraging you to address any unresolved issues in the friendship. This transit is a test of your ability to communicate effectively and maintain clarity in your interactions.\""    },    {      \""title\"": \""Summary\"",      \""data\"": \""The upcoming transits in July 2025 indicate a dynamic period for your friendship, with opportunities for growth and challenges to navigate. Positive aspects like Mercury sextile Ascendant and Venus trine Ascendant suggest harmonious communication and mutual appreciation. However, challenging aspects like Mars square Sun and Saturn square Mercury highlight potential conflicts and communication hurdles. Overall, this period encourages both of you to focus on effective communication and conflict resolution to strengthen your bond.\""    },    {      \""title\"": \""Recommendations\"",      \""data\"": \""During this period, prioritize open and honest communication to navigate potential challenges. Use the harmonious transits to engage in activities that strengthen your bond and bring joy. Be mindful of impulsive actions or words during challenging transits, and practice patience and understanding. Consider addressing any unresolved issues in the friendship to prevent misunderstandings. Embrace opportunities for growth and learning, and focus on maintaining a balanced and supportive dynamic.\""    }  ]}```"",
"		
											
Karmic and Soulmate Indicators			" API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/
"			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation important aspects of assessing the potential for In relationship astrology, karmic and supportive indicators in a friendship can be seen through the relationship between Chiron (the Wounded Healer) and the Lunar Nodes (North and South Nodes of the Moon), as they reveal how the individuals contribute to each other’s healing and growth. A prominent Chiron aspect, such as Chiron conjunct one of the Nodes or forming harmonious aspects to personal planets, suggests that the friends may share deep emotional wounds and offer each other a space for mutual healing. These friendships often involve learning important life lessons about vulnerability, compassion, and forgiveness, as both individuals help each other confront and transcend old pain. The Lunar Nodes indicate the soul’s evolutionary path, so when they connect with personal planets in the natal charts of friends, it can create a sense of destiny or a deeper understanding between them, as if they have met to support one another on their life’s journey. Additionally, aspects to significant asteroids like Pallas, Vesta, and Ceres further define the unique ways in which each friend provides support. For instance, Pallas might indicate shared intellectual pursuits or wisdom-based support, Vesta could show where one friend is particularly devoted to helping the other with focus or dedication, and Ceres points to where nurturing and care are exchanged, especially in times of emotional need. These astrological markers suggest a relationship not just of fun or companionship, but of deep emotional connection and mutual growth, where each person plays a role in the other's healing and soul development.","user_content":"I was born on May 31, 2000,  13:0 in  Bardhaman, West Bengal, India  'lat:23.24073,lon:87.86733,tzone:+05:30'. my friendship  relationship partne was born on May 31, 2000 13:0 at Bardhaman, West Bengal, India   'lat:23.24073,lon:87.86733' I have added birth chart details of mine and my friendship  relationship partne both now calculate Karmic and supportive Indicators of this partnership  in {data:[{title:data}]}  exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response  "},"toolname":"other","json":{"mydetails":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}},"fiend_details":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}}}}			"RESULTS :     ""ai_response"": ""```json{  \""data\"": [    {      \""title\"": \""Chiron and Lunar Nodes\"",      \""data\"": \""In your friendship, both Chiron and the Lunar Nodes play a significant role in defining the karmic and supportive aspects of your relationship. Chiron, known as the Wounded Healer, is positioned in Sagittarius in the 3rd house for both of you, indicating a shared journey of healing through communication and learning. This placement suggests that your friendship is a space where you both can address deep-seated wounds related to self-expression and understanding. The North Node in Cancer in the 10th house emphasizes a shared destiny towards nurturing and emotional growth, particularly in public or career-related settings. This connection indicates that your friendship is not only about personal healing but also about supporting each other in achieving emotional fulfillment and success in your respective life paths.\""    },    {      \""title\"": \""Sun Conjunct Venus\"",      \""data\"": \""The Sun and Venus are conjunct in Gemini in the 9th house for both of you, highlighting a harmonious and affectionate bond. This aspect suggests that your friendship is characterized by mutual admiration and a shared love for intellectual pursuits and exploration. The 9th house emphasis indicates that your relationship thrives on philosophical discussions, travel, and a mutual quest for knowledge. This conjunction enhances the supportive nature of your friendship, as you both inspire each other to broaden your horizons and embrace new experiences. The presence of Venus adds a layer of charm and diplomacy, ensuring that your interactions are pleasant and filled with mutual respect.\""    },    {      \""title\"": \""Mars Trine Uranus\"",      \""data\"": \""Mars in Gemini forms a trine with Uranus in Aquarius in the 5th house, suggesting a dynamic and innovative friendship. This aspect indicates that you both bring a sense of excitement and spontaneity to each other's lives, encouraging each other to take risks and embrace change. The 5th house influence highlights a shared passion for creativity and self-expression, making your friendship a source of inspiration and motivation. This trine aspect fosters a supportive environment where you both feel free to explore unconventional ideas and pursue your individual passions without fear of judgment. The energy of Mars and Uranus together ensures that your friendship remains lively and full of surprises.\""    },    {      \""title\"": \""Moon Sextile Midheaven\"",      \""data\"": \""The Moon in Taurus forms a sextile with the Midheaven in Cancer, indicating a supportive emotional connection that influences your public and professional lives. This aspect suggests that your friendship provides a stable emotional foundation, allowing you both to pursue your ambitions with confidence. The Moon's placement in the 8th house emphasizes a deep emotional bond, while the Midheaven in Cancer highlights a shared focus on nurturing and caring for each other's aspirations. This sextile aspect ensures that your friendship is not only emotionally fulfilling but also instrumental in helping you both achieve your career goals and public recognition.\""    },    {      \""title\"": \""Jupiter Conjunct Saturn\"",      \""data\"": \""Jupiter and Saturn are conjunct in Taurus in the 8th house, indicating a friendship built on shared values and a mutual understanding of life's deeper mysteries. This conjunction suggests that your relationship is characterized by a balance between expansion and discipline, allowing you both to grow and achieve stability together. The 8th house influence highlights a shared interest in transformation and personal growth, making your friendship a catalyst for profound change and development. This aspect ensures that your friendship is not only supportive but also instrumental in helping you both navigate life's challenges with wisdom and resilience.\""    }  ],  \""summary\"": \""Your friendship is marked by a deep karmic connection, with Chiron and the Lunar Nodes playing a significant role in your mutual healing and growth. The conjunctions of the Sun with Venus and Jupiter with Saturn highlight a harmonious and supportive bond, characterized by shared values and intellectual pursuits. Trine and sextile aspects, such as Mars with Uranus and the Moon with the Midheaven, add a dynamic and emotionally fulfilling dimension to your relationship. Overall, your friendship is a source of inspiration, motivation, and mutual support, helping you both achieve personal and professional success.\"",  \""recommendations\"": \""Embrace the intellectual and philosophical aspects of your friendship, as they provide a strong foundation for growth. Use the supportive energy of your relationship to pursue creative and professional goals, knowing that you have each other's backing. Be open to change and innovation, as your friendship thrives on spontaneity and new experiences. Nurture the emotional bond you share, ensuring that your friendship remains a source of comfort and stability. Finally, continue to explore the deeper aspects of life together, as your shared journey is one of transformation and mutual development.\""}```"",
"		