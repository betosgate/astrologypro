"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Search, 
  Loader2, 
  ArrowLeft,
  RefreshCcw,
  Box
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { HoroscopeToolkitPage } from "../horoscope/page";

// Components
import { ToolkitTable } from "./toolkit-table";

interface SavedResponse {
  id: string;
  toolname: string;
  form_data: any;
  created_at: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
}

export default function SearchedToolkitPage() {
  const [items, setItems] = useState<SavedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<SavedResponse | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<SavedResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/searched-toolkit/list");
      const data = await res.json();
      if (data.status === "success") {
        setItems(data.results);
      } else {
        toast.error(data.error || "Failed to fetch items");
      }
    } catch (err) {
      toast.error("An error occurred while fetching items");
    } finally {
      setLoading(false);
    }
  }

  async function showDetails(id: string) {
    const item = items.find((candidate) => candidate.id === id);
    if (!item) {
      toast.error("Record not found");
      return;
    }
    setSelectedItem(item);
    setSelectedDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);

    try {
      const res = await fetch(`/api/admin/searched-toolkit/details?id=${encodeURIComponent(id)}`);
      const data = await res.json();

      if (!res.ok || data.status !== "success") {
        throw new Error(data.error || "Failed to fetch saved details");
      }

      setSelectedDetails(data.result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred while fetching saved details";
      setDetailsError(message);
      toast.error(message);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/searched-toolkit/delete?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      
      if (data.status === "success") {
        toast.success("Record deleted successfully");
        setItems(prev => prev.filter(item => item.id !== id));
      } else {
        toast.error(data.error || "Failed to delete record");
      }
    } catch (err) {
      toast.error("An error occurred during deletion");
    }
  }

  const filteredItems = items.filter(item => {
    const searchStr = `${item.toolname} ${item.id} ${item.user_name} ${item.user_email} ${JSON.stringify(item.form_data)}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  if (selectedItem) {
    const detailRecord = selectedDetails ?? selectedItem;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => { setSelectedItem(null); setSelectedDetails(null); setDetailsError(null); }}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Archive
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
             <Badge variant="outline" className="bg-muted px-3 py-1 font-semibold uppercase tracking-tight">
                {selectedItem.toolname.replace(/_/g, " ")}
              </Badge>
             <Badge variant="secondary" className="px-3 py-1 font-mono">
                {format(new Date(selectedItem.created_at), "MMM d, yyyy · HH:mm")}
              </Badge>
          </div>
        </div>

        {detailsLoading ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-lg border bg-background">
            <Loader2 className="size-8 animate-spin text-amber-500" />
            <p className="text-sm text-muted-foreground">Loading saved toolkit details...</p>
          </div>
        ) : detailsError ? (
          <Card>
            <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
              <p className="font-medium">Saved details could not be loaded.</p>
              <p className="max-w-md text-sm text-muted-foreground">{detailsError}</p>
              <Button variant="outline" size="sm" onClick={() => showDetails(selectedItem.id)}>
                <RefreshCcw className="mr-2 size-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-background">
            <HoroscopeToolkitPage
              key={detailRecord.id}
              basePath="/admin/searched-toolkit"
              allowedSlugs={[detailRecord.toolname]}
              initialSavedFormData={detailRecord.form_data}
              initialSavedReport={detailRecord}
              autoSubmitPrefill={false}
              readOnlyBirthData
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Searched Toolkit
          </h1>
          <p className="text-muted-foreground">
            Archive of all AI Horoscope generations and astrological computations.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="secondary" className="px-3 py-1 font-mono">
             {items.length} Records
           </Badge>
           <Button variant="outline" size="icon" onClick={fetchItems} disabled={loading} className="size-9">
              <RefreshCcw className={cn("size-4 text-muted-foreground", loading && "animate-spin")} />
           </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
             <Input 
               placeholder="Search by user, name, or payload..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-9"
             />
           </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
               <Loader2 className="size-8 animate-spin text-amber-500" />
               <p className="text-sm text-muted-foreground">Fetching records...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
              <Box className="size-10 mb-2 text-muted-foreground" />
              <p className="font-medium">No results found</p>
            </div>
          ) : (
             <ToolkitTable items={filteredItems} onSelect={showDetails} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
