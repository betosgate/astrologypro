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
      { name: "affiliates_v2", label: "Affiliates", description: "Tracking of platform growth partners.", group: "People" },
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
      { name: "blog_analytics", label: "Blog Analytics", description: "Performance tracking for editorial content.", group: "Content" },
      // { name: "blog_cta_blocks", label: "Conversion Blocks", description: "Manage CTAs injected into blog posts.", group: "Content" },
      { name: "blog_categories_v2", label: "Blog Categories", description: "Management of blog categories and tags.", group: "Content" },
      { name: "blog_authors_v2", label: "Blog Authors", description: "Management of guest and staff writers.", group: "Content" },
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
      { name: "video_sessions", label: "Recorded Sessions", description: "Repository of archived video readings.", group: "Content" },
      { name: "webinars_v2", label: "Webinar Hub", description: "Scheduling and management of live events.", group: "Content" },
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
      { name: "wheel_signs_v2", label: "Wheel Signs", description: "Definition and config of zodiac attributes.", group: "Astrology" },
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
      { name: "mundane_entities_v2", label: "Entities", description: "Mapping of nations and locations for charts.", group: "Astrology" },
      { name: "forecasts_v2", label: "Forecasts", description: "Management of high-level temporal forecasts.", group: "Astrology" },
      { name: "event_calendar_v2", label: "Event Calendar", description: "Scheduler for major cosmic alignments.", group: "Astrology" },
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
      { name: "mundane_search_v2", label: "Mundane Search", description: "Searchable database of planetary positions.", group: "Astrology" },
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

// ---------Solar Return----------------//

{
  "name": "horoscope_solar_setup_v1",
  "label": "Solar Return: Annual Chart Setup",
  "description": "Enter your birth details to generate your yearly solar return reading step by step.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This is the entry form for the Solar Return module. The user first enters date of birth, time of birth, and place of birth. These three details are required because the system must calculate the exact natal Sun position and then find the precise moment in the selected year when the Sun returns to that same position. Once the required fields are filled, the Generate Reading button becomes active. After that, the platform starts generating the Solar Return chart step by step, including the wheel chart, planet information, house cusps, house information, planet aspects, interpretations, deep analysis, and yearly insights. This setup screen is important because even a small change in time or location can change houses, angles, and yearly focus, so accurate birth input is required for an astrologer-friendly annual reading.",
  "bullets": [
    "📅 Step 1 — Date of Birth Input: The user enters the birth date so the system can identify the natal Sun position and birth chart foundation.",
    "🕒 Step 2 — Time of Birth Input: The user enters the exact birth time because house positions, Ascendant, and yearly angle calculations depend on precise timing.",
    "📍 Step 3 — Place of Birth Input: The user enters the birth location so the chart can be calculated with correct geographic coordinates and timezone accuracy.",
    "📝 Step 4 — Area of Inquiry (Optional): The user may enter a focus topic such as career, love, family, or personal growth so the reading can feel more guided and relevant.",
    "✅ Step 5 — Generate Button Enable Logic: The Generate Reading button stays disabled until the required birth fields are completed correctly.",
    "☀ Step 6 — Natal Reference Calculation: After clicking Generate, the system first creates the natal birth reference and identifies the original Sun degree and position.",
    "🔁 Step 7 — Solar Return Moment Detection: The engine finds the exact yearly moment when the Sun returns to its natal zodiac position.",
    "🪐 Step 8 — Solar Return Chart Creation: The system generates the Solar Return wheel chart for the selected return year using the calculated return moment.",
    "📊 Step 9 — Planet Information Generation: The platform lists the planets, signs, degrees, houses, speeds, and retrograde conditions for the solar return year.",
    "🏠 Step 10 — House Cusps and House Information: The system calculates Ascendant, Midheaven, Vertex, and all 12 house cusps, then maps planets into the correct houses.",
    "🔗 Step 11 — Planet Aspect Analysis: The engine checks aspect relationships between Solar Return planets and natal planets to detect yearly opportunities, tensions, and triggers.",
    "💬 Step 12 — Interpretation Generation: The platform converts technical chart data into readable interpretations for planets, houses, aspects, and annual themes.",
    "🧠 Step 13 — Deep Astrological Analysis: The user can open deeper analysis screens for planets, houses, and aspects to understand the psychology and yearly meaning in more detail.",
    "🖼 Step 14 — Picture Representation: Visual symbolic panels are generated to help astrologers understand the combined meaning of planet, sign, house, or aspect more easily.",
    "🚀 Step 15 — Final Yearly Reading Output: The complete Solar Return reading is shown in step-by-step sections so astrologers and users can study the annual forecast in a structured way."
  ]
},

  {
  "name": "horoscope_solar_setup",
  "label": "Solar Return: Annual Chart Setup",
  "description": "Your yearly solar return chart is being prepared from your birth details and selected return year.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "A Solar Return chart is a powerful yearly forecast chart created for the exact moment the Sun returns to the same zodiac degree and minute it held at your birth. By using your date of birth, time of birth, place of birth, and the selected return year and location, this chart reveals the major themes, opportunities, emotional patterns, personal growth areas, relationship focus, and career direction for the coming solar year. It helps astrologers quickly understand what the year is likely to emphasize and where the strongest life developments may unfold.",
  "bullets": [
    "☀ Exact Solar Return Calculation — Determines the precise moment the Sun returns to its natal position for the selected year.",
    "📍 Location-Based Chart Casting — Uses birth details and return location to generate the most accurate annual wheel chart.",
    "🗓 Year Theme Forecast — Highlights the dominant influences, challenges, and opportunities for the upcoming birthday year.",
    "🏠 House Activation Analysis — Shows which life areas such as career, relationships, home, and finances are most emphasized.",
    "🔭 Astrologer-Friendly Wheel View — Presents the solar return chart in an easy-to-read format for quick interpretation and deeper yearly insights."
  ]
},


    {
  "name": "horoscope_solar_synthesis_v1",
  "label": "Solar Return: Yearly Themes & Planet Table",
  "description": "Your annual solar return chart is translated into a structured planetary table for quick interpretation.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after the user enters date of birth, time of birth, place of birth, and selects the solar return year and return location. The system calculates the exact moment when the Sun returns to the same zodiac degree it occupied at birth. From that exact return moment, a new yearly chart is cast and converted into an astrologer-friendly table. This table helps astrologers and advanced users quickly understand where each planet is placed in the solar return chart, which house it activates, which zodiac sign it occupies, how fast it is moving, and whether it is retrograde. It is used to identify the strongest themes of the year, such as relationship focus, career movement, emotional development, financial shifts, inner transformation, and major life priorities.",
  "bullets": [
    "☀ Solar Return Generation Logic — Uses birth date, birth time, and birth place to calculate the natal Sun position, then finds the exact yearly return of the Sun for the selected year.",
    "📍 Accurate Chart Casting — Builds the Solar Return chart for the chosen return location so astrologers can study how relocation changes the yearly influences.",
    "🪐 Planet-by-Planet Interpretation — Displays each planet's yearly placement to show which energies become most active during the solar year.",
    "🏠 House Activation Mapping — Reveals the life area influenced by each planet, such as identity, money, communication, family, romance, work, partnership, travel, or career.",
    "🔁 Motion & Retrograde Insight — Shows planetary speed and retrograde condition so astrologers can judge whether the year's energy flows directly, slowly, or inwardly.",
    "📊 Table Header Meaning — Planet: the celestial body being analyzed; House: the life area where the planet acts during the year; Full Degree: the exact zodiacal longitude of the planet; Sign: the zodiac sign the planet occupies; Norm Degree: the normalized degree within the sign; Speed: the daily motion rate of the planet; Retro?: shows whether the planet is retrograde or moving direct.",
    "🧭 Ascendant-of-the-Year Focus — Includes the Solar Return Ascendant to define the personal tone, attitude, and external style of the entire year.",
    "✨ Practical Annual Reading Tool — Helps astrologers quickly detect yearly priorities, strong planetary clusters, repeated natal triggers, and major developmental themes."
  ]
},
    
