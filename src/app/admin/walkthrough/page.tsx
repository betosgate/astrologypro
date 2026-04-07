import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Star,
  ShoppingBag,
  CalendarDays,
  FileText,
  MessageSquare,
  Eye,
  GraduationCap,
  Globe,
  Home,
  Search,
  User,
  ShoppingCart,
  BookOpen,
  ArrowRight,
  LayoutDashboard,
  Clock,
  CreditCard,
  Settings2,
  Heart,
  Gift,
  Radio,
  Image,
  Layers,
  Shield,
  Mail,
  BarChart3,
  RefreshCcw,
  Orbit,
  MapPin,
  FlaskConical,
  ListChecks,
  ScrollText,
  History,
  MailCheck,
  Flame,
  Package,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const metadata = { title: "Platform Walkthrough — AstrologyPro Admin" };

export const dynamic = "force-dynamic";

// ─── Types ──────────────────────────────────────────────────────────────────

interface FeatureCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

interface FeatureGroup {
  groupLabel?: string;
  cards: FeatureCard[];
}

interface WalkthroughSection {
  role: string;
  roleDescription: string;
  icon: LucideIcon;
  groups: FeatureGroup[];
}

// ─── Section definitions ────────────────────────────────────────────────────

function getSections(firstDivinerUsername: string | null): WalkthroughSection[] {
  const divinerProfileHref = firstDivinerUsername
    ? `/${firstDivinerUsername}`
    : "/discover";

  return [
    {
      role: "Public / Visitor",
      roleDescription:
        "Pages visible to unauthenticated visitors browsing the platform.",
      icon: Globe,
      groups: [
        {
          cards: [
            { title: "Homepage", description: "Landing page and hero section", href: "/", icon: Home },
            { title: "Browse Diviners", description: "Discover and search practitioners", href: "/discover", icon: Search },
            { title: "Diviner Profile", description: "Public practitioner page with services", href: divinerProfileHref, icon: User },
            { title: "Booking Flow", description: "Service selection and checkout", href: "/discover", icon: ShoppingCart },
            { title: "Blog", description: "Published articles and spiritual content", href: "/blog", icon: FileText },
            { title: "Join Hub", description: "Registration and membership options", href: "/join", icon: Users },
          ],
        },
      ],
    },
    {
      role: "Customer Portal",
      roleDescription:
        "Self-service area for clients who have booked readings or purchased services.",
      icon: User,
      groups: [
        {
          cards: [
            { title: "Dashboard", description: "Customer overview and quick actions", href: "/portal", icon: LayoutDashboard },
            { title: "My Orders", description: "Order history and tracking", href: "/portal/orders", icon: ShoppingBag },
            { title: "My Bookings", description: "Upcoming and past reading sessions", href: "/portal/bookings", icon: CalendarDays },
            { title: "Subscriptions", description: "Active plans and billing cycles", href: "/portal/subscriptions", icon: CreditCard },
            { title: "Profile", description: "Account settings and preferences", href: "/portal/profile", icon: User },
          ],
        },
      ],
    },
    {
      role: "Community Member",
      roleDescription:
        "Perennial Mandalism subscribers accessing astrology tools and spiritual content.",
      icon: Heart,
      groups: [
        {
          cards: [
            { title: "Dashboard", description: "Community hub and announcements", href: "/community", icon: LayoutDashboard },
            { title: "Natal Chart", description: "Personal horoscope and birth chart", href: "/community/horoscope", icon: Star },
            { title: "Relationship Charts", description: "Synastry and composite analysis", href: "/community/charts", icon: Users },
            { title: "Monthly Transits", description: "Current planetary movements", href: "/community/transits", icon: Orbit },
            { title: "Rituals", description: "Guided spiritual practices", href: "/community/rituals", icon: Flame },
            { title: "Family", description: "Family chart management", href: "/community/family", icon: Users },
            { title: "Sunday Service", description: "Weekly live spiritual gathering", href: "/community/sunday-service", icon: Radio },
            { title: "Library", description: "Educational content and resources", href: "/community/library", icon: BookOpen },
            { title: "My Plan", description: "Subscription tier and benefits", href: "/community/plan", icon: Layers },
          ],
        },
      ],
    },
    {
      role: "Mystery School",
      roleDescription:
        "Advanced esoteric training for mystery school subscribers.",
      icon: Eye,
      groups: [
        {
          cards: [
            { title: "Decans Grid", description: "36 decans overview and progress", href: "/mystery-school", icon: Eye },
            { title: "Foundation Training", description: "Core curriculum and lessons", href: "/mystery-school/training", icon: GraduationCap },
            { title: "Graduation", description: "Completion status and ceremony", href: "/mystery-school/training/graduation", icon: GraduationCap },
            { title: "Ritual Builder", description: "Create custom ritual sequences", href: "/mystery-school/training/ritual-builder", icon: Flame },
          ],
        },
      ],
    },
    {
      role: "Diviner Dashboard",
      roleDescription:
        "Practitioner workspace for managing bookings, clients, content, and business.",
      icon: Star,
      groups: [
        {
          groupLabel: "Schedule & Bookings",
          cards: [
            { title: "Overview", description: "Dashboard summary and metrics", href: "/dashboard", icon: LayoutDashboard },
            { title: "Bookings", description: "Manage reading appointments", href: "/dashboard/bookings", icon: CalendarDays },
            { title: "Schedule", description: "Weekly schedule view", href: "/dashboard/schedule", icon: Clock },
            { title: "Calendar", description: "Full calendar with all events", href: "/dashboard/calendar", icon: CalendarDays },
            { title: "Availability", description: "Set working hours and breaks", href: "/dashboard/availability", icon: Clock },
          ],
        },
        {
          groupLabel: "Business",
          cards: [
            { title: "Orders", description: "Sales and order management", href: "/dashboard/orders", icon: ShoppingBag },
            { title: "Clients", description: "Client list and history", href: "/dashboard/clients", icon: Users },
            { title: "Services", description: "Service catalog and pricing", href: "/dashboard/services", icon: Package },
            { title: "Affiliates", description: "Commission tracking and links", href: "/dashboard/affiliate-commission", icon: Users },
            { title: "Billing", description: "Payouts and financial summary", href: "/dashboard/billing", icon: CreditCard },
          ],
        },
        {
          groupLabel: "Engagement",
          cards: [
            { title: "Check-Ins", description: "Daily client check-in forms", href: "/dashboard/check-ins", icon: ListChecks },
            { title: "Giveaways", description: "Promotional campaigns", href: "/dashboard/giveaways", icon: Gift },
            { title: "Testimonials", description: "Client reviews and feedback", href: "/dashboard/testimonials", icon: MessageSquare },
            { title: "Media Gallery", description: "Images and video uploads", href: "/dashboard/media", icon: Image },
            { title: "Live Stream", description: "Go live for followers", href: "/dashboard/live", icon: Radio },
          ],
        },
        {
          groupLabel: "Content",
          cards: [
            { title: "Marketing", description: "Promotional tools and SEO", href: "/dashboard/marketing", icon: Sparkles },
            { title: "Subscriptions", description: "Manage follower subscriptions", href: "/dashboard/subscriptions", icon: Layers },
            { title: "Rituals", description: "Shared ritual content", href: "/dashboard/rituals", icon: Flame },
          ],
        },
      ],
    },
    {
      role: "Admin Back Office",
      roleDescription:
        "Full platform administration for managing users, commerce, content, and configuration.",
      icon: Shield,
      groups: [
        {
          groupLabel: "People",
          cards: [
            { title: "Users", description: "All registered accounts", href: "/admin/users", icon: Users },
            { title: "Diviners", description: "Practitioner management", href: "/admin/diviners", icon: Star },
            { title: "Affiliates", description: "Affiliate partner accounts", href: "/admin/affiliates", icon: Users },
            { title: "Roles", description: "Permission and role config", href: "/admin/roles", icon: Shield },
            { title: "Invitations", description: "Pending invitation codes", href: "/admin/invitations", icon: Mail },
          ],
        },
        {
          groupLabel: "Commerce",
          cards: [
            { title: "Orders", description: "All platform orders", href: "/admin/orders", icon: ShoppingBag },
            { title: "Bookings", description: "All reading sessions", href: "/admin/bookings", icon: CalendarDays },
            { title: "Payments", description: "Payment records and status", href: "/admin/payments", icon: CreditCard },
            { title: "Refunds", description: "Refund requests and history", href: "/admin/refunds", icon: RefreshCcw },
          ],
        },
        {
          groupLabel: "Content",
          cards: [
            { title: "Blog", description: "Article management and publishing", href: "/admin/blog", icon: FileText },
            { title: "Testimonials", description: "Review moderation queue", href: "/admin/testimonials", icon: MessageSquare },
          ],
        },
        {
          groupLabel: "Astrology",
          cards: [
            { title: "Horoscope", description: "Horoscope content toolkit", href: "/admin/horoscope", icon: Star },
            { title: "Chart Studio", description: "Mundane chart builder", href: "/admin/mundane/chart-studio", icon: Orbit },
            { title: "World Map", description: "Geopolitical astrology map", href: "/admin/mundane/world-map", icon: MapPin },
            { title: "Event Calendar", description: "Astrological event tracking", href: "/admin/mundane/event-calendar", icon: CalendarDays },
            { title: "Research", description: "Mundane research workspace", href: "/admin/mundane/research", icon: FlaskConical },
            { title: "Mundane Search", description: "Search mundane data", href: "/admin/mundane/search", icon: Search },
          ],
        },
        {
          groupLabel: "Programs",
          cards: [
            { title: "Training School", description: "Programs, lessons, analytics", href: "/admin/training", icon: GraduationCap },
            { title: "Mystery School", description: "Decans, students, journals", href: "/admin/mystery-school", icon: Eye },
          ],
        },
        {
          groupLabel: "Support",
          cards: [
            { title: "Tickets", description: "Support ticket management", href: "/admin/tickets", icon: MessageSquare },
            { title: "SLA Dashboard", description: "Response time monitoring", href: "/admin/tickets/sla", icon: Clock },
            { title: "Queues", description: "Queue routing configuration", href: "/admin/tickets/queues", icon: ListChecks },
          ],
        },
        {
          groupLabel: "Config",
          cards: [
            { title: "Activity Log", description: "System-wide audit trail", href: "/admin/activity-log", icon: History },
            { title: "Email Sequences", description: "Automated email workflows", href: "/admin/email-sequences", icon: MailCheck },
            { title: "Platform Settings", description: "Global platform configuration", href: "/admin/platform-settings", icon: Settings2 },
            { title: "Diviner Plans", description: "Subscription plan tiers", href: "/admin/diviner-plans", icon: Layers },
            { title: "Legal", description: "Terms, privacy, and policies", href: "/admin/legal", icon: ScrollText },
          ],
        },
      ],
    },
  ];
}

