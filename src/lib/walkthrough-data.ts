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
  Zap,
  Play,
  MonitorSmartphone,
  Workflow,
  Stethoscope,
  ClipboardList,
  BarChart3,
  Building2,
  Briefcase,
  Lock,
  Activity,
  type LucideIcon,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Screen {
  name: string;
  label: string;
  description?: string;
  group?: string;
}

export interface FeatureCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status?: "live" | "beta" | "coming-soon";
  thumbnail?: string; 
}

export interface FeatureGroup {
  groupLabel?: string;
  cards: FeatureCard[];
}

export interface WalkthroughSection {
  role: string;
  slug: string;
  tagline: string;
  roleDescription: string;
  icon: LucideIcon;
  gradient: string;
  featureAreas: string[];
  capabilities: string[];
  keyPages: string[];
  groups: FeatureGroup[];
  screens: Screen[];
}

// ─── Slug map ───────────────────────────────────────────────────────────────

export const ROLE_SLUGS: Record<string, string> = {
  admin: "Admin Back Office",
  diviner: "Diviner Dashboard",
  community: "Community Member",
  "mystery-school": "Mystery School",
  social_advo: "Social Advocate",
  trainee: "Trainee",
  customer: "Customer Portal",
  public: "Public / Visitor",
};

// ─── Section definitions ────────────────────────────────────────────────────

