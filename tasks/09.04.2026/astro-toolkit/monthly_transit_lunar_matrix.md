# Walkthrough: Tropical Transits Monthly v3 (Monthly Transits + Lunar Return)

This document provides a detailed technical walkthrough of the `horoscope?tab=tropical_transits_monthly_v3` route. It outlines the components, sections, and API integrations required to replicate the page functionality.

---

## 1. Route Overview
- **Slug**: `tropical_transits_monthly_v3`
- **Label**: Monthly Transits + Lunar Return
- **Description**: Combines monthly transit data with lunar return data and AI interpretation.

---

## 2. Page Structure (Sections & Components)

The page is built using a vertical stack of sections. Each section focuses on a specific data type.

### A. Header & Input Section
- **Components**: `TabBar`, `BirthBlock`, `Input (type="month")`, `Textarea (Area of Inquiry)`
- **Sections**:
    1. **Tab Identity**: Displays "Monthly Transits + Lunar Return".
    2. **Birth Form**: Collected inputs for DOB, TOB, and City.
    3. **Future Month Picker**: Allows selecting a specific month for the report.

### B. Visualization Section (Natal Charts)
- **Component**: `NatalChartsRow`
- **Sections**:
    1. **Natal Wheel Chart**: Standard tropical wheel fetched from AstrologyAPI.
    2. **Free Natal Wheel**: Alternative visualization fetched from decan internal API.

### C. Transit Aspects Section (Technical Data)
- **Component**: `TransitSection` (Table View)
- **Sections**:
    1. **Transit Table**: Displays columns for Transit Planet, Aspect, Natal Planet, Orb, and Date.

### D. Lunar Return Metrics Section (Technical Data)
- **Component**: `TransitSection` (Lunar Metrics View)
- **Sections**:
    1. **Lunar Table**: Displays Moon Day, Moon Illumination, Moon Phase, and Moon Sign.

### E. AI Interpretations Section (Core Content)
- **Component**: `TransitSection` (AI Narrative Part)
- **Sections**:
    1. **Monthly Transit Interpretations**: Individual cards for each major transit with "Show More" functionality.
    2. **Lunar Return AI Interpretation**: Narrative breakdown of the Moon's cycle for that period.

### F. Natal Details Section (Reference Data)
- **Components**: `PlanetsSection`, `HousesSection`, `DharmaKarmaSection`, `AspectsSection`
- **Purpose**: Full natal analysis remains visible at the bottom for comprehensive understanding.

---

## 3. API Workflow & Rationale

| Context | API Name / URL | Payload Structure | Rationale |
| :--- | :--- | :--- | :--- |
| **Natal Base** | `western_horoscope` | `{day, month, year, hour, min, lat, lon, tzone}` | Foundation data for the entire page. |
| **Monthly Transits** | `tropical_transits/monthly` | `{day, month, year, hour, min, lat, lon, tzone}` | Returns all transits occurring in the "Current Month". |
| **Lunar Return** | `lunar_metrics` | `{day, month, year, hour, min, lat, lon, tzone}` | Returns lunar phase and illumination for the "Current Month". |
| **Future Report** | `astrology_report_monthly` | `{"steps":"astrology_report_monthly", "birth_details":{...}, "target_year", "target_month"}` | **Critical**: Combines transits and lunar data into one payload for future months. |
| **AI Interpretations** | `ai-interpret` | `{"condition": {"system_content", "user_content"}, "json": [...] }` | Converts raw technical data (JSON) into astrological interpretations. |
| **Wheel Charts** | `natal_wheel_chart` | `{day, month, year ...}` | Generates the SVG wheel for the natal chart. |
| **Save Results** | `save-astro-AI-Response` | `{"toolname": "tropical_transits_monthly_v3", "ai_response": {...}}` | Persists the generated content to avoid repeated AI costs. |

---

## 4. How to Implement (Detailed Discussion)

