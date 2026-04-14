# Horary Chart V2 Recreation Prompt

This document provides a comprehensive prompt to recreate the **Predictive Event (Horary)** page exactly as it exists in the current project (`tab=horary_chart_v2`).

---

## The Master Prompt

### Task

Create a **Premium Predictive Event (Horary) Astrology Page**

---

## 1. UI Layout & Structure

### Container

* Responsive main container
* Dark theme background: `#1e242f` (or similar)

### Form Section

Create a clean, modern form with the following inputs:

* **Date of Birth** (e.g., `03/12/2024`)
* **Time of Birth** (24-hour format)
* **City**

  * Include autocomplete for:

    * Latitude
    * Longitude
    * Timezone
* **Your Question?**

  * Text input for user query

#### Submit Button

* Premium **Gold & Paper theme**
* Gradient styling
* Subtle hover animation

---

## 2. Results Section (Post-Submit)

### Western Chart Display

* Show two charts:

  1. **Natal Chart (API Image)**
  2. **Natal Wheel Chart (SVG/Image/Interactive)**

#### Layout

* Side-by-side (desktop)
* Stacked (mobile)

#### Styling

* Container background: `#282f3c`
* Soft shadows
* Rounded corners

---

### AI Interpretation Blocks

#### Sections (Sequential Order)

1. Recommendation on Date and Timeline
2. House Analysis
3. Planetary Influence
4. Astrological Aspects
5. Summary

---

### Header Style

* Background: `#ffffff`
* Text color: `#000000`
* Font size: `40px`
* Bold typography
* Include relevant astrology icons

---

### Content Style

* Background gradient:

  ```css
  linear-gradient(166deg, #f0a023 0%, #f8d647 100%)
  ```
* Text color: `#000`
* Font size: `20px`
* Padding: `40px`
* Rounded edges + subtle elevation

---

### "Show More" Buttons

* Small button inside each block
* Black gradient styling
* Fetch deeper AI insights on click

---

## 3. Logic & API Integration

### Astro API

* Fetch:

  * Planets
  * Houses
  * Aspects

### Chart API

* Generate chart images using:

  * Date
  * Time
  * Coordinates

---

## 4. AI Prompting Strategy (CRITICAL)

### Role

* AI must behave as a **Professional Astrologer**
* NOT an AI assistant

---

### Content Rules

* Minimum **5 sentences per section**
* Deeply personalized
* Context-aware
* No generic zodiac/planet explanations

---

### JSON Response Format

```json
{
  "data": {
    "astrological_aspect": {
      "aspect": [
        {"title": "...", "data": "..."}
      ],
      "planet": [
        {"title": "...", "data": "..."}
      ],
      "house": [
        {"title": "...", "data": "..."}
      ]
    },
    "summary": {
      "answer": ["..."],
      "recommendation": ["..."],
      "recommendation_on_date_and_timeline": [
        {
          "timeline_title": "...",
          "timeline_data": "..."
        }
      ]
    }
  }
}
```

---

### Timeline Rules

* Must include:

  * **Top Choice Date**
  * **Other Favorable Dates**
* Dates must always be **future dates**
* Based on **current local date**

---

### Date Formatting

Wrap all dates like:

```html
<span class="timedata">Date</span>
```

---

## 5. Visual Aesthetics (Premium Theme)

### Typography

* Use:

  * `Roboto`
  * `Inter`

---

### Gradients

* Gold → Yellow for content
* Orange → Red for floating buttons

---

### Animations

* Subtle micro-interactions:

  * Button hover
  * Loading states
  * Progress indicators

---

## 6. Floating Action Buttons

Position: Bottom-right (stacked)

### Buttons

* **Scroll to Top**
* **View Natal Chart**
* **Share Result**

### Behavior

* Smooth animations
* Share button includes loading spinner

---

## 7. Component Interactions

### Sharing Feature

* Save:

  * AI response
  * Chart data
* Generate:

  * Unique shareable URL

---

### Public View Mode

* Detect `share_id` in query params
* Render:

  * View-only mode
* Hide input form

---

### Auto-Fill Support

* Accept `userData` from parent dashboard
* Pre-fill form fields automatically

---

## 8. Design Accuracy Note

Ensure gradient consistency using exact RGBA values:

```css
rgba(240, 160, 35, 1)
rgba(248, 214, 71, 1)
```

---

## Final Goal

