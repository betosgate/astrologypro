import { getMonthName, convertTo12HourFormat } from "./utils";

export function buildAiPrompts(data: any, tab: string, areaOfInquiry?: string, excludedDates?: string) {
  const prompts: { key: string; system: string; user: string; json: unknown[] }[] = [];

  if (tab === "western_horoscope_v2" || tab === "solar_return_v2" || ["jupiter_return_v2", "saturn_return_v2", "mars_return_v2", "uranus_return_v2"].includes(tab)) {
    prompts.push({
      key: "western_horoscope_ascendant_midheaven_vertex",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation.response should not start with string 'json'  ever  and must be with in  an array  ",
      user: "Generate western chart details only on ascendant,midheaven,vertex based on given json with minimum 3 sentences on each interpretations(for each ascendant ,midheaven , vertex) (mention significance of degree (upto 2 desimal points) for each) with a numnber as index named index  of  ascendant,midheaven,vertex in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single ascendant,midheaven,vertex there are many please be careful and response should not start with string 'json'  ever but in proper json format and with in  an array of object format should be \n[\n  {\"ascendant\":\"interpretation\"},\n  {\"midheaven\":\"interpretation\"},\n  {\"vertex\":\"interpretation\"}\n].Double check that response should not start with string 'json'  ever  and must be with in  an array ",
      json: [{ ascendant: data.ascendant, midheaven: data.midheaven, vertex: data.vertex, houses: data.houses, aspects: data.aspects, planets: data.planets }],
    });
    prompts.push({
      key: "western_horoscope_aspects",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
      user: "Generate western chart details only on aspects based on given json with minimum 3 sentences on each interpretation with a numnber as index  of  aspect in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single aspect there are many please be careful object format in json  should be {\"title\":\"Title or heading of the interpretation \",\"interpretation\":\"Details Interpretation\", \"orb\":data} , response should not start with string 'json'  ever  and must be with in  an array ",
      json: data.aspects,
    });
    prompts.push({
      key: "western_horoscope_houses",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
      user: "Generate western chart details only on houses based on given json with minimum 3 sentences on each interpretation with a numnber as index  of  houses in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single houses there are many please be careful and response should not start with string 'json'  ever but in proper json format in an array ",
      json: data.houses,
    });
    prompts.push({
      key: "western_horoscope_lilith",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
      user: "Generate western chart details only on lilith based on given json with minimum 3 sentences on each interpretation with a numnber as index  of  lilith in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single lilith there are many please be careful and response should not start with string 'json'  ever but in proper json format in an array and json must have only one index called interpretation and that will be string not object.response should not start with string 'json'  ever  and must be with in  an array",
      json: [data.lilith],
    });
    prompts.push({
      key: "western_horoscope_planets",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that planet and under that interpretation ",
      user: "Generate western chart details only on planets based on given json with minimum 10 unique sentences on each planet and its significance with each of house position , full degree, norm degree , speed , sign in as much as detail possible(5 sentences for each of house position , full degree, norm degree , speed , sign all should be with in interpretation not in other index for sure ) . don't miss a single planet there are many please be careful  and response should not start with string 'json'  ever but in proper json format in an array and object in json will be name and interpretation(each of them must have 3 sentences at least) only (nothing else) where both will be string only not object",
      json: data.planets,
    });
    prompts.push({
      key: "dharma_karma",
      system: "give response only in json format as a whole , nothing else answer as astrologer not AI BOT",
      user: "Keeping western astrology in mind and keeping this as main source info I need to know details of dharma and karma karma as paragraph you have planet , aspect and house info given in json response must be in json format as {dharma:data,karma:data} ,response should not start with string 'json' key  ever  and must be a valid json format here data is dynamic data form bot and must be a paragraph with 3 sentences for both dharma and karma make it real for me I don't need theory context in response you must add context of planet , aspect and house if any and keep these rules in mind mainly : In Western astrology, we can interpret Karma and Dharma by analyzing various planetary placements and aspects. Saturn, as the Karmic Significator, reveals areas of life where karmic lessons, restrictions, and responsibilities may arise, with its house and sign placement providing clues to these areas, and aspects to other planets revealing specific challenges and opportunities for growth. The South Node and the 12th House offer insights into past life tendencies and ingrained patterns that need to be released, with the South Node indicating these tendencies through its sign and house placement, and the 12th House, linked to the subconscious, potentially revealing karmic debts or unresolved issues. Conversely, the North Node and 9th House point toward the soul's evolutionary path and the direction of growth, with the North Node indicating this direction through its sign and house placement, and the 9th House, representing higher learning and philosophy, providing clues about the individual's Dharma and potential paths to meaning and purpose. Jupiter, as a Dharmic Indicator, highlights areas of potential expansion, wisdom, and fulfillment of Dharma through its house and sign placement, while aspects to other planets can reveal opportunities for growth and alignment with the soul's purpose. The Sun and Moon placements also contribute to understanding Karma and Dharma; the Sun represents the core identity and conscious will, offering insights into karmic lessons and how one can shine their light, while the Moon reflects emotional needs and subconscious patterns, potentially connected to past life influences and karmic themes. Finally, analyzing aspects and chart dynamics, specifically challenging aspects (squares, oppositions) and harmonious aspects (trines, sextiles), helps identify potential karmic blockages or areas of conflict, and opportunities for growth, integration, and fulfillment of Dharma. Double check that Response should not start with string 'json'  ever  and must be a valid json format",
      json: [{ planet: data.planets, aspect: data.aspects, house: data.houses }],
    });
  }

  if (tab === "solar_return_v2") {
    prompts.push({
      key: "solar_return_details",
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
      user: "Generate solar return details based on given json with minimum 3 sentences on each interpretation with a number as index of details in as much detail as possible, only interpretation in json index in lowest level of indexes please and don't miss a single detail. Response should not start with string 'json' ever but in proper json format in an array with objects {\"title\":\"...\",\"interpretation\":\"...\"}",
      json: [{ details: data.solar_return_details, planets: data.solar_return_planets, cusps: data.solar_return_cusps, aspects: data.solar_return_aspects }],
    });
  }

  if (tab === "tropical_transits_weekly_v2") {
    const isFuture = !!data.is_future_transit;
    const transitData = data.transit_data;
    const sys = "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation";
    if (isFuture) {
      const futureDate = data.future_transit_date ?? "";
      const [fy, fm, fd] = futureDate.split("-");
      prompts.push({
        key: "tropical_transits_weekly",
        system: "give response only in valid json format as a whole, nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
        user: `For the week containing ${fd} ${fm} ${fy}, provide the Tropical Transits Weekly Relation for a person born on ${data.month}/${data.day}/${data.year} at ${data.hour}:${String(data.min ?? 0).padStart(2, "0")} in their birth city, with the result validated against the provided JSON data , formatted as { "aspecttitle": "value", "interpretation": "value" } inside an array,all transit data needs to be there  in same  order  in your resopense, where aspecttitle is the aspect title and interpretation is a 8 sentence paragraph, with each interpretation containing at least three sentences; ensure the response is valid JSON without the word 'json', ensuring the interpretation is properly parsed and formatted on the frontend..`,
        json: [transitData?.transit_relation ?? transitData],
      });
    } else {
      prompts.push({
        key: "tropical_transits_weekly",
        system: sys,
        user: `Generate  weekly transit details based on given json with minimum 5 sentences on each interpretation as interpretation  with a number as index named index  of  weekly transit details details in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single weekly transit details there are many please be careful and response should not start with string 'json'  ever but in proper json format and with in  an array of object format should be [\n{\n"title":\n"interpretation"\n\n}\n\n] we need multiple unique titles for sure with different interpretation`,
        json: [transitData],
      });
    }
  }

  if (tab === "tropical_transits_monthly_v3") {
    const isFuture = !!data.is_future_transit;
    const transitData = data.transit_data;
    const lunarData = data.lunar_metrics;
    const sys = "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation";
    if (isFuture) {
      const futureDate = data.future_transit_date ?? "";
      const [fy, fm] = futureDate.split("-");
      prompts.push({
        key: "tropical_transits_monthly",
        system: sys,
        user: `for the month  ${fm} ${fy} as a date give me Tropical Transits Monthly Relation in above format for a person whose dob is ${data.month}/${data.day}/${data.year} at ${data.hour}:${String(data.min ?? 0).padStart(2, "0")} and place their birth city must be validated and accurate and response should be craeted on basis of given json data. Follow the asked format strictly no other index expected that asked indexes , both aspecttitle and  interpretation must be text in specific aspecttitle will be header and interpretation will be paragraph of 5 sentences atleast  response format must be as exact :  {{aspecttitle:value},{interpretation:value}  create multiple records on each date and type with unique aspecttitle please not just one and detail as much as possible and again response format must be as exact :  {aspecttitle:value},{interpretation:value}.response should not start with string 'json'  ever  and must be a valid json format`,
        json: [transitData?.unique_transits ?? transitData],
      });
      prompts.push({
        key: "lunar_metrics",
        system: sys,
        user: `for the Month  ${fm} ${fy} as a date give me Lunar Metrics as Month ,Moon Day,Moon Illumination,Moon Phase,Moon Sign in a format for a person whose dob is ${data.month}/${data.day}/${data.year} at ${data.hour}:${String(data.min ?? 0).padStart(2, "0")} and place their birth city response should be craeted on basis of given json data, and  accurate as format must be  {month:value with unit} , {moonday:value with unit},{moon_illumination:value with unit},{moonphase:value with unit},{moonsign:value} , {moon_sign_interpretation:value} ,{moon_phase_interpretation:value} , {moon_age_interpretation:value} ,{moon_day_interpretation:value},{moon_illumination_interpretation:value} where moonsigninterpretation , moonphaseinterpretation , moonageinterpretation ,moondayinterpretation ,moonilluminationinterpretation values must be paragraph having atleast 5 sentences each these response must come from calculation and should be validated with astrology calculations and in interpretation value if there is any number round to nearest integer if it's a decimal,  response should not start with string 'json'  ever  and  must be a valid json format. `,
        json: [{ transit_relation: transitData?.unique_transits, lunar_matrics: lunarData }],
      });
    } else {
      prompts.push({
        key: "tropical_transits_monthly",
        system: sys,
        user: `Generate  monthly transit details based on given json with minimum 5 sentences on each interpretation as interpretation  with a number as index named index  of  monthly transit details details in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single monthly transit details there are many please be careful and response should not start with string 'json'  ever but in proper json format and with in  an array ofresult must be validated and accurate as format must be  [\n{\n"title":\n"interpretation"\n\n}\n\n]   we need multiple unique titles for sure with different interpretation. Don't add Natal word before any title and response should not start with string 'json'  ever  and must be a valid json format`,
        json: [transitData],
      });
      prompts.push({
        key: "lunar_metrics",
        system: sys,
        user: `Generate  lunar return details based on given json with minimum 5 sentences on each interpretation as interpretation  with a numnber as index named index  of  lunar return details in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single lunar return details there are many please be careful and response should not start with string 'json'  ever but in proper json format and with in  an array of object format should be{"title":"Title or heading of the interpretation ","interpretation":"Details Interpretation" } , response should not start with string 'json'  ever  and must be with in  an array. make sure each interpretation has more than 5 sentences  `,
        json: [lunarData],
      });
    }
  }

  if (["romantic_forecast_report_tropical_v2", "friendship_report_tropical_v2", "business_partner_v2"].includes(tab)) {
    const p1 = data.person1_birth ?? {};
    const p2 = data.person2_birth ?? {};
    const personaCity = typeof data.persona_city === "object" ? data.persona_city.label : (data.persona_city ?? "");
    const partnerCity = typeof data.partner_city === "object" ? data.partner_city.label : (data.partner_city ?? "");
    const context = tab === "romantic_forecast_report_tropical_v2" ? "love" : tab === "friendship_report_tropical_v2" ? "friendship" : "business partnership";
    const relationshipContext = tab === "romantic_forecast_report_tropical_v2" ? "love relationship partner" : tab === "friendship_report_tropical_v2" ? "friendship partner" : "business relationship partner";
    const sys = "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for a To conduct a detailed synastry chart analysis, you will need precise birth data from both parties, including the exact birth time, date, and location, to accurately calculate their astrological charts. Start by examining the aspects between each person's personal planets (Sun, Moon, Venus, Mars) and the other's outer planets (Jupiter, Saturn, Uranus, Neptune, Pluto) to uncover dynamics of attraction, compatibility, and potential friction points. Assess the house overlays by noting where each individual's planets land in the other's astrological houses, which sheds light on the influence they exert over various life areas of their partner. Analyze the interactions between each person's Ascendant (self-expression) and Descendant (partnership qualities) to gauge core compatibility and relational dynamics. Additionally, explore the North and South Nodes to delve into themes of karmic connections or shared life purposes. Utilizing advanced astrology software or reliable online resources can facilitate this complex analysis, while reference books from respected astrologers can provide deeper interpretive frameworks. For a nuanced understanding, especially in complicated synastry situations, consulting with a professional astrologer is advisable.";

    const b1Str = `I was born on ${getMonthName(p1.month)} ${p1.day}, ${p1.year},  ${p1.hour}:${String(p1.min ?? 0).padStart(2, "0")} in  ${personaCity}  'lat:${p1.lat},lon:${p1.lon},tzone:${p1.tzone}'.`;
    const b2Str = `my ${relationshipContext} was born on  ${getMonthName(p2.month)} ${p2.day}, ${p2.year} ${p2.hour}:${String(p2.min ?? 0).padStart(2, "0")} at ${partnerCity}   'lat:${p2.lat},lon:${p2.lon},tzone:${p2.tzone}'`;
    const suffix = ` in {data:[{title:data}]}  exact this format where each data must be atleast 3 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response  `;

    const synJson = [data.synastry ?? data];
    const selfPartnerJson = [{ mydetails: { ...p1 }, fiend_details: { ...p2 } }];

    prompts.push({ key: "synastry_horoscope", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate our synastry chart of this partnership${suffix}`, json: synJson });
    prompts.push({ key: "composite_horoscope", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate our composite chart of this partnership${suffix}`, json: synJson });
    const isBusinessTab = tab === "business_partner_v2";
    const davisonSystem = isBusinessTab ? `give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for a To conduct a For The Time and Location Midpoint in the The Davison Relationship Chart is an astrological tool that calculates the midpoint between two individuals' natal charts, providing insights into the combined energy and journey of a partnership as a separate entity, distinct from the individuals themselves. This chart, created by averaging the longitudes of the planets, the Sun, and the Moon of both partners, reflects the 'relationship soul' — the unique qualities and life trajectory of the partnership over time. From an astrological perspective, the Midpoint in the Davison chart can indicate crucial moments in the partnership's evolution, such as pivotal transits or progressions that activate significant aspects of the partnership's core dynamics. For example, a Saturn-Pluto midpoint in the chart could suggest transformational or intense periods of growth or crisis, where the relationship is tested and undergoes deep, often karmic changes. A Venus-Jupiter midpoint might indicate periods of expansion, creativity, or abundance, marking times when the partnership feels particularly lucky or harmonious. The overall aspect pattern, planetary placements, and house positions in the Davison chart reveal the key themes, challenges, and milestones of the relationship's timeline, often highlighting periods when the relationship is called to evolve or face external tests. By examining these midpoints, you can understand the deeper, time-bound narrative that shapes the course of the partnership.. Provide a deeply personalized response as if you are speaking directly to your astrology client in a one-on-one session. Use the language and tone of a trusted Western astrologer offering tailored guidance based on the client’s unique chart. Always interpret the chart using the Placidus house system as the default house_type. Avoid using generic phrases or repeated sentence structures. Each sentence should feel intentionally crafted and distinct, offering fresh insight without duplicating wording from similar interpretations.

The user has provided a specific "Area of Inquiry": "${areaOfInquiry || "career"}". Make this the central theme of your interpretation. While you should ground the reading in this context, also incorporate other relevant insights from the chart that support or add nuance to this primary focus. Conclude the response by explicitly summarizing how the various astrological insights tie back to the client’s stated area of inquiry.` : sys;

    const davisonUser = isBusinessTab ? `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate our davison relation ship chart of this partnership in {data:[{title:data}]}  exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response  ` : `${b1Str.replace("I was born on", `I was born on `)} ${b2Str.replace(`my ${relationshipContext} was born on  `, `my ${relationshipContext} was born on  `)} I have added birth chart details of mine and my ${relationshipContext} both now calculate Aspect and Conjunction of this partnership${suffix.replace("atleast 3 sentences", "atleast 5 sentences")}`;

    prompts.push({ 
      key: "davison_relationship", 
      system: davisonSystem, 
      user: davisonUser, 
      json: isBusinessTab ? { mydetails: data.natal_chart_data, fiend_details: data.natal_chart_data_p2 } : selfPartnerJson 
    });
    prompts.push({ key: "major_aspects_and_connections", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate our davison relation ship chart of this partnership${suffix}`, json: selfPartnerJson });
    prompts.push({ key: "compatibility_score_or_summary", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate compatibility score or summery of this partnership${suffix}`, json: selfPartnerJson });

    const elementalSystem = `give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation inportant aspects of assessing the potential for In relationship astrology, Elemental Balance between two individuals' charts reveals the harmony or imbalance of the four classical elements—Fire, Earth, Air, and Water—and how these elements manifest in their emotional, intellectual, and practical interactions. Fire signs (Aries, Leo, Sagittarius) bring passion, energy, and enthusiasm, while Earth signs (Taurus, Virgo, Capricorn) offer groundedness, stability, and a practical approach. Air signs (Gemini, Libra, Aquarius) emphasize communication, intellectual connection, and adaptability, whereas Water signs (Cancer, Scorpio, Pisces) are sensitive, intuitive, and emotionally deep. A balanced elemental composition fosters a natural flow between the two individuals, with each element complementing the others. However, if one element is overly dominant or lacking, it can create friction or unmet needs within the friendship, such as emotional disconnect (lack of Water) or intellectual tension (lack of Air). Modalities of the signs—Cardinal, Fixed, and Mutable—further refine how each person approaches challenges and shared experiences. Cardinal signs (Aries, Cancer, Libra, Capricorn) are initiators, eager to start new projects and lead the way. Fixed signs (Taurus, Leo, Scorpio, Aquarius) are steady, determined, and focused on maintaining consistency and follow-through. Mutable signs (Gemini, Virgo, Sagittarius, Pisces) are adaptable and flexible, capable of adjusting to changing circumstances. The interaction of modalities between friends can reveal how they handle conflict, cooperation, and change: Cardinal signs might push for action, Fixed signs will seek stability, and Mutable signs will provide flexibility. A balanced mix of these modalities can foster a dynamic, harmonious relationship, where each person’s approach is respected and valued.. Provide a deeply personalized response as if you are speaking directly to your astrology client in a one-on-one session. Use the language and tone of a trusted Western astrologer offering tailored guidance based on the client’s unique chart. Always interpret the chart using the Placidus house system as the default house_type. Avoid using generic phrases or repeated sentence structures. Each sentence should feel intentionally crafted and distinct, offering fresh insight without duplicating wording from similar interpretations.

The user has provided a specific "Area of Inquiry": "${areaOfInquiry || "friendship"}". Make this the central theme of your interpretation. While you should ground the reading in this context, also incorporate other relevant insights from the chart that support or add nuance to this primary focus. Conclude the response by explicitly summarizing how the various astrological insights tie back to the client’s stated area of inquiry.`;

    const elementalUser = `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate elemental balance of this partnership in {data:[{title:data}]} exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response `;

    prompts.push({ key: "elemental_balance", system: elementalSystem, user: elementalUser, json: selfPartnerJson });
    const timingJson = [{
      first: data.natal_chart_data?.planets ?? [],
      second: data.natal_chart_data_p2?.planets ?? [],
      synastry: data.synastry ?? data
    }];

    prompts.push({ key: "timing_and_transits", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate our synastry chart of this partnership in {data:[{title:data}]}  exact this format where each data must be atleast 3 sentences with astrological logic with relevance to my question ("${areaOfInquiry || "friendship"}") only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response  `, json: timingJson });
    if (tab === "business_partner_v2") {
      prompts.push({ key: "professional_alignment_and_goals", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate professional alignment and goals of this partnership${suffix}`, json: selfPartnerJson });
    } else if (tab === "friendship_report_tropical_v2") {
      const karmicSystem = `give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation important aspects of assessing the potential for In relationship astrology, karmic and supportive indicators in a friendship can be seen through the relationship between Chiron (the Wounded Healer) and the Lunar Nodes (North and South Nodes of the Moon), as they reveal how the individuals contribute to each other’s healing and growth. A prominent Chiron aspect, such as Chiron conjunct one of the Nodes or forming harmonious aspects to personal planets, suggests that the friends may share deep emotional wounds and offer each other a space for mutual healing. These friendships often involve learning important life lessons about vulnerability, compassion, and forgiveness, as both individuals help each other confront and transcend old pain. The Lunar Nodes indicate the soul’s evolutionary path, so when they connect with personal planets in the natal charts of friends, it can create a sense of destiny or a deeper understanding between them, as if they have met to support one another on their life’s journey. Additionally, aspects to significant asteroids like Pallas, Vesta, and Ceres further define the unique ways in which each friend provides support. For instance, Pallas might indicate shared intellectual pursuits or wisdom-based support, Vesta could show where one friend is particularly devoted to helping the other with focus or dedication, and Ceres points to where nurturing and care are exchanged, especially in times of emotional need. These astrological markers suggest a relationship not just of fun or companionship, but of deep emotional connection and mutual growth, where each person plays a role in the other's healing and soul development.. Provide a deeply personalized response as if you are speaking directly to your astrology client in a one-on-one session. Use the language and tone of a trusted Western astrologer offering tailored guidance based on the client’s unique chart. Always interpret the chart using the Placidus house system as the default house_type. Avoid using generic phrases or repeated sentence structures. Each sentence should feel intentionally crafted and distinct, offering fresh insight without duplicating wording from similar interpretations.

The user has provided a specific "Area of Inquiry": "${areaOfInquiry || "marriage"}". Make this the central theme of your interpretation. While you should ground the reading in this context, also incorporate other relevant insights from the chart that support or add nuance to this primary focus. Conclude the response by explicitly summarizing how the various astrological insights tie back to the client’s stated area of inquiry.`;
      const karmicUser = `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate Karmic and supportive Indicators of this partnership in {data:[{title:data}]}  exact this format where each data must be atleast 5 sentences with astrological logic with relevance to my question only for each aspect , planet and house on relevant blocks and why you are saying these add an astrologica reason like aspect (with type), house position of planet on each title and data  with astrological data relevant to my data , each title will be heading and data will be context in detail for the title make sure you calculate before response astro analysis must accurate should not change with same data.summery will be mostly generic and recomendtion equal mix of generic and astrological data dont repet that what you have already mentioned in other indexes these could be shorter make sure number content / data on Astrological_aspect is always much more than summery and recomendation to add more here is my birth chart data in json format , try to reffer and mention in your response  `;
      prompts.push({ key: "karmic_and_soulmate_indicators", system: karmicSystem, user: karmicUser, json: selfPartnerJson });
    } else {
      prompts.push({ key: "karmic_and_soulmate_indicators", system: sys, user: `${b1Str} ${b2Str} I have added birth chart details of mine and my ${relationshipContext} both now calculate Karmic and Soulmate Indicators of this partnership${suffix}`, json: selfPartnerJson });
    }
  }

  if (tab === "horary_chart_v2") {
    const currentDate = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    const b = data;
    const city = data.city ?? "";
    const question = data.question ?? "";
    const natalChartData = data.horary_chart_data ?? data;

    const sys = `give response only in json format as a whole , nothing else answer as astrologer not AI BOT user data index related to astrology as data under that aspect and under that interpretation . Provide a deeply personalized response as if you are speaking directly to your astrology client in a one-on-one session. Use the language and tone of a trusted Western astrologer offering tailored guidance based on the client’s unique chart. Always interpret the chart using the Placidus house system as the default house_type. Avoid using generic phrases or repeated sentence structures. Each sentence should feel intentionally crafted and distinct, offering fresh insight without duplicating wording from similar interpretations.

The user has provided a specific "Area of Inquiry": "${areaOfInquiry || "general"}". Make this the central theme of your interpretation. While you should ground the reading in this context, also incorporate other relevant insights from the chart that support or add nuance to this primary focus. Conclude the response by explicitly summarizing how the various astrological insights tie back to the client’s stated area of inquiry.`;

    const user = `I was born on ${getMonthName(b.month)} ${b.day}, ${b.year} time ${b.hour}:${String(b.min ?? 0).padStart(2, "0")}, in ${city} ,'lat:${b.lat},lon:${b.lon},tzone:${b.tzone}'. ${question}. I'm providing you with my birth chart data in a separate JSON object. You MUST use this data to generate a personalized astrological analysis in the following JSON format:{data:{astrological_aspect:{aspect:[{title:data}],planet:[{title:data}],house:[{title:data}]},summary:{answer:[{title:data}],recommendation:[{title:data}],recommendation_on_date_and_timeline:[{timeline_title:timeline_data}]}}}

example format to follow :
{
 "data": {
 "astrological_aspect": {
 "aspect": [
 {
 "title": "Mars Trine Jupiter (Transit to Natal)",
 "data": "Between <span class=\"timedata\">January 10th and February 15th, 2025</span>, transiting Mars in Sagittarius forms a trine aspect to your natal Jupiter in the 12th house. This harmonious alignment amplifies your ambition, optimism, and drive to pursue your goals, particularly those related to spirituality, intuition, or humanitarian causes. It supports taking decisive action and expanding your vision, bringing opportunities for growth and success in these areas."
 }
 ],
 "planet": [
 {
 "title": "Transiting Mars",
 "data": "Between <span class=\"timedata\">January 10th and February 15th, 2025</span>, Mars transits through Sagittarius and forms a harmonious trine to your natal Jupiter in the 12th house."
 }
 ],
 "house": [
 {
 "title": "12th House (Transit Activation)",
 "data": "Between <span class=\"timedata\">January 10th and February 15th, 2025</span>, your 12th house is activated."
 }
 ]
 },
 "summary": {
 "answer": [
 {
 "title": "Optimal Time",
 "data": "Based on your birth chart data, the optimal time is between <span class=\"timedata\">January 10th and February 15th, 2025</span>."
 }
 ],
 "recommendation": [
 {
 "title": "Focus on 12th House Themes",
 "data": "Given the emphasis on your 12th house, consider incorporating themes related to spirituality."
 }
 ],
 "recommendation_on_date_and_timeline": [
 {
 "timeline_title": "Between <span class=\"timedata\">January 10th and February 15th, 2025</span>",
 "timeline_data": "This period is particularly auspicious."
 }
 ]
 }
 }
}
I need you to strictly adhere to these rules:

1.Personalized Interpretations ONLY: Absolutely NO generic explanations of planets, aspects, or houses. Every interpretation in the data fields must be derived from and specific to MY birth chart data and reasoning with timeline_data you suggested. No general info expected.

2.FUTURE Justified Timelines: The timeline_data must identify a favorable future date range that begins strictly after ${currentDate}. Within this recommended time period, you MUST also pinpoint multiple specific, highly auspicious dates for taking action. You must structure this recommendation by first presenting the single "Top Choice Date," followed by a list of "Other Favorable Dates." For both the overall date range and each specific date, you MUST provide a detailed astrological justification, explaining exactly which transits to MY birth chart make these times significant.
3.Data Richness: Each data field needs at least three full sentences of detailed, personalized interpretation.
4.Accurate Titles: Use concise labels for each title (e.g., 'Sun Conjunct Moon', 'Mars in Aries').
5.Complete Data: Ensure ALL objects have both title and data fields.
6. Date Formatting: In all "data" and "timeline_data" fields, you MUST wrap every specific date or date range with an HTML span tag using the class "timedata". This formatting is mandatory.
${excludedDates ? `7. Excluded Dates: You MUST AVOID recommending the following dates or date ranges entirely: ${excludedDates}. All of your suggested timelines must fall outside of these exclusion periods.` : ""}
8. Flexible Timeline Search: If a user-provided date range contains no potent astrological windows (especially due to excluded dates), or if a significantly more powerful alignment exists just outside it, you are permitted to suggest an alternative. This alternative must be within 30 days of the requested range's start or end, and you must never suggest a past date. When doing so, you must explicitly note that you are going beyond the requested range and provide a compelling astrological justification for why the alternative date is a superior choice.

7.Response should not start with string 'json' ever and must be valid json format.`;

    prompts.push({
      key: "horary_chart_question",
      system: sys,
      user: user,
      json: [natalChartData],
    });
  }

  const returnTabMap: Record<string, string> = { "jupiter_return_v2": "jupiter_return_v2", "saturn_return_v2": "saturn_return_v2", "mars_return_v2": "mars_return_v2", "uranus_return_v2": "uranus_return_v2" };
  if (returnTabMap[tab]) {
    const planet = tab.split("_")[0];
    const planetCap = planet.charAt(0).toUpperCase() + planet.slice(1);
    const returnDate = data?.returnDate ?? "calculated";
    const city = data.city ?? data.birthplace ?? "";
    const natalData = data.planet_return_data ?? data;
    prompts.push({
      key: returnTabMap[tab],
      system: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT  ",
      user: `My Bday is ${data.year} ${getMonthName(data.month)} ${data.day} , time ${convertTo12HourFormat(data.hour, data.min)}  , at  ${city}   and according to the astrological logic and  aspects my next ${planet} return date is ${returnDate},  I want to know about ${planet} return,  interested on career, relationships and others.house system should be whole sign give me chart data first and then detailed content as title and inter pretation in json format but nothing else and should not start with string 'json' and each interpretations of each title . example response format should be {\n  \"chart_data\": {\n    \"date_of_birth\": \"{data}\",\n    \"time_of_birth\": \"{data}\",\n    \"place_of_birth\": \"{data}\",\n   \"exact_position_details_of_${planet}_at_time_of_birth \": \"{data}\",\n    \"house_system\": \"Whole Sign\",\n    \"Positions\": {\n      \"Sun\": \"{data}\",\n      \"Moon\": \"{data}\",\n      \"Mercury\": \"{data}\",\n      \"Venus\": \"{data}\",\n      \"Mars\": \"{data}\",\n      \"${planetCap}\": \"{data}\",\n      \"Saturn\": \"{data}\",\n      \"Uranus\": \"{data}\",\n      \"Neptune\": \"{data}\",\n      \"Pluto\": \"{data}\",\n      \"North_Node\": \"{data}\",\n      \"South_Node\": \"{data}\",\n      \"Ascendant\": \"{data}\"\n    }\n  },\n  \"title_and_interpretation\": {\n    \"title\": \" Upcoming ${planetCap} Return Analysis for {data}\",\n    \"interpretation\": {\n      \"General\": \"{data_10}.\",\n      \"Career\": \"data.\",\n      \"Relationships\": \"data.\",\n      \"Personal Growth\": \"{data_10}.\",\n      \"Health\": \"{data}\",\n  \"Family\": \"{data}\",\n  \"Social\": \"{data}\",\n  \"Spiritual\": \"{data_10}\"\n  }\n  }\n}\n  take json as example structure do not copy content please and replace data with proper detailed related response like real  positions of stars.every intepretation after the title should be with detailed reasoning related to stars/planets and their positions of house keeping significance of ${planet} in mind and mention both positive and negetives stuffs  with reasoning and interpretation must be very specific as astrologer not general and should sound very confident on observations and keeping age of mine with 3 sentences on each tpoic is must keeping all other plantets positions in calculation too is most important . all {data} and {date_data} should be populated with real calculated info . remember all date time data should be in usa date and time format always whereever we have date / time format  {month–day–year order (e.g. July 9, 2024)} and each date must be exactly perfect after multiple cross check .make sure for each position data is with atleast degrees with house number and impact of the position mentioned  , verify everything as of data from several websites multiple times. All {data_10} must be fulfilled with atleast 3 sentences.Response should not start with string 'json'  ever  and must be a valid json format`,
      json: [natalData],
    });
  }

  return prompts;
}
