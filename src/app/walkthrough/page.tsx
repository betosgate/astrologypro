import type { Metadata } from "next";
import Link from "next/link";
import {
  ADDITIONAL_PAGES,
  WALKTHROUGH_SECTIONS,
  getTotalFeatureCount,
} from "@/lib/walkthrough-data";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeader } from "@/components/marketing/header";
import { ArrowRight, Sparkles, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Platform Walkthrough | AstrologyPro",
  description:
    "See what every role sees inside AstrologyPro with role-by-role screenshots, modules, and access comparisons.",
};

const accessRows = [
  { module: "Dashboard", access: [1, 1, 1, 1, 1, 1, 1, 1] },
  { module: "Natal Charts", access: [0, 0, 1, 1, 1, 1, 0, 0] },
  { module: "Synastry Engine", access: [0, 0, 0, 1, 1, 1, 0, 0] },
  { module: "Live Sunday Service", access: [0, 0, 0, 1, 1, 1, 0, 0] },
  { module: "Mystery Curriculum", access: [1, 0, 0, 0, 1, 1, 0, 1] },
  { module: "Decan Mastery Grid", access: [1, 0, 0, 0, 1, 1, 0, 0] },
  { module: "Diviner Scheduler", access: [1, 0, 0, 0, 0, 1, 0, 1] },
  { module: "Service CRM", access: [1, 0, 0, 0, 0, 1, 0, 1] },
  { module: "Broadcast Studio", access: [1, 0, 0, 0, 0, 1, 0, 0] },
  { module: "Affiliate Portal", access: [1, 0, 0, 0, 0, 1, 1, 0] },
  { module: "Mundane Engines", access: [1, 0, 0, 0, 0, 0, 0, 0] },
  { module: "Global Analytics", access: [1, 0, 0, 0, 0, 0, 0, 0] },
  { module: "System Config", access: [1, 0, 0, 0, 0, 0, 0, 0] },
];

