"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from "react";
import type { ServiceLandingPage, LandingPageSection } from "@/types/landing-page-builder";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AvailableSectionType {
  type: string;
  label: string;
  description: string;
  icon: string;
  category: "content" | "media" | "engagement" | "navigation";
  is_globally_enabled: boolean;
  remaining_slots: number;
}

interface BuilderState {
  landingPage: ServiceLandingPage | null;
  sections: LandingPageSection[];
  selectedSectionId: string | null;
  availableSectionTypes: AvailableSectionType[];
  divinerUsername: string | null;
  serviceSlug: string | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: Date | null;
  isLoading: boolean;
}

type BuilderAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_DATA"; payload: { page: ServiceLandingPage; sections: LandingPageSection[]; available: AvailableSectionType[]; divinerUsername: string | null; serviceSlug: string | null } }
  | { type: "SELECT_SECTION"; payload: string | null }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_SAVED"; payload: Date }
  | { type: "SET_UNSAVED"; payload: boolean }
  | { type: "UPDATE_SECTION"; payload: LandingPageSection }
  | { type: "ADD_SECTION"; payload: LandingPageSection }
  | { type: "DELETE_SECTION"; payload: string }
  | { type: "REORDER_SECTIONS"; payload: LandingPageSection[] }
  | { type: "UPDATE_PAGE"; payload: Partial<ServiceLandingPage> };

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_DATA":
      return {
        ...state,
        landingPage: action.payload.page,
        sections: action.payload.sections,
        availableSectionTypes: action.payload.available,
        divinerUsername: action.payload.divinerUsername,
        serviceSlug: action.payload.serviceSlug,
        isLoading: false,
      };
    case "SELECT_SECTION":
      return { ...state, selectedSectionId: action.payload };
    case "SET_SAVING":
      return { ...state, isSaving: action.payload };
    case "SET_SAVED":
      return { ...state, isSaving: false, hasUnsavedChanges: false, lastSavedAt: action.payload };
    case "SET_UNSAVED":
      return { ...state, hasUnsavedChanges: action.payload };
    case "UPDATE_SECTION":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case "ADD_SECTION":
      return {
        ...state,
        sections: [...state.sections, action.payload].sort((a, b) => a.display_order - b.display_order),
        selectedSectionId: action.payload.id,
      };
    case "DELETE_SECTION":
      return {
        ...state,
        sections: state.sections.filter((s) => s.id !== action.payload),
        selectedSectionId: state.selectedSectionId === action.payload ? null : state.selectedSectionId,
      };
    case "REORDER_SECTIONS":
      return { ...state, sections: action.payload };
    case "UPDATE_PAGE":
      return {
        ...state,
        landingPage: state.landingPage ? { ...state.landingPage, ...action.payload } : null,
      };
    default:
      return state;
  }
}

const initialState: BuilderState = {
  landingPage: null,
  sections: [],
  selectedSectionId: null,
  availableSectionTypes: [],
  divinerUsername: null,
  serviceSlug: null,
  isSaving: false,
  hasUnsavedChanges: false,
  lastSavedAt: null,
  isLoading: true,
};

// ── Context ────────────────────────────────────────────────────────────────────

interface BuilderContextValue {
  state: BuilderState;
  templateId: string;
  selectSection: (id: string | null) => void;
  addSection: (sectionType: string) => Promise<void>;
  updateSection: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  toggleSection: (id: string, enabled: boolean) => Promise<void>;
  reorderSections: (orderedSections: { id: string; display_order: number }[]) => Promise<void>;
  publishPage: () => Promise<boolean>;
  unpublishPage: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used inside BuilderProvider");
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function BuilderProvider({ templateId, children }: { templateId: string; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(builderReducer, initialState);
  const unloadRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    unloadRef.current = handler;
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.hasUnsavedChanges]);

