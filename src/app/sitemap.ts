import type { MetadataRoute } from 'next'
import zodiacSigns from '@/data/zodiac-signs'
import tarotCards from '@/data/tarot-cards'
import tarotSpreads from '@/data/tarot-spreads'
import houses from '@/data/houses'
import planets from '@/data/planets'
import aspects from '@/data/aspects'
import {
  getAllPublishedPostSlugs,
  getAllCategorySlugs,
  getAllAuthorSlugs,
} from '@/lib/blog'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE_URL = 'https://astrologypro.com'

// ── Fetch all indexable diviner profiles with their active services ──────────
async function getDivinerSitemapData() {
  const admin = createAdminClient()

  const { data: diviners } = await admin
    .from('diviners')
    .select('username, updated_at')
    .eq('is_active', true)
    .order('username', { ascending: true })

  if (!diviners || diviners.length === 0) return []

  // Fetch services for all active diviners in one query
  const usernames = diviners.map((d) => d.username)
  const { data: services } = await admin
    .from('services')
    .select('slug, diviner_id, updated_at, diviners!inner(username)')
    .eq('is_active', true)
    .in('diviners.username', usernames)

  type ServiceRow = {
    slug: string
    diviner_id: string
    updated_at: string | null
    diviners: { username: string } | { username: string }[]
  }

  const servicesByUsername: Record<string, ServiceRow[]> = {}
  for (const svc of (services ?? []) as ServiceRow[]) {
    const divinerData = Array.isArray(svc.diviners) ? svc.diviners[0] : svc.diviners
    const uname = divinerData?.username
    if (!uname) continue
    if (!servicesByUsername[uname]) servicesByUsername[uname] = []
    servicesByUsername[uname].push(svc)
  }

  return diviners.map((d) => ({
    username: d.username,
    updatedAt: d.updated_at ? new Date(d.updated_at) : null,
    services: (servicesByUsername[d.username] ?? []).map((s) => ({
      slug: s.slug,
      updatedAt: s.updated_at ? new Date(s.updated_at) : null,
    })),
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Fetch all data in parallel
  const [blogPostSlugs, blogCategorySlugs, blogAuthorSlugs, divinerData] = await Promise.all([
    getAllPublishedPostSlugs(),
    getAllCategorySlugs(),
    getAllAuthorSlugs(),
    getDivinerSitemapData(),
  ])

  const blogPostPages: MetadataRoute.Sitemap = blogPostSlugs.map((entry) => ({
    url: `${BASE_URL}/blog/${entry.slug}`,
    lastModified: entry.published_at ? new Date(entry.published_at) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const blogCategoryPages: MetadataRoute.Sitemap = blogCategorySlugs.map((slug) => ({
    url: `${BASE_URL}/blog/category/${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  const blogAuthorPages: MetadataRoute.Sitemap = blogAuthorSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/author/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

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
    '/blog',
    '/discover',
    '/learn',
    '/tarot',
    '/tarot/spreads',
    '/guides',
    '/glossary',
    '/zodiac',
    '/readings',
    '/readings/saturn-return',
    '/readings/jupiter-return',
    '/readings/solar-return',
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

  // ── Diviner profile pages ──────────────────────────────────────────────────
  const divinerProfilePages: MetadataRoute.Sitemap = divinerData.map((d) => ({
    url: `${BASE_URL}/${d.username}`,
    lastModified: d.updatedAt ?? now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // ── Diviner services hub pages ─────────────────────────────────────────────
  const divinerServicesHubPages: MetadataRoute.Sitemap = divinerData
    .filter((d) => d.services.length > 0)
    .map((d) => ({
      url: `${BASE_URL}/${d.username}/services`,
      lastModified: d.updatedAt ?? now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  // ── Diviner service detail pages (primary organic ranking targets) ─────────
  const divinerServiceDetailPages: MetadataRoute.Sitemap = divinerData.flatMap((d) =>
    d.services.map((svc) => ({
      url: `${BASE_URL}/${d.username}/services/${svc.slug}`,
      lastModified: svc.updatedAt ?? d.updatedAt ?? now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  )

  // NOTE: booking pages (/{username}/book/{slug}) are intentionally excluded —
  // they carry robots noindex and should not appear in the sitemap.

  return [
    ...marketingPages,
    ...hubPages,
    ...divinerProfilePages,
    ...divinerServicesHubPages,
    ...divinerServiceDetailPages,
    ...zodiacPages,
    ...tarotCardPages,
    ...tarotSpreadPages,
    ...housePages,
    ...planetPages,
    ...aspectPages,
    ...guidePages,
    ...blogPostPages,
    ...blogCategoryPages,
    ...blogAuthorPages,
  ]
}
