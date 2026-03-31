export const APP_NAME = "AstrologyPro";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const PRICING = {
  setup: 197,
  monthly: 149,
  overagePerMinute: 0.5,
  platformFeePercent: 10,
} as const;

export const SESSION_DURATIONS = {
  short: 30,
  standard: 60,
} as const;

export const BOOKING_STATUSES = {
  pending: "Pending",
  confirmed: "Confirmed",
  inProgress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  noShow: "No Show",
} as const;

export const SPECIALTIES = [
  "Natal Chart Reading",
  "Synastry & Compatibility",
  "Solar Return",
  "Transit Forecast",
  "Career & Finance",
  "Electional Astrology",
  "Horary Astrology",
  "Medical Astrology",
  "Vedic Astrology",
  "Tarot & Astrology",
] as const;

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const NAV_ITEMS = {
  marketing: [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  dashboard: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Bookings", href: "/dashboard/bookings" },
    { label: "Calendar", href: "/dashboard/calendar" },
    { label: "Clients", href: "/dashboard/clients" },
    { label: "Earnings", href: "/dashboard/earnings" },
    { label: "Settings", href: "/dashboard/settings" },
  ],
} as const;
