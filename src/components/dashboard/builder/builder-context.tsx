"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from "react";
import type {
  BlockSlot,
  BlockType,
  DivinerServiceBlock,
  BlocksBySlot,
  BlockTypeConfig,
} from "@/types/landing-page-builder";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SlotConfig {
  slot: BlockSlot;
  label: string;
  description: string;
  max_per_slot: number;
}

interface BuilderState {
  blocks: BlocksBySlot;
  selectedBlockId: string | null;
  blockTypes: BlockTypeConfig[];
  slotConfigs: SlotConfig[];
  divinerUsername: string | null;
  serviceSlug: string | null;
  isPublished: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: Date | null;
  isLoading: boolean;
}

type BuilderAction =
  | { type: "SET_LOADING"; payload: boolean }
  | {
      type: "SET_DATA";
      payload: {
        blocks: BlocksBySlot;
        blockTypes: BlockTypeConfig[];
        slotConfigs: SlotConfig[];
        divinerUsername: string | null;
        serviceSlug: string | null;
        isPublished: boolean;
      };
    }
  | { type: "SELECT_BLOCK"; payload: string | null }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_SAVED"; payload: Date }
  | { type: "SET_UNSAVED"; payload: boolean }
  | { type: "UPDATE_BLOCK"; payload: DivinerServiceBlock }
  | { type: "ADD_BLOCK"; payload: DivinerServiceBlock }
  | { type: "DELETE_BLOCK"; payload: string }
  | { type: "REORDER_SLOT"; payload: { slot: BlockSlot; blocks: DivinerServiceBlock[] } }
  | { type: "SET_PUBLISHED"; payload: boolean };

function insertSorted(list: DivinerServiceBlock[], block: DivinerServiceBlock): DivinerServiceBlock[] {
  return [...list, block].sort((a, b) => a.display_order - b.display_order);
}

function replaceBlock(list: DivinerServiceBlock[], block: DivinerServiceBlock): DivinerServiceBlock[] {
  return list.map((b) => (b.id === block.id ? block : b));
}

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_DATA":
      return {
        ...state,
        blocks: action.payload.blocks,
        blockTypes: action.payload.blockTypes,
        slotConfigs: action.payload.slotConfigs,
        divinerUsername: action.payload.divinerUsername,
        serviceSlug: action.payload.serviceSlug,
        isPublished: action.payload.isPublished,
        isLoading: false,
      };
    case "SELECT_BLOCK":
      return { ...state, selectedBlockId: action.payload };
    case "SET_SAVING":
      return { ...state, isSaving: action.payload };
    case "SET_SAVED":
      return { ...state, isSaving: false, hasUnsavedChanges: false, lastSavedAt: action.payload };
    case "SET_UNSAVED":
      return { ...state, hasUnsavedChanges: action.payload };
    case "ADD_BLOCK": {
      const b = action.payload;
      return {
        ...state,
        blocks:
          b.slot === "about_diviner"
            ? { ...state.blocks, about_diviner: insertSorted(state.blocks.about_diviner, b) }
            : { ...state.blocks, extra: insertSorted(state.blocks.extra, b) },
        selectedBlockId: b.id,
      };
    }
    case "UPDATE_BLOCK": {
      const b = action.payload;
      return {
        ...state,
        blocks: {
          about_diviner: replaceBlock(state.blocks.about_diviner, b),
          extra: replaceBlock(state.blocks.extra, b),
        },
      };
    }
    case "DELETE_BLOCK":
      return {
        ...state,
        blocks: {
          about_diviner: state.blocks.about_diviner.filter((b) => b.id !== action.payload),
          extra: state.blocks.extra.filter((b) => b.id !== action.payload),
        },
        selectedBlockId: state.selectedBlockId === action.payload ? null : state.selectedBlockId,
      };
    case "REORDER_SLOT":
      return {
        ...state,
        blocks:
          action.payload.slot === "about_diviner"
            ? { ...state.blocks, about_diviner: action.payload.blocks }
            : { ...state.blocks, extra: action.payload.blocks },
      };
    case "SET_PUBLISHED":
      return { ...state, isPublished: action.payload };
    default:
      return state;
  }
}

const initialState: BuilderState = {
  blocks: { about_diviner: [], extra: [] },
  selectedBlockId: null,
  blockTypes: [],
  slotConfigs: [],
  divinerUsername: null,
  serviceSlug: null,
  isPublished: false,
  isSaving: false,
  hasUnsavedChanges: false,
  lastSavedAt: null,
  isLoading: true,
};

// ── Context ────────────────────────────────────────────────────────────────────