{
  "name": "horoscope_solar_processing",
  "label": "Solar Return: Generating Your Yearly Reading",
  "description": "Your annual solar return chart and planet interpretations are being prepared.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "After the user enters date of birth, time of birth, and place of birth, the system first creates the natal birth reference from those details. Then it calculates the exact moment in the selected year when the Sun returns to the same zodiac position it held at birth. Using that return moment and the selected location, the Solar Return chart is generated. From this chart, the system reads the sign, house, and condition of each planet and then creates easy-to-understand yearly interpretations. This screen is used to explain how each planet may influence the year ahead in areas such as confidence, emotions, communication, relationships, work, money, creativity, and personal growth. It helps astrologers read the year quickly and also helps normal users understand the meaning in simple language.",
  "bullets": [
    "☀ Birth Data Input — Uses the user's date of birth, time of birth, and place of birth to calculate the natal Sun position and create the base chart.",
    "🕒 Exact Solar Return Timing — Finds the precise moment in the selected year when the Sun returns to its original natal degree and minute.",
    "📍 Location-Based Calculation — Generates the Solar Return chart for the selected return location, because location can change house placements and yearly focus.",
    "🪐 Planet Interpretation Generation — Reads each planet's yearly sign and house placement, then converts that data into text interpretations for the user.",
    "🏠 Life Area Focus — Shows which areas of life will be most active during the year, such as self-image, family, love, health, career, travel, or finances.",
    "💬 Easy Reading Screen — Displays planet-by-planet meanings, such as Mars for action and drive, Mercury for thinking and communication, Venus for love and harmony, and other planets for their yearly influence.",
    "🔁 Annual Theme Analysis — Identifies the strongest themes, repeating patterns, inner lessons, and growth opportunities for the coming solar year.",
    "✨ Why This Screen Is Useful — It turns complex astrological calculations into simple yearly guidance so both astrologers and general users can understand the forecast more easily."
  ]
},
   {
  "name": "horoscope_solar_analytics_v1",
  "label": "Solar Return: House Cusps & Annual Analytics",
  "description": "A technical yearly table showing the Solar Return angles and all 12 house cusp positions.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after the user enters date of birth, time of birth, and place of birth, then selects the Solar Return year and return location. The system first calculates the natal Sun position, then finds the exact moment in the selected year when the Sun returns to that same zodiac position. From that precise moment, it creates the Solar Return chart and calculates the angles and all 12 house cusps. This table is used to show how the year's life areas are divided and where each house begins. It helps astrologers understand which parts of life will be emphasized during the solar year, such as identity, money, communication, home, creativity, work, relationships, travel, career, friendships, and inner growth. The house cusp table is important because even small changes in time or location can shift the house structure and change the meaning of the yearly forecast.",
  "bullets": [
    "☀ How It Is Generated — Uses the user's birth date, birth time, and birth place to find the natal Sun position, then calculates the exact Solar Return moment for the selected year and casts the chart for the chosen location.",
    "🕒 Why Timing Matters — House cusps depend heavily on exact time and location, so precise calculations are needed to produce the correct annual chart structure.",
    "🏠 What This Table Means — The table shows the starting point of each of the 12 houses in the Solar Return chart, helping define which life areas become active during the year.",
    "🧭 Ascendant Meaning — The Ascendant is the rising sign of the Solar Return chart and shows the overall approach, personality tone, and outer style of the year.",
    "🏆 Midheaven Meaning — The Midheaven shows public life, career direction, status, ambition, achievement, and what the year is building toward in the outside world.",
    "✨ Vertex Meaning — The Vertex is a sensitive point often linked with important meetings, fated contacts, turning points, and meaningful experiences during the year.",
    "📊 House Column Meaning — The House column lists House 1 through House 12, showing each life department of the Solar Return year.",
    "♈ Sign Column Meaning — The Sign column shows which zodiac sign begins each house, explaining the style or tone through which that life area will operate.",
    "📐 Degree Column Meaning — The Degree column shows the exact zodiac degree where that house cusp begins, which is useful for precise astrological analysis and advanced interpretation.",
    "🔍 Why Each Header Is Used — Ascendant gives the personal yearly tone, Midheaven shows career/public direction, Vertex shows significant encounters, House identifies the life area, Sign describes how that area expresses itself, and Degree provides exact measurement for professional chart reading.",
    "🔄 Why This Screen Is Useful — It helps astrologers study annual house emphasis, compare Solar Return houses with natal houses, identify major focus zones for the year, and detect how relocation or exact return timing changes the yearly life pattern.",
    "🚀 Practical Interpretation Value — With this table, an astrologer can quickly see whether the year is more focused on self-development, family matters, relationships, work, finances, travel, reputation, or spiritual growth."
  ]
},

