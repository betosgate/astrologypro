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
        label: "Nativity Birth Chart: Setup", 
        description: "Enter your birth details to generate your personal astrological chart.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "A Nativity Birth Chart is a snapshot of the sky exactly when and where you were born. It reveals your personality, life path, and natural strengths. Fill in the three required fields — date, time, and place of birth — and the Generate button will activate. The more accurate your birth details, the more personal and insightful your reading will be.",
        bullets: [
          "📅 Date of Birth — This tells the system which planets were in which signs on the day you arrived in the world.",
          "🕐 Time of Birth — Even a small difference in birth time changes your rising sign and house placements. Try to be as exact as possible.",
          "📍 Place of Birth — Your birthplace sets the geographic coordinates that determine your house system and Ascendant sign.",
          "💬 Area of Inquiry (optional) — You can type a specific life topic like Career, Love, or Spiritual Growth to focus the AI reading on what matters most to you.",
          "✅ The Generate Reading button becomes active only after Date, Time, and Place of Birth are all filled in."
        ]
      },
     
      { 
        name: "horoscope_nativity_result_1", 
        label: "Nativity: Your Birth Chart Wheel", 
        description: "See your personal astrological chart come to life.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "This is your personal birth chart — a circular map of the sky at the exact moment you were born. The wheel is divided into 12 sections (houses) and shows where every planet was positioned. Two chart versions are displayed side by side so you can cross-verify the results from two leading astrology engines for maximum accuracy.",
        bullets: [
          "🔵 The inner ring shows your natal planets — where each planet was the moment you were born.",
          "🌐 Two chart wheels are shown side by side from different astrological sources for comparison.",
          "🔗 The lines inside the wheel show how planets are connected or in tension — these are called aspects.",
          "🏠 The 12 segments around the wheel represent the 12 houses — each governs a different area of your life."
        ]
      },
      { 
        name: "horoscope_nativity_processing_v2", 
        label: "Nativity: Generating Your Reading", 
        description: "Your chart is being calculated — this takes just a moment.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "After you click Generate Reading, the system gets to work! It calculates the exact position of every planet at your birth, builds your chart wheel, and then passes all the data to our AI engine which writes your personal interpretation. This usually takes a few seconds — sit tight while the universe does its work.",
        bullets: [
          "⚙️ The platform is calculating your planetary positions based on your exact birth data.",
          "🤖 The AI engine is being loaded to write your personal interpretation in natural language.",
          "🔄 Two separate astrology engines run simultaneously for double-verified accuracy.",
          "⏳ This process takes a few seconds — your full reading will appear automatically when ready."
        ]
      },
      { 
        name: "horoscope_nativity_result_planets_v1", 
        label: "Nativity: Planet Positions", 
        description: "See exactly where every planet was the moment you were born.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "This table shows the exact location of every planet in your natal chart — like a precise record of the sky at your birth. For each planet, you can see which zodiac sign it was in, which life area (house) it occupied, and whether it was moving forward or in retrograde. This data is the foundation that all your chart interpretations are built upon.",
        bullets: [
          "🪐 Every planet is listed along with the zodiac sign it was in at your exact birth moment.",
          "🏠 The House column shows which of the 12 life areas each planet was influencing.",
          "↩️ Retrograde (Rx) means a planet appeared to move backward — planets in retrograde often signal internalized or reflective energy.",
          "📐 The degree values show the precise position — even a fraction of a degree can change the reading."
        ]
      },
      { 
        name: "horoscope_nativity_result_interpret_v1", 
        label: "Nativity: Your Sun, Moon & Mercury Readings", 
        description: "Plain-language meanings of your most important planets.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "This section shows AI-written personal readings for your three most influential planets. Your Sun reveals who you are at your core, your Moon reflects your inner emotional world, and Mercury shows how your mind works and how you communicate. Each reading is written in clear, personal language that speaks directly to you.",
        bullets: [
          "☀️ Sun Reading — Your core identity, purpose, and the role you are here to play in life.",
          "🌙 Moon Reading — Your emotional nature, what makes you feel safe, and how you process feelings.",
          "☿ Mercury Reading — How your mind works, your communication style, and how you learn and think.",
          "📖 Click 'Show More' on any planet to get a deeper, more personal reading."
        ]
      },
      { 
        name: "horoscope_nativity_interpret_deep_v1", 
        label: "Nativity: Deep Reading (Sun)", 
        description: "A detailed personal reading for your Sun placement.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "When you click 'Show More' on the Sun block, this detailed panel opens up. It gives you a story-like interpretation of exactly how your Sun sign and house placement shows up in your daily life, career, and sense of self. Everything is written in plain language — no astrology experience needed to understand it.",
        bullets: [
          "🏠 Which house your Sun is in, and what that house means for your daily life.",
          "♎ Which zodiac sign your Sun is in, and the personality traits that come with it.",
          "⚡ Whether your Sun energy is moving fast or slow — and what that means for your pace in life.",
          "💼 Specific advice for your career and work style based on your Sun placement."
        ]
      },
      { 
        name: "horoscope_nativity_interpret_visual_v1", 
        label: "Nativity: Picture Guide (Sun in Libra)", 
        description: "A visual map of your key personality traits.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "This visual guide shows how your Sun sign and zodiac combination come together in one easy-to-read diagram. On the left side are the qualities of your planet, on the right are the qualities of your sign, and in the middle are the traits that emerge when they blend together. It's a quick, beautiful way to understand your core astrological nature.",
        bullets: [
          "☀️ Left circle: Traits that come from the Sun itself — like confidence, purpose, and leadership.",
          "♎ Right circle: Traits from your zodiac sign — like diplomacy, fairness, and charm (for Libra).",
          "✨ Middle overlap: The combined personality that emerges — like Justice, Equality, and Partnership.",
          "🎨 This diagram is great for sharing with clients or saving as a personal reference."
        ]
      },
      { 
        name: "horoscope_nativity_result_interpret_v2", 
        label: "Nativity: Your Venus, Mars & Personal Drive", 
        description: "How you love, what motivates you, and your personal style.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "This section reveals your personal planets — the ones that shape how you relate to others, what drives your ambition, and how you express yourself in relationships and work. Venus shows how you attract love and beauty, Mars reveals your inner fire and drive, and a small triangle icon next to a planet means there is an extra layer of esoteric wisdom available (the Decan reading).",
        bullets: [
          "💛 Venus Reading — How you attract love, what you find beautiful, and your relationship style.",
          "🔥 Mars Reading — Your energy levels, what motivates you, and how you go after what you want.",
          "🔺 Triangle icon — Click this to reveal an extra layer of ancient wisdom from the Decan system.",
          "🎨 Each planet block has its own color to make it easy to find and read quickly."
        ]
      },
      { 
        name: "horoscope_nativity_decan_detail_v1", 
        label: "Nativity: Decan Wisdom (Mercury)", 
        description: "Esoteric decan layers and archetypes.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "The 'Decan Wisdom' modal is triggered by clicking the specialized triangle icons. It adds a deep esoteric layer to the reading, incorporating historical, mythological, and tarot-based interpretations for each planet's position.",
        bullets: [
          "Tarot Minor Arcana mapping (e.g., Ten of Disks for Mercury in Virgo)",
          "Mundane Force analysis (Asset and Wealth metrics)",
          "Greek Daemon archetypes (e.g., Ploutos, the God of Wealth)",
          "Decan-level governing planetary shifts (Venus influence on the 3rd Decan)"
        ]
      },
      { 
        name: "horoscope_nativity_interpret_outer_v1", 
        label: "Nativity: AI Narratives (Outer & Social)", 
        description: "Synthesis of destiny and professional drive.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "The final layer of the narrative engine analyzes the outer and social planets (Jupiter, Saturn, Uranus), focusing on how these greater forces shape the user's career, responsibility, and innovation.",
        bullets: [
          "Jupiter: Expansion of creative horizons and professional potential",
          "Saturn: Assessment of professional responsibility and discipline",
          "Uranus: Identification of innovative and unconventional career paths",
          "Distinct color-coded blocks for rapid thematic recognition"
        ]
      },
      { 
        name: "horoscope_nativity_interpret_outer_v3", 
        label: "Nativity: AI Narratives (Transpersonal & Karmic)", 
        description: "Synthesis of subconscious and karmic evolution.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "This layer focuses on the transpersonal planets (Neptune, Pluto) and the North Node, providing deep insights into spiritual ideals, transformative life-cycles, and the primary karmic growth path.",
        bullets: [
          "Neptune: Identification of spiritual fulfillment and idealistic career drives",
          "Pluto: Deep analysis of transformative relationship and partnership cycles",
          "North Node: Roadmap for the karmic journey of growth and long-term mastery",
          "Rich indigo, red, and gold themes for deep esoteric differentiation"
        ]
      },
      { 
        name: "horoscope_nativity_result_houses_v1", 
        label: "Nativity: House Information", 
        description: "Granular house system breakdown.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "The 'House Information' table provides a technical deep-dive into the mundane architecture of the chart, mapping every house cusp, degree, and planetary occupant for professional-level auditing.",
        bullets: [
          "Precise signs-to-house custody mapping (H1-H12)",
          "Exact degree metrics for house cusps",
          "Comprehensive planetary occupancy tracking",
          "Essential technical reference for advanced house-lord synthesis"
        ]
      },
      { 
        name: "horoscope_nativity_house_interpret_v2", 
        label: "Nativity: House Interpretations", 
        description: "Synthesis of life areas and cusps.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "The House Interpretation module synthesizes the technical cusp data into actionable personality and life-path guidance, providing a narrative for each of the 12 mundane sectors.",
        bullets: [
          "Detailed cusp-sign analysis (e.g., Aries on House 1)",
          "Personality and behavioral synthesis for specific life sectors",
          "Pioneering and pioneering spirit highlights for House 1",
          "Deep-dive toggles ('Show More') for comprehensive house readings"
        ]
      },
      { 
        name: "horoscope_nativity_house_visual_v3", 
        label: "Nativity: House Visual Synthesis (Aries in H1)", 
        description: "Esoteric picture representation of house cusps.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "The Visual Synthesis view for houses provides a 'Picture Representation' that maps the qualities of the Zodiac Sign and the House into a unified Venn-diagram, making the influence of a specific cusp instantly understandable.",
        bullets: [
          "Zodiacal Essence mapping (Aries: Boldness, Courage, Leadership)",
          "Mundane House influence (1st House: Persona, Outlook, Beginnings)",
          "Central Synthesis (Self-assertion, Motivation, Vitality, Identity)",
          "Educational graphic for high-impact personality auditing"
        ]
      },
      { 
        name: "horoscope_nativity_interpret_dharma_karma_v1", 
        label: "Nativity: Dharma & Karma", 
        description: "Synthesis of soul purpose and karmic lessons.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "The final interpretative layer of the Nativity engine synthesizes complex aspect patterns and house placements into a profound analysis of the user's spiritual path (Dharma) and their core evolutionary lessons (Karma).",
        bullets: [
          "Dharma: Identification of creative fulfillment and soul purpose",
          "Karma: Analysis of responsibility, discipline, and karmic challenges",
          "Aspect Synthesis: How squares, trines, and oppositions shape the life-path",
          "Actionable spiritual advice for introspection and healing"
        ]
      },
      { 
        name: "horoscope_nativity_result_aspects_v1", 
        label: "Nativity: Aspect Dynamics", 
        description: "Technical table of planetary interactions.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "The Aspects table provides a precise technical audit of the relationships between celestial bodies, using orb-intensity gauges to show which influences are most dominant in the user's life.",
        bullets: [
          "Orb-intensity visual gauges for impact assessment",
          "Detailed classification of aspect types (Opposition, Trine, Square, etc.)",
          "Minute-precise degree differential (Diff) tracking",
          "Aspected vs. Aspecting degree metrics for professional verification"
        ]
      },
      { 
        name: "horoscope_nativity_aspect_interpret_v1", 
        label: "Nativity: Aspect Interpretations", 
        description: "Synthesis of planetary relationships.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "The Aspect Interpretation module translates technical degree-math into actionable psychological guidance, explaining how the dynamic tension and harmony between planets shape the user's personal and professional life.",
        bullets: [
          "Detailed tension analysis (e.g., Sun opposite Moon balance)",
          "Cognitive and communication profiling (e.g., Sun conjunct Mercury)",
          "Professional stability and discipline narratives (e.g., Sun trine Saturn)",
          "Expansion toggles for deep-dive aspect narratives"
        ]
      },
      { 
        name: "horoscope_nativity_aspect_deep_v1", 
        label: "Nativity: Deep Aspect Analysis (Sun/Moon)", 
        description: "In-depth psychospiritual aspect reading.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "Expanding an aspect interpretation reveals a comprehensive modal with a profound narrative that integrates conscious goals with subconscious needs, providing a holistic roadmap for professional success.",
        bullets: [
          "Full-text synthesis of complex planetary tensions",
          "Integration strategies for inner emotional well-being and outer career success",
          "Holistic approach to balancing conscious ambitions and subconscious drives",
          "Premium modal UI designed for deep client introspection sessions"
        ]
      },
      { 
        name: "horoscope_nativity_interpret_angles_v1", 
        label: "Nativity: Angles & Points", 
        description: "Synthesis of Ascendant, Midheaven, and Vertex.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "The final data view in the Nativity toolkit analyzes the chart's primary angles, defining the user's public persona, their highest professional legacy, and their fated points of interaction.",
        bullets: [
          "Ascendant: Analysis of outer personality and direct self-expression",
          "Midheaven: Synthesis of professional ambition and long-term legacy",
          "Vertex: Identification of karmic opportunities through partnership",
          "Lilith & Other Points: Deep-dive into subconscious primal nature"
        ]
      },
      { 
        name: "horoscope_nativity_ascendant_pictorial_v1", 
        label: "Nativity: Ascendant Deep Analysis", 
        description: "Point-by-point pictorial breakdown.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "The 'Ascendant (Pictorial Analysis)' provides a structured deep-dive into the Luminary influences, offering a five-point synthesis of how the Sun and Moon shape the user's professional recognition and emotional security.",
        bullets: [
          "Five-point structured analysis for major celestial bodies",
          "Sun-segment: Recognition and leadership in the 10th House",
          "Moon-segment: Emotional stability and routine in the 6th House",
          "Technical alignment of degree metrics with psychological profiles"
        ]
      },
      { 
        name: "horoscope_nativity_lilith_pictorial_v1", 
        label: "Nativity: Lilith Deep Analysis", 
        description: "Esoteric subconscious profiling.", 
        group: "Horoscope Toolkit",
        subModule: "Nativity Birth Chart",
        purpose: "The 'Lilith (Pictorial Analysis)' provides a profound five-point synthesis of the user's secondary primal nature, focusing on how they challenge traditional norms and seek spiritual truth beyond conventional wisdom.",
        bullets: [
          "Five-point analysis of primal and rebellious nature",
          "Spiritual truth-seeking and philosophical exploration in the 9th House",
          "Direct motion analysis for outward-facing belief system challenges",
          "Guidance for confronting and embracing darker, more innovative archetypes"
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
      { 
        name: "trainee-hub", 
        label: "Trainee Dashboard", 
        description: "Personal development center.", 
        group: "Training",
        purpose: "The home base for apprentices to manage their skills-based training and mentor interactions.",
        bullets: [
          "Personal development progress visualization",
          "Pending assignment and lesson notifications",
          "Real-time mentor feedback and rating alerts",
          "Daily practice requirement tracking"
        ]
      },
      { 
        name: "curriculum", 
        label: "Learning Path", 
        description: "Chronological map of lessons.", 
        group: "Training",
        purpose: "A structured, chronological roadmap of the trainee's journey from apprentice to practitioner.",
        bullets: [
          "Linear progression map of required modules",
          "Locked/Unlocked lesson state visualization",
          "Milestone-based certification tracking",
          "Prerequisite knowledge check status"
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