### 1. Unified Fetch Strategy
In `page.tsx`, the logic checks for `form.futureMonth`. 
- If **selected**, it calls the single Lambda endpoint (`astrology_report_monthly`) which has been optimized to return all necessary transit and lunar data for future dates.
- If **not selected**, it defaults to current Month and calls AstrologyAPI's `tropical_transits/monthly` and `lunar_metrics` in parallel.

### 2. Dual AI Prompting
The `buildAiPrompts` function generates two distinct prompts for this tab:
- **`tropical_transits_monthly`**: Focuses on the planetary relationships. It requests a specific JSON format: `[{aspecttitle: string, interpretation: string}]`.
- **`lunar_metrics`**: Focuses on the Moon's cycle. It requests interpretation for Moon sign, phase, and age.

### 3. Progressive Rendering
The page updates the `results` state as each API returns. This prevents the user from seeing a blank screen while the AI is processing.
- Technical tables (Transits, Lunar Metrics) show up first.
- AI cards show "Cosmic Retrieval..." skeletons until `ai_interpretations` are populated.

### 4. Interactive "Show More"
Each AI interpretation is hooked into `useShowMore()`. When triggered, it:
1.  Displays the full text.
2.  Fetches a **Pictorial Representation** from S3 if available (e.g., "Mars-Square-Pluto.svg").
3.  Shows **Keyword Association Chips** (e.g., Mars: action, drive; Pluto: transformation).

---

## 5. Summary of API List Usage

- **`monthly`**: Populates the "Transit Aspects" table.
- **`Future Lunar Metrics` (AI Prompt)**: Populates the "Lunar Return AI Interpretation" cards.
- **`Future Tropical Transits Monthly Relation` (AI Prompt)**: Populates the "Monthly Transit Interpretation" cards.
- **`astrology_report_monthly`**: The data source for both tables when a future date is picked.
- **`natal_wheel_chart`**: Populates the visualization at the top.
- **`save-astro-AI-Response`**: Called at the end of the `handleSubmit` process to cache the entire generated report.


# Monthly Transits + Lunar Return API Documentation

This document describes the API endpoints used for calculating and retrieving Monthly Transits and Lunar Return metrics.

## 1. Tropical Transits Monthly
Retrieves the transit relationships for a specific month based on birth details.

- **URL:** `https://json.astrologyapi.com/v1/tropical_transits/monthly`
- **Context:** monthly

### Payload
```json
{
  "hour": 13,
  "min": 0,
  "day": 31,
  "month": 5,
  "year": 2000,
  "lat": 23.24073,
  "lon": 87.86733,
  "tzone": "+05:30"
}
```

### Response
```json
{
    "month_start_date": "1-7-2025",
    "month_end_date": "31-7-2025",
    "ascendant": "Libra",
    "transit_relation": [
        {
            "transit_planet": "Mercury",
            "natal_planet": "Ascendant",
            "type": "Sextile",
            "orb": 0.08,
            "date": "2-7-2025"
        },
        {
            "transit_planet": "Mars",
            "natal_planet": "Moon",
            "type": "Trine",
            "orb": 0.17,
            "date": "5-7-2025"
        },
        {
            "transit_planet": "Mars",
            "natal_planet": "Sun",
            "type": "Square",
            "orb": 0.1,
            "date": "5-7-2025"
        },
        {
            "transit_planet": "Jupiter",
            "natal_planet": "Ascendant",
            "type": "Square",
            "orb": 0.05,
            "date": "8-7-2025"
        },
        {
            "transit_planet": "Venus",
            "natal_planet": "Ascendant",
            "type": "Trine",
            "orb": 0.16,
            "date": "10-7-2025"
        },
        {
            "transit_planet": "Venus",
            "natal_planet": "Venus",
            "type": "Conjunction",
            "orb": 0.22,
            "date": "11-7-2025"
        },
        {
            "transit_planet": "Venus",
            "natal_planet": "Sun",
            "type": "Conjunction",
            "orb": 0.55,
            "date": "13-7-2025"
        },
        {
            "transit_planet": "Venus",
            "natal_planet": "Mars",
            "type": "Conjunction",
            "orb": 0.38,
            "date": "21-7-2025"
        },
        {
            "transit_planet": "Jupiter",
            "natal_planet": "Moon",
            "type": "Sextile",
            "orb": 0.05,
            "date": "24-7-2025"
        },
        {
            "transit_planet": "Saturn",
            "natal_planet": "Mercury",
            "type": "Square",
            "orb": 0.01,
            "date": "29-7-2025"
        },
        {
            "transit_planet": "Mercury",
            "natal_planet": "Moon",
            "type": "Square",
            "orb": 0.18,
            "date": "30-7-2025"
        },
        {
            "transit_planet": "Mercury",
            "natal_planet": "Sun",
            "type": "Sextile",
            "orb": 0.1,
            "date": "30-7-2025"
        },
        {
            "transit_planet": "Neptune",
            "natal_planet": "Mercury",
            "type": "Square",
            "orb": 0.27,
            "date": "31-7-2025"
        }
    ],
    "retrogrades": [],
    "moon_phase": []
}
```