// ─── Stats fetcher ──────────────────────────────────────────────────────────

interface PlatformStats {
  totalUsers: number;
  totalDiviners: number;
  totalOrders: number;
  totalBookings: number;
  totalBlogPosts: number;
  totalTickets: number;
  totalCommunityMembers: number;
  totalMysteryStudents: number;
}

async function fetchStats(): Promise<PlatformStats> {
  const admin = createAdminClient();

  const [
    usersRes,
    divinersRes,
    ordersRes,
    bookingsRes,
    blogRes,
    ticketsRes,
    communityRes,
    mysteryRes,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("diviners").select("id", { count: "exact", head: true }),
    admin.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed"),
    admin.from("bookings").select("id", { count: "exact", head: true }),
    admin.from("blog_posts").select("id", { count: "exact", head: true }),
    admin.from("tickets").select("id", { count: "exact", head: true }),
    admin.from("community_members").select("id", { count: "exact", head: true }).eq("membership_type", "perennial_mandalism"),
    admin.from("community_members").select("id", { count: "exact", head: true }).eq("membership_type", "mystery_school"),
  ]);

  return {
    totalUsers: usersRes.count ?? 0,
    totalDiviners: divinersRes.count ?? 0,
    totalOrders: ordersRes.count ?? 0,
    totalBookings: bookingsRes.count ?? 0,
    totalBlogPosts: blogRes.count ?? 0,
    totalTickets: ticketsRes.count ?? 0,
    totalCommunityMembers: communityRes.count ?? 0,
    totalMysteryStudents: mysteryRes.count ?? 0,
  };
}