{
  "name": "horoscope_solar_planet_interpretations",
  "label": "Solar Return: Planet-by-Planet Interpretations",
  "description": "Detailed yearly meanings for each planetary placement in the Solar Return chart.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after the user provides date of birth, time of birth, and place of birth, along with the selected solar return year and location. The system calculates the exact Solar Return moment and builds the yearly chart. It then analyzes each planet individually by combining its zodiac sign and house placement to generate clear, easy-to-read interpretations. Each block explains how that specific planet will influence the user's behavior, emotions, decisions, relationships, work, and personal growth throughout the year. This format allows astrologers to quickly read each planetary influence separately while also helping general users understand the meaning in a simple and structured way.",
  "bullets": [
    "☀ How It Is Generated — Uses birth details to calculate the Solar Return chart and determine each planet’s sign and house placement for the year.",
    "🪐 Planet-by-Planet Breakdown — Each section focuses on one planet (Sun, Moon, Mars, etc.) and explains its specific yearly influence.",
    "♈ Sign Influence — Shows how the zodiac sign shapes the expression of the planet (e.g., Libra adds balance, Aquarius adds innovation, Cancer adds emotion).",
    "🏠 House Influence — Explains the life area where the planet’s energy will be most active (e.g., 1st house = self, 6th = work/health, 11th = friendships).",
    "🔗 Combined Interpretation — Merges planet + sign + house into a meaningful yearly prediction for real-life understanding.",
    "💬 Simple Explanation Style — Written in easy language so both astrologers and normal users can quickly understand the message.",
    "📖 Expandable Content (Show More) — Provides a short summary first, with an option to expand and read deeper insights.",
    "🎯 Life Impact Insight — Helps identify where energy will be focused, such as identity (Sun), emotions (Moon), action (Mars), communication (Mercury), and relationships (Venus).",
    "⚖️ Balanced Guidance — Highlights both positive opportunities and possible challenges for each planetary placement.",
    "🔄 Yearly Theme Building — When all planets are read together, they form the complete story of the Solar Return year.",
    "✨ Why This Section Is Useful — Allows astrologers to quickly interpret each planetary influence without manually analyzing the full chart.",
    "🚀 Practical Use — Useful for yearly predictions, client consultations, self-awareness, and planning important life decisions."
  ]
},

{
  "name": "horoscope_solar_deep_analysis_v1",
  "label": "Solar Return: Deep Astrological Analysis",
  "description": "In-depth interpretation of planetary placements with visual and psychological insights.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after the Solar Return chart is calculated using the user's date of birth, time of birth, place of birth, and selected return year and location. The system analyzes each planet's placement by combining three key factors: the planet itself, the zodiac sign it is in, and the house it occupies. It then produces a deep, easy-to-understand interpretation explaining how that specific combination will influence the user's personality, behavior, decisions, and life direction during the year. This section is especially useful for astrologers because it translates technical chart data into meaningful psychological and practical insights, while also supporting visual understanding through symbolic image representation.",
  "bullets": [
    "☀ Planet + Sign + House Synthesis — Combines the planet (what energy), sign (how it behaves), and house (where it acts) to create a complete yearly interpretation.",
    "🧠 Psychological Interpretation — Explains how the placement influences mindset, emotions, personality traits, and behavioral patterns during the year.",
    "🎯 Life Focus Explanation — Highlights the main areas of life affected, such as identity, relationships, career, communication, or personal growth.",
    "💬 Easy-to-Understand Narrative — Converts complex astrological data into simple, readable text so both astrologers and general users can understand it clearly.",
    "🪐 Example Insight — 'Sun in Libra in 1st House' shows a year focused on self-identity, social charm, balance, and how others perceive you.",
    "🖼 Visual Representation — Displays a symbolic diagram that breaks down the meaning of the sign, house, and their combined influence for faster understanding.",
    "♈ Sign Meaning Layer — Explains the qualities of the zodiac sign (e.g., Libra = balance, harmony, relationships, diplomacy).",
    "🏠 House Meaning Layer — Explains the life area (e.g., 1st House = self, personality, appearance, first impressions).",
    "🔗 Combined Meaning — Shows how sign and house energies merge (e.g., Libra traits expressed through personal identity and self-image).",
    "✨ Why This Section Is Important — Helps astrologers quickly interpret yearly influences without manually combining multiple chart factors.",
    "📊 Practical Use — Useful for client readings, yearly forecasting, personality insights, and identifying key opportunities and challenges.",
    "🚀 Outcome — Provides a clear understanding of how each planetary placement shapes the overall theme and experience of the solar return year."
  ]
},

{
  "name": "horoscope_solar_aspects_v1",
  "label": "Solar Return: Planetary Aspects Analysis",
  "description": "Relationship dynamics between Solar Return planets and natal planets for yearly influence.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after the user enters date of birth, time of birth, and place of birth, and selects the solar return year. The system calculates both the natal chart and the Solar Return chart, then compares the positions of planets between the two charts. It identifies 'aspects' (angular relationships) between Solar Return planets and natal planets. These aspects show how the energy of the current year interacts with the user's core personality and life patterns. This table is very important for astrologers because it reveals the dynamic influences, challenges, opportunities, and key events that may unfold during the year.",
  "bullets": [
    "☀ How It Is Generated — Calculates natal chart from birth data and Solar Return chart from the yearly Sun return, then compares planetary positions between both charts.",
    "🔗 What Are Aspects — Aspects are angular relationships between planets that show how energies interact (supportive, challenging, or neutral).",
    "🪐 SR Planet Column — Shows the planet from the Solar Return chart representing current year energy and temporary influences.",
    "🌌 Natal Planet Column — Shows the planet from the birth chart representing the user's core personality and long-term traits.",
    "📐 Type Column — Displays the type of aspect such as Conjunction (strong focus), Sextile (opportunity), Trine (ease), or Opposition (tension or balance).",
    "📏 Orb Column — Shows how close the aspect is in degrees; smaller orb means stronger and more impactful influence.",
    "⚖️ Interpretation Meaning — Each aspect explains how current year events interact with personal tendencies, creating growth, pressure, or opportunity.",
    "🔥 Dynamic Energy Mapping — Helps identify where action, emotion, communication, or transformation will be activated during the year.",
    "🧠 Psychological Impact — Reveals inner conflicts, motivations, emotional triggers, and mental patterns influenced by the year's planetary movement.",
    "🎯 Event Trigger Indicators — Strong aspects often correlate with important life events, decisions, or turning points.",
    "🔄 Why This Table Is Useful — Allows astrologers to quickly see how the current year modifies the natal chart without manually calculating aspects.",
    "🚀 Practical Use — Used for yearly forecasting, understanding challenges vs opportunities, and guiding personal or professional decisions."
  ]
},
{
  "name": "horoscope_solar_aspect_interpretations",
  "label": "Solar Return: Aspect Interpretations",
  "description": "Detailed explanations of how planetary aspects influence your solar year.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after calculating both the natal chart and the Solar Return chart using the user's date of birth, time of birth, and place of birth. The system identifies aspects (angular relationships) between planets and then creates detailed interpretations for each aspect. These interpretations explain how different planetary energies interact during the year, showing areas of harmony, tension, growth, confusion, opportunity, or transformation. This helps astrologers and users understand how combined planetary forces shape real-life experiences, emotions, decisions, and events throughout the solar year.",
  "bullets": [
    "☀ How It Is Generated — Uses birth data to create natal and Solar Return charts, then detects aspects between planets and generates interpretation text for each.",
    "🔗 Aspect Combination Meaning — Each interpretation explains the interaction between two planets (e.g., Uranus vs Neptune, Mercury vs Jupiter).",
    "📐 Aspect Type Insight — Shows how the relationship behaves: Conjunction (intense focus), Sextile (opportunity), Trine (ease), Opposition (tension or balance).",
    "🪐 Planet Pair Influence — Explains how two planetary energies combine and affect thoughts, emotions, actions, or life direction.",
    "🧠 Psychological Impact — Describes inner feelings like confusion, clarity, stress, motivation, inspiration, or emotional shifts.",
    "🎯 Real-Life Effects — Connects planetary aspects to real situations such as career changes, relationships, learning, travel, or personal growth.",
    "💬 Easy Narrative Format — Written in simple language so both astrologers and general users can easily understand the meaning.",
    "📖 Expandable Reading (Show More) — Displays short summaries with an option to expand into deeper, more detailed insights.",
    "⚖️ Balanced Interpretation — Highlights both positive opportunities and possible challenges within each aspect.",
    "🔄 Yearly Theme Building — Multiple aspect interpretations combine to form the overall story of the solar return year.",
    "✨ Why This Section Is Important — Helps astrologers quickly interpret complex planetary relationships without manual calculation.",
    "🚀 Practical Use — Useful for forecasting major events, understanding emotional and mental patterns, and guiding decisions throughout the year."
  ]
},

