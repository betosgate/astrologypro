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
  TrendingUp,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Screen {
  name: string;
  label: string;
  description?: string;
  group?: string;
  subModule?: string;
  purpose?: string;
  bullets?: string[];
}

export interface FeatureCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status?: "live" | "beta" | "coming-soon";
  thumbnail?: string; 
  bullets?: string[];
  screenshots?: string[];
  roleSlugs?: string[];
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
  admin: "Administration Suite",
  diviner: "Diviner Studio",
  community: "Perennial Mandalism",
  "mystery-school": "Mystery School",
  social_advo: "Affiliate Partner",
  trainee: "Trainee Academy",
  customer: "Client Portal",
  public: "Public Experience",
};

// ─── Section definitions ────────────────────────────────────────────────────

export const WALKTHROUGH_SECTIONS: WalkthroughSection[] = [
  {
    role: "Administration Suite",
    slug: "admin",
    tagline: "Platform governance and system intelligence",
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
          { 
            title: "Horoscope Toolkit", 
            description: "Step-by-step reading generation", 
            href: "/admin/horoscope", 
            icon: Sparkles, 
            status: "live",
            screenshots: [
              "admin/horoscope_nativity_blank",
              "admin/horoscope_nativity_filled",
              "admin/horoscope_nativity_result_1",
              "admin/horoscope_weekly_result"
            ]
          },
        ],
      },
      {
        groupLabel: "Commerce",
        cards: [
          { title: "Orders", description: "Consolidated platform sales log", href: "/admin/orders", icon: ShoppingBag, status: "live" },
          { title: "Payments", description: "Gateway tracking and payouts", href: "/admin/payments", icon: CreditCard, status: "live" },
        ],
      },
      {
        groupLabel: "Growth & Advocacy",
        cards: [
          { title: "Social Advocacy", description: "Manage advocate program and leaderboard", href: "/admin/advocacy", icon: TrendingUp, status: "live" },
          { title: "Campaign Detail", description: "Create and configure referral campaigns", href: "/admin/campaigns", icon: Zap, status: "live" },
          { title: "Live Monitor", description: "Real-time view of all active broadcasts", href: "/admin/live-monitor", icon: Radio, status: "live" },
        ],
      },
    ],
    screens: [
      // Overview
      {
        name: "overview",
        label: "Executive Analytics", 
        description: "Global KPIs and platform health overview.", 
        group: "Overview",
        purpose: "Provides platform owners with a high-level summary of system performance, financial health, and user activity in real-time.",
        bullets: [
          "Real-time revenue and booking tracking",
          "Active user sessions and platform health metrics",
          "Conversion funnel visualization",
          "Recent transaction logs and order summaries"
        ]
      },
      { 
        name: "overview_v2", 
        label: "System Command Center", 
        description: "Primary entry point for administrative controls and role-based navigation.", 
        group: "Overview",
        purpose: "A redesigned administrative hub focusing on actionable tasks and quick-access governance tools.",
        bullets: [
          "Shortcut widgets for frequent governance tasks",
          "System alert and notification center",
          "Role-based performance summaries",
          "Quick-access to multi-role portal switching"
        ]
      },
      
      // People
      { 
        name: "users", 
        label: "Users", 
        description: "Management of all platform accounts and profiles.", 
        group: "People",
        purpose: "The master control center for user accounts. Allows administrators to search, filter, and audit all members, diviners, and staff members.",
        bullets: [
          "Granular user search and advanced filtering",
          "Profile auditing and account state management",
          "Identity verification and KYC oversight",
          "One-click login impersonation for support"
        ]
      },
      { 
        name: "diviners_v2", 
        label: "Diviners", 
        description: "Specialized view for practitioner management.", 
        group: "People",
        purpose: "A dedicated interface for managing the platform's professional diviners, their credentials, and performance.",
        bullets: [
          "Practitioner onboarding and status tracking",
          "Specialty and service category management",
          "Payout configuration and liability tracking",
          "Performance metrics and review moderation"
        ]
      },
      {
        name: "affiliates_v2",
        label: "Affiliates",
        description: "Central management panel for all social advocates and affiliate partners on the platform. See their performance, commission earnings, and referral activity in one admin view.",
        group: "People",
        purpose: "The Affiliates panel is where administrators manage everyone who has been granted a Social Advocate role on the platform. These are people who earn commissions by referring new members. Admins can see how many referrals each advocate has made, how much they have earned, whether their account is active, and review any commission disputes. It is the oversight layer above the individual advocate's own dashboard.",
        bullets: [
          "All advocates listed — complete list of every social advocate account, active or inactive",
          "Referral count per advocate — how many successful sign-ups each partner has driven",
          "Commission earned — total lifetime and current-period commissions per advocate",
          "Payout status — which advocates have pending payouts, which have been paid",
          "Activate or deactivate — toggle an advocate account on or off without deleting it",
          "View individual dashboard — jump to any advocate's personal dashboard as an admin",
          "Commission rate override — set a custom commission rate for specific high-performing partners"
        ]
      },
      // { name: "campaigns", label: "Marketing Campaigns", description: "Governance of promotional initiatives.", group: "People" },
      { 
        name: "roles", 
        label: "Roles", 
        description: "Modular role and permission management.", 
        group: "People",
        purpose: "Governs the security and accessibility of the platform via Role-Based Access Control (RBAC).",
        bullets: [
          "Dynamic permission mapping for 8+ stakeholder roles",
          "System-wide feature gate configuration",
          "Audit logs for permission changes",
          "Custom staff role creation and scoping"
        ]
      },
      // { name: "invitations", label: "System Invitations", description: "Audit trail of pending account invites.", group: "People" },
      // { name: "social_advocacy", label: "Social Advocacy", description: "Engagement tools for community leaders.", group: "People" },
      // { name: "deleted_users", label: "Account Deletions", description: "Management of soft-deleted platform users.", group: "People" },

      // Content
      { 
        name: "blog_posts", 
        label: "Blog Posts", 
        description: "Editorial workflow for platform articles.", 
        group: "Content",
        purpose: "The central nervous system for platform content. Allows admins to manage the editorial calendar, review drafts, and publish spiritual insights.",
        bullets: [
          "Markdown-powered editorial suite",
          "Collaborative drafting and internal reviews",
          "SEO optimization and meta-tagging suite",
          "Scheduled publishing and distribution logic"
        ]
      },
      {
        name: "blog_analytics",
        label: "Blog Analytics",
        description: "Performance data for every published article — page views, reading time, top articles, and traffic sources. Use this to understand which content resonates with your audience.",
        group: "Content",
        purpose: "Blog analytics shows admins the real-world impact of every piece of content published on the platform. Instead of guessing what readers want, this page gives concrete data — which articles get the most traffic, how long people read before leaving, which categories attract the most engagement, and where readers are coming from. Use it to guide editorial decisions and double down on content that converts.",
        bullets: [
          "Top articles by views — a ranked list of the highest-traffic posts in any date range",
          "Average reading time — how long visitors spend on each article before leaving",
          "Traffic sources — where readers are coming from (search, social media, direct, referral)",
          "Category performance — which content categories (astrology, tarot, rituals, etc.) get the most engagement",
          "New vs returning readers — how many visitors are first-time vs repeat content consumers",
          "Date range filter — compare this month vs last month or any custom period",
          "Export data — download analytics as CSV for external reporting or trend analysis"
        ]
      },
      {
        name: "blog_categories_v2",
        label: "Blog Categories",
        description: "Create and manage the category system that organizes all blog posts. Categories help readers navigate to topics they care about and improve search engine visibility.",
        group: "Content",
        purpose: "Categories are the navigation backbone of the blog. When a reader wants to find all articles about astrology or tarot, they browse by category. This page lets admins create new categories, rename existing ones, set descriptions, and decide which categories appear in the top navigation. Good category management makes the blog more discoverable and keeps content organized as it grows.",
        bullets: [
          "All categories listed — see every category with post count and visibility status",
          "Create new category — add a name, slug (URL-friendly name), and description",
          "Edit or rename — update category names without breaking existing posts",
          "Category slug — the URL path used in links (e.g. /blog/category/astrology)",
          "Set visibility — choose which categories appear in public navigation menus",
          "Post count — see how many articles are currently assigned to each category",
          "Sort order — control the order categories appear in navigation and sidebars"
        ]
      },
      {
        name: "blog_authors_v2",
        label: "Blog Authors",
        description: "Manage the writer profiles for all blog contributors. Authors get their own bio page and their name appears on every article they write, building personal credibility with readers.",
        group: "Content",
        purpose: "Every blog post is attributed to an author. Author profiles include a photo, short bio, specialties, and a link to all their published articles. This page lets admins create and manage author records — whether for internal staff writers, guest contributors, or the diviners who publish their own insights. Strong author profiles build trust with readers and help with SEO.",
        bullets: [
          "All authors listed — every registered contributor with photo, name, and post count",
          "Create new author — add a name, profile photo, short bio, and specialties",
          "Link to user account — optionally connect an author profile to a real platform user account",
          "Author page URL — each author gets a public page showing all their published articles",
          "Edit or archive — update author details or deactivate an author without deleting their posts",
          "Guest contributors — create author profiles for external writers who do not have platform accounts",
          "SEO fields — add a meta description for the author's public page to improve search rankings"
        ]
      },
      // { name: "blog_series", label: "Content Series", description: "Grouping related articles into collections.", group: "Content" },
      { 
        name: "media_items_v2", 
        label: "Media Items", 
        description: "Centralized media and file management.", 
        group: "Content",
        purpose: "A high-performance digital asset manager for all platform imagery, video, and documents.",
        bullets: [
          "Cloud-hosted CDN asset management",
          "Bulk upload and automated optimization",
          "Categorized asset tagging and search",
          "Usage tracking across platform modules"
        ]
      },
      // { name: "videos", label: "Video Library", description: "Management of platform video content.", group: "Content" },
      {
        name: "video_sessions",
        label: "Recorded Sessions",
        description: "The platform-wide archive of all recorded video readings and live sessions. Admins can browse, search, moderate, and manage access to every session recording stored on the platform.",
        group: "Content",
        purpose: "When a diviner records a session, or when a live broadcast is captured, the recording is stored here. This gives admins visibility over all recorded content — useful for quality assurance, compliance, storage management, and helping users find their recordings. Admins can search by diviner, client, date, or session type, and can revoke access to a recording if needed.",
        bullets: [
          "All recordings in one place — every saved video session from all diviners, sorted by date",
          "Search and filter — find recordings by diviner name, client, date, or session type",
          "Playback controls — watch any recording directly from the admin panel for moderation",
          "Access management — revoke or restore a client's access to a specific recording",
          "Storage tracking — see the total storage used by recordings and per-diviner breakdowns",
          "Delete recordings — permanently remove recordings that should not be kept",
          "Download option — save specific recordings for compliance or dispute resolution"
        ]
      },
      {
        name: "webinars_v2",
        label: "Webinar Hub",
        description: "Schedule, manage, and archive platform webinars and live events. Control registration, assign hosts, set capacity limits, and send promotional notifications to members.",
        group: "Content",
        purpose: "Webinars are scheduled live events — broader than a one-on-one reading but different from Sunday Service. They might be educational workshops, Q&A sessions with diviners, seasonal astrological reviews, or special community events. This hub lets admins plan upcoming webinars, assign hosts, manage registrations, and archive past events. It is the backstage control room for everything live and scheduled.",
        bullets: [
          "Upcoming webinars — all scheduled future events with date, host, topic, and registration count",
          "Create a new webinar — set title, description, date, time, host diviner, and capacity limit",
          "Registration management — see who has registered and send pre-event reminders",
          "Capacity control — set a maximum number of attendees and show a waitlist when full",
          "Send notifications — push email or platform alerts to registered members before the event",
          "Past webinar archive — recordings and materials from all completed events",
          "Analytics — attendance rate, average watch time, and engagement metrics per event"
        ]
      },
      { 
        name: "spiritual_wisdom_v2", 
        label: "Spiritual Wisdom", 
        description: "Curation of esoteric spiritual knowledge.", 
        group: "Content",
        purpose: "The master repository for the platform's core spiritual doctrines and esoteric teachings.",
        bullets: [
          "Hierarchical spiritual knowledge mapping",
          "Exclusive member-only content gates",
          "Audio and visual wisdom asset linking",
          "Searchable esoteric cross-references"
        ]
      },
      // { name: "general_content", label: "Platform Pages", description: "Management of static information pages.", group: "Content" },
      // { name: "perennial_content", label: "Perennial Knowledge", description: "Specific content for the PM community.", group: "Content" },

      // Astrology
      {
        name: "wheel_signs_v2",
        label: "Wheel Signs",
        description: "Configure the zodiac sign definitions used across all chart tools. Control glyph symbols, element and modality assignments, ruling planets, keywords, and the descriptions that appear in every chart reading on the platform.",
        group: "Astrology",
        purpose: "The Wheel Signs configuration is the foundational data layer for all astrology on the platform. Every chart tool — from natal charts to transit reports — reads from this table to display correct zodiac sign information. Admins can update the descriptions shown to users for each of the 12 signs, adjust ruling planet assignments, or change display keywords. This affects how the entire platform represents astrological sign data.",
        bullets: [
          "All 12 zodiac signs — complete list with symbol, element, modality, and ruling planet",
          "Edit sign descriptions — update the text shown to users when a planet falls in a specific sign",
          "Symbol and glyph settings — control which Unicode or SVG symbol represents each sign in charts",
          "Element assignment — Fire, Earth, Air, Water designation for each sign",
          "Modality — Cardinal, Fixed, or Mutable classification for each sign",
          "Ruling planet — which planet traditionally governs each sign",
          "Keywords — short descriptive tags used in AI readings and chart summaries"
        ]
      },
      { 
        name: "mundane_dashboard", 
        label: "Mundane Hub", 
        description: "Global governance of geopolitical astrology.", 
        group: "Astrology",
        purpose: "The command center for world astrology, allowing users to track planetary transits against nations, entities, and global events.",
        bullets: [
          "Geo-political entity mapping and NAT charts",
          "Global transit overlay against major nations",
          "Historical mundante event search and analysis",
          "Prophetic dashboard for geopolitical forecasting"
        ]
      },
      { 
        name: "ingress_charts_v2", 
        label: "Ingress Charts", 
        description: "Management of planetary entry charts.", 
        group: "Astrology",
        purpose: "A specialized tool for calculating the exact moment a planet enters a new sign (Ingress), used for mundane forecasting.",
        bullets: [
          "Precise ingress moment calculations",
          "Regional chart overlay for world events",
          "Historical search of past ingress alignments",
          "Automated alert triggers for major entries"
        ]
      },
      {
        name: "mundane_entities_v2",
        label: "Mundane Entities",
        description: "The database of nations, cities, companies, and notable figures used in mundane astrology charts. Each entity has a natal chart calculated from its founding date and location, used to track how planetary transits affect it.",
        group: "Astrology",
        purpose: "Mundane astrology requires reference charts for real-world entities — countries, governments, major cities, corporations, and historical figures. This page manages that database. When a new country or entity needs to be added (for example, a newly formed nation or an important organization), admins add it here with its founding date, time, and location. The platform then automatically generates its natal chart for use in mundane transit analysis.",
        bullets: [
          "All entities listed — every country, city, organization, and notable figure in the mundane database",
          "Add new entity — enter the name, founding date, time, location, and category",
          "Auto-generated natal chart — the platform calculates the entity's chart from its founding data",
          "Categories — entities are organized by type (nation, city, corporation, historical figure, celestial body)",
          "Transit overlay — see which current planetary transits are affecting a specific entity",
          "Edit or archive — update entity details or retire outdated records",
          "Search — find any entity instantly by name, country, or category"
        ]
      },
      {
        name: "forecasts_v2",
        label: "Forecasts",
        description: "Create and publish astrological forecasts for specific time periods — weekly, monthly, or annual outlooks covering planetary themes, major transits, and collective guidance.",
        group: "Astrology",
        purpose: "Forecasts are curated astrological outlooks written by the admin team or AI-assisted and published to members. A monthly forecast might cover the major planetary themes for that month — like a Mercury retrograde, a full moon in a specific sign, or a major outer planet transit. These forecasts are displayed to members on the platform as expert guidance for the period ahead.",
        bullets: [
          "All forecasts listed — published and draft forecasts organized by date and period",
          "Create a forecast — write or paste a forecast for a specific week, month, or season",
          "Rich text editor — format forecasts with headings, bullet points, and embedded charts",
          "AI-assisted drafting — use the platform's AI to generate a draft forecast based on the period's transits",
          "Publish or schedule — make a forecast live immediately or schedule it to publish on a specific date",
          "Member visibility — control whether a forecast is visible to all users or only specific member tiers",
          "Archive — past forecasts are saved and searchable for historical reference"
        ]
      },
      {
        name: "event_calendar_v2",
        label: "Event Calendar",
        description: "The master calendar of major astrological events — eclipses, ingresses, retrogrades, full moons, and planetary stations. Used to populate the cosmic calendar visible across the entire platform.",
        group: "Astrology",
        purpose: "This is the admin-side source of truth for all significant astrological dates on the platform. Every eclipse, planetary retrograde, new and full moon, seasonal ingress, and major conjunction is listed here. When members see a 'Cosmic Calendar' on their dashboard, the data comes from this table. Admins can add custom events, edit automatically calculated ones, and attach notes or rituals to specific dates.",
        bullets: [
          "All celestial events — eclipses, retrogrades, ingresses, full moons, new moons, stations, conjunctions",
          "Auto-populated — the platform's astrology engine automatically populates known events from ephemeris data",
          "Add custom events — create platform-specific events like school ceremonies or special broadcasts",
          "Attach content — link a ritual, forecast, or webinar to a specific celestial event",
          "Date filtering — browse events by month, quarter, or custom date range",
          "Visibility control — choose whether an event appears publicly or only to specific member tiers",
          "Export calendar — download the event list as iCal or CSV for external calendar integration"
        ]
      },
      { 
        name: "chart_studio", 
        label: "Chart Studio", 
        description: "Advanced visualization for natal charts.", 
        group: "Astrology",
        purpose: "The creative engine for platform-wide chart aesthetics. Admins can configure how astrology charts are rendered for all users.",
        bullets: [
          "Custom SVG chart rendering engine settings",
          "Component-based chart layout configuration",
          "Visual styling and token management",
          "Real-time preview of chart generation types"
        ]
      },
      { 
        name: "world_map", 
        label: "World Map", 
        description: "Global mapping of planetary strength.", 
        group: "Astrology",
        purpose: "Visualizes the geographic lines of planetary influence (Astro-Cartography) across the physical globe.",
        bullets: [
          "Interactive SVG world map overlay",
          "Planetary line calculations (AC, DC, MC, IC)",
          "Region-specific influence density mapping",
          "Exportable locality data for world forecasting"
        ]
      },
      // { name: "research", label: "Astrology Research", description: "Data mining tool for historic chart patterns.", group: "Astrology" },
      {
        name: "mundane_search_v2",
        label: "Mundane Search",
        description: "A powerful search tool for querying the platform's ephemeris database — find planetary positions for any date, time, and location in history. Used for research, chart verification, and historical pattern analysis.",
        group: "Astrology",
        purpose: "The Mundane Search is like a planetary position lookup engine. If you want to know exactly where every planet was on a specific date — say, the day a country was founded, the date of a historical event, or a client's birth date — you enter that date here and get the complete planetary positions. It is an essential research tool for mundane astrologers and administrators who need to verify or cross-reference astrological data.",
        bullets: [
          "Date and time input — enter any date and time to retrieve planetary positions for that moment",
          "Location input — set a geographic location for house-system calculations",
          "Full planet table — returns Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, and Nodes",
          "House positions — calculate house cusps for the given date and location",
          "Retrograde status — see which planets were retrograde on that date",
          "Historical depth — search dates going back centuries for mundane research",
          "Export results — save the planetary data as a table for use in reports or chart tools"
        ]
      },
      // { name: "mundane_access", label: "Access Control", description: "Permissioning for premium astro data.", group: "Astrology" },
      // { name: "decan_journals", label: "Decan Wisdom", description: "Granular journals for the 36 decans.", group: "Astrology" },
      // { name: "decan_media", label: "Decan Media", description: "Visual assets for decan-based studies.", group: "Astrology" },
      // { name: "quarters", label: "Solar Quarters", description: "Governance of seasonal solar transitions.", group: "Astrology" },

{
  name: "horoscope_nativity_filled",
  label: "Nativity Birth Chart: Setup & Generation",
  description: "Enter birth details to generate the full nativity chart and step-by-step astrology reading.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This is the first screen of the Nativity Birth Chart flow. The user begins here by entering date of birth, time of birth, and place of birth. These required inputs allow the system to calculate the natal chart accurately. Once all required fields are entered, the Generate Reading button becomes active. After generation, the system builds the full chart and presents the reading in multiple sections, moving from technical chart data to easy-to-understand interpretations and deeper spiritual analysis. The optional Area of Inquiry field allows the reading to focus more clearly on topics such as career, relationships, family, or personal growth.",
  bullets: [
    "📅 Date of Birth — Used to calculate the zodiac sign positions of the Sun, Moon, planets, and key chart points on the day of birth.",
    "🕐 Time of Birth — Used to calculate the Ascendant, house cusps, Midheaven, and exact planetary house placements. More accurate time gives a more accurate chart.",
    "📍 Place of Birth — Used to set the geographic location needed to calculate the local sky, house system, and rising sign correctly.",
    "💬 Area of Inquiry (Optional) — Lets the user focus the reading on a specific life area such as career, love, marriage, health, family, or spiritual growth.",
    "✅ Generate Reading Button — Becomes active only after Date of Birth, Time of Birth, and Place of Birth are all filled in.",
    "🪐 Natal Birth Chart — The system first creates the core natal chart wheel, showing the zodiac signs, houses, and planetary placements at the moment of birth.",
    "📋 Planet Information — Displays each planet’s sign, full degree, house placement, normalized degree, movement speed, and retrograde status.",
    "🏠 House Information — Shows all 12 houses with their ruling sign, cusp degree, and any planets placed in each house.",
    "📖 House Interpretations — Explains what each house means in the user’s life, such as self, money, communication, home, work, relationships, and career.",
    "🔗 Aspect Dynamics — Lists how planets interact with one another through conjunctions, oppositions, trines, squares, sextiles, and other aspect patterns.",
    "🧠 Aspect Interpretations — Turns those planetary relationships into readable insight about emotions, thinking style, strengths, challenges, and life patterns.",
    "🔺 Decan Wisdom — Adds a deeper interpretive layer based on the exact 10-degree section of a sign, refining the meaning of a planet’s placement.",
    "⬆️ Angles and Points — Explains major chart points like the Ascendant, Midheaven, and Vertex, showing personality style, public path, and major turning points.",
    "⚫ Lilith Analysis — Explores deeper themes such as inner rebellion, authenticity, hidden intensity, and the need to challenge limiting beliefs or structures.",
    "✨ Dharma and Karma — Provides a deeper spiritual reading of life purpose, growth path, karmic lessons, responsibilities, and inner evolution.",
    "🧠 Full Reading Flow — The screen works as a guided journey, starting with raw chart data and continuing into interpretations, visuals, and deeper personal meaning."
  ]
},
     
      // { 
      //   name: "horoscope_nativity_result_1", 
      //   label: "Nativity: Your Birth Chart Wheel", 
      //   description: "See your personal astrological chart come to life.", 
      //   group: "Horoscope Toolkit",
      //   subModule: "Nativity Birth Chart",
      //   purpose: "This is your personal birth chart — a circular map of the sky at the exact moment you were born. The wheel is divided into 12 sections (houses) and shows where every planet was positioned. Two chart versions are displayed side by side so you can cross-verify the results from two leading astrology engines for maximum accuracy.",
      //   bullets: [
      //     "🔵 The inner ring shows your natal planets — where each planet was the moment you were born.",
      //     "🌐 Two chart wheels are shown side by side from different astrological sources for comparison.",
      //     "🔗 The lines inside the wheel show how planets are connected or in tension — these are called aspects.",
      //     "🏠 The 12 segments around the wheel represent the 12 houses — each governs a different area of your life."
      //   ]
      // },
      { 
        name: "horoscope_nativity_processing_v2", 
        label: "Nativity: Generating Your Reading", 
        description: "Your core astrological architecture is being synthesized.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "Our engine is performing a deep-dive analysis into your celestial signature. It scans for your core personality traits, maps planets into 12 distinct life segments (houses), and calculates the 'aspects'—the complex relationships between planets. This process reveals your mental depth, emotional growth triggers, and elemental balance for a professional, 100% accurate reading.",
        bullets: [
          "✔ Mapping Core Components — Identifying how signs, houses, and planets form your unique personality.",
          "🧠 Mental & Emotional Scan — Calculating aspect lines to measure your thinking style and growth potential.",
          "🌍 Elemental Balance — Checking the distribution of Fire, Earth, Air, and Water in your nature.",
          "🏠 Life Area Evaluation — Focusing on your career legacy, relationship patterns, and emotional roots.",
          "🚀 Destiny Analysis — Identifying the important karmic lessons and major turning points in your life path."
        ]
      },
      { 
        name: "horoscope_nativity_result_planets_v1", 
        label: "Nativity: Planet Information Table", 
        description: "The raw foundation of your entire birth chart — every planet, sign, house, and degree.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "This is the master data table that powers your entire reading. Each row represents a planet and shows its exact zodiac sign, the house (life area) it occupies, its precise degree, its speed of movement, and whether it is in retrograde. An astrologer reads this table to understand your personality (Sun), emotions (Moon), thinking style (Mercury), love nature (Venus), drive (Mars), career discipline (Saturn), and karmic destiny (Node). This is the raw data from which the chart wheel and all AI interpretations are generated.",
        bullets: [
          "🌞 Planet Column — Each planet governs a different part of your life: Sun = core identity, Moon = emotions, Mercury = mind, Venus = love, Mars = energy, Jupiter = growth, Saturn = discipline.",
          "♈ Sign Column — Shows which zodiac sign the planet was in at birth. Example: Sun in Libra = balanced and diplomatic personality; Moon in Aries = emotionally bold and impulsive.",
          "📐 Full Degree — The exact position in the full 360° zodiac circle. Used to calculate aspects (relationships between planets) with precision.",
          "🏠 House Column — Which of the 12 life areas the planet influences. House 6 = work & routine, House 5 = love & creativity, House 10 = career & public image, House 12 = hidden emotions & spirituality.",
          "📏 Norm Degree — The degree within the sign only (0°–30°). Used for fine-tuning predictions, compatibility matching, and advanced decan-level interpretation.",
          "⚡ Speed — How fast the planet is moving. Fast planets (like Moon at 13.20) = active daily influence. Slow or negative speed (like Saturn at -0.017) = deep, long-term karmic impact.",
          "🔁 Retro Column — 'Yes' means the planet is in retrograde (appears to move backward). Saturn Retro = delayed career success but eventual strength. Neptune Retro = deep intuition and spiritual confusion. Node Retro = strong karmic life path and destiny-driven experiences."
        ]
      },
      {
        name: "horoscope_nativity_result_interpret_v1",
        label: "Nativity: AI Interpretation — Sun, Moon & Mercury",
        description: "How the AI converts your raw chart data into personal life readings.",
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "This screen transforms raw astronomical data into personal meaning. For each planet, the AI uses a formula: Planet + Sign + House + Degree + Speed = Your Reading. The Sun block reveals your core identity and life direction. The Moon block explains your emotional nature and subconscious patterns. The Mercury block breaks down your thinking style and communication strengths. Each colored block shows the planet's sign and house badge in the top-right corner — click 'Show More' to unlock the full deep-dive interpretation.",
        bullets: [
          "🌞 Sun (e.g. Libra · House 6) — Your core identity and life purpose. Libra in House 6 means you thrive in structured, balanced work environments and succeed through teamwork, diplomacy, and collaboration.",
          "🌙 Moon (e.g. Aries · House 12) — Your emotional world and inner patterns. Aries in House 12 means you feel things deeply and boldly, but process emotions internally and privately — often handling challenges alone.",
          "🧠 Mercury (e.g. Virgo · House 6) — Your thinking style and communication. Virgo in House 6 means you have a sharp analytical mind with strong attention to detail — excellent for technical work, analysis, and problem-solving.",
          "⚡ Speed Indicator — A fast-moving planet (like Moon at 13.20) has an active, daily influence on your life. A slow planet means deeper, long-term impact.",
          "🔁 Retrograde Flag — If a planet shows 'Retro', its energy turns inward. Mercury Retro = overthinking. Saturn Retro = delayed but eventual success.",
          "📖 Click 'Show More' — Opens the full deep-dive modal with house placement details, degree precision, speed analysis, and actionable career/life advice."
        ]
      },
      {
  name: "horoscope_nativity_interpret_deep_v1",
  label: "Nativity: Deep Sun Insights",
  description: "A clear, structured breakdown of your Sun placement, explaining your identity, work style, and life direction.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This panel opens when the user clicks 'Show More' on the Sun section. It provides a deeper but easy-to-understand explanation of how the Sun’s sign, house, degree, speed, and motion influence personality, daily life, and career. Instead of complex astrology terms, it explains each factor step-by-step so users can clearly understand how their core identity works in real life.",
  bullets: [
    "🏠 House Placement — Explains which area of life (work, relationships, career, etc.) your core identity is focused on.",
    "♎ Zodiac Sign Meaning — Describes your natural personality traits, behavior style, and how you express yourself.",
    "📐 Degree Insight — Shows how strongly your Sun expresses its sign qualities and whether it represents a new beginning or mature energy.",
    "⚡ Speed Influence — Explains whether your actions and decisions are fast, steady, or slow, and how you approach life pace.",
    "🔁 Motion (Direct/Retrograde) — Clarifies whether your energy is expressed outwardly or more internally.",
    "💼 Practical Life Impact — Provides real-world meaning for your work style, habits, and how you succeed in daily life."
  ]
},
    {
  name: "horoscope_nativity_interpret_visual_v1",
  label: "Nativity: Visual Personality Guide (Sun in Libra)",
  description: "A simple visual explanation of how your Sun and zodiac sign combine to shape your core personality.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This visual panel helps users quickly understand the meaning of their Sun placement by showing three layers in one diagram. The left section explains the natural qualities of the Sun, such as identity, confidence, purpose, and self-expression. The right section explains the qualities of the zodiac sign, such as Libra’s balance, fairness, diplomacy, charm, and relationship focus. The center section shows the blended traits created when the Sun expresses itself through Libra, helping users understand how their core identity behaves in real life. It is designed to make astrology easy, visual, and immediately understandable even for users with no prior astrology knowledge.",
  bullets: [
    "☀️ Left Section — Shows the core qualities of the Sun, including identity, vitality, confidence, purpose, willpower, leadership, and self-expression.",
    "♎ Right Section — Shows the traits of the zodiac sign, such as Libra’s harmony, fairness, diplomacy, sociability, peace-making, charm, and relationship orientation.",
    "✨ Center Blend — Explains the combined personality created by Sun in Libra, such as balance, cooperation, equality, justice, partnership, tact, refinement, and peaceful social intelligence.",
    "🧠 Easy Interpretation — Helps astrologers and users quickly understand how the planet’s natural energy changes when expressed through a specific zodiac sign.",
    "🎨 Visual Learning Tool — Useful as a clear reference for chart explanation, client sharing, personal reflection, or educational astrology content."
  ]
},
   {
  name: "horoscope_nativity_result_interpret_v2",
  label: "Nativity: Venus, Mars & Decan Insights",
  description: "Explains your love style, motivation, action patterns, and the deeper decan layer linked to a planet.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This section presents deeper interpretations for Venus and Mars, helping users understand how they relate, attract, desire, act, and pursue goals. Venus explains love, beauty, charm, pleasure, values, and relationship style. Mars explains drive, ambition, courage, assertiveness, conflict style, and the way a person takes action in daily life and career. Some planets also show a small triangle icon, which indicates that a Decan interpretation is available. The decan is a more detailed astrological layer that divides each zodiac sign into three 10-degree sections, adding nuance to the planet’s expression. This helps astrologers and users understand not only the sign and house of a planet, but also the subtler tone, style, and secondary influence shaping that placement.",
  bullets: [
    "💛 Venus Reading — Explains attraction style, relationship needs, beauty preferences, charm, pleasure, creativity, and how love energy is expressed.",
    "🔥 Mars Reading — Shows motivation, ambition, courage, action style, work drive, assertiveness, and how the user goes after goals or handles conflict.",
    "🔺 Triangle Icon (Decan) — Indicates that an extra interpretive layer is available for that planet through the Decan system.",
    "📐 What a Decan Means — Each zodiac sign is divided into 3 decans of 10 degrees each, and the planet’s exact degree decides which decan it belongs to.",
    "🧠 Why Decans Matter — Decans refine the reading by adding a second tone to the planet, helping astrologers explain why two people with the same sign placement can still feel different.",
    "🎨 Visual Planet Cards — Each planet appears in its own colored block so users can quickly identify, read, and compare different personal energies."
  ]
},
  {
  name: "horoscope_nativity_decan_detail_v1",
  label: "Nativity: Decan Wisdom (Mercury)",
  description: "A deeper esoteric layer explaining Mercury’s placement through decan, tarot, and archetypal meaning.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This modal opens when the user clicks the triangle (🔺) icon on a planet. It provides an advanced decan-level interpretation of the planet’s placement. The decan system divides each zodiac sign into three 10-degree sections, and each section adds a unique influence to the planet. In this example, Mercury in Virgo (3rd decan) is influenced by Venus, which refines Mercury’s analytical nature with creativity, value-building, and practical intelligence. The panel combines traditional astrology with symbolic systems like Tarot and mythological archetypes, helping astrologers and advanced users understand the deeper meaning behind the planet’s expression in real life.",
  bullets: [
    "🔺 Decan Explanation — Shows which 10-degree segment of the zodiac the planet falls into and how it modifies the base sign meaning.",
    "🪐 Planet + Decan Blend — Explains how Mercury’s analytical Virgo nature is refined by the decan influence (e.g., Venus adding creativity, value, and refinement).",
    "🃏 Tarot Mapping — Connects the placement to a Tarot Minor Arcana card (e.g., Ten of Disks), symbolizing long-term success, stability, and material growth.",
    "💰 Mundane Force Meaning — Interprets real-world themes like work, wealth, productivity, and practical achievement linked to this decan.",
    "🏛️ Archetypal Insight — Includes mythological or symbolic figures (e.g., Ploutos, god of wealth) to explain deeper psychological and life patterns.",
    "📚 Advanced Layer — Helps astrologers understand subtle differences between similar placements by adding a refined, symbolic, and historical perspective."
  ]
},
      // { 
      //   name: "horoscope_nativity_interpret_outer_v1", 
      //   label: "Nativity: AI Narratives (Outer & Social)", 
      //   description: "Synthesis of destiny and professional drive.", 
      //   group: "Horoscope Toolkit",
      //   subModule: "Nativity Birth Chart",
      //   purpose: "The final layer of the narrative engine analyzes the outer and social planets (Jupiter, Saturn, Uranus), focusing on how these greater forces shape the user's career, responsibility, and innovation.",
      //   bullets: [
      //     "Jupiter: Expansion of creative horizons and professional potential",
      //     "Saturn: Assessment of professional responsibility and discipline",
      //     "Uranus: Identification of innovative and unconventional career paths",
      //     "Distinct color-coded blocks for rapid thematic recognition"
      //   ]
      // },
      // { 
      //   name: "horoscope_nativity_interpret_outer_v3", 
      //   label: "Nativity: AI Narratives (Transpersonal & Karmic)", 
      //   description: "Synthesis of subconscious and karmic evolution.", 
      //   group: "Horoscope Toolkit",
      //   subModule: "Nativity Birth Chart",
      //   purpose: "This layer focuses on the transpersonal planets (Neptune, Pluto) and the North Node, providing deep insights into spiritual ideals, transformative life-cycles, and the primary karmic growth path.",
      //   bullets: [
      //     "Neptune: Identification of spiritual fulfillment and idealistic career drives",
      //     "Pluto: Deep analysis of transformative relationship and partnership cycles",
      //     "North Node: Roadmap for the karmic journey of growth and long-term mastery",
      //     "Rich indigo, red, and gold themes for deep esoteric differentiation"
      //   ]
      // },
     {
  name: "horoscope_nativity_result_houses_v1",
  label: "Nativity: House Information",
  description: "A clear breakdown of all 12 houses, their signs, degrees, and planet placements.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This section shows a structured view of the 12 astrological houses, including which zodiac sign rules each house, the exact degree of each house cusp, and which planets are placed in each house. It helps astrologers and users understand how different areas of life (such as personality, money, communication, home, career, and relationships) are influenced. This data is automatically generated based on the user’s birth details entered in the nativity form — specifically date of birth, exact time of birth, and birth location. Using these inputs, the system calculates the house structure and planetary placements with precision.",
  bullets: [
    "🏠 House Structure (H1–H12) — Shows all 12 houses and the life areas they represent, such as self, finances, communication, home, creativity, work, relationships, and career.",
    "♈ Sign Mapping — Displays which zodiac sign is assigned to each house, shaping how that life area behaves.",
    "📐 Degree Values — Provides the exact degree of each house cusp, used for accurate chart calculation and deeper astrological analysis.",
    "🪐 Planet Placement — Lists which planets are located in each house, helping identify which life areas are most active or important.",
    "🧠 Easy Interpretation — Helps astrologers quickly understand focus areas like strong houses (e.g., multiple planets in one house).",
    "📊 Data Source — All values are calculated from user-provided birth data (date, time, and place) entered in the nativity birth chart form.",
    "🔍 Advanced Use — Useful for deeper analysis like house lord interpretation, life area prediction, and professional chart reading."
  ]
},
 {
  name: "horoscope_nativity_house_interpret_v2",
  label: "Nativity: House Interpretations",
  description: "Easy-to-understand interpretations of each house, showing how different life areas are shaped in the birth chart.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This module explains the meaning of each astrological house in a simple and readable way. It converts technical house data, such as house number, ruling sign, cusp degree, and planet placements, into clear life-area interpretations. Each house represents a part of life, such as self, money, communication, home, love, work, relationships, and career. The module helps astrologers and users understand how the sign on the house cusp influences that area of life, and how any planets placed in that house add extra emphasis, lessons, or strengths.",
  bullets: [
    "🏠 House-by-House Meaning — Explains what each of the 12 houses represents in life, such as identity, family, creativity, health, partnership, and career.",
    "♈ Cusp Sign Interpretation — Shows how the zodiac sign on each house cusp shapes the style and expression of that life area.",
    "🪐 Planet Influence — Adds meaning from any planets placed in the house, showing where life energy is strongest or most active.",
    "🧠 Life-Area Guidance — Helps astrologers connect technical chart structure to real-life themes, behavior patterns, and personal development.",
    "📖 Expandable Reading — Supports deeper interpretation through 'Show More' sections for users who want a fuller explanation of each house."
  ]
},{
  name: "horoscope_nativity_house_visual_v3",
  label: "Nativity: House Visual Guide (Aries in 1st House)",
  description: "A visual explanation of how a zodiac sign and house combine to shape personality and life expression.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This section gives a visual interpretation of a house cusp by combining the meaning of the zodiac sign with the meaning of the house. It helps astrologers and users quickly understand how a specific sign behaves when placed on a specific house cusp. In this example, Aries on the 1st house cusp shows a direct, bold, independent, and action-oriented personality. The left side highlights the natural traits of the sign, the right side explains the life themes of the house, and the center shows the blended qualities that emerge when both are combined.",
  bullets: [
    "♈ Sign Traits — Shows the natural qualities of the zodiac sign, such as Aries energy being bold, courageous, assertive, competitive, and action-driven.",
    "🏠 House Meaning — Explains the life area represented by the house, such as the 1st house ruling identity, self-image, appearance, beginnings, and personal presence.",
    "✨ Blended Interpretation — Highlights the combined meaning created by the sign and house together, such as self-assertion, vitality, motivation, individuality, and strong personal impact.",
    "🧠 Easy Visual Understanding — Makes the meaning of house cusps easier to understand through a simple visual layout instead of only technical chart data.",
    "📖 Learning & Reading Support — Useful for astrology explanation, client guidance, self-understanding, and quick chart interpretation."
  ]
},
    {
  name: "horoscope_nativity_house_interpret_v4",
  label: "Nativity: House Readings (Houses 2, 3, 4)",
  description: "Clear interpretations of Houses 2, 3, and 4, showing how the birth chart describes money, communication, and home life.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This section explains the meaning of the 2nd, 3rd, and 4th houses in a simple and readable format. It helps astrologers and users understand how the sign placed on each house cusp shapes that life area. House 2 describes values, money, possessions, and material security. House 3 explains communication style, learning ability, curiosity, siblings, and everyday interaction. House 4 reveals home life, family roots, emotional foundation, private comfort, and connection to heritage. Each card gives a direct interpretation of the house meaning and supports deeper reading through the expandable 'Show More' option.",
  bullets: [
    "🏦 House 2 Interpretation — Explains financial habits, personal values, material security, possessions, and the way the user builds stability over time.",
    "💬 House 3 Interpretation — Describes communication style, curiosity, learning patterns, speaking ability, networking, and connection with nearby environment or siblings.",
    "🏠 House 4 Interpretation — Shows home life, family bonds, emotional roots, inner security, private world, and relationship to heritage or upbringing.",
    "♉ Cusp Sign Influence — Helps astrologers understand how Taurus, Gemini, and Cancer shape the expression of these three life areas.",
    "📖 Expandable Reading — Each house card can be opened further through 'Show More' for a deeper personal interpretation."
  ]
},
    {
  name: "horoscope_nativity_interpret_dharma_karma_v1",
  label: "Nativity: Dharma & Karma",
  description: "A simple reading of your life purpose, spiritual growth, and important karmic lessons.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This section explains two deeper spiritual themes in the birth chart: Dharma and Karma. Dharma shows the path that brings meaning, growth, fulfillment, and alignment with your higher purpose. Karma shows the lessons, responsibilities, inner challenges, and repeated life patterns that help shape your personal evolution. The reading is created by combining important planets, houses, and aspects, then turning them into clear guidance that users can understand without needing advanced astrology knowledge.",
  bullets: [
    "✨ Dharma Reading — Explains where your chart shows fulfillment, meaning, creativity, wisdom, and spiritual direction.",
    "🪐 Karma Reading — Describes your main life lessons, responsibilities, limitations, healing themes, and areas that require maturity and growth.",
    "🔗 Aspect Interpretation — Uses important chart patterns such as trines, squares, conjunctions, and oppositions to explain how different energies support or challenge your path.",
    "🏠 House and Planet Meaning — Connects planets and house placements to real life themes like career, purpose, emotions, belief systems, and personal development.",
    "🧠 Easy-to-Understand Guidance — Translates deeper astrology into simple personal insight that users can apply in daily life.",
    "📖 Expandable Reading — Each section can be opened through 'Show More' for a deeper explanation of spiritual purpose and karmic growth."
  ]
},
    {
  name: "horoscope_nativity_result_aspects_v1",
  label: "Nativity: Aspect Dynamics",
  description: "A detailed table showing how planets interact with each other in the birth chart.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This section explains the aspect relationships between planets and important chart points. In astrology, aspects show how two planets connect, support, challenge, or influence each other. This table helps astrologers and users understand which planetary combinations are harmonious, tense, strong, or highly active in the chart. It is useful for identifying emotional patterns, mental tendencies, relationship dynamics, career pressure points, and major strengths or challenges. The table also gives the exact degree relationship between two points, so the aspect strength can be checked precisely.",
  bullets: [
    "🪐 Aspected Planet — The planet or chart point receiving the influence in that aspect connection.",
    "✨ Aspecting Planet — The planet creating or sending the influence toward the other planet or point.",
    "📏 Orb — The distance between the exact aspect and the actual aspect. A smaller orb usually means a stronger and more noticeable effect.",
    "🔗 Type — The kind of aspect formed between the two planets, such as conjunction, opposition, trine, square, or sextile.",
    "📐 Diff — The exact degree difference between the two planets, used to verify how closely the aspect matches its ideal angle.",
    "🎯 Aspected° — The exact zodiac degree of the planet or point being affected.",
    "🎯 Aspecting° — The exact zodiac degree of the planet or point creating the aspect.",
    "🧠 Purpose of the Table — Helps astrologers identify which planetary relationships create harmony, tension, support, conflict, talent, or life lessons in the chart.",
    "📊 Strength Check — The color indicators and orb values make it easier to quickly judge which aspects are stronger, tighter, or more influential.",
    "🔍 Advanced Use — Useful for personality analysis, emotional patterns, relationship interpretation, career tendencies, and professional chart verification."
  ]
},
      {
  name: "horoscope_nativity_aspect_interpret_v1",
  label: "Nativity: Aspect Interpretations",
  description: "Easy-to-understand readings of how planets interact and shape personality, emotions, communication, and life patterns.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This section explains the meaning of important planetary aspects in a simple and readable way. In astrology, an aspect is the relationship between two planets, showing how their energies work together, support each other, or create tension. These readings turn technical chart connections into practical insight about personality, emotions, thinking style, behavior, career direction, and inner challenges. For example, Sun opposite Moon explains tension between outer identity and inner emotions, Sun conjunct Mercury explains a strong mind and communication style, and Sun trine Saturn explains discipline, reliability, and long-term stability. Each card gives a short interpretation, and users can open 'Show More' for a deeper explanation.",
  bullets: [
    "🔗 Aspect Meaning — Explains how two planets interact and whether the connection creates harmony, tension, pressure, support, or talent.",
    "🌞 Sun opposite Moon — Shows the struggle between outer goals and inner emotional needs, often creating a need for balance between personal life and responsibilities.",
    "🧠 Sun conjunct Mercury — Describes a sharp mind, strong communication ability, clear self-expression, and a natural focus on ideas, learning, and speaking.",
    "🪐 Sun trine Saturn — Shows discipline, maturity, patience, responsibility, and the ability to build long-term success through steady effort.",
    "💼 Real-Life Guidance — Helps users understand how aspects influence career, emotions, decision-making, communication, and daily behavior.",
    "📖 Expandable Reading — Each aspect card includes a 'Show More' option for a deeper and more detailed interpretation."
  ]
},
      {
  name: "horoscope_nativity_aspect_deep_v2",
  label: "Nativity: Deep Aspect Analysis (Sun/Moon)",
  description: "A deeper reading of the Sun–Moon aspect, explaining the inner tension between identity and emotions.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This modal opens when the user wants a deeper interpretation of an aspect. It explains the Sun opposite Moon aspect in a clear and personal way, showing how outer identity, goals, and self-expression interact with inner emotions, security needs, and subconscious patterns. The reading helps users understand why they may feel pulled in two directions, and how this inner tension can affect relationships, home life, emotional balance, and career choices. It also includes a visual picture representation that makes the contrast and integration between the two planets easier to understand.",
  bullets: [
    "☀️ Sun Meaning — Explains the conscious self, identity, ambitions, confidence, and the part of life that wants recognition and purpose.",
    "🌙 Moon Meaning — Explains emotions, inner needs, instincts, comfort, memory, and the private emotional world.",
    "⚖️ Opposition Aspect — Shows a push-pull dynamic between two energies, creating tension that must be balanced rather than ignored.",
    "🧠 Emotional and Life Guidance — Helps users understand how this aspect can affect personal balance, family needs, emotional security, and career direction.",
    "✨ Integration Insight — Encourages users to bring outer ambitions and inner emotional needs into harmony for a more stable and fulfilling life path.",
    "🖼️ Picture Representation — Includes a visual blend of Sun traits, Moon traits, and the shared themes created by their opposition.",
    "📖 Deep Reflection Tool — Designed for users who want a more detailed, self-aware, and meaningful interpretation beyond the short summary."
  ]
},
      {
  name: "horoscope_nativity_interpret_angles_v2",
  label: "Nativity: Angles & Points",
  description: "A clear reading of the Ascendant, Midheaven, and Vertex, showing personality style, career direction, and important turning points.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This section explains the major chart angles and special points in a simple and readable way. These points are very important in astrology because they describe how a person presents themselves, where they are heading in life, and which kinds of connections or events can become significant. The Ascendant explains outer personality, natural behavior, first impression, and how the user approaches life. The Midheaven explains career path, ambition, public image, achievement style, and long-term professional direction. The Vertex highlights meaningful encounters, partnership-related turning points, and life moments that feel important or destined. The degree shown with each point adds precision and helps astrologers refine the interpretation.",
  bullets: [
    "⬆️ Ascendant — Explains self-expression, outer personality, first impression, natural attitude, and how the user begins new experiences.",
    "🏔️ Midheaven — Describes career goals, ambition, reputation, public image, achievement style, and the long-term path of success.",
    "🔮 Vertex — Shows important turning points, meaningful encounters, and opportunities that often come through relationships, cooperation, or chance meetings.",
    "📐 Degree Meaning — Includes the exact degree of each point to support more precise chart interpretation and advanced astrological reading.",
    "🧠 Real-Life Guidance — Helps users understand how personality, career direction, and major life connections appear in practical life.",
    "📊 Core Chart Angles — Useful for astrologers who want to read the most important directional points in the chart quickly and clearly."
  ]
},
      // { 
      //   name: "horoscope_nativity_ascendant_pictorial_v1", 
      //   label: "Nativity: Ascendant Deep Analysis", 
      //   description: "Point-by-point pictorial breakdown.", 
      //   group: "Horoscope Toolkit",
      //   subModule: "Nativity Birth Chart",
      //   purpose: "The 'Ascendant (Pictorial Analysis)' provides a structured deep-dive into the Luminary influences, offering a five-point synthesis of how the Sun and Moon shape the user's professional recognition and emotional security.",
      //   bullets: [
      //     "Five-point structured analysis for major celestial bodies",
      //     "Sun-segment: Recognition and leadership in the 10th House",
      //     "Moon-segment: Emotional stability and routine in the 6th House",
      //     "Technical alignment of degree metrics with psychological profiles"
      //   ]
      // },
      {
  name: "horoscope_nativity_lilith_pictorial_v3",
  label: "Nativity: Lilith Deep Analysis",
  description: "A focused reading of Lilith, showing deeper truth-seeking, inner rebellion, and nontraditional beliefs.",
  group: "Horoscope Toolkit",
  subModule: "Nativity Birth Chart",
  purpose: "This section explains the meaning of Lilith in the birth chart in a clear and readable way. Lilith represents the part of the self that resists control, questions rules, seeks authenticity, and explores deeper personal truth. In this example, Lilith in Capricorn in the 9th house points to a strong need to challenge rigid belief systems, social expectations, and traditional ideas about truth, morality, education, or spirituality. It helps astrologers and users understand where a person may feel rebellious, independent, intense, or driven to find their own path of wisdom and meaning.",
  bullets: [
    "⚫ Lilith Meaning — Explains the deeper, raw, independent, and less-controlled side of personality that resists restriction and seeks authenticity.",
    "♑ Lilith in Capricorn — Shows ambition, seriousness, discipline, and a desire to challenge authority, structure, or traditional systems in a strong and purposeful way.",
    "🏠 9th House Influence — Connects Lilith to beliefs, philosophy, higher learning, truth-seeking, spirituality, travel, and the search for personal wisdom.",
    "📐 Degree and Position — Includes sign, house, and degree details to support more accurate interpretation of Lilith’s expression in the chart.",
    "⚡ Speed and Motion — Helps astrologers review how actively this point is operating and whether its influence is expressed more directly or subtly.",
    "🧠 Personal Insight — Useful for understanding inner rebellion, belief conflicts, truth-seeking behavior, and the need to break away from limiting ideologies."
  ]
},
      { 
        name: "horoscope_solar_setup", 
        label: "Solar Return: Configuration", 
        description: "Annual birthday chart setup.", 
        group: "Horoscope Toolkit",
        subModule: "Solar Return",
        purpose: "Predictive tool used to forecast the themes of the upcoming year based on the Sun's return to its exact natal position.",
        bullets: [
          "Current location vs Birth location toggle",
          "Year selection for historical or future returns",
          "Precision-timed engine calculations",
          "Interactive theme indicators for the solar year"
        ]
      },
      { 
        name: "horoscope_solar_synthesis", 
        label: "Solar Return: Yearly Themes", 
        description: "AI-powered annual outlook.", 
        group: "Horoscope Toolkit",
        subModule: "Solar Return",
        purpose: "Visualizes the solar return chart overlaid with the natal chart to identify key growth areas for the year.",
        bullets: [
          "Synastry-style overlay with natal positions",
          "Ascendant-of-the-year interpretation",
          "House focus priority lists",
          "AI-driven 'Monthly Milestone' forecasts"
        ]
      },
      { 
        name: "horoscope_solar_processing", 
        label: "Solar Return: Processing", 
        description: "Annual engine initialization.", 
        group: "Horoscope Toolkit",
        subModule: "Solar Return",
        purpose: "Calculates the exact moment of the Sun's return to its natal degree and initializes the yearly theme engine.",
        bullets: [
          "Precision-timing of the Solar Return moment",
          "Relocation calculation for current geographic position",
          "Yearly theme and house ingression mapping",
          "AI narrative engine setup for long-term forecasting"
        ]
      },
      { 
        name: "horoscope_solar_analytics", 
        label: "Solar Return: Annual Analytics", 
        description: "Technical breakdown of the solar year.", 
        group: "Horoscope Toolkit",
        subModule: "Solar Return",
        purpose: "A deep technical view into the core metrics of the solar return year, including degree precision and house overlays.",
        bullets: [
          "Annual house placement vs Natal house mapping",
          "Critical degree highlights for the year",
          "Profected lord and yearly time-lord calculations",
          "Intensity meters for specific solar theme areas"
        ]
      },
      { 
        name: "horoscope_weekly_setup", 
        label: "Weekly Transits: Focus", 
        description: "Short-term celestial tracking.", 
        group: "Horoscope Toolkit",
        subModule: "Weekly Transits",
        purpose: "Dynamic transit engine that tracks current planetary movements against the user's natal signature.",
        bullets: [
          "7-day outlook generation",
          "Severity/Intensity ratings for transits",
          "In-grade vs Out-of-grade aspect filtering",
          "Customizable notification triggers for major shifts"
        ]
      },
      { 
        name: "horoscope_weekly_processing", 
        label: "Weekly Transits: Processing", 
        description: "Temporal engine calculation.", 
        group: "Horoscope Toolkit",
        subModule: "Weekly Transits",
        purpose: "Calculates the interaction between fast-moving personal planets and the user's natal architecture for the upcoming week.",
        bullets: [
          "Minute-precise transit-to-natal aspect mapping",
          "Ingress and retrogradation cycle detection",
          "Intensity scoring for every major celestial shift",
          "Real-time status of the temporal synthesis engine"
        ]
      },
      { 
        name: "horoscope_weekly_result_1", 
        label: "Weekly Transits: Synthesis", 
        description: "Visualizing the temporal roadmap.", 
        group: "Horoscope Toolkit",
        subModule: "Weekly Transits",
        purpose: "Visualizes the current week's planetary movements as a dynamic overlay on the birth chart.",
        bullets: [
          "Dual-wheel overlay (Natal inner / Transit outer)",
          "Highlighting of major configuration triggers (T-Squares, Trines)",
          "Interactive aspect lines for short-term influence",
          "Side-by-side provider verification for high accuracy"
        ]
      },
      { 
        name: "horoscope_weekly_result_table", 
        label: "Weekly Transits: Analytics", 
        description: "Granular aspect timing and intensity.", 
        group: "Horoscope Toolkit",
        subModule: "Weekly Transits",
        purpose: "A technical breakdown of every transit occurring this week, including exact peak times and severity ratings.",
        bullets: [
          "Sorted list of transits by chronological impact",
          "Intensity ratings (1-10) for easier prioritization",
          "Orb-based filtering for exact peak timing",
          "Direct links to AI-narrative interpretations for each transit"
        ]
      },
      { 
        name: "horoscope_monthly_setup", 
        label: "Monthly Transits: Lunar Return", 
        description: "Monthly emotional & logistical cycles.", 
        group: "Horoscope Toolkit",
        subModule: "Monthly Transits + Lunar Return",
        purpose: "Combines the Monthly Transit overview with the critical Lunar Return calculation for emotional grounding.",
        bullets: [
          "Lunar Return exact timing (Moon-to-Moon)",
          "Monthly house-ingression tracking",
          "Retrograde cycle intersections",
          "Ritual timing recommendations based on monthly transits"
        ]
      },
      { 
        name: "horoscope_monthly_result", 
        label: "Monthly Transits: Results", 
        description: "Synthesized monthly outlook.", 
        group: "Horoscope Toolkit",
        subModule: "Monthly Transits + Lunar Return",
        purpose: "Provides a monthly roadmap of celestial influences, focusing on emotional grounding and logistical milestones.",
        bullets: [
          "Lunar Return chart wheel and house focus",
          "Daily mood/energy calendars based on Moon transits",
          "Major monthly aspect highlights",
          "AI interpretation of the lunar months theme"
        ]
      },
      { 
        name: "horoscope_romantic_setup", 
        label: "Romantic: Synastry Setup", 
        description: "Dual-chart relationship mapping.", 
        group: "Horoscope Toolkit",
        subModule: "Romantic Relationships",
        purpose: "Calculates the dynamic interaction between two individuals to assess long-term compatibility and attraction.",
        bullets: [
          "Partner birth data entry with GMT preservation",
          "Synastry vs Composite calculation methods",
          "Attraction vs Stability metrics",
          "AI compatibility score generation across 5 dimensions"
        ]
      },
      { 
        name: "horoscope_romantic_result_synthesis", 
        label: "Romantic: Synastry Synthesis", 
        description: "Dual-provider compatibility mapping.", 
        group: "Horoscope Toolkit",
        subModule: "Romantic Relationships",
        purpose: "Visualizes the complex interaction between two natal charts, highlighting points of attraction, tension, and long-term viability.",
        bullets: [
          "Interactive dual-wheel synastry overlay",
          "Aspect-to-aspect comparison table for the pair",
          "Compatibility scoring across Love, Sex, and Long-term values",
          "AI narrative on the karmic purpose of the relationship"
        ]
      },
      { 
        name: "horoscope_friendship_setup", 
        label: "Friendship: Social Dynamics", 
        description: "Platonic relationship analysis.", 
        group: "Horoscope Toolkit",
        subModule: "Friendship Relationships",
        purpose: "Tailors the relationship engine to focus on social compatibility, communication, and shared interests.",
        bullets: [
          "Group dynamic modeling",
          "Mercury-alignment focus for communication",
          "Shared hobby/Jupiter-expansion indicators",
          "Conflict-resolution 'Shadow Work' insights"
        ]
      },
      { 
        name: "horoscope_friendship_result", 
        label: "Friendship: Social Synthesis", 
        description: "Platonic bond analytics.", 
        group: "Horoscope Toolkit",
        subModule: "Friendship Relationships",
        purpose: "Analyzes the intellectual and social chemistry between two individuals to foster deeper communication and shared growth.",
        bullets: [
          "Communication style (Mercury) compatibility profiling",
          "Shared social interests and Jupiter alignment mapping",
          "Boundaries and Saturn influence assessments",
          "Team dynamic AI summaries for collaborative success"
        ]
      },
      { 
        name: "horoscope_business_setup", 
        label: "Business: Professional Synergy", 
        description: "Strategic partnership analysis.", 
        group: "Horoscope Toolkit",
        subModule: "Business Relationships",
        purpose: "Analyzes two charts for professional effectiveness, financial synergy, and power dynamics.",
        bullets: [
          "Wealth-alignment indicators (2nd & 8th houses)",
          "Authority/Saturn-boundary assessments",
          "Project-completion velocity scores",
          "Optimal meeting-time recommendations for the pair"
        ]
      },
      { 
        name: "horoscope_business_result", 
        label: "Business: Professional Synergy", 
        description: "Strategic alliance analytics.", 
        group: "Horoscope Toolkit",
        subModule: "Business Relationships",
        purpose: "Evaluates the productive and financial potential of a partnership, focusing on authority and wealth-building.",
        bullets: [
          "Financial house (2nd/8th) interaction metrics",
          "Authority and discipline (Saturn) compatibility",
          "Wealth creation velocity and risk assessments",
          "Best strategic timing for contract signing or launches"
        ]
      },
      { 
        name: "horoscope_horary_setup", 
        label: "Horary: Momentary Answers", 
        description: "The astrology of questions.", 
        group: "Horoscope Toolkit",
        subModule: "Predictive Event (Horary)",
        purpose: "A specialized predictive tool that analyzes the chart of the exact moment a question is asked and understood.",
        bullets: [
          "Automatic 'Question Timestamp' capture",
          "Cusp-of-querent vs Cusp-of-quesited logic",
          "Strict horary validity checks (Too early/Too late)",
          "Clear 'Yes/No' indicators with technical rationale"
        ]
      },
      { 
        name: "horoscope_horary_result", 
        label: "Horary: Momentary Synthesis", 
        description: "Decoding the divine answer.", 
        group: "Horoscope Toolkit",
        subModule: "Predictive Event (Horary)",
        purpose: "Provides the technical and AI-derived answer to a specific question based on the astrological moment.",
        bullets: [
          "Momentum-based 'Yes/No' decision matrix",
          "Critical house-ruler aspect tracking",
          "Traditional dignity and receptivity scores",
          "Technical rationale for every predictive judgment"
        ]
      },


      // Programs
      { 
        name: "mystery_school", 
        label: "Mystery School Hub", 
        description: "Central management for esoteric training.", 
        group: "Programs",
        purpose: "The administrative dashboard for managing the mystery school's esoteric curriculum and operational logs.",
        bullets: [
          "Mystery School student enrollment management",
          "Curriculum progression and milestone tracking",
          "Teacher and mentor assignment governance",
          "Audit trail for esoteric examinations"
        ]
      },
      { 
        name: "ms_students", 
        label: "Student Roster", 
        description: "Tracking student progress and milestones.", 
        group: "Programs",
        purpose: "A granular view into the spiritual development of every Mystery School student.",
        bullets: [
          "Progression tracking against esoteric milestones",
          "Student performance analytics and grading",
          "One-on-one mentor assignment interface",
          "Academic history and lesson completion logs"
        ]
      },
      {
        name: "ms_decans",
        label: "MS Decan Studies",
        description: "Configure and manage the decan-by-decan curriculum that sits at the heart of the Mystery School program. Each of the 36 decans has its own content, unlock timing, and associated ritual or journal requirement.",
        group: "Programs",
        purpose: "The decan system is the academic backbone of the Mystery School. Students progress through all 36 decans in sequence, unlocking each one after the previous is completed. This admin panel lets the team configure what content, ritual, and journal requirement belongs to each decan, when a decan is available to unlock, and what the passing criteria are. It is the curriculum management layer that powers the entire Mystery School learning journey.",
        bullets: [
          "All 36 decans listed — each with unlock status, associated content, and ritual requirement",
          "Content assignment — attach readings, videos, and sacred texts to each decan study",
          "Unlock timing — set whether a decan unlocks on a calendar date, after previous decan completion, or manually",
          "Journal requirement — configure whether students must submit a journal entry to complete the decan",
          "Ritual requirement — attach a specific ritual that must be performed and marked complete",
          "Passing criteria — define what counts as completion for each decan study",
          "Student progress view — see which students are at which decan and who is behind"
        ]
      },
      {
        name: "ms_journals",
        label: "Student Journals",
        description: "Review and manage the private journal entries that Mystery School students submit as part of their decan studies. Each decan may require a written reflection before the student can progress.",
        group: "Programs",
        purpose: "Journaling is a core part of the Mystery School experience. After studying a decan, students are often asked to write a personal reflection — what they learned, how the energy of that decan relates to their life, or a record of a ritual they performed. Mentors and admins can read these journals to track student depth of engagement, provide feedback, and decide whether to approve progression to the next decan. This page surfaces all submitted journals with student name, decan, and submission date.",
        bullets: [
          "All journals listed — every submitted entry with student name, decan number, and date",
          "Read in full — open and read any journal entry to review the student's reflection",
          "Approve or request revision — mark a journal as approved (allows decan completion) or ask the student to revise",
          "Mentor feedback — add a private comment or response visible only to the student",
          "Filter by status — view journals that are pending review, approved, or needs revision",
          "Filter by student — see all journals for one specific student to track their journey",
          "Filter by decan — see all journals submitted for a specific decan across all students"
        ]
      },
      { 
        name: "mandalism", 
        label: "Perennial Mandalism", 
        description: "Management of community program flow.", 
        group: "Programs",
        purpose: "Governs the onboarding and progression logic for the Perennial Mandalism community framework.",
        bullets: [
          "Mandalism phase configuration (I, II, III)",
          "Plan-specific content entitlement rules",
          "Automated transition logic for cohorts",
          "Community health and participation scoring"
        ]
      },
      { 
        name: "sunday_service", 
        label: "Sunday Service", 
        description: "Scheduling and assets for moral sermons.", 
        group: "Programs",
        purpose: "The administrative hub for organizing and delivering the platform's weekly spiritual gatherings.",
        bullets: [
          "Broadcast scheduling and asset preparation",
          "Liturgical text and media management",
          "Live event notification triggers",
          "Post-service archive and wisdom indexing"
        ]
      },

      // Live & Schedule
      { 
        name: "live_sessions", 
        label: "Global Live Log", 
        description: "Oversight of all active platform streams.", 
        group: "Live",
        purpose: "Real-time monitoring of all active broadcasts and video consultations across the platform.",
        bullets: [
          "Live stream health and bitrate monitoring",
          "Active session participant tracking",
          "Stream recording status and cloud storage logs",
          "Immediate moderator intervention controls"
        ]
      },
      {
        name: "check_ins",
        label: "Practitioner Check-ins",
        description: "Real-time visibility into which diviners are currently active on the platform — online status, last login, active session count, and response time metrics. Used for quality monitoring and support escalation.",
        group: "Live",
        purpose: "Check-ins gives admins a live pulse on practitioner presence. If a client reports their diviner was late or unresponsive, this is where admins verify the diviner's activity log. It also helps identify diviners who have not logged in for an extended period, those who are online but have unfilled booking slots, and any who are in an active session right now.",
        bullets: [
          "Online status — which diviners are currently logged in and active on the platform",
          "Last seen — timestamp of each diviner's most recent platform activity",
          "Active session indicator — whether a diviner is currently in a live reading session",
          "Booking availability — whether an online diviner has open slots for new bookings",
          "Response time metric — average time to accept or respond to booking requests",
          "Inactivity alerts — flag diviners who have not checked in for 7+ days",
          "Manual check-in log — history of all check-in events with timestamps for audit purposes"
        ]
      },
      { 
        name: "my_schedule", 
        label: "Master Calendar", 
        description: "Combined view of all platform bookings.", 
        group: "My Schedule",
        purpose: "The definitive platform-wide calendar, combining student sessions, live events, and diviner availability.",
        bullets: [
          "Global cross-timezone event visualization",
          "Conflict detection and resolution tools",
          "Platform-wide 'Blackout' period management",
          "Filtered views for specific roles and programs"
        ]
      },
      {
        name: "bookings",
        label: "Session Management",
        description: "Admin-level oversight of all bookings across the entire platform — every appointment made between any client and any diviner. Search, filter, inspect, and intervene on any booking from this central view.",
        group: "My Schedule",
        purpose: "The Session Management panel gives admins full visibility over every booking on the platform — past, present, and future. This is the control center for resolving booking disputes, investigating no-shows, processing manual cancellations, and generating session-level reports. Unlike a diviner's own Schedule page which shows only their appointments, this shows everything platform-wide.",
        bullets: [
          "All bookings platform-wide — every session between every client and diviner, all in one list",
          "Search by client, diviner, date, or service — find any specific booking instantly",
          "Status breakdown — confirmed, pending, completed, cancelled, no-show, and rescheduled",
          "Session detail view — full metadata including payment amount, notes, birth data, and recording link",
          "Admin cancellation — cancel a session on behalf of either party and trigger automatic notifications",
          "Rescheduling override — move a session to a new time with admin authority",
          "Export to CSV — download booking data for reporting, accounting, or dispute resolution"
        ]
      },
      { 
        name: "availability", 
        label: "Global Availability", 
        description: "Configuring system-wide booking windows.", 
        group: "My Schedule",
        purpose: "Sets the pulse for the platform's session economy by defining when services can be booked.",
        bullets: [
          "Hierarchical availability override logic",
          "Holiday and maintenance window mapping",
          "Service-type specific booking lead times",
          "Automatic timezone normalization rules"
        ]
      },

      // Community
      {
        name: "pm_plan_tiers",
        label: "PM Plan Configuration",
        description: "Manage the subscription tiers for the Perennial Mandalism community — Individual ($19.95/mo) and Family ($34.95/mo). Set prices, update feature lists, and control what each plan includes.",
        group: "Community",
        purpose: "The PM Plan Configuration page is where admins control the two Perennial Mandalism membership plans. The Individual plan is designed for a single member; the Family plan allows up to four family members under one subscription. When prices or features change, this page is where those updates are made. Changes here immediately affect what the checkout and plan management pages show to prospective and existing members.",
        bullets: [
          "Individual Plan — name, price, description, and feature list for the single-member tier ($19.95/mo)",
          "Family Plan — same settings for the family tier ($34.95/mo) with family member seat count",
          "Edit pricing — update the monthly price for either plan (propagates to Stripe product configuration)",
          "Feature list editor — add, edit, or remove bullet points shown on the membership comparison page",
          "Plan status — activate or deactivate a plan from public view without deleting it",
          "Billing interval — monthly, quarterly, or annual billing cycle configuration per plan",
          "Stripe product link — connects each plan to the corresponding Stripe product for payment processing"
        ]
      },
      {
        name: "broadcasts",
        label: "Community Broadcasts",
        description: "Create and manage community-wide announcements and live broadcast events that appear on the PM member dashboard. Broadcasts can be live video, pre-recorded, or text announcements visible to all members.",
        group: "Community",
        purpose: "Broadcasts are admin-created events that appear for all Perennial Mandalism members on their dashboard. They come in several types: a live stream happening right now, an upcoming event with an RSVP button, an on-demand replay of a past broadcast, or a text announcement. Admins create broadcasts here, set the type and timing, and members see them surfaced on their community hub. This is the main communication channel from the school to its members.",
        bullets: [
          "Create a broadcast — choose type (live, upcoming, on-demand, announcement), add title, description, and media",
          "Broadcast types — Live Now (streaming), Upcoming (with countdown), On Demand (replay), Announcement (text)",
          "Schedule timing — set a go-live date and time for upcoming broadcasts",
          "Video embed — paste a YouTube, Vimeo, or direct stream URL for video broadcasts",
          "Visibility — broadcast to all members or target specific plan tiers",
          "RSVP tracking — for upcoming events, see how many members have registered interest",
          "Archive or remove — move old broadcasts to archive or delete them when no longer relevant"
        ]
      },
      {
        name: "calendar",
        label: "Community Events Calendar",
        description: "Create and manage events that appear on the Perennial Mandalism members' Events and Sessions pages. Admins add events here and PM members see them in their calendar, RSVP, and receive reminders.",
        group: "Community",
        purpose: "This is the admin-side tool for publishing events to the PM community calendar. When an admin creates an event here — a ceremony, workshop, Sunday service session, or community gathering — it automatically appears on the Events and Sessions pages for all PM members. Members can see the event, read the description, and RSVP. The admin controls the date, time, title, description, and who the event is visible to.",
        bullets: [
          "Create a new event — set title, description, date, start time, end time, and event type",
          "Event types — Sunday Service, Ceremony, Workshop, Webinar, Community Gathering, Private Session",
          "Member visibility — share the event with all PM members or specific plan tiers only",
          "RSVP management — see which members have confirmed attendance for an event",
          "Recurring events — set events to repeat weekly (e.g. Sunday Service happens every Sunday)",
          "Send reminders — trigger notification emails to registered members before the event",
          "Archive past events — completed events move to archive automatically after their end time"
        ]
      },
      { 
        name: "holy_books", 
        label: "Sacred Texts Hub", 
        description: "Curation of downloadable doctrine books.", 
        group: "Community",
        purpose: "The digital archive for the platform's sacred library and foundational spiritual texts.",
        bullets: [
          "Version-controlled sacred text repository",
          "PDF and E-book distribution management",
          "User-level reading progress analytics",
          "Digital Rights Management (DRM) for doctrines"
        ]
      },
      { 
        name: "doctrine_links", 
        label: "Wisdom Index", 
        description: "External resource mapping for studies.", 
        group: "Community",
        purpose: "A curated directory of external spiritual resources, scholarly links, and cross-platform wisdom references.",
        bullets: [
          "Curated external wisdom link management",
          "Broken link detection and auto-audit",
          "Resource categorization by spiritual tradition",
          "External bibliography and citation manager"
        ]
      },

      // Training
      { 
        name: "training_lessons", 
        label: "Programs & Lessons", 
        description: "Designing lessons and courses.", 
        group: "Training",
        purpose: "The architectural tool for building spiritual training journeys and certification paths.",
        bullets: [
          "Modular lesson builder with rich media support",
          "Prerequisite mapping and locking logic",
          "Interactive quiz and examination designer",
          "Course-level graduation criteria settings"
        ]
      },
      {
        name: "training_analytics",
        label: "Training Analytics",
        description: "Performance metrics for the entire training curriculum — how many trainees are enrolled, completion rates per lesson and category, quiz pass rates, average scores, and time-to-graduation trends.",
        group: "Training",
        purpose: "Training Analytics answers the question: is the curriculum actually working? Admins can see which lessons are being completed quickly (indicating engagement) and which are being skipped or abandoned (indicating a problem). Quiz pass rates reveal which topics students struggle with. Drop-off charts show where students stop engaging. These insights help the team improve the curriculum and support struggling trainees.",
        bullets: [
          "Enrollment overview — total trainees enrolled, active, graduated, and inactive",
          "Completion rate by lesson — which lessons have high completion vs high abandonment",
          "Quiz performance — average scores and pass rates per quiz and per lesson",
          "Category completion rates — how far through each curriculum category the average trainee is",
          "Time-to-graduation trend — how long it takes trainees to complete the full program",
          "Top performers — trainees with highest scores and fastest completion",
          "At-risk students — trainees who have not engaged in the past 14+ days"
        ]
      },
      {
        name: "training_settings",
        label: "Training Settings",
        description: "Global configuration for the trainee program — passing score thresholds, quiz attempt limits, certificate criteria, graduation requirements, and curriculum-wide rules.",
        group: "Training",
        purpose: "Training Settings is where the rules of the training program live. What score does a trainee need to pass a quiz? How many attempts do they get? What percentage of the curriculum must be completed before a certificate is issued? All of these policies are configured here and apply platform-wide to every trainee. Changes here immediately affect what all trainees experience in the program.",
        bullets: [
          "Passing score threshold — the minimum percentage score required to pass any quiz (e.g. 70%)",
          "Quiz attempt limit — how many times a trainee can retake a quiz before being locked out",
          "Certificate criteria — the completion percentage required to unlock the graduation certificate",
          "Lesson locking — whether lessons must be completed in sequence or can be accessed freely",
          "Session booking rules — whether trainees must complete specific lessons before booking mentor sessions",
          "Email notifications — when and what emails are sent to trainees on milestones (quiz passed, lesson completed, etc.)",
          "Graduation approval — whether graduation requires admin or mentor sign-off, or is automatic"
        ]
      },
      {
        name: "class_config",
        label: "Class Configuration",
        description: "Configure the virtual training room settings — video provider, room capacity, recording rules, and the default setup for every live training session held on the platform.",
        group: "Training",
        purpose: "When trainees attend live mentor sessions or group training classes, they enter a virtual room. This configuration controls how those rooms behave — which video technology powers them, how many people can join, whether sessions are recorded by default, and what the room layout looks like. Think of this as the AV settings for every classroom on the platform.",
        bullets: [
          "Video provider — which technology powers the virtual rooms (Chime, WebRTC, VideoSDK)",
          "Room capacity — maximum number of participants allowed in a single class session",
          "Auto-recording — whether all training sessions are recorded by default",
          "Recording retention — how long recordings are stored before automatic deletion",
          "Room naming convention — how virtual rooms are labelled (by trainee name, session ID, etc.)",
          "Waiting room — whether participants wait in a lobby until the mentor starts the session",
          "Chat and Q&A settings — whether in-session text chat and Q&A features are enabled"
        ]
      },

      // Commerce
      { 
        name: "packages", 
        label: "Packages", 
        description: "Bundling services into commerce items.", 
        group: "Commerce",
        purpose: "Allows admins to create and manage service bundles, membership tiers, and product offerings.",
        bullets: [
          "Dynamic bundle creation and pricing",
          "Tiered membership benefit configuration",
          "Inventory and availability overrides",
          "Cross-role access level mapping"
        ]
      },
      { 
        name: "payments", 
        label: "Payments", 
        description: "Audit trail of all financial gateway events.", 
        group: "Commerce",
        purpose: "A secure repository for auditing every financial interaction on the platform.",
        bullets: [
          "Real-time Stripe gateway event tracking",
          "Detailed transaction breakdown and metadata",
          "Fraud detection and risk score monitoring",
          "Exportable data for accounting reconciliation"
        ]
      },
      {
        name: "refunds",
        label: "Refund Management",
        description: "Review and process all refund requests on the platform. See every refund claim, its status, the original transaction, and the reason given — then approve or reject with a single action.",
        group: "Commerce",
        purpose: "Refunds happen when a client requests money back — for a cancelled session, a technical issue, or a dispute with a diviner. This page gives admins a complete view of every refund request across the platform. For each refund, admins can see the original order, the client's reason, the amount requested, and the current status. Approved refunds are sent back to Stripe automatically; rejected ones trigger a notification to the client.",
        bullets: [
          "All refund requests — every open, approved, and rejected refund claim on the platform",
          "Original order link — jump to the purchase that is being refunded to see full context",
          "Refund reason — the client's stated reason for requesting a refund",
          "Amount requested — whether the client wants a full or partial refund",
          "Approve refund — confirm the refund, triggering an automatic reversal through Stripe",
          "Reject refund — decline the request and send the client a notification with an explanation",
          "Refund status history — full audit trail of who approved or rejected each refund and when"
        ]
      },
      {
        name: "orders",
        label: "Orders",
        description: "The complete platform-wide purchase log. Every booking, subscription, package, and product purchase made by any user on any diviner's profile is captured here. The master financial record for the entire platform.",
        group: "Commerce",
        purpose: "The Orders page is the admin view of every financial transaction on the platform — not just your own, but everyone's. If a client books a diviner, that order is here. If someone subscribes to a membership, that order is here. Admins use this for customer support (looking up a specific transaction), financial auditing (verifying revenue), and issue resolution (finding a missing payment or duplicate charge).",
        bullets: [
          "All orders platform-wide — every purchase from every user across every diviner",
          "Filter by date, user, diviner, or product — narrow down to exactly what you are looking for",
          "Order status — paid, pending, refunded, disputed, or failed",
          "Stripe payment ID — the payment processor reference for each transaction",
          "Net amount — the amount after platform fees, useful for calculating diviner payouts",
          "Export to CSV — download the full order history for accounting or tax filing",
          "Order detail view — click any order to see the full breakdown, metadata, and associated session"
        ]
      },
      { 
        name: "reports_commerce", 
        label: "Reports", 
        description: "Financial health and revenue analytics.", 
        group: "Commerce",
        purpose: "High-level financial reporting focused on revenue growth and product performance.",
        bullets: [
          "Monthly Recurring Revenue (MRR) tracking",
          "Average Order Value (AOV) analytics",
          "Churn rate and retention visualization",
          "Tax liability and payout summaries"
        ]
      },
      { name: "activity_log", label: "Activity Log", description: "Security audit trail of all admin actions.", group: "Commerce" },

      // Email
      { 
        name: "email_sequences_v2", 
        label: "Email Sequences", 
        description: "Oversight of automated community email sequences.", 
        group: "Email",
        purpose: "The automation engine for platform engagement, overseeing the lifecycle of user communication.",
        bullets: [
          "Drip campaign logic and journey mapping",
          "Behavioral trigger configuration for sequences",
          "Sequence-level engagement and conversion analytics",
          "A/B testing for spiritual messaging types"
        ]
      },
      { 
        name: "email_history", 
        label: "Email History", 
        description: "Audit of every email sent by the system to users.", 
        group: "Email",
        purpose: "A definitive audit trail of every communication dispatched by the AstrologyPro system.",
        bullets: [
          "Individual recipient delivery status logs",
          "Searchable archive of transactional emails",
          "SMTP gateway bounce and error monitoring",
          "Legal compliance and record-keeping log"
        ]
      },
      { name: "email_preview", label: "Email Preview", description: "Visual designer and test environment for system templates.", group: "Email" },

      // Engagement & Testimonials
      { name: "giveaways", label: "Giveaway Engine", description: "Management of community prize draws.", group: "Engagement" },
      { name: "testimonials_list", label: "Testimonials List", description: "Moderation of user feedback and ratings.", group: "Manage Testimonial" },
      { name: "request_testimonial", label: "Request Testimonial", description: "Automated triggers for post-reading feedback.", group: "Manage Testimonial" },

      // Support
      { name: "sla_dashboard", label: "SLA Dashboard", description: "Monitoring system speed and ticket response times.", group: "Support" },
      { 
        name: "tarot_cards", 
        label: "Tarot Cards", 
        description: "Detailed meaning config for every card.", 
        group: "Tools",
        purpose: "The data repository for the platform's Tarot engine meanings, attributes, and esoteric symbolism.",
        bullets: [
          "Individual card meaning and keyword mapping",
          "Visual asset management for tarot decks",
          "Esoteric correspondences (Astrology, Kabbalah)",
          "Dynamic spread interpretation logic"
        ]
      },
      { name: "rituals_list", label: "Rituals", description: "Library of template spiritual practices.", group: "Tools" },

      // Reports
      { 
        name: "report_revenue", 
        label: "Revenue Analytics", 
        description: "Deep-dive financial reporting suite.", 
        group: "Reports",
        purpose: "Provides granular financial auditing for all platform-wide income streams.",
        bullets: [
          "Product-level revenue attribution logs",
          "Time-series financial trend analysis",
          "Net vs Gross revenue reconciliation",
          "Exportable records for tax and audit"
        ]
      },
      { name: "report_bookings", label: "Booking Velocity", description: "Trends in appointment scheduling.", group: "Reports" },
      { 
        name: "report_provider_costs", 
        label: "Payout Liabilities", 
        description: "Tracking what is owed to practitioners.", 
        group: "Reports",
        purpose: "Manages the platform's debt to its service providers, ensuring timely and accurate payouts.",
        bullets: [
          "Automated payout calculation logic",
          "Practitioner commission rate auditing",
          "Pending liability forecasting",
          "Batch payout processing reconciliation"
        ]
      },
      {
        name: "report_payouts",
        label: "Payout History",
        description: "A complete audit log of every bank transfer made to every diviner on the platform. See transfer dates, amounts, bank accounts, and any failed or returned transfers.",
        group: "Reports",
        purpose: "Payout History is the financial reconciliation tool for the entire platform. Every time a diviner gets paid — their earnings transferred from Stripe to their personal bank account — that transfer is recorded here. Admins use this for financial audits, resolving 'I did not receive my payout' support tickets, and confirming year-end financial totals. Each entry shows the diviner, amount, net after fees, transfer date, and Stripe transfer ID.",
        bullets: [
          "All payouts listed — every transfer to every diviner, sorted by most recent first",
          "Diviner filter — view all payouts for one specific diviner to investigate a dispute",
          "Date range filter — see all payouts processed in a given week, month, or quarter",
          "Transfer status — successful, pending, failed, or returned",
          "Gross vs net amount — what the diviner earned before and after platform fees",
          "Stripe transfer ID — the unique reference for each transfer used for bank reconciliation",
          "Export to CSV — download payout history for accounting and tax documentation"
        ]
      },
      {
        name: "report_funnel",
        label: "Conversion Funnel",
        description: "The visitor-to-member journey visualized as a funnel — how many people visit the platform, how many register, how many book a session, and how many become recurring members.",
        group: "Reports",
        purpose: "The Conversion Funnel shows where people drop off on the path from first discovering AstrologyPro to becoming a paying, active member. A healthy funnel has high conversion at every step. A big drop-off at 'visited profile but did not book' tells you the booking flow might have friction. A big drop-off at 'registered but never booked' tells you the onboarding experience needs work. This report is the foundation for any platform growth strategy.",
        bullets: [
          "Funnel stages — Visitor → Registration → First Booking → Repeat Booking → Subscription",
          "Volume at each stage — how many users are at each step in any given period",
          "Drop-off percentage — what percentage of users leave at each transition point",
          "Time-to-convert — how long it takes the average user to move from registration to first booking",
          "Traffic source funnel — whether paid vs organic vs referral traffic converts differently",
          "Role-specific funnel — see conversion paths separately for clients, diviners, and PM members",
          "Date range comparison — compare funnel performance month-over-month or period-over-period"
        ]
      },
      {
        name: "report_readings",
        label: "Reading Quality",
        description: "Quality metrics for every reading session on the platform — average star ratings per diviner, session completion rates, client satisfaction trends, and review volume over time.",
        group: "Reports",
        purpose: "Reading Quality is the customer experience report for the platform. It aggregates client reviews and session outcomes to answer: are clients getting value from their readings? Which diviners consistently receive 5-star reviews? Are there any diviners with a pattern of poor ratings that may need mentoring or intervention? This report protects platform quality and helps identify both top performers and areas of concern.",
        bullets: [
          "Average rating by diviner — each diviner's star rating average, sortable by highest and lowest",
          "Rating distribution — how many 1, 2, 3, 4, and 5-star reviews exist across all sessions",
          "Session completion rate — what percentage of sessions complete without cancellation or issue",
          "Review volume trend — how many reviews are being submitted per week or month",
          "No-show and late rate — which diviners have patterns of missed or delayed sessions",
          "Client retention by diviner — how often clients rebook with the same diviner",
          "Flagged reviews — any reviews that have been reported or contain policy violations"
        ]
      },
      {
        name: "report_affiliates",
        label: "Affiliate ROI",
        description: "Performance report for the entire social advocate program — total referrals, conversion rate, commissions paid, and which advocates are driving the most value for the platform.",
        group: "Reports",
        purpose: "The Affiliate ROI report helps admins evaluate whether the referral program is delivering value. It shows the total number of sign-ups driven by advocates, how many converted to paying members, the total commission paid out, and the net revenue generated from advocate-referred members. It also ranks individual advocates by performance so the team can identify who deserves recognition or a higher commission rate.",
        bullets: [
          "Program totals — total referrals, paid sign-ups, commissions paid, and net revenue from affiliate channel",
          "Top advocates — ranked list of advocates by referral volume and revenue generated",
          "Conversion rate — percentage of affiliate-referred visitors who became paying members",
          "Commission paid vs revenue generated — the ROI calculation showing whether the program is profitable",
          "Monthly trends — how the affiliate channel has grown or declined over time",
          "By campaign — if campaigns were running, break down performance by each campaign",
          "Individual advocate report — drill into any single advocate's full performance history"
        ]
      },
      {
        name: "report_campaigns",
        label: "Campaign ROI",
        description: "Financial performance of every marketing campaign run on the platform — how much was spent promoting the campaign, how many conversions resulted, and the net return on investment.",
        group: "Reports",
        purpose: "The Campaign ROI report measures the effectiveness of every marketing initiative. Whether the campaign was a referral incentive, a limited-time discount, or a paid promotion, this report shows how many new members it brought in and whether the cost was justified. Admins use this to decide which campaigns to run again and which to discontinue.",
        bullets: [
          "All campaigns listed — every past and current campaign with status, duration, and type",
          "Referrals generated — how many sign-ups were attributed to each campaign",
          "Conversion rate — what percentage of campaign-driven visitors became paying members",
          "Revenue attributed — total revenue from members who signed up through the campaign",
          "Commission or promotion cost — total cost of the campaign (commissions paid or discounts given)",
          "Net ROI — revenue minus cost, showing whether each campaign returned a profit",
          "Date comparison — compare a campaign's first month vs subsequent months for decay analysis"
        ]
      },

      // Config
      { 
        name: "platform_settings", 
        label: "Platform Settings", 
        description: "Platform-wide branding and behavior.", 
        group: "Config",
        purpose: "The master control room for AstrologyPro's visual identity, behavior, and system-wide configurations.",
        bullets: [
          "White-label branding and theme management",
          "System-wide feature flag configuration",
          "Timezone and localization presets",
          "Admin notification and alert settings"
        ]
      },
      { 
        name: "api_keys_config", 
        label: "API Keys", 
        description: "Credentials for Stripe, SMTP, and Astrology API.", 
        group: "Config",
        purpose: "Manages the platform's vital integrations with third-party processing and data services.",
        bullets: [
          "Secure credential storage for Stripe and PayPal",
          "SMTP and email delivery provider configuration",
          "Astrological data engine API management",
          "Cloud storage and CDN integration settings"
        ]
      },
      {
        name: "astro_system_settings",
        label: "Astrology Engine Config",
        description: "Configure the astrology calculation engine — select the house system (Placidus, Whole Sign, Equal, Koch, etc.), set the default calculation engine (Swiss Ephemeris, Astro.com API), and adjust precision settings for all chart types.",
        group: "Config",
        purpose: "The astrology engine is the mathematical core of the platform. This configuration controls how planetary positions are calculated and how charts are generated. The most important setting is the house system — different traditions use different mathematical methods for dividing the sky into 12 houses, and this choice dramatically affects chart interpretation. Admins set the platform default here, though diviners can override it for their own charts.",
        bullets: [
          "House system selection — choose the default house system: Placidus (most common Western), Whole Sign (ancient traditional), Equal, Koch, Porphyry, or Regiomontanus",
          "Calculation engine — which ephemeris data source powers the engine (Swiss Ephemeris is the gold standard)",
          "Ayanamsa setting — for Vedic (sidereal) astrology, set which ayanamsa correction to apply",
          "Aspect orbs — configure the default orb (degree tolerance) for each aspect type",
          "Point inclusion — which chart points to include by default (Lilith, Chiron, Vertex, Part of Fortune, etc.)",
          "Chart wheel direction — counterclockwise (Western) or clockwise (Vedic) orientation",
          "Precision decimals — how many decimal places to show for degrees and minutes in chart data"
        ]
      },
      {
        name: "calendar_config_detailed",
        label: "Calendar Layouts",
        description: "Configure how booking and event calendars are displayed across the platform — time slot intervals, working hours display, week start day, calendar colors, and the default view (day, week, or month).",
        group: "Config",
        purpose: "The calendar configuration controls the visual and functional behavior of every calendar on the platform — the diviner's session calendar, the client's booking calendar, and the community events calendar. These settings create a consistent, professional scheduling experience. For example, setting slot intervals to 15 minutes means booking time slots appear in 15-minute increments rather than 30 or 60.",
        bullets: [
          "Slot interval — how granular the booking time slots appear (15, 30, 45, or 60 minutes)",
          "Working hours display — the default time range shown in calendar views (e.g. 8am to 10pm)",
          "Week start day — whether the calendar week starts on Sunday or Monday",
          "Default view — whether calendars open in day, week, or month view by default",
          "Event color scheme — color coding for different event types (sessions, broadcasts, ceremonies, etc.)",
          "Timezone handling — how the platform normalizes and displays times across different user timezones",
          "Holiday calendar — mark platform-wide non-working days that block all booking slots"
        ]
      },
      {
        name: "pricing_management",
        label: "Pricing Matrix",
        description: "Configure the platform's global pricing rules — service fee percentages, payout schedules, currency settings, tax rates by region, and override pricing for specific diviners or packages.",
        group: "Config",
        purpose: "The Pricing Matrix is the financial configuration layer of the platform. It controls what percentage the platform takes from each transaction, how currency conversion works for international diviners, how tax collection is handled by region, and whether any special pricing rules apply for specific diviners or membership tiers. This is a sensitive, high-impact configuration — changes here immediately affect the financial model for everyone on the platform.",
        bullets: [
          "Platform fee percentage — the cut the platform takes from every diviner transaction (e.g. 20%)",
          "Payout schedule — how often earnings are transferred to diviners (weekly, bi-weekly, monthly)",
          "Supported currencies — which currencies are accepted for payments (USD, GBP, EUR, AUD, etc.)",
          "Tax settings — whether tax is collected on services in specific jurisdictions, and at what rate",
          "Per-diviner overrides — custom platform fees for specific diviners (e.g. top performers get a better rate)",
          "Minimum payout threshold — the minimum balance a diviner must accumulate before a transfer is triggered",
          "Refund fee policy — whether the platform fee is returned to the diviner when a refund is issued"
        ]
      },
      {
        name: "legal_config",
        label: "Legal Documents",
        description: "Manage the platform's legal framework — Terms of Service, Privacy Policy, EULA, diviner contracts, and community membership agreements. Update text, set version numbers, and trigger re-acceptance flows when terms change.",
        group: "Config",
        purpose: "All legal documents that govern the platform are managed here. When the Terms of Service is updated, admins upload the new version and can trigger a re-acceptance flow — forcing all users to review and accept the new terms before accessing the platform again. Each document has a version history so past versions can be reviewed for compliance purposes. This ensures the platform is always operating with current, agreed-upon legal terms.",
        bullets: [
          "Terms of Service — the main platform usage agreement, with version control and update history",
          "Privacy Policy — how user data is collected, used, and protected",
          "Diviner Agreement — the contract diviners must accept when joining the platform",
          "Community Agreement — the rules and terms for Perennial Mandalism members",
          "Version management — each update creates a new version with a timestamp and change notes",
          "Re-acceptance trigger — force all users (or specific role groups) to re-accept updated terms",
          "Acceptance audit — see which users have accepted which version of each document"
        ]
      },
      {
        name: "db_migrations",
        label: "Database Health",
        description: "Monitor the database schema status — which migrations have been applied, the current schema version, table sizes, any pending migrations, and system-level database health indicators.",
        group: "Config",
        purpose: "Database Health is a technical admin tool that shows the state of the platform's database schema. Migrations are incremental changes to the database structure (adding a column, creating a table, changing a data type) — each one is tracked here. This page helps the technical team verify that all schema changes have been applied correctly to the production database, identify any pending migrations, and check for performance issues like overly large tables or missing indexes.",
        bullets: [
          "Applied migrations — list of all schema changes that have been successfully applied with timestamps",
          "Pending migrations — any schema changes waiting to be applied",
          "Schema version — the current database version number",
          "Table sizes — which tables are largest, useful for storage planning and performance monitoring",
          "Last applied — timestamp and description of the most recent schema change",
          "Migration status — success, failed, or in progress for each recorded migration",
          "Manual execution — option to trigger a pending migration from this interface (restricted to super-admins)"
        ]
      },

      // Training — Certificate Config
      {
        name: "certificate_config",
        label: "Certificate Config",
        description: "Configure every detail that appears on the graduation certificates the platform issues to trainees. Set the school name, program names, designation titles, and the Head Master's name and signature that will be printed on every certificate.",
        group: "Training",
        purpose: "Controls the content and authority of every graduation certificate issued by the school.",
        bullets: [
          "School name — the official institution name printed at the top of every certificate",
          "Head Master name — the name that appears in the 'Signed by' field with authority to issue certificates",
          "Designation title — the qualification title printed below the graduate's name (e.g. 'Certified Divine Practitioner')",
          "Program list — which training programs are listed on the certificate as completed",
          "Certificate template — choose the visual layout and seal design for the issued PDF",
          "Preview certificate — generate a sample certificate showing exactly how it will look before going live",
          "Certificate code format — set the prefix and format for the unique verification codes printed on each certificate"
        ]
      },

      // People — Campaigns Detail
      {
        name: "campaigns_detail",
        label: "Campaign Detail",
        description: "Create and configure a marketing campaign for social advocates. Set the campaign name, target product, UTM tracking parameters, commission rates, and duration — then generate unique trackable links for your advocates to share.",
        group: "People",
        purpose: "Turns the platform's referral program into a targeted, trackable marketing campaign.",
        bullets: [
          "Campaign name and goal — set a descriptive name and define the primary objective (sign-ups, bookings, memberships)",
          "Target product — which service or membership this campaign promotes (PM Individual, PM Family, Mystery School, etc.)",
          "UTM parameters — configure utm_source, utm_medium, and utm_campaign values for analytics tracking in Google Analytics or similar tools",
          "Commission structure — set the commission rate for this campaign (flat fee or percentage of sale)",
          "Campaign duration — start date and end date; commissions only apply to referrals within this window",
          "Unique tracking links — the platform generates a campaign-specific URL for each advocate to share",
          "Performance preview — see real-time referral counts and commission totals as the campaign runs"
        ]
      },

      // Live — Live Sessions Monitor
      {
        name: "live_sessions_monitor",
        label: "Live Sessions Monitor",
        description: "A real-time view of every diviner currently broadcasting live on the platform. See which platform they are using, when they went live, and an estimated viewer count — all updating in real time.",
        group: "Live",
        purpose: "Gives administrators instant visibility into all active live broadcasts across the platform.",
        bullets: [
          "Active broadcasts list — every diviner currently live, sorted by start time",
          "Platform column — which broadcast technology is in use (Chime, YouTube embed, VideoSDK, etc.)",
          "Live duration — how long the current broadcast has been running",
          "Estimated viewer count — number of members watching at this moment",
          "Session type — individual reading, group broadcast, or community event",
          "Intervene — send a platform notification or flag a session for moderation if needed",
          "Auto-refresh — the list updates every 30 seconds to reflect the current state of all active sessions"
        ]
      },

      // People — Social Advocacy Overview
      {
        name: "social_advocacy",
        label: "Social Advocacy Overview",
        description: "The top-level management panel for the entire social advocate program. View the performance leaderboard, manage advocate accounts, configure global commission settings, and see the health of the referral channel at a glance.",
        group: "People",
        purpose: "The command center for the platform's social advocate and referral partner program.",
        bullets: [
          "Advocate leaderboard — ranked list of all advocates by referral count and commission earned this period",
          "Program health — total referrals, total commissions paid, and channel conversion rate for the current month",
          "Global commission rate — the platform-wide default commission percentage paid for each referral type",
          "Activate or deactivate advocates — toggle an advocate's status without deleting their account or history",
          "Invite new advocates — send an invitation to a user to join the advocate program",
          "Commission overrides — set custom rates for specific top-performing advocates outside the global default",
          "Fraud flags — any accounts flagged for suspicious referral activity (self-referral attempts, click farming, etc.)"
        ]
      },

      // Walkthrough
      {
        name: "walkthrough_detailed",
        label: "Walkthrough Hub",
        description: "The interactive guide you are reading right now. Admins can configure which screens are included in the walkthrough, update descriptions, add screenshots, and control which roles see which sections of the guide.",
        group: "Tools",
        purpose: "The Walkthrough Hub is a self-referential configuration panel — it manages the platform's own guided tour system. Every role on the platform (Diviner, PM Member, Trainee, Client, Affiliate) has a curated set of walkthrough screens explaining their portal. Admins can add new screens, update descriptions, attach screenshots, and rearrange the order. This allows the team to keep the onboarding guide up to date as the platform evolves without needing a code deploy.",
        bullets: [
          "Screen library — all documented screens for every role, searchable and filterable",
          "Add a screen — create a new walkthrough entry with name, label, description, purpose, and bullets",
          "Attach screenshots — upload or link screenshots that appear alongside a screen's description",
          "Role targeting — control which role sees which screens in their walkthrough",
          "Drag-and-drop ordering — rearrange the sequence screens appear in the walkthrough flow",
          "Publish or draft — keep an entry in draft mode while editing, publish when ready",
          "Preview mode — see exactly how a screen entry looks from the member's perspective before publishing"
        ]
      },
    ],
  },
  {
    role: "Diviner Studio",
    slug: "diviner",
    tagline: "Spiritual practice and business operations",
    roleDescription:
      "Your complete professional workspace as a diviner on this platform. Manage your clients, reading schedule, live sessions, marketing campaigns, services, and income all in one place. Everything a spiritual practitioner needs to run a professional practice.",
    icon: Star,
    gradient: "from-amber-500/20 to-yellow-600/10",
    featureAreas: ["Scheduling", "CRM", "Business Operations", "Marketing", "Content", "Engagement", "Billing"],
    capabilities: [
      "See today's bookings and client activity at a glance from your dashboard",
      "Set and manage your availability so clients can only book when you are free",
      "Build your own service menu with prices, durations, and session types",
      "Keep detailed notes and natal data for every client in one organized profile",
      "Host live video readings and broadcast sessions to your community",
      "Track every order, commission, and payout from the platform",
      "Create marketing campaigns and referral programs to grow your client base",
      "Upload and manage your professional media library for sessions and content",
    ],
    keyPages: ["Dashboard", "Schedule", "Clients", "Services", "Availability", "Live Hub", "Analytics", "Billing", "Marketing", "Media", "Orders", "Follow-Ups", "Gift Certificates", "Intake Builder", "Library", "Mundane", "Reports", "Rituals", "Subscriptions", "Testimonials", "Profile", "Campaigns"],
    groups: [
      {
        groupLabel: "My Practice",
        cards: [
          { title: "Dashboard", description: "Your daily operations at a glance", href: "/dashboard", icon: LayoutDashboard, status: "live" },
          { title: "Schedule", description: "Manage your session calendar", href: "/dashboard/schedule", icon: CalendarDays, status: "live" },
          { title: "Availability", description: "Set when clients can book you", href: "/dashboard/availability", icon: Clock, status: "live" },
          { title: "Clients (CRM)", description: "Every client's full profile and history", href: "/dashboard/clients", icon: Users, status: "live" },
          { title: "Services", description: "Build your service menu and prices", href: "/dashboard/services", icon: Layers, status: "live" },
        ],
      },
      {
        groupLabel: "Engagement",
        cards: [
          { title: "Live Hub", description: "Host live video sessions and broadcasts", href: "/dashboard/live", icon: Radio, status: "live" },
          { title: "Rituals", description: "Manage and lead spiritual ritual sessions", href: "/dashboard/rituals", icon: Sparkles, status: "live" },
          { title: "Follow-Ups", description: "Track pending client follow-up actions", href: "/dashboard/follow-ups", icon: MailCheck, status: "live" },
        ],
      },
      {
        groupLabel: "Marketing & Growth",
        cards: [
          { title: "Marketing", description: "Promote your practice and track reach", href: "/dashboard/marketing", icon: TrendingUp, status: "live" },
          { title: "Campaigns", description: "Run affiliate and referral campaigns", href: "/dashboard/campaigns", icon: Zap, status: "live" },
          { title: "Gift Certificates", description: "Issue and track gift vouchers", href: "/dashboard/gift-certificates", icon: Gift, status: "live" },
          { title: "Testimonials", description: "Manage public client reviews", href: "/dashboard/testimonials", icon: Star, status: "live" },
          { title: "Client Reviews", description: "All post-session reviews and ratings", href: "/dashboard/reviews", icon: MessageSquare, status: "live" },
          { title: "Community Presence", description: "Manage your discover page visibility", href: "/dashboard/community-presence", icon: Globe, status: "live" },
        ],
      },
      {
        groupLabel: "Finance & Reports",
        cards: [
          { title: "Orders", description: "Every booking and purchase log", href: "/dashboard/orders", icon: ShoppingBag, status: "live" },
          { title: "Billing & Payouts", description: "Track earnings and bank transfers", href: "/dashboard/billing", icon: CreditCard, status: "live" },
          { title: "Subscriptions", description: "Recurring client subscription plans", href: "/dashboard/subscriptions", icon: RefreshCcw, status: "live" },
          { title: "Analytics", description: "Revenue, bookings, and growth metrics", href: "/dashboard/analytics", icon: BarChart3, status: "live" },
          { title: "Reports", description: "Detailed financial and session reports", href: "/dashboard/reports", icon: FileText, status: "live" },
        ],
      },
      {
        groupLabel: "Content & Tools",
        cards: [
          { title: "Media Library", description: "Upload images, videos, and files", href: "/dashboard/media", icon: Image, status: "live" },
          { title: "Content Library", description: "Curated resources for clients", href: "/dashboard/library", icon: BookOpen, status: "live" },
          { title: "Intake Builder", description: "Create custom client intake forms", href: "/dashboard/intake-builder", icon: ClipboardList, status: "live" },
          { title: "Mundane Astrology", description: "World events and transit analysis tools", href: "/dashboard/mundane", icon: Globe, status: "live" },
          { title: "Profile", description: "Your public profile and credentials", href: "/dashboard/profile", icon: User, status: "live" },
        ],
      },
    ],
    screens: [
      {
        name: "overview",
        label: "Practitioner Dashboard",
        description: "Your home base every day as a diviner. See what's happening right now — today's sessions, recent client activity, pending actions, and earnings at a glance.",
        group: "My Practice",
        purpose: "This is the first screen you see when you log in. Think of it as your personal command center. It shows you everything important that needs your attention today without you having to go searching for it. New booking requests, upcoming sessions, recent messages, and your latest earnings summary are all here in one place.",
        bullets: [
          "Today's bookings — see which sessions are scheduled, confirmed, or pending for today",
          "Recent client activity — quickly see which clients have interacted with your profile or made a request",
          "Earnings snapshot — your current pending payout balance and recent transactions at a glance",
          "Quick-action buttons — jump straight to your calendar, client list, or new session setup",
          "Notifications center — alerts for new bookings, messages, and platform announcements",
          "Performance summary — a short overview of how your practice is performing this week vs last week"
        ]
      },
      {
        name: "schedule",
        label: "Session Calendar",
        description: "Your full appointment calendar showing every past, present, and upcoming session. Use this to see your week at a glance, manage bookings, and keep your schedule organized.",
        group: "My Practice",
        purpose: "The calendar is the heart of your daily schedule management. Every session that a client books with you shows up here. You can view by day, week, or month, click on any session to see details, and take action — such as confirming, rescheduling, or cancelling. It is the same view clients see when they look at your available slots.",
        bullets: [
          "Day, week, and month views — switch between views to plan your time the way you think",
          "Session details on click — tap any appointment to see the client's name, service, birth data, and session notes",
          "Color-coded status — green means confirmed, yellow means pending approval, grey means completed",
          "Upcoming sessions countdown — see how much time until your next reading",
          "Reschedule or cancel — make changes to a session directly from the calendar with client notification sent automatically",
          "Linked to availability — only time slots you have set as available will show as bookable by clients"
        ]
      },
      {
        name: "availability",
        label: "Availability Settings",
        description: "Control exactly when clients can book sessions with you. Set your weekly schedule, block out dates, and define how much advance notice you need before accepting a booking.",
        group: "My Practice",
        purpose: "This is where you tell the platform when you are open for readings. If you do not set your availability, clients cannot book you. You can create a repeating weekly schedule (for example, available Monday–Friday from 10am to 6pm) and also block out specific days for holidays or personal time. The platform uses your availability settings to show clients only the open slots when they try to book.",
        bullets: [
          "Weekly schedule builder — set recurring available hours for each day of the week",
          "Date-specific overrides — mark specific dates as unavailable (holidays, breaks, personal time)",
          "Booking buffer time — set how much gap you want between sessions so you are never back-to-back",
          "Advance booking window — define how far in advance clients can book (e.g. no same-day bookings, or up to 60 days ahead)",
          "Timezone setting — make sure your availability is shown in the correct timezone for both you and your clients",
          "Instant confirmation or manual approval — choose whether bookings are auto-confirmed or you review each one first"
        ]
      },
      {
        name: "clients",
        label: "Client CRM",
        description: "Your complete client database. Every person who has ever booked you, messaged you, or been added manually is listed here. Search, filter, and view the full history of each relationship.",
        group: "My Practice",
        purpose: "CRM stands for Client Relationship Manager — it is your digital record book for every client. Instead of keeping notes scattered in a notebook or spreadsheet, everything is centralized here. You can see each client's birth data, session history, notes you have written, past readings, and outstanding balances. It is especially useful for remembering important details before a reading so you can personalize the session.",
        bullets: [
          "Full client list with search — find any client instantly by name, email, or session history",
          "Client profile details — name, date of birth, time of birth, birth location, contact info, and photo",
          "Session history — every booking, reading, and interaction this client has had with you",
          "Private practitioner notes — write personal notes about the client that only you can see",
          "Birth chart link — jump to the client's natal chart directly from their profile",
          "Outstanding balance — see if a client has any unpaid sessions or pending payments",
          "Add clients manually — you can add clients yourself even if they have not booked through the platform"
        ]
      },
      {
        name: "client-detail",
        label: "Client Spiritual Profile",
        description: "The full spiritual and interaction history for one specific client. Everything about this person in one detailed view — their birth data, past sessions, chart, and your private notes.",
        group: "My Practice",
        purpose: "When you click on a client from your CRM, this is the profile that opens. Think of it as a complete file for that person. Before any reading, you can review what was discussed in past sessions, what their natal chart says, and any notes you wrote. This helps you provide a deeply personalized experience every time without starting from scratch.",
        bullets: [
          "Birth data summary — date, time, and place of birth used to generate accurate natal charts",
          "Natal chart viewer — see the client's birth chart directly in the profile without switching screens",
          "Session log — chronological list of every reading, call, and interaction with dates and durations",
          "Your private notes — personal observations, sensitive topics, or reading summaries only you can see",
          "Next session link — if there is an upcoming booking, jump straight to session details from here",
          "Reading history — past reading documents, recordings, and transcripts attached to this profile",
          "Communication history — messages and follow-ups exchanged with this client"
        ]
      },
      {
        name: "services",
        label: "Services Menu",
        description: "Build and manage the reading services you offer. Set the name, price, duration, and description for each service — this is what clients see and choose from when booking you.",
        group: "My Practice",
        purpose: "This is your public service menu. When a new client visits your profile and wants to book, they see a list of services you offer. For example: '60-Minute Natal Chart Reading — $150', '30-Minute Transit Check-In — $75', 'Relationship Compatibility Reading — $180'. You create and manage all of these here. You can have multiple services, set them active or inactive, and edit prices anytime.",
        bullets: [
          "Create new services — add a name, description, price, and session duration for any reading type you offer",
          "Service visibility toggle — make a service public (visible to clients) or private (hidden, for manual bookings only)",
          "Multiple service types — offer natal readings, transit consultations, relationship charts, tarot sessions, and more",
          "Pricing flexibility — set a flat rate, offer free intro sessions, or configure a sliding scale",
          "Session duration — choose from 15, 30, 45, 60, 90, or 120 minute options for each service",
          "Service description — write a detailed explanation of what the client receives so they know exactly what they are booking",
          "Edit or delete anytime — update prices or retire old services whenever your offerings change"
        ]
      },
      {
        name: "live",
        label: "Live Hub",
        description: "Your broadcast studio for hosting live video sessions, group readings, and community events. Start a live stream, interact with viewers in real-time chat, and record the session for replay.",
        group: "Engagement",
        purpose: "The Live Hub is where you host live experiences for your audience. Unlike a one-on-one booking, a live session can be watched by many people at the same time — clients, community members, or followers. It is ideal for group readings, Sunday service broadcasts, Q&A sessions, celestial event commentary, and spiritual workshops. You control when to go live, who can join, and whether the session is recorded.",
        bullets: [
          "Start a live session — one click to go live and start streaming video to your audience",
          "Real-time chat — viewers can send messages you see on screen during the broadcast",
          "Viewer count — see how many people are watching at any moment",
          "Session recording — the platform automatically records your live sessions so they can be watched later",
          "Schedule a future broadcast — announce an upcoming live event so clients can prepare and get notified",
          "Access control — choose if the session is open to all, members-only, or by invitation",
          "Archive library — past live sessions are saved and accessible for replay after the broadcast ends"
        ]
      },
      {
        name: "rituals",
        label: "Rituals",
        description: "Create and manage guided spiritual ritual sessions that clients or community members can follow. A ritual is a structured sequence of spiritual actions, intentions, and astrological timing.",
        group: "Engagement",
        purpose: "Rituals are guided spiritual experiences you design and offer on the platform. Think of them as structured ceremonies that clients can follow along with — they may include breathwork, intention setting, chanting, candle work, or astrological timing. You can create a ritual for a specific planetary event (like a new moon) or as an ongoing spiritual practice. Clients see your rituals listed and can join or follow them.",
        bullets: [
          "Create ritual templates — design a step-by-step ritual with named stages, intentions, and timing",
          "Astrological timing — link your ritual to a specific planetary transit, moon phase, or decan period",
          "Rich content editor — add text instructions, images, video links, and audio recordings to each ritual step",
          "Publish or keep private — make rituals public for all members or private for specific clients",
          "Client participation log — see who has joined and completed each ritual",
          "Connect to live sessions — link a ritual to a live broadcast so the community follows along in real time"
        ]
      },
      {
        name: "follow-ups",
        label: "Follow-Ups",
        description: "Track clients who need a follow-up after their reading. This is your reminder system to ensure no client falls through the cracks after a session.",
        group: "Engagement",
        purpose: "After a reading, it is good practice to follow up with a client — to check how they are doing, share additional insights, or remind them of action items discussed. This page shows you a list of clients who have flagged follow-ups, with notes on what was promised and the due date. It helps you maintain high-quality relationships without relying on memory.",
        bullets: [
          "Follow-up list — all clients with a pending follow-up action, sorted by due date",
          "Status tracking — mark follow-ups as pending, in progress, or completed",
          "Notes field — record what was discussed and what you need to follow up on",
          "Due date reminders — see which follow-ups are overdue at a glance",
          "Link to client profile — jump straight to the client's full profile from the follow-up entry",
          "Add new follow-up — manually flag any client for a follow-up directly from their profile or a session"
        ]
      },
      {
        name: "analytics",
        label: "Analytics Dashboard",
        description: "Your personal business performance dashboard. See how your practice is growing — bookings over time, revenue trends, best-performing services, and client acquisition data.",
        group: "Finance & Reports",
        purpose: "This page shows you the numbers behind your practice so you can make informed decisions. If you are wondering 'which service earns me the most?', 'which months are slowest?', or 'how many new clients did I get this quarter?' — all of that is answered here. You do not need to be a business analyst to use this. The charts are visual and easy to read.",
        bullets: [
          "Revenue over time — a line chart showing your monthly and weekly earnings trend",
          "Total sessions completed — how many readings you have done in a given period",
          "New vs returning clients — see how many clients are first-timers vs repeat visitors",
          "Best-performing services — which of your services generates the most bookings and revenue",
          "Booking source breakdown — where your clients are coming from (direct search, referrals, campaigns)",
          "Cancellation and no-show rate — track how often sessions are missed or cancelled",
          "Date range filter — view analytics for any custom period: this week, this month, last quarter, or custom"
        ]
      },
      {
        name: "billing",
        label: "Billing & Payouts",
        description: "See exactly how much you have earned, what has been paid out to your bank, and what is still pending. Full financial transparency for your practice income.",
        group: "Finance & Reports",
        purpose: "This is your personal income ledger on the platform. The platform collects payment from clients on your behalf and transfers your earnings to your bank account on a regular schedule. This page shows every transaction — what was earned, what the platform's fee was, what the net amount was, and when it was transferred. If you ever have a question about where your money is, this is the first place to look.",
        bullets: [
          "Pending balance — the amount currently earned but not yet transferred to your bank",
          "Payout history — a list of all past bank transfers with dates and amounts",
          "Per-session breakdown — see the gross amount, platform fee, and net amount for every booking",
          "Stripe Connect status — check if your bank account is properly connected for payouts",
          "Tax summary — a downloadable summary of annual earnings for tax purposes",
          "Platform fee rate — see the percentage the platform takes from each transaction transparently"
        ]
      },
      {
        name: "orders",
        label: "Orders",
        description: "A complete log of every booking, purchase, and transaction made through your profile. Filter by date, service type, or client to find any order instantly.",
        group: "Finance & Reports",
        purpose: "The Orders page is your master transaction history. Every time a client books a session, buys a gift certificate, or purchases a package through your profile, it creates an order record here. You can search and filter orders, check payment status, see refund requests, and export records for your own accounting.",
        bullets: [
          "All orders in one list — chronological log of every booking and purchase",
          "Payment status — see which orders are paid, pending, refunded, or disputed",
          "Service type column — quickly identify which reading type or product was purchased",
          "Client name and contact — see who made the purchase and contact them if needed",
          "Order total and net — see the gross amount, platform fee deducted, and your net earnings per order",
          "Export to CSV — download your full order history for accounting or tax use",
          "Search and filter — narrow down by date range, client name, service, or payment status"
        ]
      },
      {
        name: "subscriptions",
        label: "Subscriptions",
        description: "Manage clients who are subscribed to your recurring reading plans. See active subscribers, renewal dates, and subscription revenue.",
        group: "Finance & Reports",
        purpose: "Some clients prefer to pay a monthly or weekly fee to receive regular readings from you rather than booking one-off sessions. These are called subscriptions. This page shows all your active subscribers, when their subscription renews, and how much you earn from subscriptions each month. Subscriptions create predictable, recurring income for your practice.",
        bullets: [
          "Active subscriber list — every client currently on a recurring plan with you",
          "Subscription plan details — which plan they are on, the price, and billing frequency",
          "Next renewal date — when the client will be charged next",
          "Subscription status — active, paused, cancelled, or payment failed",
          "Monthly recurring revenue — total amount you earn from subscriptions each month",
          "Cancel or pause — manage individual subscriptions on behalf of clients when needed"
        ]
      },
      {
        name: "reports",
        label: "Reports",
        description: "Detailed downloadable reports covering sessions, revenue, clients, and performance. Use these for in-depth review or to share with an accountant.",
        group: "Finance & Reports",
        purpose: "While Analytics shows charts and trends, Reports gives you the raw data in structured, exportable formats. You can generate a report for any time period covering sessions completed, revenue earned, client acquisition, and service performance. This is especially useful at the end of a month or year when reviewing your business in detail.",
        bullets: [
          "Session report — list of all sessions in a period with client, date, service, duration, and earnings",
          "Revenue report — total income broken down by service type, payment method, and date",
          "Client report — new clients acquired, returning client frequency, and churn",
          "Payout report — all payouts received from the platform to your bank with fee breakdown",
          "Custom date range — generate any report for any period you choose",
          "Export to CSV or PDF — download reports for your own records or to share with an accountant"
        ]
      },
      {
        name: "marketing",
        label: "Marketing Hub",
        description: "Tools to promote your practice, grow your client base, and track the reach of your marketing efforts. Share your profile, manage your public presence, and see where clients discover you.",
        group: "Marketing & Growth",
        purpose: "Running a practice means finding new clients regularly. The Marketing Hub gives you the tools to promote yourself without needing to be a marketing expert. You can copy your unique profile link to share on social media, see what sources are sending you new clients, and find resources to help you explain your services to potential clients.",
        bullets: [
          "Your unique profile link — a shareable URL to your public practitioner page you can post anywhere",
          "Traffic sources — see where your visitors are coming from (Instagram, referral, direct search, etc.)",
          "Profile completion score — tips on what to add to your profile to attract more bookings",
          "Social sharing tools — pre-written posts and images to share on social media",
          "Promotional resources — templates for announcing new services, availability, or promotions",
          "SEO visibility — how visible your profile is in platform search results"
        ]
      },
      {
        name: "campaigns",
        label: "Campaigns",
        description: "Create and manage referral campaigns. Give affiliate partners a custom link to promote your services, and earn new clients through word-of-mouth referrals.",
        group: "Marketing & Growth",
        purpose: "Campaigns let you run a referral program — you give trusted people (like past clients or social advocates) a special link, and when someone books through that link, the referrer earns a commission. This is a powerful way to grow your client base without spending money on advertising. You create a campaign here, set the commission rate, and track how many bookings it brings in.",
        bullets: [
          "Create a campaign — set a name, commission percentage, and duration for a referral campaign",
          "Unique campaign links — each campaign gets a trackable URL to share with referrers",
          "Performance tracking — see how many clicks, sign-ups, and bookings each campaign generates",
          "Commission management — see how much commission has been earned and is pending payout",
          "Active campaigns list — view all currently running campaigns and their status",
          "Pause or end a campaign — stop a campaign at any time if you want to adjust the terms"
        ]
      },
      {
        name: "gift-certificates",
        label: "Gift Certificates",
        description: "Issue digital gift certificates that clients or their friends can use to purchase readings. A great way to attract new clients through gifting.",
        group: "Marketing & Growth",
        purpose: "Gift certificates allow someone to buy a reading as a gift for another person. When a client wants to give a friend or family member the experience of a reading with you, they can purchase a gift certificate from your profile. This page shows you all issued certificates, their value, and whether they have been redeemed. It is a great way to gain new clients who might not have found you otherwise.",
        bullets: [
          "All issued certificates — list of every gift certificate generated with value and status",
          "Redemption status — see which certificates have been used and which are still pending",
          "Certificate value — the monetary amount each certificate is worth",
          "Issue date and expiry — see when each certificate was issued and when it expires",
          "Manually issue a certificate — create a custom gift certificate for a specific client as a loyalty reward or promotion",
          "Revenue impact — track how much income has come through gift certificate redemptions"
        ]
      },
      {
        name: "testimonials",
        label: "Testimonials",
        description: "Manage the public reviews and feedback that clients have left on your profile. Approve, respond to, or flag reviews to keep your public reputation accurate.",
        group: "Marketing & Growth",
        purpose: "When clients leave reviews after a session, those reviews appear on your public profile as testimonials. This page is where you see and manage all reviews — which ones are published, which are pending approval, and which you want to flag or respond to. Positive testimonials are one of the most important things that help new clients trust you and decide to book.",
        bullets: [
          "All reviews in one place — see every testimonial submitted by clients, sorted by date",
          "Review status — pending approval, published, or flagged for review",
          "Star ratings breakdown — how your ratings are distributed (5-star, 4-star, etc.)",
          "Client name and session date — context for each review so you remember the session",
          "Approve or reject — choose which reviews appear publicly on your profile",
          "Respond to reviews — reply publicly to a testimonial to show engagement and gratitude",
          "Flag a review — report inappropriate or inaccurate reviews for platform moderation"
        ]
      },
      {
        name: "media",
        label: "Media Library",
        description: "Upload and organize all your professional images, videos, and documents. Your media library is the source for profile photos, service images, and session resources.",
        group: "Content & Tools",
        purpose: "Everything visual about your practice lives here. When you add a photo to your profile, upload a cover image for a service, or attach a file to a lesson — those files are stored in your Media Library. Think of it as your personal cloud storage for practice-related files. You can upload new files, organize them into folders, and access them from anywhere in your dashboard.",
        bullets: [
          "Upload files — add images, videos, PDFs, and documents from your device",
          "Organized gallery — files are organized by type and upload date for easy retrieval",
          "Profile photo — update the profile photo that appears on your public practitioner page",
          "Service cover images — assign images to individual services to make them more visually appealing",
          "File usage tracking — see which files are being used in profiles, services, or lesson materials",
          "Delete or replace files — remove outdated files or swap them for updated versions",
          "Supported formats — images (JPG, PNG, WebP), video (MP4), and documents (PDF, DOCX)"
        ]
      },
      {
        name: "library",
        label: "Content Library",
        description: "A curated collection of spiritual resources, articles, and reference materials you can share with clients or use in your practice.",
        group: "Content & Tools",
        purpose: "The Content Library is where you store and organize useful reading materials, spiritual references, and resources that support your practice. You can share specific items with clients as follow-up reading after a session, use them to supplement a lesson, or simply keep them as personal reference. It is different from the Media Library — Media is for raw files like photos and videos, while the Content Library is for organized, meaningful resources.",
        bullets: [
          "Add resources — save articles, PDFs, videos, and links to your library",
          "Organize by category — tag and group resources by topic (e.g. natal charts, tarot, transits, rituals)",
          "Share with clients — send specific library items to a client as post-session homework or follow-up reading",
          "Search and filter — quickly find any resource by name, tag, or content type",
          "Platform resources — some resources are provided by the platform and available to all practitioners",
          "Private or shared — choose whether a resource is just for your own reference or shareable with clients"
        ]
      },
      {
        name: "intake-builder",
        label: "Intake Form Builder",
        description: "Design custom questionnaires that clients fill in before their reading. Capture the information you need — birth data, focus areas, questions — before the session begins.",
        group: "Content & Tools",
        purpose: "An intake form is a questionnaire your clients complete when they book a session. Instead of spending the first 10 minutes of a reading asking for basic information, you can collect it in advance. You build the questions here — the form is then automatically sent to clients when they book a specific service. You can create different intake forms for different services.",
        bullets: [
          "Build custom forms — add your own questions with text fields, dropdowns, and multiple choice",
          "Required vs optional fields — mark which questions must be answered before booking is confirmed",
          "Birth data fields — include pre-built fields for date, time, and place of birth",
          "Open-ended questions — let clients describe their main concerns or what they hope to explore",
          "Assign to services — link specific intake forms to specific services so the right questions are asked",
          "Preview before publishing — see exactly what the client will see before making the form live",
          "View submitted responses — read completed intake forms from the client's profile before their session"
        ]
      },
      {
        name: "mundane",
        label: "Mundane Astrology Tools",
        description: "Access the platform's world astrology tools for tracking planetary transits, global events, and geopolitical astrological patterns. Use these insights to enrich your readings.",
        group: "Content & Tools",
        purpose: "Mundane astrology is the practice of applying astrological analysis to world events, nations, and collective patterns rather than individuals. This section gives you access to tools that track global planetary transits, major celestial events, and their real-world impact. Many diviners use mundane astrology to add context to client readings — for example, explaining how a global Saturn transit is affecting everyone, not just one person.",
        bullets: [
          "Live planetary positions — see where every planet is right now in real time",
          "Global transit calendar — upcoming planetary events and their dates for the current and next month",
          "Mundane entity charts — natal charts for countries, companies, and major organizations",
          "Ingress charts — charts calculated for the exact moment a planet enters a new zodiac sign",
          "World event search — browse historical world events mapped to astrological transits",
          "Forecast tools — generate mundane forecasts for specific nations or global topics",
          "Use in readings — reference mundane data directly in client sessions for collective-level context"
        ]
      },
      {
        name: "profile",
        label: "Public Profile",
        description: "Your professional public-facing page on AstrologyPro. This is what clients see when they search for a diviner. Update your photo, bio, credentials, specialties, and social links here.",
        group: "Content & Tools",
        purpose: "Your profile is your storefront on the platform. When a potential client searches for a diviner and finds you, your profile is the page they land on. It shows your photo, your bio, the services you offer, your reviews, and an option to book. The quality of your profile directly affects how many new clients discover and trust you. Keep it complete, professional, and up to date.",
        bullets: [
          "Profile photo — upload a clear, professional headshot that represents you well",
          "Display name and title — how your name appears in search results and on your profile",
          "Bio — a written description of your background, approach, and what makes your practice unique (up to 500 words)",
          "Specialties — tag the areas you specialize in (natal charts, tarot, relationship readings, mundane astrology, etc.)",
          "Social links — add your Instagram, YouTube, or website so clients can learn more about you",
          "Video intro — upload a short video introduction so clients can see and hear you before booking",
          "Public availability indicator — shows clients whether you are currently accepting bookings"
        ]
      },
      {
        name: "bookings",
        label: "My Bookings",
        description: "A full list view of every session booked through your profile — upcoming, completed, and cancelled. The master administrative record of all client appointments for your practice.",
        group: "My Practice",
        purpose: "While your Schedule shows a calendar view, Bookings gives you the complete flat list of all appointments with full metadata — client name, service, duration, payment status, and session notes. This is useful for administrative review, handling payment questions, and maintaining your practice records. You can also take actions from here such as adding post-session notes, sending a follow-up, or viewing the intake form a client submitted.",
        bullets: [
          "All bookings list — every session in one flat list, sortable by date, client, service, or status",
          "Status filter — view only upcoming, completed, cancelled, or no-show sessions separately",
          "Session detail — click any booking to see the full client profile, intake form responses, and payment details",
          "Add session notes — write private or client-visible notes immediately after completing a session",
          "Join a session — when a booked session is starting, a join video room button appears on the entry",
          "Payment status — see which sessions have been paid, which are pending, and which had a refund",
          "Mark no-show — flag a session where the client did not attend, which initiates the platform's no-show policy"
        ]
      },
      {
        name: "session-room",
        label: "Live Session Room",
        description: "The secure video room where one-on-one readings take place. A professional consultation environment with HD video, chart sharing tools, in-session notes, and recording controls.",
        group: "Engagement",
        purpose: "The Session Room is where the actual work of a diviner happens — the live reading. When you and your client both join a booked session, you enter a private, secure video room. You can see each other on camera, share your screen to display natal charts or transit data, use the in-session chat to share links, and record the session so the client has a replay. The room is distraction-free and professionally designed for spiritual consultation.",
        bullets: [
          "HD video — high-definition, low-latency two-way video between you and your client",
          "Screen share — share your screen or a specific window to show charts, transit data, or tarot spreads",
          "In-session chat — send text messages, links, or chart URLs to your client during the session",
          "Recording toggle — start or stop recording; the client is notified automatically when recording begins",
          "Session timer — an elapsed time display so both parties are aware of the session length",
          "Client sidebar — a private panel showing the client's birth data and your pre-session notes, only visible to you",
          "End session — end the call cleanly, which triggers the automated follow-up and review request for the client"
        ]
      },
      {
        name: "earnings-analytics",
        label: "Earnings & Analytics",
        description: "Your personal revenue and growth dashboard. See monthly income charts, booking trend lines, client retention rates, and a breakdown of which services earn you the most. The numbers that tell the story of your practice.",
        group: "Finance & Reports",
        purpose: "Gives diviners data-driven insight into the financial health and growth trajectory of their practice.",
        bullets: [
          "Monthly revenue chart — a bar or line chart showing your earnings each month for the past 12 months",
          "Booking trend — how your session volume is changing week over week and month over month",
          "Client retention rate — what percentage of clients have booked with you more than once",
          "Top services by revenue — which of your offered services generates the most income, ranked",
          "Average session value — your typical earnings per booking, useful for pricing strategy decisions",
          "New clients this month — how many first-time clients booked you in the current period",
          "Date range filter — zoom in on any custom period to compare performance or investigate a slow month"
        ]
      },
      {
        name: "client-reviews",
        label: "Client Reviews",
        description: "See every post-session review your clients have left for you. View your overall rating, read individual reviews, spot trends in feedback, and respond publicly to show clients you are listening.",
        group: "Marketing & Growth",
        purpose: "Your reputation management center — where client feedback becomes visible, actionable, and answerable.",
        bullets: [
          "Overall star rating — your current average across all published reviews, shown prominently",
          "All reviews list — every submitted review in chronological order with star rating, client name, and session date",
          "Review text — the full written comment the client submitted, unedited",
          "Respond to a review — write a public reply that appears below the review on your profile page",
          "Pending reviews — reviews awaiting platform moderation before going live",
          "Rating distribution chart — a visual breakdown of how many 5-star, 4-star, 3-star reviews you have received",
          "Flag a review — report a review that is inaccurate, abusive, or violates platform policy"
        ]
      },
      {
        name: "community-presence",
        label: "Community Presence",
        description: "Manage how you appear to the broader AstrologyPro community and the public discover page. Update your bio, set your visible specialties, and configure the pricing teaser that potential clients see before booking.",
        group: "Marketing & Growth",
        purpose: "Controls your discoverability and first impression on AstrologyPro's public-facing practitioner directory.",
        bullets: [
          "Discovery page visibility — toggle whether your profile appears in the public diviner search results",
          "Bio editor — update the written introduction clients read when they land on your public profile",
          "Specialty tags — choose up to 5 specialties that appear on your profile card in search results (e.g. Natal Chart, Tarot, Relationship, Mundane)",
          "Pricing teaser — set a 'starting from $X' price shown on your search card to help clients gauge fit before clicking",
          "Profile completeness score — a checklist showing which profile fields are missing and how filling them improves your search ranking",
          "Featured status — if eligible, request to be featured in the platform's highlighted practitioners section",
          "Social links — add or update your Instagram, YouTube, and personal website links shown on your public profile"
        ]
      },
    ],
  },
  {
    role: "Perennial Mandalism",
    slug: "community",
    tagline: "Astrology tools and sacred community access",
    roleDescription:
      "Your membership portal for the School of Our Divine Infinite Being community. As a Perennial Mandalism member, you get access to personal astrology tools, live Sunday services, a family membership system, the full spiritual library, community events, training content, and sacred rituals — all in one private member area.",
    icon: Heart,
    gradient: "from-pink-500/20 to-rose-600/10",
    featureAreas: ["Astrology Tools", "Community Hub", "Spiritual Content", "Family", "Events", "Training", "Sessions"],
    capabilities: [
      "Generate your personal natal birth chart and receive a detailed astrology reading",
      "Track current and upcoming planetary transits and how they affect your life",
      "Watch and participate in live Sunday Service broadcasts each week",
      "Access the full spiritual wisdom library — articles, videos, and reference materials",
      "Manage your family members' profiles and birth charts under your membership",
      "Browse and register for community events, workshops, and ceremonies",
      "Follow guided spiritual rituals tied to planetary cycles and sacred practices",
      "Book private sessions with your assigned practitioner or mentor",
      "Explore tarot card meanings and personalized readings",
      "Study the 36 decans — the foundational esoteric system taught in this school",
    ],
    keyPages: ["Community Hub", "Natal Chart", "Transits", "Sunday Service", "Family", "Charts", "Tarot", "Training", "Decans", "Events", "Library", "Rituals", "Sessions", "Profile", "Plan"],
    groups: [
      {
        groupLabel: "Astrology Tools",
        cards: [
          { title: "Natal Chart", description: "Your personal birth chart and reading", href: "/community/horoscope", icon: Star, status: "live" },
          { title: "Transits", description: "Current planetary movements and their effects", href: "/community/transits", icon: Orbit, status: "live" },
          { title: "Charts", description: "Advanced chart tools and comparisons", href: "/community/charts", icon: Activity, status: "live" },
          { title: "Decans", description: "Explore the 36 decans of the zodiac", href: "/community/decans", icon: Eye, status: "live" },
        ],
      },
      {
        groupLabel: "Community & Worship",
        cards: [
          { title: "Community Hub", description: "Announcements and your personal dashboard", href: "/community", icon: Home, status: "live" },
          { title: "Sunday Service", description: "Live and archived weekly broadcasts", href: "/community/sunday-service", icon: Radio, status: "live" },
          { title: "Events", description: "Workshops, ceremonies, and community gatherings", href: "/community/events", icon: CalendarDays, status: "live" },
          { title: "Rituals", description: "Guided sacred practices for each season", href: "/community/rituals", icon: Sparkles, status: "live" },
          { title: "Practice Tracker", description: "Log daily rituals and view streaks", href: "/community/practice-tracker", icon: Activity, status: "live" },
          { title: "Community Chat", description: "Member discussion board and weekly threads", href: "/community/chat", icon: MessageSquare, status: "live" },
        ],
      },
      {
        groupLabel: "Learning & Wisdom",
        cards: [
          { title: "Library", description: "Spiritual articles, videos, and reference materials", href: "/community/library", icon: BookOpen, status: "live" },
          { title: "Training", description: "Structured courses and lesson curriculum", href: "/community/training", icon: GraduationCap, status: "live" },
          { title: "Tarot", description: "Tarot card meanings and readings", href: "/community/tarot", icon: Layers, status: "live" },
          { title: "Doctrine Library", description: "Holy books, doctrine docs, and study guides", href: "/community/doctrine", icon: ScrollText, status: "live" },
        ],
      },
      {
        groupLabel: "My Membership",
        cards: [
          { title: "Sessions", description: "Book and manage your practitioner sessions", href: "/community/sessions", icon: CalendarDays, status: "live" },
          { title: "Family", description: "Manage family member profiles and charts", href: "/community/family", icon: Users, status: "live" },
          { title: "Profile", description: "Your member profile and personal settings", href: "/community/profile", icon: User, status: "live" },
          { title: "Membership Plan", description: "View and manage your subscription plan", href: "/community/plan", icon: CreditCard, status: "live" },
        ],
      },
    ],
    screens: [
      {
        name: "hub",
        label: "Community Hub",
        description: "Your personal dashboard when you log in as a Perennial Mandalism member. This is your starting point — see announcements, today's planetary energy, upcoming events, and shortcuts to your most-used tools.",
        group: "Community & Worship",
        purpose: "The Community Hub is your home base in the Perennial Mandalism portal. Every time you log in, this is where you land. It shows you the current planetary moment (which planet is active today, what sign the Moon is in), any important announcements from the school or your practitioner, upcoming events and services, and quick links to jump into your natal chart, the library, or Sunday service. Think of it as a spiritual dashboard that keeps you connected to the community and to the current cosmic weather.",
        bullets: [
          "Current planetary pulse — see which planets are active today and what energy they bring",
          "Moon phase tracker — the current Moon phase and what it means for your spiritual practice",
          "Platform announcements — important messages from the school, your practitioner, or administrators",
          "Upcoming events — a preview of the next Sunday service, workshops, and ceremonies this week",
          "Quick navigation — one-click access to your chart, library, rituals, and sessions",
          "Community activity — highlights from recent community activity and new content added to the library"
        ]
      },
      {
        name: "horoscope",
        label: "Natal Chart Studio",
        description: "Generate and view your personal birth chart — a map of the sky at the exact moment you were born. Receive a detailed interpretation of every planet, house, and aspect in your chart.",
        group: "Astrology Tools",
        purpose: "Your natal chart (also called a birth chart) is a snapshot of where every planet was the moment you were born. It is the foundation of astrology — every planet in a specific zodiac sign and house tells a story about your personality, emotions, relationships, career, and spiritual path. This tool generates your chart and provides a detailed written interpretation of each placement, written in plain language so you can understand it even if you are new to astrology.",
        bullets: [
          "Enter birth details — date, time, and place of birth are needed to generate an accurate chart",
          "Interactive chart wheel — a beautiful circular chart showing all planets, signs, and houses",
          "Planet-by-planet interpretation — what each planet means in your specific sign and house",
          "House interpretations — what each of the 12 houses represents and which planets are active there",
          "Aspect analysis — the angles between planets and what they reveal about your inner dynamics",
          "Decan layer — an added depth of interpretation based on which 10-degree section of a sign your planet falls in",
          "Save your chart — your birth data and chart are saved so you never have to re-enter them",
          "Share or print — download or share your chart with your practitioner or family members"
        ]
      },
      {
        name: "transits",
        label: "Planetary Transits",
        description: "See what the planets are doing right now and how their current movement interacts with your personal birth chart. Understand the astrological weather affecting your life today.",
        group: "Astrology Tools",
        purpose: "Transits are the current positions of the planets in the sky today. While your natal chart is fixed at your birth moment, the planets keep moving — and as they move, they form new angles to the planets in your birth chart. When a planet like Saturn crosses your natal Moon, it brings a period of emotional discipline. When Jupiter touches your natal Sun, it brings expansion and opportunity. This page shows you exactly what transits are active right now and what they mean for you personally.",
        bullets: [
          "Today's transits — which planets are making significant angles to your natal chart right now",
          "Monthly transit calendar — a forward-looking view of major transits coming in the next 30 days",
          "Transit interpretation — plain-language explanation of what each transit means for your life",
          "Retrograde tracker — which planets are currently retrograde and how that affects their energy",
          "Major vs minor transits — see which influences are powerful and long-lasting vs brief and mild",
          "Moon phase calendar — daily moon sign and phase for the month",
          "Personalized forecast — a narrative summary of your most significant transits this month"
        ]
      },
      {
        name: "sunday-service",
        label: "Sunday Service",
        description: "Join the weekly live spiritual broadcast hosted by the school. Watch live or catch up on past services. Includes live chat, liturgy text, and post-service archive.",
        group: "Community & Worship",
        purpose: "Sunday Service is the heart of the Perennial Mandalism community experience. Every week, the school holds a live broadcast that combines spiritual teaching, planetary commentary, community prayer, and sacred wisdom sharing. It is a gathering — just done digitally. If you miss it live, every service is recorded and available to watch afterward. The platform includes a live chat so you can interact with other members during the broadcast.",
        bullets: [
          "Live broadcast player — watch the Sunday Service stream in high definition from your browser",
          "Live community chat — send messages and interact with other members during the service in real time",
          "Liturgy display — the words, prayers, or teachings for this week shown alongside the video",
          "Archive of past services — browse and watch any previous Sunday Service at your own pace",
          "Next service countdown — a timer showing when the next service begins",
          "Notification option — opt in to be reminded when the service is about to start",
          "Transcript access — read the text of a service without watching the full video"
        ]
      },
      {
        name: "events",
        label: "Community Events",
        description: "Browse and register for upcoming community events — workshops, ceremonies, new moon rituals, webinars, and special gatherings hosted by the school.",
        group: "Community & Worship",
        purpose: "Events are the community calendar for the Perennial Mandalism school. Beyond Sunday services, the school hosts workshops, ceremonial gatherings, Q&A sessions, seasonal rituals, and special events aligned with planetary cycles. This page shows you everything upcoming so you can plan to attend. Some events are live streamed, others are in-person, and many are recorded for later viewing.",
        bullets: [
          "Upcoming events list — all scheduled events with date, time, type, and host",
          "Event categories — workshops, ceremonies, webinars, rituals, and community gatherings",
          "Register for an event — confirm your attendance so the organizers know you are coming",
          "Event details — description, what to prepare, whether recording will be available",
          "Past events archive — recordings and materials from events you may have missed",
          "Calendar view — see events laid out on a monthly calendar at a glance",
          "Reminders — receive a notification before an event you have registered for"
        ]
      },
      {
        name: "rituals",
        label: "Sacred Rituals",
        description: "Follow guided spiritual rituals designed for the Perennial Mandalism path. Each ritual is tied to a planetary cycle, seasonal change, or sacred practice and walks you through step by step.",
        group: "Community & Worship",
        purpose: "Rituals in this context are guided spiritual practices — structured sequences of intention-setting, prayer, meditation, candle work, or elemental ceremony. Each ritual is connected to an astrological moment (like a new moon, an eclipse, or a planet entering a new sign) and is designed to help you align with the cosmic energy of that moment. You follow the steps at your own pace, and the platform tracks your completion.",
        bullets: [
          "Ritual library — browse all available rituals organized by planetary cycle and season",
          "Step-by-step guide — each ritual is broken into clear, easy-to-follow stages",
          "What you need — a list of materials or preparation steps before you begin (candles, water, journal, etc.)",
          "Intention setting — guided prompts to help you set a clear personal intention for the ritual",
          "Astrological timing — each ritual shows the optimal planetary timing for performing it",
          "Completion tracking — mark rituals as completed and build a personal practice log",
          "New rituals added — fresh rituals are added with each major planetary event or seasonal change"
        ]
      },
      {
        name: "library",
        label: "Spiritual Library",
        description: "Your private member library of spiritual articles, videos, audio teachings, and reference documents. Organized by topic and searchable — a growing resource for your practice.",
        group: "Learning & Wisdom",
        purpose: "The Spiritual Library is the knowledge base of the Perennial Mandalism school. Think of it as a private Netflix of spiritual content — but instead of movies, it is filled with astrology teachings, esoteric wisdom articles, decan studies, planetary meditations, and sacred texts. New content is added regularly. You can search by topic, filter by type (article, video, audio), and bookmark items for later.",
        bullets: [
          "Browse all content — articles, videos, audio recordings, and PDF documents in one library",
          "Search by topic — find content on specific planets, signs, decans, tarot, or sacred practices",
          "Filter by type — view only articles, only videos, only audio, or only PDFs",
          "Bookmark for later — save any resource to a personal reading list you can return to",
          "New content alerts — the library shows recently added items at the top",
          "Categorized by subject — content is organized by topic (planetary wisdom, decan studies, tarot, rituals, etc.)",
          "Exclusive member content — certain library items are only available to Perennial Mandalism members"
        ]
      },
      {
        name: "training",
        label: "Training Courses",
        description: "Structured educational courses and lessons from the school curriculum. Progress through organized programs at your own pace with quizzes and completion tracking.",
        group: "Learning & Wisdom",
        purpose: "The Training section contains the formal educational curriculum of the Perennial Mandalism community. Unlike the open Library, Training is organized into programs and lessons with a specific learning sequence. You progress through lessons in order, complete reading assignments, take quizzes, and track your progress toward finishing each program. It is structured learning rather than free browsing.",
        bullets: [
          "Program list — all available training programs organized by topic and level",
          "Lesson sequence — lessons are arranged in order so you learn concepts in the right progression",
          "Progress tracking — see which lessons you have started, completed, or still need to do",
          "Lesson content — each lesson contains text, videos, images, and sometimes downloadable resources",
          "Quizzes — some lessons include a short quiz to test understanding before moving on",
          "Completion certificates — some programs award a certificate of completion",
          "Resume where you left off — the system remembers your last position so you can pick up at any time"
        ]
      },
      {
        name: "tarot",
        label: "Tarot Explorer",
        description: "Explore the 78 tarot cards — their meanings, symbolism, and connection to astrology and the decans. A reference tool and personal reading space for tarot study.",
        group: "Learning & Wisdom",
        purpose: "Tarot is deeply connected to astrology in the tradition taught by this school. Each tarot card is linked to a zodiac sign, planet, or decan. This section gives you a digital tarot reference library where you can explore every card — its image, meaning, symbolism, astrological correspondence, and esoteric interpretation. It can be used for personal daily readings, for study, or to deepen your understanding of the relationship between tarot and astrology.",
        bullets: [
          "All 78 cards — the complete tarot deck with card images and full descriptions",
          "Major and Minor Arcana — both sections of the tarot are covered in detail",
          "Astrological correspondence — which zodiac sign, planet, or decan each card is linked to",
          "Upright and reversed meanings — what a card means in both orientations",
          "Symbolic breakdown — visual elements of each card and what they represent",
          "Daily draw — pull a single card as a daily reflection or intention focus",
          "Search by card name — find any card instantly by typing its name"
        ]
      },
      {
        name: "decans",
        label: "Decans Explorer",
        description: "Study the 36 decans — the foundational esoteric system at the heart of this school's teachings. Each decan is a 10-degree segment of the zodiac with its own ruling spirit, mythology, and spiritual significance.",
        group: "Astrology Tools",
        purpose: "The decans are one of the most important and unique aspects of the teachings at the School of Our Divine Infinite Being. The zodiac is divided into 36 sections of 10 degrees each — these are the decans. Each decan has its own character, its own ruling planetary influence, its own tarot card, and its own mythological story. Understanding the decans adds a much deeper layer to chart reading and spiritual practice than the standard 12 signs alone. This explorer lets you browse all 36 decans and learn their meaning.",
        bullets: [
          "All 36 decans — browse every 10-degree section of the zodiac in one visual grid",
          "Ruling planet — which planet governs each decan and what that means",
          "Tarot connection — the Minor Arcana card associated with each decan",
          "Mythological meaning — the spiritual story and archetypal energy of each decan",
          "Your personal decans — see which decans your planets fall in, based on your natal chart",
          "Decan of the day — which decan the Sun or Moon currently occupies",
          "Deep dive view — click any decan for a full breakdown of its history, symbolism, and spiritual teaching"
        ]
      },
      {
        name: "charts",
        label: "Chart Tools",
        description: "Advanced astrology chart tools beyond your personal natal chart. Generate comparison charts, composite charts, and explore different astrological techniques.",
        group: "Astrology Tools",
        purpose: "While the Natal Chart page focuses on your personal birth chart, the Charts section gives you additional chart types for more advanced astrological exploration. You can compare your chart with a partner's chart to understand your relationship dynamics (synastry), create a combined chart for a couple (composite), or explore other chart techniques used in advanced practice.",
        bullets: [
          "Synastry chart — compare your natal chart with another person's to understand relationship compatibility",
          "Composite chart — a combined chart created from two people's birth data, representing the relationship itself",
          "Solar return chart — a chart calculated for your birthday each year showing themes for the coming year",
          "Progressed chart — how your natal chart evolves symbolically over time",
          "Additional person — add a partner, family member, or child's birth data to generate charts for them",
          "Side-by-side view — see two charts on screen together for comparison and analysis"
        ]
      },
      {
        name: "sessions",
        label: "Private Sessions",
        description: "Book one-on-one sessions with your assigned practitioner or mentor. View upcoming sessions, past session history, and access session recordings.",
        group: "My Membership",
        purpose: "As a Perennial Mandalism member, you have the option to book private one-on-one sessions with a practitioner on the platform. These are personal reading or mentoring sessions — separate from the group Sunday service. This page shows all your upcoming sessions, your past session history, and links to any session recordings. You can request a new session from here as well.",
        bullets: [
          "Upcoming sessions — date, time, and practitioner name for your next booked session",
          "Session countdown — how many days and hours until your next session",
          "Join session link — when it is time, click to enter the video room directly",
          "Past sessions archive — history of every session with date, duration, and practitioner",
          "Session recordings — if your practitioner recorded the session, access the replay here",
          "Book a new session — request or schedule a session with your assigned practitioner",
          "Session notes — any notes your practitioner shared after the session"
        ]
      },
      {
        name: "family",
        label: "Family Members",
        description: "Manage the profiles of family members included in your membership. Add their birth data, view their natal charts, and track their connection to the community.",
        group: "My Membership",
        purpose: "If you are on a Family or Couple membership plan, you can add your partner, children, or other family members to your account. Each family member gets their own profile with birth data and natal chart. This is useful for families studying astrology together, for parents who want to understand their child's chart, or for couples exploring their compatibility through astrology.",
        bullets: [
          "Family member list — all profiles added under your membership",
          "Add a member — enter a family member's name, birth date, birth time, and birth location",
          "Individual natal chart — view the birth chart for each family member separately",
          "Edit or remove — update a family member's profile or remove them from your account",
          "Compatibility overview — a quick summary of how family member charts relate to yours",
          "Plan limits — the number of family members you can add depends on your membership plan (Individual vs Family)"
        ]
      },
      {
        name: "profile",
        label: "Member Profile",
        description: "Your personal member profile. Update your name, photo, contact details, birth data, and notification preferences.",
        group: "My Membership",
        purpose: "Your Member Profile stores all your personal information on the platform. Your birth data is especially important here because it is what the platform uses to generate your natal chart, transit reports, and personalized astrological content. Keep your profile up to date so all the tools on the platform are as accurate as possible.",
        bullets: [
          "Personal details — your name, email address, profile photo, and contact information",
          "Birth data — date of birth, exact time of birth, and place of birth for accurate chart generation",
          "Password and security — change your password or update your login settings",
          "Notification preferences — choose how you want to be notified about events, services, and announcements",
          "Time zone setting — ensure all event times and transit times are displayed in your local timezone",
          "Privacy settings — control what information is visible to other community members"
        ]
      },
      {
        name: "plan",
        label: "Membership Plan",
        description: "View your current Perennial Mandalism membership plan, billing details, and options to upgrade or change your plan.",
        group: "My Membership",
        purpose: "This page shows you everything about your current membership — which plan you are on, how much it costs, when it renews, and what is included. If you are on an Individual plan and want to add family members, you can upgrade to a Family plan here. You can also view your billing history and update your payment method.",
        bullets: [
          "Current plan — which membership tier you are on (Individual at $19.95/mo or Family at $34.95/mo)",
          "Plan features — a reminder of what is included in your current plan",
          "Next billing date — when your subscription renews and the amount that will be charged",
          "Payment method — the card or payment method on file (last 4 digits)",
          "Upgrade plan — switch from Individual to Family plan to add more members",
          "Billing history — a record of past charges and receipts",
          "Cancel membership — option to cancel your subscription (access continues until the end of the billing period)"
        ]
      },
      {
        name: "family-circle",
        label: "Family Circle",
        description: "Add and manage family member accounts under your family membership plan. Each family member gets their own profile, birth data, and natal chart — all managed from one place under your subscription.",
        group: "My Membership",
        purpose: "Extends your membership benefits to the people closest to you under a single shared Family plan.",
        bullets: [
          "Family member list — all profiles currently added under your Family plan",
          "Add a member — enter a family member's name, birth date, time, and location to create their profile",
          "Individual natal charts — each family member has their own birth chart generated from their birth data",
          "Member account access — optionally invite a family member to log in with their own credentials to access their own profile",
          "Compatibility overview — see a quick synastry summary of how each family member's chart relates to yours",
          "Plan seat limit — the Family plan supports up to 4 members; the page shows how many seats remain",
          "Remove a member — remove a family member profile if they no longer need access under your plan"
        ]
      },
      {
        name: "doctrine-library",
        label: "Doctrine & Study Library",
        description: "Access the school's official holy books, doctrine documents, and curated study guides. This is the doctrinal foundation of the Perennial Mandalism tradition — sacred texts selected and uploaded by the administration for all members to read and study.",
        group: "Learning & Wisdom",
        purpose: "The doctrinal reference library for the Perennial Mandalism tradition — foundational texts every member studies.",
        bullets: [
          "Holy books — digitally accessible sacred texts central to the Perennial Mandalism tradition",
          "Doctrine documents — official written doctrines, teachings, and position papers from the school",
          "Study guides — structured reading guides that walk you through key doctrinal concepts with commentary",
          "Download for offline reading — save any document as a PDF for reading away from the platform",
          "Search by keyword — find specific passages, topics, or references across all library documents",
          "New additions — recently uploaded texts and documents appear highlighted at the top of the library",
          "Member-only content — all content here is exclusive to Perennial Mandalism members; not publicly visible"
        ]
      },
      {
        name: "rituals-tracker",
        label: "Rituals & Practice Tracker",
        description: "Log your daily spiritual practices and sacred rituals. Track which rituals you have completed, view your practice streaks, and build a permanent record of your spiritual devotion over time.",
        group: "Community & Worship",
        purpose: "Turns your private daily spiritual practice into a visible, trackable journey of growth and consistency.",
        bullets: [
          "Daily practice log — record which rituals, meditations, or practices you completed today",
          "Ritual completion streaks — see how many consecutive days you have maintained a daily practice",
          "Practice history — a calendar view showing which days had logged practices and which did not",
          "Available rituals — browse all rituals available to log, organized by planetary cycle and season",
          "Custom practices — add your own personal practices to track beyond the provided ritual library",
          "Streak milestones — the platform acknowledges significant streaks (7 days, 30 days, 100 days) with recognition",
          "Practitioner view — your assigned practitioner can see your practice log summary to inform their guidance"
        ]
      },
      {
        name: "community-chat",
        label: "Community Discussion",
        description: "Connect with other Perennial Mandalism members in the school's private message board. Post questions, share reflections, join weekly discussion threads, and engage with your spiritual community between Sunday services.",
        group: "Community & Worship",
        purpose: "A members-only discussion space that keeps the community spiritually connected between live events.",
        bullets: [
          "Discussion threads — organized conversations by topic: planetary wisdom, rituals, personal reflection, doctrine, and Q&A",
          "Post and reply — write a new post or respond to another member's question or reflection",
          "Weekly discussion thread — the school posts a weekly guided discussion question or theme each Monday",
          "Direct messages — send a private message to any fellow PM member directly",
          "Pin announcements — administrators and school leaders can pin important messages to the top of the board",
          "Search threads — find past discussions before asking a question that may have already been answered",
          "Moderation — the community is privately moderated to ensure respectful, spiritually focused discussion"
        ]
      },
    ],
  },
  {
    role: "Mystery School",
    slug: "mystery-school",
    tagline: "Enrollment, foundation training, decan mastery, and graduation",
    roleDescription:
      "The Mystery School is the deepest level of study at AstrologyPro — a structured initiatory programme lasting five quarters (15 months). Students begin by choosing one of four seasonal entry points aligned to astronomical equinox/solstice dates: Spring (~March 20), Summer (~June 21), Autumn (~September 22), or Winter (~December 21). The first quarter (Q1) is the 12-week Foundation Training — a sequential curriculum with weekly audio introductions from Beto, reading material, and task checklists. After completing Foundation Q1, the student enters the year-long decan cycle: 36 decans, one for each 10-degree segment of the zodiac wheel (3 per sign × 12 signs = 36). Each decan has a time-based window tied to its astronomical dates — it opens, stays active for approximately 10 days, then closes. During the active window, the student must complete three requirements: (1) perform a step-by-step guided ritual with invocations, gates, and affirmations; (2) submit a scrying journal recording a tarot card draw and spiritual experience; (3) submit a mundane impact journal reflecting on how the decan's energy appeared in relationships, work, and perception. If the student does not finish within the active window, a 2-day grace period begins. If they still do not finish, the decan is marked as 'missed' — the student must wait for a retry window the following year (or 5 years later for Q4 decans). Graduation requires all 12 foundation weeks complete, all 36 decans completed, and zero unresolved missed decans. Upon graduation, the student receives the title of Priest or Priestess of the Mystery School and gains access to the post-graduation Ritual Builder for designing custom rituals. The Mystery School operates on a separate subscription from Perennial Mandalism (PM) — a user can hold both simultaneously. PM members receive a discounted monthly rate if the admin toggle is enabled. Pricing is dynamic and admin-managed via the pricing_plans table.",
    icon: Eye,
    gradient: "from-violet-500/20 to-purple-600/10",
    featureAreas: ["Enrollment", "Foundation Training", "Decans", "Rituals", "Journals", "Training Lessons", "Graduation", "Ritual Builder", "Subscription", "Portal Switching"],
    capabilities: [
      "Enroll via a 4-step wizard: view pricing, choose an entry quarter, review, then pay via Stripe Checkout",
      "Complete a 12-week Foundation Training quarter with weekly audio introductions, reading, and task checklists",
      "Navigate all 36 decans in a colour-coded grid with live countdown timers and status indicators",
      "Open each decan's study page to view ruling planet, sign, tarot card reference, and description",
      "Complete three requirements per decan: perform the ritual, submit the scrying journal, submit the mundane journal",
      "Run step-through rituals with a guided interface — invocations, gates, instructions, affirmations, and closings",
      "Browse training categories and complete individual lessons with video, text content, and PDF downloads",
      "Track graduation eligibility: 12 foundation weeks + 36 decans + zero unexcused misses",
      "After graduation, design custom rituals in the post-graduation Ritual Builder",
      "Manage your subscription via Stripe Billing Portal directly from the dashboard",
      "Switch between PM Community and Mystery School portals using the header Portal Switcher",
      "Discover Mystery School from the PM Community dashboard with upgrade CTAs and subscription status cards",
    ],
    keyPages: ["PM Dashboard CTA", "Enrollment", "Checkout Success", "Login Redirect", "Portal Switcher", "Decans Dashboard", "Decan Detail", "Ritual Runner", "Foundation Training", "Training Category", "Lesson View", "Graduation", "Ritual Builder"],
    groups: [
      {
        groupLabel: "Discovery & Access",
        cards: [
          { title: "PM Dashboard CTA", description: "Mystery School upgrade cards on the Perennial Mandalism community dashboard", href: "/community", icon: Heart, status: "live" },
          { title: "Login Redirect", description: "Auto-redirect to /mystery-school for active MS users after login", href: "/login", icon: Zap, status: "live" },
          { title: "Portal Switcher", description: "Header links to switch between PM Community and Mystery School portals", href: "/mystery-school", icon: Layers, status: "live" },
        ],
      },
      {
        groupLabel: "Enrollment & Checkout",
        cards: [
          { title: "Enrollment Flow", description: "4-step signup: overview, quarter selection, review, Stripe payment", href: "/join/mystery-school", icon: Star, status: "live" },
          { title: "Checkout Success", description: "Post-payment finalization with polling and redirect", href: "/join/mystery-school/checkout/success", icon: Zap, status: "live" },
          { title: "Checkout Cancel", description: "Friendly cancellation page with return options", href: "/join/mystery-school/checkout/cancel", icon: Eye, status: "live" },
        ],
      },
      {
        groupLabel: "Dashboard & Decans",
        cards: [
          { title: "Decans Dashboard", description: "36-decan grid, current decan hero, subscription info, progress bar", href: "/mystery-school", icon: Eye, status: "live" },
          { title: "Decan Detail", description: "Individual decan study with ritual, scrying journal, and mundane journal", href: "/mystery-school/decans/[id]", icon: Star, status: "live" },
          { title: "Ritual Runner", description: "Step-by-step guided ritual execution with timed reading", href: "/mystery-school/decans/[id]/ritual", icon: Flame, status: "live" },
        ],
      },
      {
        groupLabel: "Training & Graduation",
        cards: [
          { title: "Foundation Training", description: "12-week Q1 foundation with audio, tasks, and sequential unlock", href: "/mystery-school/training", icon: BookOpen, status: "live" },
          { title: "Training Category", description: "Module listing with lessons, durations, and video indicators", href: "/mystery-school/training/[categoryId]", icon: Layers, status: "live" },
          { title: "Lesson View", description: "Individual lesson with video, content, and PDF downloads", href: "/mystery-school/training/[categoryId]/[lessonId]", icon: ScrollText, status: "live" },
          { title: "Graduation", description: "Progress checklist, eligibility tracking, and certificate display", href: "/mystery-school/training/graduation", icon: GraduationCap, status: "live" },
          { title: "Ritual Builder", description: "Post-graduation tool for designing custom ritual sequences", href: "/mystery-school/training/ritual-builder", icon: Sparkles, status: "live" },
        ],
      },
    ],
    screens: [
      {
        name: "pm-dashboard-cta",
        label: "PM Dashboard — Mystery School CTA",
        description: "The Perennial Mandalism (PM) community dashboard at /community includes two Mystery School promotional sections. The Mystery School is a separate, deeper programme that PM members can upgrade to while keeping their PM membership. Both subscriptions run independently — purchasing Mystery School does NOT cancel Perennial Mandalism. PM members who also hold an active MS subscription get the discounted monthly rate ($17.03/month instead of $27/month) if the admin has enabled the ms_pm_discount_enabled toggle in platform_settings.",
        group: "Discovery & Access",
        purpose: "PM members discover the Mystery School through their existing community dashboard. Two sections appear: (1) A compact card near the top of the dashboard showing MS status — if the user has active MS access, it shows 'Mystery School access is active' with renewal date and an 'Open Mystery School' button; if cancelled/paused, it shows a 'Rejoin Mystery School' button; if never enrolled, it shows 'Deepen your practice with the Mystery School curriculum' with an 'Upgrade to Mystery School' button. (2) A larger promotional section lower on the page with a purple gradient card titled 'The Mystery School Awaits You', describing the programme as a sacred gateway with seasonal cohort entries. For users who already have MS access, this section instead shows their 5 subscription info cards (Status, Enrolled date, Billing amount, Next Renewal date, Cohort quarter/year) with 'Open Mystery School' and 'Manage Subscription' buttons. The dual-entitlement model means the PM dashboard always shows MS status because the user might have both — they are two parallel memberships, not an upgrade that replaces PM. All enroll links use /mystery-school/enroll which proxy.ts silently rewrites to /join/mystery-school.",
        bullets: [
          "Compact CTA card: appears for all PM members, shows MS status (active/paused/cancelled/not enrolled) with contextual button text",
          "Active MS users: 'Mystery School access is active' with renewal date, 'Open Mystery School' button linking to /mystery-school",
          "Inactive/paused users: 'Rejoin Mystery School' button linking to /mystery-school/enroll",
          "New users: 'Upgrade to Mystery School' with tagline about deepening practice — this is NOT an upgrade that replaces PM, it is a separate parallel subscription",
          "Full promotional section: purple gradient card with 'The Mystery School Awaits You' heading, 'Sacred Gateway — Next Seasonal Cohort Open' subtitle, cohort info, gradient 'Enter the Sacred Gateway' CTA",
          "Active users in promo section: 5 subscription info cards (Status, Enrolled, Billing, Renewal, Cohort) + 'Open Mystery School' button + 'Manage Subscription' button opening Stripe Billing Portal in new tab",
          "Dual entitlement: PM and MS run side by side — the PM dashboard always shows MS status because the user may hold both memberships simultaneously"
        ]
      },
      {
        name: "login-redirect",
        label: "Login Redirect",
        description: "After login (magic link or password), the system automatically routes Mystery School users to /mystery-school. No manual portal selection is needed. The redirect is transparent — the user signs in and immediately lands on their dashboard. Because Mystery School and Perennial Mandalism are parallel memberships, a user may qualify for both portals. The system resolves this by checking saved portal preferences first (which portal did they last visit?), then falling back to a role hierarchy where Mystery School outranks Perennial Mandalism.",
        group: "Discovery & Access",
        purpose: "The login redirect logic in resolve-login-destination.ts runs after every authentication. It follows a priority chain: (1) Pending legal contracts — the user must sign any outstanding contracts before entering any portal; (2) Admin shortcut — admin users go to /admin; (3) Saved last_portal_url — if the user has a user_portal_preferences record with a trusted portal URL, they return to wherever they were last (this is how dual PM+MS users seamlessly return to the right dashboard); (4) Role hierarchy fallback — on first login with no saved preference, the system checks all role tables in parallel and picks the highest-priority role: diviner > trainee > social_advo > mystery_school > perennial_mandalism > client. For Mystery School specifically, the check queries mystery_school_students and validates: (a) status is 'active', OR status is 'cancelled' with access_expires_at still in the future; (b) billing fields are present — stripe_subscription_id is set, one_time_fee_paid is true, and one_time_fee_amount is a number. If both conditions pass, the user qualifies for /mystery-school. If they also have an active PM membership, MS wins in the hierarchy (it is higher priority). After the first visit, the system saves their last portal URL, so subsequent logins return them to whichever portal they last used.",
        bullets: [
          "Role hierarchy: diviner > trainee > social_advo > mystery_school > perennial_mandalism > client — MS outranks PM when both are active",
          "MS billing validation: stripe_subscription_id must be set, one_time_fee_paid must be true, one_time_fee_amount must be a number — all three required",
          "Cancelled with access: status = 'cancelled' still qualifies if access_expires_at is a future date (paid-through period)",
          "Saved preference: user_portal_preferences.last_portal_url checked before hierarchy — lets dual users return to whichever dashboard they used last",
          "Dual entitlement example: a user with both active PM and active MS lands on their last-visited portal, or /mystery-school if no preference saved (MS > PM in hierarchy)",
          "Pending contracts: legal gate always checked first — user must sign any outstanding contracts before entering any portal",
          "Onboarding gates: some roles (diviner, trainee, advocate, PM) have onboarding checks — MS does not have an onboarding step, so users go directly to the dashboard"
        ]
      },
      {
        name: "portal-switcher",
        label: "Portal Switcher",
        description: "A header component visible on desktop that shows links to all other portals the user has access to. Allows one-click switching between PM Community and Mystery School dashboards.",
        group: "Discovery & Access",
        purpose: "The PortalSwitcher component appears in the top-right header area of every portal layout (including the Mystery School layout). It calls getUserPortals() which queries all role tables in parallel — diviners, clients, social_advocates, community_members (active PM), mystery_school_students (active or cancelled-with-access). Each qualifying role produces a portal entry with a label and href. The switcher filters out the current portal and renders the remaining ones as compact text links separated by a pipe character. For a dual PM+MS user, the Mystery School layout header shows a 'Community' link, and the PM community layout header shows a 'Mystery School' link. The component is hidden on mobile (sm:flex) — mobile navigation handles portal access separately via the MobileNav hamburger menu.",
        bullets: [
          "Placement: right side of the portal header, desktop only (hidden on mobile via sm:flex)",
          "Data source: getUserPortals() queries diviners, clients, social_advocates, community_members, mystery_school_students in parallel",
          "MS portal shown when: mystery_school_students row exists with active status + valid billing, or cancelled with future access_expires_at",
          "PM portal shown when: community_members row exists with membership_type = 'perennial_mandalism' and membership_status = 'active'",
          "Rendering: compact text links with hover highlight, separated by a pipe divider",
          "Dual user example: MS layout header shows 'Community' link; PM layout header shows 'Mystery School' link",
          "Mobile alternative: MobileNav hamburger menu includes portal navigation items"
        ]
      },
      {
        name: "enrollment",
        label: "Enrollment Flow",
        description: "A 4-step enrollment wizard at /join/mystery-school that guides new students from overview to Stripe payment. The Mystery School is a 5-quarter (15-month) programme. Students choose one of four seasonal entry points — Spring (March equinox), Summer (June solstice), Autumn (September equinox), or Winter (December solstice). The first quarter is Foundation Training (12 weeks of structured study), followed by the 36-decan year-long practice cycle. Pricing is fetched dynamically from the admin pricing database (pricing_plans table) — not hardcoded. Active Perennial Mandalism (PM) members receive a discounted monthly rate if the admin has enabled the ms_pm_discount_enabled toggle.",
        group: "Enrollment & Checkout",
        purpose: "This is the entry point for all new Mystery School students. The flow walks the user through four sequential steps. Step 1 (Overview) presents four programme features — Foundation Training (12 weeks of structured weekly study with audio from Beto), 36-Decan Year-Long Practice (working through all 36 zodiac decans with rituals and journals), Ritual Performer (step-through ritual interface per decan), and Priest/Priestess Graduation (complete all 36 decans to earn the title). Pricing badges show the one-time enrollment fee and monthly subscription, loaded from /api/pricing/mystery_school (plan_mystery_monthly and plan_mystery_monthly_pm_discount rows in pricing_plans table). If the user is an active PM member AND the admin toggle ms_pm_discount_enabled is true, a discount notice shows the reduced monthly rate. Step 2 (Quarter Selection) displays the next 4 upcoming seasonal entry dates computed from hardcoded astronomical equinox/solstice dates (2026–2030). Each quarter card shows the emoji (🌱/☀️/🍂/❄️), the season name and year, the exact astronomical date (e.g. 'March 20, 2026'), and when Week 1 begins (7 days after the turning point). Step 3 (Review & Confirm) shows a summary card with the selected cohort, one-time fee, monthly cost, PM discount line (savings amount shown as a negative), and the effective monthly cost. A commitment checkbox must be checked: 'By continuing I agree to the 5-quarter commitment.' The 5-quarter structure is: Q1 Foundation (12 weeks) + Q2-Q5 Decan Year (36 decans across 4 quarters following the zodiac calendar). Step 4 (Payment) shows the final summary and an 'Enroll in Mystery School' button. Clicking it calls POST /api/community/checkout which reads the stripe_price_id for the recurring subscription from pricing_plans (plan_mystery_monthly or plan_mystery_monthly_pm_discount), creates an ad-hoc Stripe Price for the one-time enrollment fee using stripe.prices.create() with the amount and currency from the same table, and creates a Stripe Checkout session in subscription mode with both line items. The user is redirected to Stripe to complete payment.",
        bullets: [
          "Step 1 — Overview: hero with 4 programme features (Foundation Training, 36-Decan Practice, Ritual Performer, Graduation), pricing loaded from /api/pricing/mystery_school, PM discount notice shown conditionally",
          "Step 2 — Quarter Selection: 4 upcoming entry quarters (Spring equinox ~Mar 20, Summer solstice ~Jun 21, Autumn equinox ~Sep 22, Winter solstice ~Dec 21), each showing astronomical date and Week 1 start (7 days after equinox/solstice)",
          "Step 3 — Review & Confirm: summary with cohort, one-time fee, monthly cost, PM discount savings, effective monthly total, and 5-quarter commitment checkbox",
          "Step 4 — Payment: 'Enroll in Mystery School' button → POST /api/community/checkout → Stripe Checkout redirect",
          "Pricing source: plan_mystery_monthly and plan_mystery_monthly_pm_discount rows in pricing_plans table — admin controls amounts via /admin/pricing",
          "PM discount logic: user must have active PM membership (community_members.membership_status = 'active') AND admin toggle ms_pm_discount_enabled must be true in platform_settings",
          "Stripe checkout: recurring charge uses saved stripe_price_id from DB, one-time fee uses ad-hoc stripe.prices.create() with amount/currency from DB",
          "5-quarter commitment: Q1 = Foundation (12 weeks), Q2–Q5 = 36 decans following the zodiac calendar year"
        ]
      },
      {
        name: "checkout-success",
        label: "Checkout Success",
        description: "The post-payment landing page at /join/mystery-school/checkout/success that finalizes the enrollment by polling the server until the Stripe webhook provisions access.",
        group: "Enrollment & Checkout",
        purpose: "After Stripe redirects back with a session_id, this page automatically polls POST /api/mystery-school/checkout/finalize up to 8 times with 1.2-second intervals. It handles four states: (1) Loading — spinner with 'Finalizing Your Enrollment' while polling; (2) Success — green checkmark with 'Enrollment Confirmed', then auto-redirect to /mystery-school dashboard after 900ms; (3) Unauthorized — prompts user to sign in with a link back to login; (4) Failed — error message with 'Try Again' reload button and link back to enrollment. If no session_id is present in the URL, the page immediately shows the failed state.",
        bullets: [
          "Auto-polling: POST /api/mystery-school/checkout/finalize called up to 8 times, 1.2s apart",
          "Loading state: spinning loader with 'One Moment While We Open The Gates' heading",
          "Success state: green checkmark, 'Enrollment Confirmed' badge, auto-redirect to dashboard",
          "Unauthorized state: triangle alert icon, sign-in prompt with redirect back to this page after login",
          "Failed state: red alert icon, error message, 'Try Again' button and 'Back to Enrollment' link",
          "Stripe badge: shows 'Stripe Payment Verified Server-Side' during loading"
        ]
      },
      {
        name: "checkout-cancel",
        label: "Checkout Cancel",
        description: "A friendly cancellation page at /join/mystery-school/checkout/cancel shown when the user exits Stripe Checkout without completing payment.",
        group: "Enrollment & Checkout",
        purpose: "Reassures the user that nothing was charged and their spot remains open. Provides two clear actions: 'Return to Enrollment' to restart the flow, and 'Back to Community' to exit entirely. The heading reads 'Checkout Was Not Completed' with the message 'No problem. Your enrollment has not been finalized, and you can return whenever you are ready to continue.'",
        bullets: [
          "Heading: 'Checkout Was Not Completed' with 'Your Place Is Still Open' card title",
          "Two CTA buttons: 'Return to Enrollment' (primary) and 'Back to Community' (outline)",
          "No payment was processed — the page confirms this clearly"
        ]
      },
      {
        name: "decans",
        label: "Decans Dashboard",
        description: "The main Mystery School dashboard at /mystery-school. A 'decan' is a 10-degree segment of the zodiac — there are 3 decans per zodiac sign (e.g. Aries I, II, III) and 12 signs, making 36 decans total. Each decan is ruled by a planet (Sun, Moon, Mercury, Venus, Mars, Jupiter, or Saturn) and is associated with a Minor Arcana tarot card. Decans are NOT unlocked sequentially by the student — they are TIME-BASED. Each decan has a fixed astronomical date window tied to the degrees of the zodiac it occupies (e.g. Aries I covers March 21–30). When the calendar reaches that window, the decan becomes 'active' for all students. The student has approximately 10 days to complete all three requirements before the window closes. After the window closes, a 2-day grace period allows late completion. After grace ends, the decan is marked 'missed'.",
        group: "Dashboard & Decans",
        purpose: "This is the student's home screen after enrolling. It fetches all data from GET /api/mystery-school/decans. The hero header uses a gold-on-dark design with a 'Mystery School' badge. If the student has completed all 12 foundation weeks, a green 'Foundation Complete' badge appears. The title reads 'Your Decan Journey' with progress text (e.g. 'Decan 5 of 36 · 4 completed') and a yellow gradient progress bar showing completion percentage. Below the hero, five subscription info cards display: (1) Status — active, cancelled, or 'Cancelled · Access Active' if access_expires_at is in the future; (2) Enrolled — the date the student enrolled; (3) Billing — monthly subscription amount fetched live from Stripe (e.g. '$27.00/month'), plus the one-time enrollment fee amount if applicable; (4) Next Renewal / Access Until — next billing date for active subscribers, or access expiry for cancelled; (5) Cohort — the entry quarter and year (e.g. 'Spring 2026'). A 'Manage Subscription' button opens the Stripe Billing Portal in a new browser tab via POST /api/mystery-school/billing-portal, where the user can update payment method, view invoices, cancel, or pause. The current decan section shows a hero card ONLY if a decan is currently in its active window. The card displays: the planet glyph (☉ ☽ ☿ ♀ ♂ ♃ ♄), decan name, zodiac sign with colour coding, tarot card reference (clickable link to /community/tarot), active window dates (e.g. 'Active Mar 21 – Mar 30'), a LIVE countdown timer updating every 60 seconds (e.g. '5d 12h remaining'), and three completion pips: Ritual ✓/○, Scry ✓/○, Journal ✓/○. Clicking the card navigates to the decan detail page. Below that, up to 3 upcoming/preview decans show as smaller cards — preview decans (within 7-day pre-window) are clickable, upcoming ones are not. The 36-decan compact grid is the core visual — grouped by zodiac sign (Aries, Taurus, … Pisces), 3 cells per sign. Each cell shows: a status icon (🔒 locked, ○ upcoming, 👁 preview, ⚡ active, G grace, ✓ completed, ⚠ missed), the decan number, and the sign abbreviation. Colour coding: amber border for active, green for completed, red for missed, orange for grace, purple for preview, dimmed for locked. The page auto-refreshes data on tab focus, page show, and visibility change events — so returning to the tab always shows current state.",
        bullets: [
          "Gold-themed hero header with 'Mystery School' badge, foundation complete badge (if applicable), progress text and percentage bar",
          "Five subscription info cards: Status, Enrolled date, Billing (amount/month from DB), Next Renewal / Access Until, Cohort quarter",
          "Manage Subscription button: opens Stripe Billing Portal in new tab via POST /api/mystery-school/billing-portal",
          "Current decan hero card: planet glyph, decan name, sign, tarot card link, active window dates, live countdown timer (updates every 60s), completion pips (Ritual ✓/○, Scry ✓/○, Journal ✓/○), 'Continue Work' link",
          "Upcoming section: next 3 decans with upcoming/preview status, smaller cards with lock icon and unlock date",
          "36-decan compact grid: grouped by zodiac sign, 3 cells per sign, each cell shows decan number, sign abbreviation, and status icon with colour coding (amber=active, green=completed, red=missed, orange=grace, purple=preview, dimmed=locked)",
          "Status legend at bottom: Active, Grace, Preview, Upcoming, Completed, Missed, Locked with matching icons",
          "Auto-refresh: data reloads on pageshow, focus, and visibility change events"
        ]
      },
      {
        name: "decan-detail",
        label: "Decan Detail Page",
        description: "The individual decan study page at /mystery-school/decans/[id]. Each decan represents a 10-degree segment of the zodiac — for example, 'Aries I' covers degrees 0–10 of Aries. The decan is ruled by a planet (e.g. Mars for Aries I) and associated with a specific Minor Arcana tarot card (e.g. Two of Wands). The student must complete THREE requirements during the decan's active window to mark it done: (1) Ritual — a step-through guided ceremony; (2) Scrying Journal — a tarot card draw and spiritual experience reflection; (3) Mundane Impact Journal — how the decan's energy manifested in daily life across three areas (relationships, business/work, perception). The decan lifecycle is: locked → preview (7 days before window opens) → active (window open, ~10 days) → grace (2 days after window close) → completed OR missed.",
        group: "Dashboard & Decans",
        purpose: "When a student clicks on an unlocked decan in the grid, this page opens. It fetches from GET /api/mystery-school/decan/[id] and displays everything about this decan. The header shows the planet glyph (☉☽☿♀♂♃♄), the decan title (e.g. 'Decan 1 — Aries I'), the decan name if set, the zodiac sign with colour coding, and a clickable tarot card reference linking to /community/tarot. If the decan has artwork, it displays as a large image. The description text explains the decan's esoteric meaning. Status banners appear based on the decan's lifecycle state: ACTIVE — green banner with live countdown timer showing days/hours/minutes until window_close (updates every 60 seconds), with the active date range; GRACE — orange banner warning that the action window closed on [date] and the student has until [grace_close] to complete, with a live countdown to grace end; MISSED — red banner indicating the decan was missed, with retry information if a retry window has been assigned (retry windows are set by the daily cron — typically the same dates the following year, or 5 years later for Q4 decans in months 10–12); ADMIN EXCUSED — if an admin has excused the missed decan, shows the excuse reason and date instead of the missed warning; LOCKED — muted banner for decans whose window has not yet opened. The three completion sections each have distinct forms: (1) RITUAL — if not started, shows a 'Begin Ritual' button linking to /mystery-school/decans/[id]/ritual (the step-through ritual runner). If a ritual execution exists but is incomplete, shows 'Resume Ritual' with a play icon. If completed, shows a green 'Completed' badge with the completion date. (2) SCRYING JOURNAL — the assigned tarot card for this decan is displayed (e.g. 'Two of Wands'). The student enters an optional alternate card they drew, then writes their spiritual experience in a text area with a 200-character minimum (a live character counter shows progress). After submission, the form becomes read-only showing the submitted text and date. The scrying practice involves gazing into a reflective surface and recording spiritual visions, symbols, or impressions received — the tarot card serves as a focal point for the decan's energy. (3) MUNDANE IMPACT JOURNAL — three separate text areas for: Relationships (how did this decan's energy affect your relationships?), Business/Work (how did it manifest in your professional life?), and Shifts in Perception (what changed in how you see the world?). Each requires 100 characters minimum with a live counter. After submission, the form becomes read-only. All three requirements must be completed to mark the decan as 'completed'. Once all three pips show ✓, the student_decan_progress status changes to 'completed' and the decan cell in the grid turns green.",
        bullets: [
          "Decan header: planet glyph, title, decan name, sign with colour coding, tarot card reference link to /community/tarot",
          "Artwork display: decan illustration via next/image if artwork_url is set",
          "Description: full decan text content",
          "Status banners: Active (green, with live countdown), Grace (orange, shows grace deadline), Missed (red, with admin excused info), Locked (muted)",
          "Ritual section: 'Begin Ritual' button → /mystery-school/decans/[id]/ritual, or green 'Completed' badge with date, or 'Retry Ritual' if execution exists but not complete",
          "Scrying Journal section: assigned tarot card display, alternate card input, experience text area (200 char min), character counter, submit button, or read-only submitted view with date",
          "Mundane Impact Journal section: three text areas — Relationships, Business/Work, Shifts in Perception (100 char min each), submit button, or read-only submitted view",
          "Retry window: if decan was missed but has a retry window assigned, shows retry dates and allows completion",
          "Admin excuse: if admin_excused is true, shows excuse reason and excused date instead of missed warning"
        ]
      },
      {
        name: "ritual",
        label: "Ritual Runner",
        description: "A step-by-step guided ritual execution interface at /mystery-school/decans/[id]/ritual. Each decan has a pre-built ritual consisting of ordered steps of different types: Invocation (calling upon planetary or spiritual forces), Gate (a threshold or transition point in the ritual), Instruction (guidance on what to do physically or mentally), Affirmation (a statement to speak aloud or internalize), and Closing (sealing and completing the ritual). The ritual is the active, experiential requirement of each decan — where the student moves from intellectual study to lived spiritual practice. The student performs each step in their own physical space while following the on-screen guidance.",
        group: "Dashboard & Decans",
        purpose: "This is the immersive ritual experience page. It fetches the ritual steps from GET /api/mystery-school/decan/[id]/ritual and displays them one at a time. The page enforces a deliberate, meditative pace — each step has a mandatory 3-second reading period (STEP_READ_DELAY_MS = 3000) before the 'Continue' button becomes active, ensuring the student actually reads and reflects rather than clicking through. The page has three states: (1) NOT STARTED — shows a preview list of all steps as dimmed rows with lock icons. Each row shows the step number and type label (Invocation, Gate, Instruction, Affirmation, or Closing) but the content is hidden until the ritual begins. The step count is displayed (e.g. 'This ritual contains 7 steps'). A 'Begin Ritual' button calls POST /api/mystery-school/decan/[id]/ritual/start which creates a ritual_execution record on the server. (2) IN PROGRESS — the UI focuses entirely on the current step. A progress bar at the top shows percentage complete, and a row of breadcrumb dots below it shows each step as green (done), primary colour (current), or muted (pending). The current step appears in a highlighted card with its step type as a badge (e.g. 'Invocation') and the full step content below as pre-wrapped text. The 'Continue to Next Step' button is initially disabled with the text 'Read the step above…' and a gentle message 'Take a moment to read and reflect before continuing.' After 3 seconds, the button activates. Clicking it calls POST /api/mystery-school/decan/[id]/ritual/step with the next step_index. On the final step, the button reads 'Complete Ritual' instead. (3) COMPLETE — a green checkmark icon, 'Ritual Complete' heading, the completion date and time, total steps summary, and a 'Return to Decan' button. Progress is persisted server-side in the ritual_execution table — if the student navigates away mid-ritual and returns later, they resume at exactly the step where they left off.",
        bullets: [
          "Not started state: preview list of all ritual steps (dimmed, locked), step type labels, 'Begin Ritual' button",
          "In progress state: progress bar with percentage, breadcrumb dots (green=done, primary=current, muted=pending), current step card with step type badge and content",
          "3-second read timer: 'Continue' button disabled with 'Read the step above...' text until 3 seconds pass",
          "Step types: Invocation, Gate, Instruction, Affirmation, Closing — each labelled in a badge above the content",
          "Advance: POST /api/mystery-school/decan/[id]/ritual/step with step_index, returns updated state",
          "Complete state: green checkmark, 'Ritual Complete' heading, completion date/time, total steps summary, 'Return to Decan' button",
          "Resume support: if the student navigates away mid-ritual, returning loads the execution state and resumes at the current step",
          "Back link: 'Back to Decan' link always visible at the top"
        ]
      },
      {
        name: "center",
        label: "Foundation Training",
        description: "The 12-week Foundation Training page at /mystery-school/training. Foundation is Q1 (the first quarter) of the 5-quarter Mystery School programme. It must be completed BEFORE the student can participate in the 36-decan year-long cycle (Q2–Q5). Foundation weeks begin 7 days after the student's chosen equinox/solstice entry date. Each week is structured with: an audio introduction recorded by Beto (the programme leader), written description/reading material, and a task checklist. Weeks unlock sequentially — you must complete all tasks in Week 1 before Week 2 opens. The 12 weeks cover the foundational esoteric teachings that prepare the student for decan work: planetary principles, elemental theory, sacred geometry, divination basics, ritual theory, and the cosmological framework of the 36-decan system.",
        group: "Training & Graduation",
        purpose: "This is the structured Q1 curriculum. It fetches from GET /api/mystery-school/foundation and displays all 12 weeks as expandable cards. A gold-themed hero header shows the 'Mystery School — Foundation Q1' badge with a flame icon, 'Foundation Training' title, the student's entry quarter (e.g. 'Quarter: Spring'), current week counter (e.g. 'Week 4 of 12'), and a yellow progress bar with completion percentage. When all 12 weeks are done, a green message appears: 'Foundation complete — your decan year is unlocked.' Each week card shows: the week number, the title (e.g. 'Planetary Principles'), a 'Done' badge if completed, a lock icon if not yet unlocked (previous week not finished), and an expand/collapse chevron button. When expanded, the card reveals three sections: (1) Audio Player — Beto's weekly introduction with his photo displayed beside the audio player; (2) Week Description — the full reading material in prose text; (3) Task Checklist — each task has a checkbox, title, and optional description. Tasks are completed one at a time by clicking the checkbox, which calls POST /api/mystery-school/foundation/complete-task with the week_number and task_id. The UI uses optimistic updates — checking a task immediately marks it done in the UI before the server responds, showing a green CheckSquare icon and a completion date. In-progress weeks show an inline progress bar and count (e.g. '3 of 5 tasks complete'). When all tasks in a week are done, the next week's lock automatically opens and its card becomes expandable. If no foundation weeks have been published yet (admin has not added content), an empty state card appears: 'Your journey begins when you enroll — Foundation content is being prepared. Check back soon.' with a book icon. The foundation week curriculum content (title, description, audio_url, tasks) is managed by admin in the mystery_school_foundation_weeks table and is published via the admin Mystery School management pages.",
        bullets: [
          "Gold hero header: 'Mystery School — Foundation Q1' badge, 'Foundation Training' title, entry quarter, week counter, progress bar with percentage",
          "Foundation complete badge: green 'Foundation complete — your decan year is unlocked' message when all 12 weeks done",
          "Week cards: sequential list, each with week number, title, completion badge, lock/unlock icon, expand button",
          "Expanded card: audio player with Beto's photo, week description text, task checklist with checkboxes",
          "Task completion: click checkbox → POST /api/mystery-school/foundation/complete-task, optimistic UI update, completion date shown",
          "Sequential unlock: next week unlocks only when all tasks in the current week are complete",
          "Progress indicators: inline task count (e.g. '3 of 5 tasks complete') and thin progress bar per week card",
          "Empty state: 'Your journey begins when you enroll' message with book icon if no weeks published yet"
        ]
      },
      {
        name: "training-category",
        label: "Training Category",
        description: "A server-rendered module listing page at /mystery-school/training/[categoryId]. Beyond the 12-week Foundation Training, the Mystery School has an organized academic curriculum — a series of training categories (modules) covering esoteric topics. Categories and their lessons are managed by admin via the training_categories and training_lessons tables. Each category groups related lessons into a thematic unit. This page lists all published lessons in a given category.",
        group: "Training & Graduation",
        purpose: "When a student navigates into a specific training category (module), this page loads. It is a server-rendered page that fetches the category details from training_categories and all active lessons from training_lessons in parallel, both filtered by is_active = true. The page header shows a 'Back to Training' breadcrumb link with a ChevronLeft icon, the category name as an h1 heading, and the category description below. Each lesson appears as a card in a vertical list showing: a numbered circle (1, 2, 3...) based on priority order, the lesson title in bold, the lesson description in muted text, a PlayCircle icon in primary colour if the lesson has a video_url (indicating video content is available), a duration badge (e.g. '15 min') with a Clock icon if duration_mins is set, and a 'View Lesson' button linking to /mystery-school/training/[categoryId]/[lessonId]. If the category has no published lessons, an empty state card reads 'No lessons published in this module yet.' Access is guarded by requireMysterySchoolAccess() — non-MS users are redirected to /mystery-school/enroll (which proxy.ts rewrites to /join/mystery-school).",
        bullets: [
          "Breadcrumb: 'Back to Training' link with ChevronLeft icon at top",
          "Category header: category name as h1 heading, category description below",
          "Lesson cards: numbered list, each card shows lesson title, description, video icon (if video_url exists), duration badge (if duration_mins set)",
          "View Lesson button: links to /mystery-school/training/[categoryId]/[lessonId]",
          "Empty state: 'No lessons published in this module yet' card if no active lessons",
          "Access guard: requireMysterySchoolAccess() check, redirects to /mystery-school/enroll if unauthorized"
        ]
      },
      {
        name: "lesson",
        label: "Lesson View",
        description: "A server-rendered individual lesson page at /mystery-school/training/[categoryId]/[lessonId]. This is the focused learning environment for a single lesson within the Mystery School curriculum. Lessons can include video content (embedded from external providers), written text material, and downloadable PDF reference documents. Lessons are part of the broader training curriculum that supplements the core Foundation + Decan programme.",
        group: "Training & Graduation",
        purpose: "This is the immersive, distraction-free reading and learning space for a single lesson. It fetches the lesson from training_lessons and its parent category from training_categories in parallel, both using the admin Supabase client. The page layout is clean and focused: a breadcrumb at the top links back to the parent category page showing the category name with a ChevronLeft icon. The lesson title appears as an h1 heading, with the description and a duration badge (e.g. '15 min' with a Clock icon) below. The lesson content is presented in up to three card sections: (1) VIDEO — if the lesson has a video_url, an iframe embed appears in a 16:9 aspect ratio wrapper (aspect-video class) inside a card. The iframe has full permissions for autoplay, clipboard-write, encrypted-media, gyroscope, picture-in-picture, and fullscreen. The video URL is set by admin and typically points to a hosted video provider. (2) LESSON CONTENT — if the lesson has text content, it renders in a prose-styled card using whitespace-pre-wrap formatting to preserve line breaks and paragraph structure from the admin-entered content. (3) SUPPLEMENTAL MATERIAL — if the lesson has a pdf_url, a card with a FileText icon shows a 'Download PDF' button that opens the PDF in a new browser tab. At the bottom, a 'Back to Module' button returns to the category listing. If the lesson ID is invalid or the lesson is inactive (is_active = false), the page returns a 404 via Next.js notFound(). Access is guarded by requireMysterySchoolAccess() — non-MS users are redirected to enrollment.",
        bullets: [
          "Breadcrumb: links back to parent category page with category name, ChevronLeft icon",
          "Lesson header: title as h1, description text, duration badge with Clock icon",
          "Video section: iframe embed in 16:9 aspect ratio card, full autoplay/clipboard/gyroscope/picture-in-picture permissions, fullscreen enabled",
          "Content section: lesson text rendered in prose styling with whitespace-pre-wrap, wrapped in a card",
          "PDF download: 'Download PDF' button opens pdf_url in new tab, shown only if pdf_url is set, with FileText icon",
          "Back navigation: 'Back to Module' button at bottom returns to category listing",
          "Access guard: requireMysterySchoolAccess() check, 404 via notFound() if lesson not found or inactive"
        ]
      },
      {
        name: "graduation",
        label: "Graduation Page",
        description: "The graduation tracking and certificate page at /mystery-school/training/graduation. Graduation is the culmination of the 5-quarter Mystery School programme. To graduate, a student must satisfy ALL THREE requirements: (1) Complete all 12 Foundation Q1 weeks (each week's tasks fully done, week_completed_at set); (2) Complete all 36 decans (every decan's status = 'completed', meaning ritual_done + scry_done + journal_done); (3) Have ZERO unresolved missed decans (any decan with status = 'missed' must have admin_excused = true, or the student must complete it during a retry window). When all three conditions are met, graduation is processed automatically by a server-side cron job within 24 hours — it sets training_status = 'graduated', graduated_at timestamp, and sends a congratulation email. The graduated student receives the title of 'Priest or Priestess of the Mystery School'.",
        group: "Training & Graduation",
        purpose: "This server-rendered page checks the student's graduation status by querying student_foundation_progress (counting rows where week_completed_at is not null), student_decan_progress (counting rows with status = 'completed'), and student_decan_progress (counting rows with status = 'missed' and admin_excused = false). It shows one of two views. FOR STUDENTS WHO HAVE NOT GRADUATED: A gold hero header with 'Graduation' title and a combined progress bar that weights foundation at 50% and decans at 50% (e.g. 6/12 foundation + 18/36 decans = 50% overall). A 'Your Progress' card shows three checklist items with green checkmarks or empty circles: (1) Foundation Q1 — 'X of 12 weeks' with a Complete/X badge; (2) 36 Decans — 'X of 36 completed' with a badge; (3) Unresolved missed decans — only shown if count > 0, in red with 'Contact your admin to resolve'. If all three requirements are satisfied, a green message reads: 'All requirements met — graduation will be processed automatically within 24 hours.' This auto-processing is handled by the graduation cron (processGraduation function) which checks eligibility, sets graduated_at, and sends the email. A 'Remaining Requirements' card lists specific blockers (e.g. 'Foundation Q1 not yet complete', '14 decan(s) remaining', '2 unresolved missed decan(s)'). Navigation shortcuts link to Foundation Training (/mystery-school/training) and Decan Training (/mystery-school). A locked teaser card previews the Post-Graduation Ritual Builder with a lock icon and description: 'Unlocks when you graduate — design personal rituals using the full component library.' FOR GRADUATED STUDENTS: A certificate-style card with a golden star icon, the title 'Priest / Priestess of the Mystery School', completion stats (36 Decans Complete, 12 Foundation Weeks), the graduation date formatted as month/day/year, and a share section with the graduation page URL and a 'Share on X' button linking to Twitter intent with pre-filled text. Below the certificate, a CTA card for the now-unlocked Ritual Builder with 'Access Your Ritual Builder' button linking to /mystery-school/training/ritual-builder.",
        bullets: [
          "Not graduated view: gold hero header with progress bar, 'Your Progress' card with Foundation/Decans/Missed checklist, remaining requirements list, navigation shortcuts to training pages, locked Ritual Builder teaser",
          "Graduated view: certificate card with golden star icon, 'Priest / Priestess of the Mystery School' title, 36 decans + 12 weeks stats, graduation date, share URL and 'Share on X' button",
          "Post-grad CTA: 'Post-Graduation Ritual Builder' card with link to /mystery-school/training/ritual-builder (locked before graduation, active after)",
          "Graduation eligibility: 12/12 foundation weeks + 36/36 decans completed + 0 unexcused missed decans",
          "Auto-graduation message: 'will be processed automatically within 24 hours' when all requirements met"
        ]
      },
      {
        name: "builder",
        label: "Ritual Builder",
        description: "A post-graduation creative tool at /mystery-school/training/ritual-builder for designing custom ritual sequences. This tool is the reward and the practical application of everything learned in the Mystery School — it represents the transition from following pre-built rituals (during the decan year) to CREATING your own. Available only to graduated students (graduated_at is not null). Non-graduated students see a locked teaser. The builder provides a library of ritual building blocks drawn from the entire Mystery School tradition: planetary invocations for all 7 classical planets, sign invocations for all 12 zodiac signs, decan invocations for all 36 decans, grand invocations (opening ceremonies), opening gates (threshold transitions), closing prayers, and free-form custom steps. The student assembles these into ordered sequences to create personalized ceremonies for any occasion — personal transits, seasonal rites, decan workings, or free-form spiritual practice.",
        group: "Training & Graduation",
        purpose: "This is the advanced ritual design tool unlocked after graduation. It checks whether graduated_at is not null — if the student has not graduated, the entire page shows a locked teaser card with a Lock icon and the text 'Unlocks when you graduate — design personal rituals using the full component library: planetary invocations, decan workings, seasonal rites, and custom steps.' For graduated students, the builder provides a structured creative environment with three sections: (1) COMPONENT LIBRARY — organized by category: Grand Invocations (ceremonial openings), Opening Gates (threshold crossings), Planetary Invocations (one for each of the 7 classical planets: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, plus Uranus, Neptune, Pluto — 10 total), Sign Invocations (one for each of the 12 zodiac signs: Aries through Pisces), Decan Invocations (one for each of the 36 decans, numbered 1–36), Closing Prayers (ritual endings), and Custom Steps (free-text steps the student writes themselves). Each component can be clicked to add it to the ritual canvas. (2) RITUAL CANVAS — the main area showing the ordered list of selected components. Each item has up/down arrow buttons (ChevronUp/ChevronDown) for reordering and a trash button (Trash2) for removal. There is no drag-and-drop — the interface uses simple button-based reordering with no external dependencies. (3) SAVE FORM — fields for ritual name (required), ritual type selector (Free Form, Personal Transit, Seasonal, or Decan Custom), tags, notes (textarea), and a share toggle. Saving calls POST /api/mystery-school/ritual-builder which stores the ritual in the database. A PERSONAL LIBRARY TAB shows all previously saved rituals in a list, with load, duplicate, and delete actions per ritual. Loading a saved ritual populates the canvas with its components for editing.",
        bullets: [
          "Component library: categorized ritual building blocks — Grand Invocations, Opening Gates, Planetary (10 planets), Sign (12 signs), Decan (36 decans), Closings, Custom steps",
          "Ritual canvas: ordered list of selected components, up/down buttons for reordering, trash button to remove",
          "Save form: ritual name, type selector (Free Form / Personal Transit / Seasonal / Decan Custom), tags, notes, share toggle",
          "Personal library tab: list of saved rituals with load, duplicate, and delete actions",
          "Locked state: non-graduated students see a locked teaser card explaining the feature unlocks after graduation",
          "No external dependencies: uses up/down arrow buttons instead of drag-and-drop"
        ]
      },
    ],
  },
  {
    role: "Affiliate Partner",
    slug: "social_advo",
    tagline: "Community growth and referral partnerships",
    roleDescription:
      "Your partner dashboard as a Social Advocate for AstrologyPro. You earn commissions by referring new clients, members, and students to the platform. This portal tracks every referral, shows your earnings in real time, gives you marketing materials to share, and lets you see exactly how your advocacy is growing the community.",
    icon: Sparkles,
    gradient: "from-blue-500/20 to-indigo-600/10",
    featureAreas: ["Dashboard", "Referrals", "Earnings", "Analytics", "Campaigns", "Content", "KPI", "Reports", "Profile"],
    capabilities: [
      "See your referral performance and total commissions earned from the main dashboard",
      "Get your unique referral link and share it anywhere to track who signs up through you",
      "View a list of every person you have referred and the commission status for each",
      "Track your earnings — what has been paid, what is pending, and what is coming",
      "Browse and join active marketing campaigns to earn extra commissions",
      "Access ready-made marketing content — images, copy, and resources for promoting the platform",
      "View your key performance indicators (KPIs) and compare against goals",
      "Download detailed reports of your referral activity and earnings history",
    ],
    keyPages: ["Dashboard", "Referrals", "Earnings", "Analytics", "Campaigns", "Content", "KPI", "Reports", "Profile"],
    groups: [
      {
        groupLabel: "Performance",
        cards: [
          { title: "Dashboard", description: "Your referral overview and key stats", href: "/advocate", icon: LayoutDashboard, status: "live" },
          { title: "Analytics", description: "Traffic, conversions, and growth trends", href: "/advocate/analytics", icon: BarChart3, status: "live" },
          { title: "KPI Tracker", description: "Your performance goals and targets", href: "/advocate/kpi", icon: TrendingUp, status: "live" },
          { title: "Reports", description: "Detailed downloadable referral reports", href: "/advocate/reports", icon: FileText, status: "live" },
        ],
      },
      {
        groupLabel: "Referrals & Earnings",
        cards: [
          { title: "Referrals", description: "Every person you have referred and their status", href: "/advocate/referrals", icon: Users, status: "live" },
          { title: "Referrals Detail", description: "Individual referral journeys and landing data", href: "/advocate/referrals-detail", icon: ListChecks, status: "live" },
          { title: "Earnings", description: "Commissions paid, pending, and upcoming", href: "/advocate/earnings", icon: CreditCard, status: "live" },
          { title: "Payout History", description: "All completed payouts with receipts", href: "/advocate/payout-history", icon: History, status: "live" },
        ],
      },
      {
        groupLabel: "Tools & Content",
        cards: [
          { title: "Campaigns", description: "Active campaigns you can join for extra earnings", href: "/advocate/campaigns", icon: Zap, status: "live" },
          { title: "Content Library", description: "Admin-curated social media templates and assets", href: "/advocate/content-library", icon: Image, status: "live" },
          { title: "Marketing Content", description: "Ready-made assets and copy for promotion", href: "/advocate/content", icon: Image, status: "live" },
          { title: "Profile", description: "Your advocate profile and contact info", href: "/advocate/profile", icon: User, status: "live" },
        ],
      },
    ],
    screens: [
      {
        name: "advocate-home",
        label: "Advocate Dashboard",
        description: "Your home screen as a Social Advocate. See your total referrals, total earnings, pending commissions, and a summary of your recent activity — everything in one place when you first log in.",
        group: "Performance",
        purpose: "This is your main dashboard — the first thing you see when you log in. It gives you an instant snapshot of how your advocacy is performing. You can see how many people you have referred, how much you have earned in total, how much is currently pending payout, and a quick view of your recent referral activity. Use this page to check in daily or weekly to track your progress.",
        bullets: [
          "Total referrals — the total number of people who have signed up through your referral link",
          "Total earned — your lifetime commission earnings from all successful referrals",
          "Pending amount — commissions that have been earned but not yet paid out to you",
          "Recent referrals — a short list of the most recent people who signed up through your link",
          "Commission rate — your current commission percentage for each referral type",
          "Quick link to your referral URL — copy and share your unique link from the dashboard",
          "Performance summary — a brief comparison of your referrals this month vs last month"
        ]
      },
      {
        name: "referrals",
        label: "My Referrals",
        description: "A detailed list of every person you have referred to the platform. See their sign-up date, which membership or service they purchased, and the commission status for that referral.",
        group: "Referrals & Earnings",
        purpose: "This is your complete referral log — every single person who signed up or made a purchase through your unique link is listed here. For each referral, you can see their name (or a privacy-protected identifier), what they purchased, the commission amount it generated, and whether that commission is pending, earned, or paid out. It is the most granular view of your advocacy work and earnings.",
        bullets: [
          "Full referral list — every person who came through your link, with date and sign-up details",
          "Purchase type — what they signed up for (Perennial Mandalism membership, reading package, etc.)",
          "Commission amount — how much each referral generated for you",
          "Status — whether the commission is pending (waiting for their purchase to clear), earned, or paid",
          "Date column — when the referral signed up and when the commission was earned",
          "Filter and search — narrow down by date range or status to find specific referrals",
          "Total summary — the totals at the top show your cumulative referrals, earned, and pending"
        ]
      },
      {
        name: "earnings",
        label: "Earnings & Payouts",
        description: "Your complete financial history as an advocate. See every commission earned, the payout schedule, and a breakdown of what you have been paid and what is coming.",
        group: "Referrals & Earnings",
        purpose: "The Earnings page is your financial ledger. Commissions go through a lifecycle: first they are 'pending' (the new member's payment needs to clear), then they become 'earned' (confirmed and ready for payout), and finally 'paid' (transferred to your bank or payment account). This page shows you every commission at each stage so you always know exactly where your money stands.",
        bullets: [
          "Earnings by status — view all commissions grouped by pending, earned, and paid",
          "Total paid to date — the cumulative amount that has already been transferred to you",
          "Total earned (unpaid) — confirmed commissions waiting for the next payout cycle",
          "Pending commissions — amounts from recent referrals still in the clearing period",
          "Payout history — a chronological log of every payment you have received",
          "Commission details — click any earnings entry to see which referral it came from and the commission rate",
          "Next payout estimate — when your next payout is expected based on the platform's payment schedule"
        ]
      },
      {
        name: "analytics",
        label: "Performance Analytics",
        description: "Visual charts and data showing how your referral activity is trending over time. Track clicks on your link, new sign-ups, conversion rates, and which channels are performing best.",
        group: "Performance",
        purpose: "Analytics helps you understand the effectiveness of your advocacy efforts. If you are sharing your link on Instagram, a blog, and in emails, this page can show you which source is generating the most sign-ups. You can see trends over time — is your referral rate growing? Which months were strongest? What is your conversion rate (out of everyone who clicked your link, how many actually signed up)? Use this data to improve your approach.",
        bullets: [
          "Link clicks over time — a chart showing how many people clicked your referral link each day or week",
          "New sign-ups chart — how many referrals converted into actual sign-ups in each period",
          "Conversion rate — the percentage of link clicks that resulted in a sign-up or purchase",
          "Traffic sources — where your clicks are coming from (social media, email, direct link, etc.)",
          "Monthly comparison — compare this month's performance to the previous month",
          "Earnings over time — a revenue trend chart showing commission growth week by week",
          "Date range filter — view analytics for any period (last 7 days, last 30 days, last 90 days, custom)"
        ]
      },
      {
        name: "campaigns",
        label: "Campaigns",
        description: "Browse and join marketing campaigns running on the platform. Campaigns may offer higher commission rates for a limited time, specific products, or seasonal promotions.",
        group: "Tools & Content",
        purpose: "Campaigns are special promotional programs the platform runs for limited periods. For example: 'Earn 20% commission on all Perennial Mandalism sign-ups this month' or 'Double commission for new diviners who join this week'. When you join a campaign, you receive a campaign-specific link or code to share. All sign-ups through that link are tracked against the campaign for bonus earnings. Campaigns are a great way to earn more during promotional periods.",
        bullets: [
          "Active campaigns list — all currently running campaigns you can join",
          "Campaign details — the commission rate, eligible products, and end date for each campaign",
          "Join a campaign — enroll in a campaign to get your campaign-specific tracking link",
          "Campaign performance — how many referrals you have made through each campaign",
          "Campaign earnings — commissions earned specifically from campaign referrals",
          "Upcoming campaigns — preview of campaigns launching soon so you can plan your promotion",
          "Past campaigns — history of campaigns you participated in and their results"
        ]
      },
      {
        name: "content",
        label: "Marketing Content",
        description: "Ready-made promotional materials you can use to promote AstrologyPro. Social media images, written copy, video clips, and branded assets — everything you need to share professionally.",
        group: "Tools & Content",
        purpose: "You do not need to create promotional content from scratch. The platform provides a library of marketing materials — professional images sized for Instagram, Facebook, and other platforms, written descriptions of the platform you can copy and paste, email templates, and branded visuals. This content is designed to help you share the platform in a way that looks polished and trustworthy to your audience.",
        bullets: [
          "Social media graphics — pre-sized images for Instagram posts, Stories, Facebook, and Twitter",
          "Written copy — descriptions of the platform, membership benefits, and calls to action you can use directly",
          "Email templates — pre-written emails you can send to your audience introducing AstrologyPro",
          "Video assets — short clips and reels promoting the platform's key features",
          "Download or copy — all assets can be downloaded or copied with one click",
          "Organized by use case — content is sorted by type (social media, email, blog, etc.) for easy finding",
          "New content added — fresh materials are added regularly, especially around major campaigns"
        ]
      },
      {
        name: "kpi",
        label: "KPI Tracker",
        description: "Your key performance indicators — the specific goals and targets set for your advocacy work. See how close you are to hitting each target and track progress over time.",
        group: "Performance",
        purpose: "KPI stands for Key Performance Indicator — a measurable goal. Your KPI dashboard shows targets like 'Refer 10 new members this month' or 'Earn $500 in commissions this quarter'. This page lets you see exactly where you stand against each goal, so you know if you are on track or need to push harder. Some KPIs may be set by the platform, others by yourself or your account manager.",
        bullets: [
          "Goal list — all current KPIs with target value and current progress",
          "Progress bars — visual indication of how close you are to reaching each goal",
          "On track / behind indicator — quickly see which goals you are meeting and which need attention",
          "Time remaining — how many days left in the current tracking period (week, month, quarter)",
          "Historical performance — how your KPIs looked in previous periods vs your current trajectory",
          "Goal categories — referral volume, earnings, conversion rate, and campaign participation",
          "Achievement badges — rewards or recognition for hitting major milestones"
        ]
      },
      {
        name: "reports",
        label: "Reports",
        description: "Download detailed reports of your full referral history, earnings, and advocacy performance. Useful for tax purposes, personal review, or sharing with a team.",
        group: "Performance",
        purpose: "The Reports page lets you generate and download detailed summaries of your advocacy activity. While the dashboard shows live snapshots, a report captures everything in a structured format you can save, share, or analyze offline. You can generate reports for any date range — monthly, quarterly, or annual — covering referrals, commissions, payouts, and campaign performance.",
        bullets: [
          "Referral report — list of all referrals in a period with dates, sign-up details, and commission amounts",
          "Earnings report — total commissions broken down by status (paid, earned, pending)",
          "Campaign report — referrals and earnings specifically from campaign participation",
          "Custom date range — generate a report for any period you choose",
          "Export to CSV — download the report as a spreadsheet for your own analysis or accounting",
          "Export to PDF — a formatted PDF version of your report for sharing or record-keeping",
          "Annual summary — a year-in-review report for tax filing or personal review"
        ]
      },
      {
        name: "profile",
        label: "Advocate Profile",
        description: "Your personal advocate profile — your name, contact details, payment information, and account settings. Keep this up to date to ensure commissions are paid correctly.",
        group: "Tools & Content",
        purpose: "Your Advocate Profile is the foundational record of your account. It contains your personal contact information, how you want to receive payouts, and any preferences for notifications and communication. Critically, keeping your payout information accurate and up to date ensures you actually receive the commissions you earn. If your bank details or payment method are incorrect, payouts will fail.",
        bullets: [
          "Personal details — your name, email address, and phone number",
          "Payout method — how you receive your commissions (bank transfer, PayPal, etc.)",
          "Account status — whether your advocate account is active and in good standing",
          "Notification preferences — how you want to be notified of new referrals, payout updates, and campaigns",
          "Password and security — change your login credentials",
          "Referral link — your unique advocate referral link, always accessible from your profile",
          "Contact your account manager — link to reach your platform contact if you have questions or issues"
        ]
      },
      {
        name: "referrals-detail",
        label: "Referrals Detail",
        description: "A granular breakdown of every individual referral — not just a count, but the full story of each referral. See exactly which page they landed on, which diviner or product they explored, their booking or sign-up status, and the commission earned per referral.",
        group: "Referrals & Earnings",
        purpose: "The most detailed view of your referral program — individual-level insight into every person you sent to the platform.",
        bullets: [
          "Referral entry view — each referral shown as an individual record with name (privacy-masked), date, and source",
          "Landing page — which page of AstrologyPro the referred visitor first arrived on (e.g. /discover, a diviner's profile, /join)",
          "Diviner interaction — if they clicked through to or booked a specific diviner, that diviner is shown",
          "Booking status — whether the referred person has booked a session, joined a plan, or only browsed",
          "Commission per referral — the specific amount this individual referral generated for you",
          "Status timeline — a visual track of this referral's journey (clicked link → registered → purchased → commission earned)",
          "Filter by status — view only referrals who converted, only those still browsing, or only those who earned commission"
        ]
      },
      {
        name: "content-library",
        label: "Content Library",
        description: "A curated collection of ready-made promotional assets created by the platform's admin team specifically for advocates. Grab social media templates, captions, images, and post ideas to promote AstrologyPro on Instagram, TikTok, and Facebook without designing anything yourself.",
        group: "Tools & Content",
        purpose: "Equips advocates with professional, on-brand promotional materials so they can promote the platform effectively without design skills.",
        bullets: [
          "Social media templates — pre-designed image templates sized for Instagram posts, Stories, Facebook, and TikTok",
          "Caption library — ready-to-use written captions with your referral link placeholder that you simply copy and post",
          "Platform highlights — graphics and copy highlighting specific features like Sunday Service, natal charts, or practitioner profiles",
          "Campaign-specific assets — when a campaign is running, dedicated creative materials are added for that promotion",
          "Download or copy — download any graphic as a high-resolution image or copy caption text with one click",
          "Organized by channel — content is grouped by platform (Instagram, Facebook, TikTok, email) for quick retrieval",
          "Updated regularly — the admin team adds new materials before major promotions, seasonal events, and new platform features"
        ]
      },
      {
        name: "payout-history",
        label: "Payout History",
        description: "A complete log of every commission payment that has been transferred to your bank or payment account. See exact amounts, dates, payment method, and download a receipt for any past payout.",
        group: "Referrals & Earnings",
        purpose: "Your official payment record — the definitive proof of every commission transferred to you from the platform.",
        bullets: [
          "All payouts listed — every payment sent to your account, sorted by most recent first",
          "Payout date — the exact date each transfer was processed",
          "Amount — the gross commission amount transferred in each payout",
          "Payment method — which bank account, PayPal, or payment method received the transfer",
          "Payout status — successful, pending, or failed (failed payouts include an explanation and retry option)",
          "Download receipt — generate and download a formal PDF receipt for any individual payout for your tax records",
          "Annual summary — a year-in-review summary showing total commissions received in a calendar year for tax filing"
        ]
      },
    ],
  },
  {
    role: "Trainee Academy",
    slug: "trainee",
    tagline: "Structured apprenticeship and divine arts mastery",
    roleDescription:
      "A guided learning environment for aspiring practitioners — structured lessons, mentor feedback, quizzes, and certification tracks.",
    icon: GraduationCap,
    gradient: "from-amber-500/20 to-orange-600/10",
    featureAreas: ["Training", "Progress", "Quiz History", "Resources", "Sessions", "Certification"],
    capabilities: [
      "Access structured training programs with lessons, categories, and programs",
      "Track granular lesson and category completion progress",
      "Review complete quiz attempt history with scores and timing",
      "Download PDFs, docs, and supplemental resources per lesson",
      "Book and manage practice sessions with assigned mentor",
      "Earn graduation certificate upon 100% curriculum completion",
    ],
    keyPages: ["Dashboard", "Training Programs", "Progress", "Quiz History", "Resources", "Sessions", "Certificate"],
    groups: [
      {
        groupLabel: "Training",
        cards: [
          { title: "Dashboard", description: "Current training focus and progress overview", href: "/trainee", icon: LayoutDashboard, status: "live" },
          { title: "Training Programs", description: "Multi-program curriculum with lessons and categories", href: "/trainee/training", icon: BookOpen, status: "live" },
          { title: "Progress Tracker", description: "Visual category-by-category completion view", href: "/trainee/progress", icon: TrendingUp, status: "live" },
        ],
      },
      {
        groupLabel: "Assessment & Resources",
        cards: [
          { title: "Quiz History", description: "Complete quiz attempt log with scores and timing", href: "/trainee/quiz-history", icon: ClipboardList, status: "live" },
          { title: "Resources", description: "Lesson assets — PDFs, docs, videos, reference sheets", href: "/trainee/resources", icon: FileText, status: "live" },
          { title: "Practice Sessions", description: "Mentor session booking and history", href: "/trainee/sessions", icon: CalendarDays, status: "live" },
        ],
      },
      {
        groupLabel: "Certification",
        cards: [
          { title: "Graduation Certificate", description: "Issued on 100% curriculum completion", href: "/trainee/certificate", icon: GraduationCap, status: "live" },
        ],
      },
    ],
    screens: [
      {
        name: "trainee-hub",
        label: "Trainee Dashboard",
        description: "Personal development home — progress, upcoming sessions, and mentor status.",
        group: "Training",
        purpose: "The home base for apprentices to manage their skills-based training, mentor interactions, and curriculum progress at a glance.",
        bullets: [
          "Overall curriculum completion percentage and program breakdown",
          "Upcoming mentor sessions and lesson bookmarks",
          "Quiz score trends and recent activity feed",
          "Graduation progress bar with milestone indicators"
        ]
      },
      {
        name: "curriculum",
        label: "Training Programs",
        description: "Multi-program curriculum with categories and individual lessons.",
        group: "Training",
        purpose: "A structured, browsable catalog of all training programs, categories, and lessons with real-time completion state.",
        bullets: [
          "Program and category hierarchy with completion indicators",
          "Individual lesson detail pages with video, text, and attachments",
          "In-lesson quizzes with immediate scoring feedback",
          "Lesson progress auto-saved on navigation"
        ]
      },
      {
        name: "progress",
        label: "Progress Tracker",
        description: "Category-by-category completion view with percentage breakdowns.",
        group: "Training",
        purpose: "A visual progress dashboard showing granular completion state per category and program, including time invested.",
        bullets: [
          "Progress bars per training category and program",
          "Total study time and lessons completed counters",
          "Completion date history per category",
          "Link-through to incomplete lessons"
        ]
      },
      {
        name: "quiz-history",
        label: "Quiz History",
        description: "Complete quiz attempt log with per-lesson scores, pass/fail status, and time taken.",
        group: "Assessment",
        purpose: "A full audit of all quiz attempts with aggregate stats — total attempted, pass rate, average score, and best score.",
        bullets: [
          "Chronological list of all 50 quiz attempts",
          "Per-attempt score, percentage, and time taken",
          "Pass/fail indicator with color-coded scoring",
          "Aggregate stats: avg score, best score, total time, pass rate"
        ]
      },
      {
        name: "resources",
        label: "Learning Resources",
        description: "Downloadable lesson assets — PDFs, docs, reference sheets, and supplemental links.",
        group: "Assessment",
        purpose: "A centralized library of all lesson-attached materials, filterable by type, with direct download and external link access.",
        bullets: [
          "Filterable by asset type: PDF, doc, image, link",
          "File size shown with download button",
          "Organized by lesson and program grouping",
          "External resource links open in new tab"
        ]
      },
      {
        name: "sessions",
        label: "Practice Sessions",
        description: "Upcoming and past mentor practice session management.",
        group: "Sessions",
        purpose: "A dedicated area to track all practice sessions booked with an assigned mentor diviner.",
        bullets: [
          "Upcoming session countdown with join button",
          "Past session history with duration and notes",
          "Session status: confirmed, completed, cancelled",
          "Direct link to live video room when active"
        ]
      },
      {
        name: "lesson-view",
        label: "Lesson Reading View",
        description: "The focused lesson reading environment. When you open a specific lesson, this is what you see — the full lesson content rendered cleanly with all media, attachments, and a quiz at the bottom if required.",
        group: "Training",
        purpose: "This is where actual learning happens in the Trainee Academy. When you click on a lesson title from the Training Programs page, you enter this immersive reading view. The lesson content is displayed without distractions — just text, images, and embedded video. After reading, you scroll to the bottom to find any attached downloads and the optional or required quiz. The lesson is automatically marked as started the moment you open it, and marked complete when you pass the quiz or confirm you have finished.",
        bullets: [
          "Lesson content — the full written teaching with headings, images, and structured paragraphs",
          "Embedded video — some lessons include an instructional video embedded directly in the lesson body",
          "Downloadable attachments — PDF guides, reference sheets, and supplemental documents listed at the bottom",
          "In-lesson quiz — a quiz appears at the end of lessons that have one; must be passed to mark the lesson complete",
          "Lesson navigation — previous and next lesson buttons to move through the curriculum without going back to the list",
          "Completion status — the lesson header shows a green checkmark once it is fully complete",
          "Progress auto-save — if you close the page mid-lesson, your position is saved and you can resume later"
        ]
      },
      {
        name: "quiz-taking",
        label: "Quiz in Progress",
        description: "The quiz experience inside a lesson. Questions are presented one by one; you select your answer and submit. After all questions are answered, your score and pass/fail result appear immediately.",
        group: "Assessment",
        purpose: "Quizzes are the assessment mechanism of the Trainee Academy. After completing a lesson's reading material, you may be presented with a quiz to test your understanding before the lesson is marked complete. This page is the quiz interface — each question appears with multiple-choice answers, and you select what you believe is correct before moving to the next question. At the end, your score is calculated instantly and you either pass (lesson marked complete) or fail (you can retake after a short waiting period).",
        bullets: [
          "Question display — one question at a time, with 4 multiple-choice options to choose from",
          "Question counter — shows which question you are on and how many remain (e.g. Question 3 of 10)",
          "Select and confirm — click an answer option and a confirm button to lock in your response",
          "No going back — once an answer is confirmed, you move to the next question without changing",
          "Immediate results — after the last question, your score appears instantly with a pass or fail result",
          "Score breakdown — see which questions you got right and wrong, with the correct answer shown for each",
          "Retake if failed — if you do not pass, a retake button appears after a waiting period (set by training settings)"
        ]
      },
      {
        name: "mentor-session",
        label: "Mentor Practice Session",
        description: "A live video practice session with your assigned mentor diviner. These sessions are for guided learning, chart practice, feedback on readings, and one-on-one support for your training progress.",
        group: "Sessions",
        purpose: "Mentor sessions are the personalized coaching component of the Trainee Academy. Your mentor is an experienced diviner assigned to guide your development. Unlike a reading (where the client seeks guidance), a mentor session is about your growth as a practitioner — your mentor might observe you reading a chart and give feedback, answer your curriculum questions, help you interpret difficult placements, or give you practice readings to work through. These sessions are essential for developing real-world divination skills.",
        bullets: [
          "Video room — a secure, private HD video call between you and your assigned mentor",
          "Practice chart sharing — your mentor can share natal charts on screen for you to practice interpreting",
          "Session focus — each session should have a topic or focus area agreed before the call (e.g. House Interpretations, Aspect Analysis)",
          "Mentor feedback — your mentor provides real-time feedback on your interpretations and technique",
          "Session notes — after the session, your mentor may share written notes in your trainee profile",
          "Session recording — if both parties agree, the session can be recorded for later review",
          "Booking link — return to the Sessions page to book your next mentor session"
        ]
      },
      {
        name: "graduation",
        label: "Graduation Certificate",
        description: "Your official digital certificate from the School of Our Divine Infinite Being, issued automatically when you complete all 15 training programs. A professional, printable credential confirming your qualification as a trained diviner.",
        group: "Certification",
        purpose: "Graduation is the culmination of your Trainee Academy journey. When you have completed every required lesson across all 15 training programs and passed all associated quizzes, the platform automatically generates your Graduation Certificate. This is a formal, printable document bearing the school's name and seal, your full name, your graduation date, and a unique verification code. You can download it as a PDF, share a digital link, and it can be verified by anyone using the code.",
        bullets: [
          "Certificate preview — a beautifully designed certificate showing your name, the school name, and graduation date",
          "School seal — the official seal of the School of Our Divine Infinite Being appears on the certificate",
          "Unique certificate code — a verification code (e.g. CERT-BUKQOM-2026) printed on the certificate",
          "All 15 programs listed — every training program you completed is enumerated on the certificate",
          "Head Master acknowledgment — signed by Eddie Paredes as Head Master of the school",
          "Download as PDF — save a high-resolution, print-ready PDF version of your certificate",
          "Verification link — a public URL anyone can visit to verify the certificate is authentic and issued by the school"
        ]
      },
    ],
  },
  {
    role: "Client Portal",
    slug: "customer",
    tagline: "Personal readings and spiritual journey",
    roleDescription:
      "Your personal space as a client on AstrologyPro. Book astrology and tarot readings with professional diviners, manage your upcoming and past sessions, access recorded readings, track your orders and subscriptions, explore spiritual content, and maintain your personal birth chart profile — all from one secure portal.",
    icon: User,
    gradient: "from-emerald-500/20 to-green-600/10",
    featureAreas: ["Dashboard", "Bookings", "Orders", "Library", "Mundane", "Reviews", "Subscriptions", "Profile"],
    capabilities: [
      "See all your upcoming and past reading sessions on the dashboard",
      "View and manage every session you have booked — upcoming, completed, or cancelled",
      "See a complete history of everything you have purchased on the platform",
      "Access your personal library of recorded sessions and shared resources",
      "Explore world astrology — see what the planets are doing right now",
      "Leave reviews for practitioners after your sessions",
      "Manage active subscriptions and recurring reading plans",
      "Keep your personal profile and birth data up to date for accurate chart readings",
    ],
    keyPages: ["Dashboard", "My Bookings", "Order History", "Library", "Mundane Astrology", "My Reviews", "Subscriptions", "Profile"],
    groups: [
      {
        groupLabel: "My Sessions",
        cards: [
          { title: "Dashboard", description: "Your session overview and upcoming readings", href: "/portal", icon: LayoutDashboard, status: "live" },
          { title: "My Bookings", description: "All your sessions — upcoming and past", href: "/portal/bookings", icon: CalendarDays, status: "live" },
          { title: "Booking History", description: "Full session archive with rebook shortcut", href: "/portal/booking-history", icon: History, status: "live" },
          { title: "Saved Diviners", description: "Your favourite practitioners for quick rebooking", href: "/portal/favorites", icon: Heart, status: "live" },
        ],
      },
      {
        groupLabel: "Finance",
        cards: [
          { title: "Order History", description: "Every purchase and transaction", href: "/portal/orders", icon: ShoppingBag, status: "live" },
          { title: "Subscriptions", description: "Active recurring reading plans", href: "/portal/subscriptions", icon: RefreshCcw, status: "live" },
          { title: "Gift a Reading", description: "Purchase and send readings as gifts", href: "/portal/gift-cards", icon: Gift, status: "live" },
        ],
      },
      {
        groupLabel: "Explore & Engage",
        cards: [
          { title: "Library", description: "Recorded sessions and shared resources", href: "/portal/library", icon: BookOpen, status: "live" },
          { title: "Mundane Astrology", description: "Current planetary positions and world transits", href: "/portal/mundane", icon: Globe, status: "live" },
          { title: "My Reviews", description: "Reviews you have left for practitioners", href: "/portal/reviews", icon: Star, status: "live" },
        ],
      },
      {
        groupLabel: "My Account",
        cards: [
          { title: "Profile", description: "Personal details and birth data", href: "/portal/profile", icon: User, status: "live" },
        ],
      },
    ],
    screens: [
      {
        name: "dashboard",
        label: "Client Dashboard",
        description: "Your personal home screen as a client. See your upcoming sessions at a glance, any important notifications, and quick links to your bookings, library, and profile.",
        group: "My Sessions",
        purpose: "This is the first page you see when you log in as a client. It is designed to give you immediate visibility into what is happening next — your next reading, any messages from your diviner, and a summary of your recent activity. If you have a session tomorrow, it will be front and center here. You do not need to navigate anywhere to know what is coming up.",
        bullets: [
          "Next upcoming session — date, time, and diviner name for your next booked reading",
          "Session countdown — how many hours or days until your next session",
          "Recent bookings — a short list of your most recent sessions with status",
          "Notifications — any messages, booking confirmations, or updates from the platform or your diviner",
          "Quick links — shortcuts to My Bookings, Library, and Profile so you can navigate fast",
          "Account status — any alerts about your subscription, payment, or profile completeness"
        ]
      },
      {
        name: "bookings",
        label: "My Bookings",
        description: "The full list of every session you have ever booked — upcoming, completed, cancelled, and no-show. See session details, join an active session, or review a past reading.",
        group: "My Sessions",
        purpose: "My Bookings is your session history and upcoming appointment manager. Every time you book a reading with a diviner, it appears here. Upcoming sessions show a join button when it is time to enter the video room. Completed sessions show a link to the recording if one was made. This is the page to go to if you need to check when your next reading is, find a past session, or review details about an appointment.",
        bullets: [
          "Upcoming sessions — all confirmed future bookings with date, time, diviner, and service type",
          "Join session — when it is time for your session, a 'Join' button appears to enter the video room",
          "Past sessions — every completed reading with date, duration, and diviner name",
          "Session recordings — if your diviner recorded the session, access the replay from the booking",
          "Cancelled sessions — any sessions that were cancelled by you or the diviner",
          "Session notes — any notes your diviner shared with you after the reading",
          "Rebook — if you want to book again with the same diviner, a quick link to their booking page is included"
        ]
      },
      {
        name: "orders",
        label: "Order History",
        description: "A complete record of everything you have purchased on AstrologyPro — individual sessions, packages, gift certificates redeemed, and any other transactions.",
        group: "Finance",
        purpose: "Your Order History is your full purchase log. Every time you pay for a session or service on the platform, an order is created. This page shows you all your transactions — what you purchased, how much you paid, when the payment was processed, and the current status. If you ever have a question about a charge, this is the first place to look. You can also download PDF receipts from here.",
        bullets: [
          "All purchases — every session, package, and product you have bought, listed in order",
          "Payment status — whether an order is paid, refunded, or has a payment issue",
          "Order date — when the purchase was made",
          "Amount paid — the total you were charged for each order",
          "Service details — what type of reading or service was purchased in each order",
          "PDF receipt — download a formal receipt for any order for your records",
          "Refund status — if a refund was processed, see the amount and the date"
        ]
      },
      {
        name: "subscriptions",
        label: "My Subscriptions",
        description: "Manage any active recurring plans or subscription packages you have with diviners on the platform. See renewal dates, pause, or cancel subscriptions.",
        group: "Finance",
        purpose: "Some diviners offer subscription plans — for example, a monthly plan that includes a set number of readings each month at a discounted rate. If you have signed up for any recurring plan, it appears here. You can see when it renews, how many sessions you have used this cycle, and whether you want to continue or cancel. Subscriptions offer better value if you read regularly.",
        bullets: [
          "Active subscriptions — any recurring plans you are currently enrolled in",
          "Plan details — what is included in each subscription (number of sessions, session types, price)",
          "Renewal date — when the next charge will occur and how much it will be",
          "Sessions used — how many sessions you have used out of your subscription allowance this cycle",
          "Payment method — which card or account is being charged",
          "Cancel or pause — stop a subscription at any time (access continues until the billing period ends)",
          "Subscription history — past subscriptions you have had and when they were active"
        ]
      },
      {
        name: "library",
        label: "My Library",
        description: "A personal library of recorded sessions, resources shared by your diviner, and spiritual content curated for you. Access past readings, notes, and reading materials all in one place.",
        group: "Explore & Engage",
        purpose: "Your Library is a personal vault of everything your diviner has shared with you and all recorded sessions saved to your account. After a reading, your diviner may share reference materials, follow-up reading, or a recording of your session — it all goes into your Library. You can return to this content anytime to revisit insights, re-read materials, or watch a past session recording.",
        bullets: [
          "Session recordings — video recordings of your past readings if your diviner has enabled recording",
          "Shared resources — PDFs, articles, or links that your diviner shared with you after sessions",
          "Notes from readings — any written notes or insights your diviner shared as a post-session summary",
          "Organized by date — most recent content appears first so you can find the latest items quickly",
          "Playback controls — watch recordings with pause, rewind, and speed controls",
          "Download option — save recordings or documents to your own device for offline access",
          "Spiritual content — curated articles or wisdom pieces assigned to your profile by the platform"
        ]
      },
      {
        name: "mundane",
        label: "Mundane Astrology",
        description: "Explore the current positions of the planets and how global astrological events might be affecting the world — and you. A public-facing tool for understanding the cosmic weather.",
        group: "Explore & Engage",
        purpose: "Mundane astrology applies astrology to world events rather than individual people. This section gives you a window into the current planetary positions and what major astrological events are happening globally right now. Even if you are new to astrology, this page helps you understand the broader cosmic energy of the current moment — which is often the context your diviner will reference in your readings.",
        bullets: [
          "Current planetary positions — where every planet is right now in the zodiac",
          "Moon phase today — the current lunar phase and what it symbolically means",
          "Active transits — major planetary transits happening this week and this month",
          "Retrograde planets — which planets are currently in retrograde and what that generally affects",
          "Major upcoming events — eclipses, ingresses, and significant planetary alignments coming soon",
          "Plain language explanations — each transit or event is explained in simple terms, not complex astrology jargon",
          "Global forecast — a brief narrative about the collective energy of the current astrological climate"
        ]
      },
      {
        name: "reviews",
        label: "My Reviews",
        description: "All the reviews you have submitted for practitioners you have worked with. See published reviews, pending ones, and add a review after any completed session.",
        group: "Explore & Engage",
        purpose: "After a session with a diviner, you are invited to leave a review. Your review helps other clients decide who to book, and it gives your diviner valuable feedback. This page shows all the reviews you have written — whether they are published, pending moderation, or drafts. It also shows any sessions where you have not yet left a review, so you can add one when you feel ready.",
        bullets: [
          "All your reviews — every review you have submitted, organized by date",
          "Review status — whether each review is published, pending approval, or still a draft",
          "Star rating — the rating you gave the practitioner (1–5 stars)",
          "Session reference — which session and diviner the review is for",
          "Edit a review — update a published review if your opinion has changed",
          "Leave a new review — after any completed session, a prompt appears to submit your review",
          "Sessions awaiting review — see which past sessions you have not yet reviewed so you can follow up"
        ]
      },
      {
        name: "profile",
        label: "My Profile",
        description: "Your personal account profile — name, contact details, birth data, and security settings. Keep your birth data accurate for the most precise astrology readings.",
        group: "My Account",
        purpose: "Your Profile is your personal record on the platform. The most important part for astrology is your birth data — date of birth, exact time of birth, and place of birth. Diviners use this information to generate your natal chart and personalize your readings. If your birth time is wrong, your chart will be inaccurate. Keep your profile complete and up to date to get the most out of every session.",
        bullets: [
          "Personal details — your full name, display name, email address, and phone number",
          "Profile photo — a photo that appears in your profile and is visible to diviners you book",
          "Date of birth — your birth date used for natal chart and transit calculations",
          "Time of birth — the exact time you were born (as precise as possible for chart accuracy)",
          "Place of birth — your birth city and country, used to calculate your rising sign and house placements",
          "Password and security — change your password or update security settings",
          "Notification preferences — control which emails and alerts you receive from the platform"
        ]
      },
      {
        name: "discover",
        label: "Find a Diviner",
        description: "Browse and search the full directory of professional diviners available on AstrologyPro. Filter by specialty, language, price, availability, and rating to find the right reader for your needs.",
        group: "My Sessions",
        purpose: "If you want to book a reading but are not sure which diviner to choose, the Discover page is where you start. It shows every diviner who is currently accepting bookings, with their photo, specialty, rating, and price range. You can narrow down by what you need — for example, 'I want a natal chart reading under $100 from someone who also does tarot' — and the filters will show you the matching practitioners. From any profile you can read their bio, see their reviews, and click to book.",
        bullets: [
          "Full practitioner directory — all active diviners accepting bookings, displayed as cards with photo and rating",
          "Filter by specialty — narrow to specific reading types: natal chart, tarot, relationship, transit, mundane, etc.",
          "Filter by price range — set a minimum and maximum price to match your budget",
          "Filter by availability — see only diviners who have open slots in the next 7 days or today",
          "Sort by rating — see highest-rated practitioners first for a confidence-boosting choice",
          "Practitioner profile preview — hover or click a card to see a quick summary of the diviner's bio and reviews",
          "Book directly — from the search results, click to go straight to a diviner's booking page"
        ]
      },
      {
        name: "diviner-profile",
        label: "Diviner Public Profile",
        description: "The full public profile page for a specific diviner. Read their bio, see their services and prices, browse client reviews, check availability, and book a session — all from one page.",
        group: "My Sessions",
        purpose: "Before booking a reading, most clients want to learn about the diviner. The Diviner Profile page is that information hub. You can read the practitioner's bio and background, see their full list of services with descriptions and prices, read reviews from other clients, watch a video introduction if they have one, and check their real-time availability calendar. The book button at the top opens the booking flow.",
        bullets: [
          "Bio and background — the diviner's personal story, training, tradition, and approach to readings",
          "Services menu — all offered reading types with descriptions, duration, and price",
          "Client reviews — verified testimonials from past clients with star ratings and dates",
          "Video introduction — a short video where the diviner introduces themselves (if uploaded)",
          "Specialties and traditions — the astrological, tarot, or spiritual systems this diviner works with",
          "Real-time availability — click a service to see open time slots and pick one to book",
          "Contact — some diviners enable a message button for pre-booking questions"
        ]
      },
      {
        name: "video-session",
        label: "Video Session Room",
        description: "The client-side view of the live video reading. A clean, private room where you connect with your diviner face-to-face over HD video for your booked session.",
        group: "My Sessions",
        purpose: "When it is time for your session, you join the video room from your Bookings page. This is what you see when you enter — a full-screen video call with your diviner in a private, secure room. There are no distractions, no strangers, and no external software to download. The session happens right in your browser. You can see and hear your diviner clearly, use the in-session chat if you want to share something in text, and at the end both parties leave the room and the session is marked complete.",
        bullets: [
          "HD video call — crystal-clear video and audio between you and your diviner",
          "Private room — only you and your booked diviner can enter; the room is not shared with anyone else",
          "In-session chat — a text chat panel on the side for typing questions, receiving links, or sharing notes",
          "Session timer — a visible display showing how much time has elapsed in the session",
          "No download required — the session runs fully in your browser with no software to install",
          "Recording notice — if the diviner is recording the session, you are notified with a visible indicator",
          "Leave session — a button to cleanly end your side of the call when the reading is complete"
        ]
      },
      {
        name: "booking-history",
        label: "Booking History",
        description: "Your complete history of every session you have ever booked on AstrologyPro — past readings, upcoming appointments, and cancelled sessions. Find any reading instantly, access session notes your diviner left, download a PDF summary, or quickly rebook the same practitioner.",
        group: "My Sessions",
        purpose: "A permanent, searchable record of your entire reading history and the fastest way to rebook a diviner you loved.",
        bullets: [
          "Full session history — every booking ever made, sorted from most recent to oldest",
          "Upcoming appointments — confirmed future sessions with a countdown and a join button when the time comes",
          "Past session summary — date, diviner name, service type, duration, and completion status for each past reading",
          "Session notes — any written notes or insights your diviner shared after completing your reading",
          "PDF download — export a session summary as a PDF for your personal records or to share with someone",
          "Rebook shortcut — a one-click button on any past session to go directly to that diviner's booking page and schedule again",
          "Cancelled sessions — past cancellations are visible with the reason given and whether a refund was processed"
        ]
      },
      {
        name: "favorites",
        label: "Saved Diviners",
        description: "Your personal list of diviners you have saved or marked as a favourite. Keep track of practitioners you love, easily check their current availability, and rebook them without searching the directory again.",
        group: "My Sessions",
        purpose: "Your personal shortlist of trusted practitioners — so rebooking a diviner you love takes seconds, not minutes.",
        bullets: [
          "Saved practitioners — all diviners you have hearted or bookmarked, shown with their photo, name, and specialty",
          "Availability status — a live indicator showing whether your saved diviner is currently accepting bookings",
          "Quick book button — jump straight to their booking page from your favourites list without going through the directory",
          "Last booked — see when you last had a session with each saved practitioner",
          "Rating reminder — the diviner's current overall star rating is shown so you can compare before rebooking",
          "Remove from favourites — un-save a diviner if you no longer want them in your shortlist",
          "Add during discovery — you can save any diviner you see in the search results or on their profile with a single heart click"
        ]
      },
      {
        name: "gift-cards",
        label: "Gift a Reading",
        description: "Purchase and send a reading as a gift for someone you care about. Choose a practitioner, select a service, and the platform delivers a personalized gift certificate to the recipient by email. You can also see a history of gift cards you have sent and check if they have been redeemed.",
        group: "Finance",
        purpose: "Share the gift of a spiritual reading with a friend, partner, or family member — with a fully personalized digital gift certificate.",
        bullets: [
          "Choose a diviner — select a specific practitioner whose reading you want to gift, or leave the choice to the recipient",
          "Select a service — pick which type of reading to gift (natal chart, tarot, transit check-in, etc.) and the session duration",
          "Personalize the message — write a personal note that appears on the gift certificate delivered to the recipient",
          "Recipient email — enter the recipient's email address and the platform sends the certificate immediately or on a future date",
          "Gift certificate value — the certificate holds the monetary value of the chosen session; the recipient books directly",
          "Sent gift history — a log of all gift certificates you have sent with their redemption status (sent, opened, redeemed)",
          "Received gifts — if someone has gifted you a reading, it appears here ready to use for booking"
        ]
      },
    ],
  },
  {
    role: "Public Experience",
    slug: "public",
    tagline: "Platform discovery and visitor onboarding",
    roleDescription:
      "The first impression of AstrologyPro — marketing pages, practitioner discovery, and conversion flows designed to welcome and convert new visitors.",
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
      { 
        name: "home", 
        label: "Homepage", 
        description: "Main entry point with premium astrology branding.", 
        group: "Marketing",
        purpose: "The primary brand gateway for AstrologyPro, designed to educate and inspire new visitors.",
        bullets: [
          "Premium spiritual branding and value proposition",
          "Dynamic role discovery and platform features",
          "Interactive 'Spiritual Pulse' live clock",
          "High-conversion 'Join Community' entry points"
        ]
      },
      { 
        name: "discover", 
        label: "Diviner Discovery", 
        description: "Search interface for finding practitioners.", 
        group: "Discovery",
        purpose: "A powerful, intuitive search and filter engine for clients to find their ideal spiritual guide.",
        bullets: [
          "Specialty and spiritual tradition filtering",
          "Real-time availability and booking status",
          "Review-based practitioner sorting",
          "Price-range and role-based discoverability"
        ]
      },
      { 
        name: "profile", 
        label: "Practitioner Profile", 
        description: "Public page for a diviner.", 
        group: "Discovery",
        purpose: "A high-conversion professional profile for diviners to showcase their wisdom and book new clients.",
        bullets: [
          "Integrated booking and availability engine",
          "Detailed service and specialty listings",
          "Social proof through client testimonials",
          "Esoteric specialties and credentials summary"
        ]
      },
      { 
        name: "checkout", 
        label: "Booking Checkout", 
        description: "Payment and scheduling flow.", 
        group: "Discovery",
        purpose: "A friction-less, multi-step flow for selecting a session time and completing secure payment.",
        bullets: [
          "Integrated calendar for immediate booking",
          "Stripe-powered secure payment processing",
          "Natal data capture for first-time clients",
          "Automated confirmation and invite generation"
        ]
      },
      { 
        name: "blog", 
        label: "Blog Index", 
        description: "Grid of latest articles.", 
        group: "Marketing",
        purpose: "The platform's public wisdom hub, featuring spiritual insights, transit reports, and community news.",
        bullets: [
          "Category-based spiritual content navigation",
          "Latest transit and celestial event reports",
          "SEO-optimized author and expert profiles",
          "Newsletter signup and engagement CTAs"
        ]
      },
      { 
        name: "join", 
        label: "Registration Hub",
        description: "The membership selection page where visitors choose how to join AstrologyPro — as a client, a Perennial Mandalism member, a Mystery School student, or a diviner. Each path has a clear description and an enrollment button.",
        group: "Onboarding",
        purpose: "The Join page is the entry point for anyone who decides to become part of AstrologyPro. It presents each available membership path clearly so visitors can choose what fits them. A client can sign up to book readings. A community member can join the Perennial Mandalism program. A diviner can apply to offer readings. Each option shows what is included and leads into that role's onboarding flow.",
        bullets: [
          "Role selection — clearly presented options for Client, Community Member, Diviner, and Trainee",
          "What is included — each path shows a bullet list of what the membership includes",
          "Price clarity — Perennial Mandalism plans show their prices ($19.95/mo Individual, $34.95/mo Family)",
          "Get started button — clicking any option takes the visitor to registration and onboarding for that role",
          "Already a member login — a visible link to the login page for returning members",
          "School overview — brief description of the School of Our Divine Infinite Being for new visitors",
          "No commitment framing — wording designed to reduce friction and encourage enrollment"
        ]
      },
      {
        name: "about",
        label: "About the School",
        description: "The public-facing About page for AstrologyPro and the School of Our Divine Infinite Being. Introduces the school's philosophy, the Head Master, the teaching tradition, and what makes this platform different from other astrology resources.",
        group: "Marketing",
        purpose: "Before someone joins a spiritual school, they want to know who is teaching and why this school exists. The About page tells that story. It introduces Eddie Paredes as the Head Master, explains the tradition the school operates in (the 36 decans system, esoteric Western astrology, sacred ritual practice), and describes what a student or community member can expect from the experience. It builds trust and emotional connection with prospective members.",
        bullets: [
          "School mission — the purpose and philosophy behind the School of Our Divine Infinite Being",
          "Head Master bio — Eddie Paredes' background, lineage, and teaching philosophy",
          "The tradition — an overview of the esoteric and astrological tradition the school teaches",
          "Community values — what the Perennial Mandalism community stands for and how members are expected to engage",
          "The 15 programs — a brief overview of the training curriculum and what graduates receive",
          "Contact and social links — how to reach the school and follow its channels",
          "Call to action — a prominent invitation to join the school or book a reading"
        ]
      },
      {
        name: "pricing",
        label: "Pricing & Plans",
        description: "A dedicated pricing page comparing all available memberships and services on AstrologyPro — Perennial Mandalism plans, Mystery School enrollment, and how client readings are priced.",
        group: "Marketing",
        purpose: "Transparent pricing is a key conversion factor — visitors who cannot easily find pricing often leave without joining. This page answers the question 'how much does this cost?' clearly for every offering. It compares the Individual and Family PM plans side by side, explains how the Mystery School subscription works, and helps potential clients understand that reading prices vary by diviner (with links to the discovery page to find options in their price range).",
        bullets: [
          "Perennial Mandalism plans — Individual ($19.95/mo) and Family ($34.95/mo) compared side by side",
          "Plan features comparison — what each plan includes, what is different between them",
          "Mystery School pricing — how the school subscription works and what is included",
          "Diviner reading prices — an explanation that reading prices are set by each individual diviner",
          "Diviner price range — a general guide to what readings typically cost on the platform",
          "No hidden fees — clarity on what is and is not included in each tier",
          "FAQ section — answers to common pricing questions (Can I cancel? Is there a free trial? etc.)"
        ]
      },
      {
        name: "testimonials",
        label: "Platform Testimonials",
        description: "A curated public wall of testimonials and success stories from clients, PM members, Mystery School graduates, and diviners who have experienced the platform. Builds trust for new visitors.",
        group: "Marketing",
        purpose: "Social proof is one of the most powerful conversion tools for a spiritual platform. Seeing real people share genuine experiences creates trust in a way that marketing copy cannot. The Testimonials page collects the best reviews and stories from across the platform — clients who had breakthrough readings, trainees who graduated and found their practice, PM members who describe how the community changed their spiritual life. New visitors read these before deciding to join.",
        bullets: [
          "Client testimonials — reviews from people who have had readings and found them transformative",
          "PM member stories — experiences from Perennial Mandalism community members",
          "Graduate testimonials — reflections from trainees who completed the academy and received their certificate",
          "Diviner success stories — practitioners who built their practice through the platform",
          "Star ratings — each testimonial includes the star rating given by the reviewer",
          "Verified badge — testimonials from verified accounts are marked as confirmed by the platform",
          "Filter by role — visitors can filter testimonials to see only those relevant to their interest"
        ]
      },
    ],
  },
];

