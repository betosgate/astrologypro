import type React from "react";

export type TabType = "single" | "two-person";

export interface TabDef {
  slug: string;
  label: string;
  type: TabType;
  extras?: ("area_of_inquiry" | "question" | "future_week" | "future_month")[];
  icon: React.ElementType;
  description: string;
}

export interface CityOption {
  label: string;
  lat: number;
  lng: number;
  timezone: { name: string; offset_string: string; utcOffset: string };
}

export interface BirthInput {
  dob: string;
  tob: string;
  city: CityOption | null;
}

export interface FormState {
  person1: BirthInput;
  person2: BirthInput;
  name1: string;
  name2: string;
  areaOfInquiry: string;
  question: string;
  futureWeek: string;
  futureMonth: string;
}

export interface DecanRow {
  id?: string;
  sign_id?: string;
  sign_name: string;
  planet: string;
  decan: number;
  greek_daemon: string;
  tarot_name: string;
  description?: string;
  decan_img?: string;
  is_active?: boolean;
  planet_sign_short_desc?: string | null;
  planet_sign_long_desc?: string | null;
  daemon_short_desc?: string | null;
  daemon_long_desc?: string | null;
  tarot_short_desc?: string | null;
  tarot_long_desc?: string | null;
}

export type DecanPossibility = {
  planet: string;
  sign_name?: string | null;
  signs?: string | null;
};

export interface DecanAi {
  short_format: string;
  long_format: string;
}

export interface DecanSection {
  planetAi: DecanAi | null;
  daemonAi: DecanAi | null;
  tarotAi: DecanAi | null;
  loading: boolean;
  error?: string;
}