Deliver a **pixel-perfect, premium astrology experience** that combines:

* Accurate astrological computation
* Deep AI-driven interpretation
* Luxury UI/UX aesthetics
* Smooth, modern interactions

---


API USED : (expected payload and response )

Predictive Event (Horary)											
											
Inputs											
			Date Of Birth			Time Of Birth			City		
											
			5/31/2000			01:00			Bardhaman,West Bengal, India		
											
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
											
western_horoscope			 API : https://json.astrologyapi.com/v1/western_horoscope			PAYLOAD : {"hour":13,"min":0,"day":31,"month":5,"year":2000,"lat":23.24073,"lon":87.86733,"tzone":"+05:30","question":"tell me about my carrer"}			"RESULTS : {
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
											
natal_wheel_chart			 API : https://json.astrologyapi.com/v1/natal_wheel_chart			PAYLOAD : {"hour":13,"min":0,"day":31,"month":5,"year":2000,"lat":23.24073,"lon":87.86733,"tzone":"+05:30","question":"tell me about my carrer"}			"RESULTS : {
    ""status"": true,
    ""chart_url"": ""https://s3.ap-south-1.amazonaws.com/western-chart/35664510-5e1e-11f0-a92c-a7b6b7a03ff2.svg"",
    ""msg"": ""Chart created successfully!""
}"		
											