function SectionLead({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#c9a84c]">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-3xl font-semibold text-[#f5f0e8] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-[#b8bcd0]/72 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function RolePanel({
  role,
}: {
  role: (typeof WALKTHROUGH_SECTIONS)[number];
}) {
  return (
    <article className="border-t border-white/8 pt-6 first:border-t-0 first:pt-0">
      <div className="rounded-[2px] border border-white/12 bg-[radial-gradient(circle_at_20%_0%,rgba(72,52,135,0.14),transparent_35%),linear-gradient(180deg,rgba(11,13,30,0.94),rgba(9,11,24,0.98))] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-6 sm:py-6 lg:px-7 lg:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f0f3ff]">
              <role.icon className="size-3.5 text-[#f5f0e8]" strokeWidth={1.8} />
              {role.tagline.toUpperCase()}
            </div>

            <div className="mt-5 block w-fit rounded-[14px] bg-[linear-gradient(180deg,#f7d36d_0%,#d39a34_100%)] px-4 py-2 text-[1.05rem] font-semibold leading-none text-[#121212] shadow-[0_10px_22px_rgba(211,154,52,0.22)] sm:text-[1.85rem]">
              {role.role}
            </div>

            <p className="mt-8 max-w-4xl text-base leading-8 text-white">
              {role.roleDescription}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {role.featureAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-[#f4f6ff]"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>

          <div className="shrink-0 rounded-full border border-white/12 bg-white/[0.02] px-4 py-2 text-sm font-semibold text-white">
            {role.screens.length} screens
          </div>
        </div>

        <div className="mt-8 grid items-stretch gap-5 md:grid-cols-2">
          <div className="flex min-h-[252px] flex-col rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(12,14,29,0.56),rgba(10,12,24,0.3))] px-5 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.01em] text-white/95">
              Key capabilities
            </p>
            <ul className="mt-5 flex-1 space-y-4">
              {role.capabilities.map((capability) => (
                <li
                  key={capability}
                  className="pl-2 text-[15px] leading-8 text-[#f4f6ff]"
                >
                  {capability}
                </li>
              ))}
            </ul>

            <Link
              href={`/walkthrough/${role.slug}`}
              className="mt-7 inline-flex items-center gap-2 text-[15px] font-semibold text-white transition hover:text-[#f5d382]"
            >
              Explore full role walkthrough
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="flex min-h-[252px] flex-col rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(12,14,29,0.56),rgba(10,12,24,0.3))] px-5 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.01em] text-white/95">
              Signature modules
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {role.keyPages.map((page) => (
                <span
                  key={page}
                  className="rounded-full border border-white/12 bg-white/[0.02] px-4 py-2 text-[14px] font-semibold text-[#e1c25f]"
                >
                  {page}
                </span>
              ))}
            </div>

            <div className="mt-6 rounded-[18px] border border-white/12 px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.01em] text-white/95">
                Screens included
              </p>
              <p className="mt-4 text-[15px] leading-8 text-[#f4f6ff]">
                {role.screens.map((screen) => screen.label).join(" · ")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function WalkthroughIndex() {
  const roles = WALKTHROUGH_SECTIONS;
  const totalScreens = roles.reduce((sum, role) => sum + role.screens.length, 0);
  const totalFeatureAreas = roles.reduce(
    (sum, role) => sum + role.featureAreas.length,
    0,
  );

  return (
    <div className="min-h-screen">
      <MarketingHeader />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[26rem] w-[80rem] -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.09),transparent_58%)]" />
          <div className="absolute inset-x-0 top-24 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1240px] px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pb-28">
          <section className="border-b border-white/8 pb-14 text-center sm:pb-18">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#c9a84c]">
              Platform Walkthrough
            </p>
            <h1 className="mx-auto mt-5 max-w-4xl font-display text-4xl font-semibold leading-none text-[#f5f0e8] sm:text-6xl">
              See what every role sees
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#b8bcd0]/74 sm:text-base">
              AstrologyPro provides each role a purpose-built workspace with scoped
              tools, modules, and workflows. This walkthrough maps the entire platform
              by role so design, product, and engineering can review it in one place.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/10 px-4 py-2 text-xs font-semibold text-[#f5d382]">
                <Sparkles className="size-3.5" />
                {totalScreens} screenshots
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-[#b8bcd0]/80">
                8 roles
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-[#b8bcd0]/80">
                {totalFeatureAreas} feature areas
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-[#b8bcd0]/80">
                {getTotalFeatureCount()} modules
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {roles.map((role) => (
                <Link
                  key={role.slug}
                  href={`/walkthrough/${role.slug}`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-[#d7dbee]/78 transition hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/8 hover:text-[#f5d382]"
                >
                  {role.role}
                </Link>
              ))}
            </div>
          </section>

          <section className="pt-14 sm:pt-18">
            <SectionLead
              eyebrow="Explore Every Portal"
              title="Role-by-role walkthrough"
              description="A complete index of the platform by persona. Each section mirrors the screenshot-first review style from your reference, with capability summaries on the left and module chips on the right."
            />

            <div className="mt-12">
              {roles.map((role) => (
                <RolePanel key={role.slug} role={role} />
              ))}
            </div>
          </section>

          <section className="border-t border-white/8 pt-16 sm:pt-20">
            <SectionLead
              eyebrow="Shared Surface Area"
              title="Additional pages"
              description="Pages that sit outside a single role flow but still matter for overall parity reviews."
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {ADDITIONAL_PAGES.map((group) => (
                <div
                  key={group.slug}
                  className="rounded-[26px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-[#f5f0e8]">
                        {group.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[#b8bcd0]/72">
                        {group.description}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d7dbee]/75">
                      {group.screenCount} screens
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {group.pages.map((page) => (
                      <span
                        key={page}
                        className="rounded-full border border-[#c9a84c]/18 bg-[#c9a84c]/7 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f5d382]/88"
                      >
                        {page}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-white/8 pt-16 sm:pt-20">
            <SectionLead
              eyebrow="Access Matrix"
              title="Role access at a glance"
              description="A quick comparison of which persona sees which major module across the platform."
            />

            <div className="mt-10 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.04]">
                      <th className="sticky left-0 z-10 bg-[#090c1b] px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9ea5c0]">
                        Module
                      </th>
                      {roles.map((role) => (
                        <th
                          key={role.slug}
                          className="px-4 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9ea5c0]"
                        >
                          {role.role.split(" ")[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accessRows.map((row, rowIndex) => (
                      <tr
                        key={row.module}
                        className={rowIndex % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}
                      >
                        <td className="sticky left-0 z-10 bg-[#090c1b] px-5 py-4 text-sm font-medium text-[#f5f0e8]">
                          {row.module}
                        </td>
                        {row.access.map((hasAccess, index) => (
                          <td key={`${row.module}-${roles[index].slug}`} className="px-4 py-4 text-center">
                            {hasAccess ? (
                              <span className="mx-auto flex size-5 items-center justify-center rounded-full bg-[#75d6ff]/10 ring-1 ring-[#75d6ff]/20">
                                <span className="size-2 rounded-full bg-[#8ee8ff] shadow-[0_0_12px_rgba(142,232,255,0.85)]" />
                              </span>
                            ) : (
                              <span className="mx-auto block size-3 rounded-full border border-white/10 bg-transparent" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="mt-16 border-t border-white/8 pt-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d382]">
              <Star className="size-3.5" />
              Review complete surface area
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#d7dbee]/80 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Back to home
              </Link>
              <Link
                href={`/walkthrough/${roles[0]?.slug}`}
                className="rounded-full border border-[#c9a84c]/28 bg-[#c9a84c]/12 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#f5d382] transition hover:bg-[#c9a84c]/18"
              >
                Start walkthrough
              </Link>
            </div>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
