import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  UserPlus,
  UserCog,
  Briefcase,
  CreditCard,
  Clock,
  Globe,
  CalendarCheck,
  Video,
  Mail,
  Users,
  Star,
  Share2,
  Megaphone,
  Radio,
  Gift,
  Settings,
  Lightbulb,
  Search,
  ShoppingCart,
  PlayCircle,
  MonitorSmartphone,
  MessageSquare,
  BarChart3,
  BookOpen,
  HelpCircle,
  ChevronRight,
  Menu,
  FileText,
  LogIn,
  Eye,
  Phone,
  DollarSign,
  Calendar,
  Percent,
  Heart,
  RotateCcw,
  Brain,
  Compass,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Complete Guide to AstrologyPro",
  description:
    "Everything you need to know to run your divination business on AstrologyPro. Guides for diviners and clients.",
};

/* ---------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------- */

interface Step {
  id: string;
  number: string;
  title: string;
  description: string;
  screenshot: string;
  image?: string;
  icon: React.ElementType;
  proTip?: string;
}

interface TocItem {
  id: string;
  label: string;
  badge?: string;
  children: { id: string; label: string }[];
}

/* ---------------------------------------------------------------------------
 * Table of Contents data
 * --------------------------------------------------------------------------- */

const tocSections: TocItem[] = [
  {
    id: "for-diviners-setup",
    label: "Getting Started",
    badge: "For Diviners",
    children: [
      { id: "step-1-1", label: "Create Your Account" },
      { id: "step-1-2", label: "Complete Your Profile" },
      { id: "step-1-3", label: "Choose Your Services" },
      { id: "step-1-4", label: "Connect Stripe" },
      { id: "step-1-5", label: "Set Your Availability" },
      { id: "step-1-6", label: "Get a Phone Number" },
      { id: "step-1-7", label: "Your Landing Page is Live!" },
    ],
  },
  {
    id: "for-diviners-business",
    label: "Running Your Business",
    badge: "For Diviners",
    children: [
      { id: "step-2-1", label: "Managing Bookings" },
      { id: "step-2-2", label: "Video Sessions" },
      { id: "step-2-3", label: "After the Session" },
      { id: "step-2-4", label: "Client Management (CRM)" },
      { id: "step-2-5", label: "Testimonials" },
      { id: "step-2-6", label: "Affiliate Program" },
      { id: "step-2-7", label: "Social Media Marketing" },
      { id: "step-2-8", label: "Live Streaming" },
      { id: "step-2-9", label: "Gift Certificates" },
      { id: "step-2-10", label: "Settings" },
      { id: "step-2-11", label: "Phone Readings" },
      { id: "step-2-12", label: "Dashboard Analytics" },
      { id: "step-2-13", label: "Calendar View" },
      { id: "step-2-14", label: "Pricing Controls" },
      { id: "step-2-15", label: "Loyalty Discounts" },
      { id: "step-2-16", label: "Issuing Refunds" },
      { id: "step-2-17", label: "Smart Session Prep" },
    ],
  },
  {
    id: "for-clients",
    label: "Getting a Reading",
    badge: "For Clients",
    children: [
      { id: "step-3-1", label: "Finding a Diviner" },
      { id: "step-3-2", label: "Booking a Reading" },
      { id: "step-3-3", label: "Your Session" },
      { id: "step-3-4", label: "After Your Session" },
      { id: "step-3-5", label: "Your Client Portal" },
      { id: "step-3-6", label: "Phone Readings" },
    ],
  },
  {
    id: "tips-faq",
    label: "Tips & FAQ",
    children: [],
  },
];

/* ---------------------------------------------------------------------------
 * Step data — Section 1: Getting Started
 * --------------------------------------------------------------------------- */

