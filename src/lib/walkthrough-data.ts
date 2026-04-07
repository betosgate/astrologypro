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

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FeatureCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status?: "live" | "beta" | "coming-soon";
}

export interface FeatureGroup {
  groupLabel?: string;
  cards: FeatureCard[];
}

export interface WalkthroughSection {
  role: string;
  slug: string;
  roleDescription: string;
  icon: LucideIcon;
  gradient: string;
  groups: FeatureGroup[];
}

// ─── Slug map ───────────────────────────────────────────────────────────────

export const ROLE_SLUGS: Record<string, string> = {
  public: "Public / Visitor",
  customer: "Customer Portal",
  community: "Community Member",
  "mystery-school": "Mystery School",
  diviner: "Diviner Dashboard",
  admin: "Admin Back Office",
};

// ─── Section definitions ────────────────────────────────────────────────────

export const WALKTHROUGH_SECTIONS: WalkthroughSection[] = [
  {
    role: "Public / Visitor",
    slug: "public",
    roleDescription:
      "Pages visible to unauthenticated visitors browsing the platform.",
    icon: Globe,
    gradient: "from-sky-500/20 to-blue-600/10",
    groups: [
      {
        cards: [
          { title: "Homepage", description: "Landing page and hero section", href: "/", icon: Home, status: "live" },
          { title: "Browse Diviners", description: "Discover and search practitioners", href: "/discover", icon: Search, status: "live" },
          { title: "Diviner Profile", description: "Public practitioner page with services", href: "/discover", icon: User, status: "live" },
          { title: "Booking Flow", description: "Service selection and checkout", href: "/discover", icon: ShoppingCart, status: "live" },
          { title: "Blog", description: "Published articles and spiritual content", href: "/blog", icon: FileText, status: "live" },
          { title: "Join Hub", description: "Registration and membership options", href: "/join", icon: Users, status: "live" },
        ],
      },
    ],
  },
  {
    role: "Customer Portal",
    slug: "customer",
    roleDescription:
      "Self-service area for clients who have booked readings or purchased services.",
    icon: User,
    gradient: "from-emerald-500/20 to-green-600/10",
    groups: [
      {
        cards: [
          { title: "Dashboard", description: "Customer overview and quick actions", href: "/portal", icon: LayoutDashboard, status: "live" },
          { title: "My Orders", description: "Order history and tracking", href: "/portal/orders", icon: ShoppingBag, status: "live" },
          { title: "My Bookings", description: "Upcoming and past reading sessions", href: "/portal/bookings", icon: CalendarDays, status: "live" },
          { title: "Subscriptions", description: "Active plans and billing cycles", href: "/portal/subscriptions", icon: CreditCard, status: "live" },
          { title: "Profile", description: "Account settings and preferences", href: "/portal/profile", icon: User, status: "live" },
        ],
      },
    ],
  },
  {
    role: "Community Member",
    slug: "community",
    roleDescription:
      "Perennial Mandalism subscribers accessing astrology tools and spiritual content.",
    icon: Heart,
    gradient: "from-pink-500/20 to-rose-600/10",
    groups: [
      {
        cards: [
          { title: "Dashboard", description: "Community hub and announcements", href: "/community", icon: LayoutDashboard, status: "live" },
          { title: "Natal Chart", description: "Personal horoscope and birth chart", href: "/community/horoscope", icon: Star, status: "live" },
          { title: "Relationship Charts", description: "Synastry and composite analysis", href: "/community/charts", icon: Users, status: "live" },
          { title: "Monthly Transits", description: "Current planetary movements", href: "/community/transits", icon: Orbit, status: "live" },
          { title: "Rituals", description: "Guided spiritual practices", href: "/community/rituals", icon: Flame, status: "live" },
          { title: "Family", description: "Family chart management", href: "/community/family", icon: Users, status: "live" },
          { title: "Sunday Service", description: "Weekly live spiritual gathering", href: "/community/sunday-service", icon: Radio, status: "live" },
          { title: "Library", description: "Educational content and resources", href: "/community/library", icon: BookOpen, status: "live" },
          { title: "My Plan", description: "Subscription tier and benefits", href: "/community/plan", icon: Layers, status: "live" },
        ],
      },
    ],
  },
  {
    role: "Mystery School",
    slug: "mystery-school",
    roleDescription:
      "Advanced esoteric training for mystery school subscribers.",
    icon: Eye,
    gradient: "from-violet-500/20 to-purple-600/10",
    groups: [
      {
        cards: [
          { title: "Decans Grid", description: "36 decans overview and progress", href: "/mystery-school", icon: Eye, status: "live" },
          { title: "Foundation Training", description: "Core curriculum and lessons", href: "/mystery-school/training", icon: GraduationCap, status: "live" },
          { title: "Graduation", description: "Completion status and ceremony", href: "/mystery-school/training/graduation", icon: GraduationCap, status: "live" },
          { title: "Ritual Builder", description: "Create custom ritual sequences", href: "/mystery-school/training/ritual-builder", icon: Flame, status: "live" },
        ],
      },
    ],
  },
  {
    role: "Diviner Dashboard",
    slug: "diviner",
    roleDescription:
      "Practitioner workspace for managing bookings, clients, content, and business.",
    icon: Star,
    gradient: "from-amber-500/20 to-yellow-600/10",
    groups: [
      {
        groupLabel: "Schedule & Bookings",
        cards: [
          { title: "Overview", description: "Dashboard summary and metrics", href: "/dashboard", icon: LayoutDashboard, status: "live" },
          { title: "Bookings", description: "Manage reading appointments", href: "/dashboard/bookings", icon: CalendarDays, status: "live" },
          { title: "Schedule", description: "Weekly schedule view", href: "/dashboard/schedule", icon: Clock, status: "live" },
          { title: "Calendar", description: "Full calendar with all events", href: "/dashboard/calendar", icon: CalendarDays, status: "live" },
          { title: "Availability", description: "Set working hours and breaks", href: "/dashboard/availability", icon: Clock, status: "live" },
        ],
      },
      {
        groupLabel: "Business",
        cards: [
          { title: "Orders", description: "Sales and order management", href: "/dashboard/orders", icon: ShoppingBag, status: "live" },
          { title: "Clients", description: "Client list and history", href: "/dashboard/clients", icon: Users, status: "live" },
          { title: "Services", description: "Service catalog and pricing", href: "/dashboard/services", icon: Package, status: "live" },
          { title: "Affiliates", description: "Commission tracking and links", href: "/dashboard/affiliate-commission", icon: Users, status: "live" },
          { title: "Billing", description: "Payouts and financial summary", href: "/dashboard/billing", icon: CreditCard, status: "live" },
        ],
      },
      {
        groupLabel: "Engagement",
        cards: [
          { title: "Check-Ins", description: "Daily client check-in forms", href: "/dashboard/check-ins", icon: ListChecks, status: "live" },
          { title: "Giveaways", description: "Promotional campaigns", href: "/dashboard/giveaways", icon: Gift, status: "live" },
          { title: "Testimonials", description: "Client reviews and feedback", href: "/dashboard/testimonials", icon: MessageSquare, status: "live" },
          { title: "Media Gallery", description: "Images and video uploads", href: "/dashboard/media", icon: Image, status: "live" },
          { title: "Live Stream", description: "Go live for followers", href: "/dashboard/live", icon: Radio, status: "live" },
        ],
      },
      {
        groupLabel: "Content",
        cards: [
          { title: "Marketing", description: "Promotional tools and SEO", href: "/dashboard/marketing", icon: Sparkles, status: "live" },
          { title: "Subscriptions", description: "Manage follower subscriptions", href: "/dashboard/subscriptions", icon: Layers, status: "live" },
          { title: "Rituals", description: "Shared ritual content", href: "/dashboard/rituals", icon: Flame, status: "live" },
        ],
      },
    ],
  },
  {
    role: "Admin Back Office",
    slug: "admin",
    roleDescription:
      "Full platform administration for managing users, commerce, content, and configuration.",
    icon: Shield,
    gradient: "from-red-500/20 to-orange-600/10",
    groups: [
      {
        groupLabel: "People",
        cards: [
          { title: "Users", description: "All registered accounts", href: "/admin/users", icon: Users, status: "live" },
          { title: "Diviners", description: "Practitioner management", href: "/admin/diviners", icon: Star, status: "live" },
          { title: "Affiliates", description: "Affiliate partner accounts", href: "/admin/affiliates", icon: Users, status: "live" },
          { title: "Roles", description: "Permission and role config", href: "/admin/roles", icon: Shield, status: "live" },
          { title: "Invitations", description: "Pending invitation codes", href: "/admin/invitations", icon: Mail, status: "live" },
        ],
      },
      {
        groupLabel: "Commerce",
        cards: [
          { title: "Orders", description: "All platform orders", href: "/admin/orders", icon: ShoppingBag, status: "live" },
          { title: "Bookings", description: "All reading sessions", href: "/admin/bookings", icon: CalendarDays, status: "live" },
          { title: "Payments", description: "Payment records and status", href: "/admin/payments", icon: CreditCard, status: "live" },
          { title: "Refunds", description: "Refund requests and history", href: "/admin/refunds", icon: RefreshCcw, status: "live" },
        ],
      },
      {
        groupLabel: "Content",
        cards: [
          { title: "Blog", description: "Article management and publishing", href: "/admin/blog", icon: FileText, status: "live" },
          { title: "Testimonials", description: "Review moderation queue", href: "/admin/testimonials", icon: MessageSquare, status: "live" },
        ],
      },
      {
        groupLabel: "Astrology",
        cards: [
          { title: "Horoscope", description: "Horoscope content toolkit", href: "/admin/horoscope", icon: Star, status: "live" },
          { title: "Chart Studio", description: "Mundane chart builder", href: "/admin/mundane/chart-studio", icon: Orbit, status: "live" },
          { title: "World Map", description: "Geopolitical astrology map", href: "/admin/mundane/world-map", icon: MapPin, status: "live" },
          { title: "Event Calendar", description: "Astrological event tracking", href: "/admin/mundane/event-calendar", icon: CalendarDays, status: "live" },
          { title: "Research", description: "Mundane research workspace", href: "/admin/mundane/research", icon: FlaskConical, status: "live" },
          { title: "Mundane Search", description: "Search mundane data", href: "/admin/mundane/search", icon: Search, status: "live" },
        ],
      },
      {
        groupLabel: "Programs",
        cards: [
          { title: "Training School", description: "Programs, lessons, analytics", href: "/admin/training", icon: GraduationCap, status: "live" },
          { title: "Mystery School", description: "Decans, students, journals", href: "/admin/mystery-school", icon: Eye, status: "live" },
        ],
      },
      {
        groupLabel: "Support",
        cards: [
          { title: "Tickets", description: "Support ticket management", href: "/admin/tickets", icon: MessageSquare, status: "live" },
          { title: "SLA Dashboard", description: "Response time monitoring", href: "/admin/tickets/sla", icon: Clock, status: "live" },
          { title: "Queues", description: "Queue routing configuration", href: "/admin/tickets/queues", icon: ListChecks, status: "live" },
        ],
      },
      {
        groupLabel: "Config",
        cards: [
          { title: "Activity Log", description: "System-wide audit trail", href: "/admin/activity-log", icon: History, status: "live" },
          { title: "Email Sequences", description: "Automated email workflows", href: "/admin/email-sequences", icon: MailCheck, status: "live" },
          { title: "Platform Settings", description: "Global platform configuration", href: "/admin/platform-settings", icon: Settings2, status: "live" },
          { title: "Diviner Plans", description: "Subscription plan tiers", href: "/admin/diviner-plans", icon: Layers, status: "live" },
          { title: "Legal", description: "Terms, privacy, and policies", href: "/admin/legal", icon: ScrollText, status: "live" },
        ],
      },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Look up a section by its URL-safe slug. */
export function getSectionBySlug(slug: string): WalkthroughSection | undefined {
  return WALKTHROUGH_SECTIONS.find((s) => s.slug === slug);
}

/** Total feature count across all sections. */
export function getTotalFeatureCount(): number {
  return WALKTHROUGH_SECTIONS.reduce(
    (sum, s) => sum + s.groups.reduce((gs, g) => gs + g.cards.length, 0),
    0,
  );
}
