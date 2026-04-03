/**
 * Returns bullet-point "What to Expect" copy for a given service category/slug.
 * Used by ServiceCard to render a collapsible info section.
 */
export function getWhatToExpect(category: string, slug?: string): string[] {
  // Phone-specific check by slug or category
  if (
    category === "phone" ||
    slug?.includes("phone") ||
    slug?.includes("dial")
  ) {
    return [
      "I'll call you at the scheduled time",
      "Have your birth date and question ready",
      "Sessions run the full booked duration",
      "No video required — just your voice",
    ];
  }

  if (category === "astrology") {
    return [
      "We'll review your birth chart together",
      "I'll highlight key transits affecting you now",
      "You'll receive a recording of the session",
      "Questions are welcome throughout",
    ];
  }

  if (category === "tarot") {
    return [
      "We'll begin with grounding and intention setting",
      "I'll draw cards specific to your question",
      "Each card's message will be explained in depth",
      "You'll receive a recording of the session",
    ];
  }

  // Freelance / fallback
  return [
    "We'll begin by clarifying your question or intention",
    "The session is tailored to your specific needs",
    "You'll receive a recording of the session",
    "Follow-up questions are always welcome",
  ];
}
