# Service Template Content + Image Matrix

Scope:
- Includes every service template except `test template`
- Covers all 19 canonical templates and their 19 `general-*` variants
- Serves as the planning source for:
  - content seeding
  - image generation
  - `image_url` updates

## Content Standards

Every template will receive:
- short `description`
- `long_description`
- `whats_included`
- `who_its_for`
- `faq`
- `seo_title`
- `seo_description`
- explicit `image_url`

Content rules:
- Base templates: phrased as practitioner-led readings
- General templates: phrased as productized, non-diviner-specific readings
- Keep structure standardized, but keep the service-specific promise distinct
- Astrology copy should emphasize chart mechanics, timing, life themes, and birth-data precision
- Tarot copy should emphasize spread structure, question clarity, symbolic guidance, and actionable takeaways

Image rules:
- High-quality editorial / premium spiritual service look
- No visible faces as the focal point unless clearly justified
- No text baked into the image
- Strong visual distinction by service theme
- General templates should use premium neutral imagery, not diviner-branded imagery
- Canonical/general pairs with the same service meaning should share the same hero asset unless there is a real visual reason to separate them

## Filename Strategy

Shared pair image:
- `/images/services/<image-key>.png`

Separate general-only image:
- `/images/services/general-<image-key>.png`

Default rule:
- canonical and `general-*` pairs reuse the same asset
- a separate `general-*` file is only needed when the general product genuinely needs a different visual treatment

Where possible, the existing canonical image key naming is preserved.

## Matrix