const section1Steps: Step[] = [
  {
    id: "step-1-1",
    number: "1.1",
    title: "Create Your Account",
    description:
      "Head over to astrologypro.com/get-started and enter your email, choose a password, and pick a username. Your username is important because it becomes your permanent URL \u2014 your clients will visit astrologypro.com/[username] to find you. Once you complete checkout ($197 setup fee + your first month at $149), you will be taken straight to your new dashboard.",
    screenshot: "The get-started signup form with email, password, and username fields plus pricing summary",
    image: "13-signup-page.png",
    icon: UserPlus,
    proTip:
      "Choose a username that matches your brand name or professional name. It cannot be changed later, so pick wisely!",
  },
  {
    id: "step-1-2",
    number: "1.2",
    title: "Complete Your Profile",
    description:
      "Upload a professional photo \u2014 a clear headshot works best. Write your bio to tell potential clients about your background and approach, or save time by clicking the \"Generate Bio\" button to let AI draft one for you. Add a short tagline (one sentence that captures what you do) and select your specialties from the list.",
    screenshot: "The profile editing screen showing photo upload area, bio textarea with AI generate button, tagline input, and specialty checkboxes",
    image: "23-dashboard-profile.png",
    icon: UserCog,
    proTip:
      "Profiles with a professional photo get significantly more bookings. Natural lighting and a simple background work best.",
  },
  {
    id: "step-1-3",
    number: "1.3",
    title: "Choose Your Services",
    description:
      "AstrologyPro offers 19 consultation types \u2014 11 astrology services and 8 tarot services. Toggle on the ones you want to offer and customize the pricing for each. Mark 3\u20134 services as \"Featured\" so they appear prominently at the top of your landing page. Featured services are the first thing visitors see, so choose your best sellers.",
    screenshot: "The service selection grid showing astrology and tarot service cards with toggle switches, price inputs, and featured star buttons",
    image: "22-dashboard-services.png",
    icon: Briefcase,
    proTip:
      "Less is more at first. Start with 3\u20134 featured services, then expand once you know what your audience wants most.",
  },
  {
    id: "step-1-4",
    number: "1.4",
    title: "Connect Stripe",
    description:
      "Click the \"Connect Stripe\" button to link your payment account. Stripe handles all payment processing securely so you never have to touch sensitive card data. Once connected, client payments go directly to your bank account on a rolling basis. The whole setup takes about 5 minutes.",
    screenshot: "The Stripe Connect onboarding screen with the Connect Stripe button and status indicator",
    image: "38-settings-payments.png",
    icon: CreditCard,
    proTip:
      "Make sure the bank account you connect to Stripe is one you check regularly \u2014 that is where all your session revenue will land.",
  },
  {
    id: "step-1-5",
    number: "1.5",
    title: "Set Your Availability",
    description:
      "Click each time slot on the weekly calendar to mark when you are available for sessions. You can set different hours for different days \u2014 maybe mornings on weekdays and afternoons on weekends. Need a day off? Just block it out. You can update your availability anytime from your dashboard.",
    screenshot: "The weekly availability editor with clickable time slots for each day of the week",
    image: "29-onboarding.png",
    icon: Clock,
    proTip:
      "Block off at least 15 minutes between sessions for prep time and notes. Back-to-back readings lead to burnout.",
  },
  {
    id: "step-1-6",
    number: "1.6",
    title: "Get a Phone Number",
    description:
      "Go to Settings \u2192 Phone tab, click \"Get a Dedicated Phone Number\". Clients can call this number to join video sessions or book standalone phone readings.",
    screenshot: "The settings page showing the Phone tab with the Get a Dedicated Phone Number button",
    
    image: "19-dashboard-overview.png",
    icon: Phone,
    proTip:
      "Share your dedicated phone number on your landing page and social media so clients know they can reach you by phone too.",
  },
  {
    id: "step-1-7",
    number: "1.7",
    title: "Your Landing Page is Live!",
    description:
      "That is it \u2014 your professional astrology practice is online! Visit astrologypro.com/[username] to see your live landing page. It showcases your profile, featured services, testimonials, and booking calendar all in one place. Share this link everywhere: social media bios, email signatures, business cards, and anywhere you connect with potential clients.",
    screenshot: "A fully set up diviner landing page showing the profile header, featured services grid, testimonials section, and booking button",
    image: "14-landing-hero.png",
    icon: Globe,
    proTip:
      "Put your AstrologyPro link in every social media bio you have. It should be the easiest link for anyone to find.",
  },
];

/* ---------------------------------------------------------------------------
 * Step data — Section 2: Running Your Business
 * --------------------------------------------------------------------------- */