// ─── Stat card row ──────────────────────────────────────────────────────────

const STAT_ITEMS: { key: keyof PlatformStats; label: string; icon: LucideIcon }[] = [
  { key: "totalUsers", label: "Users", icon: Users },
  { key: "totalDiviners", label: "Diviners", icon: Star },
  { key: "totalOrders", label: "Orders", icon: ShoppingBag },
  { key: "totalBookings", label: "Bookings", icon: CalendarDays },
  { key: "totalBlogPosts", label: "Blog Posts", icon: FileText },
  { key: "totalTickets", label: "Tickets", icon: MessageSquare },
  { key: "totalCommunityMembers", label: "Community", icon: Heart },
  { key: "totalMysteryStudents", label: "Mystery School", icon: Eye },
];

function StatBar({ stats }: { stats: PlatformStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {STAT_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center gap-1 p-3 text-center">
              <Icon className="size-4 text-amber-500" />
              <span className="text-xl font-bold tabular-nums">
                {stats[item.key].toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">{item.label}</span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Feature card ───────────────────────────────────────────────────────────

function FeatureCardComponent({ card }: { card: FeatureCard }) {
  const Icon = card.icon;
  return (
    <Link href={card.href} className="group block">
      <Card className="h-full border-border/40 bg-card/60 transition-all hover:border-amber-500/40 hover:bg-card/80">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500/20">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {card.title}
              </span>
              <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              {card.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Section renderer ───────────────────────────────────────────────────────

function WalkthroughSectionBlock({ section }: { section: WalkthroughSection }) {
  const Icon = section.icon;
  const totalCards = section.groups.reduce((sum, g) => sum + g.cards.length, 0);

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{section.role}</h2>
            <Badge variant="secondary" className="text-xs">
              {totalCards} pages
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {section.roleDescription}
          </p>
        </div>
      </div>

      {/* Groups */}
      {section.groups.map((group, gi) => (
        <div key={gi} className="space-y-2">
          {group.groupLabel && (
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-1">
              {group.groupLabel}
            </h3>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.cards.map((card) => (
              <FeatureCardComponent key={card.href} card={card} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function WalkthroughPage() {
  const adminUser = await requireAdmin();
  if (!adminUser) redirect("/login");

  const admin = createAdminClient();

  // Fetch stats and first diviner username in parallel
  const [stats, firstDivinerRes] = await Promise.all([
    fetchStats(),
    admin
      .from("diviners")
      .select("username")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const firstDivinerUsername = firstDivinerRes.data?.username ?? null;
  const sections = getSections(firstDivinerUsername);

  return (
    <div className="space-y-10 p-6 lg:p-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Platform Walkthrough
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete guide to every feature across all roles. Click any card to
          navigate directly.
        </p>
      </div>

      {/* Platform summary bar */}
      <StatBar stats={stats} />

      {/* Divider */}
      <hr className="border-border/50" />

      {/* Role sections */}
      {sections.map((section) => (
        <WalkthroughSectionBlock key={section.role} section={section} />
      ))}
    </div>
  );
}
