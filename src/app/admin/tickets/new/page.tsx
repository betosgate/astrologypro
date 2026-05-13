"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type RequesterSuggestion = {
  id: string;
  name: string;
  email: string;
};

function RequesterAutocomplete({
  id,
  type = "text",
  placeholder,
  value,
  displayField,
  onChange,
  onSelect,
}: {
  id: string;
  type?: "text" | "email";
  placeholder: string;
  value: string;
  displayField: "name" | "email";
  onChange: (value: string) => void;
  onSelect: (user: RequesterSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<RequesterSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fetchSuggestions(q: string) {
    const params = new URLSearchParams({ limit: "5" });
    if (q.trim()) params.set("q", q.trim());

    fetch(`/api/admin/tickets/requesters?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        const users = Array.isArray(data.users) ? data.users : [];
        setSuggestions(users);
        setOpen(users.length > 0);
        setActiveSuggestion(-1);
      })
      .catch(() => {
        setSuggestions([]);
        setOpen(false);
      });
  }

  function handleChange(nextValue: string) {
    onChange(nextValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(nextValue), 250);
  }

  function handleSelect(user: RequesterSuggestion) {
    setSuggestions([]);
    setOpen(false);
    onSelect(user);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && activeSuggestion >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeSuggestion]);
    }
    if (e.key === "Escape") setOpen(false);
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => fetchSuggestions(value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border bg-popover shadow-md">
          {suggestions.map((user, idx) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(user)}
              className={cn(
                "flex w-full flex-col px-3 py-2 text-left text-sm transition-colors",
                idx === activeSuggestion
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
            >
              <span className="truncate font-medium">{user[displayField]}</span>
              <span className="truncate text-xs text-muted-foreground">
                {displayField === "name" ? user.email : user.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: "support",
    category: "General",
    subject: "",
    description: "",
    priority: "normal",
    requester_email: "",
    requester_name: "",
    requester_role: "staff",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.subject || !formData.description) {
      toast.error("Please fill in the subject and description.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to create ticket.");
      }

      const ticket = await res.json();
      toast.success("Ticket created successfully!");
      router.push(`/admin/tickets/${ticket.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/tickets">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold italic tracking-tight">Create New Job Ticket</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <CardTitle>Ticket Essentials</CardTitle>
                <CardDescription>
                  Define the core issue or task that needs attention.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Fix broken login on mobile"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide full details, steps to reproduce, or task requirements..."
                    className="min-h-[200px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <CardTitle>Requester Details</CardTitle>
                <CardDescription>
                  Who is reporting this or who is the primary contact?
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="req_name">Name</Label>
                  <RequesterAutocomplete
                    id="req_name"
                    placeholder="Internal Staff or Customer Name"
                    value={formData.requester_name}
                    displayField="name"
                    onChange={(value) => setFormData((prev) => ({ ...prev, requester_name: value }))}
                    onSelect={(user) =>
                      setFormData((prev) => ({
                        ...prev,
                        requester_name: user.name,
                        requester_email: user.email,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req_email">Email</Label>
                  <RequesterAutocomplete
                    id="req_email"
                    type="email"
                    placeholder="contact@example.com"
                    value={formData.requester_email}
                    displayField="email"
                    onChange={(value) => setFormData((prev) => ({ ...prev, requester_email: value }))}
                    onSelect={(user) =>
                      setFormData((prev) => ({
                        ...prev,
                        requester_name: user.name,
                        requester_email: user.email,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/10 shadow-sm bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ticket Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="job">Job / Task</SelectItem>
                      <SelectItem value="incident">Incident</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    placeholder="e.g., Finance, Tech, Content"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <Send className="size-4 mr-2" />
                  )}
                  Create Ticket
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