const section2Steps: Step[] = [
  {
    id: "step-2-1",
    number: "2.1",
    title: "Managing Bookings",
    description:
      "Your dashboard shows all your upcoming and past bookings in one clear view. Confirmed bookings display the session link you will use to join. Before each session, click the \"Prepare\" button to review the client\u2019s intake questionnaire, birth data, and any notes from previous sessions so you walk in fully ready.",
    screenshot: "The bookings dashboard showing a list of upcoming sessions with client names, service types, dates, and Prepare/Join buttons",
    image: "20-dashboard-bookings.png",
    icon: CalendarCheck,
    proTip:
      "Spend 5 minutes with the Prepare screen before each session. Clients notice when you remember details from their last reading.",
  },
  {
    id: "step-2-2",
    number: "2.2",
    title: "Video Sessions",
    description:
      "When session time arrives, click \"Join Session\" from your dashboard. Both you and your client will accept the recording consent prompt. Start in \"Face\" mode for direct conversation, then switch to \"Screen\" mode when you want to share charts, cards, or other visuals from your back-office tools. A timer tracks the session length, and you will get an alert when overtime begins. Use the sidebar to jot down session notes in real time.",
    screenshot: "The video session room showing the video feed, face/screen mode toggle, session timer, and notes sidebar",
    image: "19-dashboard-overview.png",
    icon: Video,
    proTip:
      "Practice switching between Face and Screen mode before your first real session so the transition feels smooth to clients.",
  },
  {
    id: "step-2-3",
    number: "2.3",
    title: "After the Session",
    description:
      "Sessions end automatically when time is up, or you can click \"End Session\" manually. The recording is saved and sent to your client via email so they can rewatch their reading anytime. If the session ran over the allotted time, overtime charges are calculated automatically. The client also receives an email requesting a testimonial about their experience.",
    screenshot: "The session complete screen showing recording saved confirmation, overtime summary, and testimonial request status",
    
    image: "16-landing-testimonials.png",
    icon: Mail,
    proTip:
      "Mention during the session that a recording will be sent \u2014 clients love knowing they can revisit your insights later.",
  },
  {
    id: "step-2-4",
    number: "2.4",
    title: "Client Management (CRM)",
    description:
      "The built-in CRM gives you a complete view of every client: their birth data, full session history, your private notes, and revenue totals. Search and filter to find any client instantly. This is your command center for building lasting relationships with repeat clients and preparing for upcoming sessions.",
    screenshot: "The client CRM list view showing client cards with birth data, session count, total revenue, and expandable notes",
    image: "21-dashboard-clients.png",
    icon: Users,
    proTip:
      "Add a personal note after every session while it is fresh. Future-you will be grateful when that client books again months later.",
  },
  {
    id: "step-2-5",
    number: "2.5",
    title: "Testimonials",
    description:
      "After each session, clients receive an email inviting them to leave a review. All submitted testimonials appear in your dashboard where you can approve, reject, or mark them as \"Featured.\" Featured testimonials are displayed prominently on your landing page \u2014 strong social proof is one of the best ways to convert new visitors into paying clients.",
    screenshot: "The testimonials management panel showing submitted reviews with approve, reject, and feature toggle buttons",
    image: "25-dashboard-testimonials.png",
    icon: Star,
    proTip:
      "Feature your 3\u20135 best testimonials. A mix of different service types shows visitors the breadth of what you offer.",
  },
  {
    id: "step-2-6",
    number: "2.6",
    title: "Affiliate Program",
    description:
      "Grow your practice through word of mouth by creating affiliates \u2014 people who send clients your way. Set each affiliate\u2019s commission percentage, then give them their unique referral link. When someone books through that link, the referral is tracked automatically. You pay your affiliates directly (we just track everything), and you can mark payments as completed in the dashboard.",
    screenshot: "The affiliate dashboard showing affiliate list with referral links, commission rates, referral counts, and payment status",
    image: "26-dashboard-affiliates.png",
    icon: Share2,
    proTip:
      "Your happiest clients make the best affiliates. After a great session, ask if they would like to earn commissions by referring friends.",
  },
  {
    id: "step-2-7",
    number: "2.7",
    title: "Social Media Marketing",
    description:
      "Every Monday, you will receive branded astrology content ready to share \u2014 images, captions, and hashtags tailored to your practice. Open the link from your email or text message, then tap \"Share Everywhere\" to post to all your connected platforms in about 30 seconds. Prefer to customize? Pick individual platforms and tweak the content. For Instagram and TikTok, download the image and copy the caption to post natively.",
    screenshot: "The social share hub showing a branded content card with Share Everywhere button and individual platform options",
    image: "27-dashboard-marketing.png",
    icon: Megaphone,
    proTip:
      "Consistency beats perfection. Sharing every Monday keeps you visible in your audience\u2019s feed without burning out on content creation.",
  },
  {
    id: "step-2-8",
    number: "2.8",
    title: "Live Streaming",
    description:
      "Connect your YouTube channel by going to Dashboard \u2192 Live and pasting your YouTube Channel ID (find it at youtube.com/account_advanced). Whenever you go live on YouTube, the stream automatically appears embedded on your AstrologyPro landing page. Tell your viewers: \"Visit astrologypro.com/[username] to book a private reading!\" It is one of the best ways to convert viewers into paying clients.",
    screenshot: "The live streaming settings page showing the YouTube Channel ID input field and a preview of the embedded stream on the landing page",
    image: "28-dashboard-live.png",
    icon: Radio,
    proTip:
      "Go live at a consistent time each week. Regularity builds an audience that keeps coming back \u2014 and booking.",
  },
  {
    id: "step-2-9",
    number: "2.9",
    title: "Gift Certificates",
    description:
      "Clients can purchase gift certificates directly from your landing page. They enter the recipient\u2019s name, email, and a personal message, then pay for the session. The recipient receives a beautiful gift certificate email with a unique code they can use to book any of your services. Gift certificates are a great revenue driver, especially around holidays and birthdays.",
    screenshot: "The gift certificate purchase flow showing recipient info form, personal message field, and a preview of the gift certificate email",
    image: "15-landing-services.png",
    icon: Gift,
    proTip:
      "Promote gift certificates before major holidays (Valentine\u2019s Day, Mother\u2019s Day, birthdays). A short social media post is all it takes.",
  },
  {
    id: "step-2-10",
    number: "2.10",
    title: "Settings",
    description:
      "Your settings panel lets you manage every aspect of your practice. Account settings handle your subscription and billing. Payments shows your Stripe connection status. Calendar lets you connect Google Calendar for automatic two-way sync so bookings appear on your personal calendar. Loyalty settings let you create repeat-client discounts to reward your regulars.",
    screenshot: "The settings page showing tabs for Account, Payments, Calendar, and Loyalty with their respective configuration panels",
    
    image: "19-dashboard-overview.png",
    icon: Settings,
    proTip:
      "Connect Google Calendar early \u2014 it prevents double-bookings and keeps your personal and professional schedules in sync.",
  },
  {
    id: "step-2-11",
    number: "2.11",
    title: "Phone Readings",
    description:
      "Enable phone readings in your settings. Clients call your dedicated number for audio-only readings at $25 for 20 minutes + $0.50/min after. The call is recorded and billed automatically.",
    screenshot: "The settings page showing phone reading configuration with pricing and toggle",
    
    image: "19-dashboard-overview.png",
    icon: Phone,
    proTip:
      "Phone readings are great for clients who prefer audio-only or have limited internet. They also expand your reach to clients without webcams.",
  },
  {
    id: "step-2-12",
    number: "2.12",
    title: "Dashboard Analytics",
    description:
      "Track who visits your landing page, where they come from, and your booking conversion rate. Go to Dashboard \u2192 Analytics.",
    screenshot: "The analytics dashboard showing page views, traffic sources, and conversion rate charts",
    image: "34-dashboard-analytics.png",
    icon: BarChart3,
    proTip:
      "Check your analytics weekly to see which marketing channels drive the most bookings. Double down on what works.",
  },
  {
    id: "step-2-13",
    number: "2.13",
    title: "Calendar View",
    description:
      "See your entire week at a glance. Dashboard \u2192 Calendar shows your availability, bookings, and blocked days. Click to block days off or add special hours.",
    screenshot: "The weekly calendar view showing color-coded availability, bookings, and blocked days with click-to-edit functionality",
    image: "35-dashboard-calendar.png",
    icon: Calendar,
    proTip:
      "Block off vacation days well in advance so clients can plan around your schedule. Last-minute cancellations hurt your reputation.",
  },
  {
    id: "step-2-14",
    number: "2.14",
    title: "Pricing Controls",
    description:
      "Adjust your pricing from Settings \u2192 Services. You can increase prices up to 200% of the base rate but cannot go below the base price. This protects the value of the platform.",
    screenshot: "The services settings page showing price sliders with min/max range indicators",
    image: "22-dashboard-services.png",
    icon: DollarSign,
    proTip:
      "Start at the base price and increase gradually as you build up testimonials and demand. Clients expect to pay more for highly-rated diviners.",
  },
  {
    id: "step-2-15",
    number: "2.15",
    title: "Loyalty Discounts",
    description:
      "Reward repeat clients! Go to Settings \u2192 Loyalty tab. Set rules like \"After 3 sessions, clients get 10% off.\" Discounts apply automatically at checkout.",
    screenshot: "The loyalty settings panel showing discount rules with session threshold and percentage inputs",
    
    image: "19-dashboard-overview.png",
    icon: Heart,
    proTip:
      "A small loyalty discount (5\u201310%) pays for itself by encouraging clients to rebook instead of shopping around.",
  },
  {
    id: "step-2-16",
    number: "2.16",
    title: "Issuing Refunds",
    description:
      "If you need to refund a client, go to Dashboard \u2192 Bookings, open the booking detail, and click \"Issue Refund.\" The refund is processed through Stripe and the client is notified by email.",
    screenshot: "The booking detail view showing the Issue Refund button and refund confirmation dialog",
    
    image: "20-dashboard-bookings.png",
    icon: RotateCcw,
    proTip:
      "Handle refund requests quickly and graciously. A fast refund turns a disappointed client into one who may return later.",
  },
  {
    id: "step-2-17",
    number: "2.17",
    title: "Smart Session Prep",
    description:
      "Before each session, click \"Prepare\" on your upcoming booking. You will see the client\u2019s birth data, their questions, previous session notes, and smart alerts like upcoming solar returns or Mercury retrograde.",
    screenshot: "The session preparation screen showing client birth data, questions, past notes, and astrological alerts panel",
    
    image: "21-dashboard-clients.png",
    icon: Brain,
    proTip:
      "The smart alerts highlight transits and events that are personally relevant to your client. Use them to provide timely, insightful readings.",
  },
];

