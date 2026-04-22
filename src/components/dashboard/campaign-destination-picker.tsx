"use client";

import { useEffect, useState } from "react";
import { Loader2, User, BookOpen, AlertTriangle, CheckCircle } from "lucide-react";

interface DestinationProfile {
  id: string;
  type: "PROFILE";
  label: string;
  username: string;
  url: string;
  display_name: string;
  avatar_url: string | null;
}

interface DestinationService {
  id: string;
  type: "SERVICE";
  diviner_service_id: string;
  template_name: string;
  template_slug: string;
  category: string;
  url: string;
  price: number;
  duration_minutes: number;
  is_published: boolean;
}

interface DestinationOptions {
  profile: DestinationProfile;
  services: DestinationService[];
}

export interface DestinationValue {
  destination_type: "PROFILE" | "SERVICE" | null;
  destination_service_template_id: string | null;
}

interface CampaignDestinationPickerProps {
  value: DestinationValue;
  onChange: (destination: { destination_type: "PROFILE" | "SERVICE"; destination_service_template_id: string | null }) => void;
  disabled?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  astrology: "Astrology",
  tarot: "Tarot",
  numerology: "Numerology",
  psychic: "Psychic",
  mediumship: "Mediumship",
  coaching: "Coaching",
  other: "Other",
};

export function CampaignDestinationPicker({
  value,
  onChange,
  disabled = false,
}: CampaignDestinationPickerProps) {
  const [options, setOptions] = useState<DestinationOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/campaigns/destinations")
      .then((r) => r.json())
      .then((data) => {
        setOptions(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load destinations");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading destinations…
      </div>
    );
  }

  if (error || !options) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-destructive">
        <AlertTriangle className="size-4" />
        {error ?? "Failed to load destinations"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Where should this campaign send visitors?</p>

      {/* Profile option */}
      <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
        value.destination_type === "PROFILE"
          ? "border-primary bg-primary/5"
          : "border-input hover:border-primary/50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
        <input
          type="radio"
          name="destination_type"
          value="PROFILE"
          checked={value.destination_type === "PROFILE"}
          disabled={disabled}
          onChange={() => onChange({ destination_type: "PROFILE", destination_service_template_id: null })}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <User className="size-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">My Profile Page</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{options.profile.url}</p>
        </div>
      </label>

      {/* Service option */}
      <div>
        <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
          value.destination_type === "SERVICE"
            ? "border-primary bg-primary/5"
            : "border-input hover:border-primary/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
          <input
            type="radio"
            name="destination_type"
            value="SERVICE"
            checked={value.destination_type === "SERVICE"}
            disabled={disabled}
            onChange={() => onChange({ destination_type: "SERVICE", destination_service_template_id: null })}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">One of My Services</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drive traffic to a specific service landing page
            </p>
          </div>
        </label>

        {/* Service picker — visible when SERVICE selected */}
        {value.destination_type === "SERVICE" && (
          <div className="mt-2 ml-6 space-y-1.5">
            {options.services.length === 0 ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                No services available. Contact support to enable services for your account.
              </div>
            ) : (
              options.services.map((svc) => (
                <label
                  key={svc.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-2.5 transition-colors ${
                    value.destination_service_template_id === svc.id
                      ? "border-primary bg-primary/5"
                      : "border-input hover:border-primary/40"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="destination_service"
                    value={svc.id}
                    checked={value.destination_service_template_id === svc.id}
                    disabled={disabled}
                    onChange={() =>
                      onChange({
                        destination_type: "SERVICE",
                        destination_service_template_id: svc.id,
                      })
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{svc.template_name}</span>
                      <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
                        {CATEGORY_LABELS[svc.category] ?? svc.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{svc.duration_minutes} min</span>
                      <span>·</span>
                      <span>${Number(svc.price).toFixed(2)}</span>
                      <span>·</span>
                      {svc.is_published ? (
                        <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="size-3" /> Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="size-3" /> Not published yet
                        </span>
                      )}
                    </div>
                    {!svc.is_published && (
                      <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                        Visitors will be redirected to your profile until this service is published.
                      </p>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