  const refreshData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await fetch(`/api/dashboard/landing-pages/${templateId}/sections`);
      if (!res.ok) {
        toast.error("Failed to load builder data");
        return;
      }
      const json = await res.json();
      dispatch({
        type: "SET_DATA",
        payload: {
          page: json.landing_page,
          sections: json.sections,
          available: json.available_section_types,
          divinerUsername: json.diviner?.username ?? null,
          serviceSlug: json.service_template?.slug ?? null,
        },
      });
    } catch {
      toast.error("Network error loading builder");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [templateId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const selectSection = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_SECTION", payload: id });
  }, []);

  const addSection = useCallback(async (sectionType: string) => {
    dispatch({ type: "SET_SAVING", payload: true });
    try {
      const res = await fetch(`/api/dashboard/landing-pages/${templateId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_type: sectionType }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Failed to add section");
        return;
      }
      const { section } = await res.json();
      dispatch({ type: "ADD_SECTION", payload: section });
      toast.success(`${sectionType.replace(/_/g, " ")} section added`);
    } catch {
      toast.error("Network error");
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
      // Refresh to get updated available_section_types
      await refreshData();
    }
  }, [templateId, refreshData]);

  const updateSection = useCallback(async (id: string, data: Record<string, unknown>) => {
    dispatch({ type: "SET_SAVING", payload: true });
    try {
      const res = await fetch(`/api/dashboard/landing-pages/${templateId}/sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Failed to save section");
        return;
      }
      const { section } = await res.json();
      dispatch({ type: "UPDATE_SECTION", payload: section });
      dispatch({ type: "SET_SAVED", payload: new Date() });
      toast.success("Section saved");
    } catch {
      toast.error("Network error");
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  }, [templateId]);

  const deleteSection = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/landing-pages/${templateId}/sections/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Cannot delete this section");
        return;
      }
      dispatch({ type: "DELETE_SECTION", payload: id });
      toast.success("Section removed");
      await refreshData();
    } catch {
      toast.error("Network error");
    }
  }, [templateId, refreshData]);

  const toggleSection = useCallback(async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/landing-pages/${templateId}/sections/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: enabled }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Cannot toggle this section");
        return;
      }
      const { section } = await res.json();
      dispatch({ type: "UPDATE_SECTION", payload: section });
    } catch {
      toast.error("Network error");
    }
  }, [templateId]);

  const reorderSections = useCallback(async (ordered: { id: string; display_order: number }[]) => {
    // Optimistic update
    const newSections = [...state.sections];
    for (const item of ordered) {
      const idx = newSections.findIndex((s) => s.id === item.id);
      if (idx >= 0) {
        newSections[idx] = { ...newSections[idx], display_order: item.display_order };
      }
    }
    newSections.sort((a, b) => a.display_order - b.display_order);
    dispatch({ type: "REORDER_SECTIONS", payload: newSections });

    try {
      const res = await fetch(`/api/dashboard/landing-pages/${templateId}/sections/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_order: ordered }),
      });
      if (!res.ok) {
        toast.error("Failed to save order — refreshing");
        await refreshData();
      }
    } catch {
      toast.error("Network error");
      await refreshData();
    }
  }, [templateId, state.sections, refreshData]);

  const publishPage = useCallback(async (): Promise<boolean> => {
    dispatch({ type: "SET_SAVING", payload: true });
    try {
      const res = await fetch(`/api/dashboard/landing-pages/${templateId}/publish`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail ?? "Publish failed");
        return false;
      }
      toast.success("Landing page published!");
      await refreshData();
      return true;
    } catch {
      toast.error("Network error");
      return false;
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  }, [templateId, refreshData]);

  const unpublishPage = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/landing-pages/${templateId}/unpublish`, { method: "POST" });
      if (!res.ok) {
        toast.error("Unpublish failed");
        return;
      }
      toast.success("Landing page unpublished");
      await refreshData();
    } catch {
      toast.error("Network error");
    }
  }, [templateId, refreshData]);

  return (
    <BuilderContext.Provider
      value={{
        state,
        templateId,
        selectSection,
        addSection,
        updateSection,
        deleteSection,
        toggleSection,
        reorderSections,
        publishPage,
        unpublishPage,
        refreshData,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}
