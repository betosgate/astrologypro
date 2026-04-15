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
        ],
      },
      {
        groupLabel: "Learning & Wisdom",
        cards: [
          { title: "Library", description: "Spiritual articles, videos, and reference materials", href: "/community/library", icon: BookOpen, status: "live" },
          { title: "Training", description: "Structured courses and lesson curriculum", href: "/community/training", icon: GraduationCap, status: "live" },
          { title: "Tarot", description: "Tarot card meanings and readings", href: "/community/tarot", icon: Layers, status: "live" },
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
          { title: "Earnings", description: "Commissions paid, pending, and upcoming", href: "/advocate/earnings", icon: CreditCard, status: "live" },
        ],
      },
      {
        groupLabel: "Tools & Content",
        cards: [
          { title: "Campaigns", description: "Active campaigns you can join for extra earnings", href: "/advocate/campaigns", icon: Zap, status: "live" },
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
        ],
      },
      {
        groupLabel: "Finance",
        cards: [
          { title: "Order History", description: "Every purchase and transaction", href: "/portal/orders", icon: ShoppingBag, status: "live" },
          { title: "Subscriptions", description: "Active recurring reading plans", href: "/portal/subscriptions", icon: RefreshCcw, status: "live" },
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
