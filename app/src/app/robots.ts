import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/portal/', '/api/', '/auth/', '/onboarding/'],
    },
    sitemap: 'https://astrologypro.com/sitemap.xml',
  }
}