/* ---------------------------------------------------------------------------
 * Step data — Section 3: For Clients
 * --------------------------------------------------------------------------- */

const section3Steps: Step[] = [
  {
    id: "step-3-1",
    number: "3.1",
    title: "Finding a Diviner",
    description:
      "Visit astrologypro.com/discover to browse all available diviners. Search by name, filter by specialty (astrology or tarot), and sort by rating or price. You can also visit astrologypro.com/[diviner-username] directly if a diviner has shared their link on social media, their website, or with you personally. Browse their services, read testimonials from past clients, and check their availability to find a time that works.",
    screenshot: "The discover page showing diviner cards with search bar, specialty filters, and sort options",
    image: "31-discover-page.png",
    icon: Compass,
    proTip:
      "Read the testimonials! They will give you a great sense of the diviner\u2019s style and what to expect from your session.",
  },
  {
    id: "step-3-2",
    number: "3.2",
    title: "Booking a Reading",
    description:
      "Choose the service you want (astrology reading, tarot session, etc.), pick a date and time from the diviner\u2019s available slots, then fill out the intake questionnaire. For astrology readings, you will enter your birth date, birth time, and birth location. Complete the payment securely via Stripe, and you will receive a confirmation email with your session link.",
    screenshot: "The client booking flow: service selection cards, date/time picker, birth data questionnaire, and Stripe payment form",
    image: "18-booking-start.png",
    icon: ShoppingCart,
    proTip:
      "If you do not know your exact birth time, check your birth certificate or ask a family member \u2014 it makes a big difference in the accuracy of your reading.",
  },
  {
    id: "step-3-3",
    number: "3.3",
    title: "Your Session",
    description:
      "At your appointment time, click the session link from your confirmation email. You will be asked to accept the recording consent (the session is recorded so you can rewatch later). You will see your diviner on video in real time. When they share their screen, you will see the charts, cards, or other tools they use during your reading. You can also use the text chat if you need to share information during the session.",
    screenshot: "The client\u2019s view of the video session room showing the diviner\u2019s video feed, shared screen with a natal chart, and chat panel",
    image: "19-dashboard-overview.png",
    icon: PlayCircle,
    proTip:
      "Find a quiet, private space for your session. Good lighting and a stable internet connection will make the experience much better.",
  },
  {
    id: "step-3-4",
    number: "3.4",
    title: "After Your Session",
    description:
      "Shortly after your session ends, you will receive an email with a link to your full recording. Watch it anytime to revisit the insights from your reading. You can also share the recording on social media if you would like. You will receive a separate email asking you to leave a testimonial \u2014 your review helps your diviner grow their practice and helps other clients find great readers.",
    screenshot: "The post-session email showing the recording playback link, social share buttons, and testimonial request",
    image: "16-landing-testimonials.png",
    icon: FileText,
    proTip:
      "Watch the recording again a few weeks later. You will often catch insights that make more sense once time has passed.",
  },
  {
    id: "step-3-5",
    number: "3.5",
    title: "Your Client Portal",
    description:
      "Log in at astrologypro.com/login and select the Client tab. Enter your email and we will send you a magic link \u2014 no password needed! Your portal shows all your upcoming bookings, past sessions with recordings, and your profile. Update your birth data and personal details anytime. Everything is in one place so you never lose track of your readings.",
    screenshot: "The client portal dashboard showing upcoming bookings, past session list with recording links, and profile section",
    image: "30-portal.png",
    icon: LogIn,
    proTip:
      "Bookmark your portal link for easy access. You can always find your recordings and upcoming sessions there.",
  },
  {
    id: "step-3-6",
    number: "3.6",
    title: "Phone Readings",
    description:
      "Some diviners offer phone readings. If your diviner has a phone number listed, you can call it to join your scheduled video session by audio, or book a standalone phone reading. Your card on file will be charged after the call.",
    screenshot: "A diviner\u2019s landing page showing the phone number and phone reading booking option",
    image: "19-dashboard-overview.png",
    icon: Phone,
    proTip:
      "Phone readings are perfect when you are on the go or prefer a more intimate audio-only experience.",
  },
];