| Category | Variant | Name | Slug | Content Direction | Image File | Image Concept |
|---|---|---|---|---|---|---|
| astrology | base | Nativity Birth Chart | `nativity-birth-chart` | Foundational natal chart reading: identity, strengths, emotional wiring, vocation, life themes, and major chart patterns | `natal-chart.png` | Celestial natal-chart tableau with zodiac wheel, layered constellation lines, warm gold-and-midnight palette |
| astrology | general | General Nativity Birth Chart | `general-nativity-birth-chart` | Productized natal chart overview with full-spectrum life interpretation and practical orientation | `natal-chart.png` | Refined non-branded natal-chart scene, luminous chart wheel, elegant cosmic desk composition |
| astrology | base | Solar Return | `solar-return` | Birthday-year forecast: annual themes, opportunities, pressure points, and timing windows | `solar-return.png` | Sun-centered astrological composition with radiant solar halo and orbital glyph layers |
| astrology | general | General Solar Return | `general-solar-return` | Annual planning and forecasting reading centered on the coming year | `solar-return.png` | Premium solar forecast art with bright solar disk, gold flares, and chart markings |
| astrology | base | Weekly Transits | `weekly-transits` | Short-horizon transit reading for the coming week, activation points, mood, and timing | `weekly-transits.png` | Dynamic weekly sky map with moving planetary arcs, crisp blue-gold motion cues |
| astrology | general | General Weekly Transits | `general-weekly-transits` | Weekly astrology planning product with clear short-term timing emphasis | `weekly-transits.png` | Editorial transit planning visual, celestial calendar cues, elegant movement lines |
| astrology | base | Monthly Transits + Lunar Return | `monthly-transits-lunar-return` | Monthly overview blending transits and lunar return for emotional and practical cycles | `monthly-transit.png` | Moon-forward astrology composition with silver lunar glow, monthly phase arc, soft chart overlay |
| astrology | general | General Monthly Transits + Lunar Return | `general-monthly-transits-lunar-return` | Monthly emotional and planning forecast with lunar-cycle emphasis | `monthly-transit.png` | Premium lunar-return image with moon phases, silver-blue gradients, polished celestial texture |
| astrology | base | Romantic Relationships | `romantic-relationships` | Synastry and composite reading for attraction, communication, compatibility, and long-term dynamics | `romantic-relationships.png` | Two interwoven chart wheels with subtle rose-gold energy and balanced partnership symbolism |
| astrology | general | General Romantic Relationships | `general-romantic-relationships` | Relationship compatibility product focused on emotional chemistry and long-term patterning | `romantic-relationships.png` | Refined compatibility art with dual chart overlays and elegant intimate cosmic atmosphere |
| astrology | base | Friendship Relationships | `friendship-relationships` | Friendship compatibility reading for values, ease, tension points, and loyalty dynamics | `friendship-relationships.png` | Dual-chart friendship visual with airy blue-gold tones and connected constellation lines |
| astrology | general | General Friendship Relationships | `general-friendship-relationships` | Productized friendship compatibility service with emphasis on support patterns and communication | `friendship-relationships.png` | Non-branded friendship-focused celestial composition with paired orbit motifs |
| astrology | base | Business Relationship | `business-relationship` | Partnership reading for shared goals, strategy fit, friction points, and role balance | `business-relationships.png` | Structured business astrology image with dual chart geometry, subtle architectural lines, gold slate palette |
| astrology | general | General Business Relationship | `general-business-relationship` | Strategic compatibility product for founders, collaborators, and business partners | `business-relationships.png` | Clean premium visual blending charts, grid structure, and high-end executive cosmic cues |
| astrology | base | Predictive Event (Horary) | `predictive-event-horary` | Focused horary reading for a specific question, event, or immediate uncertainty | `horary.png` | Precision horary scene with a single chart cast moment, sharp glyph ring, dramatic spotlight |
| astrology | general | General Predictive Event (Horary) | `general-predictive-event-horary` | Productized horary service emphasizing one precise question and clear answer structure | `horary.png` | Elegant horary-focused image, singular chart focus, suspenseful but clean atmosphere |
| astrology | base | Jupiter Return | `jupiter-return` | Expansion-cycle reading for growth, opportunity, confidence, and 12-year chapter resets | `jupiter-return.png` | Grand planet-forward visual with rich amber-violet tones and expansive orbital scale |
| astrology | general | General Jupiter Return | `general-jupiter-return` | Growth-cycle product centered on opportunity, abundance, and long-range momentum | `jupiter-return.png` | Premium Jupiter visual with magnified planetary presence and uplifting cosmic scale |
| astrology | base | Saturn Return | `saturn-return` | Major life-structure reading for discipline, responsibility, endings, and durable rebuilding | `saturn-return.png` | Moody structured Saturn scene with rings, deep indigo-charcoal palette, strong architectural feel |
| astrology | general | General Saturn Return | `general-saturn-return` | Productized Saturn Return guidance with maturity, pressure, and rebuild themes | `saturn-return.png` | Sophisticated Saturn imagery, disciplined geometry, premium dark-gold contrast |
| astrology | base | Mars Return | `mars-return` | Personal yearly energy reading for drive, courage, conflict, desire, and action patterns | `mars-return.png` | Bold Mars visual with red ember tones, motion energy, and decisive planetary focus |
| astrology | general | General Mars Return | `general-mars-return` | Productized action-cycle service focused on momentum, assertiveness, and timing | `mars-return.png` | Clean high-impact Mars scene with energetic red-gold motion and premium polish |
| astrology | base | Uranus Opposition | `uranus-opposition` | Midlife awakening reading for liberation, disruption, reinvention, and major turning points | `uranus-opposition.png` | Electric Uranus scene with teal-indigo lightning motifs and sudden-breakthrough energy |
| astrology | general | General Uranus Opposition | `general-uranus-opposition` | Reinvention and awakening product for major life pivots and identity shifts | `uranus-opposition.png` | Premium disruptive cosmic image with luminous electric atmosphere and sharp celestial contrast |
| tarot | base | 3 Card Basic Question Spread | `3-card-basic-question-spread` | Fast, focused tarot reading for one clear question and a concise directional answer | `3-card-basic.png` | Minimal three-card spread on luxe velvet, warm candlelit atmosphere, crisp card geometry |
| tarot | general | General 3 Card Basic Question Spread | `general-3-card-basic-question-spread` | Productized quick-answer tarot spread for immediate clarity and next steps | `3-card-basic.png` | Premium three-card tabletop spread with elegant lighting and editorial framing |
| tarot | base | 5 Card Complex Question Spread | `5-card-complex-question-spread` | Deeper tarot reading for layered situations with context, challenge, advice, and likely outcome | `5-card-complex.png` | Five-card spread with richer symbolic setting, layered shadows, and contemplative depth |
| tarot | general | General 5 Card Complex Question Spread | `general-5-card-complex-question-spread` | Productized complex-question tarot reading with stronger decision-support framing | `5-card-complex.png` | Clean premium five-card composition, elegant high-detail divination desk scene |
| tarot | base | 7 Card 6 Month Forward Review | `7-card-6-month-forward-review` | Mid-range forecast spread for the next six months and major directional themes | `7-card-forecast.png` | Seven-card forecast scene with subtle timeline arc, calendar cues, and warm mystical lighting |
| tarot | general | General 7 Card 6 Month Forward Review | `general-7-card-6-month-forward-review` | Six-month guidance product framed around momentum, risks, and future planning | `7-card-forecast.png` | Premium forecast spread with temporal visual cues and polished editorial tarot styling |
| tarot | base | 7 Card Horseshoe Spread (Major Read) | `7-card-horseshoe-spread-major-read` | Classic horseshoe reading for influences, obstacles, guidance, and likely outcome | `7-card-horseshoe.png` | Horseshoe card layout on deep velvet with luminous highlights and ritual symmetry |
| tarot | general | General 7 Card Horseshoe Spread (Major Read) | `general-7-card-horseshoe-spread-major-read` | Productized major spread reading with balanced overview and deeper symbolic interpretation | `7-card-horseshoe.png` | Elevated horseshoe spread image with luxury styling and strong composition |
| tarot | base | 10 Card Relationship Spread | `10-card-relationship-spread` | Relationship tarot reading for emotional dynamics, hidden tensions, and future direction | `10-card-relationship.png` | Ten-card relational spread with paired symbolic zones, romantic but restrained palette |
| tarot | general | General 10 Card Relationship Spread | `general-10-card-relationship-spread` | Productized relationship spread focused on insight, patterns, and practical next steps | `10-card-relationship.png` | Premium relationship spread with elegant dual-space layout and warm candlelit mood |
| tarot | base | 10 Card Celtic Cross (Major Read) | `10-card-celtic-cross-major-read` | Deep full-spectrum tarot reading using the Celtic Cross for complex situations | `10-card-celtic-cross.png` | Dramatic Celtic Cross layout with strong central card focus and ritual visual depth |
| tarot | general | General 10 Card Celtic Cross (Major Read) | `general-10-card-celtic-cross-major-read` | Productized in-depth tarot overview using the most comprehensive classic spread | `10-card-celtic-cross.png` | Refined premium Celtic Cross image, dark-luxe palette, sharp card arrangement |
| tarot | base | 12 Card Astrological Spread (Major Read) | `12-card-astrological-spread-major-read` | Tarot-astrology hybrid spread mapped to the 12 houses for a whole-life overview | `12-card-astrological.png` | Twelve-card zodiac spread arranged in a wheel, celestial-gold tarot fusion aesthetic |
| tarot | general | General 12 Card Astrological Spread (Major Read) | `general-12-card-astrological-spread-major-read` | Productized astrological tarot spread covering all major life domains | `12-card-astrological.png` | Premium tarot-zodiac wheel composition with luminous house ring and editorial finish |

## Pairing Rule For Final Seed Data

For each `general-*` template:
- content structure mirrors its base service
- tone becomes catalog/product oriented rather than practitioner-oriented
- image concept remains thematically matched and should usually reuse the same shared hero asset as the base template
- a separate `general-*` asset is only justified when the general product needs materially different art direction

## Notes For Execution

- `General Nativity Birth Chart` should share the refreshed `natal-chart.png` asset unless we later decide it needs a materially different visual treatment.
- Existing canonical static images can be replaced with newly generated higher-quality shared assets if the final visual quality is clearly better.
- The generation scope is now the unique service set, not a duplicated canonical-plus-general set.
- `mars-return` and `uranus-opposition` currently map to `.svg` fallbacks in `src/lib/service-images.ts`; once new raster assets are generated, that mapping should be updated.
