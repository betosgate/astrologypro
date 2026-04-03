"use client";

import * as React from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Strength calculation ─────────────────────────────────────────────────────

interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  width: string;
}

function getStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: "", color: "", width: "0%" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  // cap at 4
  const capped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const map: Record<1 | 2 | 3 | 4, Omit<StrengthResult, "score">> = {
    1: { label: "Weak",      color: "bg-red-500",    width: "25%" },
    2: { label: "Fair",      color: "bg-orange-400", width: "50%" },
    3: { label: "Good",      color: "bg-yellow-400", width: "75%" },
    4: { label: "Strong",    color: "bg-emerald-400", width: "100%" },
  };
  if (capped === 0) return { score: 0, label: "", color: "", width: "0%" };
  return { score: capped, ...map[capped] };
}

// ─── Requirements list ────────────────────────────────────────────────────────

const REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase & lowercase",  test: (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { label: "A number",               test: (p: string) => /[0-9]/.test(p) },
  { label: "A special character",    test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

// ─── PasswordInput ────────────────────────────────────────────────────────────

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
  confirmValue?: string; // when set, shows a match indicator instead of strength
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrength = false, confirmValue, value, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const password = typeof value === "string" ? value : "";
    const strength = showStrength ? getStrength(password) : null;

    const isConfirm = confirmValue !== undefined;
    const matches = isConfirm && password.length > 0 && password === confirmValue;
    const mismatch = isConfirm && password.length > 0 && password !== confirmValue;

    return (
      <div className="space-y-2">
        {/* Input wrapper */}
        <div className="relative">
          <Input
            ref={ref}
            type={visible ? "text" : "password"}
            value={value}
            className={cn(
              "pr-10",
              mismatch && "border-red-500/60 focus-visible:ring-red-500/30",
              matches && "border-emerald-500/60 focus-visible:ring-emerald-500/30",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b8bcd0]/50 hover:text-[#b8bcd0] transition-colors"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Strength bar (only on primary password field) */}
        {showStrength && password.length > 0 && strength && (
          <div className="space-y-1.5">
            {/* Bar */}
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      i <= strength.score ? strength.color : "bg-transparent",
                    )}
                  />
                </div>
              ))}
            </div>
            {/* Label */}
            <p className={cn("text-xs font-medium", {
              "text-red-400":    strength.score === 1,
              "text-orange-400": strength.score === 2,
              "text-yellow-400": strength.score === 3,
              "text-emerald-400": strength.score === 4,
            })}>
              {strength.label}
            </p>
            {/* Requirements */}
            <ul className="space-y-1">
              {REQUIREMENTS.map((req) => {
                const met = req.test(password);
                return (
                  <li key={req.label} className="flex items-center gap-1.5">
                    {met
                      ? <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                      : <X className="h-3 w-3 text-[#b8bcd0]/30 shrink-0" />}
                    <span className={cn("text-xs", met ? "text-emerald-400" : "text-[#b8bcd0]/40")}>
                      {req.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Match indicator (confirm field) */}
        {isConfirm && password.length > 0 && (
          <p className={cn("flex items-center gap-1.5 text-xs font-medium", {
            "text-emerald-400": matches,
            "text-red-400": mismatch,
          })}>
            {matches
              ? <><Check className="h-3 w-3" /> Passwords match</>
              : <><X className="h-3 w-3" /> Passwords do not match</>}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
