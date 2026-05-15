export const EVENT_CATEGORIES = [
  { value: "ritual", label: "Ritual" },
  { value: "sunday_service", label: "Sunday Service" },
  { value: "live_class", label: "Live Class" },
  { value: "meditation", label: "Meditation" },
  { value: "other", label: "Other" },
] as const;

export const EVENT_AUDIENCES = [
  { value: "public", label: "Public" },
  { value: "members", label: "Members" },
  { value: "students", label: "Students" },
  { value: "members_and_guests", label: "Members & Guests" },
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number]["value"];
export type EventAudience = typeof EVENT_AUDIENCES[number]["value"];

export const RECURRENCE_DAYS = [
  { value: "sun", label: "Sunday" },
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
] as const;

export type RecurrenceDay = typeof RECURRENCE_DAYS[number]["value"];
