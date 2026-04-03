import { NextRequest, NextResponse } from "next/server";

interface GenerateBioRequest {
  specialties: string;
  yearsExperience: string;
  approach: string;
  name: string;
}

function getYearsText(yearsExperience: string): string {
  switch (yearsExperience) {
    case "1-3":
      return "over 2 years";
    case "3-5":
      return "over 4 years";
    case "5-10":
      return "nearly a decade";
    case "10+":
      return "over a decade";
    default:
      return "several years";
  }
}

function getApproachAdjective(approach: string): string {
  switch (approach) {
    case "warm":
      return "warm and compassionate";
    case "professional":
      return "analytical yet intuitive";
    case "spiritual":
      return "deeply spiritual";
    default:
      return "insightful";
  }
}

function generateAstrologyBios(
  name: string,
  specialties: string,
  yearsText: string
): string[] {
  return [
    // Template A (Warm)
    `${name} is a warm and compassionate astrologer with ${yearsText} of experience helping clients understand their cosmic blueprint. Specializing in ${specialties}, ${name} creates a safe and supportive space for self-discovery through the wisdom of the stars. Every chart tells a unique story, and ${name} is here to help you read yours.`,
    // Template B (Professional)
    `With ${yearsText} of professional astrological practice, ${name} brings deep expertise in ${specialties} to every session. ${name}'s analytical yet intuitive approach combines traditional techniques with modern insights, providing clients with actionable guidance for life's most important decisions.`,
    // Template C (Spiritual)
    `${name} has dedicated ${yearsText} to the sacred art of astrology, serving as a guide for souls seeking clarity and purpose. Through ${specialties}, ${name} helps clients align with their highest path and understand the divine timing of their lives.`,
  ];
}

function generateTarotBios(
  name: string,
  specialties: string,
  yearsText: string
): string[] {
  return [
    // Template A (Warm)
    `${name} is a gifted and intuitive tarot reader with ${yearsText} of experience illuminating the paths of those who seek guidance. Specializing in ${specialties}, ${name} creates a nurturing space where every card drawn reveals a deeper truth. Let the cards speak to you through ${name}'s compassionate interpretation.`,
    // Template B (Professional)
    `With ${yearsText} of dedicated tarot practice, ${name} offers precise and insightful readings grounded in ${specialties}. ${name}'s methodical approach to the cards provides clients with clear, actionable guidance, blending centuries of tarot wisdom with practical modern interpretation.`,
    // Template C (Spiritual)
    `${name} has devoted ${yearsText} to the ancient art of tarot, channeling divine wisdom through the cards for all who seek answers. Through ${specialties}, ${name} serves as a sacred bridge between the seen and unseen, helping clients uncover the spiritual messages meant just for them.`,
  ];
}

function generateBothBios(
  name: string,
  specialties: string,
  yearsText: string
): string[] {
  return [
    // Template A (Warm)
    `${name} is a compassionate and intuitive reader with ${yearsText} of experience in both astrology and tarot. Specializing in ${specialties}, ${name} weaves the wisdom of the stars with the insight of the cards to create a holistic and deeply personal experience. Whether you come with questions or simply curiosity, ${name} is here to light the way.`,
    // Template B (Professional)
    `With ${yearsText} of expertise spanning astrology and tarot, ${name} brings a uniquely comprehensive perspective to every session. Specializing in ${specialties}, ${name} combines celestial analysis with intuitive card reading to deliver precise, actionable guidance that empowers clients to navigate life's challenges with confidence.`,
    // Template C (Spiritual)
    `For ${yearsText}, ${name} has walked the sacred path of astrology and tarot, serving as a guide for souls seeking deeper meaning. Through ${specialties}, ${name} bridges the cosmic wisdom of the stars with the archetypal truths of the cards, helping clients align with their highest purpose and divine timing.`,
  ];
}

function generateTaglines(
  specialties: string,
  approach: string
): string[] {
  const adjective = getApproachAdjective(approach);

  const taglines = [
    "Illuminating Your Path Through the Stars",
    "Your Cosmic Guide to Self-Discovery",
    "Where Celestial Wisdom Meets Personal Clarity",
  ];

  if (approach === "warm") {
    taglines[0] = "Guiding You Home to Yourself, One Reading at a Time";
    taglines[1] = "Your Compassionate Guide Through the Cosmos";
    taglines[2] = "Gentle Wisdom for Life's Biggest Questions";
  } else if (approach === "professional") {
    taglines[0] = "Precision Guidance for Life's Pivotal Moments";
    taglines[1] = "Clear Insight. Confident Decisions. Cosmic Clarity.";
    taglines[2] = "Analytical Wisdom for a Purposeful Life";
  } else if (approach === "spiritual") {
    taglines[0] = "Aligning You With Your Soul's True Path";
    taglines[1] = "Sacred Guidance for the Awakened Spirit";
    taglines[2] = "Channeling Divine Wisdom for Your Journey";
  }

  return taglines;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateBioRequest;
    const { specialties, yearsExperience, approach, name } = body;

    if (!specialties || !yearsExperience || !approach || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const yearsText = getYearsText(yearsExperience);

    let bios: string[];

    if (specialties.toLowerCase().includes("tarot") && !specialties.toLowerCase().includes("astro")) {
      bios = generateTarotBios(name, specialties, yearsText);
    } else if (specialties.toLowerCase().includes("astro") && !specialties.toLowerCase().includes("tarot")) {
      bios = generateAstrologyBios(name, specialties, yearsText);
    } else {
      bios = generateBothBios(name, specialties, yearsText);
    }

    const taglines = generateTaglines(specialties, approach);

    return NextResponse.json({ bios, taglines });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate bio" },
      { status: 500 }
    );
  }
}
