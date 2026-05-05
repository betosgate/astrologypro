"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Search, 
  Loader2, 
  ArrowLeft,
  RefreshCcw,
  Box,
  ChevronLeft,
  ChevronRight,
  FilterX,
  CalendarDays,
  MapPin,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const itemsPerPage = 10;

  // Multi-filter state
  const [filters, setFilters] = useState({
    year: "",
    month: "",
    day: "",
    place: "",
    general: ""
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      year: "",
      month: "",
      day: "",
      place: "",
      general: ""
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

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
        setSelectedIds((prev) => {
          const availableIds = new Set((data.results as SavedResponse[]).map((item) => item.id));
          return new Set([...prev].filter((id) => availableIds.has(id)));
        });
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
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        toast.error(data.error || "Failed to delete record");
      }
    } catch (err) {
      toast.error("An error occurred during deletion");
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePageSelected() {
    const pageIds = paginatedItems.map((item) => item.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredItems.forEach((item) => next.add(item.id));
      return next;
    });
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    try {
      setBulkDeleting(true);
      const res = await fetch("/api/admin/searched-toolkit/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.status !== "success") {
        throw new Error(data.error || "Failed to delete selected records");
      }

      const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : ids;
      const deletedSet = new Set(deletedIds);
      setItems((prev) => prev.filter((item) => !deletedSet.has(item.id)));
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      toast.success(data.message || "Selected records deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred during bulk deletion");
    } finally {
      setBulkDeleting(false);
    }
  }

  const filteredItems = items.filter(item => {
    const formData = item.form_data || {};
    
    // Helper to check if a subject matches the filters
    const matchesSubject = (data: any) => {
      if (!data) return false;
      const dYear = String(data.year || "");
      const dMonth = String(data.month || "");
      const dDay = String(data.day || "");
      const dPlace = String(data.city?.label || "").toLowerCase();

      const yearMatch = !filters.year || dYear.includes(filters.year);
      const monthMatch = !filters.month || dMonth === filters.month || dMonth.padStart(2, '0') === filters.month.padStart(2, '0');
      const dayMatch = !filters.day || dDay === filters.day || dDay.padStart(2, '0') === filters.day.padStart(2, '0');
      const placeMatch = !filters.place || dPlace.includes(filters.place.toLowerCase());

      return yearMatch && monthMatch && dayMatch && placeMatch;
    };

    // Check top level or nested subjects
    let matchesFilters = false;
    if (formData.self || formData.partner || formData.person1 || formData.person2) {
      matchesFilters = matchesSubject(formData.self) || 
                       matchesSubject(formData.partner) || 
                       matchesSubject(formData.person1) || 
                       matchesSubject(formData.person2);
    } else {
      matchesFilters = matchesSubject(formData);
    }

    // General search (original behavior)
    const searchStr = `${item.toolname} ${item.id} ${item.user_name} ${item.user_email}`.toLowerCase();
    const generalMatch = !filters.general || searchStr.includes(filters.general.toLowerCase());

    return matchesFilters && generalMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const allOnPageSelected =
    paginatedItems.length > 0 && paginatedItems.every((item) => selectedIds.has(item.id));
  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
             {filteredItems.length} {filteredItems.length === 1 ? 'Record' : 'Records'}
             {filteredItems.length !== items.length && ` (of ${items.length})`}
           </Badge>
           <Button variant="outline" size="icon" onClick={fetchItems} disabled={loading} className="size-9">
              <RefreshCcw className={cn("size-4 text-muted-foreground", loading && "animate-spin")} />
           </Button>
        </div>
      </div>

      <Card className="border-amber-100/50 shadow-sm">
        <CardHeader className="pb-4">
           <div className="flex flex-col gap-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
               {/* General Search */}
               <div className="relative">
                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                 <Input 
                   placeholder="Tool, User..." 
                   value={filters.general}
                   onChange={(e) => handleFilterChange("general", e.target.value)}
                   className="pl-8 h-9 text-xs"
                 />
               </div>

               {/* Place Search */}
               <div className="relative">
                 <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                 <Input 
                   placeholder="Place/City..." 
                   value={filters.place}
                   onChange={(e) => handleFilterChange("place", e.target.value)}
                   className="pl-8 h-9 text-xs"
                 />
               </div>

               {/* Year Search */}
               <div className="relative">
                 <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                 <Input 
                   type="number"
                   placeholder="Year (e.g. 1993)" 
                   value={filters.year}
                   onChange={(e) => handleFilterChange("year", e.target.value)}
                   className="pl-8 h-9 text-xs"
                 />
               </div>

               {/* Month/Day Row */}
               <div className="grid grid-cols-2 gap-2">
                  <Input 
                    type="number"
                    placeholder="Month" 
                    value={filters.month}
                    onChange={(e) => handleFilterChange("month", e.target.value)}
                    className="h-9 text-xs"
                  />
                  <Input 
                    type="number"
                    placeholder="Day" 
                    value={filters.day}
                    onChange={(e) => handleFilterChange("day", e.target.value)}
                    className="h-9 text-xs"
                  />
               </div>

               {/* Reset Button */}
               <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters}
                className="h-9 gap-2 text-xs font-semibold hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all"
               >
                 <FilterX className="size-3.5" />
                 Reset Filters
               </Button>
             </div>
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
             <div className="space-y-4">
               {selectedIds.size > 0 && (
                 <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                   <div className="text-sm font-medium text-amber-950">
                     {selectedIds.size} record{selectedIds.size === 1 ? "" : "s"} selected
                   </div>
                   <div className="flex flex-wrap items-center gap-2">
                     {!allFilteredSelected && (
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={selectAllFiltered}
                         className="h-8 bg-background text-xs"
                       >
                         Select all {filteredItems.length} filtered
                       </Button>
                     )}
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setSelectedIds(new Set())}
                       className="h-8 text-xs"
                     >
                       Clear selection
                     </Button>
                     <Button
                       variant="destructive"
                       size="sm"
                       onClick={() => setBulkDeleteOpen(true)}
                       className="h-8 gap-1.5 text-xs"
                     >
                       <Trash2 className="size-3.5" />
                       Delete selected
                     </Button>
                   </div>
                 </div>
               )}

               <ToolkitTable
                 items={paginatedItems}
                 onSelect={showDetails}
                 onDelete={handleDelete}
                 selectedIds={selectedIds}
                 allOnPageSelected={allOnPageSelected}
                 onToggleSelected={toggleSelected}
                 onTogglePageSelected={togglePageSelected}
               />
               
               {totalPages > 1 && (
                 <div className="flex items-center justify-between border-t pt-4">
                   <div className="text-xs text-muted-foreground font-medium">
                     Showing <span className="text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-foreground">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> of <span className="text-foreground">{filteredItems.length}</span> records
                   </div>
                   <div className="flex items-center gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                       disabled={currentPage === 1}
                       className="h-8 gap-1 px-2"
                     >
                       <ChevronLeft className="size-4" />
                       <span className="hidden sm:inline">Previous</span>
                     </Button>
                     
                     <div className="flex items-center gap-1">
                       {Array.from({ length: totalPages }, (_, i) => i + 1)
                         .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                         .map((p, i, arr) => {
                           const showDots = i > 0 && p !== arr[i-1] + 1;
                           return (
                             <div key={p} className="flex items-center gap-1">
                               {showDots && <span className="text-muted-foreground px-1">...</span>}
                               <Button
                                 variant={currentPage === p ? "default" : "ghost"}
                                 size="sm"
                                 onClick={() => setCurrentPage(p)}
                                 className={cn(
                                   "h-8 w-8 p-0 font-medium",
                                   currentPage === p ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                                 )}
                               >
                                 {p}
                               </Button>
                             </div>
                           );
                         })}
                     </div>

                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                       disabled={currentPage === totalPages}
                       className="h-8 gap-1 px-2"
                     >
                       <span className="hidden sm:inline">Next</span>
                       <ChevronRight className="size-4" />
                     </Button>
                   </div>
                 </div>
               )}
             </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} selected record{selectedIds.size === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The selected AI response records will be permanently deleted from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkDeleting}
              onClick={(event) => {
                event.preventDefault();
                handleBulkDelete();
              }}
            >
              {bulkDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting
                </>
              ) : (
                "Delete selected"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
