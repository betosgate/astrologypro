"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2, CheckCircle } from "lucide-react";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Re-authenticate with current password first
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) {
        setError("Could not verify your identity. Please sign in again.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: current,
      });
      if (signInError) {
        setError("Current password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
        <CheckCircle className="size-5 text-green-500 shrink-0" />
        <p className="text-sm text-green-700 dark:text-green-400">Password updated successfully.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current Password</Label>
        <PasswordInput
          id="current-password"
          placeholder="Your current password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <PasswordInput
          id="new-password"
          placeholder="At least 8 characters"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          showStrength
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">Confirm New Password</Label>
        <PasswordInput
          id="confirm-new-password"
          placeholder="Repeat new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          confirmValue={next}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? (
          <><Loader2 className="mr-2 size-4 animate-spin" />Updating...</>
        ) : (
          "Update Password"
        )}
      </Button>
    </form>
  );
}
