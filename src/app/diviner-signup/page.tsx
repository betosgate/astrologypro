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
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30">
      {/* Dynamic background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[50%] bg-red-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Top Brand Bar (Reference matching) */}
      <div className="relative z-10 w-full bg-[#f38100] py-2.5 px-4 shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
        <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {["HOME", "DIVINATION CERTIFICATION", "MYSTERY SCHOOL", "PERENNIAL MANDALISM", "SHOP", "JUNG DEBATES", "OUR LEADERSHIP", "CONTACT"].map((link) => (
              <span key={link} className="whitespace-nowrap px-2 text-[10px] font-bold text-zinc-900 hover:text-white cursor-pointer transition-colors">
                {link}
              </span>
            ))}
          </div>
          <div className="hidden sm:block">
            <span className="text-[10px] font-extrabold text-zinc-900 bg-white/20 px-3 py-1 rounded">SCHOOL LOGIN</span>
          </div>
        </div>
      </div>

      <header className="relative z-10 w-full pt-8 pb-4">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col items-center">
          {/* Logo & Brand Name Container */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative size-20 sm:size-24 mb-4">
              <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse" />
              <img
                src="/images/home/png_logo_1.png"
                alt="Logo"
                className="relative z-10 w-full h-full object-contain filter drop-shadow-lg"
              />
            </div>
            <div className="text-center space-y-0.5">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.4em] text-zinc-300">
                School of the Divine
              </h2>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.4em] text-zinc-300">
                Infinite Being
              </h2>
            </div>
          </div>

          {/* Large Check Out Banner (Reference match) */}
          <div className="w-full max-w-3xl relative">
            <div className="absolute inset-0 bg-orange-600 blur-2xl opacity-20 transform -rotate-1 scale-105" />
            <div className="relative bg-gradient-to-r from-orange-400 via-orange-500 to-red-600 px-8 py-4 sm:py-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_2px_1px_rgba(255,255,255,0.3)] border-b-4 border-red-700">
              <h1 className="text-center text-4xl sm:text-6xl font-black italic tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                CHECK OUT
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

          {/* LEFT COLUMN: Course Info */}
          <div className="lg:col-span-2 space-y-10 order-2 lg:order-1">
            <div className="relative group overflow-hidden rounded-2xl border border-amber-500/20 bg-zinc-900/40 p-1 backdrop-blur-sm">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
              <div className="px-6 py-5">
                <h2 className="text-xl sm:text-2xl font-black italic text-zinc-100 leading-tight">
                  GET A FLAT <span className="text-orange-500">10% INSTANT DISCOUNT</span> ON COURSE FEES WITH FULL PAYMENT UPFRONT!
                </h2>
                <p className="mt-4 text-lg font-bold text-amber-500 italic">
                  Our full course includes the mastery of 15 Astrology and Tarot products
                </p>
              </div>
            </div>

            {/* Content Box with Highlight Box (Like Reference) */}
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl">
              <div className="absolute top-0 left-0 w-1 h-32 bg-orange-500 rounded-full -translate-x-0.5" />
              <div className="space-y-6">
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-red-600/40 to-transparent rounded-lg border-l-4 border-red-600">
                  <p className="text-base font-bold text-zinc-100 leading-relaxed italic">
                    Our courses are done through live web casts and student center training videos and sements.
                    You will be able to collaborate live with teachers and go into break out seasons with other students
                    while enjoying full course materials you gain access to for life!
                  </p>
                </div>

                <section>
                  <h3 className="text-lg font-black italic uppercase tracking-wider text-orange-500 mb-6 flex items-center gap-3">
                    <span className="w-8 h-1 bg-orange-500 rounded-full" />
                    COURSES METRICS:
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      "Comprehensive 15-product curriculum",
                      "100+ hours of structured training",
                      "Live readings with experienced practitioners",
                      "Recorded sessions you keep for life",
                      "Live break-out sessions with fellow students",
                      "Full course materials accessible for life",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-4 group p-3 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="mt-1 size-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] shrink-0 border-2 border-white/20" />
                        <p className="text-sm font-bold text-zinc-300 leading-snug group-hover:text-white transition-colors">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order & Billing */}
          <aside className="lg:col-span-1 space-y-8 order-1 lg:order-2">

            {/* Order Summary (Reference Match) */}
            <Card className="overflow-hidden border-orange-600 border-2 bg-zinc-950/80 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(249,115,22,0.1)]">
              <div className="bg-[#f38100] py-1.5 text-center">
                <h2 className="text-[13px] font-black uppercase tracking-widest text-zinc-900">ORDER SUMMARY</h2>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="rounded border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Item Name:</p>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs font-black text-zinc-100">Professional Divination Course</p>
                      <p className="text-xs font-black text-orange-400">{priceLabel}</p>
                    </div>
                  </div>
                </div>

                {pricingError && (
                  <div className="flex items-center gap-2 p-2 rounded bg-red-950/50 border border-red-500/30">
                    <AlertCircle className="size-3 text-red-500" />
                    <p className="text-[10px] font-bold text-red-400">{pricingError}</p>
                  </div>
                )}

                <div className="bg-[#f38100] py-1 text-center">
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-900">PRICE DETAILS</h2>
                </div>

                <Button className="w-full h-8 bg-gradient-to-b from-orange-400 to-orange-600 text-zinc-900 font-black text-[10px] uppercase tracking-widest shadow-[0_4px_0_rgb(180,83,9)] hover:translate-y-[1px] hover:shadow-[0_3px_0_rgb(180,83,9)] transition-all">
                  PAY IN FULL
                </Button>

                <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                  <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Total Payable</p>
                  <p className="text-lg font-black text-white tabular-nums">
                    {priceLabel}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Billing Details (Reference Match) */}
            <Card className="overflow-hidden border-zinc-800 border-2 bg-zinc-950/80 shadow-2xl">
              <div className="bg-[#f38100] py-1.5 text-center">
                <h2 className="text-[13px] font-black uppercase tracking-widest text-zinc-900">BILLING DETAILS</h2>
              </div>
              <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-1 gap-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">First Name</Label>
                        <Input
                          className="bg-zinc-900/50 border-zinc-700 h-10 font-bold focus:border-orange-500/50"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Last Name</Label>
                        <Input
                          className="bg-zinc-900/50 border-zinc-700 h-10 font-bold focus:border-orange-500/50"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Phone No</Label>
                      <Input
                        className="bg-zinc-900/50 border-zinc-700 h-10 font-bold focus:border-orange-500/50"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Country</Label>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger className="bg-zinc-900/50 border-zinc-700 h-10 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c} value={c} className="font-bold focus:bg-orange-500/10">
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">State</Label>
                        {stateOptions ? (
                          <Select value={state} onValueChange={setState}>
                            <SelectTrigger className="bg-zinc-900/50 border-zinc-700 h-10 font-bold">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                              {stateOptions.map((s) => (
                                <SelectItem key={s} value={s} className="font-bold focus:bg-orange-500/10">
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            className="bg-zinc-900/50 border-zinc-700 h-10 font-bold focus:border-orange-500/50"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">City</Label>
                        <Input
                          className="bg-zinc-900/50 border-zinc-700 h-10 font-bold focus:border-orange-500/50"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Zip</Label>
                        <Input
                          className="bg-zinc-900/50 border-zinc-700 h-10 font-bold focus:border-orange-500/50"
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Email</Label>
                      <Input
                        className="bg-zinc-900/50 border-zinc-700 h-10 font-bold focus:border-orange-500/50"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Password</Label>
                      <div className="relative">
                        <Input
                          className="bg-zinc-900/50 border-zinc-700 h-10 font-bold focus:border-orange-500/50 pr-10"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-orange-400"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          className="bg-zinc-900/50 border-zinc-700 h-10 font-bold focus:border-orange-500/50 pr-10"
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-orange-400"
                        >
                          {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-[11px] font-bold text-red-400">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#f38100] hover:bg-orange-500 text-zinc-900 font-black text-sm uppercase tracking-[0.2em] shadow-[0_6px_0_rgb(180,83,9)] hover:translate-y-[1px] hover:shadow-[0_4px_0_rgb(180,83,9)] transition-all active:translate-y-[3px] active:shadow-none"
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
            router.push(`/diviner-signup/success?email=${encodeURIComponent(email)}`);
          }}
        />
      )}
    </div>
  );
}
