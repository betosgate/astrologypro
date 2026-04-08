"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Loader2, Lock, AlertCircle } from "lucide-react";

const COURSE_ITEM_KEY = "professional_divination_course";
const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).{8,15}$/;

interface PricingResponse {
  item_key: string;
  item_name: string;
  price: number;
  currency: "USD" | "INR";
  description: string | null;
}

const COUNTRIES = ["United States", "India", "United Kingdom", "Canada", "Australia", "Other"] as const;
const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
];

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export default function DivinerSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const affiliateId = searchParams.get("affiliatid") ?? null;

  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<string>("United States");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the dynamic course price on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/pricing/${COURSE_ITEM_KEY}`);
        const body = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setPricingError(body.error ?? `HTTP ${r.status}`);
          return;
        }
        setPricing(body as PricingResponse);
      } catch (err) {
        if (cancelled) return;
        setPricingError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stateOptions =
    country === "United States"
      ? US_STATES
      : country === "India"
        ? INDIAN_STATES
        : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("A valid email is required.");
      return;
    }
    if (phone.replace(/\D/g, "").length !== 10) {
      setError("Phone must be a 10-digit number.");
      return;
    }
    if (!country || !city.trim() || !zip.trim()) {
      setError("Country, city, and zip are required.");
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError(
        "Password must be 8-15 characters and include uppercase, lowercase, a digit, and one of @#$%^&+=.",
      );
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const r = await fetch("/api/diviner-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone,
          city: city.trim(),
          country,
          state,
          zip: zip.trim(),
          password,
          affiliate_id: affiliateId,
        }),
      });
      const body = await r.json();
      if (!r.ok) {
        setError(body.error ?? `HTTP ${r.status}`);
        return;
      }
      // Registration succeeded. Stripe payment integration (task 03) is a
      // separate piece of work — for now redirect the user to a stub success
      // page so the flow is observable end-to-end without payment.
      router.push(
        `/diviner-signup/success?email=${encodeURIComponent(email)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const priceLabel =
    pricing != null ? formatCurrency(pricing.price, pricing.currency) : "—";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              School of the Divine
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Infinite Being
            </p>
          </div>
          <h1 className="mt-4 text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
            CHECK OUT
          </h1>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: course info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-xl border bg-amber-50 p-4 text-sm text-amber-900">
              Get a flat <strong>10% instant discount</strong> on course fees
              with full payment upfront!
            </div>
            <h2 className="text-xl font-semibold">
              Our full course includes the mastery of 15 Astrology and Tarot products
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our courses are done through live web casts and student center
              training videos and segments. You will be able to collaborate
              live with teachers and go into break-out sessions with other
              students while enjoying full course materials you gain access to
              for life.
            </p>

            <div>
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide">
                Course metrics
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                <li>Comprehensive 15-product curriculum</li>
                <li>100+ hours of structured training</li>
                <li>Live readings with experienced practitioners</li>
                <li>Recorded sessions you keep for life</li>
                <li>Live break-out sessions with fellow students</li>
                <li>Full course materials accessible for life</li>
              </ul>
            </div>
          </div>

          {/* RIGHT: order summary + form */}
          <aside className="lg:col-span-1 space-y-4">
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm">Professional Divination Course</p>
                  <p className="font-bold tabular-nums">{priceLabel}</p>
                </div>
                {pricingError && (
                  <p className="text-xs text-destructive">{pricingError}</p>
                )}
                <div className="border-t pt-3 flex items-baseline justify-between">
                  <p className="text-sm font-semibold">Total Payable</p>
                  <p className="text-lg font-bold tabular-nums text-primary">
                    {priceLabel}
                  </p>
                </div>
                <Badge variant="outline" className="w-full justify-center">
                  Pay in Full
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Billing Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ds-fname">First Name</Label>
                      <Input
                        id="ds-fname"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ds-lname">Last Name</Label>
                      <Input
                        id="ds-lname"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ds-phone">Phone</Label>
                    <Input
                      id="ds-phone"
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ds-country">Country</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger id="ds-country">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ds-state">State</Label>
                      {stateOptions ? (
                        <Select value={state} onValueChange={setState}>
                          <SelectTrigger id="ds-state">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {stateOptions.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="ds-state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ds-city">City</Label>
                      <Input
                        id="ds-city"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ds-zip">Zip</Label>
                      <Input
                        id="ds-zip"
                        required
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ds-email">Email</Label>
                    <Input
                      id="ds-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ds-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="ds-password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      8-15 chars, mixed case, a digit, and one of @#$%^&+=
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ds-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="ds-confirm"
                        type={showConfirm ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                    <Lock className="mr-2 size-4" />
                    SUBMIT
                  </Button>
                </form>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