interface CreateBlockInput {
  slot: BlockSlot;
  section_type: BlockType;
}

interface BuilderContextValue {
  state: BuilderState;
  templateId: string;
  selectBlock: (id: string | null) => void;
  addBlock: (input: CreateBlockInput) => Promise<void>;
  updateBlock: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  toggleBlock: (id: string, enabled: boolean) => Promise<void>;
  reorderSlot: (slot: BlockSlot, orderedIds: string[]) => Promise<void>;
  togglePublished: (desired: boolean) => Promise<void>;
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
          blocks: {
            about_diviner: (json.about_diviner ?? []) as DivinerServiceBlock[],
            extra: (json.extra ?? []) as DivinerServiceBlock[],
          },
          blockTypes: (json.block_types ?? []) as BlockTypeConfig[],
          slotConfigs: (json.slots ?? []) as SlotConfig[],
          divinerUsername: json.diviner?.username ?? null,
          serviceSlug: json.service_template?.slug ?? null,
          isPublished: json.is_published === true,
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

  const selectBlock = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_BLOCK", payload: id });
  }, []);

  const addBlock = useCallback(
    async ({ slot, section_type }: CreateBlockInput) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        const res = await fetch(`/api/dashboard/landing-pages/${templateId}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot, section_type }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.detail ?? err.title ?? "Failed to add block");
          return;
        }
        const { block } = await res.json();
        dispatch({ type: "ADD_BLOCK", payload: block });
        toast.success("Block added");
      } catch {
        toast.error("Network error");
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [templateId],
  );

  const updateBlock = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        const res = await fetch(`/api/dashboard/landing-pages/${templateId}/sections/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.detail ?? err.title ?? "Failed to save block");
          return;
        }
        const { block } = await res.json();
        dispatch({ type: "UPDATE_BLOCK", payload: block });
        dispatch({ type: "SET_SAVED", payload: new Date() });
      } catch {
        toast.error("Network error");
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [templateId],
  );

  const deleteBlock = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/dashboard/landing-pages/${templateId}/sections/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.detail ?? err.title ?? "Cannot delete this block");
          return;
        }
        dispatch({ type: "DELETE_BLOCK", payload: id });
        toast.success("Block removed");
      } catch {
        toast.error("Network error");
      }
    },
    [templateId],
  );

  const toggleBlock = useCallback(
    async (id: string, enabled: boolean) => {
      try {
        const res = await fetch(`/api/dashboard/landing-pages/${templateId}/sections/${id}/toggle`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_enabled: enabled }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.detail ?? err.title ?? "Cannot toggle this block");
          return;
        }
        const { block } = await res.json();
        dispatch({ type: "UPDATE_BLOCK", payload: block });
      } catch {
        toast.error("Network error");
      }
    },
    [templateId],
  );

  const reorderSlot = useCallback(
    async (slot: BlockSlot, orderedIds: string[]) => {
      const current = slot === "about_diviner" ? state.blocks.about_diviner : state.blocks.extra;
      const byId = new Map(current.map((b) => [b.id, b]));
      const nextOrder = orderedIds.map((id, idx) => ({ id, display_order: (idx + 1) * 10 }));
      const optimistic = nextOrder
        .map(({ id, display_order }) => {
          const b = byId.get(id);
          return b ? { ...b, display_order } : null;
        })
        .filter((b): b is DivinerServiceBlock => b !== null);
      dispatch({ type: "REORDER_SLOT", payload: { slot, blocks: optimistic } });

      try {
        const res = await fetch(`/api/dashboard/landing-pages/${templateId}/sections/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot, section_order: nextOrder }),
        });
        if (!res.ok) {
          toast.error("Failed to save order — refreshing");
          await refreshData();
        }
      } catch {
        toast.error("Network error");
        await refreshData();
      }
    },
    [templateId, state.blocks, refreshData],
  );

  const togglePublished = useCallback(
    async (desired: boolean) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        const res = await fetch(`/api/dashboard/landing-pages/${templateId}/toggle-live`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_published: desired }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.detail ?? err.title ?? "Publish toggle failed");
          return;
        }
        const json = await res.json();
        dispatch({ type: "SET_PUBLISHED", payload: json.is_published === true });
        toast.success(json.is_published ? "Landing page is now live" : "Landing page is offline");
      } catch {
        toast.error("Network error");
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [templateId],
  );

  return (
    <BuilderContext.Provider
      value={{
        state,
        templateId,
        selectBlock,
        addBlock,
        updateBlock,
        deleteBlock,
        toggleBlock,
        reorderSlot,
        togglePublished,
        refreshData,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}