{
  "name": "horoscope_solar_aspect_deep_analysis",
  "label": "Solar Return: Deep Aspect Analysis",
  "description": "In-depth interpretation of specific planetary aspects with psychological and visual insights.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after the system calculates the Solar Return chart using the user's date of birth, time of birth, and place of birth. It identifies strong planetary aspects (such as Opposition, Conjunction, Trine, or Sextile) and provides a deep-dive interpretation for each one. Unlike basic aspect descriptions, this section explains the inner psychological tension, transformation, and life direction created by the interaction between two planets. It helps astrologers and users understand not just what will happen, but why it happens and how to navigate it effectively during the year.",
  "bullets": [
    "☀ How It Is Generated — Uses birth data to calculate the Solar Return chart, detects strong planetary aspects, and selects the most impactful ones for deep analysis.",
    "🔗 Aspect Focus — Each block focuses on one major aspect (e.g., Uranus Opposition Neptune) and explains its deeper meaning.",
    "🪐 Planet Energy Interaction — Describes how two planetary forces interact (e.g., Uranus = change, Neptune = spirituality), creating tension or harmony.",
    "⚖️ Opposition Meaning — Explains the balance between two opposing energies, often creating inner conflict, growth pressure, or major turning points.",
    "🧠 Psychological Depth — Highlights inner struggles, emotional confusion, awakening, transformation, and mindset shifts caused by the aspect.",
    "🌊 Real-Life Impact — Connects the aspect to real situations such as sudden changes, spiritual growth, confusion, career shifts, or relationship dynamics.",
    "🧘 Guidance & Advice — Provides practical suggestions like mindfulness, patience, self-reflection, or balanced decision-making.",
    "🖼 Visual Representation — Includes a symbolic diagram showing both planets and the shared interaction zone for easier understanding.",
    "🔍 Symbol Meaning — Breaks down each planet’s qualities (e.g., Uranus = rebellion/change, Neptune = illusion/dream/spirituality) visually and conceptually.",
    "🔄 Transformation Insight — Shows how challenging aspects can lead to personal evolution and deeper awareness.",
    "✨ Why This Section Is Important — Helps astrologers go beyond surface-level meanings and understand the deeper purpose of planetary interactions.",
    "🚀 Practical Use — Useful for advanced readings, client consultations, personal reflection, and navigating complex emotional or life situations."
  ]
},

{
  "name": "horoscope_solar_planet_information",
  "label": "Solar Return: Planet Information",
  "description": "Detailed planetary positions and technical data for the solar return chart.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after the user enters date of birth, time of birth, and place of birth, along with the selected solar return year and location. The system calculates the exact Solar Return chart and lists all planetary positions in a structured table format. This table provides astrologers with precise technical data about each planet, including its zodiac sign, exact degree, house placement, motion speed, and retrograde status. It is used as the foundational dataset for all further interpretations, helping astrologers accurately analyze yearly influences, patterns, and predictions.",
  "bullets": [
    "☀ How It Is Generated — Uses birth data to calculate the Solar Return chart and extract precise planetary positions for the selected year.",
    "🪐 Planet Column — Lists all celestial bodies and key points such as Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Node, Part of Fortune, and Chiron.",
    "♈ Sign Column — Shows the zodiac sign each planet is placed in, defining the style and nature of its expression.",
    "📐 Full Degree Column — Displays the exact zodiac longitude (0°–360°) of each planet for precise astronomical positioning.",
    "🏠 House Column — Indicates which house the planet occupies, showing the life area where its influence is strongest.",
    "📏 Norm Degree Column — Shows the degree of the planet within its zodiac sign (0°–30°), useful for detailed astrological interpretation.",
    "⚡ Speed Column — Represents the daily motion speed of the planet, helping astrologers understand how fast or slow its influence is acting.",
    "🔁 Retro Column — Indicates whether the planet is in retrograde motion (Yes/No), which affects how its energy is expressed (internalized, delayed, or reflective).",
    "🧠 Interpretation Base — Serves as the core data used for generating all interpretations such as planetary meanings, aspects, and yearly themes.",
    "🔍 Precision Analysis Tool — Allows astrologers to perform advanced analysis like degree-based aspects, timing predictions, and pattern recognition.",
    "🔄 Why This Table Is Important — It provides the exact technical foundation required to understand and interpret the entire Solar Return chart accurately.",
    "🚀 Practical Use — Used for professional readings, forecasting, identifying key influences, and supporting all higher-level astrological insights."
  ]
},

{
  "name": "horoscope_solar_planet_cards",
  "label": "Solar Return: Planet Interpretation Cards",
  "description": "Readable interpretation cards for each planet with sign, house, degree, speed, retrograde status, and optional decan marker.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after the user enters date of birth, time of birth, and place of birth, then selects the Solar Return year and location. The system calculates the Solar Return chart and creates a separate interpretation card for each planet. Each card explains the planet's yearly meaning using its sign, house, full degree, normalized degree, and speed. It gives astrologers and users an easy way to read planet-by-planet yearly guidance in a visual card format. If a special symbol such as a triangle appears near the planet name, it can represent an additional astrological layer such as the decan, which gives more refined meaning to that planet's placement.",
  "bullets": [
    "☀ Planet Card Generation — Creates one interpretation card for each Solar Return planet using the calculated yearly chart data.",
    "🪐 Planet Name Header — Shows the planet being interpreted, such as Sun, Moon, or Mercury.",
    "♈ Sign + House Tag — Displays the zodiac sign and house placement, such as Libra - House 6 or Aries - House 1.",
    "📐 Degree-Based Meaning — Uses full degree and norm degree to refine the interpretation and explain how mature, early, or specialized the placement is.",
    "⚡ Speed Meaning — Uses planetary speed to describe whether the energy is steady, fast-moving, slow, reflective, or intensified.",
    "🔁 Retrograde Layer — Can include retrograde status to explain whether the planet's influence is more inward, delayed, karmic, or reflective.",
    "🔺 Decan Indicator — The triangle-like symbol can be stored as a decan marker, showing the decan or sub-division of the zodiac sign for deeper interpretation.",
    "🧠 Why Decan Is Useful — Decan adds a finer interpretive layer inside the zodiac sign, helping astrologers understand the planet's more specific tone, style, and expression.",
    "💬 Easy Reading Format — The card turns technical chart values into simple readable yearly guidance for both astrologers and general users.",
    "📖 Expandable Content — The Show More action can reveal a longer version of the interpretation with advanced astrological detail.",
    "✨ Visual Interpretation Support — Card layout, icons, sign labels, and optional decan symbols help astrologers scan the yearly chart more quickly.",
    "🚀 Practical Use — Useful for yearly forecasts, client readings, planet-by-planet analysis, and advanced astrology UI presentation."
  ]
},

