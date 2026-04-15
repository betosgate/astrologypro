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


// ---------------Nativity Birth Chart---------------//

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
  "name": "horoscope_weekly_entry_setup",
  "label": "Weekly Transits: Entry & Generation Setup",
  "description": "Enter birth details to generate the full weekly transit reading in 6 screens.",
  "group": "Horoscope Toolkit",
  "subModule": "Weekly Transits",
  "purpose": "This is the first entry point of the Weekly Transits module. The user enters date of birth, time of birth, and place of birth so the system can calculate the natal chart as the base astrological reference. After the required fields are filled, the Generate Reading button becomes enabled. Once the user clicks Generate Reading, the platform starts building the weekly transit response screen by screen. It creates the natal chart, calculates the selected week's transit positions, compares transit planets with natal planets, and then generates the weekly chart view, transit relation table, transit interpretation cards, deep natal planet analysis, and deeper transit event analysis. This setup is important because all weekly transit readings depend on accurate birth data. If the time or place is wrong, houses, angles, and transit activations may change, which can affect the astrologer's interpretation.",
  "bullets": [
    "📅 Step 1 — Birth Data Entry: The user enters date of birth, time of birth, and place of birth. The user may also select a specific week and optionally add an area of inquiry.",
    "✅ Step 2 — Generate Reading Activation: After the required birth details are filled correctly, the Generate Reading button becomes enabled and starts the weekly transit calculation.",
    "📊 Step 3 — Weekly Chart View: The system generates the natal chart, weekly transit chart, and overlay chart so astrologers can visually compare birth positions with current weekly planetary movement.",
    "📋 Step 4 — Weekly Transit Relation Table: The platform creates a table showing the date, transit planet, aspect type, and natal planet being activated during the selected week.",
    "💬 Step 5 — Weekly Transit Interpretations: Important weekly transit aspects are converted into short readable interpretation cards so astrologers can quickly understand the meaning of each active influence.",
    "🧠 Step 6 — Deep Weekly Analysis: The system provides deeper analysis of important natal planet activations and major transit events for more detailed astrological understanding."
  ]
},
   {
  "name": "horoscope_weekly_chart",
  "label": "Weekly Transits: Weekly Chart View",
  "description": "A weekly transit chart generated from the user's date of birth, time of birth, and place of birth, showing how current planetary movements interact with the natal chart.",
  "group": "Horoscope Toolkit",
  "subModule": "Weekly Transits",
  "purpose": "This chart is created after the user enters date of birth, time of birth, and place of birth. The system first generates the natal birth chart from these birth details. Then it calculates the current or selected week's transit positions and compares them against the natal planetary positions, houses, and angles. The result is a weekly transit chart that helps astrologers understand how short-term planetary movement is influencing the user's core personality, emotions, decisions, communication, relationships, work life, and timing of events during that specific week. This chart is useful because it gives a quick weekly astrological map of active energies, current pressures, helpful opportunities, and important transit triggers.",
  "bullets": [
    "📅 Birth Data Based Calculation — Uses the user's date of birth, time of birth, and place of birth to create the natal chart as the base reference.",
    "🪐 Weekly Transit Generation — Calculates the planetary positions for the selected week or the current week if no date is selected.",
    "🔗 Natal + Transit Comparison — Compares moving weekly planets with natal planets, natal houses, and key chart angles.",
    "📊 Weekly Chart Display — Shows the natal chart, transit chart, and overlay chart so astrologers can visually study the weekly interaction.",
    "⚡ Transit Activation Insight — Helps identify which natal planets and life areas are being activated during the week.",
    "🏠 House Trigger Analysis — Shows which houses are receiving transit pressure or support, such as career, relationships, finances, health, or communication.",
    "📐 Aspect Pattern Mapping — Reveals short-term aspects formed between transiting planets and natal planets, highlighting tension, ease, opportunity, or change.",
    "💬 Weekly Interpretation Support — Serves as the visual foundation for generating weekly transit interpretations and AI narrative guidance.",
    "🎯 Timing Usefulness — Helps astrologers track when a week is better for action, reflection, communication, decision-making, or emotional care.",
    "🔭 Astrologer-Friendly Wheel View — Presents the weekly transit wheel in a clear visual format for quick short-term forecasting and structured weekly reading."
  ]
},


 {
  "name": "horoscope_weekly_relation",
  "label": "Weekly Transits: Transit Relation Table",
  "description": "A structured weekly table showing how transit planets form aspects with natal planets on specific dates.",
  "group": "Horoscope Toolkit",
  "subModule": "Weekly Transits",
  "purpose": "This table is generated after the user enters date of birth, time of birth, and place of birth. The system first creates the natal birth chart from these birth details. Then it calculates the moving planetary positions for the selected week and compares those transiting planets with the natal planets in the birth chart. Whenever an important aspect is formed during that week, the system adds it to this table with the date, transit planet, aspect type, and natal planet. This table helps astrologers quickly understand which short-term planetary activations are happening during the week, when they become active, and which natal energies are being triggered. It is especially useful for identifying important weekly timing, emotional pressure points, communication windows, relationship developments, and action periods.",
  "bullets": [
    "📅 Date Column — Shows the exact day in the selected week when the transit aspect becomes active or most relevant.",
    "🪐 Transit Planet Column — Shows the moving planet of the week, such as Mars, Venus, Mercury, Uranus, or Saturn, creating the temporary influence.",
    "🔗 Aspect Column — Shows the relationship formed between the transit planet and the natal planet, such as Opposition, Sextile, Trine, Conjunction, or Square.",
    "🌌 Natal Planet Column — Shows the natal birth-chart planet receiving the weekly transit influence, such as the Sun, Moon, Mercury, Venus, Pluto, or Saturn.",
    "📍 Birth Data Based Calculation — Uses the user's date of birth, time of birth, and place of birth to calculate the natal chart accurately before comparing weekly transit movement.",
    "🗓 Weekly Transit Tracking — Calculates planetary motion day by day for the selected week and detects important aspect contacts with natal planets.",
    "⚡ Timing Insight — Helps astrologers see not only what influence is happening, but also exactly when during the week it becomes important.",
    "🧠 Interpretation Value — Makes it easier to understand how weekly events may affect confidence, emotions, communication, relationships, work, and personal decisions.",
    "📊 Quick Weekly Forecast Tool — Gives a fast astrologer-friendly summary of the strongest transit-to-natal interactions for the week.",
    "🎯 Practical Use — Useful for weekly planning, client guidance, short-term forecasting, identifying pressure days, and spotting supportive opportunity windows."
  ]
},
{
  "name": "horoscope_weekly_transit_interpretations",
  "label": "Weekly Transits: Transit Interpretations",
  "description": "Short weekly interpretation cards showing how current transit planets affect natal planets on specific dates.",
  "group": "Horoscope Toolkit",
  "subModule": "Weekly Transits",
  "purpose": "This section is generated after the user enters date of birth, time of birth, and place of birth, and the system creates the natal birth chart. Then the platform calculates the transit positions for the selected week and compares them with the natal planets. When an important weekly aspect is formed, the system creates an interpretation card for that transit event. Each card explains the transit planet, the aspect type, the natal planet being activated, the exact weekly date, and the practical meaning of that temporary influence. This helps astrologers quickly understand what kind of weekly energy is active, how it may affect the user's emotions, actions, decisions, relationships, and personal development, and why that transit matters during the week.",
  "bullets": [
    "📅 Date-Based Weekly Reading — Each card is tied to a specific day in the selected week when the transit becomes active or strongest.",
    "🪐 Transit Planet Meaning — Shows the moving planet creating the temporary weekly influence, such as Mars, Venus, Mercury, Saturn, or Uranus.",
    "🌌 Natal Planet Activation — Shows which natal planet is receiving the transit influence, such as the Sun, Moon, Venus, Pluto, or Mercury.",
    "🔗 Aspect Interpretation — Explains the aspect type, such as Opposition, Trine, Sextile, Conjunction, or Square, and how that aspect behaves.",
    "💬 Short Narrative Format — Each card presents a readable weekly message in simple language so astrologers can scan the week quickly.",
    "⚖️ Opportunity and Challenge Insight — The interpretation highlights whether the transit brings pressure, harmony, motivation, emotional intensity, or growth potential.",
    "🎯 Real-Life Weekly Meaning — Helps explain practical weekly effects in areas like confidence, relationships, communication, emotional reactions, work, and decision-making.",
    "📖 Show More Support — Each card can include a Show More action to open a deeper explanation of that transit event.",
    "📍 Birth Data Based Generation — The reading is based on the user's date of birth, time of birth, and place of birth because the natal chart must be accurate before weekly transit comparison can happen.",
    "🔄 Weekly Transit-to-Natal Comparison — The system continuously compares the weekly moving planets against natal planets to detect important short-term activations.",
    "🧠 Astrologer-Friendly Use — This format helps astrologers quickly identify the meaning of each major weekly transit without manually interpreting every aspect.",
    "🚀 Practical Use — Useful for weekly forecasting, client guidance, planning important days, tracking emotional or relationship shifts, and understanding the strongest transit messages of the week."
  ]
},
    {
  "name": "horoscope_weekly_planet_deep_analysis",
  "label": "Weekly Transits: Deep Planet Analysis",
  "description": "A deeper weekly reading of key natal planets, showing how their sign, house, speed, and current transit activation shape the week's experiences.",
  "group": "Horoscope Toolkit",
  "subModule": "Weekly Transits",
  "purpose": "This section is generated after the user enters date of birth, time of birth, and place of birth, and the system creates the natal birth chart as the base reference. Then the platform calculates the current or selected week's transit movements and identifies which natal planets are most active during that week. This deep analysis screen gives astrologers a focused interpretation of one natal planet at a time, such as the Sun or Moon, by combining its natal sign, natal house, degree, speed, and the weekly transit pressure or support affecting it. It helps explain how core identity, emotions, motivation, confidence, and life direction are being influenced during the week in a more detailed and astrologer-friendly format.",
  "bullets": [
    "☀ Birth Data Based Generation — Uses the user's date of birth, time of birth, and place of birth to calculate the natal chart before any weekly transit reading is created.",
    "🪐 Natal Planet Focus — This screen highlights one major natal planet at a time, such as the Sun, Moon, Mercury, Venus, or Mars, for deeper weekly analysis.",
    "🏠 House Meaning Layer — Explains which natal house the planet occupies and which life area it naturally controls, such as career, home, identity, relationships, or communication.",
    "♈ Sign Meaning Layer — Explains how the natal zodiac sign shapes the planet's expression, such as Leo giving confidence and visibility or Taurus giving stability and emotional grounding.",
    "📐 Degree Precision Insight — Uses the natal degree of the planet to support exact interpretation and advanced astrological reading.",
    "⚡ Speed Interpretation — Includes planetary speed to explain whether the natal energy acts steadily, slowly, strongly, or with reflective timing.",
    "🔗 Weekly Transit Activation — Connects the natal planet to current weekly transits to show why that planet becomes important during the selected week.",
    "🧠 Deep Bullet Reading Format — Presents the interpretation as separate insight points so astrologers can read the weekly influence more clearly and systematically.",
    "🌙 Sun and Moon Priority — Especially useful for understanding weekly activation of the Sun for identity, confidence, leadership, and purpose, and the Moon for emotions, habits, comfort, and inner security.",
    "💬 Astrologer-Friendly Clarity — Converts technical natal and transit data into simple but meaningful weekly observations for consultation and analysis.",
    "📊 Practical Weekly Use — Helps astrologers identify where the user may feel driven, emotionally sensitive, professionally focused, or internally challenged during the week.",
    "🚀 Why This Section Is Useful — It gives a more focused weekly reading of core planets, allowing astrologers to understand not just what transit is happening, but which natal part of the person is being activated most deeply."
  ]
},

{
  "name": "horoscope_weekly_transit_cards",
  "label": "Weekly Transits: Transit Event Cards",
  "description": "Short weekly transit cards that explain how moving planets affect natal planets on specific dates during the selected week.",
  "group": "Horoscope Toolkit",
  "subModule": "Weekly Transits",
  "purpose": "This section is generated after the user enters date of birth, time of birth, and place of birth, and the system creates the natal birth chart as the base reference. Then the platform calculates the planetary movements for the selected week and compares those moving transit planets with the natal planets. When an important weekly aspect is formed, the system creates a separate card for that event. Each card shows the transit planet, the aspect type, the natal planet being activated, the exact weekly date, and a short interpretation of what that transit means in practical life. This helps astrologers quickly understand which weekly influences are strongest, what kind of pressure or support is active, and how the user's emotions, actions, relationships, and decisions may be affected during that week.",
  "bullets": [
    "📅 Date-Based Transit Event — Each card is tied to a specific day of the selected week when the transit becomes exact or most active.",
    "🪐 Transit Planet Focus — Shows the moving planet creating the weekly influence, such as Saturn, Venus, Mars, Mercury, or Uranus.",
    "🌌 Natal Planet Activation — Shows which natal planet is being triggered, such as the Moon, Sun, Mercury, Venus, or Pluto.",
    "🔗 Aspect Meaning — Explains the relationship between the transit planet and natal planet, such as Conjunction, Trine, Sextile, Opposition, or Square.",
    "💬 Short Interpretation Card — Gives a brief and readable explanation of the transit so astrologers can scan the weekly meaning quickly.",
    "⚖️ Support vs Challenge Insight — Helps identify whether the transit brings harmony, maturity, pressure, emotional intensity, clarity, or growth.",
    "🧠 Psychological Reading — Shows how the transit may influence inner feelings, reactions, emotional needs, communication style, or motivation during the week.",
    "🎯 Real-Life Weekly Meaning — Connects the transit to practical experiences such as relationships, work, self-care, decision-making, emotional boundaries, or social interaction.",
    "📖 Show More Support — Each card can open a deeper explanation for astrologers who want a more detailed transit reading.",
    "📍 Birth Data Based Generation — The cards are based on the user's date of birth, time of birth, and place of birth because accurate natal chart calculation is required before weekly transit comparison can happen.",
    "🔄 Weekly Transit Comparison Engine — The system continuously compares weekly moving planets against natal planets to detect important short-term activations.",
    "🚀 Practical Use — Useful for weekly forecasting, client guidance, planning important days, understanding emotional shifts, and identifying the strongest transit messages of the week."
  ]
},


// ----------Monthly Transits--------------//

{
  "name": "horoscope_monthly_entry_setup",
  "label": "Monthly Transits + Lunar Return: Entry & Generation Setup",
  "description": "Enter birth details to generate the full monthly transit and lunar return reading in 6 screens.",
  "group": "Horoscope Toolkit",
  "subModule": "Monthly Transits",
  "purpose": "This is the first entry point of the Monthly Transits + Lunar Return module. The user enters date of birth, time of birth, and place of birth so the system can calculate the natal chart as the base astrological reference. After the required fields are filled, the Generate Reading button becomes enabled. Once the user clicks Generate Reading, the platform starts building the monthly response screen by screen. It creates the natal chart, calculates the selected month's transit positions, computes the Lunar Return chart, compares transit planets with natal planets, and then generates the monthly chart view, future transit relation table, monthly transit interpretation cards, deep monthly transit analysis, and deeper event-based readings. This setup is important because all monthly transit and lunar return readings depend on accurate birth data. If the time or place is wrong, houses, angles, lunar return timing, and monthly transit activations may change, which can affect the astrologer's interpretation.",
  "bullets": [
    "📅 Step 1 — Birth Data Entry: The user enters date of birth, time of birth, and place of birth. The user may also select a specific month and optionally add an area of inquiry.",
    "✅ Step 2 — Generate Reading Activation: After the required birth details are filled correctly, the Generate Reading button becomes enabled and starts the monthly transit and lunar return calculation.",
    "📊 Step 3 — Monthly Chart View: The system generates the natal chart, monthly transit chart, lunar return chart, and overlay chart so astrologers can visually compare birth positions with monthly planetary movement.",
    "📋 Step 4 — Monthly Transit Relation Table: The platform creates a table showing the date, natal planet, aspect type, and transit planet being activated during the selected month.",
    "💬 Step 5 — Monthly Transit Interpretations: Important monthly transit aspects are converted into short readable interpretation cards so astrologers can quickly understand the meaning of each active influence.",
    "🧠 Step 6 — Deep Monthly Analysis: The system provides deeper analysis of important monthly transit events, lunar return influence, and major natal activations for more detailed astrological understanding."
  ]
},

{
  "name": "horoscope_monthly_chart",
  "label": "Monthly Transits + Lunar Return: Chart View",
  "description": "A combined monthly transit and lunar return chart generated from the user's birth details, showing how monthly planetary movement interacts with the natal chart.",
  "group": "Horoscope Toolkit",
  "subModule": "Monthly Transits",
  "purpose": "This chart is generated after the user enters date of birth, time of birth, and place of birth. The system first creates the natal birth chart from these birth details. Then it calculates the monthly transit positions for the selected month and also computes the Lunar Return chart for the moment the Moon returns to its natal position. These charts are then displayed together as natal chart, transit chart, and overlay chart so astrologers can visually study how the monthly moving planets and lunar cycle are interacting with the user's natal planets, houses, and angles. This view is useful because it gives a clear monthly astrological picture of emotional trends, short-term activation, opportunities, pressure points, and timing patterns across the month.",
  "bullets": [
    "📅 Birth Data Based Chart Creation — Uses the user's date of birth, time of birth, and place of birth to generate the natal chart as the base reference.",
    "🪐 Monthly Transit Calculation — Calculates the positions of the moving planets for the selected month to track ongoing monthly influences.",
    "🌙 Lunar Return Calculation — Calculates the exact moment when the Moon returns to its natal position, creating the Lunar Return chart for emotional and short-cycle monthly analysis.",
    "🔗 Natal + Monthly Comparison — Compares monthly transit planets and lunar return placements with natal planets, natal houses, and key chart angles.",
    "📊 Multi-Chart Display — Shows the natal wheel chart, monthly transit chart, and overlay chart so astrologers can visually compare all important monthly layers.",
    "⚡ Monthly Activation Insight — Helps identify which natal planets and points are receiving the strongest monthly activation.",
    "🏠 House Focus Tracking — Shows which houses and life areas, such as career, relationships, home, health, travel, or finances, are emphasized during the month.",
    "📐 Aspect Pattern Visibility — Makes it easier to visually study monthly aspect patterns between natal planets, transits, and lunar return positions.",
    "🌌 Emotional Timing Support — The lunar return layer adds extra insight into emotional cycles, inner reactions, and short-term personal focus within the month.",
    "💬 Interpretation Foundation — This chart serves as the visual base for monthly transit relation tables, interpretation cards, deep monthly analysis, and lunar return insights.",
    "🎯 Forecasting Use — Helps astrologers identify supportive days, tense periods, emotional peaks, and important monthly turning points more clearly.",
    "🔭 Astrologer-Friendly Wheel View — Presents the monthly transit and lunar return wheel charts in a clear visual format for structured monthly forecasting and interpretation."
  ]
},
      {
  "name": "horoscope_monthly_relation",
  "label": "Monthly Transits: Future Transit Relation Table",
  "description": "A monthly transit table showing how future moving planets form aspects with natal planets and key natal points on specific dates.",
  "group": "Horoscope Toolkit",
  "subModule": "Monthly Transits",
  "purpose": "This table is generated after the user enters date of birth, time of birth, and place of birth. The system first creates the natal birth chart from these birth details, including natal planets, house cusps, angles, and important chart points such as the Ascendant. Then it calculates the planetary positions for the selected future month and compares each moving transit planet with the natal chart. Whenever a meaningful aspect forms during that month, the system adds it to this table with the exact date, natal planet or natal point being activated, the aspect type, and the transit planet creating the influence. This table is very useful for astrologers because it shows the timing of important monthly activations, helps identify supportive and challenging periods, and gives a clear overview of which natal energies will be triggered throughout the month. It is especially helpful for forecasting emotional shifts, action periods, career pressure, relationship developments, communication windows, and longer monthly patterns.",
  "bullets": [
    "📅 How It Is Generated — Uses the user's date of birth, time of birth, and place of birth to calculate the natal chart first, then calculates future transit positions for the selected month and compares them with natal planets and natal points.",
    "🧭 Why This Table Is Used — It helps astrologers quickly see which days in the month are important, which natal planets are activated, and what kind of astrological influence is building, peaking, or passing.",
    "📆 Date Header Meaning — Shows the exact calendar day when the transit aspect becomes exact or strongest in the selected month.",
    "🌌 Natal Planet Header Meaning — Shows the natal planet or natal point receiving the transit influence, such as Sun, Moon, Mars, Pluto, Saturn, Uranus, or Ascendant.",
    "🔗 Type Header Meaning — Shows the aspect type formed between the transit planet and the natal planet, such as Conjunction, Opposition, Square, Trine, or Sextile.",
    "🪐 Transit Planet Header Meaning — Shows the moving planet creating the monthly influence, such as Jupiter, Mars, Mercury, Venus, Saturn, Uranus, or Pluto.",
    "☀ Natal Planet Importance — The natal planet represents the person's core birth-chart energy, so this column tells astrologers which part of the person's life and psychology is being triggered.",
    "⚡ Transit Planet Importance — The transit planet shows the temporary monthly force or event-energy acting on the natal chart, revealing what kind of pressure, support, or change is taking place.",
    "⚖ Aspect Type Importance — The aspect type helps astrologers judge whether the influence is easy, tense, demanding, activating, supportive, or transformative.",
    "🎯 Monthly Timing Use — This table is ideal for tracking important days for decisions, conversations, relationships, emotional processing, travel, work action, or caution.",
    "🏠 Natal Activation Value — Even though the table directly shows planets and points, each activation also indirectly affects the natal house and life area connected to that natal placement.",
    "🧠 Interpretation Support — The table serves as the technical base for monthly transit interpretations, event cards, deeper monthly analysis, and astrologer-friendly forecasting.",
    "📊 Forecasting Advantage — It gives a quick structured overview of the strongest monthly planetary contacts without forcing the astrologer to manually calculate every transit.",
    "🔮 Professional Use — Useful for monthly planning, client sessions, predictive astrology, identifying pressure periods, spotting supportive windows, and understanding the overall flow of the coming month."
  ]
},

{
  "name": "horoscope_monthly_transit_interpretations",
  "label": "Monthly Transits: Transit Interpretation Cards",
  "description": "Readable monthly transit cards showing how future moving planets activate natal planets on important dates.",
  "group": "Horoscope Toolkit",
  "subModule": "Monthly Transits",
  "purpose": "This section is generated after the user enters date of birth, time of birth, and place of birth. The system first creates the natal birth chart from those birth details. Then it calculates the moving planetary positions for the selected future month and compares them with the natal planets and key natal points. Whenever an important monthly aspect becomes exact or strong, the platform creates an interpretation card for that event. Each card explains which transit planet is active, which natal planet is being triggered, the aspect type, the exact date, and the practical meaning of that monthly influence. This helps astrologers quickly understand the major themes, pressure points, opportunities, emotional shifts, and growth patterns likely to appear during the month.",
  "bullets": [
    "📅 Birth Data Based Generation — Uses the user's date of birth, time of birth, and place of birth to calculate the natal chart before any monthly transit reading is created.",
    "🪐 Transit Planet Meaning — Shows the moving planet creating the monthly influence, such as Jupiter, Mars, Mercury, Venus, Saturn, Uranus, or Pluto.",
    "🌌 Natal Planet Meaning — Shows the natal planet receiving the transit influence, such as the Sun, Moon, Mars, Mercury, Venus, Saturn, or Pluto.",
    "🔗 Aspect Meaning — Explains the relationship between the transit planet and natal planet, such as Square, Opposition, Conjunction, Trine, or Sextile.",
    "📆 Exact Monthly Timing — Each card is linked to a specific date in the selected month so astrologers can identify when the transit becomes strongest.",
    "💬 Readable Card Format — Converts technical monthly transit data into short, clear interpretation cards that are easier to scan than a raw aspect table.",
    "⚖️ Opportunity and Challenge Insight — Helps show whether the monthly transit brings tension, motivation, emotional pressure, support, harmony, maturity, or transformation.",
    "🎯 Real-Life Monthly Meaning — Connects the transit to practical life areas such as confidence, relationships, communication, emotional reactions, career action, conflict management, and personal growth.",
    "📖 Show More Support — Each monthly transit card can include a Show More action so astrologers can open a deeper explanation of that specific transit event.",
    "🧠 Forecasting Use — Useful for identifying important monthly dates for action, caution, reflection, communication, relationship work, and emotional processing.",
    "📊 Interpretation Layer Purpose — This card section is the readable interpretation layer built on top of the monthly transit relation table and chart calculations.",
    "🔮 Astrologer-Friendly Value — Helps astrologers quickly understand the strongest monthly transit messages without manually interpreting every aspect from scratch."
  ]
},

{
  "name": "horoscope_monthly_transit_deep_analysis",
  "label": "Monthly Transits: Deep Astrological Analysis",
  "description": "A detailed monthly interpretation screen for a specific future transit event, opened after the user clicks Show More.",
  "group": "Horoscope Toolkit",
  "subModule": "Monthly Transits",
  "purpose": "This section is generated after the user enters date of birth, time of birth, and place of birth, and the system creates the natal birth chart as the base reference. Then it calculates the future transit positions for the selected month and compares them with natal planets and key natal points. When an important monthly aspect becomes active, such as Jupiter square natal Mars, the platform first shows a short interpretation card. If the user clicks Show More, this deep analysis screen opens and gives a fuller explanation of that transit event. It helps astrologers understand not only the aspect itself, but also the psychological pressure, practical life effects, growth lesson, and best way to handle the transit during the month.",
  "bullets": [
    "📅 Monthly Transit Event Focus — This screen explains one specific transit event in detail for the selected month, such as Jupiter square Mars or Mars opposite Sun.",
    "🪐 Transit Planet Meaning — Shows the moving planet creating the influence and explains what kind of temporary monthly force it brings.",
    "🌌 Natal Planet Meaning — Shows the natal planet receiving the transit and explains which core personality function or life energy is being activated.",
    "🔗 Aspect Type Meaning — Explains how the aspect behaves, such as Square creating tension and challenge, Opposition creating balance pressure, Conjunction creating intensity, Trine creating ease, or Sextile creating opportunity.",
    "📍 Birth Data Based Generation — The reading is based on the user's date of birth, time of birth, and place of birth because the natal chart must be accurate before monthly transit comparison can be interpreted correctly.",
    "🧠 Psychological Insight — Gives a deeper reading of the inner emotional, mental, and motivational patterns activated by the transit.",
    "🎯 Practical Life Meaning — Explains how the transit may affect real monthly experiences such as action, confidence, conflict, relationships, work decisions, pressure, or growth.",
    "⚖️ Challenge and Opportunity Balance — Helps astrologers see both the difficult side of the transit and the constructive way to work with it.",
    "📖 Expanded Interpretation Layer — This screen is the long-form explanation that appears after the short transit card summary.",
    "🔮 Forecasting Value — Useful for understanding the deeper monthly lesson, timing, and developmental meaning behind a strong transit event.",
    "💬 Astrologer-Friendly Reading — Converts technical transit data into a fuller interpretation that is easier to explain during client consultation.",
    "🚀 Practical Use — Useful for monthly forecasting, client guidance, decision timing, emotional preparation, and deeper transit study."
  ]
},