## 2. Future Lunar Metrics (AI Assisted)
Generates detailed lunar metrics interpretations (Moon Phase, Sign, Illumination, etc.) for a specific month.

- **URL:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`

### Payload
```json
{
  "condition": {
    "system_content": "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
    "user_content": "for the Month  August 2025 as a date give me Lunar Metrics as Month ,Moon Day,Moon Illumination,Moon Phase,Moon Sign in a format for a person whose dob is 5/31/2000 at 1:00 PM and place Bardhaman, West Bengal, India result must be validated and accurate as format must be  {month:value} , {moonday:value},{moon_illumination:value},{moonphase:value},{moonsign:value} , {moon_sign_interpretation:value} ,{moon_phase_interpretation:value} , {moon_age_interpretation:value} ,{moon_day_interpretation:value},{moon_illumination_interpretation:value} where moonsigninterpretation , moonphaseinterpretation , moonageinterpretation ,moondayinterpretation ,moonilluminationinterpretation values must be paragraph having atleast 3 sentences each these response must come from calculation and should be validated with astrology calculations,response should not start with string 'json'  ever  and  must be a valid json format."
  },
  "toolname": "other"
}
```

### Response
```json
{
    "ai_response": "{  \"month\": \"August 2025\",  \"moonday\": \"15\",  \"moon_illumination\": \"85%\",  \"moonphase\": \"Waxing Gibbous\",  \"moonsign\": \"Sagittarius\",  \"moon_sign_interpretation\": \"The Moon in Sagittarius brings a sense of adventure and a desire for exploration. This is a time when you may feel more optimistic and open to new experiences. Emotions are expansive, and there is a tendency to seek out the truth and wisdom in various aspects of life.\",  \"moon_phase_interpretation\": \"The Waxing Gibbous phase is a time of growth and preparation. It is a period where intentions set during the New Moon are beginning to take shape. This phase encourages you to refine your plans and make necessary adjustments to ensure success. It is a time of building momentum and focusing on the details.\",  \"moon_age_interpretation\": \"At 15 days old, the Moon is in its mature stage, symbolizing a time of fruition and realization. This age of the Moon is associated with clarity and insight, as the light it reflects is almost at its fullest. It is a period where you can see the results of your efforts and make informed decisions moving forward.\",  \"moon_day_interpretation\": \"The 15th day of the lunar cycle is often associated with balance and harmony. It is a time to reflect on the progress made and to celebrate achievements. This day encourages you to find equilibrium in your life and to appreciate the journey you are on. It is a moment to pause and acknowledge the beauty of the process.\",  \"moon_illumination_interpretation\": \"With 85% illumination, the Moon is nearly full, casting a bright light on the night sky. This level of illumination signifies a time of heightened awareness and visibility. It is a period where emotions and situations are illuminated, allowing for greater understanding and clarity. The brightness of the Moon encourages introspection and the revelation of hidden truths.\"}",
    "prompt_tokens": 264,
    "completion_tokens": 412,
    "total_tokens": 676,
    "cache_status": "Hit",
    "database_identifier": "0cbaf17a7954c434b288741ccf740a95ff33dae197431dc013ab379a23ed8fe0"
}
```

## 3. Future Tropical Transits Monthly Relation (AI Assisted)
Generates AI interpretations for monthly transit relations.

- **URL:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`