{
  "name": "horoscope_solar_planet_insights",
  "label": "Solar Return: Planet Insights",
  "description": "Structured insight points for each planet in the Solar Return chart, with visual support for fast astrological reading.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after the user enters date of birth, time of birth, and place of birth, and the system calculates the Solar Return chart for the selected year and location. It converts the technical planetary data into short, numbered insight points so astrologers can quickly understand the meaning of one planet at a time. Each insight is based on the planet's house placement, sign placement, full degree, normalized degree, speed, and retrograde condition. This format is useful because it breaks the interpretation into clear observations instead of one long paragraph, making the yearly reading easier to scan, explain, and compare.",
  "bullets": [
    "☀ Planet Insight Generation — Creates a focused insight panel for one selected planet using Solar Return chart data.",
    "🪐 Planet Focus — The screen highlights one planet at a time, such as Sun, Moon, Mercury, Venus, or Mars, for deeper yearly understanding.",
    "🏠 House-Based Meaning — Explains which life area is activated by the planet, such as work, identity, health, relationships, creativity, or career.",
    "♈ Sign-Based Meaning — Shows how the zodiac sign colors the planet's expression, such as Libra bringing balance, diplomacy, and harmony.",
    "📐 Full Degree Insight — Uses the exact zodiac longitude to support precise astrological analysis and advanced interpretation.",
    "📏 Norm Degree Insight — Uses the planet's degree within the sign to show how early, middle, or late the placement is, adding interpretive refinement.",
    "⚡ Speed Insight — Explains whether the planet's influence is moving steadily, quickly, slowly, or with unusual emphasis during the year.",
    "🔁 Retrograde Insight — Shows whether the planet is direct or retrograde, helping astrologers judge whether the energy is outward, delayed, inward, or reflective.",
    "🔢 Numbered Reading Format — Presents interpretation as separate insight points so astrologers can read, teach, and explain the placement more easily.",
    "🖼 Picture Representation — Includes a symbolic visual diagram that combines the planet's nature with the sign meaning for quick conceptual understanding.",
    "🧠 Astrologer-Friendly Use — Helps astrologers quickly extract practical yearly meaning without reading one long block of text.",
    "🚀 Practical Value — Useful for client sessions, yearly forecasts, educational astrology tools, and fast interpretation workflows."
  ]
},
{
  "name": "horoscope_solar_house_information",
  "label": "Solar Return: House Information",
  "description": "Structured table showing house-wise sign placements, degrees, and planetary distribution for the solar year.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after the Solar Return chart is calculated using the user's date of birth, time of birth, and place of birth, along with the selected return year and location. The system divides the chart into 12 houses and maps each house with its starting zodiac sign, exact degree, and the planets placed within it. This table helps astrologers quickly understand which life areas are activated during the year and which planets are influencing those areas. It provides a clear structure of how planetary energy is distributed across different domains such as self, money, communication, home, creativity, work, relationships, transformation, travel, career, social life, and spirituality.",
  "bullets": [
    "🏠 House Structure Mapping — Displays all 12 houses of the Solar Return chart with their corresponding zodiac signs and degrees.",
    "♈ Sign Column Meaning — Shows which zodiac sign rules each house, defining the style and behavior of that life area.",
    "📐 Degree Column Meaning — Indicates the exact starting point (cusp) of each house, important for precise astrological calculations.",
    "🪐 Planets Column Meaning — Lists the planets present in each house, showing where planetary energy is concentrated during the year.",
    "☀ Empty Houses Insight — Houses without planets are still important and are interpreted through their ruling sign and ruler planet.",
    "🎯 Life Area Focus — Each house represents a specific life domain such as identity (1st), finances (2nd), communication (3rd), home (4th), creativity (5th), work/health (6th), relationships (7th), transformation (8th), travel (9th), career (10th), social networks (11th), and subconscious/spirituality (12th).",
    "🔄 Energy Distribution — Helps astrologers quickly see which areas of life are more active based on the number of planets in each house.",
    "🧠 Interpretation Support — Used as a base for deeper analysis like house rulerships, transits, and aspect influence within houses.",
    "📊 Practical Reading Tool — Makes it easy to explain yearly focus areas to clients in a structured and visual way.",
    "🚀 Why This Section Is Important — It provides a clear overview of how the entire Solar Return chart is organized and where the strongest life themes will manifest during the year."
  ]
},

{
  "name": "horoscope_solar_house_insights",
  "label": "Solar Return: House Insights",
  "description": "Detailed interpretation of each house in the Solar Return chart with visual house distribution.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after the Solar Return chart is calculated using the user's date of birth, time of birth, and place of birth, along with the selected return year and location. The system maps all 12 houses, assigns zodiac signs to each house cusp, and distributes planets across the houses. It then provides individual interpretations for each house, explaining how that specific life area will be influenced during the year. The visual bar representation at the top helps astrologers quickly see planetary distribution across houses, while the detailed text below explains the meaning of each house placement in simple and structured language.",
  "bullets": [
    "🏠 House Distribution Visualization — Displays a graphical bar showing how planets are distributed across the 12 houses for quick analysis.",
    "♈ House Cusp Meaning — Each house interpretation is based on the zodiac sign present on its cusp, defining how that life area behaves.",
    "🪐 Planet Presence Insight — Houses with planets are more active and receive stronger focus during the year.",
    "📊 Visual + Text Combination — Combines graphical representation with written interpretation for faster understanding.",
    "🎯 Life Area Explanation — Each house represents a domain of life such as self (1st), money (2nd), communication (3rd), home (4th), creativity (5th), work/health (6th), relationships (7th), transformation (8th), travel (9th), career (10th), social circle (11th), and spirituality (12th).",
    "🧠 Easy Interpretation Format — Each house is explained separately so astrologers can read and explain one life area at a time.",
    "💬 Practical Meaning — Provides real-life meaning such as personality traits, financial behavior, communication style, emotional patterns, and career direction.",
    "📖 Expandable Content — Includes 'Show More' option to reveal deeper insights for each house.",
    "🔄 Yearly Focus Identification — Helps astrologers quickly identify which life areas will be most important during the Solar Return year.",
    "✨ Why This Section Is Important — It translates house-level chart data into clear yearly guidance for both astrologers and general users.",
    "🚀 Practical Use — Useful for client readings, yearly planning, and understanding how different life areas will evolve throughout the year."
  ]
},

