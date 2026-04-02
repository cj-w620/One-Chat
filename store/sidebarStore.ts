/**
 * 侧边栏状态管理
 */

import { create } from 'zustand'

interface SidebarStore {
  isCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isCollapsed: false,
  toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ isCollapsed: collapsed }),
}))