### Payload
```json
{
  "condition": {
    "system_content": "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
    "user_content": "for the month  August 2025 as a date give me Tropical Transits Monthly Relation in above format for a person whose dob is 5/31/2000 at 1:00 PM and place Bardhaman, West Bengal, India must be validated and accurate and response should be craeted from this data : undefined follow the asked format strictly no other index expected that asked indexes , both aspecttitle and  interpretation must be text in specific aspecttitle will be header and interpretation will be paragraph of 3 sentences atleast  response format must be as exact :  {{aspecttitle:value},{interpretation:value}  create multiple records on each date and type with unique aspecttitle please not just one and detail as much as possible and again response format must be as exact :  {aspecttitle:value},{interpretation:value}.response should not start with string 'json'  ever  and must be a valid json format"
  },
  "toolname": "other"
}
```

### Response
```json
{
    "ai_response": "[    {        \"aspecttitle\": \"Sun Conjunct Mercury\",        \"interpretation\": \"During this transit, your communication skills are heightened, and you may find yourself more articulate and expressive. It's an excellent time for negotiations and intellectual pursuits. However, be mindful of becoming overly self-focused in conversations.\"    },    {        \"aspecttitle\": \"Venus Square Mars\",        \"interpretation\": \"This transit may bring tension in relationships, as desires and actions may not align smoothly. You might feel a strong urge to pursue your passions, but conflicts could arise if you're not considerate of others' needs. It's important to find a balance between assertiveness and cooperation.\"    },    {        \"aspecttitle\": \"Mars Trine Jupiter\",        \"interpretation\": \"This is a period of increased energy and enthusiasm, making it a great time to pursue new ventures or expand existing projects. Your confidence is likely to be high, and opportunities for growth and success are more accessible. Be sure to channel this energy constructively to maximize its benefits.\"    },    {        \"aspecttitle\": \"Saturn Opposite Uranus\",        \"interpretation\": \"You may experience a struggle between the desire for stability and the need for change during this transit. It's a time to reassess your commitments and find innovative ways to break free from restrictive patterns. Patience and flexibility will be key to navigating this challenging yet transformative period.\"    },    {        \"aspecttitle\": \"Jupiter Sextile Neptune\",        \"interpretation\": \"This transit enhances your intuition and spiritual awareness, making it an ideal time for creative and compassionate endeavors. You may feel more connected to your ideals and inspired to help others. Trust your instincts and explore new spiritual or artistic paths that resonate with your inner vision.\"    },    {        \"aspecttitle\": \"Mercury Retrograde\",        \"interpretation\": \"Communication and technology may face disruptions during this period, so it's important to double-check details and be patient with delays. It's a good time to review and revise plans rather than starting new projects. Use this period for introspection and resolving past misunderstandings.\"    },    {        \"aspecttitle\": \"Sun Trine Pluto\",        \"interpretation\": \"This transit empowers you to make significant transformations in your life, particularly in areas where you seek control or empowerment. You have the ability to influence others and bring about positive change. Embrace this opportunity to delve deep into personal growth and regeneration.\"    },    {        \"aspecttitle\": \"Venus Conjunct Jupiter\",        \"interpretation\": \"A time of joy and abundance, this transit brings opportunities for love, financial gain, and social harmony. You may feel more optimistic and generous, attracting positive experiences and relationships. Enjoy the pleasures of life, but be mindful of overindulgence.\"    }]"
}
```

## 4. Lunar Return Details (AI Assisted)
Generates interpretations for specific lunar return metrics provided in the JSON input.

