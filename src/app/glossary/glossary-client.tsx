'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { GlossaryTerm } from '@/data/glossary'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const categories = ['all', 'astrology', 'tarot', 'general'] as const

export function GlossaryClient({ terms }: { terms: GlossaryTerm[] }) {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return terms
    return terms.filter((t) => t.category === activeCategory)
  }, [terms, activeCategory])

  const grouped = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {}
    for (const term of filtered) {
      const letter = term.term[0].toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(term)
    }
    // Sort terms within each group
    for (const letter of Object.keys(groups)) {
      groups[letter].sort((a, b) => a.term.localeCompare(b.term))
    }
    return groups
  }, [filtered])

  const activeLetters = useMemo(() => new Set(Object.keys(grouped)), [grouped])

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Category Filter */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition-all ${
              activeCategory === cat
                ? 'border-[#c9a84c]/50 bg-[#c9a84c]/20 text-[#f8d275]'
                : 'border-[#b8bcd0]/15 text-[#b8bcd0]/60 hover:border-[#b8bcd0]/30 hover:text-[#b8bcd0]'
            }`}
          >
            {cat === 'all' ? 'All Terms' : cat}
          </button>
        ))}
      </div>

      {/* Alpha Jump Nav */}
      <nav
        aria-label="Alphabetical navigation"
        className="mb-12 flex flex-wrap justify-center gap-1"
      >
        {alphabet.map((letter) => {
          const isActive = activeLetters.has(letter)
          return isActive ? (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium text-[#f8d275] transition-colors hover:bg-[#c9a84c]/20"
            >
              {letter}
            </a>
          ) : (
            <span
              key={letter}
              className="flex h-9 w-9 items-center justify-center rounded-md text-sm text-[#b8bcd0]/20"
            >
              {letter}
            </span>
          )
        })}
      </nav>

      {/* Terms grouped by letter */}
      <div className="space-y-12">
        {alphabet.map((letter) => {
          const letterTerms = grouped[letter]
          if (!letterTerms || letterTerms.length === 0) return null
          return (
            <section key={letter} id={`letter-${letter}`}>
              <h2 className="mb-4 border-b border-[#c9a84c]/20 pb-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[#c9a84c]">
                {letter}
              </h2>
              <div className="space-y-6">
                {letterTerms.map((term) => (
                  <article key={term.slug} id={term.slug} className="scroll-mt-24">
                    <h3 className="text-lg font-semibold text-[#f5f0e8]">
                      {term.term}
                      <span className="ml-2 text-xs font-normal uppercase tracking-wide text-[#b8bcd0]/40">
                        {term.category}
                      </span>
                    </h3>
                    <p className="mt-1 text-[#b8bcd0] leading-relaxed">
                      {term.definition}
                    </p>
                    {term.relatedTerms && term.relatedTerms.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-[#b8bcd0]/50">Related:</span>
                        {term.relatedTerms.map((rt) => {
                          const related = terms.find(
                            (t) =>
                              t.term.toLowerCase() === rt.toLowerCase()
                          )
                          return related ? (
                            <a
                              key={rt}
                              href={`#${related.slug}`}
                              className="text-[#c9a84c] transition-colors hover:text-[#f8d275]"
                            >
                              {rt}
                            </a>
                          ) : (
                            <span
                              key={rt}
                              className="text-[#b8bcd0]/40"
                            >
                              {rt}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    {term.relatedPage && (
                      <Link
                        href={term.relatedPage}
                        className="mt-1 inline-block text-sm text-[#c9a84c] transition-colors hover:text-[#f8d275]"
                      >
                        Read more &rarr;
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