export const PLATFORM_FEATURES: FeatureCard[] = [
  {
    title: "Your Branded Landing Page",
    description: "Get your own professional page at astrologypro.com/username. Customize your profile and showcase specialties.",
    href: "/features",
    icon: Globe,
    status: "live",
    roleSlugs: ["public", "diviner"],
    bullets: [
      "Personalized URL you can share anywhere",
      "Customizable bio, photo, and service descriptions",
      "Client testimonial display with star ratings",
      "Mobile-optimized responsive design",
    ],
    screenshots: ["public/home", "diviner/overview"],
  },
  {
    title: "HD Video Consultations",
    description: "Conduct professional readings over crystal-clear HD video with screen sharing for natal charts.",
    href: "/features",
    icon: Play,
    status: "live",
    roleSlugs: ["diviner", "customer"],
    bullets: [
      "HD video with screen sharing for charts and cards",
      "Automatic session recording for every consultation",
      "Shareable replay links for clients to revisit",
      "No software downloads required — browser-based",
    ],
    screenshots: ["admin/video_sessions", "diviner/broadcast"],
  },
  {
    title: "Smart Booking System",
    description: "Timezone-aware scheduling system that syncs with your calendar and collects birth data.",
    href: "/features",
    icon: CalendarDays,
    status: "live",
    roleSlugs: ["public", "diviner", "customer"],
    bullets: [
      "Google Calendar and Outlook integration",
      "Automatic timezone detection and conversion",
      "Custom intake questionnaires per service type",
      "Birth data collection at booking",
    ],
    screenshots: ["admin/bookings", "diviner/calendar", "public/checkout"],
  },
  {
    title: "Secure Payments",
    description: "Accept payments seamlessly through Stripe with automatic billing for session overages.",
    href: "/features",
    icon: CreditCard,
    status: "live",
    roleSlugs: ["admin", "diviner", "customer"],
    bullets: [
      "Stripe-powered secure checkout",
      "Automatic overage billing for extended sessions",
      "Instant payouts to connected bank accounts",
      "Detailed transaction history and reporting",
    ],
    screenshots: ["admin/payments", "diviner/payouts"],
  },
  {
    title: "Client Management (CRM)",
    description: "Keep all your client information, birth data, and session history organized in one place.",
    href: "/features",
    icon: Users,
    status: "live",
    roleSlugs: ["admin", "diviner"],
    bullets: [
      "Secure birth data storage for every client",
      "Complete session history with notes and recordings",
      "Private practitioner notes per client",
      "Relationship tracking and follow-up reminders",
    ],
    screenshots: ["admin/users", "diviner/client-detail"],
  },
  {
    title: "Professional Astrology Tools",
    description: "Access full chart calculation software for natal, synastry, and transit reports.",
    href: "/features",
    icon: Sparkles,
    status: "live",
    roleSlugs: ["admin", "community", "mystery-school"],
    bullets: [
      "Western natal chart calculation engine",
      "Synastry and composite chart generation",
      "Real-time transit tracking and overlays",
      "Solar and lunar return chart calculations",
    ],
    screenshots: ["admin/chart_studio", "community/natal", "community/transits"],
  },
  {
    title: "Tarot Reading Tools",
    description: "Perform professional tarot readings with multiple spread types and high-res card imagery.",
    href: "/features",
    icon: Layers,
    status: "live",
    roleSlugs: ["admin", "diviner"],
    bullets: [
      "Multiple spread types: 3-card, Celtic Cross, and more",
      "Professional high-resolution card imagery",
      "Screen-share-ready card display",
      "Custom spread builder for personalized layouts",
    ],
    screenshots: ["admin/tarot_cards", "admin/tarot_spreads"],
  },
  {
    title: "Social Media Marketing",
    description: "Auto-post content to social channels and track engagement with built-in tools.",
    href: "/features",
    icon: Zap,
    status: "live",
    roleSlugs: ["admin", "social_advo"],
    bullets: [
      "Auto-posting to Instagram, YouTube, TikTok",
      "Pre-made content library with astrological themes",
      "Customizable post templates and scheduling",
      "Track engagement and follower growth",
    ],
    screenshots: ["admin/campaigns", "admin/social_advocacy"],
  },
  {
    title: "Affiliate Program",
    description: "Turn your clients into ambassadors with custom referral links and commission tracking.",
    href: "/features",
    icon: Users,
    status: "live",
    roleSlugs: ["admin", "social_advo"],
    bullets: [
      "Custom referral links for each affiliate",
      "Configurable commission rates and structures",
      "Real-time referral tracking and attribution",
      "Comprehensive reporting dashboard",
    ],
    screenshots: ["admin/report_affiliates", "social_advo/advocate-home"],
  },
  {
    title: "Mundane Hub",
    description: "Global governance of geopolitical astrology and mundante chart studios.",
    href: "/features",
    icon: Globe,
    status: "live",
    roleSlugs: ["admin"],
    bullets: [
      "Manage worldly entities and historical charts",
      "Interactive world map with planetary strength",
      "Ephemeris search and transit forecasting",
      "Prophetic forecast management",
    ],
    screenshots: ["admin/mundane_dashboard", "admin/world_map", "admin/forecasts_v2"],
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