{
  "name": "horoscope_solar_house_deep_analysis",
  "label": "Solar Return: Deep House Analysis",
  "description": "Expanded house interpretation shown in a modal after the user clicks Show More.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is used for deep analysis of a specific Solar Return house. After the user enters date of birth, time of birth, and place of birth, the system calculates the Solar Return chart for the selected year and location. On the main House Insights screen, each house shows a short summary with a Show More button. When the user clicks Show More, a modal opens and displays a detailed interpretation of that selected house. The modal explains the zodiac sign on the house cusp, the meaning of that house, the yearly life focus connected to it, and a picture representation that helps astrologers understand the combined symbolism more easily.",
  "bullets": [
    "🏠 Modal Open Scenario — This screen appears when the user clicks Show More on any house card from the Solar Return House Insights section.",
    "🧭 Selected House Focus — The modal opens for one specific house at a time, such as House 1, House 2, or House 7.",
    "♈ Cusp Sign Interpretation — Explains the zodiac sign placed on the cusp of the selected house and how it shapes that life area during the year.",
    "📖 Deep Text Reading — Shows a longer and more complete explanation than the short preview shown on the main screen.",
    "🎯 House Meaning Layer — Describes the selected life area in detail, such as self-image, finances, communication, home, creativity, work, relationships, transformation, travel, career, social life, or spirituality.",
    "🪐 Yearly Influence — Explains how the Solar Return year will activate that house and what themes are likely to become important.",
    "🖼 Picture Representation — Includes a symbolic visual image that combines the house meaning, zodiac sign meaning, and merged interpretation for faster astrological understanding.",
    "🧠 Astrologer-Friendly Format — Helps astrologers quickly read the technical meaning and also use the picture as a visual teaching tool.",
    "🔗 Combined Symbolism — Shows how the sign energy and house energy work together, such as Aries in the 1st House indicating initiative, presence, courage, and self-assertion.",
    "💬 Easy User Understanding — The modal is designed to make deep astrology easier to understand for both astrologers and general users.",
    "✨ Why This Screen Is Useful — It gives expanded insight without overcrowding the main page, keeping the summary screen simple while allowing deeper study on demand.",
    "🚀 Practical Use — Useful for detailed yearly consultation, teaching astrology, client explanation, and focused interpretation of one house at a time."
  ]
},


{
  "name": "horoscope_solar_house_cards",
  "label": "Solar Return: House Interpretation Cards",
  "description": "Short house-by-house interpretation cards with expandable yearly meaning for each Solar Return house.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after the user enters date of birth, time of birth, and place of birth, and the system calculates the Solar Return chart for the selected year and location. It creates a separate interpretation card for each house, such as House 1, House 2, House 3, and so on. Each card gives a short and easy-to-understand summary based on the zodiac sign on that house cusp and the life area represented by that house. This helps astrologers quickly review the yearly meaning of each house one by one. The Show More button is used to open a deeper modal analysis for the selected house without making the main screen too crowded.",
  "bullets": [
    "🏠 House Card Generation — Creates one card for each of the 12 Solar Return houses after the yearly chart is calculated.",
    "♈ Cusp Sign Meaning — Uses the zodiac sign on each house cusp to explain how that life area behaves during the year.",
    "📖 Short Interpretation Format — Shows a brief summary for each house so astrologers can quickly scan the major yearly themes.",
    "🎯 House Life Area Meaning — Explains the focus of each house, such as communication in House 3, home and family in House 4, and creativity in House 5.",
    "🧠 Astrologer-Friendly Layout — Keeps each house reading separate and clear, making interpretation easier during consultation or analysis.",
    "💬 Easy User Understanding — Converts technical house data into simple readable text for both astrologers and normal users.",
    "📊 Sequential House Reading — Allows the astrologer to review the yearly flow house by house in a structured order.",
    "🔍 Focused Interpretation — Highlights the most important yearly message of each house without showing too much detail at once.",
    "📖 Show More Action — Each card includes a Show More button that opens a detailed modal for deeper analysis of that specific house.",
    "✨ Why This Screen Is Useful — It gives a clean overview of all house meanings while keeping advanced explanation available only when needed.",
    "🚀 Practical Use — Useful for yearly readings, client explanation, quick astrology review, and structured Solar Return analysis."
  ]
},

