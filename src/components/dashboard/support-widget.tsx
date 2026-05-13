"use client";

import { useState } from "react";
import { 
  LifeBuoy, 
  MessageSquare, 
  X, 
  Send, 
  ChevronRight, 
  ExternalLink,
  Loader2
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"menu" | "form" | "success">("menu");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !description) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          description,
          category: "General Support",
          priority: "normal",
        }),
      });

      if (!res.ok) throw new Error("Failed to create ticket");
      
      setStep("success");
      toast.success("Support ticket created!");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <Card className="w-[350px] shadow-2xl border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LifeBuoy className="size-5" />
                <CardTitle className="text-lg">How can we help?</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary-foreground hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <CardDescription className="text-primary-foreground/80 mt-1">
              Search our FAQ or start a conversation.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-4 max-h-[400px] overflow-y-auto">
            {step === "menu" && (
              <div className="space-y-3">
                <button 
                  onClick={() => setStep("form")}
                  className="w-full flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="size-4 text-primary" />
                    <span className="text-sm font-medium">Send us a message</span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
                <Link 
                  href="/docs" 
                  className="w-full flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="size-4 text-primary" />
                    <span className="text-sm font-medium">Browse Documentation</span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
                <div className="pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Suggested Articles</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="hover:text-primary cursor-pointer px-1">• How to set up my profile?</li>
                    <li className="hover:text-primary cursor-pointer px-1">• Understanding commission rates</li>
                    <li className="hover:text-primary cursor-pointer px-1">• Scheduling your first session</li>
                  </ul>
                </div>
              </div>
            )}

            {step === "form" && (
              <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-1.5">
                  <Input 
                    placeholder="Subject" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Textarea 
                    placeholder="Describe your issue..." 
                    className="min-h-[100px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
                    Send Message
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setStep("menu")}>Cancel</Button>
                </div>
              </form>
            )}

            {step === "success" && (
              <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
                <div className="size-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="size-6" />
                </div>
                <h3 className="font-bold text-lg">Message Sent!</h3>
                <p className="text-sm text-muted-foreground">
                  We've received your request and will get back to you soon.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => { setStep("menu"); setSubject(""); setDescription(""); }}>
                  Done
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="text-[10px] text-center justify-center text-muted-foreground border-t py-2">
            Powered by AstrologyPro Support
          </CardFooter>
        </Card>
      )}

      <Button 
        size="lg" 
        className={cn(
          "rounded-full h-14 w-14 shadow-xl transition-all duration-300",
          isOpen ? "rotate-90 bg-muted text-foreground hover:bg-muted" : "bg-primary text-primary-foreground hover:scale-105"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="size-6" /> : <LifeBuoy className="size-6" />}
      </Button>
    </div>
  );
}

import Link from "next/link";
import { CheckCircle } from "lucide-react";
