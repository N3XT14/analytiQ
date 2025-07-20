import { create } from "zustand"

interface AppState {
  // Global UI State
  activeTab: string
  isTestRunnerOpen: boolean

  // Global Settings
  theme: "light" | "dark" | "system"
  sidebarCollapsed: boolean

  // Actions
  setActiveTab: (tab: string) => void
  setTestRunnerOpen: (open: boolean) => void
  setTheme: (theme: "light" | "dark" | "system") => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Global notifications/toasts
  notifications: Array<{
    id: string
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
    timestamp: string
  }>
  addNotification: (notification: Omit<AppState["notifications"][0], "id" | "timestamp">) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  activeTab: "dashboard",
  isTestRunnerOpen: false,
  theme: "system",
  sidebarCollapsed: false,
  notifications: [],

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTestRunnerOpen: (open) => set({ isTestRunnerOpen: open }),
  setTheme: (theme) => set({ theme }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Notification actions
  addNotification: (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    }
    set((state) => ({
      notifications: [newNotification, ...state.notifications.slice(0, 4)], // Keep only 5 notifications
    }))
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },

  clearNotifications: () => set({ notifications: [] }),
}))