{
  "name": "horoscope_monthly_transit_cards",
  "label": "Monthly Transits: Transit Event Cards",
  "description": "Short monthly transit cards showing how future moving planets activate natal planets on important dates during the selected month.",
  "group": "Horoscope Toolkit",
  "subModule": "Monthly Transits",
  "purpose": "This section is generated after the user enters date of birth, time of birth, and place of birth, and the system creates the natal birth chart as the base reference. Then it calculates the future transit positions for the selected month and compares those moving planets with the natal planets and important natal points. When a strong or meaningful monthly aspect is found, the platform creates a separate transit event card for that date. Each card explains the transit planet, the natal planet being activated, the aspect type, the exact monthly date, and the practical meaning of that influence. This helps astrologers quickly understand which monthly events are most important, which energies are supportive or challenging, and how the user's emotions, creativity, confidence, relationships, motivation, and personal growth may be influenced during the month.",
  "bullets": [
    "📅 Date-Based Monthly Event — Each card is linked to a specific date in the selected month when the transit becomes exact or strongest.",
    "🪐 Transit Planet Focus — Shows the moving planet creating the monthly influence, such as Venus, Jupiter, Mars, Mercury, Saturn, or Uranus.",
    "🌌 Natal Planet Activation — Shows which natal planet is being triggered, such as the Sun, Moon, Mars, Mercury, Venus, Pluto, or Ascendant.",
    "🔗 Aspect Meaning — Explains the relationship between the transit planet and natal planet, such as Trine, Square, Opposition, Conjunction, or Sextile.",
    "💬 Short Interpretation Card — Gives a brief and readable monthly explanation so astrologers can scan the main transit message quickly.",
    "⚖️ Support vs Challenge Insight — Helps identify whether the transit brings harmony, ease, pressure, emotional intensity, optimism, maturity, or transformation.",
    "🎯 Real-Life Monthly Meaning — Connects the transit to practical experiences such as relationships, confidence, creativity, communication, conflict management, emotional healing, and personal development.",
    "📖 Show More Support — Each monthly transit card can open a deeper analysis screen for astrologers who want a fuller explanation of that specific transit event.",
    "📍 Birth Data Based Generation — The cards are based on the user's date of birth, time of birth, and place of birth because accurate natal chart calculation is required before monthly transit comparison can happen.",
    "🔄 Monthly Transit Comparison Engine — The system compares future monthly moving planets against natal planets and natal points to detect the strongest short-term activations.",
    "🧠 Astrologer-Friendly Use — This format helps astrologers quickly identify the meaning of each major monthly transit without manually interpreting every aspect from the relation table.",
    "🚀 Practical Use — Useful for monthly forecasting, client guidance, planning important dates, understanding emotional or relationship shifts, and identifying the strongest transit messages of the month."
  ]
},

      // ---------------Romantic: Synastry Setup---------------//
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

      // ── Mundane Astrology (extended) ─────────────────────────────────────
      {
        name: "admin_mundane_leaders",
        label: "World Leaders Registry",
        description: "A searchable directory of world leaders and notable persons tracked in mundane astrology — current and historical.",
        group: "Mundane Astrology",
        purpose: "Maintains a biographical and astrological record of key political and cultural figures whose charts are used in mundane research and forecasting.",
        bullets: [
          "Filter by current / former leader status",
          "Birth date, birth location, and Astrodatabank confidence rating (AA–X) per record",
          "Linked to country entity — one click navigates to the entity's full mundane profile",
          "Add / edit leader with natal chart data entry fields"
        ]
      },
      {
        name: "admin_mundane_leader_detail",
        label: "Leader Detail — Natal Profile",
        description: "Full profile for a single world leader: natal chart, time-lord analysis (Profection, Firdaria), linked events, and admin notes.",
        group: "Mundane Astrology",
        purpose: "The deepest view in the leader registry — combines biographical data with astrological time-lord calculations to support event correlation research.",
        bullets: [
          "Natal wheel chart generated from stored birth data",
          "Annual profection table showing current activated house and sign lord",
          "Firdaria timeline — major and minor lord periods mapped to a scrollable chart",
          "Linked mundane events where this leader is a key actor"
        ]
      },
      {
        name: "admin_mundane_backtesting",
        label: "Backtesting Engine",
        description: "Test astrological hypotheses against historical data — enter a planetary configuration and see when it recurred across recorded history.",
        group: "Mundane Astrology",
        purpose: "Allows researchers to validate predictive models by comparing current transits against historical analogues with documented outcomes.",
        bullets: [
          "Input any planet-sign-house combination and search historical occurrence dates",
          "Returns a ranked list of closest analogues with correlation scores",
          "Click any result to open the historical analogue detail with event log",
          "Export results as CSV for external research use"
        ]
      },
      {
        name: "admin_mundane_backtesting_detail",
        label: "Backtesting Result Detail",
        description: "Detailed view of a single backtesting run — the analogue date, planetary snapshot, correlated events, and confidence score breakdown.",
        group: "Mundane Astrology",
        purpose: "Gives researchers a granular look at how closely a historical period mirrors current transits and what documented events occurred.",
        bullets: [
          "Side-by-side planetary position comparison: current vs. historical",
          "Correlation score components: orb tolerance, exact aspects, midpoints",
          "Timeline of events that occurred within the analogue window",
          "Admin notes field for attaching commentary and research findings"
        ]
      },
      {
        name: "admin_mundane_timeline",
        label: "Event Timeline",
        description: "A chronological view of all mundane events, forecasts, and chart activations — filterable by entity, event type, and date range.",
        group: "Mundane Astrology",
        purpose: "Provides a unified time-ordered view of everything tracked in the mundane system so researchers can spot patterns and gaps.",
        bullets: [
          "Swimlane view: events grouped by entity in a horizontal timeline",
          "Filter by event type (political, economic, natural disaster, military)",
          "Click any event bar to open the full mundane event record",
          "Export filtered timeline as PDF or PNG for presentations"
        ]
      },
      {
        name: "admin_mundane_alerts",
        label: "Mundane Alerts",
        description: "Automated alert system that fires when a significant planetary configuration (eclipse, ingress, major aspect) enters orb.",
        group: "Mundane Astrology",
        purpose: "Ensures the research team never misses a critical astrological event by surfacing actionable alerts before the window opens.",
        bullets: [
          "Pending alerts ranked by significance score",
          "Each alert shows the exact date, planet, aspect, and affected entities",
          "Snooze or dismiss alerts with a logged reason",
          "Configure alert thresholds: orb tolerance and minimum significance score"
        ]
      },
      {
        name: "admin_mundane_cycles",
        label: "Planetary Cycles Tracker",
        description: "Monitor long-term planetary cycles — Jupiter-Saturn conjunctions, Pluto ingresses, nodal returns — across a configurable time horizon.",
        group: "Mundane Astrology",
        purpose: "Tracks the macro backdrop of mundane astrology so that shorter-term research is contextualised within larger civilisational cycles.",
        bullets: [
          "Cycle list: all active and upcoming cycles with exact dates and current phase",
          "Phase bar: visual arc showing how far through the cycle the world currently sits",
          "Historical events overlaid on each cycle for research correlation",
          "Subscribe to a cycle to receive alerts when phase milestones are reached"
        ]
      },
      {
        name: "admin_mundane_eclipses",
        label: "Eclipse Tracker",
        description: "Full catalogue of upcoming solar and lunar eclipses with shadow path, chart data, and entity exposure analysis.",
        group: "Mundane Astrology",
        purpose: "Eclipses are primary mundane triggers — this page ensures every eclipse is logged, geocoded, and linked to the entities it most directly activates.",
        bullets: [
          "Eclipse list with type (total/partial/annular), path countries, and saros series",
          "Entity exposure: which tracked countries and cities fall in the shadow path",
          "Natal-chart sensitivity: which tracked leader charts have planets near the eclipse degree",
          "Click any eclipse to open the full chart and generate a mundane interpretation"
        ]
      },
      {
        name: "admin_mundane_scoring",
        label: "Mundane Significance Scoring",
        description: "Rule-based engine that assigns a significance score (0–100) to any date based on active transits, eclipses, ingresses, and station events.",
        group: "Mundane Astrology",
        purpose: "Provides an objective ranking of which dates carry the highest astrological charge — useful for allocating research attention and scheduling client reports.",
        bullets: [
          "Calendar heatmap: dates colour-coded by significance score",
          "Score breakdown panel: which factors contribute to each date's total",
          "Adjust weighting rules for each transit type to customise the model",
          "Export a 12-month significance calendar as CSV or PDF"
        ]
      },
      {
        name: "admin_mundane_ai_brief",
        label: "AI Mundane Brief",
        description: "AI-generated weekly intelligence brief synthesising current transits, active cycles, and upcoming eclipses into a plain-language narrative.",
        group: "Mundane Astrology",
        purpose: "Reduces the research overhead for the team by automating the first draft of a weekly mundane briefing — editors refine and publish.",
        bullets: [
          "Auto-generates on Monday mornings using the Lambda AI router",
          "Sections: global weather, regional hotspots, key leader activations, market notes",
          "Edit inline before publishing to the member-facing mundane dashboard",
          "Version history — compare this week's draft to previous briefs"
        ]
      },
      {
        name: "admin_mundane_market_intelligence",
        label: "Market Intelligence",
        description: "Correlate planetary transits with asset price movements — charts, commodity prices, and index performance mapped against astrological events.",
        group: "Mundane Astrology",
        purpose: "Supports the platform's financial astrology offering by giving researchers the data they need to validate and publish market-oriented forecasts.",
        bullets: [
          "Asset selector: choose from tracked indices, commodities, and FX pairs",
          "Overlay transits: add any planet-aspect event to the price chart as a vertical marker",
          "Correlation matrix: auto-calculate r-values between aspect dates and price changes",
          "Save correlation studies to the research library for later citation"
        ]
      },
      {
        name: "admin_mundane_workspaces",
        label: "Research Workspaces",
        description: "Saved research sessions — a workspace bundles a set of entities, date ranges, transits, and notes into a persistent named project.",
        group: "Mundane Astrology",
        purpose: "Allows researchers to organise long-running projects without losing context — each workspace is its own persistent analytical environment.",
        bullets: [
          "Workspace list with last-opened date, entity count, and collaborator avatars",
          "Create a new workspace from a template (election, disaster, financial crisis)",
          "Add entities, events, chart screenshots, and notes within the workspace",
          "Share a workspace with another admin or export to PDF for client delivery"
        ]
      },
      {
        name: "admin_mundane_historical_analogs",
        label: "Historical Analogues Library",
        description: "A curated database of past mundane events with full planetary snapshots — the source material for backtesting and AI brief generation.",
        group: "Mundane Astrology",
        purpose: "Provides the ground-truth dataset for the backtesting engine and AI brief — well-documented historical events make the predictions more defensible.",
        bullets: [
          "Search by event type, date, entity, or planet involved",
          "Each record: event description, exact date, planetary snapshot at time, outcome notes",
          "Admin-verified records marked with a trust badge; unverified shown in amber",
          "Import events from a CSV template or add individually"
        ]
      },
      {
        name: "admin_mundane_library",
        label: "Mundane Research Library",
        description: "Centralised repository for all saved mundane research: reports, chart screenshots, AI briefs, and published forecasts.",
        group: "Mundane Astrology",
        purpose: "Ensures that research doesn't live in individual researchers' inboxes — everything is searchable, tagged, and attributable.",
        bullets: [
          "Filter by document type (report, brief, chart, forecast) and date",
          "Tag documents by entity, planet, or event for cross-referenced retrieval",
          "Published documents are visible to members in the PM portal mundane section",
          "Version history on each document — restore any prior version"
        ]
      },
      {
        name: "admin_mundane_watchlist",
        label: "Entity Watchlist",
        description: "A curated short-list of entities under active monitoring — admins pin the most astrologically activated entities here for daily attention.",
        group: "Mundane Astrology",
        purpose: "Surfaces the highest-priority entities without requiring a full search each day — the watchlist is the researcher's morning dashboard.",
        bullets: [
          "Pin any entity from the registry to the watchlist in one click",
          "Each pinned entity shows current transit highlights and next alert date",
          "Custom note per entity: private research memo visible only to admins",
          "Watchlist is shared across the admin team — everyone sees the same priority list"
        ]
      },
      {
        name: "admin_mundane_imports",
        label: "Data Imports",
        description: "Bulk import mundane entities, events, or leaders from structured CSV or JSON files — useful for onboarding new research datasets.",
        group: "Mundane Astrology",
        purpose: "Allows the research team to ingest large datasets (e.g., a complete election database or a century of documented crises) without manual entry.",
        bullets: [
          "Download the import template for each record type (entity, event, leader)",
          "Validation report shows errors and warnings before committing the import",
          "Import history log: who imported what, when, and how many records were created",
          "Rollback button: undo the last import if errors are discovered post-commit"
        ]
      },
      {
        name: "admin_mundane_subscriptions",
        label: "Mundane Report Subscriptions",
        description: "Manage which members receive the weekly AI mundane brief by email — subscription list, unsubscribes, and delivery status.",
        group: "Mundane Astrology",
        purpose: "Controls the distribution of published mundane research to member inboxes — separate from the platform notification system.",
        bullets: [
          "Subscriber list with email, subscription date, open rate, and last delivery",
          "Add members manually or enable auto-enrolment for all active PM members",
          "Unsubscribe log: reason captured when a member opts out",
          "Test delivery: send the latest brief to a single email address for QA"
        ]
      },

      // ── Mystery School Admin (extended) ──────────────────────────────────
      {
        name: "admin_ms_student_detail",
        label: "Student Detail Page",
        description: "Full record for a single Mystery School student — subscription status, decan progress grid, foundation week completion, and admin actions.",
        group: "Mystery School",
        purpose: "The most granular admin view of a student — gives support staff and programme directors complete context for handling queries or exceptions.",
        bullets: [
          "Subscription status: active/cancelled, one-time fee paid, next billing date",
          "36-decan progress grid: coloured status per decan (completed/active/missed/excused)",
          "Foundation week completion: 12 weeks with per-task breakdown",
          "Admin actions: excuse a missed decan, override status, add internal note"
        ]
      },
      {
        name: "admin_ms_decan_detail",
        label: "Decan Detail — Admin View",
        description: "Admin perspective on a single decan record: decan description, active student cohort, completion rates, and content management.",
        group: "Mystery School",
        purpose: "Allows admins to monitor how students are engaging with each decan and update the decan's instructional content without a code deploy.",
        bullets: [
          "Decan metadata: sign, ruling planet, tarot card reference, artwork URL",
          "Cohort view: how many students are active/completed/missed on this decan right now",
          "Content editor: update the preview text, ritual instructions, and scrying prompt",
          "Window configuration: set or override window open, close, and grace dates for this decan"
        ]
      },
      {
        name: "admin_ms_graduation_queue",
        label: "Graduation Queue",
        description: "Students who have completed all 36 decans and 12 foundation weeks — awaiting final admin review and certificate generation.",
        group: "Mystery School",
        purpose: "Provides a clear workflow for approving graduations — admins verify completion, confirm no unexcused misses, then trigger the certificate.",
        bullets: [
          "Queue sorted by completion date — longest-waiting graduates shown first",
          "One-click eligibility check: flags unexcused misses or incomplete foundation weeks",
          "Generate certificate button: sends the Priest/Priestess certificate email and updates the student record",
          "Graduation log: complete history of all graduates with certificate generation date"
        ]
      },
      {
        name: "admin_ms_excuse_workflow",
        label: "Decan Excuse Workflow",
        description: "Review and approve student requests to excuse a missed decan — see the reason, the decan details, and approve or reject with a note.",
        group: "Mystery School",
        purpose: "Maintains programme integrity while allowing compassionate exceptions for students with documented unavoidable circumstances.",
        bullets: [
          "Pending excuse requests with student name, decan number, missed date, and stated reason",
          "Approve: marks the decan as admin-excused so it no longer blocks graduation",
          "Reject: sends the student a rejection notification with the admin's note",
          "Excuse history: all decisions audited with timestamp and admin username"
        ]
      },
      {
        name: "admin_ms_foundation_weeks",
        label: "Foundation Week Manager",
        description: "Edit the content of each of the 12 foundation weeks — title, description, audio recording URL, Beto photo, and per-week task list.",
        group: "Mystery School",
        purpose: "Allows the curriculum team to update foundation content without engineering involvement — new audio drops, task revisions, and week descriptions.",
        bullets: [
          "12 week cards in week-number order, each expandable for editing",
          "Audio URL field: paste the direct media URL for the week's Beto teaching",
          "Task editor: add, remove, or reorder tasks within each week",
          "Published / draft toggle: keep a week in draft while content is being finalised"
        ]
      },

      // ── Governance & Users (extended) ────────────────────────────────────
      {
        name: "admin_diviner_detail",
        label: "Diviner Profile — Admin View",
        description: "Full admin view of a single diviner: contact info, services, revenue history, booking stats, active subscriptions, and suspension controls.",
        group: "Governance",
        purpose: "Support staff use this page to resolve diviner queries, audit their account activity, and manage any compliance or quality issues.",
        bullets: [
          "Lifetime revenue, booking count, and average rating pulled in real-time",
          "Service list with per-service pricing and active/inactive status",
          "Recent bookings table with session type, client name, and completion status",
          "Admin controls: suspend account, reset password, add internal compliance note"
        ]
      },
      {
        name: "admin_client_detail",
        label: "Client Profile — Admin View",
        description: "Full admin view of a single client account — birth data, session history, active subscriptions, and support notes.",
        group: "Governance",
        purpose: "Gives support staff complete context on a client before responding to a query or escalation — no need to switch between systems.",
        bullets: [
          "Birth data on file: date, time, city, and chart generation history",
          "Session history: all completed and upcoming bookings with diviner names",
          "Subscription status: active PM/MS memberships, payment method, next billing date",
          "Support notes: internal timeline of all admin actions taken on this account"
        ]
      },
      {
        name: "admin_trainee_detail",
        label: "Trainee Profile — Admin View",
        description: "Full admin view of a trainee: mentor assignment, program enrolment, lesson completion, quiz scores, and training status.",
        group: "Governance",
        purpose: "Training managers use this to monitor individual trainee progress and intervene when a trainee falls behind or needs re-assignment.",
        bullets: [
          "Current training status: active / graduated / on-hold",
          "Mentor assignment with last session date",
          "Program completion bars for all enrolled programs",
          "Quiz score history and average — flag if score drops below threshold"
        ]
      },
      {
        name: "admin_user_audit_log",
        label: "User Audit Log",
        description: "Complete timestamped log of all admin actions taken on a specific user account — who did what and when.",
        group: "Governance",
        purpose: "Provides accountability and a paper trail for every administrative change — essential for compliance and dispute resolution.",
        bullets: [
          "Chronological action log: login events, role changes, subscription modifications, notes added",
          "Admin actor shown for every entry — no anonymous changes",
          "Filter by action type (auth, billing, role, content, support)",
          "Export to CSV for legal or compliance reporting"
        ]
      },
      {
        name: "admin_bulk_actions",
        label: "Bulk Actions Console",
        description: "Perform the same operation on multiple users at once — bulk suspend, bulk email, bulk role assignment, or bulk export.",
        group: "Governance",
        purpose: "Saves hours of repetitive individual account management — a single bulk action can process hundreds of users in seconds.",
        bullets: [
          "Filter and select users by role, status, join date, or tag",
          "Available bulk actions: send email, assign role, suspend, export CSV, add tag",
          "Confirmation modal shows exact count and action before executing",
          "Bulk action log: every bulk operation recorded with actor, timestamp, and affected users"
        ]
      },
      {
        name: "admin_feature_flags",
        label: "Feature Flags",
        description: "Toggle platform features on or off by role, user group, or percentage rollout — without a code deploy.",
        group: "Config",
        purpose: "Gives the product team safe gradual rollouts and instant kill-switches for any feature — essential for managing risk in production.",
        bullets: [
          "Feature list with current state (enabled/disabled) and rollout percentage",
          "Target by role: enable a feature only for Diviners, or only for PM Members",
          "User overrides: force a feature on or off for a specific user (for QA testing)",
          "Change log: every flag toggle recorded with actor and reason"
        ]
      },
      {
        name: "admin_webhook_logs",
        label: "Webhook Logs",
        description: "Real-time log of all incoming Stripe, VideoSDK, and third-party webhook events — status, payload, retry count, and processing result.",
        group: "Config",
        purpose: "The first place to look when a payment, session, or integration event is not reflected correctly in the platform — full payload visibility.",
        bullets: [
          "Webhook log with event type, source, received-at timestamp, and HTTP response code",
          "Payload viewer: expand any event to see the full JSON body",
          "Failed events highlighted in red with error message and retry count",
          "Manual retry button: re-process any failed webhook immediately"
        ]
      },
      {
        name: "admin_system_health",
        label: "System Health Dashboard",
        description: "Live overview of platform health — API response times, error rate, active sessions, database query performance, and third-party status.",
        group: "Config",
        purpose: "Provides the engineering and ops team with an always-on health view so issues are caught before members report them.",
        bullets: [
          "Four golden signals: latency P95, error rate %, active sessions, DB saturation",
          "Stripe, VideoSDK, and AWS Chime status widgets (live heartbeat checks)",
          "Alert history: last 24 hours of triggered monitoring alerts",
          "Link to full OpenTelemetry dashboard (Grafana / Datadog) for deep-dive"
        ]
      },
      {
        name: "admin_email_templates",
        label: "Email Template Library",
        description: "All transactional and marketing email templates — view, preview, and edit HTML/text content for any system-generated email.",
        group: "Config",
        purpose: "Allows content and ops teams to update email copy, branding, and CTAs without engineering involvement.",
        bullets: [
          "Template list: grouped by trigger (booking confirmation, subscription renewal, graduation, etc.)",
          "Live preview: see the rendered HTML email in a web frame with test variable substitution",
          "Edit HTML and plain-text versions side by side",
          "Send test email to any address before saving changes"
        ]
      },
      {
        name: "admin_scheduled_tasks",
        label: "Scheduled Task Manager",
        description: "View and control all cron jobs and scheduled tasks running on the platform — mundane alerts, decan window opens, email digests, and more.",
        group: "Config",
        purpose: "Gives ops full visibility and control over automated background processes — catch stuck jobs, trigger manual runs, and audit run history.",
        bullets: [
          "Task list with name, cron expression, last run time, and last run status",
          "Run now button: trigger any scheduled task immediately for testing or backfill",
          "Failure alerts: tasks that errored in the last 24 hours highlighted with error detail",
          "Disable / enable toggle: pause any task without deleting the schedule"
        ]
      },
      {
        name: "admin_session_recordings",
        label: "Session Recordings Library",
        description: "Admin-side library of recorded video and phone sessions stored in S3 — searchable by diviner, client, date, and session type.",
        group: "Governance",
        purpose: "Required for quality control, dispute resolution, and compliance — admins can retrieve any recorded session on demand.",
        bullets: [
          "Search by diviner name, client name, session date, or session ID",
          "Play back video recordings directly in the portal with timestamp navigation",
          "Download or delete any recording (with logged deletion reason)",
          "Retention policy indicator: how many days remain before auto-deletion"
        ]
      },
      {
        name: "admin_chime_infrastructure",
        label: "Chime Infrastructure Status",
        description: "Live status of the AWS Chime SIP Media Application — active calls, pipeline health, and SMA configuration for phone readings.",
        group: "Config",
        purpose: "Gives ops visibility into the telephony layer so call failures can be diagnosed without opening the AWS console.",
        bullets: [
          "Active call count: live count of ongoing phone readings routed through Chime SMA",
          "SMA health check: last heartbeat, last error, and PSTN gateway status",
          "DID inventory: all E.164 numbers provisioned for inbound calling",
          "Lambda ARN and version displayed for quick reference during incidents"
        ]
      },
      {
        name: "admin_pm_member_detail",
        label: "PM Member Detail — Admin View",
        description: "Full admin view of a Perennial Mandalism member: subscription, family members, plan tier, billing history, and portal activity.",
        group: "Governance",
        purpose: "Support staff use this to answer member billing queries, verify plan entitlements, and make exceptions (e.g., manual tier adjustments).",
        bullets: [
          "Membership status, tier, and next billing date",
          "Family member list with relationship, age group, and date of birth",
          "Stripe subscription ID and link to the customer's Stripe dashboard page",
          "Activity summary: last login, last session attended, resources accessed this month"
        ]
      },
      {
        name: "admin_pm_plan_tiers",
        label: "Plan Tier Configuration",
        description: "Edit the Perennial Mandalism plan tiers — name, base price, included member count, extra member price, and max total members.",
        group: "Config",
        purpose: "Allows ops to adjust pricing and tier structure without a code deploy — critical for promotional pricing and plan restructuring.",
        bullets: [
          "Tier list with current price and member limits at a glance",
          "Edit tier: inline form for all pricing fields with change preview",
          "Active / inactive toggle: retire a tier without deleting it",
          "Stripe product ID linkage: each tier maps to a Stripe Price object"
        ]
      },
      {
        name: "admin_commission_payouts",
        label: "Commission Payout Manager",
        description: "Manage pending and historical commission payouts to social advocates and affiliates — approve, hold, or release batch payouts.",
        group: "Commerce",
        purpose: "Prevents payout errors by requiring manual approval before funds transfer — gives finance a checkpoint on every commission batch.",
        bullets: [
          "Pending payouts list: advocate name, amount owed, referral count, and period",
          "Approve selected: sends the payout via Stripe payouts to the linked bank account",
          "Hold: flag a payout for review with a reason — advocate notified",
          "Export: generate a payout batch report for accounting reconciliation"
        ]
      },
      {
        name: "admin_giveaway_detail",
        label: "Giveaway Detail Page",
        description: "Full view of a single giveaway campaign: entry rules, participants, draw configuration, winner selection, and notification history.",
        group: "Commerce",
        purpose: "Manages the full giveaway lifecycle — from entry configuration through randomised winner selection and prize notification.",
        bullets: [
          "Giveaway status: draft / active / ended / winner-selected",
          "Participant list with entry date, entry method, and qualification status",
          "Winner draw: configure the algorithm (random, weighted by entries, admin pick)",
          "Notify winner: sends the prize email with redemption instructions"
        ]
      },
      {
        name: "admin_testimonial_detail",
        label: "Testimonial Detail — Moderation View",
        description: "Single testimonial review screen: full text, star rating, client identity, attached session, and moderation actions.",
        group: "Governance",
        purpose: "Gives moderators full context on a testimonial before approving or rejecting — links back to the actual session record for verification.",
        bullets: [
          "Full testimonial text with client name (or anonymous flag) and star rating",
          "Linked booking record: verify the session actually happened before approving",
          "Approve: publishes the testimonial on the diviner's public profile",
          "Reject with reason: sends a notification to the client explaining the decision"
        ]
      },
      {
        name: "admin_report_engagement",
        label: "Engagement Report",
        description: "Platform-wide engagement metrics — daily active users, feature adoption rates, content consumption, and session-to-booking conversion.",
        group: "Reports",
        purpose: "Measures how deeply members are using the platform beyond just paying — engagement is the lead indicator of retention and upsell.",
        bullets: [
          "DAU/MAU ratio — the stickiness metric that shows how often active users return",
          "Feature adoption heatmap: which pages and tools are used most across each role",
          "Content consumption: most-watched videos, most-read articles, most-completed rituals",
          "Conversion funnel: member acquisition → first session → second session rates"
        ]
      },
      {
        name: "admin_report_churn",
        label: "Churn & Retention Report",
        description: "Monthly cohort analysis of subscription churn — which cohorts have the highest dropout, at what tenure month, and correlated factors.",
        group: "Reports",
        purpose: "Identifies at-risk member segments before they cancel so the team can intervene with outreach or feature improvements.",
        bullets: [
          "Cohort retention grid: signup month on the Y axis, tenure month on the X axis",
          "Churn reasons captured at cancellation: price, inactivity, life changes, product",
          "At-risk segment: members in month 3–4 of tenure (historically highest dropout point)",
          "Revenue impact of churn: estimated MRR lost if current cohort churn rates persist"
        ]
      },
      {
        name: "admin_report_nps",
        label: "NPS & Satisfaction Report",
        description: "Net Promoter Score trends from post-session surveys, testimonial star ratings, and platform satisfaction polls.",
        group: "Reports",
        purpose: "Tracks the platform's reputation from the member perspective — NPS is the leading indicator of word-of-mouth growth.",
        bullets: [
          "Overall NPS score with 30/90/365-day trend sparklines",
          "NPS by role: Diviners vs PM Members vs Clients — different satisfaction drivers",
          "Verbatim response browser: read unfiltered member comments with sentiment tag",
          "Alert if NPS drops more than 10 points month-over-month"
        ]
      },
      {
        name: "admin_ai_content_moderation",
        label: "AI Content Moderation Queue",
        description: "AI-flagged content items (testimonials, journal entries, community posts) awaiting human review before appearing on the platform.",
        group: "Governance",
        purpose: "First line of defence for content safety — AI catches obvious violations at scale, human moderators handle edge cases in the queue.",
        bullets: [
          "Flagged items list with content type, AI confidence score, and flag reason",
          "Side-by-side view: flagged content on the left, AI explanation on the right",
          "Approve: clears the flag and publishes the content",
          "Reject and notify: removes the content and sends a policy violation notice to the author"
        ]
      },
      {
        name: "quiz-bank-admin",
        label: "Quiz Bank",
        description: "Central library of all quiz questions used across trainee lessons and certifications. Admins can create, edit, tag, and retire questions. Each question is tagged to a lesson topic and difficulty tier.",
        group: "Training",
        purpose: "Maintains a structured, reusable pool of assessment questions so lesson authors do not have to duplicate effort when building new quizzes.",
        bullets: [
          "Question list with topic tag, difficulty (Beginner / Intermediate / Advanced), and active status",
          "Inline editor — add answer choices, mark the correct answer, and attach an explanation",
          "Usage count column showing how many quizzes currently reference each question"
        ]
      },
      {
        name: "quiz-detail-admin",
        label: "Quiz Detail",
        description: "Full editor for a single quiz assigned to a training lesson. Admins configure the question set, passing score, number of attempts allowed, and remediation content. Shows live completion stats once deployed.",
        group: "Training",
        purpose: "Gives admins granular control over each quiz without touching the broader lesson structure.",
        bullets: [
          "Drag-and-drop question ordering with live preview of the student experience",
          "Passing-score slider and max-attempts spinner with save confirmation",
          "Submission analytics panel — avg score, pass rate, most-missed question"
        ]
      },
      {
        name: "package-detail",
        label: "Service Package Detail",
        description: "Detailed view and editor for a single session package sold on the platform. Admins can adjust session count, price, expiry window, and which diviner types are eligible. Includes sales history and active subscriber count.",
        group: "Commerce",
        purpose: "Allows fine-grained control over individual packages without bulk-editing the full pricing grid.",
        bullets: [
          "Package metadata: name, description, session count, validity period, and allowed service types",
          "Pricing override per-currency with Stripe price ID sync status",
          "Sales chart showing units sold per month with revenue total"
        ]
      },
      {
        name: "stripe-config",
        label: "Stripe Configuration",
        description: "Admin panel for managing Stripe Connect settings including platform fee percentage, payout schedule, connected account requirements, and webhook endpoint health. Shows live connection status to Stripe dashboard.",
        group: "Config",
        purpose: "Centralises all Stripe integration settings so payment behaviour can be adjusted without a code deploy.",
        bullets: [
          "Platform fee percentage field with instant preview of net diviner payout on a sample transaction",
          "Webhook endpoint health — last ping timestamp and event types registered",
          "Connected accounts summary: total active, pending verification, and suspended"
        ]
      },
      {
        name: "ses-config",
        label: "SES Email Configuration",
        description: "Configuration panel for AWS Simple Email Service settings including sending domain, DKIM records, bounce and complaint handling thresholds, and daily sending quota usage. Surfaces suppression list management.",
        group: "Config",
        purpose: "Keeps transactional email delivery healthy by surfacing deliverability signals and quota usage before they cause platform-wide issues.",
        bullets: [
          "Sending domain list with DKIM / DMARC verification status per domain",
          "Bounce rate and complaint rate gauges with AWS-recommended thresholds marked",
          "Suppression list viewer — search and manually remove email addresses"
        ]
      },
      {
        name: "twilio-config",
        label: "Twilio / Phone Configuration",
        description: "Admin interface for Twilio phone-session settings including purchased phone numbers, call routing rules, fallback URLs, and SMS template management. Shows per-number call volume and error rates.",
        group: "Config",
        purpose: "Manages the phone-session infrastructure that diviners use for audio readings, ensuring routing rules are correct and numbers are healthy.",
        bullets: [
          "Purchased number list with assignment status (assigned to diviner / unassigned / retired)",
          "Call routing rule builder — select primary and fallback numbers per region",
          "SMS templates editor for booking confirmations and session reminders"
        ]
      },
      {
        name: "media-detail",
        label: "Media Item Detail",
        description: "Detailed view for a single media asset in the platform library. Shows metadata, usage references, transcoding status, access permissions, and storage cost. Admins can update tags, replace the file, or delete.",
        group: "Config",
        purpose: "Provides a single place to audit and manage individual media assets so the library stays clean and cost-efficient.",
        bullets: [
          "Asset preview (video player, image viewer, or audio waveform depending on type)",
          "Usage references — lists every lesson, blog post, or broadcast that links to this asset",
          "Storage size, transcoding status, and CDN cache-purge button"
        ]
      },
      {
        name: "holy-book-detail",
        label: "Holy Book Detail",
        description: "Editor for a single Holy Book entry in the platform doctrine library. Admins can update the title, body text, associated symbols, visibility scope (public / PM members / MS students), and publication date.",
        group: "Governance",
        purpose: "Keeps doctrinal content versioned and role-gated so the right audience sees the appropriate depth of material.",
        bullets: [
          "Rich-text body editor with symbol-tag linking to the symbol glossary",
          "Visibility toggle: Public, Perennial Mandalism, Mystery School, Admin only",
          "Publication history — previous versions accessible with diff view"
        ]
      },
      {
        name: "decan-journal-detail",
        label: "Decan Journal Entry Detail",
        description: "Admin view of a single student decan journal submission. Shows the student's written reflection, the target decan, submission date, and admin annotation fields. Used during graduation review.",
        group: "Mystery School",
        purpose: "Enables admin review and annotation of student journal entries without needing direct database access.",
        bullets: [
          "Full journal text with student name, decan number, and submission timestamp",
          "Admin annotation sidebar — add private notes or a review rating",
          "Quick-action buttons: Approve for graduation, Flag for follow-up, or Request revision"
        ]
      },
      {
        name: "ingress-chart-detail",
        label: "Ingress Chart Detail",
        description: "Detailed view of a specific planetary ingress chart in the mundane astrology system. Shows the chart wheel, triggered entities, AI-generated interpretation, and linked research notes. Admins can edit the interpretation and add manual annotations.",
        group: "Mundane Astrology",
        purpose: "Allows deep inspection and manual curation of individual ingress events to ensure published interpretations meet editorial standards.",
        bullets: [
          "Full chart wheel rendering with planet glyphs and house cusps",
          "Triggered entities panel — which world leaders, nations, and markets are flagged",
          "AI interpretation text with admin override editor and publish/unpublish toggle"
        ]
      },
      {
        name: "entity-compare",
        label: "Entity Comparison",
        description: "Side-by-side comparison tool for two or more mundane entities (countries, leaders, organisations). Overlays their natal charts, active transits, and current scores to surface correlations and conflicts.",
        group: "Mundane Astrology",
        purpose: "Helps researchers identify which entities are in synchronised astrological cycles and where divergence signals geopolitical tension.",
        bullets: [
          "Dual chart wheel view with colour-coded glyphs per entity",
          "Transit overlay table showing shared triggers on the same degree within a 2° orb",
          "Score delta column — numerical difference in mundane scores side by side"
        ]
      },
      {
        name: "backtesting-new",
        label: "New Backtesting Run",
        description: "Setup form for launching a new mundane backtesting job. Admins specify the target entity, date range, signal parameters, and which event database to validate against. Job is queued and results appear in the backtesting detail screen.",
        group: "Mundane Astrology",
        purpose: "Allows the research team to validate predictive models against historical data before publishing forecasts to members.",
        bullets: [
          "Entity selector with date range picker (supports ranges up to 100 years)",
          "Signal parameter sliders: orb tolerance, minimum score threshold, event type filter",
          "Estimated runtime display — updates live as parameters are adjusted"
        ]
      },
      {
        name: "workspaces-new",
        label: "New Workspace",
        description: "Creation form for a new mundane research workspace. Admins name the workspace, choose a lead researcher, select seed entities, and set the collaboration visibility (private / team / published). Workspaces group related charts, notes, and backtesting runs.",
        group: "Mundane Astrology",
        purpose: "Organises long-running research projects so charts, notes, and backtests are grouped together rather than scattered across the global library.",
        bullets: [
          "Workspace name and description fields with slug preview",
          "Lead researcher selector from the admin user list",
          "Seed entity picker — search and add up to 20 starting entities"
        ]
      },
      {
        name: "mundane-forecasts-list",
        label: "Mundane Forecasts List",
        description: "Paginated list of all published and draft mundane forecasts. Each row shows the forecast title, target entity, publication date, expiry date, and current status. Admins can filter by status, entity type, and date range.",
        group: "Mundane Astrology",
        purpose: "Gives the editorial team a single view of the forecast pipeline so nothing is accidentally left unpublished or allowed to expire stale.",
        bullets: [
          "Status filter tabs: All, Draft, Scheduled, Published, Expired",
          "Bulk actions: publish, unpublish, or delete selected forecasts",
          "Expiry warning badge on forecasts within 7 days of their end date"
        ]
      },
      {
        name: "mundane-forecast-detail",
        label: "Mundane Forecast Detail",
        description: "Full editor and preview for a single mundane forecast. Contains the forecast body, associated ingress chart, entity tags, start and end dates, and member visibility tier. Admins can preview the member-facing rendering before publishing.",
        group: "Mundane Astrology",
        purpose: "Provides a complete authoring environment for forecasts so editors can manage content, metadata, and visibility in one screen.",
        bullets: [
          "Rich-text forecast body editor with astrology symbol picker",
          "Linked ingress chart panel with miniature chart wheel thumbnail",
          "Member tier selector: Public, PM, MS — with preview toggle to see each audience view"
        ]
      },
      {
        name: "report-training-completion",
        label: "Training Completion Report",
        description: "Aggregate report showing lesson and quiz completion rates across all active trainees. Filterable by cohort start date, lesson, and completion status. Exports to CSV for offline analysis.",
        group: "Reports",
        purpose: "Helps admins identify which lessons have the highest drop-off so training content can be prioritised for improvement.",
        bullets: [
          "Completion funnel: enrolled → started → passed quiz → completed lesson for each lesson",
          "Average time-to-complete per lesson compared to platform median",
          "Cohort comparison table — compare completion rates across different trainee intake batches"
        ]
      },
      {
        name: "report-ms-progress",
        label: "Mystery School Progress Report",
        description: "Dashboard report tracking Mystery School student progress across the 36 decans. Shows how many students are active per decan, average completion rate, journal submission volume, and graduation pipeline.",
        group: "Reports",
        purpose: "Gives the Mystery School admin team visibility into the student body's collective momentum and highlights where students are stalling.",
        bullets: [
          "Decan-by-decan progress heatmap — colour intensity reflects student density",
          "Journal submission volume chart by week",
          "Graduation pipeline: students within 3 decans of completion highlighted"
        ]
      },
      {
        name: "report-pm-growth",
        label: "Perennial Mandalism Growth Report",
        description: "Monthly and cumulative growth report for the Perennial Mandalism subscription. Tracks new sign-ups, cancellations, net growth, and revenue. Filterable by plan tier and cohort month.",
        group: "Reports",
        purpose: "Provides the business team with subscription health data to inform retention campaigns and pricing decisions.",
        bullets: [
          "Net growth chart: new MRR minus churned MRR per month",
          "Churn reasons breakdown (from exit survey) as a donut chart",
          "Cohort retention table: % of month-0 subscribers still active at months 1, 3, 6, 12"
        ]
      },
      {
        name: "report-diviner-performance",
        label: "Diviner Performance Report",
        description: "Per-diviner performance scorecard covering session volume, average rating, cancellation rate, response time, and earnings. Filterable by date range and service type. Exportable to CSV.",
        group: "Reports",
        purpose: "Enables the admin team to identify top-performing diviners for promotion and flag underperforming accounts for support outreach.",
        bullets: [
          "Performance league table sortable by any metric",
          "Trend sparklines per diviner showing 12-week trajectory for rating and session count",
          "Flag for review button — marks a diviner for SLA follow-up without sending a notification"
        ]
      },
      {
        name: "report-client-lifetime-value",
        label: "Client Lifetime Value Report",
        description: "Report showing average and median client lifetime value (LTV) segmented by acquisition channel, first session type, and subscription status. Includes cohort LTV curves for clients acquired in each quarter.",
        group: "Reports",
        purpose: "Guides marketing spend allocation by revealing which acquisition channels produce the highest-value long-term clients.",
        bullets: [
          "LTV by acquisition channel bar chart (organic, referral, affiliate, paid)",
          "Cohort LTV curves — line chart showing cumulative spend per client over 24 months",
          "Top 10% client segment detail — session frequency, average order value, and subscription tier"
        ]
      },
      {
        name: "discount-code-create",
        label: "Create Discount Code",
        description: "Form to create a new discount or promo code. Admins specify the code string, discount type (percentage or fixed), applicable products, usage limit, and expiry date. Stripe coupon is created automatically on save.",
        group: "Commerce",
        purpose: "Allows the marketing and sales team to issue targeted discounts without needing engineering involvement.",
        bullets: [
          "Code string field with auto-generate option and collision check",
          "Discount type toggle: % off or fixed amount, with currency selector for fixed",
          "Usage limit (per-user and total) and expiry date-time picker with timezone"
        ]
      },
      {
        name: "discount-code-list",
        label: "Discount Codes List",
        description: "Paginated list of all discount codes with status, redemption count, revenue impact, and expiry date. Admins can activate, deactivate, or clone any code. Filterable by active status and campaign tag.",
        group: "Commerce",
        purpose: "Provides a single view of all promotional codes so the team can audit active promotions and retire expired ones.",
        bullets: [
          "Status badges: Active, Paused, Expired, Exhausted",
          "Redemption count vs. limit progress bar per code",
          "Clone button — copies all settings to a new code with an auto-incremented suffix"
        ]
      },
      {
        name: "affiliate-leaderboard-admin",
        label: "Affiliate Leaderboard (Admin)",
        description: "Full affiliate performance leaderboard with raw earnings, referral counts, conversion rates, and payout status. Admin view shows all advocates including those below public leaderboard threshold. Exportable to CSV.",
        group: "Reports",
        purpose: "Gives the admin team an unfiltered view of affiliate performance to identify top earners, detect fraud patterns, and plan commission reviews.",
        bullets: [
          "Sortable columns: referrals sent, conversions, gross revenue, net commission, payout status",
          "Fraud flag indicator — unusual referral velocity triggers an automatic caution badge",
          "Bulk payout action — mark multiple advocates as paid in one click after bank transfer"
        ]
      },
      {
        name: "testimonial-moderation-queue",
        label: "Testimonial Moderation Queue",
        description: "Queue of testimonials awaiting admin review before publication. Each entry shows the client's review text, star rating, targeted diviner, and submission date. Admins can approve, reject, or request an edit.",
        group: "Governance",
        purpose: "Ensures that only authentic, policy-compliant testimonials are published, protecting the platform's reputation and diviner credibility.",
        bullets: [
          "Review card with full testimonial text, star rating, and diviner name",
          "One-click Approve (publishes immediately) or Reject (sends policy notification to client)",
          "Flag for follow-up — holds the testimonial in queue and assigns it to a moderator"
        ]
      },
      {
        name: "user-search",
        label: "User Search",
        description: "Full-text and filtered user search across all roles. Admins can search by name, email, user type, subscription status, or registration date. Results link directly to the relevant detail page for that user's role.",
        group: "Governance",
        purpose: "Replaces ad-hoc database queries by giving support and admin staff a fast, role-aware user lookup tool.",
        bullets: [
          "Search bar with instant results as you type (debounced, 300 ms)",
          "Filter chips: role, subscription status, account age, last-active date",
          "Result rows show avatar, name, email, role badge, and quick-action links"
        ]
      },
      {
        name: "advanced-user-filter",
        label: "Advanced User Filter",
        description: "Multi-condition filter builder for the user list. Admins can combine conditions across role, subscription tier, join date, session count, revenue contributed, and custom tags to build precise audience segments.",
        group: "Governance",
        purpose: "Enables data-driven segmentation for targeted communications, retention campaigns, and compliance audits without a separate BI tool.",
        bullets: [
          "Condition builder with AND / OR logic and nested groups",
          "Live count preview updates as conditions are added",
          "Save segment button — persists the filter as a named segment for reuse in email campaigns"
        ]
      },
      {
        name: "role-permission-matrix",
        label: "Role Permission Matrix",
        description: "Visual matrix showing which platform features each user role can access. Rows are roles and columns are feature areas. Admins can toggle individual permissions and publish changes, which take effect immediately via the session middleware.",
        group: "Governance",
        purpose: "Provides a single authoritative view of role-based access control so permission drift can be identified and corrected without reading source code.",
        bullets: [
          "Matrix grid with role rows and feature-area columns — colour-coded green/red per cell",
          "Inline toggle — click any cell to grant or revoke access with a confirmation modal",
          "Change history drawer showing who changed what permission and when"
        ]
      },
      {
        name: "training-program-detail",
        label: "Training Program Detail",
        description: "Detail and editor for a single training program (e.g. Astrology Foundations). Shows the ordered list of lessons, quiz assignments, estimated total duration, and enrolled trainee count. Admins can reorder lessons and update metadata.",
        group: "Training",
        purpose: "Gives curriculum designers a structured view of the full program so they can manage lesson order and content gaps in one place.",
        bullets: [
          "Lesson list with drag-and-drop reordering and status badges (Draft / Live)",
          "Program metadata: title, description, prerequisite program, estimated hours",
          "Enrolled count with link to the filtered trainee list for this program"
        ]
      },
      {
        name: "trainee-quiz-scores",
        label: "Trainee Quiz Scores",
        description: "Detailed quiz score history for a single trainee across all lessons. Shows each attempt, score, pass/fail result, and time taken. Admins can grant a manual pass or reset attempts for extenuating circumstances.",
        group: "Training",
        purpose: "Supports admin review of trainee progression, especially when a trainee requests an exception or appeal after repeated quiz failures.",
        bullets: [
          "Attempt timeline: date, score percentage, pass/fail badge, time taken",
          "Most-missed questions panel highlighting knowledge gaps",
          "Manual pass button with mandatory reason field — creates an audit log entry"
        ]
      },
      {
        name: "certificate-issued-log",
        label: "Certificate Issued Log",
        description: "Audit log of all training certificates issued by the platform. Each row shows the trainee, program, issue date, certificate ID, and download link. Admins can revoke certificates and trigger re-issue.",
        group: "Training",
        purpose: "Creates a tamper-evident record of certifications so credentials can be verified by third parties and revoked if fraud is detected.",
        bullets: [
          "Log table with certificate ID, trainee name, program, issue date, and status",
          "Revoke button with mandatory reason field — certificate becomes invalid and trainee is notified",
          "Export to PDF — generates a signed certificate log for regulatory record-keeping"
        ]
      },
      {
        name: "payment-dispute-detail",
        label: "Payment Dispute Detail",
        description: "Detail view for a single Stripe payment dispute (chargeback). Shows the dispute reason, amount, evidence deadline, customer and order details, and a form to submit counter-evidence directly from the admin panel.",
        group: "Commerce",
        purpose: "Centralises dispute management so the finance team can respond to chargebacks within Stripe's evidence window without switching between tools.",
        bullets: [
          "Dispute summary: reason code, amount, currency, evidence deadline countdown",
          "Order and session history for the transaction — shows what the client received",
          "Evidence submission form with file upload for session notes, receipts, and communication logs"
        ]
      },
      {
        name: "subscription-pause-override",
        label: "Subscription Pause Override",
        description: "Admin tool to manually pause or resume a specific client or diviner subscription outside of the self-service flow. Used for hardship accommodations, billing disputes, or technical error recovery.",
        group: "Commerce",
        purpose: "Gives the support team a safe override path for subscription state without requiring direct Stripe dashboard access.",
        bullets: [
          "User selector with current subscription status and next billing date displayed",
          "Pause duration selector: 1, 2, 3 months or indefinite, with auto-resume option",
          "Reason field and audit trail — every override is logged with admin ID and timestamp"
        ]
      },
      {
        name: "content-calendar",
        label: "Content Calendar",
        description: "Monthly calendar view of all scheduled platform content including blog posts, broadcasts, email sequences, and social media posts. Admins can drag items to reschedule, click to edit, and filter by content type.",
        group: "Config",
        purpose: "Gives the content team a single timeline view so publications are evenly spaced and no two major pieces conflict on the same day.",
        bullets: [
          "Month / week / day view toggle with colour-coded content type legend",
          "Drag-and-drop rescheduling with instant save and conflict warning if another item exists on the same slot",
          "Filter by content type: Blog, Broadcast, Email, Social — show/hide categories independently"
        ]
      },
      {
        name: "video-upload-admin",
        label: "Video Upload (Admin)",
        description: "Dedicated upload interface for platform video content. Admins select a file, set the title, description, visibility tier, and associated lesson or product. File is uploaded to S3, transcoded, and indexed automatically.",
        group: "Config",
        purpose: "Provides a controlled upload path for platform video assets with metadata capture at upload time, avoiding orphaned files in S3.",
        bullets: [
          "File picker with drag-and-drop zone — accepts MP4, MOV up to 10 GB",
          "Metadata form: title, description, visibility tier, linked lesson or product",
          "Upload progress bar with transcoding status indicator and estimated time remaining"
        ]
      },
      {
        name: "sla-incident-detail",
        label: "SLA Incident Detail",
        description: "Detail page for a single SLA breach or service incident. Shows the affected users, timeline of events, assigned admin, resolution notes, and whether a client credit was issued. Supports post-incident documentation.",
        group: "Governance",
        purpose: "Creates a structured record of every service incident so the team can improve reliability and demonstrate accountability to affected clients.",
        bullets: [
          "Incident timeline with event log: breach detected, admin assigned, client notified, resolved",
          "Affected users list with session details and compensation credit status",
          "Post-incident report field — internal notes on root cause and remediation steps taken"
        ]
      },
      {
        name: "alert-config",
        label: "Alert Configuration",
        description: "Admin panel for configuring platform monitoring alerts. Admins set thresholds for metrics like error rate, booking failure rate, and payment decline rate, and choose notification channels (email, Slack, PagerDuty).",
        group: "Config",
        purpose: "Ensures the engineering and ops teams are automatically notified when platform health metrics breach safe thresholds, reducing mean time to detection.",
        bullets: [
          "Alert rules list with metric, threshold, comparison operator, and notification channel",
          "Channel selector: email address, Slack webhook URL, or PagerDuty integration key",
          "Test alert button — fires a simulated alert to verify the channel is reachable"
        ]
      },
      {
        name: "ingress-chart-new",
        label: "New Ingress Chart",
        description: "Creation form for a new planetary ingress chart entry. Admins input the planet, sign, ingress date and time, and geographic focus. The system computes the chart wheel and pre-populates AI interpretation for admin review.",
        group: "Mundane Astrology",
        purpose: "Allows the mundane astrology team to capture and publish ingress events quickly while keeping chart computation server-side and consistent.",
        bullets: [
          "Planet and sign selectors with ingress date-time picker in UTC",
          "Geographic focus field — regional or global scope affects which entities are triggered",
          "Auto-computed chart wheel preview with one-click AI interpretation generation"
        ]
      },
      {
        name: "mundane-research-detail",
        label: "Mundane Research Detail",
        description: "Detail view for a single mundane research note or analysis document. Shows the body, associated entities and charts, author, publication status, and linked backtesting run. Admins can edit and publish research.",
        group: "Mundane Astrology",
        purpose: "Provides a structured authoring environment for long-form research so findings are linked to the charts and data that support them.",
        bullets: [
          "Rich-text research body with inline entity and chart embed support",
          "Linked backtesting run panel showing the validation result that supports this analysis",
          "Publish toggle with visibility tier: Admin only, Research team, Published to PM members"
        ]
      },
      {
        name: "mundane-leaders-new",
        label: "New World Leader Entry",
        description: "Form to add a new world leader entity to the mundane astrology database. Admins enter name, birth data, country association, role title, and active status. The system generates the natal chart and begins tracking transits.",
        group: "Mundane Astrology",
        purpose: "Keeps the leader entity database up to date as political landscapes change, ensuring transit tracking reflects current world affairs.",
        bullets: [
          "Birth data form: name, date, time, location with geocoding lookup",
          "Country and role association with effective date (for leaders who assumed office at a specific time)",
          "Auto-generated natal chart preview with save and publish confirmation"
        ]
      },
      {
        name: "onboarding-config",
        label: "Onboarding Configuration",
        description: "Admin panel for managing the onboarding checklist steps shown to new diviners and trainees after first login. Admins can add, remove, reorder, and toggle steps, and set which role sees each step.",
        group: "Config",
        purpose: "Allows the product team to iterate on the onboarding experience without a code deploy.",
        bullets: [
          "Step list with drag-and-drop reorder and role visibility toggles per step",
          "Step editor: title, description, CTA label, and target URL",
          "Completion rate per step showing what percentage of new users complete each item"
        ]
      },
      {
        name: "diviner-earnings-detail",
        label: "Diviner Earnings Detail (Admin)",
        description: "Admin view of a specific diviner's earnings breakdown including session fees, package revenue, affiliate commissions, and any deductions. Shows the payout history and next scheduled payout amount.",
        group: "Commerce",
        purpose: "Gives the finance team visibility into individual diviner earnings for dispute resolution and payout verification without requiring Stripe dashboard access.",
        bullets: [
          "Earnings breakdown table: session type, count, gross, platform fee, net per category",
          "Payout history timeline with Stripe transfer ID and settlement date",
          "Manual adjustment form — issue a correction credit or debit with mandatory reason"
        ]
      },
      {
        name: "ms-quarter-config",
        label: "Mystery School Quarter Configuration",
        description: "Editor for a single Mystery School quarter (3-month curriculum period). Admins set the start and end dates, assign featured decans, configure the Sunday Service schedule, and set the graduation eligibility window.",
        group: "Mystery School",
        purpose: "Keeps the Mystery School calendar structured and aligned so students and admins have clear expectations for each quarter's milestones.",
        bullets: [
          "Quarter date range picker with academic year label",
          "Featured decans selector — choose up to 3 decans to highlight in the quarter",
          "Graduation window: set the date range when students in this quarter can request graduation review"
        ]
      },
      {
        name: "broadcast-admin-detail",
        label: "Broadcast Detail (Admin)",
        description: "Admin view of a single platform broadcast. Shows the diviner, title, recording, audience reach, RSVP count, watch-time analytics, and any flagged content reports. Admins can unpublish, feature, or archive broadcasts.",
        group: "Governance",
        purpose: "Gives admins oversight of broadcast content so high-quality material can be promoted and policy-violating content can be removed promptly.",
        bullets: [
          "Broadcast metadata: title, diviner, date, duration, audience tier, RSVP vs. actual viewers",
          "Watch-time histogram showing viewer drop-off by minute",
          "Moderation actions: Unpublish, Feature on home page, Archive, or Flag for review"
        ]
      },
      {
        name: "client-birth-data-admin",
        label: "Client Birth Data (Admin)",
        description: "Admin view of a specific client's stored birth data including name, date, time, and location. Used to verify chart accuracy and resolve disputes where a chart was calculated on incorrect data.",
        group: "Governance",
        purpose: "Provides a read-only audit view of client birth data so support staff can verify chart inputs without exposing unnecessary PII.",
        bullets: [
          "Birth data fields: name, date, time, location with geocode result displayed",
          "Last-modified timestamp and which flow captured the data (onboarding, booking, or manual update)",
          "Chart recalculate button — re-runs the chart engine against current stored data"
        ]
      },
      {
        name: "referral-code-admin",
        label: "Referral Code Admin",
        description: "Management panel for all platform referral codes including advocate codes, diviner referral links, and gift referral tokens. Admins can view usage, deactivate codes, and manually attribute a referral to a different advocate.",
        group: "Commerce",
        purpose: "Maintains integrity of the referral attribution system and provides a correction path when codes are incorrectly applied.",
        bullets: [
          "Code table: code string, owner, type, usage count, revenue attributed, status",
          "Manual re-attribution form — reassign a specific conversion to a different code owner",
          "Deactivate button with immediate effect and notification to code owner"
        ]
      },
      {
        name: "giveaway-create",
        label: "Create Giveaway",
        description: "Form to create a new platform giveaway campaign. Admins set the prize, entry method (follow, share, sign-up), eligibility rules, entry period, and winner selection method (random draw or points-based).",
        group: "Commerce",
        purpose: "Enables the marketing team to run acquisition and engagement giveaways without engineering involvement.",
        bullets: [
          "Prize configuration: title, description, and upload a prize image",
          "Entry methods checklist with per-method point values for points-based draws",
          "Entry window date picker and winner selection method toggle (random / top points)"
        ]
      },
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
      {
        name: "finance",
        label: "Finance Dashboard",
        description: "A complete revenue command centre showing every financial dimension of your practice in one view. See revenue totals, average session value, refund rate, pending payouts, tax reserves, and year-to-date net earnings across configurable time windows. Charts break down revenue by source and show the impact of discount rules on your bottom line.",
        group: "Finance & Billing",
        purpose: "Single-screen financial health overview for your divination practice.",
        bullets: [
          "Revenue card — total income earned in the selected period with month-over-month comparison",
          "Avg Session value — average dollar amount collected per completed booking",
          "Refund Rate — percentage of sessions refunded; click to see individual refund records",
          "Tax Reserve — amount auto-set aside at your configured tax percentage (e.g. 25%)",
          "YTD Revenue — running year-to-date net after refunds and platform fees",
          "Revenue Trend chart — Diviner Net line chart across the selected 30-day, 90-day, 1-year, or All Time window",
          "Revenue by Source — breakdown by service type (natal chart, tarot, subscription, etc.)",
          "Discount Impact — total dollar value discounted away via loyalty and package rules",
          "Top Clients — ranked list of clients by total spend in the period",
          "Export CSV — download all finance data for tax filing or bookkeeping"
        ]
      },
      {
        name: "discounts",
        label: "Discount Rules",
        description: "Create and manage loyalty and package discount rules that apply automatically when clients meet the configured criteria. Rules can trigger by session count, package purchase, or manual override, and each shows real-time usage and savings data so you can see which promotions actually drive retention.",
        group: "Finance & Billing",
        purpose: "Automate loyalty rewards and package pricing without manual coupon codes.",
        bullets: [
          "Active Rules count — shows how many rules are live vs. paused at a glance",
          "Session Count rules — trigger a discount automatically after a client completes N sessions (e.g. 10% off after 5)",
          "Package rules — bundle services and apply a flat discount to the package price (e.g. 20% off Birth Chart + Transit Bundle)",
          "Discount percentage — set any percentage from 1% to 100%; VIP rules can go up to 25% or more",
          "Min Sessions threshold — the minimum booking count a client must reach before the discount activates",
          "Active / Inactive toggle — pause a rule during busy seasons without deleting it",
          "Total Discount Uses — how many times the rule has triggered across all clients",
          "Total Amount Saved — cumulative dollars clients have saved; useful for marketing messaging",
          "Recent Discount Uses — last 15 bookings where a discount rule was applied with client name and savings",
          "Create Discount button — opens the rule builder to define name, type, threshold, and percentage"
        ]
      },
      {
        name: "check-ins",
        label: "Check-In Leads",
        description: "Viewer sign-ups captured from live sessions and public events are collected here as warm leads. Every person who checked in is logged with their name, email, city, and birth data if provided — giving you a ready-made prospect list to follow up with or convert to a booked client.",
        group: "Clients & Growth",
        purpose: "Convert live session viewers into booked clients using captured check-in data.",
        bullets: [
          "Total Check-Ins counter — running count of all sign-ups captured across every live session",
          "This Week count — check-ins in the past 7 days; spikes indicate a successful live event",
          "With Birth Data count — subset who provided their birth date and time (highest-value leads for natal chart outreach)",
          "All Time / This Week / This Month filter — narrow the table to the time window you want to work",
          "Check-In Records table — Date, Name, Email, City, Birth Date, Birth Time for each entry",
          "Export CSV — download all leads for import into an email platform or CRM",
          "Giveaways button — jump directly to the Giveaways page to create a prize draw targeting your check-in audience",
          "Deduplication — multiple check-ins from the same email in one session are collapsed to avoid double-counting",
          "Birth data gap — entries without birth time show '—' in the Birth Time column; follow up to complete the chart"
        ]
      },
      {
        name: "campaigns",
        label: "Affiliate Campaigns",
        description: "Design and track affiliate marketing campaigns that your referral partners promote on your behalf. Each campaign has its own commission rate, date window, and affiliate links. The analytics tab reveals conversion counts, commission spend, and which campaigns drive the most real bookings.",
        group: "Marketing & Growth",
        purpose: "Run structured affiliate promotions with per-campaign tracking and commission control.",
        bullets: [
          "Total Campaigns — count of all campaigns ever created; active badge shows currently running ones",
          "Total Affiliates — number of affiliate partners enrolled across all campaigns",
          "Conversions — total confirmed bookings credited to affiliate referral links",
          "Commission Spent — total dollars paid or owed to affiliates across all campaigns",
          "Campaigns tab — table view with Name, Status, Dates, Commission %, Affiliates count, Conversions, Spent/Budget",
          "Analytics tab — time-series charts of clicks, conversions, and earnings by campaign",
          "Create Campaign button — define name, commission type (% or flat), date range, and UTM parameters",
          "Status filter — filter table by All / Active / Draft / Ended / Paused",
          "Campaign row actions — edit, pause, or archive a campaign without losing its historical data",
          "Spring Solar Return Promo, Mercury Retrograde Prep Pack — real campaigns shown in the table with live status"
        ]
      },
      {
        name: "affiliates",
        label: "Affiliate Partners",
        description: "Manage the individual people who promote your services through your affiliate programme. Each affiliate gets a unique referral link and earns commissions on bookings they send. Track their status, commission rate, total earnings, and payment history from a single table.",
        group: "Marketing & Growth",
        purpose: "Oversee your affiliate roster and ensure accurate commission tracking and payment.",
        bullets: [
          "Total Affiliates stat — total enrolled partners with active subset highlighted",
          "Commissions Earned — cumulative commission amount earned by all affiliates combined",
          "Total Paid — amount already disbursed to affiliates via Stripe or manual payout",
          "Pending Balance — commissions earned but not yet paid out; shows what you owe",
          "Affiliate table — Name, Email, Commission Rate, Status (pending / active / suspended), Created date",
          "Invite Affiliate button — send an invitation email with a unique sign-up link",
          "Add Affiliate button — manually add an affiliate by entering their name, email, and commission %",
          "Eye icon — view an affiliate's detailed conversion history and earnings breakdown",
          "Status badges — pending (not yet started promoting), active (live), suspended (temporarily blocked)",
          "Suspended affiliates — commission accrual stops; their referral links no longer convert"
        ]
      },
      {
        name: "settings",
        label: "Account Settings",
        description: "A tabbed settings hub where you manage every aspect of your AstrologyPro account in one place. Tabs cover your account identity, connected payment methods, calendar sync configuration, notification preferences, phone reading settings, and loyalty programme options — all editable without leaving the dashboard.",
        group: "Account & Profile",
        purpose: "Central configuration panel for your practice account, payments, and communication preferences.",
        bullets: [
          "Account tab — update your legal name, email address, and account-level details",
          "Payments tab — manage connected Stripe account, view payout schedule, and set minimum payout threshold",
          "Calendar tab — link Google Calendar or Outlook to auto-block busy slots and send invites",
          "Notifications tab — choose which events trigger email, SMS, or push alerts (new booking, cancellation, review, etc.)",
          "Phone tab — configure phone reading number, call recording consent, and voicemail greeting",
          "Loyalty tab — set up or edit your loyalty discount programme (session count thresholds and reward percentages)",
          "Subscription Status — shows your current AstrologyPro plan (active, trialing, or cancelled) with option to cancel",
          "Cancel Subscription button — initiates the cancellation flow with a confirmation step to prevent accidental cancellation",
          "Changes saved instantly — each tab saves independently; no master 'Save All' button needed"
        ]
      },
      {
        name: "media",
        label: "Media Gallery",
        description: "Your central library for videos, recordings, articles, audio, and image albums that showcase your work to potential clients. Media can be featured on your public profile, shared via social links, or used as resources in your sessions. The gallery shows review status so only approved content goes public.",
        group: "Content & Media",
        purpose: "Curate and publish the portfolio content that builds trust with prospective clients.",
        bullets: [
          "Total Items counter — running count of all uploaded media across all types",
          "Featured count — items pinned to the top of your public profile's media section",
          "Active count — items currently visible on your public profile (approved and not hidden)",
          "Pending Review — items submitted but awaiting platform moderation before going live",
          "Blocked — items the platform has removed from public view with a reason shown on hover",
          "Image Albums — grouped photo albums; shows slots used vs. total album capacity",
          "Media card grid — thumbnail, title, type badge (Video / Audio / Article / Image), and review status",
          "Add From Past Live — import a recording from a previous live stream directly into the gallery",
          "Add Media button — upload a new video, audio file, or image; drag-and-drop supported",
          "Review status badge — Approved (public), Pending (in queue), Blocked (removed) visible on each card"
        ]
      },
      {
        name: "giveaways",
        label: "Giveaways",
        description: "Run prize draw campaigns tied to your live sessions or social promotions to build your audience and check-in list. Each giveaway has a title, prize description, date window, entry count, and winner selection. Active giveaways display a public entry form you can share on social media.",
        group: "Marketing & Growth",
        purpose: "Grow your check-in audience and email list through structured prize promotions.",
        bullets: [
          "Giveaway table — Title, Status (Active / Draft / Ended), Dates, Entries count, Winners count",
          "New Giveaway button — opens creation form with title, prize description, value, start/end dates",
          "Active status — currently accepting entries; public entry link is live and shareable",
          "Draft status — saved but not yet published; lets you prepare campaigns in advance",
          "Ended status — closed for entries; winner was drawn and announced",
          "Entries counter — live count of how many people entered the giveaway",
          "Winners column — shows the number of winners drawn; click to see their names and contact details",
          "View button — opens the public-facing entry page preview",
          "Prize examples — Mercury Retrograde Survival Kit (crystal set + natal chart reading), Jupiter Return Reading",
          "Search and filter — find a specific giveaway by title or filter by All Statuses"
        ]
      },
      {
        name: "mktcontent",
        label: "Content Management",
        description: "Create and manage marketing content — images, videos, and caption templates — that you upload to social media to drive bookings. Write a caption once with dynamic placeholders for your username and booking link, then select the platforms you want to post to and preview how it will look before publishing.",
        group: "Marketing & Growth",
        purpose: "Produce ready-to-post social content that consistently promotes your practice.",
        bullets: [
          "Title field — give the content piece a name for your own library reference (e.g. 'Mercury Retrograde Awareness Post')",
          "Media upload — drag and drop PNG, JPG, or MP4 files up to 50 MB; supports images and short video clips",
          "Caption Template — write your post copy using {username} and {link} placeholders that auto-fill at share time",
          "Available variables listed — {username} and {link} are shown as clickable hints below the caption field",
          "Platform selection — toggle Instagram, Twitter / X, YouTube, TikTok, and Facebook individually",
          "Preview panel — shows a real-time preview of how the caption looks with placeholders resolved",
          "Content Tips sidebar — best-practice reminders (square images for IG, keep captions under 280 chars for Twitter, post peak hours)",
          "Saved content library — all uploaded pieces appear below the form for reuse or editing",
          "Share directly — once saved, each content piece has a one-click share button per selected platform"
        ]
      },
      {
        name: "calconn",
        label: "Calendar Connections",
        description: "Link your Google Calendar or Microsoft Outlook calendar to AstrologyPro so your real-world availability is always in sync and clients receive native calendar invites when they book a session. Connected calendars block off your busy times automatically, preventing double-bookings.",
        group: "Schedule & Availability",
        purpose: "Keep your availability accurate by syncing your practice calendar with your personal calendar.",
        bullets: [
          "Google Calendar card — connect your Google account with one click via OAuth; shows last sync timestamp once linked",
          "Outlook Calendar card — connect your Microsoft 365 or Outlook.com account with the same OAuth flow",
          "Last sync timestamp — displays when availability was last pulled from the connected calendar",
          "Auto-block busy times — events in your personal calendar automatically mark those slots as unavailable in your booking page",
          "Native invites — confirmed bookings send a .ics calendar invite to the client's inbox from your connected account",
          "Multiple connections — you can connect both Google and Outlook if you use both calendars",
          "Disconnect option — appears after connecting; removes the sync without deleting historical booking records",
          "Sync errors — if a token expires, a yellow warning appears prompting you to re-authenticate",
          "Availability page link — after connecting, jump to the Availability page to fine-tune your weekly time windows"
        ]
      },
      {
        name: "booking-detail",
        label: "Booking Detail View",
        description: "The full record for a single client appointment — every piece of information about one booking in one screen. See payment status, intake form responses, session notes, and take actions like reschedule, cancel, or mark complete.",
        group: "My Practice",
        purpose: "When you need to manage a specific appointment — whether to confirm it, look up what the client submitted, or add notes after completing the session — this is the screen you use. It consolidates everything about one booking so you do not have to navigate between multiple pages.",
        bullets: [
          "Booking summary — client name, service booked, date, time, duration, and total paid",
          "Intake form responses — read the pre-session questionnaire the client completed when they booked",
          "Payment details — gross charge, platform fee, your net amount, and Stripe payment ID",
          "Session notes — write post-session notes that are either private (only you) or shared with the client",
          "Join video room — when the session is about to start, a button appears to enter the live session room",
          "Reschedule action — propose a new time to the client, triggering an email with the new slot",
          "Cancel with reason — cancel the session and automatically notify the client with your reason"
        ]
      },
      {
        name: "service-pricing",
        label: "Service Pricing Configurator",
        description: "Set and fine-tune the pricing for each service you offer. Control base price, intro rates, package bundles, and session length options — all from one configuration screen per service.",
        group: "My Practice",
        purpose: "Pricing flexibility is essential for growing a practice. This configurator lets you adjust how each service is priced without rebuilding the entire service from scratch. You can set a standard rate, offer a discounted introductory price for new clients, and configure bundle pricing for clients who buy multiple sessions at once.",
        bullets: [
          "Base price field — the standard rate clients pay for this service",
          "Intro offer — a lower one-time price for new clients who have never booked you before",
          "Package pricing — price for a bundle of sessions (e.g. 5 readings for the price of 4)",
          "Duration variants — offer the same service at multiple time lengths with different prices",
          "Currency display — prices are shown to clients in USD with automatic local currency hints",
          "Save and preview — see how the price appears on your public service card before publishing",
          "Price history — a log of past price changes for your own reference"
        ]
      },
      {
        name: "testimonials-manage",
        label: "Testimonials Management",
        description: "Review every client testimonial submitted for your profile. Approve reviews to make them public, reject inappropriate ones, feature your best reviews at the top, and respond publicly to build trust with prospective clients.",
        group: "Marketing & Growth",
        purpose: "Your testimonials are a primary factor in whether a new client decides to book you. Managing them well — responding thoughtfully and featuring your most compelling reviews — can meaningfully increase your booking rate. This screen gives you full control over what your public review section looks like.",
        bullets: [
          "Pending testimonials — reviews submitted but not yet published; approve or reject before they go live",
          "Approved reviews — all currently visible testimonials on your public profile",
          "Feature a review — pin your best testimonials to the top of your profile's review section",
          "Respond publicly — write a reply that appears below the review for prospective clients to read",
          "Reject a review — remove a review that is inaccurate, abusive, or violates policy, with a reason logged",
          "Overall rating display — your current star average shown at the top of the management view",
          "Request a testimonial — send a post-session email prompting a specific client to leave a review"
        ]
      },
      {
        name: "blocked-dates",
        label: "Availability — Blocked Dates",
        description: "Mark specific calendar dates as unavailable so clients cannot book you during those periods. Useful for holidays, personal time, travel, or any block of days when you will not be offering sessions.",
        group: "Schedule & Availability",
        purpose: "Your weekly availability schedule handles recurring hours, but there will always be specific dates you need to block off — a vacation, a family event, a health day, or a retreat. This tool lets you block individual dates or multi-day ranges without changing your regular weekly schedule. Clients will simply see those days as unavailable when they try to book.",
        bullets: [
          "Date range picker — select a single date or a multi-day range to block off at once",
          "Reason field — add a private note explaining why you are blocking this time (only visible to you)",
          "All blocked dates listed — see every date or range you have blocked, sorted chronologically",
          "Remove a block — restore availability by deleting a date block before it arrives",
          "Conflict warning — if a block overlaps with an existing confirmed booking, you are alerted before saving",
          "Calendar preview — see how the blocked dates appear from the client's booking view",
          "Recurring blocks — optionally mark an annual recurring block (e.g. every Christmas week)"
        ]
      },
      {
        name: "video-session-room",
        label: "Video Session Room",
        description: "The live HD video room where one-on-one readings happen. Includes two-way video, chart screen sharing, in-session notes, timer, and recording controls — all purpose-built for spiritual consultation.",
        group: "Engagement",
        purpose: "This is where the actual reading takes place. When a client joins their booked session, both of you enter this private room together. Everything you need to run a professional, focused session is here — no distractions, no context-switching. The room closes automatically when the session timer ends and triggers the post-session review request to the client.",
        bullets: [
          "HD two-way video — high-definition video connection between you and your client with no software required",
          "Screen share mode — share your chart tool, transit report, or tarot spread directly from your screen",
          "Private notes panel — a sidebar only visible to you showing the client's birth data and your pre-session notes",
          "In-session chat — send links, chart URLs, or short messages to your client without interrupting the flow",
          "Session timer — a countdown and elapsed-time display so both parties stay aware of session length",
          "Recording toggle — start and stop recording; client is notified and must consent before recording begins",
          "End session button — cleanly closes the room and triggers automatic follow-up and review request flows"
        ]
      },
      {
        name: "phone-session-flow",
        label: "Phone Session Flow",
        description: "Initiate and manage phone-based reading sessions using the platform's built-in Chime telephony integration. Clients call a platform-managed number; you receive the call through your connected phone without sharing your personal number.",
        group: "Engagement",
        purpose: "Not every client is comfortable with video, and phone readings are a significant portion of the market. This flow handles the entire phone session experience — the client dials a platform number, the call routes to you, and both sides are protected. Your personal phone number is never exposed. Calls can optionally be recorded with client consent, and the session is logged automatically in your booking record.",
        bullets: [
          "Platform phone number — clients call a dedicated Chime-managed number assigned to your profile",
          "Incoming call alert — a browser notification appears when the client calls at their session time",
          "Accept or decline — answer the call from your dashboard without picking up a separate device",
          "Call recording (optional) — record the call with client consent; recording is saved to the session record",
          "Call duration timer — see elapsed call time so you manage session length correctly",
          "Post-call session log — the system logs call start time, duration, and outcome automatically",
          "International support — phased rollout supporting US first, then UK, AU, and Germany in subsequent phases"
        ]
      },
      {
        name: "revenue-breakdown",
        label: "Revenue by Service Type",
        description: "A detailed revenue breakdown showing exactly how much each of your services earns — natal chart readings, transit consultations, tarot sessions, subscriptions, gift certificate redemptions, and packages — compared across time periods.",
        group: "Finance & Reports",
        purpose: "Understanding which services make you the most money is essential for running a sustainable practice. This breakdown shows you not just total revenue, but revenue by service type — so you can see that natal chart readings bring in the most gross income but tarot sessions have the best booking frequency, for example. That insight helps you decide where to focus your marketing and how to price new offerings.",
        bullets: [
          "Service revenue ranking — every active service ranked from highest to lowest revenue in the selected period",
          "Booking count per service — how many sessions of each type were completed, separate from revenue",
          "Average value per service — average session price, useful for comparing service profitability",
          "Subscription revenue line — recurring income from subscription clients shown separately from one-off bookings",
          "Gift certificate redemptions — revenue that came through gift certificates, tracked as its own category",
          "Period comparison — compare service revenue this month vs last month side by side",
          "Export by service — download the revenue breakdown per service as a CSV for your records"
        ]
      },
      {
        name: "session-notes",
        label: "Client Session Notes",
        description: "Write, view, and organize private notes for individual client sessions. Notes are linked to a specific booking and stored in the client's permanent profile so you can review them before any future session.",
        group: "My Practice",
        purpose: "Session notes are your private memory system for each client relationship. After a reading, you can write what was discussed, what insights arose, what the client's main concerns were, and any follow-up actions you recommended. These notes are only visible to you. When the same client books again, you can pull up their notes before the session to recall the full context of your relationship.",
        bullets: [
          "Linked to booking — every note is attached to the specific session it was written after",
          "Private notes — notes are only visible to you; the client cannot see what you write here",
          "Shared notes (optional) — if you choose, mark a note as 'shared' to make it visible to the client after the session",
          "Rich text editor — format notes with bullet points, bold text, and section headings for clarity",
          "Client history view — see all notes across all sessions with this client in chronological order",
          "Pre-session prep — before a session, use the notes view to recall everything from past readings",
          "Search across notes — find any note by keyword across all clients and sessions"
        ]
      },
      {
        name: "affiliate-dashboard",
        label: "Affiliate Dashboard",
        description: "Your personal affiliate hub on AstrologyPro. See your unique referral code, track how many people have signed up using your link, and monitor commissions earned from your referrals — all in one place.",
        group: "Marketing & Growth",
        purpose: "If you participate in the platform's affiliate or social advocacy program, this dashboard shows you the performance of your referral activity. When you share your referral link and someone signs up or makes a booking, you earn a commission. This screen tracks every referral, every conversion, and every dollar earned so you always know exactly what you are owed.",
        bullets: [
          "Your referral code — your unique affiliate code and full referral URL ready to share",
          "Total referrals — how many people have clicked your link and registered on the platform",
          "Conversions — how many referrals completed a qualifying action (first booking, subscription, etc.)",
          "Commission balance — total commissions earned to date with breakdown of paid vs pending",
          "Commission rate — your configured percentage per qualifying referral or conversion",
          "Payout history — dates and amounts of previous commission payouts to your connected account",
          "Performance trend — a chart showing referral and conversion activity over time"
        ]
      },
      {
        name: "broadcast-creation",
        label: "Live Broadcast Creation Form",
        description: "Set up and schedule a new live broadcast session. Define the title, description, date and time, access level (public or members-only), and whether it will be recorded — all before going live.",
        group: "Engagement",
        purpose: "Before you go live, you need to create the broadcast event so the platform can notify your audience and generate the session link. This form is where you do that. It takes a few minutes to complete but ensures your live event is properly set up with a public listing, correct access control, and auto-record settings from the moment you start streaming.",
        bullets: [
          "Broadcast title — the name of your live session that appears in the platform's live schedule",
          "Description — what the session covers, who it is for, and what viewers can expect",
          "Scheduled date and time — when the session starts; the platform shows a countdown on your profile",
          "Access level — choose between public (anyone can watch), members-only, or paid ticket",
          "Recording setting — toggle whether this session will be automatically recorded for replay",
          "Thumbnail upload — add a cover image that appears in the broadcast listing",
          "Notify followers — opt in to send a notification to your followers when the broadcast is published"
        ]
      },
      {
        name: "broadcast-archive",
        label: "Broadcast Archive",
        description: "Browse and manage all your past live broadcast recordings. Each archived session can be featured on your profile, shared via link, or kept private — with view counts and engagement data available for each.",
        group: "Engagement",
        purpose: "Every live session you record becomes an asset in your archive. Clients who missed the live event can watch the replay. Prospective clients can browse your archive to see what your live sessions are like before booking. This screen lets you manage that archive — editing titles, controlling what is publicly visible, and seeing which recordings get the most views.",
        bullets: [
          "All past broadcasts listed — every recorded live session with date, title, duration, and view count",
          "Public or private toggle — control which recordings are visible on your public profile",
          "Feature on profile — pin a specific recording to the top of your profile's media section",
          "Edit title and description — update the name or description of a past recording",
          "Share link — copy a direct link to any recording to share on social media or with clients",
          "View analytics — see how many people watched each recording and the average watch time",
          "Delete a recording — permanently remove a session from the archive if it should not be stored"
        ]
      },
      {
        name: "chart-studio-diviner",
        label: "Chart Studio Access",
        description: "Access the platform's chart generation tools for your own astrological work. Create natal charts for clients, run transit analyses, and generate relationship comparison charts directly from your dashboard.",
        group: "Content & Tools",
        purpose: "Diviners are practitioners, not just session hosts — they use chart tools actively in their work. This screen gives you direct access to the chart studio so you can generate charts during session preparation, run transit analyses to understand a client's current moment, and build relationship charts for compatibility readings. Charts generated here can be shared directly in your live session room.",
        bullets: [
          "Natal chart generator — enter any birth data to create a fully rendered natal chart for a client",
          "Transit overlay — add today's planetary positions to any natal chart to show current influences",
          "Synastry chart — compare two natal charts side by side for relationship compatibility readings",
          "Composite chart — generate the relationship chart that emerges from combining two people's birth data",
          "Ingress charts — calculate the chart for the exact moment a planet enters a new zodiac sign",
          "Save to client profile — save a generated chart directly to the relevant client's CRM profile",
          "Share in session — send a chart link to a client during a live reading so they can see it in real time"
        ]
      },
      {
        name: "natal-chart-personal",
        label: "Personal Natal Chart",
        description: "Your own birth chart as a diviner on the platform. View your natal positions, decan placements, and personal transit report — the same tools you offer clients, applied to your own chart.",
        group: "Content & Tools",
        purpose: "Knowing your own chart deeply is part of being an effective astrology practitioner. This screen shows your personal birth chart — stored from your profile's birth data — with all the planet positions, house placements, and decan layers. You can run your own transit report to stay aware of the major astrological influences affecting your personal practice and life right now.",
        bullets: [
          "Your natal chart wheel — a rendered chart using your own birth date, time, and location",
          "Planet-by-planet summary — what each planet in your chart means for your personality and practice",
          "Current transits to your chart — what the planets are doing to your natal placements right now",
          "Decan placements — which of the 36 decans each of your planets falls in",
          "Upcoming major transits — a forward-looking list of the most significant transits arriving in the next 90 days",
          "Download your chart — save a PDF of your natal chart to share or use offline",
          "Compare with a client — jump directly to a synastry chart comparing your chart with a client's"
        ]
      },
      {
        name: "social-scheduler",
        label: "Social Media Scheduler",
        description: "Draft, schedule, and publish social media posts that promote your practice across Instagram, Twitter/X, Facebook, TikTok, and YouTube — all from one interface using the platform's Ayrshare integration.",
        group: "Marketing & Growth",
        purpose: "Consistent social media presence is one of the most effective ways to attract new clients. The Social Scheduler removes the friction of switching between apps — you write your caption once, attach your media, choose your platforms, and set a publish time. The platform handles the posting automatically via Ayrshare. You can also post immediately or save as a draft for later review.",
        bullets: [
          "Platform selector — toggle on/off each social network: Instagram, Twitter/X, Facebook, TikTok, YouTube",
          "Caption editor — write your post text with support for {link} and {username} dynamic placeholders",
          "Media attachment — upload an image or short video clip to accompany the post",
          "Schedule for later — set a specific future date and time for the post to be published automatically",
          "Post now — publish immediately to all selected platforms in one click",
          "Draft mode — save an unfinished post to return to before scheduling",
          "Post history — a log of all published posts with their platform, date, and engagement summary"
        ]
      },
      {
        name: "chime-conference-room",
        label: "Chime Conference Room",
        description: "A persistent virtual meeting room for multi-participant sessions, group readings, or practitioner team calls. Powered by AWS Chime, this room supports up to 25 attendees with HD video, screen sharing, and recording.",
        group: "Engagement",
        purpose: "Unlike the one-on-one session room designed for individual readings, the Chime Conference Room is built for group experiences — a group natal chart workshop, a team meeting with other practitioners, a live Q&A for your followers. It handles multiple video feeds simultaneously and includes a waiting room so you control exactly when participants are admitted.",
        bullets: [
          "Multi-participant video — up to 25 attendees in HD video simultaneously",
          "Waiting room — participants wait in a lobby until you admit them, giving you session control",
          "Screen sharing — share charts, slides, or any browser tab with all attendees",
          "Raise hand feature — participants can signal they want to speak without interrupting the flow",
          "Recording — the entire session is recorded and stored in your broadcast archive",
          "Chat panel — a group text chat visible to all participants during the session",
          "Mute controls — mute individual participants or all attendees at once to manage noise"
        ]
      },
      {
        name: "email-triggers",
        label: "Email Sequence Triggers",
        description: "Configure which automated email sequences are sent to your clients based on their actions — such as after a booking, after a completed session, after a no-show, or on a client's birthday.",
        group: "Marketing & Growth",
        purpose: "Automated emails keep your client relationships active without requiring manual effort from you. This screen lets you configure the triggers that determine when automated emails fire — so a new client automatically receives a welcome sequence, a completed session triggers a follow-up and review request, and an inactive client receives a re-engagement email after 30 days of no bookings. You set it up once and the system handles it.",
        bullets: [
          "Trigger list — all available trigger events shown with toggle to enable or disable each",
          "New booking trigger — fire a sequence when a client books their first or any session with you",
          "Post-session trigger — send a follow-up email after a session is marked as completed",
          "No-show trigger — automated reminder or re-engagement email if a client misses their session",
          "Anniversary trigger — a personalized note sent on the anniversary of a client's first session with you",
          "Birthday trigger — an email sent to clients on their birthday (if birth date is in their profile)",
          "Sequence assignment — select which email sequence fires for each trigger event from your library"
        ]
      },
      {
        name: "onboarding-checklist",
        label: "Diviner Onboarding Checklist",
        description: "A step-by-step first-time setup guide for new diviners. Complete each item to make your profile fully operational — from uploading your photo to creating your first service and connecting your Stripe account for payouts.",
        group: "Account & Profile",
        purpose: "When a diviner joins the platform, there are several essential setup steps before they can start accepting bookings. This checklist guides them through every required step in the right order, with a clear progress bar showing how close they are to being fully live. Completing the checklist means your profile is visible in search, your services are listed, and you are ready to receive and get paid for sessions.",
        bullets: [
          "Progress bar — visual indicator showing what percentage of setup is complete",
          "Profile photo — upload a professional headshot (required for profile to appear in search)",
          "Bio completion — write a practitioner bio of at least 100 words",
          "First service created — create at least one bookable service with a price and duration",
          "Availability set — configure at least one day per week as available for bookings",
          "Stripe Connect — link your bank account for payouts (required before accepting any paid bookings)",
          "Launch profile — a final step that makes your profile publicly visible in the diviner directory"
        ]
      },
      {
        name: "public-profile-preview",
        label: "Profile Public Preview",
        description: "See exactly how your practitioner profile appears to potential clients browsing the platform — your photo, bio, services, reviews, and booking button — before making any changes live.",
        group: "Account & Profile",
        purpose: "Before updating your profile and immediately going live with changes, this preview mode lets you see the client-facing view of your profile exactly as it appears on AstrologyPro. Spot issues — a missing service description, a photo that looks cropped wrong, or a bio that cuts off — before any real client sees them. Changes are only published when you explicitly click 'Go Live'.",
        bullets: [
          "Full client view — see your profile exactly as a prospective client sees it when they visit your page",
          "Service cards preview — how each service you offer appears in the booking flow on your profile",
          "Reviews section — how your testimonials appear, including the star rating summary at the top",
          "Mobile preview toggle — switch between desktop and mobile views to check responsive layout",
          "Booking button test — verify the 'Book a Session' button leads to your correct booking calendar",
          "Discovery card preview — see how your profile card looks in the search/discover directory listing",
          "Edit shortcut links — click any section of the preview to jump directly to the edit form for that section"
        ]
      },
      {
        name: "client-detail-diviner",
        label: "Client Detail (Diviner View)",
        description: "Full client profile as seen by the diviner. Shows the client's birth data, natal chart summary, session history, notes written by this diviner, and any intake form responses submitted for previous sessions.",
        group: "Clients",
        purpose: "Gives the diviner a comprehensive pre-session brief so they can deliver personalised readings without asking the client to repeat information.",
        bullets: [
          "Client avatar, name, birth data, and natal chart thumbnail",
          "Session history table: date, service type, duration, session notes link",
          "Diviner-private notes field — only visible to this diviner, never shared with client"
        ]
      },
      {
        name: "booking-reschedule",
        label: "Reschedule Booking",
        description: "Flow that lets the diviner reschedule an existing confirmed booking. Displays the original slot, shows available alternative slots on a mini calendar, and sends an automated reschedule notification to the client on confirm.",
        group: "Schedule",
        purpose: "Reduces cancellation friction by giving diviners a self-service reschedule path rather than forcing a cancel-and-rebook cycle.",
        bullets: [
          "Original booking details shown above the reschedule calendar",
          "Available slot grid filtered to same service type and duration",
          "Confirm reschedule button — sends client email and updates the booking record"
        ]
      },
      {
        name: "service-create-form",
        label: "Create New Service",
        description: "Step-by-step form for adding a new reading or session service to the diviner's offering. Captures service name, type (video, phone, chat), duration options, price per duration tier, and a description shown on the public profile.",
        group: "Services",
        purpose: "Empowers diviners to expand their offering without admin assistance by walking through all required fields in a structured wizard.",
        bullets: [
          "Service type selector: Video Call, Phone Call, Chat, or In-Person",
          "Duration and price matrix — add multiple duration tiers (30 min, 60 min, 90 min) each with their own price",
          "Public description editor with character counter and live profile preview"
        ]
      },
      {
        name: "service-edit-form",
        label: "Edit Service",
        description: "Edit form for an existing service. Pre-populated with all current settings. Diviners can update price, description, availability toggle, and duration options. Changes take effect on the next booking attempt.",
        group: "Services",
        purpose: "Allows diviners to keep service details accurate as their practice evolves without creating a duplicate service.",
        bullets: [
          "All fields pre-populated with current service data for quick editing",
          "Active / Paused toggle — pausing hides the service from the public profile without deleting it",
          "Price change warning: existing confirmed bookings are unaffected, only future bookings use the new price"
        ]
      },
      {
        name: "payout-history",
        label: "Payout History",
        description: "Complete history of all payouts received by the diviner from the platform. Each row shows the payout date, amount, currency, and Stripe transfer status. Filterable by date range and payment method.",
        group: "Finance",
        purpose: "Gives diviners a transparent record of their earnings disbursements for personal accounting and tax reporting.",
        bullets: [
          "Payout table: date, amount, currency, Stripe transfer ID, status (Pending / Paid / Failed)",
          "Monthly earnings summary at the top showing current period total vs. previous period",
          "Download CSV button for selected date range — formatted for accounting software import"
        ]
      },
      {
        name: "payout-detail",
        label: "Payout Detail",
        description: "Breakdown of a single payout showing which sessions, packages, and affiliate commissions contributed to the total. Displays the platform fee deducted and the net amount transferred.",
        group: "Finance",
        purpose: "Provides full transparency into how each payout is calculated so diviners can reconcile their own records without contacting support.",
        bullets: [
          "Line-item breakdown: each session with date, client name, gross amount, and fee deducted",
          "Fee summary: total gross, total platform fee (%), net payout",
          "Stripe transfer reference and settlement date with bank processing note"
        ]
      },
      {
        name: "affiliate-campaign-detail",
        label: "Affiliate Campaign Detail (Diviner)",
        description: "Detail view for a specific affiliate referral campaign the diviner is participating in. Shows the campaign terms, unique referral link, click and conversion stats, and earnings attributed to this campaign.",
        group: "Marketing",
        purpose: "Helps diviners understand the performance of individual campaigns and optimise their referral strategy accordingly.",
        bullets: [
          "Campaign terms: commission rate, eligible products, start and end date",
          "Unique referral link with one-click copy and QR code download",
          "Conversion funnel: clicks → signups → paid conversions with attributed earnings"
        ]
      },
      {
        name: "broadcast-viewer-stats",
        label: "Broadcast Viewer Stats",
        description: "Analytics detail for a specific broadcast the diviner has published. Shows RSVP count, actual viewer count, watch-time distribution, peak concurrent viewers, and geographic audience breakdown.",
        group: "Marketing",
        purpose: "Helps diviners understand which broadcasts resonate most so they can plan future content around audience engagement patterns.",
        bullets: [
          "Viewer funnel: RSVPs → joined → watched 50% → watched to end",
          "Watch-time histogram by minute with drop-off points annotated",
          "Geographic map showing viewer location distribution by country"
        ]
      },
      {
        name: "review-response",
        label: "Review Response",
        description: "Interface for the diviner to write a public reply to a client testimonial. The response appears below the review on the public profile. Includes character limit, preview, and submission confirmation.",
        group: "Marketing",
        purpose: "Allows diviners to acknowledge positive reviews and professionally address concerns, improving trust with prospective clients browsing the profile.",
        bullets: [
          "Original review displayed above the response editor for context",
          "Response text area with 500-character limit and live counter",
          "Public preview showing how the reply appears on the profile before submission"
        ]
      },
      {
        name: "client-chart-view",
        label: "Client Chart View",
        description: "Natal chart viewer for a specific client, accessible by the diviner from the client detail screen. Displays the wheel, planet positions, house cusps, and aspect grid with interpretive keywords on hover.",
        group: "Clients",
        purpose: "Gives the diviner a structured astrological tool within their dashboard so they can review chart details before or during a session without switching to a separate app.",
        bullets: [
          "Full natal chart wheel rendered from the client's stored birth data",
          "Planet and house summary table with sign, degree, and dignity status",
          "Aspect grid with click-to-expand interpretation for each major aspect"
        ]
      },
      {
        name: "phone-setup-guide",
        label: "Phone Session Setup Guide",
        description: "Onboarding guide for setting up the diviner's phone session capability. Walks through Twilio number assignment, microphone check, call test, and fallback number configuration in sequential steps.",
        group: "Settings",
        purpose: "Reduces setup errors by guiding diviners through phone session configuration in a structured flow rather than leaving them to discover settings independently.",
        bullets: [
          "Step-by-step setup checklist with completion checkmarks per step",
          "Twilio number assignment status with one-click request if unassigned",
          "Test call button — triggers an automated inbound call to verify the number is working"
        ]
      },
      {
        name: "library-item-detail",
        label: "Library Item Detail (Diviner)",
        description: "Detail view for a single resource item in the diviner's private library — a video, PDF, audio file, or article. Shows full content, metadata, and usage stats if the diviner has shared the item with clients.",
        group: "Library",
        purpose: "Gives diviners a focused reading or viewing experience for library resources they have saved for reference or client sharing.",
        bullets: [
          "Full content viewer: video player, PDF embed, or audio player depending on item type",
          "Item metadata: title, author, topic tags, date added to library",
          "Share with client button — generates a time-limited access link for the specific client"
        ]
      },
      {
        name: "session-prep-notes",
        label: "Session Prep Notes",
        description: "Pre-session notepad tied to a specific upcoming booking. Diviners can jot astrological observations, questions to explore, and focus areas before the session begins. Notes are saved privately and carry over to the post-session notes screen.",
        group: "Schedule",
        purpose: "Helps diviners arrive at sessions prepared, reducing cold-start time and improving the client experience from the first minute.",
        bullets: [
          "Client birth data summary and natal chart thumbnail at the top for quick reference",
          "Free-text notes field with auto-save every 30 seconds",
          "Previous session notes from the same client collapsed below with expand option"
        ]
      },
      {
        name: "upcoming-session-countdown",
        label: "Upcoming Session Countdown",
        description: "Live countdown widget for the diviner's next confirmed session. Shows the client name, session type, time remaining, and quick-access buttons to join the video room, view client notes, or send a pre-session message.",
        group: "Schedule",
        purpose: "Ensures diviners never miss a session start by surfacing the next booking prominently with a countdown and direct action links.",
        bullets: [
          "Large countdown timer: hours and minutes to session start",
          "Client name, session type, and duration displayed below the timer",
          "Quick-access buttons: Join Room, View Client, Prep Notes, Message Client"
        ]
      },
      {
        name: "intake-form-builder",
        label: "Intake Form Builder",
        description: "Drag-and-drop form builder for creating custom intake questionnaires that clients fill in before booking. Diviners add text, multiple-choice, and date-picker fields. Forms are assigned to specific services.",
        group: "Settings",
        purpose: "Allows diviners to gather structured pre-session information from clients so readings are more targeted and efficient.",
        bullets: [
          "Field type palette: short text, paragraph, multiple choice, date, and birth data capture",
          "Drag-and-drop field ordering with delete and duplicate per field",
          "Service assignment selector — choose which services trigger this intake form at booking"
        ]
      },
      {
        name: "intake-responses",
        label: "Intake Form Responses",
        description: "List of all client intake form submissions for the diviner's services. Filterable by service and date range. Each row links to the full response and the associated booking.",
        group: "Clients",
        purpose: "Gives diviners a centralised view of all pre-session client information so they can prepare across their full schedule in one place.",
        bullets: [
          "Response list: client name, service, submission date, and linked booking",
          "Filter by service and date range",
          "Full response view on click — shows each question and the client's answer in a readable layout"
        ]
      },
      {
        name: "earnings-by-month",
        label: "Earnings by Month",
        description: "Month-by-month earnings chart and table showing the diviner's gross revenue, platform fee, and net payout for each month. Allows comparison between any two months and highlights best and worst performing periods.",
        group: "Finance",
        purpose: "Helps diviners track their financial trajectory and plan for slower months by understanding seasonal patterns in their earnings.",
        bullets: [
          "Bar chart with gross and net earnings per month for the trailing 12 months",
          "Month comparison selector — pick any two months to see a side-by-side breakdown",
          "Best month badge and lowest month badge highlighted automatically"
        ]
      },
      {
        name: "booking-confirm-flow",
        label: "Booking Confirm Flow",
        description: "Multi-step confirmation flow the diviner goes through when accepting a new booking request (for request-based services). Shows client details, requested slot, service, and an accept or suggest-alternative action.",
        group: "Bookings",
        purpose: "Gives diviners a structured, deliberate step to review and confirm bookings rather than auto-accepting, which reduces scheduling errors.",
        bullets: [
          "Booking request summary: client, service, requested date and time, duration",
          "Accept button with confirmation modal showing the slot added to the calendar",
          "Suggest alternative button — opens the availability grid to propose a different slot to the client"
        ]
      },
      {
        name: "client-search-diviner",
        label: "Client Search (Diviner)",
        description: "Search interface within the diviner's client list. Supports name and email search with filters for session count and last-session date. Results link directly to the client detail screen.",
        group: "Clients",
        purpose: "Allows diviners with large client rosters to quickly find a specific client without scrolling through an unfiltered list.",
        bullets: [
          "Search bar with instant results filtered to this diviner's own clients only",
          "Filter chips: all clients, recent (last 90 days), new (first session pending)",
          "Result row shows avatar, name, last session date, and total sessions with this diviner"
        ]
      },
      {
        name: "diviner-resources",
        label: "Diviner Resources Hub",
        description: "Curated resource hub for platform diviners with guides, policy documents, marketing templates, and training videos provided by the platform team. Content is organised by category and searchable.",
        group: "Library",
        purpose: "Provides diviners with a single source of truth for platform policies and best-practice materials without needing to contact support.",
        bullets: [
          "Category tabs: Platform Guides, Marketing Assets, Policy Documents, Video Tutorials",
          "Search within the hub to find specific topics quickly",
          "Bookmark any resource — saved items appear in the diviner's personal library"
        ]
      },
      {
        name: "video-session-pre-check",
        label: "Video Session Pre-Check",
        description: "Pre-session technical check that runs camera, microphone, and network tests before the diviner enters the video session room. Shows a pass or fail status per check with troubleshooting guidance if any test fails.",
        group: "Live",
        purpose: "Catches technical issues before the client is waiting, reducing session delays and improving the professional impression of the diviner.",
        bullets: [
          "Camera check: live preview of the camera feed with resolution indicator",
          "Microphone check: audio level meter with a speak-to-test instruction",
          "Network check: latency and bandwidth test with a suitability rating (Good / Marginal / Poor)"
        ]
      },
      {
        name: "service-bundle-create",
        label: "Create Service Bundle",
        description: "Form for creating a multi-session bundle that clients can purchase at a discounted rate. Diviners set the number of sessions, eligible service types, bundle price, and expiry window from the date of purchase.",
        group: "Services",
        purpose: "Increases client retention by incentivising commitment to multiple sessions upfront through a structured discount offer.",
        bullets: [
          "Session count selector and eligible service types multi-select",
          "Bundle price field with automatic per-session savings calculation shown to the diviner",
          "Expiry window selector: 30, 60, 90, or 180 days from purchase date"
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
      {
        name: "mundane-dashboard-pm",
        label: "Mundane Astrology Dashboard",
        description: "Access the platform's world astrology tools as a Perennial Mandalism member. Track planetary transits against nations and global events, browse historical mundane charts, and understand the collective astrological climate shaping world events.",
        group: "Astrology Tools",
        purpose: "Mundane astrology — the study of planetary influences on nations, leaders, and collective world events — is a core part of the Perennial Mandalism tradition. This dashboard gives PM members access to the same world-astrology tools the school uses in its teachings, so members can follow along with current global astrological patterns and understand how they connect to what is taught in the curriculum.",
        bullets: [
          "Current world transits — major planetary movements and the nations or themes they are influencing right now",
          "NAT charts (national entity charts) — natal charts for major countries and how transits aspect them",
          "Global transit calendar — upcoming major ingresses and conjunctions with their world-event implications",
          "Historical mundane archive — browse past world events mapped to their astrological signatures",
          "Geopolitical entity list — search any country, organization, or public figure by name to view their chart",
          "Mundane forecast brief — a short admin-curated summary of the most significant world astrological events this month",
          "Connection to teachings — links from each mundane chart to related lessons in the Training section"
        ]
      },
      {
        name: "horoscope-reader",
        label: "Horoscope Reader",
        description: "Read personalized weekly and monthly horoscopes generated from your natal chart. These are not generic sun-sign horoscopes — they are calculated specifically for your chart positions and current transits.",
        group: "Astrology Tools",
        purpose: "Generic horoscopes written for the masses miss the nuance of your individual chart. The Horoscope Reader in the PM portal generates interpretations based on your actual natal chart — where your planets are, which house each transit touches, and what that means for your specific life areas. Think of it as a personalized astrological weather report written just for you.",
        bullets: [
          "Weekly horoscope — a narrative forecast for the current week based on your natal chart and active transits",
          "Monthly overview — a broader look at the major astrological themes affecting you this month",
          "House-by-house focus — which life areas (career, relationships, health, finances) are highlighted this period",
          "Planet spotlight — the most important transit active in your chart right now, explained in plain language",
          "Retrograde alerts — notifications when a planet relevant to your chart goes retrograde",
          "Archive of past readings — browse horoscopes from previous weeks to see how predictions played out",
          "Practitioner note — your assigned practitioner can add a personalized comment to your monthly horoscope"
        ]
      },
      {
        name: "ingress-charts-pm",
        label: "Ingress Charts Viewer",
        description: "View the ingress charts for each major planetary sign change — the astrological snapshot taken at the exact moment a planet enters a new zodiac sign. Use these as a lens for understanding collective themes for each astrological season.",
        group: "Astrology Tools",
        purpose: "Ingress charts are one of the most important tools in mundane astrology. When the Sun enters Aries (the Aries Ingress), a chart is cast for that exact moment — and that chart is interpreted to understand the themes of the coming quarter. This viewer lets PM members access all ingress charts, see how they relate to current global events, and understand the seasonal astrological energy the school teaches about.",
        bullets: [
          "All ingress charts — browse ingress charts for every major planetary sign entry in the current year",
          "Aries Ingress — the most significant annual chart, cast when the Sun enters Aries at the vernal equinox",
          "Cancer, Libra, Capricorn Ingresses — the three other seasonal ingresses completing the quarterly cycle",
          "Interactive chart wheel — a rendered chart wheel for each ingress with house cusps and planet positions",
          "Interpretation panel — a written summary of what the ingress chart indicates for the coming season",
          "Historical ingress archive — browse ingress charts from past years for study and comparison",
          "School commentary — the Head Master's notes on each ingress chart, added at the time of entry"
        ]
      },
      {
        name: "rituals-library-pm",
        label: "Rituals Library",
        description: "Browse the full library of sacred rituals available to Perennial Mandalism members. Filter by planetary cycle, season, intention type, or decan. Access step-by-step ritual guides, material lists, and timing recommendations.",
        group: "Community & Worship",
        purpose: "The Rituals Library is the complete collection of every sacred practice available in the PM portal. Some rituals are tied to specific astrological moments (new moon in Scorpio, Sun entering Aries), others are general practices for daily alignment. This library lets you browse everything available, filter for what is relevant right now, and follow the ritual when you are ready.",
        bullets: [
          "Full ritual collection — every ritual in the school's library, available to PM members",
          "Filter by planet — find rituals related to a specific planet you are working with (Saturn, Venus, Mars, etc.)",
          "Filter by season — browse rituals aligned to Spring, Summer, Autumn, or Winter energy",
          "Filter by decan — find rituals tied to the currently active or upcoming decan period",
          "Step-by-step guide — each ritual has clear numbered steps with what to say, do, and use",
          "Materials list — what you need to gather before beginning (candles, water, crystals, journal, etc.)",
          "Completion log — mark any ritual as completed; this feeds into your Practice Tracker streak"
        ]
      },
      {
        name: "tarot-readings-pm",
        label: "Tarot Readings",
        description: "Pull tarot cards and receive interpretations connected to your natal chart, current transits, and the active astrological decan. Spreads range from a single daily draw to full Celtic Cross layouts.",
        group: "Learning & Wisdom",
        purpose: "In the tradition taught by this school, tarot and astrology are deeply interwoven — each card corresponds to a planet, sign, or decan. This reading tool lets PM members pull cards and receive interpretations that are specific to the current astrological moment, not generic card meanings. The school's esoteric approach adds a layer of astrological context that makes each reading richer.",
        bullets: [
          "Daily draw — pull a single card each day as a contemplative focus tied to the current decan energy",
          "Three-card spread — past, present, future layout with astrological context for each position",
          "Celtic Cross — a full 10-card spread for in-depth exploration of a specific question or situation",
          "Astrological overlay — each card drawn shows its zodiac sign, planetary ruler, and decan correspondence",
          "Reading history — every card draw is saved so you can look back at patterns over time",
          "Card meanings library — tap any card in a spread to read its full upright and reversed meanings",
          "Journal prompt — after each reading, a reflective question is offered for your spiritual journal"
        ]
      },
      {
        name: "pm-profile-settings",
        label: "Profile & Settings",
        description: "Manage your Perennial Mandalism profile and account settings — personal details, birth data, notification preferences, privacy controls, and portal display options.",
        group: "My Membership",
        purpose: "Your profile in the PM portal is the foundation for all personalized features. Your birth data powers your natal chart, transit reports, and personalized horoscopes. Notification settings control how you are alerted about events, new content, and Sunday Service reminders. Keeping this profile complete and accurate ensures every tool on the platform works as well as possible for you.",
        bullets: [
          "Personal information — update your name, email, profile photo, and display name",
          "Birth data — your date, time, and place of birth (required for all personalized astrology tools)",
          "Timezone setting — ensure all events, service times, and transit data are displayed in your local time",
          "Notification preferences — choose email or push notifications for events, Sunday Service, new rituals, and announcements",
          "Privacy settings — control what parts of your profile (if any) are visible to other community members",
          "Portal display — choose your preferred homepage layout (chart-first, calendar-first, or community feed-first)",
          "Account security — update your password and manage login sessions"
        ]
      },
      {
        name: "broadcast-rsvp",
        label: "Broadcasts RSVP",
        description: "Browse upcoming live broadcasts from diviners and school leaders. RSVP to receive a reminder, see who else is attending, and access the session link when it goes live.",
        group: "Community & Worship",
        purpose: "Broadcasts are live events — group sessions, seasonal teachings, Q&A sessions, and special celestial event commentaries. This page shows you everything upcoming so you can plan your schedule. RSVPing tells the system to send you a reminder before the session starts and adds you to the attendance list, which helps organizers see expected participation.",
        bullets: [
          "Upcoming broadcasts list — all scheduled live sessions with title, host, date, time, and topic",
          "RSVP button — confirm your attendance so you receive a pre-session reminder notification",
          "Attendee count — see how many community members have already RSVPed for each session",
          "Session description — what the broadcast covers and who it is most relevant for",
          "Live link on session day — when a session starts, an active join button appears on the entry",
          "Past broadcasts — recordings of previous sessions you can watch if you missed the live event",
          "Filter by host — find broadcasts from a specific diviner or school leader you follow"
        ]
      },
      {
        name: "events-calendar-pm",
        label: "Events Calendar",
        description: "A monthly calendar view of all community events — Sunday services, workshops, ceremonies, seasonal rituals, and special gatherings. See the full month at a glance and register directly from the calendar.",
        group: "Community & Worship",
        purpose: "Planning ahead is easier with a visual calendar. While the Events list shows all upcoming events in order, the calendar gives you a full month view so you can see at a glance how your spiritual schedule looks. Busy weeks with multiple events are obvious, and you can navigate forward to see future months.",
        bullets: [
          "Monthly calendar grid — all events displayed on the days they occur for the full month",
          "Event type color coding — each event type (Sunday Service, workshop, ceremony, webinar) has a distinct color",
          "Click to register — click any event on the calendar to see details and register in two clicks",
          "Multi-day events — events that span multiple days show across the full range on the calendar",
          "Navigate forward — advance to future months to see events being planned for upcoming seasons",
          "My registered events — a filter to show only the events you have already RSVPed to",
          "Export to calendar — add any event to your Google Calendar or Outlook with a single click"
        ]
      },
      {
        name: "resources-media-library",
        label: "Resources & Media Library",
        description: "A searchable library of all media resources — video teachings, audio meditations, guided practices, and downloadable documents — available to PM members. Organized by topic, teacher, and format.",
        group: "Learning & Wisdom",
        purpose: "The Resources library is the full multimedia archive of the Perennial Mandalism school. It complements the text-based Spiritual Library with video and audio content — recordings of past teachings, guided meditations, planetary invocations, and special presentations. PM members can browse, search, and save resources to their personal library for later.",
        bullets: [
          "Video teachings — recorded lessons and presentations from the Head Master and school diviners",
          "Audio meditations — guided meditation recordings tied to specific planets, decans, or seasonal themes",
          "Downloadable documents — PDFs of study materials, ritual scripts, and reference guides",
          "Search by topic — find resources on any planet, sign, decan, tarot card, or ritual practice",
          "Filter by format — view only videos, only audio, or only documents depending on what you want",
          "Save to my library — bookmark any resource to a personal collection for easy future access",
          "Newly added — a highlighted section at the top showing the most recently uploaded content"
        ]
      },
      {
        name: "family-member-detail",
        label: "Family Member Detail View",
        description: "The individual profile page for one family member added to your Family plan. See their birth data, natal chart, upcoming sessions linked to their profile, and any notes you have added for them.",
        group: "My Membership",
        purpose: "Under a Family membership, each family member has their own sub-profile. This detail view shows you everything specific to one person — their chart, their sessions, their practice. Parents managing a child's profile, or spouses tracking their partner's chart data, use this page to keep each family member's information organized and accessible without mixing it with their own.",
        bullets: [
          "Family member profile — their name, relationship, and profile photo",
          "Birth data summary — date, time, and place of birth used to generate their charts",
          "Natal chart — their fully rendered birth chart with planet positions and house placements",
          "Upcoming sessions — any booked sessions linked to this family member's profile",
          "Notes — private notes you have added about this person's chart, needs, or spiritual journey",
          "Edit birth data — update their birth information if the time or location needs correction",
          "Remove member — remove this profile from your family plan (the plan seat is freed up immediately)"
        ]
      },
      {
        name: "discount-tokens",
        label: "Discount Tokens & Coupons",
        description: "Enter a discount code or coupon token to apply a price reduction to your Perennial Mandalism membership renewal or Mystery School enrollment. See active discounts applied to your account and their expiry dates.",
        group: "My Membership",
        purpose: "Discount tokens allow PM members to take advantage of promotional pricing — whether from a referral, a special event, or a school-issued loyalty reward. This page is where you enter a coupon code and see it applied to your next billing cycle. It also shows any discounts currently active on your account and when they expire.",
        bullets: [
          "Coupon entry field — enter a discount code and click Apply to validate it instantly",
          "Validation feedback — the platform confirms if the code is valid, expired, or already used",
          "Discount type shown — whether the code gives a percentage off, a flat dollar amount off, or a free period",
          "Active discounts on your account — all currently applied discounts with their expiry dates",
          "Applies to next billing — discounts are applied to your next subscription renewal, not the current period",
          "Referral discount — if a friend referred you, your referral discount appears here automatically",
          "PM member discount for Mystery School — if you are a PM member enrolling in the Mystery School, your discounted rate is shown here"
        ]
      },
      {
        name: "transit-overlay",
        label: "Charts Transit Overlay",
        description: "Overlay current or future planetary positions onto any natal chart in your family account. See exactly which houses and natal planets are being activated by today's transits — or any date you choose.",
        group: "Astrology Tools",
        purpose: "Seeing current transits in isolation is useful, but seeing them overlaid directly on a natal chart is transformative — it shows you exactly which part of a person's life is being activated right now. The Transit Overlay tool lets you select any chart in your account (your own or a family member's) and overlay any date's planetary positions to see the full picture of what is happening astrologically for that person at that moment.",
        bullets: [
          "Chart selector — choose which natal chart to use as the base (your own or any family member's)",
          "Date picker — set a specific date to see that day's planetary positions overlaid on the chosen chart",
          "Today's overlay — default view shows today's transits against the selected natal chart",
          "Transit highlights — planets making major aspects (conjunction, square, trine, opposition) are highlighted in the overlay",
          "Aspect table — a table listing all active transit aspects with the natal planet affected and the type of angle",
          "Interpretation layer — plain-language description of what each major transit means for the chart holder",
          "Timeline slider — drag through a date range to watch transits move across the chart over time"
        ]
      },
      {
        name: "pm-decan-study",
        label: "Decan Study Guide",
        description: "A deep-dive reference page for any of the 36 decans — its ruling planet, mythological story, tarot card correspondence, and spiritual teaching from the school. Use this to understand any decan your planets fall in or that is currently active.",
        group: "Astrology Tools",
        purpose: "The 36 decans are the foundational curriculum of this school, and understanding each one deeply takes ongoing study. This page provides PM members access to the school's full decan reference material — not just the name and ruling planet, but the mythology, the spiritual archetype, the tarot connection, and Eddie Paredes' commentary. It is the study reference that complements the Decans Explorer.",
        bullets: [
          "Decan name and position — the 10-degree segment of the zodiac wheel this decan occupies",
          "Ruling planet — which planet governs this decan and what energy it brings",
          "Sign context — which zodiac sign this decan falls within and what that combination means",
          "Tarot correspondence — the Minor Arcana card linked to this decan with card image and meaning summary",
          "Mythological archetype — the ancient story or spirit associated with this decan in the Western esoteric tradition",
          "Head Master commentary — Eddie Paredes' personal spiritual interpretation of this decan's energy",
          "Your planets here — which of your natal planets fall in this decan, shown from your saved birth data"
        ]
      },
      {
        name: "practice-streak",
        label: "Practice Streak & Milestones",
        description: "Track your daily spiritual practice streak — consecutive days of logged rituals and meditations. View milestone achievements, see your longest streak, and compare your current consistency with your personal best.",
        group: "Community & Worship",
        purpose: "Spiritual practice builds through consistency. The streak system gamifies daily practice in a meaningful way — seeing your streak grow motivates you to maintain your practice even on difficult days. Milestones (7 days, 30 days, 100 days) mark real achievements in your spiritual discipline and are celebrated by the platform with recognition and a message from the school.",
        bullets: [
          "Current streak — how many consecutive days you have logged a practice without a gap",
          "Longest streak — your personal record for unbroken daily practice",
          "Milestone badges — achievements awarded at 7, 30, 60, 90, and 100 days of consecutive practice",
          "Practice calendar — a visual heatmap showing every day you practiced in the past year",
          "Upcoming milestone — how many more days until you reach your next milestone badge",
          "Streak restore — if you miss a day, the platform offers one annual 'grace day' that preserves your streak",
          "School recognition — practitioners and school leaders can see your streak milestones and acknowledge them"
        ]
      },
      {
        name: "pm-notifications",
        label: "Notification Centre",
        description: "A central inbox for all platform notifications — upcoming event reminders, new library content, Sunday Service announcements, practitioner messages, billing alerts, and community activity relevant to you.",
        group: "My Membership",
        purpose: "The Notification Centre ensures you never miss something important in the PM community — whether it is a Sunday Service starting in 30 minutes, a new ritual added to the library, a message from your practitioner, or a billing reminder. All alerts land here in one place with clear timestamps and one-click navigation to the relevant page.",
        bullets: [
          "All notifications in one list — sorted by most recent, with unread items highlighted at the top",
          "Event reminders — automated reminders for Sunday Service, workshops, and events you have RSVPed to",
          "New content alerts — when a new ritual, article, video, or doctrine document is added to the library",
          "Practitioner messages — messages from your assigned practitioner or school administrator",
          "Billing alerts — upcoming renewal reminders and payment confirmation receipts",
          "Mark as read — clear individual notifications or mark all as read at once",
          "Notification preferences link — a shortcut to your profile settings where you configure which alerts you receive"
        ]
      },
      {
        name: "pm-support",
        label: "Help & Support",
        description: "Access help resources, submit support tickets, and find answers to common questions about your Perennial Mandalism membership — from billing inquiries to technical issues with astrology tools.",
        group: "My Membership",
        purpose: "Members occasionally need help — they cannot find a feature, have a billing question, or are experiencing a technical issue. The Help and Support page gives them a self-service first layer (FAQs, how-to guides, video walkthroughs) before escalating to a support ticket if their question is not answered. Clear, organized support reduces frustration and improves member retention.",
        bullets: [
          "FAQ library — answers to the most common membership questions organized by topic",
          "Video walkthroughs — short screen-recording guides showing how to use key features like charts, rituals, and events",
          "Submit a ticket — a form to describe your issue, attach a screenshot, and send it to the support team",
          "Ticket history — view all past support tickets and their resolution status",
          "Billing questions — dedicated section for billing, refund, and subscription inquiry submissions",
          "Community chat link — a shortcut to the PM community discussion board for peer support",
          "Response time expectation — a visible note that tickets are responded to within 1 to 2 business days"
        ]
      },
      {
        name: "broadcast-detail",
        label: "Broadcast Detail (Community)",
        description: "Full detail page for a single platform broadcast available to Perennial Mandalism members. Shows the diviner's name, broadcast title, recording playback, description, and member comments section.",
        group: "Events",
        purpose: "Gives members a focused viewing experience for individual broadcasts with community discussion context below the video.",
        bullets: [
          "Video player with broadcast recording and chapter markers if available",
          "Diviner bio and quick-link to book a personal session with this diviner",
          "Member comment thread — leave a timestamped comment tied to a specific moment in the broadcast"
        ]
      },
      {
        name: "event-detail",
        label: "Event Detail (Community)",
        description: "Full detail page for a community event such as a workshop, ritual gathering, or live Q&A. Shows the date, time, host diviner, description, RSVP button, and attendee count.",
        group: "Events",
        purpose: "Provides members with all the information they need to decide whether to attend and to RSVP in one place.",
        bullets: [
          "Event banner image, title, date and time in the member's local timezone",
          "Host diviner profile card with quick-link to their public profile",
          "RSVP button with confirmation email trigger and add-to-calendar download option"
        ]
      },
      {
        name: "ingress-chart-detail-pm",
        label: "Ingress Chart Detail (PM Member)",
        description: "Member-facing detail view for a planetary ingress chart. Displays the chart wheel, the triggered world entities, and the plain-language interpretation written for the Perennial Mandalism audience.",
        group: "Mundane",
        purpose: "Allows PM members to explore individual ingress events in depth and understand how they connect to current world affairs.",
        bullets: [
          "Chart wheel with planet glyphs and house lines rendered at member resolution",
          "Triggered entities list: countries, leaders, and markets flagged by this ingress",
          "Plain-language interpretation with a link to the full forecast if one exists"
        ]
      },
      {
        name: "ritual-detail",
        label: "Ritual Detail (Community)",
        description: "Full detail page for a ritual available in the community ritual library. Shows the ritual purpose, planetary alignment, step-by-step instructions, required materials, and a completion tracker.",
        group: "Rituals",
        purpose: "Gives members a structured, self-guided ritual experience that connects their practice to the live astrological calendar.",
        bullets: [
          "Ritual header: name, planet, sign, recommended timing window",
          "Step-by-step instructions with materials list and estimated duration",
          "Mark complete button — logs the completion in the member's practice streak tracker"
        ]
      },
      {
        name: "tarot-spread-history",
        label: "Tarot Spread History",
        description: "Chronological log of all tarot readings the member has completed within the community portal. Each row shows the spread type, date, and a link to review the cards drawn and their interpretations.",
        group: "Tarot",
        purpose: "Allows members to track patterns in their tarot practice over time and revisit past readings as their circumstances evolve.",
        bullets: [
          "Reading log: spread name, date, number of cards drawn",
          "Click to expand full reading — shows card positions, card names, and interpretation text",
          "Export reading as PDF — formatted summary suitable for journalling"
        ]
      },
      {
        name: "mundane-entity-detail-pm",
        label: "World Entity Detail (PM Member)",
        description: "Member-facing profile for a world entity (country, organisation, or leader) in the mundane astrology system. Shows the natal chart, current transits, recent mundane score changes, and linked forecasts.",
        group: "Mundane",
        purpose: "Lets members dive deep into specific entities they are following without needing admin access, building investment in the mundane astrology content.",
        bullets: [
          "Entity natal chart wheel with current transit overlays",
          "Mundane score trend chart: 30-day and 90-day trajectories",
          "Linked forecasts panel — all published forecasts that reference this entity"
        ]
      },
      {
        name: "transit-detail-pm",
        label: "Transit Detail (PM Member)",
        description: "Detailed explanation of a single active transit affecting the member's personal natal chart. Shows the transiting planet, natal planet being aspected, orb, duration, and a personalised interpretation.",
        group: "Horoscope",
        purpose: "Helps members understand how current sky positions are personally affecting them with clear, non-jargon language and timing guidance.",
        bullets: [
          "Transit header: transiting planet aspect natal planet, current orb, exact date",
          "Personalised interpretation paragraph based on the member's natal placements",
          "Duration bar: when the transit entered orb, exact date, and when it leaves orb"
        ]
      },
      {
        name: "family-chart",
        label: "Family Chart",
        description: "Composite or synastry chart view for the member's family circle group. Displays overlapping natal placements between selected family members and highlights key compatibility aspects and tension points.",
        group: "Charts",
        purpose: "Deepens members' astrological practice by extending chart work to their closest relationships within a privacy-safe family circle.",
        bullets: [
          "Family member selector — choose 2 to 4 members to include in the composite",
          "Overlay chart wheel showing combined placements with colour-coded glyphs per person",
          "Aspect summary table: harmonious, challenging, and neutral aspects with plain-language labels"
        ]
      },
      {
        name: "upgrade-to-ms",
        label: "Upgrade to Mystery School",
        description: "Upgrade prompt page for Perennial Mandalism members showing the Mystery School offering, what additional content they would unlock, the price difference, and a direct enrolment CTA.",
        group: "Plan",
        purpose: "Converts interested PM members to Mystery School subscribers by clearly articulating the value add with a frictionless single-click enrolment path.",
        bullets: [
          "Side-by-side feature comparison: what you have now vs. what you gain with Mystery School",
          "Price and billing frequency display with dynamic pricing from the admin pricing config",
          "Enrol Now button — leads directly to the Mystery School checkout with PM discount applied if applicable"
        ]
      },
      {
        name: "onboarding-step-1",
        label: "Community Onboarding Step 1",
        description: "First step of the Perennial Mandalism onboarding flow. Welcomes the new member, explains the community pillars, and prompts them to enter or confirm their birth data for personalised chart features.",
        group: "Onboarding",
        purpose: "Captures essential birth data at the earliest opportunity so the member's first chart experience is personalised rather than generic.",
        bullets: [
          "Welcome message with community overview and what to expect from the portal",
          "Birth data form: date, time (with 'unknown' option), and birthplace with geocoding",
          "Progress indicator showing this is step 1 of the onboarding sequence"
        ]
      },
      {
        name: "onboarding-step-2",
        label: "Community Onboarding Step 2",
        description: "Second onboarding step where the member selects their areas of astrological interest and sets notification preferences. This configures the home hub to surface the most relevant content for their practice.",
        group: "Onboarding",
        purpose: "Personalises the member's content feed from day one so they immediately encounter relevant material rather than a generic default layout.",
        bullets: [
          "Interest picker: Natal Chart, Transits, Mundane, Rituals, Tarot, Mystery School — multi-select",
          "Notification preference toggles: weekly transit digest, event reminders, broadcast alerts",
          "Finish and enter community button — redirects to the personalised hub"
        ]
      },
      {
        name: "chart-synastry",
        label: "Synastry Chart",
        description: "Bi-wheel synastry chart comparing the member's natal chart with another person (partner, friend, or family member). Highlights conjunctions, oppositions, trines, and squares between the two charts with relationship interpretations.",
        group: "Charts",
        purpose: "Extends the member's personal chart work to relationship dynamics, one of the most engaging practical applications of astrology.",
        bullets: [
          "Dual-person selector: choose from family circle or enter new birth data for the comparison person",
          "Bi-wheel chart with inner (self) and outer (other) rings",
          "Aspect interpretation list sorted by significance — most impactful aspects described first"
        ]
      },
      {
        name: "pm-legal",
        label: "PM Legal & Terms",
        description: "Page displaying the Perennial Mandalism membership terms of service, community guidelines, and privacy policy in full. Includes the date each document was last updated and a member-signed acknowledgement log.",
        group: "Settings",
        purpose: "Ensures members can access the legal framework for their membership at any time and provides an audit trail of acceptance.",
        bullets: [
          "Full terms of service, community guidelines, and privacy policy in readable format",
          "Last-updated date displayed prominently for each document",
          "Acceptance history: date the member agreed to each version"
        ]
      },
      {
        name: "pm-help",
        label: "PM Help & Support",
        description: "Help centre for Perennial Mandalism members with a searchable FAQ, guided troubleshooting articles, and a contact form to raise a support ticket. Commonly asked questions are displayed without needing to search.",
        group: "Settings",
        purpose: "Reduces support ticket volume by surfacing self-service answers for the most common member questions first.",
        bullets: [
          "Search bar with instant FAQ results as you type",
          "Category tiles: Billing, Technical, Content, Community Guidelines — tap to browse by topic",
          "Contact support form — pre-filled with account details so members do not need to repeat them"
        ]
      },
      {
        name: "pm-notifications-settings",
        label: "PM Notification Settings",
        description: "Granular notification preferences for the Perennial Mandalism member. Controls email and in-app notifications for transit alerts, event reminders, broadcast announcements, and community activity.",
        group: "Settings",
        purpose: "Gives members control over notification frequency so the platform adds value without becoming intrusive.",
        bullets: [
          "Toggle rows per notification type: on/off with email vs. in-app selectors",
          "Digest frequency selector for transit alerts: daily, weekly, or real-time",
          "Quiet hours setting — suppress all notifications outside specified hours"
        ]
      },
      {
        name: "pm-activity-feed",
        label: "PM Activity Feed",
        description: "Chronological activity feed showing the member's recent platform interactions: rituals completed, transits triggered, events attended, and broadcasts watched. Acts as a personal practice journal alternative.",
        group: "Community",
        purpose: "Helps members see the breadth of their engagement and feel a sense of progress and continuity in their spiritual practice.",
        bullets: [
          "Feed entries with icon, description, and timestamp for each activity type",
          "Filter by activity type: Rituals, Charts, Events, Broadcasts",
          "Practice streak counter at the top — consecutive days with at least one completed activity"
        ]
      },
      {
        name: "sunday-service-archive",
        label: "Sunday Service Archive",
        description: "Archive of all past Sunday Service recordings available to PM members. Each entry shows the date, diviner host, topic, and recording length. Members can search by topic or date and play directly in the portal.",
        group: "Events",
        purpose: "Ensures members who missed live Sunday Services can catch up at their own pace, extending the value of live content beyond the broadcast date.",
        bullets: [
          "Archive list sorted by most recent with search by topic and host",
          "Recording length and host displayed on each card",
          "In-portal video player with playback speed control and resume-from-last-position"
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
      {
        name: "ms-dashboard",
        label: "Mystery School Dashboard",
        description: "Your home screen after login as a Mystery School student — current decan status, foundation week progress, and upcoming decan windows.",
        group: "Overview",
        purpose: "Provides the student an at-a-glance summary of where they are in the curriculum and what is active right now.",
        bullets: [
          "Active decan card showing current window open/close dates",
          "Foundation quarter progress with weeks completed out of 12",
          "Quick-links to this week's foundation audio and ritual"
        ]
      },
      {
        name: "ms-subscription",
        label: "Subscription & Billing",
        description: "Manage your Mystery School subscription — view billing date, plan amount, and cancel or resume access.",
        group: "Account",
        purpose: "Full transparency on what you pay and when, with self-serve cancel and resume controls.",
        bullets: [
          "Monthly subscription amount and next billing date",
          "One-time initiation fee receipt for your records",
          "Cancel subscription with retained access until period end"
        ]
      },
      {
        name: "ms-settings",
        label: "MS Account Settings",
        description: "Update your display name, timezone, and notification preferences for Mystery School content.",
        group: "Account",
        purpose: "Personalise your experience so decan window reminders fire at the right local time.",
        bullets: [
          "Timezone picker so window open/close times display correctly",
          "Email notification toggle for decan preview and grace period alerts",
          "Display name shown on your graduation certificate"
        ]
      },
      {
        name: "ms-foundation-audio",
        label: "Foundation Week Audio Player",
        description: "Each of the 12 foundation weeks includes an audio teaching by Beto — listen directly in the portal.",
        group: "Training",
        purpose: "Guided audio instruction makes the curriculum accessible without requiring a video setup.",
        bullets: [
          "Embedded audio player with playback speed control",
          "Beto photo card displayed alongside the audio for context",
          "Progress saved — resume from where you left off on any device"
        ]
      },
      {
        name: "ms-decan-grid",
        label: "36 Decan Mastery Grid",
        description: "The full 36-decan grid showing which decans you have completed, which are active now, and which are upcoming.",
        group: "Training",
        purpose: "A birds-eye view of the entire year's curriculum mapped to zodiac sign and ruling planet.",
        bullets: [
          "36 cards arranged by zodiac order — green for complete, amber for active, grey for upcoming",
          "Click any active or completed decan to view its detail page",
          "Your completion count shown prominently above the grid"
        ]
      },
      {
        name: "ms-journal",
        label: "Decan Journal",
        description: "After completing the ritual and scrying session, record your personal observations and insights in the structured journal.",
        group: "Training",
        purpose: "Journalling is required as the final step of each decan completion and becomes part of your permanent record.",
        bullets: [
          "Prompted fields: themes observed, entities encountered, insights received",
          "Private entry — only visible to you and assigned admin",
          "Once submitted, marks the decan as fully complete"
        ]
      },
      {
        name: "decan-ritual-page",
        label: "Decan Ritual Page",
        description: "Guided ritual page for the current active decan. Presents the full ritual sequence: opening invocation, planetary working, contemplative practice, and closing. Students mark each step complete as they go.",
        group: "Decans",
        purpose: "Structures the ritual component of each decan study so students engage with it as a living practice rather than a reading exercise.",
        bullets: [
          "Step-by-step ritual sequence with instructional text for each phase",
          "Materials and preparation checklist displayed before the ritual begins",
          "Step completion checkboxes — all steps must be checked to enable journal submission"
        ]
      },
      {
        name: "decan-scrying-page",
        label: "Decan Scrying Page",
        description: "Guided scrying exercise tied to the active decan's planetary intelligence. Provides a timed meditation prompt, a visual focal point, and a free-text field for recording visions and impressions received during the practice.",
        group: "Decans",
        purpose: "Integrates a contemplative inner-work component into the decan curriculum to balance textual study with direct experiential practice.",
        bullets: [
          "Timed meditation countdown (configurable 5, 10, or 20 minutes) with ambient sound option",
          "Decan sigil or symbol displayed as the visual focal point during the session",
          "Impression recording field — auto-saves every 30 seconds and feeds into the journal"
        ]
      },
      {
        name: "decan-journal-write",
        label: "Decan Journal Write",
        description: "Journal submission page for the current decan. Students record their ritual observations, scrying impressions, and personal reflections. On submit the decan is marked complete and submitted for admin review if graduation-eligible.",
        group: "Decans",
        purpose: "Creates the formal record of the student's decan work, which is reviewed during the graduation process to assess depth of engagement.",
        bullets: [
          "Prompted journal structure: Ritual observations, Scrying impressions, Personal insights",
          "Rich-text editor with minimum word guidance (not enforced, but recommended 200 words)",
          "Submit button with confirmation modal explaining that entries cannot be edited after submission"
        ]
      },
      {
        name: "foundation-task-complete",
        label: "Foundation Task Complete",
        description: "Completion screen shown after a student finishes a Foundation Week task. Displays a congratulatory message, the task they completed, their updated Foundation progress bar, and the next task to unlock.",
        group: "Foundation",
        purpose: "Provides positive reinforcement at each Foundation milestone to build momentum and reduce early-stage drop-off.",
        bullets: [
          "Task title and completion checkmark with a congratulatory headline",
          "Foundation progress bar updated to reflect the newly completed task",
          "Next task preview card with a CTA to begin it immediately"
        ]
      },
      {
        name: "ms-subscription-manage",
        label: "Mystery School Subscription Management",
        description: "Self-service subscription management page for Mystery School students. Shows the current plan, billing date, payment method on file, and options to pause, cancel, or upgrade to an annual plan.",
        group: "Settings",
        purpose: "Gives students control over their subscription without needing to contact support, reducing churn caused by friction in the cancellation process.",
        bullets: [
          "Current plan, price, and next billing date displayed prominently",
          "Payment method card with update button (opens Stripe hosted form)",
          "Pause and Cancel options with clear impact explanation for each action"
        ]
      },
      {
        name: "decans-by-sign",
        label: "Decans by Sign",
        description: "Reference page showing all 36 decans organised by zodiac sign. Each sign has three decan cards with the ruling planet, associated symbolism, and the student's completion status. Acts as a curriculum map.",
        group: "Decans",
        purpose: "Helps students navigate the full decan curriculum at a glance and understand how their progress maps across the zodiac.",
        bullets: [
          "Sign sections with three decan cards each, colour-coded by completion status",
          "Decan card: number, name, ruling planet, brief description, and locked/active/complete badge",
          "Progress summary: X of 36 decans complete, shown at the top of the page"
        ]
      },
      {
        name: "ritual-builder-step-1",
        label: "Ritual Builder Step 1 — Intent",
        description: "First step of the student-facing ritual builder. The student selects a planetary intelligence to work with, states their ritual intention, and chooses a working type (petition, gratitude, banishing, or invocation).",
        group: "Builder",
        purpose: "Guides students through building a personalised ritual by starting with clear intent, ensuring the working has a defined purpose before the structure is assembled.",
        bullets: [
          "Planetary selector with glyph and brief description of each planet's domain",
          "Intent text field with guidance prompts to help students articulate their working clearly",
          "Working type selector with a plain-English explanation of each type"
        ]
      },
      {
        name: "ritual-builder-step-2",
        label: "Ritual Builder Step 2 — Structure",
        description: "Second step of the ritual builder where the student assembles the ritual sequence from a library of components: invocations, correspondences, actions, and closings. The assembled ritual can be saved and used later.",
        group: "Builder",
        purpose: "Teaches students to construct rituals structurally rather than following a script, deepening their practical understanding of planetary magic.",
        bullets: [
          "Component library sorted by ritual phase: Opening, Working, Closing",
          "Drag-and-drop builder canvas where students sequence their chosen components",
          "Save as personal ritual button — stores the built ritual in the student's private library"
        ]
      },
      {
        name: "ms-center",
        label: "Mystery School Center",
        description: "The main navigation hub for Mystery School students. Displays the current decan, foundation progress, upcoming Sunday Service, and quick links to the decan study, ritual, builder, and journal pages.",
        group: "Dashboard",
        purpose: "Orients students each time they log in by surfacing where they are in the curriculum and what action to take next.",
        bullets: [
          "Current decan card with active status and a Go to Decan CTA",
          "Foundation progress bar and next unlocking milestone",
          "Upcoming Sunday Service countdown with RSVP button"
        ]
      },
      {
        name: "ms-community",
        label: "Mystery School Community",
        description: "Community discussion space exclusive to Mystery School students. Organised by topic channels including general, decan-by-decan discussions, ritual questions, and graduation support. Moderated by admin and senior students.",
        group: "Community",
        purpose: "Creates a peer support environment where students at similar stages can share observations and support each other through the curriculum.",
        bullets: [
          "Channel list with unread message counts",
          "Threaded discussion view within each channel",
          "Mention and direct message capabilities for student-to-student interaction"
        ]
      },
      {
        name: "ms-help",
        label: "Mystery School Help",
        description: "Help centre specific to Mystery School students. Contains FAQs about the curriculum, decan progression rules, graduation requirements, and subscription billing. Includes a contact form for escalation.",
        group: "Settings",
        purpose: "Reduces admin support burden by providing structured answers to the most common Mystery School student questions.",
        bullets: [
          "Curriculum FAQ covering decan unlocking, journal requirements, and graduation eligibility",
          "Subscription FAQ covering billing, pausing, and cancellation impact on progress",
          "Contact form pre-populated with the student's account and current decan for faster support triage"
        ]
      },
      {
        name: "ms-decan-progress-chart",
        label: "Decan Progress Chart",
        description: "Visual chart showing the student's completion progress across all 36 decans. Displays a wheel or grid view with completed, active, and locked decans marked. Highlights the graduation milestone decans.",
        group: "Dashboard",
        purpose: "Gives students a motivating visual representation of their long-term progress to sustain engagement across the multi-year curriculum.",
        bullets: [
          "36-segment wheel or grid with colour coding: complete (filled), active (highlighted), locked (dim)",
          "Graduation milestone markers at decan 12, 24, and 36",
          "Estimated completion date based on current average completion pace"
        ]
      },
      {
        name: "ms-profile",
        label: "Mystery School Profile",
        description: "Student profile page within the Mystery School portal showing their display name, avatar, current decan, completed decan count, and any badges earned. Editable by the student for name and avatar.",
        group: "Settings",
        purpose: "Gives students an identity within the Mystery School community that reflects their progress and encourages continued engagement.",
        bullets: [
          "Avatar upload and display name editor",
          "Progress summary: decans complete, current active decan, graduation status",
          "Earned badges displayed as a trophy shelf — hover shows the criteria for each badge"
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
      {
        name: "advocate-link-generator",
        label: "Referral Link Generator",
        description: "Create custom referral links for specific diviners, services, or campaigns with UTM tracking built in.",
        group: "Tools",
        purpose: "Generate targeted deep-links so you can promote individual readings rather than just the home page.",
        bullets: [
          "Pick any diviner or service to link directly to their booking page",
          "Auto-appended referral code so every click is tracked to your account",
          "Copy link with one click or share directly to social"
        ]
      },
      {
        name: "advocate-social-toolkit",
        label: "Social Media Toolkit",
        description: "Ready-to-post images, captions, and hashtag sets provided by the platform for your social promotion.",
        group: "Tools",
        purpose: "Reduces the effort of content creation so advocates can post quality material consistently.",
        bullets: [
          "Brand-approved image assets sized for Instagram, Facebook, and X",
          "Caption templates with placeholder fields for personalisation",
          "Best-posting-time guidance per platform"
        ]
      },
      {
        name: "advocate-tier-progress",
        label: "Tier & Milestone Progress",
        description: "Track your progress toward the next commission tier — how many referrals and what revenue is needed to unlock a higher rate.",
        group: "Performance",
        purpose: "Motivates advocates to reach the next tier by making progress visible and specific.",
        bullets: [
          "Current tier badge and percentage progress to next tier",
          "Projected earnings if you maintain your current monthly pace",
          "Milestone history — when you unlocked each tier in the past"
        ]
      },
      {
        name: "advocate-notifications",
        label: "Notifications",
        description: "New commission earned, payout processed, campaign started, or tier upgrade — all alerts in one feed.",
        group: "Settings",
        purpose: "Keeps advocates informed of earning events without having to check the dashboard constantly.",
        bullets: [
          "Real-time commission earned alerts with session and amount details",
          "Payout processed notifications with bank transfer reference",
          "New campaign launched alert with commission rate and end date"
        ]
      },
      {
        name: "advocate-settings",
        label: "Advocate Settings",
        description: "Manage your payout method, contact email, and notification preferences.",
        group: "Settings",
        purpose: "Control how and when you receive your commissions and how the platform contacts you.",
        bullets: [
          "Payout method — bank transfer or PayPal linked account",
          "Minimum payout threshold configuration",
          "Email and push notification toggle per event type"
        ]
      },
      {
        name: "advocate-leaderboard",
        label: "Advocate Leaderboard",
        description: "See where you rank among all social advocates by referral volume and commission earned this month.",
        group: "Performance",
        purpose: "Healthy competition drives performance — top advocates are spotlighted and may receive bonus incentives.",
        bullets: [
          "Top 10 advocates by referrals and by earnings (anonymised beyond top 3)",
          "Your rank badge shown prominently at the top of your dashboard",
          "Monthly leaderboard resets on the 1st of each month"
        ]
      },
      {
        name: "referral-detail",
        label: "Referral Detail",
        description: "Detail view for a single referral conversion. Shows the referred user's signup date, what they purchased, the commission earned, and the current payout status for this specific referral.",
        group: "Referrals",
        purpose: "Gives advocates transparency into exactly which referrals have converted and earned commission so they can verify their earnings are correctly tracked.",
        bullets: [
          "Referred user identifier (anonymised after 30 days), signup date, and first purchase",
          "Commission amount, commission rate applied, and platform fee deducted",
          "Payout status badge: Pending, Approved, Paid — with expected payout date for Pending items"
        ]
      },
      {
        name: "campaign-detail-advo",
        label: "Campaign Detail (Advocate)",
        description: "Detail view for a specific affiliate campaign the advocate is enrolled in. Shows campaign terms, the advocate's unique tracking link, real-time click and conversion stats, and earnings attributed to this campaign.",
        group: "Campaigns",
        purpose: "Helps advocates focus promotional efforts on the campaigns with the best conversion terms and track which channels are working best for each campaign.",
        bullets: [
          "Campaign terms: product scope, commission rate, start and end date, minimum payout threshold",
          "Unique tracking link with UTM parameters and one-click copy",
          "Live stats: link clicks, signups, paid conversions, earnings — updated every hour"
        ]
      },
      {
        name: "payout-receipt",
        label: "Payout Receipt",
        description: "Printable receipt for a completed advocate payout. Shows the payment date, amount, currency, payment method, and line-item breakdown of referrals included in the payout.",
        group: "Earnings",
        purpose: "Provides advocates with a formal payment record suitable for personal tax filing and accounting reconciliation.",
        bullets: [
          "Receipt header: payment date, reference number, advocate name, and total amount",
          "Line-item table: each referral included with commission amount",
          "Download as PDF button for record-keeping and tax documentation"
        ]
      },
      {
        name: "email-referral-tool",
        label: "Email Referral Tool",
        description: "Built-in email composition tool for advocates to send personalised referral invitations directly from the portal. Pre-populates the referral link and provides customisable template text.",
        group: "Content",
        purpose: "Lowers the barrier to active referral outreach by eliminating copy-paste steps and ensuring the tracking link is always correctly embedded.",
        bullets: [
          "Recipient email field (single or comma-separated list for bulk invitations)",
          "Email body pre-filled with the advocate's referral link and editable template text",
          "Send confirmation with delivery status and opt-out compliance note"
        ]
      },
      {
        name: "bio-link-page",
        label: "Bio Link Page",
        description: "Customisable bio link landing page that advocates can share on social media. Displays their referral links, a personal introduction, and curated content links. Each click on a referral link is tracked.",
        group: "Content",
        purpose: "Gives advocates a single shareable URL that works as a mini-website for their referral activity, ideal for platforms that only allow one link in a bio.",
        bullets: [
          "Editable headline, profile photo, and short bio field",
          "Up to 8 custom link cards with label, URL, and icon — referral links are auto-tracked",
          "Live preview of the bio link page as it appears to visitors"
        ]
      },
      {
        name: "advo-support",
        label: "Advocate Support",
        description: "Support centre for social advocates with FAQs on commission tracking, payout schedules, referral rules, and content guidelines. Includes a contact form for escalating issues not covered by the FAQ.",
        group: "Settings",
        purpose: "Reduces support ticket volume by giving advocates self-service answers to the most common questions about their earnings and referral tracking.",
        bullets: [
          "FAQ categories: Tracking & Attribution, Payouts, Content Rules, Campaign Terms",
          "Search within the FAQ for quick lookup",
          "Contact support form pre-populated with account details and current campaign enrolment"
        ]
      },
      {
        name: "content-calendar-advo",
        label: "Content Calendar (Advocate)",
        description: "Personalised content calendar for the advocate showing scheduled social posts, campaign launch dates, and payout dates. Advocates can add their own content notes to plan around platform promotional windows.",
        group: "Content",
        purpose: "Helps advocates align their promotional activity with platform campaign windows for maximum commission impact.",
        bullets: [
          "Month view with platform campaign dates highlighted in the campaign colour",
          "Payout schedule dates marked so advocates can plan cash flow",
          "Personal content note field per day — private to the advocate"
        ]
      },
      {
        name: "advo-training-resources",
        label: "Advocate Training Resources",
        description: "Curated training materials for social advocates including guides on effective referral strategies, content creation tips, platform product knowledge, and compliance guidelines for promotional content.",
        group: "Content",
        purpose: "Equips advocates with the knowledge and tools to promote effectively while staying compliant with platform and regulatory guidelines.",
        bullets: [
          "Getting Started guide for new advocates covering account setup and first referral steps",
          "Content creation tips: what to say, what not to say, and FTC disclosure requirements",
          "Product knowledge sheets for each platform offering to help advocates speak accurately about benefits"
        ]
      },
      {
        name: "advo-team-view",
        label: "Advocate Team View",
        description: "For advocates in a tiered structure, this view shows their sub-advocates and their referral performance. Displays the team's aggregate clicks, conversions, and earnings alongside the advocate's own stats.",
        group: "Referrals",
        purpose: "Enables senior advocates to monitor their team's performance and identify members who need coaching or support.",
        bullets: [
          "Team member list with avatar, referral count, conversion rate, and earnings this period",
          "Aggregate team stats at the top: total referrals, total conversions, total team earnings",
          "Invite sub-advocate button — generates a team join link with pre-filled team code"
        ]
      },
      {
        name: "advo-commission-breakdown",
        label: "Commission Breakdown",
        description: "Detailed breakdown of how the advocate's commission is calculated for the current period. Shows gross referral revenue, applicable commission tier rate, bonuses earned, and any deductions or adjustments.",
        group: "Earnings",
        purpose: "Provides full transparency into commission calculation so advocates understand exactly how their tier and bonus rules interact with raw referral performance.",
        bullets: [
          "Current commission tier with threshold and current progress toward the next tier",
          "Earnings breakdown: base commission, tier bonus, campaign bonus, minus adjustments",
          "Comparison to previous period with percentage change highlighted"
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
      {
        name: "trainee-profile",
        label: "Trainee Profile",
        description: "Your public trainee profile — mentors and admins can view your bio, specialities, and training history.",
        group: "Settings",
        purpose: "Manage how you appear to mentors and platform admins during your apprenticeship.",
        bullets: [
          "Editable bio, display name, and profile photo",
          "Visible specialties and astrological interests",
          "Training history summary available to mentors"
        ]
      },
      {
        name: "trainee-notifications",
        label: "Notifications Centre",
        description: "Lesson drops, mentor messages, quiz results, and milestone alerts all delivered here.",
        group: "Settings",
        purpose: "Consolidated inbox so no training event is missed.",
        bullets: [
          "Lesson availability alerts when new content drops",
          "Mentor message notifications",
          "Badge and milestone earned alerts"
        ]
      },
      {
        name: "trainee-mentor-chat",
        label: "Mentor Chat",
        description: "Direct message thread with your assigned mentor — ask questions and receive feedback between live sessions.",
        group: "Mentorship",
        purpose: "Asynchronous support channel between formal scheduled sessions.",
        bullets: [
          "Message history with timestamps and read receipts",
          "Attach chart screenshots or files for mentor review",
          "Pinned messages for key instructions from mentor"
        ]
      },
      {
        name: "trainee-schedule",
        label: "Training Schedule",
        description: "Calendar view of upcoming lessons, quizzes, and scheduled mentor sessions for the next 30 days.",
        group: "Training",
        purpose: "Visual weekly planner for managing your apprenticeship workload.",
        bullets: [
          "Week-at-a-glance calendar with lesson blocks colour-coded by program",
          "Click any block to jump directly to the lesson or session",
          "Upcoming quiz deadlines highlighted in amber"
        ]
      },
      {
        name: "trainee-bookmarks",
        label: "Bookmarked Lessons",
        description: "A curated list of lessons you have bookmarked for reference during readings and revision.",
        group: "Resources",
        purpose: "Quick-access library of content you have flagged for return visits.",
        bullets: [
          "Star any lesson to add it here instantly",
          "Grouped by program for easy retrieval",
          "Search bookmarks by keyword"
        ]
      },
      {
        name: "trainee-badge-wall",
        label: "Badge Wall",
        description: "Every milestone badge you have earned — quiz streaks, lesson completions, on-time attendance, and special honours.",
        group: "Progress",
        purpose: "Gamified recognition system that motivates consistent training engagement.",
        bullets: [
          "Earned badges displayed with the date achieved",
          "Locked future badges shown as silhouettes — see what is coming next",
          "Share your badge wall link to social or community"
        ]
      },
      {
        name: "trainee-settings",
        label: "Trainee Settings",
        description: "Account and notification preferences specific to your trainee portal.",
        group: "Settings",
        purpose: "Customise your training experience — email digests, session reminders, and timezone.",
        bullets: [
          "Set your preferred timezone for session scheduling",
          "Choose weekly vs. daily email digest frequency",
          "Enable or disable mentor activity notifications"
        ]
      },
      {
        name: "lesson-detail",
        label: "Lesson Detail",
        description: "Full content view for a single training lesson. Displays the lesson video or article, supplementary materials, learning objectives, and a progress tracker. The quiz unlocks after the trainee marks the lesson as complete.",
        group: "Curriculum",
        purpose: "Provides a focused, distraction-free learning environment with all lesson materials in one place and a clear path to the assessment.",
        bullets: [
          "Video player or article body with estimated read or watch time displayed",
          "Supplementary materials section: downloadable PDFs, reference links, and diagrams",
          "Mark as Complete button that updates progress and unlocks the associated quiz"
        ]
      },
      {
        name: "quiz-result-detail",
        label: "Quiz Result Detail",
        description: "Result page shown after a trainee submits a quiz. Displays the score, pass or fail status, each question with the trainee's answer marked correct or incorrect, and the correct answer with explanation for missed questions.",
        group: "Curriculum",
        purpose: "Converts quiz mistakes into learning moments by immediately showing the correct answers with explanations rather than just a score.",
        bullets: [
          "Score summary: percentage correct, pass/fail badge, and attempts remaining if failed",
          "Question-by-question review with the trainee's answer and correct answer side by side",
          "Explanation panel for each missed question linking back to the relevant lesson section"
        ]
      },
      {
        name: "program-certificate",
        label: "Program Certificate",
        description: "Certificate of completion page shown when a trainee passes all lessons and quizzes in a training program. Displays a branded certificate with the trainee's name, program title, and completion date. Downloadable as PDF.",
        group: "Graduation",
        purpose: "Provides trainees with a formal, shareable record of their achievement that motivates completion and supports their professional credibility.",
        bullets: [
          "Branded certificate with trainee name, program title, completion date, and platform seal",
          "Download as PDF button — formatted for print and digital sharing",
          "Share to LinkedIn button — pre-fills the credential fields on LinkedIn Certifications"
        ]
      },
      {
        name: "mentor-profile-view",
        label: "Mentor Profile View",
        description: "Read-only profile page for the trainee's assigned mentor. Shows the mentor's bio, qualifications, current session availability, and a button to book the next mentor session within the training program.",
        group: "Mentor",
        purpose: "Helps trainees understand their mentor's background and approach, building confidence in the mentorship relationship from the start.",
        bullets: [
          "Mentor avatar, name, bio, and listed specialisations",
          "Upcoming availability slots with Book a Session CTA",
          "Shared session history between this mentor and trainee with session notes links"
        ]
      },
      {
        name: "lesson-resources",
        label: "Lesson Resources",
        description: "Supplementary resources page for a specific lesson. Lists all downloadable materials, external reference links, recommended reading, and media assets associated with the lesson, separate from the main lesson content view.",
        group: "Curriculum",
        purpose: "Gives trainees a dedicated space to access and organise lesson materials without needing to return to the full lesson view each time.",
        bullets: [
          "Downloadable assets list with file type icon, name, and size",
          "External reference links with brief descriptions of what each resource covers",
          "Add to bookmarks button per resource — saves to the trainee's personal bookmark collection"
        ]
      },
      {
        name: "peer-community",
        label: "Trainee Peer Community",
        description: "Discussion forum exclusive to current trainees. Organised into channels: general chat, lesson questions, quiz help, and graduation advice. Moderated by assigned mentors.",
        group: "Community",
        purpose: "Creates a peer support network where trainees at similar stages can help each other through difficult lessons without waiting for mentor availability.",
        bullets: [
          "Channel list with unread message indicators",
          "Threaded discussions with mentor reply tags for mentor-originated content",
          "Direct message capability for trainee-to-trainee private conversations"
        ]
      },
      {
        name: "session-recording-replay",
        label: "Session Recording Replay",
        description: "Playback page for a recorded mentor session the trainee can replay at any time. Shows the video recording, the session date, topics covered, and any notes shared by the mentor during the session.",
        group: "Mentor",
        purpose: "Extends the value of mentor sessions beyond the live call by allowing trainees to revisit key points at their own pace.",
        bullets: [
          "Video player with playback speed control and chapter markers tied to topic timestamps",
          "Mentor session notes displayed alongside the video in a split-panel layout",
          "Download notes as PDF button for offline reference"
        ]
      },
      {
        name: "training-glossary",
        label: "Training Glossary",
        description: "Searchable reference glossary of astrological and platform-specific terms used throughout the training curriculum. Each term has a definition, example usage, and links to lessons where it is first introduced.",
        group: "Resources",
        purpose: "Reduces lesson drop-off caused by unfamiliar terminology by giving trainees an always-accessible reference without breaking their learning flow.",
        bullets: [
          "Alphabetical index with instant search across all terms",
          "Term definition card with an example sentence or chart context",
          "Linked lesson badge — click to jump to the lesson where this term was first introduced"
        ]
      },
      {
        name: "lesson-bookmark-detail",
        label: "Lesson Bookmark Detail",
        description: "Detail view for a single bookmarked lesson or resource the trainee has saved. Shows the full bookmarked item, the trainee's personal note attached to the bookmark, and options to remove the bookmark or add it to a collection.",
        group: "Resources",
        purpose: "Allows trainees to build a personalised study reference library alongside the structured curriculum.",
        bullets: [
          "Full lesson or resource content preview within the bookmark view",
          "Trainee note field — editable annotation the trainee added when bookmarking",
          "Collection organiser — drag the bookmark into a named collection (e.g. Aspects, Houses, Planets)"
        ]
      },
      {
        name: "trainee-help",
        label: "Trainee Help & Support",
        description: "Help centre for trainees with FAQs covering quiz retake rules, mentor session booking, curriculum progression, certificate issuance, and subscription billing. Includes a contact form for escalation.",
        group: "Settings",
        purpose: "Provides trainees with self-service answers so they can unblock themselves quickly without waiting for mentor or admin response.",
        bullets: [
          "FAQ categories: Curriculum, Quizzes, Mentor Sessions, Certificates, Billing",
          "Search within FAQs with instant filtering",
          "Contact support form pre-filled with current lesson and program for faster triage"
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
      {
        name: "client-chart",
        label: "My Natal Chart",
        description: "Your personal natal chart generated from your saved birth data — view planetary positions, aspect grid, and AI interpretation.",
        group: "Astrology",
        purpose: "Gives clients a permanent, shareable natal chart tied to their AstrologyPro profile for use in readings.",
        bullets: [
          "Full wheel chart with glyph annotations for all 10 planets",
          "Aspect grid showing major and minor aspects at a glance",
          "AI-generated interpretation summary for each house and planet placement"
        ]
      },
      {
        name: "client-birth-data",
        label: "Birth Data Settings",
        description: "Manage the birth time, date, and city saved to your profile — used for chart generation and diviner readings.",
        group: "Profile",
        purpose: "Accurate birth data is essential for precise readings — this page lets you update it any time.",
        bullets: [
          "City search with timezone auto-detection",
          "Rectified time toggle if exact birth time is unknown",
          "Changes propagate to all future chart requests"
        ]
      },
      {
        name: "client-notifications",
        label: "Notifications",
        description: "Session reminders, diviner messages, new reading availability, and platform announcements.",
        group: "Settings",
        purpose: "Keeps clients informed of everything happening in their AstrologyPro account.",
        bullets: [
          "24-hour and 1-hour session reminder notifications",
          "Diviner reply notifications when a message is sent",
          "Platform event and new offering announcements"
        ]
      },
      {
        name: "client-session-notes",
        label: "Session Notes",
        description: "View notes left by your diviner after each completed reading — a personal record of what was covered.",
        group: "My Sessions",
        purpose: "Post-session notes help clients retain key insights and track themes across multiple readings.",
        bullets: [
          "Notes organised by session date and diviner name",
          "Downloadable as PDF for your personal records",
          "Private — only visible to you and the reading diviner"
        ]
      },
      {
        name: "client-settings",
        label: "Account Settings",
        description: "Manage your contact email, password, notification preferences, and communication opt-ins.",
        group: "Settings",
        purpose: "Full account self-service so clients never need support for routine changes.",
        bullets: [
          "Email address and password update with verification",
          "Newsletter and promotional email opt-in controls",
          "Account deletion request — triggers a 30-day grace before data removal"
        ]
      },
      {
        name: "client-astrology-home",
        label: "Astrology Hub",
        description: "Your personal astrology centre — daily transit overview, current planetary weather, and your chart highlights for today.",
        group: "Astrology",
        purpose: "Provides personalised daily astrological context so clients feel the value of the platform every day, not just on reading days.",
        bullets: [
          "Today's planetary positions overlaid on your natal chart",
          "Transit description in plain language — no jargon",
          "Upcoming high-impact transit alerts for the next 7 days"
        ]
      },
      {
        name: "booking-step-1-select",
        label: "Book a Session — Select Diviner",
        description: "First step of the client booking flow. The client browses or searches for a diviner by specialty, rating, and availability. Each diviner card shows a brief bio, services offered, and average rating.",
        group: "Bookings",
        purpose: "Makes diviner discovery and selection frictionless so clients can find the right match quickly and move through the booking funnel.",
        bullets: [
          "Diviner grid with filter by specialty (Natal, Tarot, Vedic, Horary) and availability",
          "Diviner card: avatar, name, specialty tags, average rating, and starting price",
          "Click card to expand a quick-view with the full service list before committing"
        ]
      },
      {
        name: "booking-step-2-datetime",
        label: "Book a Session — Select Date and Time",
        description: "Second step of the booking flow where the client picks a date and available time slot for the selected service and diviner. Calendar shows real-time availability and highlights the earliest available slot.",
        group: "Bookings",
        purpose: "Reduces booking abandonment by presenting available slots clearly and defaulting to the earliest option so the client can complete the booking in seconds.",
        bullets: [
          "Calendar view with available dates highlighted and unavailable dates greyed out",
          "Time slot grid for the selected date in the client's local timezone",
          "Earliest available slot auto-highlighted with a Best Availability badge"
        ]
      },
      {
        name: "booking-step-3-confirm",
        label: "Book a Session — Confirm and Pay",
        description: "Final step of the booking flow showing an order summary and payment form. Client confirms the diviner, service, date, time, and total cost before completing payment. Supports saved payment methods and package credits.",
        group: "Bookings",
        purpose: "Converts the booking intent into a confirmed paid appointment with a clear summary and minimal friction at the payment step.",
        bullets: [
          "Order summary: diviner, service name, date and time, duration, and total cost",
          "Payment method selector: saved card, new card, or available package credits",
          "Confirm and Pay button — on success shows a booking confirmation with add-to-calendar option"
        ]
      },
      {
        name: "order-detail",
        label: "Order Detail",
        description: "Full detail view for a single client order. Shows the items purchased, amounts, payment method used, invoice number, and the current status of any associated sessions or deliverables.",
        group: "Orders",
        purpose: "Provides clients with a verifiable purchase record and a direct link to the associated session or content, reducing support inquiries about past orders.",
        bullets: [
          "Order header: order number, date, total, payment method, and status",
          "Line-item list: each service or product with unit price and quantity",
          "Download invoice button — formatted PDF receipt for personal records"
        ]
      },
      {
        name: "subscription-detail-client",
        label: "Subscription Detail (Client)",
        description: "Detail page for a client's active subscription (Perennial Mandalism or Mystery School). Shows the plan name, billing amount, next renewal date, payment method, and self-service options to pause or cancel.",
        group: "Subscriptions",
        purpose: "Gives clients transparent subscription management so they feel in control of their commitment and are less likely to resort to chargebacks.",
        bullets: [
          "Plan name, billing frequency, amount, and next renewal date",
          "Payment method on file with Update button",
          "Pause and Cancel options with clear plain-language explanation of the impact"
        ]
      },
      {
        name: "gift-card-redeem",
        label: "Gift Card Redeem",
        description: "Page where clients enter a gift card code to apply the credit to their account balance. Shows the credit amount added, current balance, and eligible products the balance can be applied toward.",
        group: "Orders",
        purpose: "Enables gift card recipients to claim their credit quickly and understand how to apply it to their next purchase.",
        bullets: [
          "Gift card code input field with Redeem button",
          "Success confirmation showing credit amount added and new account balance",
          "Eligible products list: which services and subscriptions the credit can be applied to"
        ]
      },
      {
        name: "notification-settings-client",
        label: "Notification Settings (Client)",
        description: "Granular notification preferences for the client. Controls email and push notifications for booking confirmations, session reminders, transit alerts, and platform announcements.",
        group: "Settings",
        purpose: "Gives clients control over their notification experience so they receive timely reminders without feeling overwhelmed by platform communications.",
        bullets: [
          "Toggle rows per notification type: email and push independently configurable",
          "Session reminder timing selector: 24 hours, 2 hours, or 30 minutes before session",
          "Marketing communications opt-out section — separate from transactional notices"
        ]
      },
      {
        name: "review-write",
        label: "Write a Review",
        description: "Review submission form for a completed session. The client rates the session with 1–5 stars, writes a review, and optionally consents to it being published on the diviner's public profile. Submitted reviews go to admin moderation.",
        group: "Reviews",
        purpose: "Captures client feedback promptly after sessions while the experience is fresh, building the diviner's social proof and platform trust signals.",
        bullets: [
          "Star rating selector with labelled descriptions (Poor to Excellent)",
          "Review text area with guidance prompts and 1000-character limit",
          "Consent toggle for public publication — unchecked means the review is shared with the diviner only"
        ]
      },
      {
        name: "support-help",
        label: "Client Support & Help",
        description: "Help centre for clients with FAQs covering booking, session problems, refund policy, account management, and subscriptions. Includes a contact form and a live chat option if enabled.",
        group: "Settings",
        purpose: "Provides clients with self-service resolution paths so minor issues are resolved without agent involvement.",
        bullets: [
          "FAQ categories: Booking, Sessions, Billing, Account, Subscriptions",
          "Search FAQ with instant result filtering",
          "Contact form with session selector so the client can attach a specific booking to the support request"
        ]
      },
      {
        name: "astro-daily-detail",
        label: "Daily Astrology Detail",
        description: "Expanded detail page for the client's daily astrological overview. Shows the day's planetary positions, aspects forming, moon phase, and how the day's energy connects to the client's natal placements.",
        group: "Astrology",
        purpose: "Gives clients a personalised daily astrological touchpoint that keeps them engaged with the platform between booked sessions.",
        bullets: [
          "Day overview: moon sign and phase, major aspects forming, planetary hour",
          "Personal connection: how today's sky aspects the client's natal planets",
          "Recommended action card: a single practical suggestion based on the day's astrology"
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
      {
        name: "homepage-hero",
        label: "Homepage Hero",
        description: "The first thing a visitor sees when they arrive at AstrologyPro — a full-screen hero section with a powerful headline, spiritual branding, a live cosmic clock, and clear calls to action for joining or browsing diviners.",
        group: "Marketing",
        purpose: "The homepage hero exists to convert a curious visitor into someone who wants to explore further or sign up. Within the first 5 seconds, a visitor needs to understand what AstrologyPro is, why it is different from a generic astrology website, and what they can do next. The hero answers those three questions: it names the value proposition, shows the platform's spiritual personality, and gives two clear paths — find a diviner, or join the community.",
        bullets: [
          "Headline and tagline — the platform's core value proposition stated in bold, compelling language",
          "Live cosmic clock — a real-time display of the current planetary positions and active astrological energies",
          "Primary CTA — 'Find a Diviner' or 'Start Your Journey' button leading to discovery or registration",
          "Secondary CTA — 'Explore the Community' or 'Learn About the School' leading to the About page",
          "Background visuals — premium celestial imagery that communicates spiritual depth and professionalism",
          "Social proof strip — a brief row of trust signals (number of practitioners, member count, session count)",
          "Mobile responsive — the hero adapts cleanly to phone screens with stacked layout and touch-friendly buttons"
        ]
      },
      {
        name: "diviner-directory",
        label: "Diviner Directory",
        description: "The public browse page where visitors discover and filter through AstrologyPro's practitioners. Filter by specialty, reading type, price range, language, and availability to find the right diviner for your needs.",
        group: "Discovery",
        purpose: "The Diviner Directory is the engine of new client acquisition for every practitioner on the platform. This is the page a visitor arrives on when they want to find a spiritual guide — and it needs to make that search feel easy and trustworthy. Visitors can filter and sort to narrow down from hundreds of practitioners to the few who match their specific needs, then click through to a profile and book.",
        bullets: [
          "Practitioner grid — cards showing each diviner's photo, name, specialties, star rating, and starting price",
          "Specialty filter — narrow by reading type (natal chart, tarot, relationship, mundane, transit, etc.)",
          "Price range slider — filter to see only diviners within a specific budget",
          "Availability filter — show only diviners with open slots in the next 7 days",
          "Language filter — find practitioners who read in a specific language",
          "Sort options — sort by highest rating, most reviews, lowest price, or newest to the platform",
          "Search by name — type a practitioner's name to jump directly to their profile"
        ]
      },
      {
        name: "diviner-public-profile",
        label: "Individual Diviner Profile",
        description: "The public-facing profile page for one practitioner on AstrologyPro. Includes their photo, bio, credentials, services, reviews, and a direct booking button — the primary conversion page for new client acquisition.",
        group: "Discovery",
        purpose: "When a visitor clicks on a diviner from the directory, this is where they land. This page needs to do one thing exceptionally well: turn a curious visitor into a booked client. It presents everything a person needs to decide if this practitioner is right for them — their background, their approach, their services and prices, what past clients say, and a visible, frictionless way to book. Every element of this page is designed to build trust and reduce booking hesitation.",
        bullets: [
          "Profile photo and display name — a professional, welcoming first impression",
          "Specialties badge list — quick visual summary of the diviner's reading types and traditions",
          "Bio section — the practitioner's own words about their background, lineage, and approach",
          "Service listings — each service with name, description, duration, and price with a 'Book' button",
          "Client testimonials — curated reviews showing star ratings, client names, and written feedback",
          "Availability preview — a compact calendar showing the nearest available booking slots",
          "Video intro — if the diviner has uploaded a video introduction, it plays here before the bio"
        ]
      },
      {
        name: "blog-listing",
        label: "Blog Listing",
        description: "The public blog index page — a grid of all published articles on AstrologyPro, organized by category and sorted by most recent. Covers planetary transits, astrology education, seasonal rituals, tarot guides, and community news.",
        group: "Marketing",
        purpose: "The blog serves dual purposes: it builds SEO traffic by providing searchable astrological content, and it demonstrates the school's authority and depth of knowledge to prospective members. A visitor who arrives from a Google search for 'what does Saturn Return mean' and reads a well-written article is far more likely to explore the platform further and eventually join.",
        bullets: [
          "Article grid — all published articles displayed as cards with title, category, author, and cover image",
          "Category navigation — filter articles by category (transits, natal chart basics, tarot, rituals, community news, etc.)",
          "Most recent articles first — new content is always at the top to give returning visitors a reason to come back",
          "Featured article — a highlighted post at the top of the page selected by the editorial team",
          "Author attribution — each card shows the author's name and photo, linking to their author profile page",
          "Estimated reading time — shows how long each article takes to read so visitors can choose based on time available",
          "Newsletter subscribe — a call-to-action strip inviting visitors to subscribe for weekly astrological insights"
        ]
      },
      {
        name: "blog-article-detail",
        label: "Blog Article Detail",
        description: "The full reading experience for a single published article. Rich text content with embedded charts, images, and videos. Related articles and a clear call to action at the end to discover practitioners or join the community.",
        group: "Marketing",
        purpose: "An article detail page is often a first-time visitor's introduction to AstrologyPro. They arrived from a search engine or a social share, and this is their first impression of the platform's quality and voice. The page must deliver value with the article content while also guiding the reader toward the next step — browsing diviners, joining the PM community, or reading another article.",
        bullets: [
          "Full article body — richly formatted content with headings, images, embedded charts, and pull quotes",
          "Author bio block — a short bio of the author with their photo and a link to their other published articles",
          "Category and tags — breadcrumb showing which category the article belongs to with related tag filters",
          "Estimated reading time — shown prominently at the top so readers can commit knowingly",
          "Share buttons — quick social sharing for Twitter/X, Facebook, and a copy-link button",
          "Related articles — 3 to 4 suggested articles on similar topics shown at the bottom to keep readers engaged",
          "End CTA — a contextual call to action at the article's conclusion (e.g. 'Book a reading' or 'Join the community')"
        ]
      },
      {
        name: "login-page",
        label: "Login Page",
        description: "The sign-in page for returning AstrologyPro members and practitioners. Supports email and password login with a clear 'Forgot password' link and options to register if the visitor is new.",
        group: "Onboarding",
        purpose: "Every returning member passes through the login page. It needs to be fast, clear, and friction-free. Diviners, PM members, customers, trainees, and admins all log in through this single page — the platform then routes them to the correct portal based on their role. A clear layout and minimal fields keep the experience simple for all user types.",
        bullets: [
          "Email and password fields — the standard credentials used for all account types on the platform",
          "Sign In button — submits the form and routes the user to their role-appropriate dashboard",
          "Forgot password link — visible without requiring any action first; leads directly to the password reset flow",
          "Remember me option — keeps the user logged in on their personal device for faster future access",
          "Register prompt — a visible link for first-time visitors who do not have an account yet",
          "Error handling — clear messaging for incorrect credentials with guidance on next steps",
          "Role-based routing — after login, the platform automatically sends each user to their correct portal"
        ]
      },
      {
        name: "forgot-password",
        label: "Forgot Password Flow",
        description: "A two-step process for recovering account access — enter your registered email to receive a reset link, then set a new password. Includes clear confirmation messaging and security best-practice guidance.",
        group: "Onboarding",
        purpose: "Password recovery is a critical trust moment — if a member cannot get back into their account easily, they may give up and lose access to their readings, session history, and community connection. This flow needs to be reassuringly simple: one field, one button, clear confirmation that the email was sent, and a secure link that works reliably.",
        bullets: [
          "Email entry field — enter the address associated with your account to receive a reset link",
          "Send Reset Link button — triggers the password reset email with a one-time secure link",
          "Confirmation screen — a clear message confirming the email was sent, with guidance to check spam if not received",
          "Secure reset link — the emailed link expires after 24 hours for security; expired links show a clear re-request option",
          "New password form — the page the reset link leads to, with password and confirm-password fields",
          "Password strength indicator — visual feedback on the strength of the new password being entered",
          "Return to login — a visible link back to the login page for users who remember their password or are in the wrong flow"
        ]
      },
      {
        name: "platform-walkthrough-preview",
        label: "Platform Walkthrough Preview",
        description: "An interactive tour of the AstrologyPro platform available to public visitors without requiring registration. Browse role-specific feature previews, see screenshots of the dashboard, and understand what each portal offers before committing to join.",
        group: "Marketing",
        purpose: "Many prospective members hesitate to sign up because they do not know what they are getting. The Platform Walkthrough Preview removes that barrier — it shows them exactly what the platform looks like and what they will be able to do, organized by the role that applies to them. A visitor interested in becoming a diviner can preview the Diviner Studio; someone curious about the community can explore the PM portal screens. Seeing is believing, and this page turns browsers into registrants.",
        bullets: [
          "Role selector — choose which portal to preview: Client, Diviner, PM Community, Mystery School, or Affiliate",
          "Feature overview for each role — a curated list of what each role gets access to on the platform",
          "Screen previews — annotated screenshots of real platform pages so visitors see the actual product",
          "Key capability bullets — concise list of what you can do in each portal, written for a non-technical audience",
          "Join CTA per role — each role's preview section ends with a specific call to action for that role's registration flow",
          "Mobile-friendly layout — the preview page is fully readable and navigable on phone screens",
          "No sign-up required — all preview content is accessible without creating an account or providing an email"
        ]
      },
      {
        name: "join-pricing-page",
        label: "Join / Pricing Page",
        description: "The membership selection and pricing transparency page where new visitors choose how to join AstrologyPro. Presents each available membership path with pricing, features, and enrollment buttons in one clear comparison view.",
        group: "Onboarding",
        purpose: "Price transparency and role clarity are the two biggest conversion factors for a spiritual platform. Visitors who cannot quickly find the price or understand the difference between membership options leave without joining. This page makes both immediately clear — what each path costs, what it includes, and how to get started in one scroll.",
        bullets: [
          "Membership path cards — Client, Perennial Mandalism (Individual and Family), Mystery School, and Diviner displayed side by side",
          "Pricing displayed prominently — PM Individual at $19.95/mo, Family at $34.95/mo, Mystery School enrollment fee shown clearly",
          "What is included per plan — bullet list of features for each membership type so visitors can compare",
          "Get Started button per plan — each card leads directly to that role's registration and onboarding flow",
          "FAQ section — answers to the most common pricing questions (Can I cancel? Is there a free trial? What is the Mystery School?)",
          "Diviner application path — a separate card explaining that diviners apply and are vetted before receiving dashboard access",
          "PM member discount note — a callout explaining that PM members get a discounted rate on Mystery School enrollment"
        ]
      },
      {
        name: "signup-step-1",
        label: "Sign Up — Create Account",
        description: "First step of the public registration flow. Visitors enter their name, email address, and password to create an account. Includes social sign-in options (Google) and a link to the login page for returning users.",
        group: "Auth",
        purpose: "Converts anonymous visitors into registered users with a minimal-friction entry form that gets them into the platform quickly.",
        bullets: [
          "Name, email, and password fields with password strength indicator",
          "Google OAuth sign-in button as a one-click alternative",
          "Link to login page for users who already have an account"
        ]
      },
      {
        name: "email-verify",
        label: "Email Verification",
        description: "Post-registration page instructing the new user to verify their email address. Shows the email sent-to address, a resend button, and a troubleshooting note about spam folders. Verification unlocks the full account.",
        group: "Auth",
        purpose: "Ensures account email addresses are valid before granting access, reducing fake accounts and improving deliverability of platform communications.",
        bullets: [
          "Confirmation message showing the email address the verification link was sent to",
          "Resend verification email button with a 60-second cooldown to prevent spam",
          "Spam folder note with step-by-step instructions for common email providers"
        ]
      },
      {
        name: "about-page",
        label: "About Us",
        description: "Public about page explaining the platform's mission, founding story, team, and core values. Includes a timeline of key milestones and links to the diviner and community sections for new visitors.",
        group: "Marketing",
        purpose: "Builds trust with prospective users by establishing the platform's credibility, purpose, and the human team behind it.",
        bullets: [
          "Mission statement and founding story in approachable narrative format",
          "Team section with photos, names, and roles of key platform figures",
          "Milestones timeline: key dates in the platform's history with brief descriptions"
        ]
      },
      {
        name: "privacy-policy",
        label: "Privacy Policy",
        description: "Full publicly accessible privacy policy page. Clearly states what data is collected, how it is used, who it is shared with, and how users can exercise their data rights. Includes last-updated date and contact information for privacy inquiries.",
        group: "Legal",
        purpose: "Meets GDPR and CCPA transparency requirements and builds user trust by being explicit about data handling practices.",
        bullets: [
          "Structured sections: Data Collected, Purpose of Use, Third-Party Sharing, Retention, Your Rights",
          "Last-updated date prominently displayed",
          "Privacy contact email and link to the data subject request form"
        ]
      },
      {
        name: "terms-of-service",
        label: "Terms of Service",
        description: "Full publicly accessible terms of service page covering platform usage rules, diviner obligations, client expectations, payment terms, and dispute resolution. Includes the last-updated date and effective date.",
        group: "Legal",
        purpose: "Establishes the legal framework for platform use and protects the business by clearly setting expectations for all user types.",
        bullets: [
          "Structured sections: Eligibility, Account Terms, Services, Payment, Termination, Governing Law",
          "Plain-language summaries at the top of each section for quick scanning",
          "Last-updated and effective dates displayed prominently"
        ]
      },
      {
        name: "testimonials-page",
        label: "Testimonials Page",
        description: "Public testimonials page featuring approved client reviews of the platform and individual diviners. Sorted by most helpful with filter by diviner specialty. Includes aggregate star ratings.",
        group: "Marketing",
        purpose: "Provides social proof to prospective clients at the point of evaluation, increasing conversion by showing authentic experiences from existing clients.",
        bullets: [
          "Aggregate platform rating with total review count displayed at the top",
          "Review cards with client name (anonymised option), rating, date, diviner name, and review text",
          "Filter by specialty: Natal, Tarot, Horary, Vedic, and All"
        ]
      },
      {
        name: "how-it-works",
        label: "How It Works",
        description: "Public explainer page walking prospective clients through the platform process from sign-up to completed session. Uses numbered steps, iconography, and a short FAQ to address common first-time questions.",
        group: "Marketing",
        purpose: "Reduces new visitor uncertainty by clearly explaining what to expect before they commit to signing up.",
        bullets: [
          "Four numbered steps: Create account → Browse diviners → Book a session → Connect",
          "Icon-led feature highlights: secure payments, verified diviners, flexible scheduling",
          "Short FAQ section addressing the top 5 first-time visitor questions"
        ]
      },
      {
        name: "faq",
        label: "Frequently Asked Questions",
        description: "Comprehensive public FAQ page covering account creation, diviner qualifications, session formats, pricing, refund policy, and subscription options. Searchable and organised by category.",
        group: "Marketing",
        purpose: "Reduces support load from prospective clients by addressing common questions before they reach the contact form or abandon the site.",
        bullets: [
          "Search bar with instant filtering across all questions and answers",
          "Category tabs: Getting Started, Sessions, Billing, Subscriptions, Privacy",
          "Expandable accordion items with clear, plain-language answers"
        ]
      },
      {
        name: "waitlist-join",
        label: "Join Waitlist",
        description: "Public waitlist signup page for prospective users when the platform is at capacity or launching a new feature. Visitors enter their name and email to be notified when a spot opens or the feature launches.",
        group: "Marketing",
        purpose: "Captures demand from users who arrive when the platform is not accepting open signups, preserving the lead for future conversion.",
        bullets: [
          "Simple form: name and email with waitlist join button",
          "Social proof note: how many people are already on the waitlist",
          "Confirmation page with expected notification timeline and referral option to move up the list"
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
