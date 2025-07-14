import { create } from "zustand"
import { persist } from "zustand/middleware"

interface DashboardData {
  name: string
  value: number
  prevValue: number
}

interface DashboardState {
  // Data
  dataset1: DashboardData[]
  dataset2: DashboardData[]
  timeRange: string

  // UI State
  isFilterOpen: boolean
  selectedComparison: "absolute" | "percentage" | "both"
  selectedGranularity: "hourly" | "daily" | "weekly" | "monthly"
  selectedSources: string[]

  // Actions
  setDataset1: (data: DashboardData[]) => void
  setDataset2: (data: DashboardData[]) => void
  setTimeRange: (range: string) => void
  setFilterOpen: (open: boolean) => void
  setSelectedComparison: (comparison: "absolute" | "percentage" | "both") => void
  setSelectedGranularity: (granularity: "hourly" | "daily" | "weekly" | "monthly") => void
  setSelectedSources: (sources: string[]) => void

  // Computed
  getStats1: () => { total: number; change: number; average: number }
  getStats2: () => { total: number; change: number; average: number }
  getComparisonData: () => Array<{
    period: string
    dataset1Value: number
    dataset2Value: number
    difference: number
    percentDifference: string
  }>
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial data
      dataset1: [
        { name: "Jan", value: 400, prevValue: 240 },
        { name: "Feb", value: 300, prevValue: 139 },
        { name: "Mar", value: 200, prevValue: 980 },
        { name: "Apr", value: 278, prevValue: 390 },
        { name: "May", value: 189, prevValue: 480 },
        { name: "Jun", value: 239, prevValue: 380 },
        { name: "Jul", value: 349, prevValue: 430 },
      ],
      dataset2: [
        { name: "Jan", value: 240, prevValue: 400 },
        { name: "Feb", value: 139, prevValue: 300 },
        { name: "Mar", value: 980, prevValue: 200 },
        { name: "Apr", value: 390, prevValue: 278 },
        { name: "May", value: 480, prevValue: 189 },
        { name: "Jun", value: 380, prevValue: 239 },
        { name: "Jul", value: 430, prevValue: 349 },
      ],
      timeRange: "7d",
      isFilterOpen: false,
      selectedComparison: "absolute",
      selectedGranularity: "daily",
      selectedSources: ["Source 1", "Source 2"],

      // Actions
      setDataset1: (data) => set({ dataset1: data }),
      setDataset2: (data) => set({ dataset2: data }),
      setTimeRange: (range) => set({ timeRange: range }),
      setFilterOpen: (open) => set({ isFilterOpen: open }),
      setSelectedComparison: (comparison) => set({ selectedComparison: comparison }),
      setSelectedGranularity: (granularity) => set({ selectedGranularity: granularity }),
      setSelectedSources: (sources) => set({ selectedSources: sources }),

      // Computed values
      getStats1: () => {
        const { dataset1 } = get()
        const total = dataset1.reduce((sum, item) => sum + item.value, 0)
        const prevTotal = dataset1.reduce((sum, item) => sum + item.prevValue, 0)
        const change = ((total - prevTotal) / prevTotal) * 100
        const average = total / dataset1.length
        return { total, change, average }
      },

      getStats2: () => {
        const { dataset2 } = get()
        const total = dataset2.reduce((sum, item) => sum + item.value, 0)
        const prevTotal = dataset2.reduce((sum, item) => sum + item.prevValue, 0)
        const change = ((total - prevTotal) / prevTotal) * 100
        const average = total / dataset2.length
        return { total, change, average }
      },

      getComparisonData: () => {
        const { dataset1, dataset2 } = get()
        return dataset1.map((item, index) => {
          const dataset2Item = dataset2[index]
          const diff = item.value - dataset2Item.value
          const percentDiff = ((diff / dataset2Item.value) * 100).toFixed(1)

          return {
            period: item.name,
            dataset1Value: item.value,
            dataset2Value: dataset2Item.value,
            difference: diff,
            percentDifference: percentDiff,
          }
        })
      },
    }),
    {
      name: "dashboard-storage",
      partialize: (state) => ({
        dataset1: state.dataset1,
        dataset2: state.dataset2,
        timeRange: state.timeRange,
        selectedComparison: state.selectedComparison,
        selectedGranularity: state.selectedGranularity,
        selectedSources: state.selectedSources,
      }),
    },
  ),
)