- **URL:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`

### Payload
```json
{
  "condition": {
    "system_content": "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
    "user_content": "Generate  lunar return details based on given json with minimum 3 sentences on each interpretation as interpretation  with a numnber as index named index  of  lunar return details in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don'''t miss a single lunar return details there are many please be careful and response should not start with string '''json'''  ever but in proper json format and with in  an array of object format should be{\"title\":\"Title or heading of the interpretation \",            \"interpretation\":\"Details Interpretation\" } , response should not start with string 'json'  ever  and must be with in  an array. make sure each interpretation has more than 3 sentences  "
  },
  "toolname": "other",
  "json": {
    "month": "31-5-2000",
    "within_perigee_range": false,
    "distance": "--",
    "within_apogee_range": false,
    "apogee_distance": "__",
    "moon_sign": "Taurus",
    "moon_phase": "Waning Crescent",
    "moon_phase_id": 7,
    "moon_age_in_days": 27.06333082682592,
    "moon_day": 28,
    "moon_illumination": 6
  }
}
```

### Response
```json
{
    "ai_response": "[    {        \"title\": \"Moon Sign: Taurus\",        \"interpretation\": \"With the Moon in Taurus, this lunar return emphasizes stability and practicality. You may find yourself drawn to activities that provide comfort and security, such as spending time at home or indulging in your favorite foods. This is a time to focus on building a solid foundation in your personal and professional life, as Taurus energy encourages patience and persistence.\"    },    {        \"title\": \"Moon Phase: Waning Crescent\",        \"interpretation\": \"The Waning Crescent phase is a time for reflection and introspection. As the Moon's light diminishes, you are encouraged to let go of what no longer serves you and prepare for new beginnings. This phase supports activities such as meditation, journaling, and planning for the future, allowing you to gain clarity and insight into your next steps.\"    },    {        \"title\": \"Moon Age in Days: 27.06\",        \"interpretation\": \"At 27 days old, the Moon is nearing the end of its cycle, signaling a time of closure and completion. This is an ideal period to tie up loose ends and finish any outstanding projects. The energy of this lunar age supports releasing old patterns and making space for new opportunities, helping you to transition smoothly into the next lunar cycle.\"    },    {        \"title\": \"Moon Day: 28\",        \"interpretation\": \"On the 28th day of the lunar cycle, the energy is calm and introspective. This is a day to focus on inner peace and spiritual growth, as the Moon's influence encourages you to connect with your higher self. Activities such as yoga, meditation, and spending time in nature can be particularly beneficial, helping you to align with your true purpose.\"    },    {        \"title\": \"Moon Illumination: 6%\",        \"interpretation\": \"With only 6% illumination, the Moon is barely visible in the sky, symbolizing a time of quietude and reflection. This low level of illumination invites you to turn inward and explore your inner world, seeking answers and insights from within. It is a time to trust your intuition and listen to the subtle whispers of your soul, guiding you towards your next steps.\"    }]"
}
```

## 5. Natal Wheel Chart
Generates a SVG wheel chart for natal details.

- **URL:** `https://json.astrologyapi.com/v1/natal_wheel_chart`

### Payload
```json
{
  "hour": 13,
  "min": 0,
  "day": 31,
  "month": 5,
  "year": 2000,
  "lat": 22.5726459,
  "lon": 88.3638953,
  "tzone": "+05:30"
}
```

### Response
```json
{
    "status": true,
    "chart_url": "https://s3.ap-south-1.amazonaws.com/western-chart/8e1f5390-33de-11f1-94af-c3331e769613.svg",
    "msg": "Chart created successfully!"
}
```

## 6. Get Free Natal Wheel Chart
Alternative endpoint for generating a natal wheel chart.

- **URL:** `https://d36fwfwo4vnk9h.cloudfront.net/astro_decan_new_infos/get-free-natal-wheel-chart`

### Payload
```json
{
  "hours": 13,
  "minutes": 0,
  "date": 31,
  "month": 5,
  "year": 2000,
  "latitude": 22.5726459,
  "longitude": 88.3638953,
  "timezone": 5.5
}
```

