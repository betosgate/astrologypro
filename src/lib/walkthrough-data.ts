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
    featureAreas: [
      "Governance",
      "Astrology Engines",
      "Mystery School",
      "Program Mgmt",
      "Commerce Hub",
      "Email Automation",
      "Platform Config",
    ],
    capabilities: [
      "Manage all platform accounts, roles, and permissions",
      "Govern mundane astrology engines and chart studios",
      "Oversee Mystery School students, decans, and curriculum",
      "Audit commerce activity, orders, and payment gateway",
      "Manage community engagement, testimonials, and giveaways",
      "Configure global platform settings, API keys, and legal docs",
    ],
    keyPages: [
      "Executive Analytics",
      "Mundane Astrology",
      "Mystery School Admin",
      "Commerce Hub",
      "Training Center",
      "System Config",
    ],
    groups: [
      {
        groupLabel: "Governance",
        cards: [
          { title: "Analytics", description: "Global health and KPI overview", href: "/admin", icon: LayoutDashboard, status: "live" },
          { title: "Users", description: "Master directory of all accounts", href: "/admin/users", icon: Users, status: "live" },
          { title: "Roles", description: "Role-based access configuration", href: "/admin/roles", icon: Shield, status: "live" },
        ],
      },
      {
        groupLabel: "Astrology",
        cards: [
          { title: "Mundane Hub", description: "Global astrological governance", href: "/admin/mundane", icon: Globe, status: "live" },
          { title: "Chart Studio", description: "Advanced natal and ingress charts", href: "/admin/chart-studio", icon: Star, status: "live" },
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
      // Overview
      { name: "overview", label: "Executive Analytics", description: "Global KPIs and platform health overview.", group: "Overview" },
      
      // People
      { name: "users", label: "User Directory", description: "Management of all platform accounts and profiles.", group: "People" },
      { name: "diviners", label: "Diviner Directory", description: "Specialized view for practitioner management.", group: "People" },
      { name: "affiliates", label: "Affiliate Partners", description: "Tracking of platform growth partners.", group: "People" },
      { name: "campaigns", label: "Marketing Campaigns", description: "Governance of promotional initiatives.", group: "People" },
      { name: "roles", label: "RBAC Configuration", description: "Modular role and permission management.", group: "People" },
      { name: "invitations", label: "System Invitations", description: "Audit trail of pending account invites.", group: "People" },
      { name: "social_advocacy", label: "Social Advocacy", description: "Engagement tools for community leaders.", group: "People" },
      { name: "deleted_users", label: "Account Deletions", description: "Management of soft-deleted platform users.", group: "People" },

      // Content
      { name: "blog_posts", label: "Blog Management", description: "Editorial workflow for platform articles.", group: "Content" },
      { name: "blog_analytics", label: "Blog Insights", description: "Performance tracking for editorial content.", group: "Content" },
      { name: "blog_cta_blocks", label: "Conversion Blocks", description: "Manage CTAs injected into blog posts.", group: "Content" },
      { name: "blog_categories", label: "Editorial Taxonomies", description: "Management of blog categories and tags.", group: "Content" },
      { name: "blog_authors", label: "Author Profiles", description: "Management of guest and staff writers.", group: "Content" },
      { name: "blog_series", label: "Content Series", description: "Grouping related articles into collections.", group: "Content" },
      { name: "media_items", label: "Global Asset Library", description: "Centralized media and file management.", group: "Content" },
      { name: "videos", label: "Video Library", description: "Management of platform video content.", group: "Content" },
      { name: "video_sessions", label: "Recorded Sessions", description: "Repository of archived video readings.", group: "Content" },
      { name: "webinars", label: "Webinar Hub", description: "Scheduling and management of live events.", group: "Content" },
      { name: "spiritual_wisdom", label: "Wisdom Library", description: "Curation of esoteric spiritual knowledge.", group: "Content" },
      { name: "general_content", label: "Platform Pages", description: "Management of static information pages.", group: "Content" },
      { name: "perennial_content", label: "Perennial Knowledge", description: "Specific content for the PM community.", group: "Content" },

      // Astrology
      { name: "wheel_signs", label: "Zodiac Wheel Signs", description: "Definition and config of zodiac attributes.", group: "Astrology" },
      { name: "mundane_dashboard", label: "Mundane Hub", description: "Global governance of geopolitical astrology.", group: "Astrology" },
      { name: "ingress_charts", label: "Ingress Engine", description: "Management of planetary entry charts.", group: "Astrology" },
      { name: "mundane_entities", label: "Geo Entities", description: "Mapping of nations and locations for charts.", group: "Astrology" },
      { name: "forecasts", label: "Prophetic Forecasts", description: "Management of high-level temporal forecasts.", group: "Astrology" },
      { name: "event_calendar", label: "Celestial Calendar", description: "Scheduler for major cosmic alignments.", group: "Astrology" },
      { name: "chart_studio", label: "Chart Design Studio", description: "Advanced visualization for natal charts.", group: "Astrology" },
      { name: "world_map", label: "Astro-Locality Map", description: "Global mapping of planetary strength.", group: "Astrology" },
      { name: "research", label: "Astrology Research", description: "Data mining tool for historic chart patterns.", group: "Astrology" },
      { name: "mundane_search", label: "Ephemeris Search", description: "Searchable database of planetary positions.", group: "Astrology" },
      { name: "mundane_access", label: "Access Control", description: "Permissioning for premium astro data.", group: "Astrology" },
      { name: "decan_journals", label: "Decan Wisdom", description: "Granular journals for the 36 decans.", group: "Astrology" },
      { name: "decan_media", label: "Decan Media", description: "Visual assets for decan-based studies.", group: "Astrology" },
      { name: "quarters", label: "Solar Quarters", description: "Governance of seasonal solar transitions.", group: "Astrology" },
      { name: "horoscope_toolkit", label: "Horoscope Builder", description: "Tools for generating dynamic horoscopes.", group: "Astrology" },

      // Programs
      { name: "mystery_school", label: "Mystery School Hub", description: "Central management for esoteric training.", group: "Programs" },
      { name: "ms_students", label: "Student Roster", description: "Tracking student progress and milestones.", group: "Programs" },
      { name: "ms_decans", label: "MS Decan Studies", description: "School-specific decan curriculum config.", group: "Programs" },
      { name: "ms_journals", label: "Student Journals", description: "Review of student esoteric practice logs.", group: "Programs" },
      { name: "mandalism", label: "Perennial Mandalism", description: "Management of community program flow.", group: "Programs" },
      { name: "sunday_service", label: "Sunday Service", description: "Scheduling and assets for moral sermons.", group: "Programs" },

      // Live & Schedule
      { name: "live_sessions", label: "Global Live Log", description: "Oversight of all active platform streams.", group: "Live" },
      { name: "check_ins", label: "System Check-ins", description: "Monitoring practitioner platform presence.", group: "Live" },
      { name: "my_schedule", label: "Master Calendar", description: "Combined view of all platform bookings.", group: "Schedule" },
      { name: "bookings", label: "Session Mgmt", description: "Oversight of individual user appointments.", group: "Schedule" },
      { name: "availability", label: "Global Availability", description: "Configuring system-wide booking windows.", group: "Schedule" },

      // Community
      { name: "pm_plan_tiers", label: "Plan Configuration", description: "Management of community payment tiers.", group: "Community" },
      { name: "broadcasts", label: "System Broadcasts", description: "Pushing messages to the entire community.", group: "Community" },
      { name: "calendar", label: "Community Events", description: "Shared calendar for public gatherings.", group: "Community" },
      { name: "holy_books", label: "Sacred Texts Hub", description: "Curation of downloadable doctrine books.", group: "Community" },
      { name: "doctrine_links", label: "Wisdom Index", description: "External resource mapping for studies.", group: "Community" },

      // Training
      { name: "training_lessons", label: "Curriculum Builder", description: "Designing lessons and courses.", group: "Training" },
      { name: "training_analytics", label: "Learning Insights", description: "Statistical performance of courses.", group: "Training" },
      { name: "training_settings", label: "Training Config", description: "Global settings for the graduation path.", group: "Training" },
      { name: "class_config", label: "Classroom Mgmt", description: "Configuration of virtual training rooms.", group: "Training" },

      // Commerce
      { name: "packages", label: "Product Packages", description: "Bundling services into commerce items.", group: "Commerce" },
      { name: "payments", label: "Transaction Logs", description: "Audit trail of all financial gateway events.", group: "Commerce" },
      { name: "refunds", label: "Refund Management", description: "Processing and tracking payment reversals.", group: "Commerce" },
      { name: "orders", label: "Platform Orders", description: "Full directory of all platform purchases.", group: "Commerce" },
      { name: "reports_commerce", label: "Commerce Reports", description: "Financial health and revenue analytics.", group: "Commerce" },
      { name: "activity_log", label: "System Activity", description: "Security audit trail of all admin actions.", group: "Commerce" },

      // Email
      { name: "email_sequences_v2", label: "Email Sequences", description: "Oversight of automated community email sequences.", group: "Email" },
      { name: "email_history", label: "Email History", description: "Audit of every email sent by the system to users.", group: "Email" },
      { name: "email_preview", label: "Email Preview", description: "Visual designer and test environment for system templates.", group: "Email" },

      // Engagement & Testimonials
      { name: "giveaways", label: "Giveaway Engine", description: "Management of community prize draws.", group: "Engagement" },
      { name: "testimonials_list", label: "Public Reviews", description: "Moderation of user feedback and ratings.", group: "Testimonials" },
      { name: "request_testimonial", label: "Review Requests", description: "Automated triggers for post-reading feedback.", group: "Testimonials" },

      // Support
      { name: "sla_dashboard", label: "SLA Dashboard", description: "Monitoring system speed and ticket response times.", group: "Support" },
      { name: "tarot_cards", label: "Arcana Library", description: "Detailed meaning config for every card.", group: "Tools" },
      { name: "rituals_list", label: "Ritual Repository", description: "Library of template spiritual practices.", group: "Tools" },

      // Reports
      { name: "report_revenue", label: "Revenue Analytics", description: "Deep dive into platform earnings.", group: "Reports" },
      { name: "report_bookings", label: "Booking Velocity", description: "Trends in appointment scheduling.", group: "Reports" },
      { name: "report_provider_costs", label: "Payout Liabilities", description: "Tracking what is owed to practitioners.", group: "Reports" },
      { name: "report_payouts", label: "Payout History", description: "Log of successfully processed transfers.", group: "Reports" },
      { name: "report_funnel", label: "Conversion Funnel", description: "Tracking visitor-to-member journey.", group: "Reports" },
      { name: "report_readings", label: "Reading Quality", description: "Metrics on session ratings and output.", group: "Reports" },
      { name: "report_affiliates", label: "Affiliate ROI", description: "Performance of external traffic sources.", group: "Reports" },
      { name: "report_campaigns", label: "Campaign ROI", description: "Financial results of marketing spends.", group: "Reports" },

      // Config
      { name: "platform_settings", label: "Global Settings", description: "Platform-wide branding and behavior.", group: "Config" },
      { name: "api_keys_config", label: "External APIs", description: "Credentials for Stripe, SMTP, and Astrology API.", group: "Config" },
      { name: "astro_system_settings", label: "Astro Engine Config", description: "House systems and calculation preferences.", group: "Config" },
      { name: "calendar_config_detailed", label: "Calendar Layouts", description: "Formatting for booking and transit calendars.", group: "Config" },
      { name: "pricing_management", label: "Pricing Matrix", description: "Complex pricing logic for tiers and services.", group: "Config" },
      { name: "legal_config", label: "Legal Docs", description: "Terms, Privacy Policy, and EULA management.", group: "Config" },
      { name: "db_migrations", label: "DB Schema Health", description: "Monitoring system state and migrations.", group: "Config" },

      // Walkthrough
      { name: "walkthrough_detailed", label: "Walkthrough Hub", description: "Self-referential config for this guide.", group: "Tools" },
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
