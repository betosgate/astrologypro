import type { MetadataRoute } from 'next'
import zodiacSigns from '@/data/zodiac-signs'
import tarotCards from '@/data/tarot-cards'
import tarotSpreads from '@/data/tarot-spreads'
import houses from '@/data/houses'
import planets from '@/data/planets'
import aspects from '@/data/aspects'

const BASE_URL = 'https://astrologypro.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Static marketing pages — high priority
  const marketingPages: MetadataRoute.Sitemap = [
    '/',
    '/features',
    '/pricing',
    '/get-started',
    '/demo',
    '/discover',
    '/instructions',
    '/refund-policy',
    '/for-astrologers',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }))

  // Hub / index pages
  const hubPages: MetadataRoute.Sitemap = [
    '/learn',
    '/tarot',
    '/tarot/spreads',
    '/guides',
    '/glossary',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Zodiac sign pages
  const zodiacPages: MetadataRoute.Sitemap = zodiacSigns.map((sign) => ({
    url: `${BASE_URL}/zodiac/${sign.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Tarot card pages
  const tarotCardPages: MetadataRoute.Sitemap = tarotCards.map((card) => ({
    url: `${BASE_URL}/tarot/${card.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Tarot spread pages
  const tarotSpreadPages: MetadataRoute.Sitemap = tarotSpreads.map((spread) => ({
    url: `${BASE_URL}/tarot/spreads/${spread.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // House pages
  const housePages: MetadataRoute.Sitemap = houses.map((house) => ({
    url: `${BASE_URL}/learn/houses/${house.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Planet pages
  const planetPages: MetadataRoute.Sitemap = planets.map((planet) => ({
    url: `${BASE_URL}/learn/planets/${planet.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Aspect pages
  const aspectPages: MetadataRoute.Sitemap = aspects.map((aspect) => ({
    url: `${BASE_URL}/learn/aspects/${aspect.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Guide pages
  const guidePages: MetadataRoute.Sitemap = [
    '/guides/saturn-return',
    '/guides/mercury-retrograde',
    '/guides/start-astrology-business',
    '/guides/start-tarot-business',
    '/guides/pricing-your-readings',
    '/guides/how-astrology-readings-work',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    ...marketingPages,
    ...hubPages,
    ...zodiacPages,
    ...tarotCardPages,
    ...tarotSpreadPages,
    ...housePages,
    ...planetPages,
    ...aspectPages,
    ...guidePages,
  ]
}