export const WALKTHROUGH_SECTIONS: WalkthroughSection[] = [
  {
    role: "Admin Back Office",
    slug: "admin",
    tagline: "Global governance and system intelligence",
    roleDescription:
      "Full oversight for platform owners. Govern users, commerce, astrology engines, and training programs across the entire ecosystem with granular control.",
    icon: Shield,
    gradient: "from-red-500/20 to-orange-600/10",
    featureAreas: ["Governance", "Commerce", "Content", "Astrology Engines", "Config"],
    capabilities: [
      "Manage all platform accounts and roles",
      "Oversight of orders, payments, and refunds",
      "Govern mundane astrology and chart data",
      "Audit system logs and email sequences",
      "Manage Mystery School curriculum and decans",
      "Configure global platform and astrology settings",
    ],
    keyPages: ["Executive Home", "User Mgmt", "Commerce Hub", "Mundane Studio", "Mystery School Admin", "Audit Trail"],
    groups: [
      {
        groupLabel: "Governance",
        cards: [
          { title: "Dashboard", description: "Global health and KPI overview", href: "/admin", icon: LayoutDashboard, status: "live" },
          { title: "Users", description: "Master directory of all accounts", href: "/admin/users", icon: Users, status: "live" },
          { title: "Roles", description: "Role-based access configuration", href: "/admin/roles", icon: Shield, status: "live" },
        ],
      },
      {
        groupLabel: "Commerce",
        cards: [
          { title: "Orders", description: "Consolidated platform sales log", href: "/admin/orders", icon: ShoppingBag, status: "live" },
          { title: "Payments", description: "Gateway tracking and payouts", href: "/admin/payments", icon: CreditCard, status: "live" },
        ],
      },
    ],
    screens: [
      { name: "admin-home", label: "Executive Dashboard", description: "Global KPIs for platform health.", group: "Governance" },
      { name: "user-mgmt", label: "User Directory", description: "Filtered list of all platform personas.", group: "Governance" },
      { name: "commerce", label: "Commerce Hub", description: "Consolidated view of all platform revenue.", group: "Commerce" },
      { name: "mundane", label: "Mundane Studio", description: "Management of geopolitical astrology data.", group: "Astrology" },
      { name: "mystery-school", label: "Mystery School Admin", description: "Management of esoteric curriculum.", group: "Config" },
      { name: "audit", label: "Audit Trails", description: "Granular logs of every system action.", group: "Config" },
    ],
  },
  {
    role: "Diviner Dashboard",
    slug: "diviner",
    tagline: "Clinical espiritual and business operations",
    roleDescription:
      "Manage every aspect of your spiritual business — from clients to marketing and streams.",
    icon: Star,
    gradient: "from-amber-500/20 to-yellow-600/10",
    featureAreas: ["Scheduling", "CRM", "Business Operations", "Engagement"],
    capabilities: [
      "Manage bookings and availability",
      "Track client history and readings",
      "Host live broadcast sessions",
      "Oversee affiliate commissions",
    ],
    keyPages: ["CRM Overview", "Bookings", "Client Spirit Twin", "Broadcast Hub", "Billing"],
    groups: [
      {
        groupLabel: "Schedule",
        cards: [
          { title: "Overview", description: "Daily workload summary", href: "/dashboard", icon: LayoutDashboard, status: "live" },
        ],
      },
    ],
    screens: [
      { name: "overview", label: "Practitioner CRM", description: "Overview of today's operations.", group: "Schedule" },
      { name: "calendar", label: "Session Calendar", description: "Map of upcoming readings.", group: "Schedule" },
      { name: "client-detail", label: "Client Spiritual Twin", description: "Comprehensive client history.", group: "Business" },
      { name: "broadcast", label: "Live Hub", description: "Streaming and chat interface.", group: "Engagement" },
      { name: "payouts", label: "Billing & Payouts", description: "Financial transparency.", group: "Business" },
    ],
  },
  {
    role: "Community Member",
    slug: "community",
    tagline: "Interactive astrology and spiritual community",
    roleDescription:
      "Access powerful astrology tools, weekly live gatherings, and a library of spiritual wisdom for Perennial Mandalism members.",
    icon: Heart,
    gradient: "from-pink-500/20 to-rose-600/10",
    featureAreas: ["Astrology Tools", "Community Hub", "Spiritual Content"],
    capabilities: [
      "Generate personal and relationship natal charts",
      "Track monthly planetary transits",
      "Participate in live Sunday services",
      "Access esoteric resource library",
    ],
    keyPages: ["Central Hub", "Natal Chart", "Transits Engine", "Sunday Service", "Library"],
    groups: [
      {
        groupLabel: "Astrology Tools",
        cards: [
          { title: "Natal Chart", description: "Personal birth chart", href: "/community/horoscope", icon: Star, status: "live" },
        ],
      },
    ],
    screens: [
      { name: "hub", label: "Community Hub", description: "Central board for announcements.", group: "Community" },
      { name: "natal", label: "Natal Chart Studio", description: "Aesthetic birth chart visualization.", group: "Astrology Tools" },
      { name: "transits", label: "Monthly Transits", description: "Interactive transit calendar.", group: "Astrology Tools" },
      { name: "sunday", label: "Sunday Service", description: "Live video player and chat.", group: "Community" },
      { name: "rituals", label: "Ritual Path", description: "Step-by-step spiritual practice guide.", group: "Community" },
    ],
  },
  {
    role: "Mystery School",
    slug: "mystery-school",
    tagline: "Advanced esoteric training and decan studies",
    roleDescription:
      "A privileged path for serious practitioners. Dive deep into decan systems and master ritual building.",
    icon: Eye,
    gradient: "from-violet-500/20 to-purple-600/10",
    featureAreas: ["Curriculum", "Decan Studies", "Ritual Mastery"],
    capabilities: [
      "Navigate the 36 decans grid",
      "Progress through structured curriculum",
      "Build custom ritual sequences",
      "Track graduation progress",
    ],
    keyPages: ["Decans Grid", "Training Center", "Ritual Builder", "Graduation"],
    groups: [
      {
        groupLabel: "Mastery",
        cards: [
          { title: "Decans Grid", description: "36 decans overview", href: "/mystery-school", icon: Eye, status: "live" },
        ],
      },
    ],
    screens: [
      { name: "decans", label: "Decans Grid", description: "Visual map of the 36 decans.", group: "Mastery" },
      { name: "center", label: "Training Center", description: "Learning management.", group: "Curriculum" },
      { name: "lesson", label: "Lesson View", description: "Structured lesson content.", group: "Curriculum" },
      { name: "builder", label: "Ritual Builder", description: "Drag-and-drop ritual designer.", group: "Mastery" },
    ],
  },
  {
    role: "Social Advocate",
    slug: "social_advo",
    tagline: "Affiliate growth and referral rewards",
    roleDescription:
      "For partners focusing on community growth. Track referrals and manage affiliate links.",
    icon: Sparkles,
    gradient: "from-blue-500/20 to-indigo-600/10",
    featureAreas: ["Growth", "Referrals", "Earnings"],
    capabilities: [
      "Generate referral links",
      "Track conversion stats",
      "Review monthly payouts",
    ],
    keyPages: ["Referral Hub", "Performance", "Earnings Log"],
    groups: [
      {
        groupLabel: "Advocacy",
        cards: [
          { title: "Overview", description: "Referral stats", href: "/advocate", icon: LayoutDashboard, status: "live" },
        ],
      },
    ],
    screens: [
      { name: "advocate-home", label: "Advocacy Dashboard", description: "Overview of your impact.", group: "Advocacy" },
      { name: "payouts", label: "Earnings Log", description: "Transparency on commissions.", group: "Advocacy" },
    ],
  },
  {
    role: "Trainee",
    slug: "trainee",
    tagline: "Apprenticeship and skill development",
    roleDescription:
      "Master divine arts through structured lessons and mentor-assigned modules.",
    icon: GraduationCap,
    gradient: "from-amber-500/20 to-orange-600/10",
    featureAreas: ["Training", "Mentorship", "Milestones"],
    capabilities: [
      "Access assigned training modules",
      "Track practice session requirements",
      "Review mentor feedback",
    ],
    keyPages: ["Learning Hub", "Curriculum", "Milestones"],
    groups: [
      {
        groupLabel: "Training",
        cards: [
          { title: "Dashboard", description: "Current training focus", href: "/trainee", icon: LayoutDashboard, status: "live" },
        ],
      },
    ],
    screens: [
      { name: "trainee-hub", label: "Trainee Dashboard", description: "Personal development center.", group: "Training" },
      { name: "curriculum", label: "Learning Path", description: "Chronological map of lessons.", group: "Training" },
    ],
  },
  {
    role: "Customer Portal",
    slug: "customer",
    tagline: "Personal spiritual management and history",
    roleDescription:
      "A dedicated area for clients to manage their spiritual journey, track reading history, and interact with practitioners.",
    icon: User,
    gradient: "from-emerald-500/20 to-green-600/10",
    featureAreas: ["Dashboard", "Orders", "Bookings", "Account"],
    capabilities: [
      "Track upcoming and past readings",
      "Manage service subscriptions and billing",
      "Access recorded sessions and transcripts",
      "Update personal spiritual profile",
    ],
    keyPages: ["Dashboard", "My Bookings", "Order History", "Spiritual Profile"],
    groups: [
      {
        groupLabel: "Dashboard",
        cards: [
          { title: "Dashboard", description: "Customer overview", href: "/portal", icon: LayoutDashboard, status: "live" },
        ],
      },
    ],
    screens: [
      { name: "dashboard", label: "Customer Dashboard", description: "At-a-glance view of appointments.", group: "Dashboard" },
      { name: "bookings", label: "My Bookings", description: "Management of upcoming sessions.", group: "Services" },
      { name: "orders", label: "Order History", description: "Detailed list of all platform purchases.", group: "Services" },
      { name: "profile", label: "User Profile", description: "Account settings.", group: "Dashboard" },
    ],
  },
  {
    role: "Public / Visitor",
    slug: "public",
    tagline: "First impressions and platform discovery",
    roleDescription:
      "Unauthenticated pages designed to convert visitors into community members or clients through discovery and education.",
    icon: Globe,
    gradient: "from-sky-500/20 to-blue-600/10",
    featureAreas: ["Discovery", "Marketing", "Knowledge", "Onboarding"],
    capabilities: [
      "Browse and filter professional diviners",
      "Read spiritual articles and transit reports",
      "Interactive booking and service selection",
      "Self-serve registration and hub joining",
    ],
    keyPages: ["Homepage", "Discover", "Practitioner Profile", "Blog", "Join Hub"],
    groups: [
      {
        groupLabel: "Marketing",
        cards: [
          { title: "Homepage", description: "Main landing page", href: "/", icon: Home, status: "live" },
          { title: "Blog", description: "Spiritual insights", href: "/blog", icon: FileText, status: "live" },
        ],
      },
    ],
    screens: [
      { name: "home", label: "Homepage", description: "Main entry point with premium astrology branding.", group: "Marketing" },
      { name: "discover", label: "Diviner Discovery", description: "Search interface for finding practitioners.", group: "Discovery" },
      { name: "profile", label: "Practitioner Profile", description: "Public page for a diviner.", group: "Discovery" },
      { name: "checkout", label: "Booking Checkout", description: "Payment and scheduling flow.", group: "Discovery" },
      { name: "blog", label: "Blog Index", description: "Grid of latest articles.", group: "Marketing" },
      { name: "join", label: "Registration Hub", description: "Membership tier selection.", group: "Onboarding" },
    ],
  },
];



export const ADDITIONAL_PAGES = [
  {
    slug: "shared",
    title: "Shared Pages",
    screenCount: 4,
    description: "Cross-role pages accessible to every authenticated spiritualist — personal profile, settings, and support center.",
    pages: ["Profile", "Settings", "Notifications", "Help Center"]
  },
  {
    slug: "public",
    title: "Public Pages",
    screenCount: 6,
    description: "Unauthenticated marketing and discovery pages — archetypal landing page, diviner directory, and join flow.",
    pages: ["Homepage", "Discover", "Blog", "Join Hub", "Login"]
  }
];

export function getSectionBySlug(slug: string): WalkthroughSection | undefined {
  return WALKTHROUGH_SECTIONS.find((s) => s.slug === slug);
}

export function getTotalFeatureCount(): number {
  return WALKTHROUGH_SECTIONS.reduce(
    (sum, s) => sum + s.groups.reduce((gs, g) => gs + g.cards.length, 0),
    0,
  );
}