/* ---------------------------------------------------------------------------
 * FAQ data
 * --------------------------------------------------------------------------- */

const faqItems = [
  {
    question: "How do I change my username?",
    answer:
      "Your username is permanent and cannot be changed after account creation. If you absolutely need a new one, contact our support team to discuss options.",
  },
  {
    question: "What if I need to cancel a session?",
    answer:
      "Cancel from your dashboard at least 24 hours before the scheduled time for a full refund. Cancellations within 24 hours are handled on a case-by-case basis.",
  },
  {
    question: "How do overtime charges work?",
    answer:
      "After your allotted session time expires, additional minutes are billed at $0.50 per minute. You and your client both see a timer and overtime alerts during the session.",
  },
  {
    question: "Can I offer my own pricing?",
    answer:
      "Yes! Every service has a customizable price field in your dashboard. Set your rates to whatever works for your experience level and market.",
  },
  {
    question: "How do event reminders work?",
    answer:
      "We track your clients\u2019 birth data and automatically send them email reminders before major astrological events like solar returns, Saturn returns, and significant transits. These reminders include a link to book a session with you.",
  },
  {
    question: "Do I need any special software for video sessions?",
    answer:
      "No! Everything runs in your web browser. No downloads, no installations. Just click the session link and you are in.",
  },
  {
    question: "How do I get paid?",
    answer:
      "Payments go through Stripe directly to your connected bank account. Stripe typically deposits funds within 2\u20137 business days depending on your country.",
  },
  {
    question: "Can clients book without creating an account?",
    answer:
      "Clients do not need to create an account to book. They simply fill out the booking form and pay. They receive a magic link via email to access their portal, recordings, and future bookings.",
  },
  {
    question: "How do I reset my password?",
    answer:
      "Click \"Forgot password?\" on the login page. Enter your email and we will send a reset link.",
  },
  {
    question: "How do phone readings work?",
    answer:
      "Your diviner will give you their dedicated phone number. Call at your scheduled time. The first 20 minutes cost $25, then $0.50 per additional minute. The call is recorded.",
  },
  {
    question: "How do refunds work?",
    answer:
      "Your diviner can issue refunds from their dashboard. Refunds are processed through Stripe and typically appear in 5\u201310 business days.",
  },
  {
    question: "What are loyalty discounts?",
    answer:
      "Some diviners offer discounts for repeat clients. These apply automatically when you book.",
  },
];

