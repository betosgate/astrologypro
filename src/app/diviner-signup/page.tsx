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
import { DivinerSignupPaymentModal } from "@/components/diviner-signup/payment-modal";
import { toast } from "sonner";

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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

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
      // Registration succeeded. Open the Stripe Elements payment modal.
      // The modal will fetch a PaymentIntent for the live course price and
      // confirm it in-place. Once paid, we'll forward to the success page.
      toast.success("Account registered", {
        description:
          "Redirecting you to secure payment. Please wait…",
      });
      setRegisteredUserId(body.user_id ?? null);
      setPaymentModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const priceLabel =
    pricing != null ? formatCurrency(pricing.price, pricing.currency) : "—";

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      {/* Premium dark header with orange→red gradient title */}
      <header className="border-b border-zinc-800/60 bg-gradient-to-b from-zinc-950 via-zinc-900/80 to-zinc-950">
        <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <div className="text-center">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-zinc-400">
              School of the Divine
            </p>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-zinc-400">
              Infinite Being
            </p>
          </div>
          <h1 className="mt-5 text-center text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-orange-500 to-red-600 bg-clip-text text-transparent drop-shadow-[0_2px_18px_rgba(249,115,22,0.25)]">
            CHECK OUT
          </h1>
          <div className="mx-auto mt-3 h-px max-w-md bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT: course info */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-4 text-sm text-amber-200 shadow-sm">
              Get a flat <strong className="text-amber-100">10% instant discount</strong> on course fees with full payment upfront!
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100 leading-snug">
              Our full course includes the mastery of <span className="text-orange-400">15 Astrology and Tarot</span> products
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Our courses are taught through live web casts and student-center
              training videos. You&apos;ll collaborate live with teachers, join
              break-out sessions with fellow students, and keep lifetime access
              to every recording and material you receive.
            </p>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400 mb-3">
                Course metrics
              </h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                {[
                  "Comprehensive 15-product curriculum",
                  "100+ hours of structured training",
                  "Live readings with experienced practitioners",
                  "Recorded sessions you keep for life",
                  "Live break-out sessions with fellow students",
                  "Full course materials accessible for life",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 rounded-full bg-orange-500 shrink-0" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT: order summary + form */}
          <aside className="lg:col-span-1 space-y-4 order-1 lg:order-2">
            <Card className="border-orange-500/30 bg-zinc-900/60 backdrop-blur shadow-[0_0_60px_-20px_rgba(249,115,22,0.25)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-zinc-100">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm text-zinc-300">Professional Divination Course</p>
                  <p className="font-bold tabular-nums text-zinc-100">{priceLabel}</p>
                </div>
                {pricingError && (
                  <p className="text-xs text-red-400">{pricingError}</p>
                )}
                <div className="border-t border-zinc-800 pt-3 flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-zinc-200">Total Payable</p>
                  <p className="text-xl font-bold tabular-nums bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                    {priceLabel}
                  </p>
                </div>
                <Badge variant="outline" className="w-full justify-center border-orange-500/40 text-orange-200">
                  Pay in Full
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-zinc-100">Billing Details</CardTitle>
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

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-yellow-300 to-amber-500 text-zinc-900 font-bold hover:from-yellow-400 hover:to-amber-600 hover:text-zinc-900 shadow-[0_0_30px_-8px_rgba(250,204,21,0.6)]"
                    disabled={submitting}
                  >
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

      {/* Stripe Elements payment modal */}
      {registeredUserId && (
        <DivinerSignupPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          userId={registeredUserId}
          email={email}
          name={`${firstName} ${lastName}`.trim()}
          onPaid={() => {
            // Payment confirmed in-page; forward to the success route.
            router.push(
              `/diviner-signup/success?email=${encodeURIComponent(email)}`,
            );
          }}
        />
      )}
    </div>
  );
}
