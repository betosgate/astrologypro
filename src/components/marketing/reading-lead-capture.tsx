"use client";

import { useState } from "react";

interface ReadingLeadCaptureProps {
  subject: string;
}

export function ReadingLeadCapture({ subject }: ReadingLeadCaptureProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/marketing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-6 py-5">
        <p className="text-lg font-semibold" style={{ color: "#e2c97e" }}>
          Check your inbox! Your guide is on its way.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="h-[52px] flex-1 rounded-lg border border-[#c9a84c]/20 bg-white/5 px-4 text-[15px] text-white placeholder:text-white/30 focus:border-[#c9a84c]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/30"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-[52px] shrink-0 rounded-lg px-6 text-[15px] font-bold text-black transition-all hover:brightness-110 disabled:opacity-60 sm:px-8"
          style={{
            background: "linear-gradient(180deg, #f8d275 0%, #cd912f 100%)",
            boxShadow: "0 4px 15px rgba(201,168,76,0.3)",
          }}
        >
          {status === "loading" ? "Sending…" : "Send Me the Guide"}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-sm text-red-400">{errorMsg}</p>
      )}
    </>
  );
}