/* ---------------------------------------------------------------------------
 * Components
 * --------------------------------------------------------------------------- */

function ScreenshotPlaceholder({ label, image }: { label: string; image?: string }) {
  if (image) {
    return (
      <div className="overflow-hidden rounded-lg border border-white/10 shadow-lg">
        <img
          src={`/screenshots/${image}`}
          alt={label}
          className="w-full"
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 px-6 py-10">
      <div className="flex items-center gap-2 text-center">
        <Eye className="size-4 shrink-0 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground/60 italic">
          Screenshot: {label}
        </p>
      </div>
    </div>
  );
}

function ProTipCallout({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
      <p className="text-sm text-primary/90 leading-relaxed">
        <span className="font-semibold">Pro Tip:</span> {text}
      </p>
    </div>
  );
}

function StepCard({ step }: { step: Step }) {
  const Icon = step.icon;
  return (
    <Card id={step.id} className="scroll-mt-24 overflow-hidden">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm">
          {step.number}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="size-5 text-primary" />
            <h3 className="text-lg font-semibold leading-tight">{step.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScreenshotPlaceholder label={step.screenshot} image={step.image} />
        {step.proTip && <ProTipCallout text={step.proTip} />}
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  id,
  number,
  title,
  subtitle,
  badge,
}: {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  badge: string;
}) {
  return (
    <div id={id} className="scroll-mt-24 space-y-2">
      <Badge variant="secondary" className="text-xs font-medium">
        {badge}
      </Badge>
      <h2 className="text-3xl font-bold tracking-tight">
        <span className="text-primary">{number}</span> {title}
      </h2>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function TableOfContentsSidebar() {
  return (
    <nav className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Table of Contents
      </h2>
      {tocSections.map((section) => (
        <div key={section.id} className="space-y-1">
          <Link
            href={`#${section.id}`}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            {section.badge && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {section.badge}
              </Badge>
            )}
            {section.label}
          </Link>
          {section.children.length > 0 && (
            <ul className="ml-2 space-y-0.5 border-l border-muted pl-3">
              {section.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`#${child.id}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors py-0.5"
                  >
                    <ChevronRight className="size-3 shrink-0" />
                    {child.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}

function MobileTableOfContents() {
  return (
    <details className="group lg:hidden">
      <summary className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium">
        <Menu className="size-4" />
        Table of Contents
        <ChevronRight className="ml-auto size-4 transition-transform group-open:rotate-90" />
      </summary>
      <div className="mt-2 rounded-lg border bg-card p-4">
        <nav className="space-y-3">
          {tocSections.map((section) => (
            <div key={section.id} className="space-y-1">
              <Link
                href={`#${section.id}`}
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
              >
                {section.badge && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {section.badge}
                  </Badge>
                )}
                {section.label}
              </Link>
              {section.children.length > 0 && (
                <ul className="ml-2 space-y-0.5 border-l border-muted pl-3">
                  {section.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`#${child.id}`}
                        className="text-xs text-muted-foreground hover:text-primary py-0.5 block"
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </div>
    </details>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-sm font-semibold flex items-start gap-2">
        <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />
        {question}
      </h4>
      <p className="ml-6 text-sm text-muted-foreground leading-relaxed">
        {answer}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Page
 * --------------------------------------------------------------------------- */

export default function InstructionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* ----------------------------------------------------------------- */}
        {/* Hero                                                              */}
        {/* ----------------------------------------------------------------- */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background py-20 sm:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              <BookOpen className="mr-1 size-3" />
              Complete Guide
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Complete Guide to{" "}
              <span className="text-primary">AstrologyPro</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Everything you need to know to run your divination business
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Whether you are a diviner setting up your practice or a client
              booking your first reading, this guide has you covered.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="#for-diviners-setup"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                I am a Diviner
              </Link>
              <Link
                href="#for-clients"
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                I am a Client
              </Link>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Content Area with Sidebar                                         */}
        {/* ----------------------------------------------------------------- */}
        <div className="mx-auto max-w-7xl px-4 py-12">
          {/* Mobile TOC */}
          <div className="mb-8">
            <MobileTableOfContents />
          </div>

          <div className="flex gap-12">
            {/* Sticky Sidebar — Desktop */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <TableOfContentsSidebar />
              </div>
            </aside>

            {/* Main Content */}
            <div className="min-w-0 flex-1 max-w-4xl space-y-20">
              {/* ------------------------------------------------------------- */}
              {/* SECTION 1: For Diviners — Getting Started                     */}
              {/* ------------------------------------------------------------- */}
              <section>
                <SectionHeader
                  id="for-diviners-setup"
                  number="Section 1"
                  title="Getting Started"
                  subtitle="Set up your AstrologyPro practice in 7 simple steps. Most diviners are fully up and running within 30 minutes."
                  badge="For Diviners"
                />
                <Separator className="my-6" />
                <div className="space-y-6">
                  {section1Steps.map((step) => (
                    <StepCard key={step.id} step={step} />
                  ))}
                </div>
              </section>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 2: For Diviners — Running Your Business               */}
              {/* ------------------------------------------------------------- */}
              <section>
                <SectionHeader
                  id="for-diviners-business"
                  number="Section 2"
                  title="Running Your Business"
                  subtitle="Manage bookings, conduct sessions, grow your client base, and market your practice \u2014 all from one dashboard."
                  badge="For Diviners"
                />
                <Separator className="my-6" />
                <div className="space-y-6">
                  {section2Steps.map((step) => (
                    <StepCard key={step.id} step={step} />
                  ))}
                </div>
              </section>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 3: For Clients                                        */}
              {/* ------------------------------------------------------------- */}
              <section>
                <SectionHeader
                  id="for-clients"
                  number="Section 3"
                  title="Getting a Reading"
                  subtitle="Here is everything you need to know as a client \u2014 from finding a diviner to watching your recording afterward."
                  badge="For Clients"
                />
                <Separator className="my-6" />
                <div className="space-y-6">
                  {section3Steps.map((step) => (
                    <StepCard key={step.id} step={step} />
                  ))}
                </div>
              </section>

              {/* ------------------------------------------------------------- */}
              {/* Tips & FAQ                                                    */}
              {/* ------------------------------------------------------------- */}
              <section id="tips-faq" className="scroll-mt-24">
                <SectionHeader
                  id="tips-faq-header"
                  number=""
                  title="Tips & Frequently Asked Questions"
                  subtitle="Quick answers to the most common questions from diviners and clients."
                  badge="Everyone"
                />
                <Separator className="my-6" />

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <HelpCircle className="size-5 text-primary" />
                      <h3 className="text-lg font-semibold">Common Questions</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      {faqItems.map((item, i) => (
                        <div key={i}>
                          <FAQItem
                            question={item.question}
                            answer={item.answer}
                          />
                          {i < faqItems.length - 1 && (
                            <Separator className="mt-5" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* ------------------------------------------------------------- */}
              {/* CTA                                                           */}
              {/* ------------------------------------------------------------- */}
              <section className="text-center rounded-2xl border bg-gradient-to-b from-primary/5 to-background p-8 sm:p-12">
                <h2 className="text-2xl font-bold sm:text-3xl">
                  Ready to Get Started?
                </h2>
                <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                  Create your account and launch your professional astrology
                  practice in minutes.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/get-started"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Get Started Now
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    View Pricing
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