Recommendation on Date and Timeline			 API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else answer as astrologer not AI BOT user data index related to astrology as data under that aspect and under that interpretation ","user_content":"I was born on May 31, 2000 time 13:0, in Bardhaman, West Bengal, India ,'lat:23.24073,lon:87.86733,tzone:+05:30'. tell me about my carrer. I'm providing you with my birth chart data in a separate JSON object. You MUST use this data to generate a personalized astrological analysis in the following JSON format:{data:{astrological_aspect:{aspect:[{title:data}],planet:[{title:data}],house:[{title:data}]},summary:{answer:[{title:data}],recommendation:[{title:data}],recommendation_on_date_and_timeline:[{timeline_title:timeline_data}]}}}\n\nexample format to follow :\n{\n \"data\": {\n \"astrological_aspect\": {\n \"aspect\": [\n {\n \"title\": \"Mars Trine Jupiter (Transit to Natal)\",\n \"data\": \"Between January 10th and February 15th, 2025, transiting Mars in Sagittarius forms a trine aspect to your natal Jupiter in the 12th house. This harmonious alignment amplifies your ambition, optimism, and drive to pursue your goals, particularly those related to spirituality, intuition, or humanitarian causes. It supports taking decisive action and expanding your vision, bringing opportunities for growth and success in these areas.\"\n },\n {\n \"title\": \"Venus Sextile Neptune (Transit to Natal)\",\n \"data\": \"During the same period, transiting Venus in Pisces forms a sextile aspect to your natal Neptune in the 12th house. This harmonious connection enhances your creativity, intuition, and compassion. It supports collaboration, artistic expression, and connecting with your dreams and ideals. This alignment also strengthens your spiritual connection and fosters a sense of harmony and idealism in your endeavors.\"\n }\n ],\n \"planet\": [\n {\n \"title\": \"Transiting Mars\",\n \"data\": \"Between January 10th and February 15th, 2025, Mars transits through Sagittarius and forms a harmonious trine to your natal Jupiter in the 12th house. This amplifies your ambition, drive, and optimism, particularly in areas related to spirituality, intuition, and humanitarian pursuits. It supports taking decisive action and expanding your vision, bringing opportunities for growth and success.\"\n },\n {\n \"title\": \"Transiting Venus\",\n \"data\": \"During this same period, Venus transits through Pisces and forms a supportive sextile to your natal Neptune in the 12th house. This enhances your creativity, intuition, and compassion, supporting artistic expression, collaboration, and connecting with your dreams and ideals. It also strengthens your spiritual connection and fosters a sense of harmony and idealism.\"\n }\n ],\n \"house\": [\n {\n \"title\": \"12th House (Transit Activation)\",\n \"data\": \"Between January 10th and February 15th, 2025, your 12th house of spirituality, imagination, and hidden realms is activated by the transits of Mars and Venus. Mars trine natal Jupiter enhances your intuition, drive, and optimism in pursuing spiritual or humanitarian goals. Venus sextile natal Neptune strengthens your creativity, compassion, and connection to your dreams and ideals.\"\n }\n ]\n },\n \"summary\": {\n \"answer\": [\n {\n \"title\": \"Optimal Time for Starting a Business\",\n \"data\": \"Based on your birth chart data, the optimal time to start a business with your Taurus partner is between January 10th and February 15th, 2025. During this period, Mars trines your natal Jupiter and Venus sextiles your natal Neptune, both occurring in your 12th house. This alignment supports ambitious endeavors, collaborative efforts, and creative inspiration, increasing the likelihood of a successful launch.\"\n }\n ],\n \"recommendation\": [\n {\n \"title\": \"Focus on 12th House Themes\",\n \"data\": \"Given the emphasis on your 12th house during the period between January 10th and February 15th, 2025, consider incorporating themes related to spirituality, intuition, creativity, and compassion into your business endeavors. This could involve ventures with a humanitarian focus, artistic expression, or utilizing your intuition and imagination for innovative solutions.\"\n }\n ],\n \"recommendation_on_date_and_timeline\": [\n {\n \"timeline_title\": \"Between January 10th and February 15th, 2025\",\n \"timeline_data\": \"This period is particularly auspicious for launching your business due to the following transits and their impact on your natal chart: 1. Mars trine Jupiter: Transit Mars in Sagittarius will trine your natal Jupiter in the 12th house. This alignment enhances your optimism, expands your vision, and supports taking decisive action towards your entrepreneurial goals. It can bring opportunities for growth and success through spiritual practices, intuition, or ventures with a humanitarian focus. 2. Venus sextile Neptune: Transit Venus in Pisces will sextile your natal Neptune in the 12th house. This harmonious aspect enhances your creativity, intuition, and compassion. It supports collaboration, artistic expression, and connecting with your dreams and ideals in your business pursuits. This alignment also strengthens your spiritual connection and fosters a sense of harmony and idealism in your endeavors.\"\n }\n ]\n }\n }\n}\nI need you to strictly adhere to these rules:\n\n1.Personalized Interpretations ONLY: Absolutely NO generic explanations of planets, aspects, or houses. Every interpretation in the data fields must be derived from and specific to MY birth chart data and reasoning with timeline_data you suggested. No general info expected.\n2.FUTURE (very important not past) Justified Timelines: The timeline_data here suggested dates first calculate dates or timeline which must be after the specific date: 07/11/2025 ONLY if response doesnt satisfies this you must recalculate again until you get a date after 07/11/2025 , so proposed timelines older thah 07/11/2025  then recalculate again and never any past dates and this MUST include specific future dates and time periods then other data on basis of that  . Crucially, you MUST explain WHY these dates are significant based on MY birth chart. For example, \"From December 20th, 2024, to January 18th, 2025, Mars transits your 7th house, bringing increased energy and assertiveness to your relationships.\" (then more details). This would be an example data, but you need to provide the title.\n3.Data Richness: Each data field needs at least three full sentences of detailed, personalized interpretation.\n4.Accurate Titles: Use concise labels for each title (e.g., 'Sun Conjunct Moon', 'Mars in Aries').\n5.Complete Data: Ensure ALL objects have both title and data fields.\nRule 2 is most important\nremember dates on each blocks must not conflict with each other , may be multiple dates but must be common among those in any cases and from above rules rule no 2 is most important\n"},"toolname":"other","json":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}}}			"RESULTS :     ""ai_response"": ""```json{  \""data\"": {    \""astrological_aspect\"": {      \""aspect\"": [        {          \""title\"": \""Sun Conjunct Mars\"",          \""data\"": \""From November 15th, 2025, to December 10th, 2025, transiting Sun in Sagittarius forms a conjunction with your natal Mars in the 9th house. This alignment energizes your drive for higher learning, travel, and philosophical pursuits. It is a time to assertively pursue educational or international opportunities, enhancing your career prospects in fields related to academia, law, or global affairs.\""        },        {          \""title\"": \""Venus Trine Neptune\"",          \""data\"": \""Between November 20th, 2025, and December 15th, 2025, transiting Venus in Libra forms a trine with your natal Neptune in the 4th house. This aspect enhances your creativity and intuition, particularly in domestic or family-related projects. It supports artistic endeavors or careers in design, counseling, or any field that requires empathy and imagination.\""        }      ],      \""planet\"": [        {          \""title\"": \""Transiting Sun\"",          \""data\"": \""From November 15th, 2025, to December 10th, 2025, the Sun transits through Sagittarius, forming a conjunction with your natal Mars in the 9th house. This transit boosts your confidence and enthusiasm for pursuing educational and travel opportunities. It is an excellent time to take bold steps in your career, especially in fields that involve teaching, publishing, or international relations.\""        },        {          \""title\"": \""Transiting Venus\"",          \""data\"": \""Between November 20th, 2025, and December 15th, 2025, Venus transits through Libra, forming a harmonious trine with your natal Neptune in the 4th house. This transit enhances your artistic talents and ability to connect with others on a deep emotional level. It is a favorable period for engaging in creative projects or careers that involve nurturing and supporting others.\""        }      ],      \""house\"": [        {          \""title\"": \""9th House (Transit Activation)\"",          \""data\"": \""From November 15th, 2025, to December 10th, 2025, your 9th house of higher learning, travel, and philosophy is activated by the transiting Sun conjunct your natal Mars. This alignment encourages you to pursue educational and travel opportunities that can expand your career horizons. It is a time to explore new ideas and cultures, enhancing your professional growth.\""        }      ]    },    \""summary\"": {      \""answer\"": [        {          \""title\"": \""Career Expansion through Education and Travel\"",          \""data\"": \""The period from November 15th, 2025, to December 10th, 2025, is optimal for expanding your career through educational pursuits and travel. The Sun conjunct Mars in your 9th house encourages you to take bold steps in academia, law, or international relations, enhancing your professional prospects.\""        }      ],      \""recommendation\"": [        {          \""title\"": \""Embrace Creative and Nurturing Careers\"",          \""data\"": \""During the period between November 20th, 2025, and December 15th, 2025, focus on careers that allow you to express your creativity and empathy. The Venus trine Neptune aspect supports artistic endeavors and roles that involve nurturing and supporting others, such as counseling or design.\""        }      ],      \""recommendation_on_date_and_timeline\"": [        {          \""timeline_title\"": \""From November 15th, 2025, to December 15th, 2025\"",          \""timeline_data\"": \""This period is particularly significant for career development due to the following transits: 1. Sun conjunct Mars: From November 15th, 2025, to December 10th, 2025, the Sun conjuncts your natal Mars in the 9th house, energizing your pursuit of higher learning and travel opportunities. This alignment supports career growth in academia, law, or international fields. 2. Venus trine Neptune: From November 20th, 2025, to December 15th, 2025, Venus forms a trine with your natal Neptune in the 4th house, enhancing your creativity and empathy. This aspect is favorable for careers in design, counseling, or any field that requires artistic expression and nurturing.\""        }      ]    }  }}```"",
"		
											
