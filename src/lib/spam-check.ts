export function calculateSpamScore(
  text: string,
  _name: string,
  _email: string
): number {
  let score = 0

  // Too many URLs
  const urlCount = (text.match(/https?:\/\//g) || []).length
  if (urlCount > 2) score += 0.3
  if (urlCount > 0) score += 0.1

  // Very short text
  if (text.length < 20) score += 0.2

  // All caps
  if (text === text.toUpperCase() && text.length > 10) score += 0.2

  // Suspicious keywords
  const spamWords = [
    'casino',
    'lottery',
    'winner',
    'click here',
    'free money',
    'make money fast',
  ]
  for (const word of spamWords) {
    if (text.toLowerCase().includes(word)) {
      score += 0.3
      break
    }
  }

  return Math.min(score, 1)
}
