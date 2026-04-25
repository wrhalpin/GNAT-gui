import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PanelLayout {
  sidebarWidth: number;
  rulesPaletteWidth: number;
  detailDrawerWidth: number;
}

interface RecentItem {
  id: string;
  type: "investigation" | "rule";
  label: string;
  visitedAt: string;
}

interface UIState {
  layout: PanelLayout;
  recentItems: RecentItem[];
  setLayout: (patch: Partial<PanelLayout>) => void;
  addRecentItem: (item: Omit<RecentItem, "visitedAt">) => void;
  clearRecent: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      layout: {
        sidebarWidth: 224,
        rulesPaletteWidth: 256,
        detailDrawerWidth: 320,
      },
      recentItems: [],
      setLayout: (patch) =>
        set((s) => ({ layout: { ...s.layout, ...patch } })),
      addRecentItem: (item) =>
        set((s) => {
          const filtered = s.recentItems.filter((r) => r.id !== item.id);
          return {
            recentItems: [
              { ...item, visitedAt: new Date().toISOString() },
              ...filtered,
            ].slice(0, 20),
          };
        }),
      clearRecent: () => set({ recentItems: [] }),
    }),
    { name: "gnat-ui" }
  )
);