Recommendation on Date and Timeline Show More			 API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else and always answer as astrolger not AI BOT","user_content":"I was born on May 31, 2000 time 13:0, in Bardhaman, West Bengal, India ,'lat:23.24073,lon:87.86733,tzone:+05:30'. and the qustion is 'tell me about my carrer'. Keeping western astrology in mind and here is  a summary of content \"This period is particularly significant for career development due to the following transits: 1. Sun conjunct Mars: From November 15th, 2025, to December 10th, 2025, the Sun conjuncts your natal Mars in the 9th house, energizing your pursuit of higher learning and travel opportunities. This alignment supports career growth in academia, law, or international fields. 2. Venus trine Neptune: From November 20th, 2025, to December 15th, 2025, Venus forms a trine with your natal Neptune in the 4th house, enhancing your creativity and empathy. This aspect is favorable for careers in design, counseling, or any field that requires artistic expression and nurturing.\" keeping this as main source info I need to know details of From November 15th, 2025, to December 15th, 2025 in summary of horary astrology, and also need to know the significance and impact of From November 15th, 2025, to December 15th, 2025 in summary of horary astrology in respect of the 'tell me about my carrer' in my life and as paragraph (this should be only focus in answer not theory of astrology on this specific aspect), you have planet , aspect and house info given in json, reposne must be in json format as {From November 15th, 2025, to December 15th, 2025 :data} here data is dynamic data form bot and must be a paragraph with 3 sentences (minimum 3 paragraphs ) for From November 15th, 2025, to December 15th, 2025 in summary of horary astrology make it real for me I don't need theory context in response you must add context of planet , aspect and house if any and make sure you parseable json in ai_response else recalculate the answer again. "},"toolname":"other","json":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}}}			"RESULTS :     ""ai_response"": ""```json{  \""From November 15th, 2025, to December 15th, 2025\"": {    \""data\"": \""During this period, the Sun conjunct Mars in your 9th house signifies a time of heightened ambition and drive, particularly in areas related to higher education and international pursuits. This alignment encourages you to take bold steps in your career, possibly exploring opportunities abroad or engaging in advanced studies that could enhance your professional standing. Additionally, Venus trine Neptune in your 4th house brings a harmonious influence, fostering creativity and empathy, which can be particularly beneficial if your career involves artistic expression or nurturing roles, such as counseling or design.\""  }}```"",
"		
											
Aspect Show More			 API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else and always answer as astrolger not AI BOT","user_content":"I was born on May 31, 2000 time 13:0, in Bardhaman, West Bengal, India ,'lat:23.24073,lon:87.86733,tzone:+05:30'. and the qustion is 'tell me about my carrer'. Keeping western astrology in mind and here is  a summary of content \"From November 15th, 2025, to December 10th, 2025, transiting Sun in Sagittarius forms a conjunction with your natal Mars in the 9th house. This alignment energizes your drive for higher learning, travel, and philosophical pursuits. It is a time to assertively pursue educational or international opportunities, enhancing your career prospects in fields related to academia, law, or global affairs.\" keeping this as main source info I need to know details of Sun Conjunct Mars in astrological_aspect of horary astrology, and also need to know the significance and impact of Sun Conjunct Mars in astrological_aspect of horary astrology in respect of the 'tell me about my carrer' in my life and as paragraph (this should be only focus in answer not theory of astrology on this specific aspect), you have planet , aspect and house info given in json, reposne must be in json format as {Sun Conjunct Mars :data} here data is dynamic data form bot and must be a paragraph with 3 sentences (minimum 3 paragraphs ) for Sun Conjunct Mars in astrological_aspect of horary astrology make it real for me I don't need theory context in response you must add context of planet , aspect and house if any and make sure you parseable json in ai_response else recalculate the answer again. "},"toolname":"other","json":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}}}			"RESULTS :    ""ai_response"": ""```json{  \""Sun Conjunct Mars\"": {    \""data\"": \""The Sun conjunct Mars in your 9th house signifies a powerful surge of energy and ambition directed towards higher learning and expansive pursuits. This alignment encourages you to take bold steps in your career, particularly in fields related to academia, law, or international affairs. During this period, you are likely to feel a strong drive to pursue educational opportunities or engage in travel that broadens your horizons, ultimately enhancing your professional prospects. The conjunction of these two dynamic planets in Gemini suggests a time of intellectual stimulation and assertive communication, which can be pivotal in advancing your career goals. Your ability to articulate ideas and take decisive action will be heightened, making this an ideal time to initiate projects or collaborations that require a proactive approach. As you navigate this period, embrace the opportunities for growth and expansion, as they are likely to lead to significant advancements in your career path. The influence of this aspect may also bring about a desire to challenge existing beliefs and explore new philosophies, further enriching your professional journey.\""  }}```"",
"		
											
Planet Show More 			 API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else and always answer as astrolger not AI BOT","user_content":"I was born on May 31, 2000 time 13:0, in Bardhaman, West Bengal, India ,'lat:23.24073,lon:87.86733,tzone:+05:30'. and the qustion is 'tell me about my carrer'. Keeping western astrology in mind and here is  a summary of content \"From November 15th, 2025, to December 10th, 2025, the Sun transits through Sagittarius, forming a conjunction with your natal Mars in the 9th house. This transit boosts your confidence and enthusiasm for pursuing educational and travel opportunities. It is an excellent time to take bold steps in your career, especially in fields that involve teaching, publishing, or international relations.\" keeping this as main source info I need to know details of Transiting Sun in astrological_aspect of horary astrology, and also need to know the significance and impact of Transiting Sun in astrological_aspect of horary astrology in respect of the 'tell me about my carrer' in my life and as paragraph (this should be only focus in answer not theory of astrology on this specific aspect), you have planet , aspect and house info given in json, reposne must be in json format as {Transiting Sun :data} here data is dynamic data form bot and must be a paragraph with 3 sentences (minimum 3 paragraphs ) for Transiting Sun in astrological_aspect of horary astrology make it real for me I don't need theory context in response you must add context of planet , aspect and house if any and make sure you parseable json in ai_response else recalculate the answer again. "},"toolname":"other","json":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}}}			"RESULTS :    ""ai_response"": ""```json{  \""Transiting Sun\"": {    \""data\"": \""As the Sun transits through Sagittarius and forms a conjunction with your natal Mars in the 9th house, this period becomes a powerful catalyst for your career. The 9th house is associated with higher learning, travel, and philosophical pursuits, and the conjunction with Mars infuses you with energy and determination to pursue these avenues. This alignment suggests a time when you might find opportunities in fields related to education, publishing, or international relations, where your enthusiasm and confidence can shine brightly. \\n\\nThe Sun's influence here encourages you to take bold steps and embrace new challenges, especially those that expand your horizons and push you beyond your comfort zone. With Mars in the mix, your drive and ambition are heightened, making it an ideal time to initiate projects or ventures that require courage and assertiveness. This transit may also bring mentors or influential figures into your life who can guide you on your career path, offering valuable insights and support. \\n\\nOverall, this period is marked by a sense of adventure and exploration in your professional life. The Sun's transit through Sagittarius, coupled with its conjunction to Mars, suggests that you are likely to experience significant growth and development in your career. Embrace the opportunities that come your way, as they have the potential to lead you to new heights and broaden your professional landscape.\""  }}```"",
"		
											
House lat lon			" API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/
"			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else and always answer as astrolger not AI BOT","user_content":"I was born on May 31, 2000 time 13:0, in Bardhaman, West Bengal, India ,'lat:23.24073,lon:87.86733,tzone:+05:30'. and the qustion is 'tell me about my carrer'. Keeping western astrology in mind and here is  a summary of content \"From November 15th, 2025, to December 10th, 2025, your 9th house of higher learning, travel, and philosophy is activated by the transiting Sun conjunct your natal Mars. This alignment encourages you to pursue educational and travel opportunities that can expand your career horizons. It is a time to explore new ideas and cultures, enhancing your professional growth.\" keeping this as main source info I need to know details of 9th House (Transit Activation) in astrological_aspect of horary astrology, and also need to know the significance and impact of 9th House (Transit Activation) in astrological_aspect of horary astrology in respect of the 'tell me about my carrer' in my life and as paragraph (this should be only focus in answer not theory of astrology on this specific aspect), you have planet , aspect and house info given in json, reposne must be in json format as {9th House (Transit Activation) :data} here data is dynamic data form bot and must be a paragraph with 3 sentences (minimum 3 paragraphs ) for 9th House (Transit Activation) in astrological_aspect of horary astrology make it real for me I don't need theory context in response you must add context of planet , aspect and house if any and make sure you parseable json in ai_response else recalculate the answer again. "},"toolname":"other","json":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}}}			"RESULTS :     ""ai_response"": ""```json{  \""9th House (Transit Activation)\"": \""The activation of your 9th house by the transiting Sun conjunct your natal Mars signifies a period of dynamic growth and exploration in your career. This alignment encourages you to seek out new educational opportunities and travel experiences that can broaden your professional horizons. As you embrace these experiences, you will find that your career path becomes more aligned with your personal philosophies and aspirations, leading to greater fulfillment and success. The influence of Gemini in your 9th house suggests that communication and adaptability will be key to navigating this period effectively. You may find yourself drawn to roles that require quick thinking and the ability to connect with diverse groups of people. This is a time to embrace change and innovation, as these qualities will propel you forward in your career. With Mars energizing this house, you are likely to feel a surge of motivation and drive, pushing you to take bold steps towards your career goals. This transit encourages you to be proactive in seeking out opportunities that align with your passions and to take calculated risks that can lead to significant professional advancement.\""}```"",
"		
											
Summary Show More			" API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/
"			PAYLOAD : {"formvalue":{"date_of_birth":"2000-05-30T18:30:00.000Z","time_of_birth":"1:00 PM","city":"bardhaman"},"searchcondition":{"search_string":"bardhaman"},"secret":"na","token":""}			"RESULTS : {
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
											
Recommendation Show More			 API : https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/			PAYLOAD : {"condition":{"system_content":"give response only in json format as a whole , nothing else and always answer as astrolger not AI BOT","user_content":"I was born on May 31, 2000 time 13:0, in Bardhaman, West Bengal, India ,'lat:23.24073,lon:87.86733,tzone:+05:30'. and the qustion is 'tell me about my carrer'. Keeping western astrology in mind and here is  a summary of content \"During the period between November 20th, 2025, and December 15th, 2025, focus on careers that allow you to express your creativity and empathy. The Venus trine Neptune aspect supports artistic endeavors and roles that involve nurturing and supporting others, such as counseling or design.\" keeping this as main source info I need to know details of Embrace Creative and Nurturing Careers in summary of horary astrology, and also need to know the significance and impact of Embrace Creative and Nurturing Careers in summary of horary astrology in respect of the 'tell me about my carrer' in my life and as paragraph (this should be only focus in answer not theory of astrology on this specific aspect), you have planet , aspect and house info given in json, reposne must be in json format as {Embrace Creative and Nurturing Careers :data} here data is dynamic data form bot and must be a paragraph with 3 sentences (minimum 3 paragraphs ) for Embrace Creative and Nurturing Careers in summary of horary astrology make it real for me I don't need theory context in response you must add context of planet , aspect and house if any and make sure you parseable json in ai_response else recalculate the answer again. "},"toolname":"other","json":{"ascendant":186.42234480081225,"midheaven":96.4203334296655,"vertex":277.2781580258426,"houses":[{"house":1,"sign":"Libra","sign_id":7,"degree":186.42234},{"house":2,"sign":"Scorpio","sign_id":8,"degree":215.39624},{"house":3,"sign":"Sagittarius","sign_id":9,"degree":245.69053},{"house":4,"sign":"Capricorn","sign_id":10,"degree":276.42033},{"house":5,"sign":"Aquarius","sign_id":11,"degree":307.33237},{"house":6,"sign":"Pisces","sign_id":12,"degree":337.81387},{"house":7,"sign":"Aries","sign_id":1,"degree":6.42234},{"house":8,"sign":"Taurus","sign_id":2,"degree":35.39624},{"house":9,"sign":"Gemini","sign_id":3,"degree":65.69053},{"house":10,"sign":"Cancer","sign_id":4,"degree":96.42033},{"house":11,"sign":"Leo","sign_id":5,"degree":127.33237},{"house":12,"sign":"Virgo","sign_id":6,"degree":157.81387}],"aspects":[{"aspecting_planet":"Sun","aspected_planet":"Mars","aspecting_planet_id":0,"aspected_planet_id":2,"aspect_type":1,"type":"Conjunction","orb":8.88,"diff":8.88},{"aspecting_planet":"Sun","aspected_planet":"Venus","aspecting_planet_id":0,"aspected_planet_id":5,"aspect_type":1,"type":"Conjunction","orb":3.01,"diff":3.01},{"aspecting_planet":"Sun","aspected_planet":"Neptune","aspecting_planet_id":0,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":3.73,"diff":123.73},{"aspecting_planet":"Sun","aspected_planet":"Pluto","aspecting_planet_id":0,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":1.41,"diff":178.59},{"aspecting_planet":"Sun","aspected_planet":"Ascendant","aspecting_planet_id":0,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":3.75,"diff":116.25},{"aspecting_planet":"Moon","aspected_planet":"Neptune","aspecting_planet_id":1,"aspected_planet_id":8,"aspect_type":4,"type":"Square","orb":3.66,"diff":93.66},{"aspecting_planet":"Moon","aspected_planet":"Midheaven","aspecting_planet_id":1,"aspected_planet_id":11,"aspect_type":5,"type":"Sextile","orb":3.67,"diff":56.33},{"aspecting_planet":"Mars","aspected_planet":"Uranus","aspecting_planet_id":2,"aspected_planet_id":7,"aspect_type":3,"type":"Trine","orb":1.76,"diff":118.24},{"aspecting_planet":"Mars","aspected_planet":"Pluto","aspecting_planet_id":2,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":7.47,"diff":172.53},{"aspecting_planet":"Mercury","aspected_planet":"Ascendant","aspecting_planet_id":3,"aspected_planet_id":10,"aspect_type":4,"type":"Square","orb":4.7,"diff":94.7},{"aspecting_planet":"Mercury","aspected_planet":"Midheaven","aspecting_planet_id":3,"aspected_planet_id":11,"aspect_type":1,"type":"Conjunction","orb":4.7,"diff":4.7},{"aspecting_planet":"Jupiter","aspected_planet":"Saturn","aspecting_planet_id":4,"aspected_planet_id":6,"aspect_type":1,"type":"Conjunction","orb":0.29,"diff":0.29},{"aspecting_planet":"Jupiter","aspected_planet":"Uranus","aspecting_planet_id":4,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.53,"diff":92.53},{"aspecting_planet":"Venus","aspected_planet":"Neptune","aspecting_planet_id":5,"aspected_planet_id":8,"aspect_type":3,"type":"Trine","orb":0.72,"diff":120.72},{"aspecting_planet":"Venus","aspected_planet":"Pluto","aspecting_planet_id":5,"aspected_planet_id":9,"aspect_type":2,"type":"Opposition","orb":4.42,"diff":175.58},{"aspecting_planet":"Venus","aspected_planet":"Ascendant","aspecting_planet_id":5,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.73,"diff":119.27},{"aspecting_planet":"Saturn","aspected_planet":"Uranus","aspecting_planet_id":6,"aspected_planet_id":7,"aspect_type":4,"type":"Square","orb":2.25,"diff":92.25},{"aspecting_planet":"Neptune","aspected_planet":"Pluto","aspecting_planet_id":8,"aspected_planet_id":9,"aspect_type":5,"type":"Sextile","orb":5.14,"diff":54.86},{"aspecting_planet":"Neptune","aspected_planet":"Ascendant","aspecting_planet_id":8,"aspected_planet_id":10,"aspect_type":3,"type":"Trine","orb":0.01,"diff":120.01},{"aspecting_planet":"Pluto","aspected_planet":"Ascendant","aspecting_planet_id":9,"aspected_planet_id":10,"aspect_type":5,"type":"Sextile","orb":5.16,"diff":65.16},{"aspecting_planet":"Ascendant","aspected_planet":"Midheaven","aspecting_planet_id":10,"aspected_planet_id":11,"aspect_type":4,"type":"Square","orb":0,"diff":90}],"planets":[{"name":"Sun","full_degree":70.1697,"norm_degree":10.1697,"speed":0.9589,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Moon","full_degree":40.092,"norm_degree":10.092,"speed":14.4256,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Mars","full_degree":79.0466,"norm_degree":19.0466,"speed":0.6821,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Mercury","full_degree":91.7231,"norm_degree":1.7231,"speed":1.4718,"is_retro":"false","sign_id":4,"sign":"Cancer","house":9},{"name":"Jupiter","full_degree":53.3416,"norm_degree":23.3416,"speed":0.2322,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Venus","full_degree":67.1558,"norm_degree":7.1558,"speed":1.2289,"is_retro":"false","sign_id":3,"sign":"Gemini","house":9},{"name":"Saturn","full_degree":53.056,"norm_degree":23.056,"speed":0.1252,"is_retro":"false","sign_id":2,"sign":"Taurus","house":8},{"name":"Uranus","full_degree":320.8098,"norm_degree":20.8098,"speed":-0.0049,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":5},{"name":"Neptune","full_degree":306.435,"norm_degree":6.435,"speed":-0.0118,"is_retro":"true","sign_id":11,"sign":"Aquarius","house":4},{"name":"Pluto","full_degree":251.579,"norm_degree":11.579,"speed":-0.0271,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Node","full_degree":115.5338,"norm_degree":25.5338,"speed":-0.1159,"is_retro":"true","sign_id":4,"sign":"Cancer","house":10},{"name":"Chiron","full_degree":254.42,"norm_degree":14.42,"speed":-0.0705,"is_retro":"true","sign_id":9,"sign":"Sagittarius","house":3},{"name":"Part of Fortune","full_degree":156.3446,"norm_degree":6.3446,"speed":0,"is_retro":"false","sign_id":6,"sign":"Virgo","house":11}],"lilith":{"name":"Lilith","full_degree":280.2163,"norm_degree":10.2163,"speed":0.1109,"is_retro":"false","sign_id":10,"sign":"Capricorn","house":4}}}			"RESULTS :         ""ai_response"": ""```json{  \""Embrace Creative and Nurturing Careers\"": {    \""data\"": \""Your birth chart reveals a strong inclination towards careers that allow you to express creativity and empathy, especially during the period from November 20th, 2025, to December 15th, 2025. The Venus trine Neptune aspect in your chart is a powerful indicator of artistic potential and a natural ability to nurture others, suggesting that roles in counseling, design, or any creative field could be particularly fulfilling. With the Sun and Venus in Gemini in the 9th house, your career path may also involve communication, travel, or education, allowing you to share your creative insights and empathetic nature with a broader audience.\""  }}```"",
"		