### Response
```json
{
    "status": "success",
    "results": {
        "statusCode": 200,
        "output": "https://western-astrology.s3.ap-south-1.amazonaws.com/Chart_1775716643926.svg"
    },
    "message": "astro tool kit get successfully"
}
```

## 7. Astrology Report Monthly
Generates a comprehensive monthly report including lunar data, moon phases, and transit relations.

- **URL:** `https://a5p6f3zd26utex5rxmbu7vromu0jsszy.lambda-url.us-east-1.on.aws/`

### Payload
```json
{
  "steps": "astrology_report_monthly",
  "birth_details": {
    "hour": 13,
    "min": 0,
    "day": 31,
    "month": 5,
    "year": 2000,
    "lat": 22.5726459,
    "lon": 88.3638953,
    "tzone": "+05:30"
  },
  "target_year": 2026,
  "target_month": 5
}
```

### Response (Truncated)
```json
{
    "astrology_report_monthly": {
        "lunar_data": {
            "within_apogee_range": true,
            "moon_illumination": 11,
            "moon_age_in_days": 27.773,
            "apogee_distance": 405276,
            "month": "1-5-2026",
            "distance": "--",
            "moon_sign": "Taurus",
            "moon_phase": "New Moon",
            "moon_day": 28,
            "within_perigee_range": false,
            "moon_phase_id": 0
        },
        "month_end_date": "2026-05-31",
        "moon_phase": [
            { "phase": "Full Moon", "date": "2026-05-05" },
            { "phase": "Last Quarter", "date": "2026-05-12" },
            { "phase": "New Moon", "date": "2026-05-20" },
            { "phase": "First Quarter", "date": "2026-05-28" }
        ],
        "transit_relation": [
            { "date": "2026-05-01", "natal_planet": "Sun", "transit_planet": "Saturn", "type": "Sextile", "orb": 0.95 },
            ...
        ],
        "unique_transits": [ ... ],
        "unique_transits_count": 12,
        "ascendant": "Virgo",
        "transit_relation_count": 189,
        "month_start_date": "2026-05-01",
        "retrogrades": [ ... ]
    }
}
```

## 8. Save Astrology AI Response
Saves the generated AI interpretations and associated data for a specific tool.

- **URL:** `https://d36fwfwo4vnk9h.cloudfront.net/astro-ai/save-astro-AI-Response`

### Payload
```json
{
  "toolname": "tropical_transits_monthly_v3",
  "ai_response": {
    "tropical_transits_monthly": [
      {
        "aspecttitle": "Sun Sextile Saturn",
        "interpretation": "As May begins, the Sun in your natal chart forms a harmonious sextile with transiting Saturn..."
      },
      ...
    ],
    "lunar_metrics": {
      "month": "May 2026",
      "moonday": "28 days",
      "moon_illumination": "11%",
      "moonphase": "New Moon",
      "moonsign": "Taurus",
      "moon_sign_interpretation": "...",
      "moon_phase_interpretation": "...",
      "moon_age_interpretation": "...",
      "moon_day_interpretation": "...",
      "moon_illumination_interpretation": "..."
    }
  },
  "formData": {
    "hour": 13,
    "min": 0,
    "day": 31,
    "month": 5,
    "year": 2000,
    "lat": 22.5726459,
    "lon": 88.3638953,
    "tzone": "+05:30"
  },
  "astro_api_data": { ... },
  "freeNatalWheelChart": "...",
  "freeNatalWheelChartForTrasit": "..."
}
```

### Response
```json
{
    "status": "success",
    "res": {
        "toolname": "tropical_transits_monthly_v3",
        "ai_response": { ... },
        "chat_questions": [],
        "natal_chart": { ... },
        "formData": { ... },
        "astro_api_data": { ... },
        "freeNatalWheelChart": "...",
        "freeNatalWheelChartForTrasit": "...",
        "_id": "69d74925aaaab893a5b7b1a4",
        "createdon_datetime": 1775716645196,
        "updatedon_datetime": 1775716645196
    }
}
```

