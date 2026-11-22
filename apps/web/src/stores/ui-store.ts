import { create } from 'zustand';

interface UIState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isTableDense: boolean;
  toggleTableDense: () => void;
  activeTabs: Record<string, string>;
  setActiveTab: (pageKey: string, tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  isTableDense: false,
  toggleTableDense: () => set((state) => ({ isTableDense: !state.isTableDense })),
  activeTabs: {},
  setActiveTab: (pageKey, tab) =>
    set((state) => ({
      activeTabs: { ...state.activeTabs, [pageKey]: tab },
    })),
}));
