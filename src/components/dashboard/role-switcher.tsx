"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  LayoutDashboard, 
  User, 
  Share2, 
  Users, 
  GraduationCap, 
  Handshake,
  Check
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Logic mirrored from src/lib/user-roles.ts safely for client use
interface UserPortal {
  role: string;
  label: string;
  href: string;
  badge?: string;
}

const ICONS: Record<string, React.ElementType> = {
  diviner: LayoutDashboard,
  client: User,
  advocate: Share2,
  community: Users,
  trainee: GraduationCap,
  affiliate: Handshake,
};

export function RoleSwitcher() {
  const [portals, setPortals] = useState<UserPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchPortals() {
      try {
        const res = await fetch("/api/auth/portals");
        const data = await res.json();
        if (data.portals) {
          setPortals(data.portals);
        }
      } catch (err) {
        console.error("Failed to fetch portals", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPortals();
  }, []);

  if (loading || portals.length <= 1) return null;

  const currentPortal = portals.find(p => pathname.startsWith(p.href)) || portals[0];
  const CurrentIcon = ICONS[currentPortal.role] ?? LayoutDashboard;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-2 border-primary/20 bg-primary/5 px-3 font-semibold hover:bg-primary/10 hover:text-primary transition-all rounded-full"
        >
          <div className="flex size-5 items-center justify-center rounded-full bg-primary/20">
            <CurrentIcon className="size-3 text-primary" />
          </div>
          <span className="hidden sm:inline">{currentPortal.label}</span>
          <ChevronDown className="size-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-primary/20 bg-slate-950/95 backdrop-blur-xl">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Switch Portal
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-primary/10" />
        <div className="py-1">
          {portals.map((portal) => {
            const Icon = ICONS[portal.role] ?? LayoutDashboard;
            const isActive = pathname.startsWith(portal.href);
            
            return (
              <DropdownMenuItem key={portal.role} asChild className="focus:bg-primary/10 cursor-pointer">
                <Link href={portal.href} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex size-8 items-center justify-center rounded-lg transition-colors",
                      isActive ? "bg-primary text-white" : "bg-primary/10 text-primary"
                    )}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", isActive ? "text-white" : "text-slate-300")}>
                        {portal.label}
                      </p>
                      {portal.badge && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                          {portal.badge}
                        </p>
                      )}
                    </div>
                  </div>
                  {isActive && <Check className="size-3.5 text-primary" />}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
