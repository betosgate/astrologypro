"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  MoreHorizontal,
  StickyNote,
  ShieldOff,
  ShieldCheck,
  Eye,
  BadgeCheck,
} from "lucide-react";
import { UserDetailSheet } from "./user-detail-sheet";
import { InviteUserForm } from "./invite-user-form";

export interface AdminUser {
  userId: string;
  rowId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  roleLabel: string;
  status: string;
  joinedAt: string;
  blocked: boolean;
  isCertified?: boolean;
  lastLoginAt?: string;
  extra?: Record<string, string>;
}

interface Props {
  users: AdminUser[];
}

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "diviner", label: "Diviners" },
  { value: "client", label: "Clients" },
  { value: "advocate", label: "Advocates" },
  { value: "community", label: "Community" },
  { value: "trainee", label: "Trainees" },
];

function dateStr(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UserManagementClient({ users: initialUsers }: Props) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<"overview" | "notes" | "logins">("overview");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return users.filter((u) => {
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      if (!matchesRole) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q) ||
        u.roleLabel.toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  function openSheet(user: AdminUser, tab: "overview" | "notes" | "logins" = "overview") {
    setSelectedUser(user);
    setSheetTab(tab);
    setSheetOpen(true);
  }

  function handleUserChanged(userId: string, change: Partial<AdminUser>) {
    setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, ...change } : u)));
    if (selectedUser?.userId === userId) {
      setSelectedUser((prev) => prev ? { ...prev, ...change } : prev);
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: users.length };
    for (const u of users) c[u.role] = (c[u.role] ?? 0) + 1;
    return c;
  }, [users]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">{users.length} total across all roles</p>
        </div>
        <InviteUserForm />
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label} {counts[o.value] !== undefined ? `(${counts[o.value]})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden xl:table-cell">Last Login</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden xl:table-cell">Joined</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-12">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={`${u.role}-${u.rowId}`}
                  className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                  onClick={() => openSheet(u, "overview")}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{u.name}</span>
                      {u.isCertified && (
                        <BadgeCheck className="size-3.5 text-amber-500 shrink-0" aria-label="DIB Certified" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground md:hidden">{u.email}</div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden lg:table-cell">{u.phone ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-xs capitalize">{u.roleLabel}</Badge>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    {u.blocked ? (
                      <Badge variant="destructive" className="text-xs">Blocked</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">{u.status}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs hidden xl:table-cell">
                    {u.lastLoginAt ? dateStr(u.lastLoginAt) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs hidden xl:table-cell">
                    {dateStr(u.joinedAt)}
                  </td>
                  <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openSheet(u, "overview")}>
                          <Eye className="mr-2 size-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openSheet(u, "notes")}>
                          <StickyNote className="mr-2 size-4" />
                          Add / View Notes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openSheet(u, "logins")}>
                          <Eye className="mr-2 size-4" />
                          Login History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {u.blocked ? (
                          <DropdownMenuItem
                            className="text-green-500"
                            onClick={async (e) => {
                              e.preventDefault();
                              const res = await fetch(`/api/admin/users/${u.userId}/unblock`, { method: "POST" });
                              if (res.ok) handleUserChanged(u.userId, { blocked: false });
                            }}
                          >
                            <ShieldCheck className="mr-2 size-4" />
                            Unblock User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => { openSheet(u, "overview"); }}
                          >
                            <ShieldOff className="mr-2 size-4" />
                            Block User…
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    {query || roleFilter !== "all" ? "No users match your search" : "No users yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <UserDetailSheet
        user={selectedUser}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onUserChanged={handleUserChanged}
      />
    </>
  );
}
