import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APP_URL } from "@/lib/constants";
import { getServiceImageUrl } from "@/lib/service-images";
import { ServiceTemplatePublicPage } from "@/components/services/service-template-public-page";
import {
  getServiceLandingDiviners,
  getServiceLandingTemplate,
} from "@/lib/service-landings";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await getServiceLandingTemplate(slug);
  if (!template) return { title: "Not Found" };

  return {
    title: `${template.name} | Choose Your Diviner | AstrologyPro`,
    description:
      template.description ??
      `Learn about ${template.name}, then choose a diviner by availability or profile.`,
    alternates: { canonical: `${APP_URL}/services/${slug}` },
    openGraph: {
      title: `${template.name} | AstrologyPro`,
      description:
        template.description ??
        `Choose a diviner for ${template.name} on AstrologyPro.`,
      url: `${APP_URL}/services/${slug}`,
      type: "website",
      images: [
        {
          url: getServiceImageUrl(slug) ? `${APP_URL}${getServiceImageUrl(slug)}` : `${APP_URL}/images/home/og-card.jpg`,
          width: 1200,
          height: 630,
          alt: template.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${template.name} | AstrologyPro`,
      description: template.description ?? `Choose a diviner for ${template.name} on AstrologyPro.`,
      images: [getServiceImageUrl(slug) ? `${APP_URL}${getServiceImageUrl(slug)}` : `${APP_URL}/images/home/og-card.jpg`],
    },
  };
}

export default async function ServiceOnlyLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const [template, diviners] = await Promise.all([
    getServiceLandingTemplate(slug),
    getServiceLandingDiviners(slug),
  ]);

  if (!template) notFound();

  return (
    <ServiceTemplatePublicPage template={template} diviners={diviners} />
  );
}