{
  "name": "horoscope_solar_house_cards_v1",
  "label": "Solar Return: House Interpretation Cards",
  "description": "Short house-by-house interpretation cards with expandable yearly meanings for each Solar Return house.",
  "group": "Horoscope Toolkit",
  "subModule": "Solar Return",
  "purpose": "This section is generated after the user enters date of birth, time of birth, and place of birth, and the system calculates the Solar Return chart for the selected year and location. It creates one interpretation card for each house, such as House 3, House 4, and House 5. Each card gives a short summary based on the zodiac sign on that house cusp and the life area represented by that house. This helps astrologers quickly review the meaning of each house for the year in a simple, structured format. The Show More button allows the user to open a deeper interpretation for that specific house without overcrowding the main screen.",
  "bullets": [
    "🏠 House Card Generation — Creates a separate interpretation card for each Solar Return house after the yearly chart is calculated.",
    "♈ Cusp Sign Reading — Uses the zodiac sign on the house cusp to explain how that life area will behave during the year.",
    "📖 Short Summary Format — Shows a concise interpretation so astrologers can scan yearly themes quickly.",
    "🎯 Life Area Meaning — Explains the meaning of each house, such as House 3 for communication and learning, House 4 for home and family, and House 5 for creativity, joy, and self-expression.",
    "🧠 Astrologer-Friendly Structure — Keeps each house reading separate and organized, making yearly analysis easier.",
    "💬 Easy User Understanding — Converts technical astrology into simple text that both astrologers and general users can understand.",
    "📊 Sequential House Flow — Presents the houses in order so the yearly story can be read house by house.",
    "🔍 Focused House Insight — Highlights the main message of each house without showing too much detail at once.",
    "📖 Show More Action — Each card includes a Show More button to open a deeper modal explanation for that specific house.",
    "✨ Why This Section Is Useful — It gives a clean overview of all house meanings while keeping detailed analysis available on demand.",
    "🚀 Practical Use — Useful for yearly readings, client consultation, astrology education, and structured Solar Return interpretation."
  ]
},

    {
  name: "horoscope_nativity_result_aspects_v1",
  label: "Solar Return: Aspect Dynamics",
  description: "A detailed table showing how planets interact with each other in the birth chart.",
  group: "Horoscope Toolkit",
  subModule: "Solar Return",
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
  label: "Solar Return: Aspect Interpretations",
  description: "Easy-to-understand readings of how planets interact and shape personality, emotions, communication, and life patterns.",
  group: "Horoscope Toolkit",
  subModule: "Solar Return",
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
  label: "Solar Return: Deep Aspect Analysis (Sun/Moon)",
  description: "A deeper reading of the Sun–Moon aspect, explaining the inner tension between identity and emotions.",
  group: "Horoscope Toolkit",
  subModule: "Solar Return",
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
  label: "Solar Return: Angles & Points",
  description: "A clear reading of the Ascendant, Midheaven, and Vertex, showing personality style, career direction, and important turning points.",
  group: "Horoscope Toolkit",
  subModule: "Solar Return",
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
      {
  name: "horoscope_nativity_lilith_pictorial_v3",
  label: "Solar Return: Lilith Deep Analysis",
  description: "A focused reading of Lilith, showing deeper truth-seeking, inner rebellion, and nontraditional beliefs.",
  group: "Horoscope Toolkit",
  subModule: "Solar Return",
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

// ---------weekly transits----------//
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
      { name: "ms_decans", label: "MS Decan Studies", description: "School-specific decan curriculum config.", group: "Programs" },
      { name: "ms_journals", label: "Student Journals", description: "Review of student esoteric practice logs.", group: "Programs" },
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
      { name: "check_ins", label: "System Check-ins", description: "Monitoring practitioner platform presence.", group: "Live" },
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
      { name: "bookings", label: "Session Mgmt", description: "Oversight of individual user appointments.", group: "My Schedule" },
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
      { name: "pm_plan_tiers", label: "Plan Configuration", description: "Management of community payment tiers.", group: "Community" },
      { name: "broadcasts", label: "System Broadcasts", description: "Pushing messages to the entire community.", group: "Community" },
      { name: "calendar", label: "Community Events", description: "Shared calendar for public gatherings.", group: "Community" },
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
      { name: "training_analytics", label: "Analytics", description: "Statistical performance of courses.", group: "Training" },
      { name: "training_settings", label: "Settings", description: "Global settings for the graduation path.", group: "Training" },
      { name: "class_config", label: "Class Config", description: "Configuration of virtual training rooms.", group: "Training" },

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
      { name: "refunds", label: "Refund Management", description: "Processing and tracking payment reversals.", group: "Commerce" },
      { name: "orders", label: "Orders", description: "Full directory of all platform purchases.", group: "Commerce" },
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
      { name: "report_payouts", label: "Payout History", description: "Log of successfully processed transfers.", group: "Reports" },
      { name: "report_funnel", label: "Conversion Funnel", description: "Tracking visitor-to-member journey.", group: "Reports" },
      { name: "report_readings", label: "Reading Quality", description: "Metrics on session ratings and output.", group: "Reports" },
      { name: "report_affiliates", label: "Affiliate ROI", description: "Performance of external traffic sources.", group: "Reports" },
      { name: "report_campaigns", label: "Campaign ROI", description: "Financial results of marketing spends.", group: "Reports" },

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
    role: "Diviner Studio",
    slug: "diviner",
    tagline: "Spiritual practice and business operations",
    roleDescription:
      "A full-featured workspace for practitioners — manage clients, services, calendar, media, and revenue in one place.",
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
        groupLabel: "My Schedule",
        cards: [
          { title: "Overview", description: "Daily workload summary", href: "/dashboard", icon: LayoutDashboard, status: "live" },
        ],
      },
    ],
    screens: [
      { 
        name: "overview", 
        label: "Practitioner CRM", 
        description: "Overview of today's operations.", 
        group: "My Schedule",
        purpose: "The primary command center for professional diviners to manage their daily workflow and client load.",
        bullets: [
          "Real-time overview of today's appointments",
          "Quick-access to recent client interactions",
          "Pending reading request notifications",
          "Daily revenue and session velocity stats"
        ]
      },
      { 
        name: "calendar", 
        label: "Session Calendar", 
        description: "Map of upcoming readings.", 
        group: "My Schedule",
        purpose: "A high-precision scheduling interface for managing personal availability and upcoming consultations.",
        bullets: [
          "Dynamic weekly and monthly session views",
          "One-click availability overrides and holidays",
          "Automated session remainder status tracking",
          "Direct integration with live broadcast scheduling"
        ]
      },
      { 
        name: "client-detail", 
        label: "Client Spiritual Twin", 
        description: "Comprehensive client history.", 
        group: "Business",
        purpose: "A deep-dive clinical interface providing the full spiritual and interaction history for a specific client.",
        bullets: [
          "Natal chart and transit history archive",
          "Private practitioner notes and session logs",
          "Client-specific compatibility and synastry data",
          "Reading frequency and loyalty metrics"
        ]
      },
      { 
        name: "broadcast", 
        label: "Live Hub", 
        description: "Streaming and chat interface.", 
        group: "Engagement",
        purpose: "The professional broadcast studio for hosting live sessions, rituals, and community gatherings.",
        bullets: [
          "Integrated WebRTC live streaming controls",
          "Real-time moderated community chat",
          "Active viewer list and engagement triggers",
          "One-click recording and archive dispatch"
        ]
      },
      { 
        name: "payouts", 
        label: "Billing & Payouts", 
        description: "Financial transparency.", 
        group: "Business",
        purpose: "Ensures full financial clarity for practitioners regarding their platform earnings and transfer history.",
        bullets: [
          "Real-time pending balance tracking",
          "Detailed commission and fee breakdown",
          "Historical payout bank transfer logs",
          "Tax summary and financial year reports"
        ]
      },
    ],
  },
  {
    role: "Perennial Mandalism",
    slug: "community",
    tagline: "Astrology tools and sacred community access",
    roleDescription:
      "A dedicated membership experience — access live gatherings, powerful astrology tools, and a curated library of spiritual wisdom.",
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
      { 
        name: "hub", 
        label: "Community Hub", 
        description: "Central board for announcements.", 
        group: "Community",
        purpose: "The primary landing zone for community members, featuring global announcements, event highlights, and a spiritual dashboard.",
        bullets: [
          "Real-time spiritual clock and planetary pulse",
          "Centralized platform announcements and ritual alerts",
          "Personalized shortcut menu to core member tools",
          "Community activity feed and social highlights"
        ]
      },
      { 
        name: "natal", 
        label: "Natal Chart Studio", 
        description: "Aesthetic birth chart visualization.", 
        group: "Astrology Tools",
        purpose: "An interactive, personalized astrology engine that visualizes your birth chart with deep esoteric interpretations.",
        bullets: [
          "Interactive SVG natal chart visualization",
          "Granular planet, point, and aspect interpretations",
          "Printable and exportable high-resolution chart PDFs",
          "Personalized transit-to-natal overlay logic"
        ]
      },
      { 
        name: "transits", 
        label: "Monthly Transits", 
        description: "Interactive transit calendar.", 
        group: "Astrology Tools",
        purpose: "A temporal mapping tool that shows how planetary movements interact with your personal natal chart over time.",
        bullets: [
          "Personalized transit calendar for the current month",
          "Major planetary ingress and alignment notifications",
          "Daily 'Spiritual Forecast' based on transits",
          "Detailed aspect-tracking between transit and natal points"
        ]
      },
      { 
        name: "sunday", 
        label: "Sunday Service", 
        description: "Live video player and chat.", 
        group: "Community",
        purpose: "The digital gathering space for the platform's weekly spiritual sermons and shared meditative rituals.",
        bullets: [
          "High-definition live video player with low-latency",
          "Real-time member-only community live chat",
          "Integrated liturgy and prayer text display",
          "Automated post-broadcast archive accessibility"
        ]
      },
      { 
        name: "rituals", 
        label: "Ritual Path", 
        description: "Step-by-step spiritual practice guide.", 
        group: "Community",
        purpose: "A guided experiential module that walks members through specific spiritual practices and community rituals.",
        bullets: [
          "Step-by-step visual ritual execution guide",
          "Time-locked ritual stages and transition cues",
          "Personalized ritual intent and manifestation log",
          "Integration with the Global Wisdom Library"
        ]
      },
    ],
  },
  {
    role: "Mystery School",
    slug: "mystery-school",
    tagline: "Esoteric curriculum and decan mastery",
    roleDescription:
      "A privileged path for serious practitioners. Dive deep into the decan systems, sacred ritual frameworks, and advanced astrology curriculum.",
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
      { 
        name: "decans", 
        label: "Decans Grid", 
        description: "Visual map of the 36 decans.", 
        group: "Mastery",
        purpose: "A comprehensive esoteric dashboard visualizing the Egyptian decan system and their corresponding spiritual hierarchies.",
        bullets: [
          "Interactive 36-decan mastery grid interface",
          "Detailed decan mythology and correspondences",
          "Temporal decan-hour tracking and ritual timing",
          "Student-level decan mastery progress visualization"
        ]
      },
      { 
        name: "center", 
        label: "Training Center", 
        description: "Learning management.", 
        group: "Curriculum",
        purpose: "The central hub for students to manage their advancement through the platform's esoteric curriculum.",
        bullets: [
          "Curriculum-level progress tracking and analytics",
          "Lesson repository with status and grading logs",
          "Mentor feedback and review communication panel",
          "Self-paced learning path and milestone roadmap"
        ]
      },
      { 
        name: "lesson", 
        label: "Lesson View", 
        description: "Structured lesson content.", 
        group: "Curriculum",
        purpose: "An immersive learning environment for absorbing specific spiritual doctrines and technical esoteric training.",
        bullets: [
          "Multimedia-rich lesson delivery (Text, Video, PDF)",
          "Integrated student note-taking and journaling",
          "Knowledge-check quizzes and examination modules",
          "Discussion board integration for specific lessons"
        ]
      },
      { 
        name: "builder", 
        label: "Ritual Builder", 
        description: "Drag-and-drop ritual designer.", 
        group: "Mastery",
        purpose: "A sophisticated technical tool that allows students to construct their own astrological and spiritual ritual sequences.",
        bullets: [
          "Drag-and-drop ritual component architecture",
          "Astrological timing engine for precise rituals",
          "Ritual sequence validation and error checking",
          "Personalized ritual template export and sharing"
        ]
      },
    ],
  },
  {
    role: "Affiliate Partner",
    slug: "social_advo",
    tagline: "Community growth and referral partnerships",
    roleDescription:
      "Purpose-built for growth partners. Track referral performance, manage affiliate links, and monitor commission earnings in real time.",
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
      { 
        name: "advocate-home", 
        label: "Advocacy Dashboard", 
        description: "Overview of your impact.", 
        group: "Advocacy",
        purpose: "The primary toolkit for platform growth partners to track their referral performance and community impact.",
        bullets: [
          "Personalized referral link generation engine",
          "Real-time conversion and traffic analytics",
          "Active community growth milestone tracking",
          "Marketing asset and creative resource hub"
        ]
      },
      { 
        name: "payouts", 
        label: "Earnings Log", 
        description: "Transparency on commissions.", 
        group: "Advocacy",
        purpose: "A detailed financial ledger for advocates to review their referral earnings and community rewards.",
        bullets: [
          "Individual transaction-level referral logs",
          "Monthly payout status and history tracking",
          "Commission rate and bonus structure transparency",
          "Historical earnings trend visualization"
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
        name: "graduation",
        label: "Graduation Certificate",
        description: "Digital certificate issued on completing all curriculum requirements.",
        group: "Certification",
        purpose: "A shareable digital certificate confirming full curriculum completion, issued with a unique code and graduation date.",
        bullets: [
          "Unique certificate code (e.g. CERT-BUKQOM-2026)",
          "Graduation date and trainee full name",
          "Sharable link and downloadable PDF",
          "Verification page for employers and clients"
        ]
      },
    ],
  },
  {
    role: "Client Portal",
    slug: "customer",
    tagline: "Personal readings and spiritual journey",
    roleDescription:
      "A clean, personal workspace for clients — book sessions, review reading history, explore services, and connect with their chosen diviner.",
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
      { 
        name: "dashboard", 
        label: "Customer Dashboard", 
        description: "At-a-glance view of appointments.", 
        group: "Dashboard",
        purpose: "The central hub for clients to manage their spiritual journey and platform interactions.",
        bullets: [
          "Quick-access to upcoming spiritual readings",
          "Recent order and subscription status summary",
          "Personalized 'Daily Wisdom' transit snippet",
          "Active consultation and chat notifications"
        ]
      },
      { 
        name: "bookings", 
        label: "My Bookings", 
        description: "Management of upcoming sessions.", 
        group: "Services",
        purpose: "A dedicated management area for clients to track, reschedule, or review their spiritual consultations.",
        bullets: [
          "Comprehensive history of past readings",
          "Upcoming session countdown and preparation tools",
          "One-click rescheduling and cancellation logic",
          "Direct access to session transcripts and recordings"
        ]
      },
      { 
        name: "orders", 
        label: "Order History", 
        description: "Detailed list of all platform purchases.", 
        group: "Services",
        purpose: "A complete financial audit log of all services, bundles, and subscriptions purchased by the client.",
        bullets: [
          "Itemized transaction history and PDF receipts",
          "Active subscription and plan status management",
          "Bundle balance and usage tracking",
          "Refund request and support ticket linking"
        ]
      },
      { 
        name: "profile", 
        label: "User Profile", 
        description: "Account settings.", 
        group: "Dashboard",
        purpose: "Allows clients to manage their personal data, natal profile, and communication preferences.",
        bullets: [
          "Natal birth data and location management",
          "Two-factor security and password controls",
          "Email and SMS notification preferences",
          "Avatar and spiritual bio customization"
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
        description: "Membership tier selection.", 
        group: "Onboarding",
        purpose: "A purpose-built page for selecting membership tiers and initiating the spiritual onboarding process.",
        bullets: [
          "Clear plan comparison and feature matrix",
          "One-click enrollment in Perennial Mandalism",
          "Specialized Family and Couple plan options",
          "Integrated student-to-school conversion paths"
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
