"use client";

import { useState } from "react";

interface BlogSubscribeFormProps {
  /** When set, attributes the subscription to a specific diviner (newsletter attribution). */
  divinerUsername?: string;
}

export function BlogSubscribeForm({ divinerUsername }: BlogSubscribeFormProps = {}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/blog/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          ...(divinerUsername ? { diviner_username: divinerUsername } : {}),
        }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("You're on the list! We'll let you know when we publish.");
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Could not connect. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/5 px-6 py-5">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-green-500/10">
          <svg
            className="size-5 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-green-400">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={status === "loading"}
          className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-[#f5f0e8] placeholder-[#b8bcd0]/30 outline-none transition-all focus:border-[#c9a84c]/40 focus:ring-2 focus:ring-[#c9a84c]/10 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="rounded-full px-6 py-3 text-sm font-semibold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "linear-gradient(180deg, #f8d275 0%, #cd912f 100%)",
          }}
        >
          {status === "loading" ? "Subscribing…" : "Notify Me"}
        </button>
      </div>

      {status === "error" && (
        <p className="mt-3 text-center text-xs text-red-400">{message}</p>
      )}

      <p className="mt-3 text-xs text-[#b8bcd0]/35">
        We respect your privacy. Unsubscribe anytime.
      </p>
    </form>
  );
}
