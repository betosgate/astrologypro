"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";

type Package = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[] | null;
  is_active: boolean;
  created_at: string;
};

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewPkg, setPreviewPkg] = useState<Package | null>(null);

  // Filters
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  async function load(overrides?: { createdFrom?: string; createdTo?: string }) {
    setLoading(true);
    const cf = overrides?.createdFrom ?? createdFrom;
    const ct = overrides?.createdTo ?? createdTo;
    const params = new URLSearchParams();
    if (cf) params.set("created_from", cf);
    if (ct) params.set("created_to", ct);
    const res = await fetch(`/api/admin/packages?${params}`);
    if (res.ok) setPackages(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function resetFilters() {
    setCreatedFrom(""); setCreatedTo("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Packages</h1>
          <p className="text-muted-foreground">Manage subscription packages</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/packages/new"><Plus className="mr-1.5 size-4" /> New Package</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Created from</Label>
              <Input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Created to</Label>
              <Input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => load()}>Search</Button>
            <Button size="sm" variant="outline" onClick={() => { resetFilters(); load({ createdFrom: "", createdTo: "" }); }}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview modal */}
      {previewPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewPkg(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle>Package Preview</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {previewPkg.name}</div>
              <div><span className="font-medium">Price:</span> ${Number(previewPkg.price).toFixed(2)}</div>
              {previewPkg.description && <div><span className="font-medium">Description:</span> {previewPkg.description}</div>}
              <div><span className="font-medium">Status:</span> <Badge variant={previewPkg.is_active ? "default" : "outline"}>{previewPkg.is_active ? "Active" : "Inactive"}</Badge></div>
              <div><span className="font-medium">Created:</span> {fmt(previewPkg.created_at)}</div>
              {previewPkg.features && previewPkg.features.length > 0 && (
                <div>
                  <span className="font-medium">Features:</span>
                  <ul className="ml-4 mt-1 list-disc text-xs text-muted-foreground">
                    {previewPkg.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
              <Button size="sm" className="mt-2" onClick={() => setPreviewPkg(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : packages.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-sm text-muted-foreground">No packages found.</p></CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Packages</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Price</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                    <th className="px-3 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{pkg.name}</td>
                      <td className="px-3 py-2">${Number(pkg.price).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={pkg.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                          {pkg.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{fmt(pkg.created_at)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewPkg(pkg)}><Eye className="size-3.5" /></Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/packages/${pkg.id}/edit`} className="text-sm text-blue-500">Edit</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
