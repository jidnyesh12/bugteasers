'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface DashboardLayoutStoreState {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
}

export const useDashboardLayoutStore = create<DashboardLayoutStoreState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      setSidebarOpen: (isOpen) => {
        set({ isSidebarOpen: isOpen });
      },
      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
      },
    }),
    {
      name: 'dashboard-layout-store-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
);