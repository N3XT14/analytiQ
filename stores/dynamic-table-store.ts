import { create } from "zustand"
import { persist } from "zustand/middleware"

type ColumnType = "text" | "number" | "date" | "select" | "boolean" | "longtext"

interface Column {
  id: string
  name: string
  type: ColumnType
  width?: number
  options?: string[]
}

interface TableData {
  [key: string]: any
}

interface DynamicTableState {
  // Data
  data: TableData[]
  columns: Column[]
  groupBy: string

  // UI State
  showGrouping: boolean
  isImportOpen: boolean
  isAddColumnOpen: boolean

  // Form State
  newColumn: Partial<Column>

  // Actions
  setData: (data: TableData[]) => void
  setColumns: (columns: Column[]) => void
  addRow: () => void
  deleteRow: (index: number) => void
  updateCell: (rowIndex: number, columnId: string, value: any) => void
  addColumn: (column: Omit<Column, "id">) => void
  deleteColumn: (columnId: string) => void
  setGroupBy: (groupBy: string) => void
  setShowGrouping: (show: boolean) => void
  setImportOpen: (open: boolean) => void
  setAddColumnOpen: (open: boolean) => void
  setNewColumn: (column: Partial<Column>) => void

  // Import/Export
  importData: (importedData: TableData[], importedColumns: Column[]) => void
  exportToCSV: () => string
  exportToJSON: () => string
  exportToMarkdown: () => string
  exportToHTML: () => string

  // Computed
  getGroupedData: () => Record<string, TableData[]>
  getGroupCounts: () => Record<string, number>
  getStats: () => {
    totalRows: number
    totalColumns: number
    groupCount: number
  }
}

export const useDynamicTableStore = create<DynamicTableState>()(
  persist(
    (set, get) => ({
      // Initial state with sample data
      data: [
        {
          id: 1,
          prompt: "Explain quantum computing",
          model: "GPT-4",
          response:
            "Quantum computing is a revolutionary computing paradigm that leverages the principles of quantum mechanics...",
          tokens: 1247,
          cost: 0.0234,
          rating: 4.8,
          timestamp: "2024-01-15T10:30:00Z",
          category: "Science",
        },
        {
          id: 2,
          prompt: "Write a marketing email for a new product",
          model: "Claude-3",
          response: "Subject: 🚀 Introducing the GameChanger Pro - Your Productivity Just Got an Upgrade!...",
          tokens: 892,
          cost: 0.0156,
          rating: 4.5,
          timestamp: "2024-01-14T14:22:00Z",
          category: "Marketing",
        },
      ],
      columns: [],
      groupBy: "",
      showGrouping: false,
      isImportOpen: false,
      isAddColumnOpen: false,
      newColumn: {},

      // Actions
      setData: (data) => set({ data }),
      setColumns: (columns) => set({ columns }),

      addRow: () => {
        const { columns, data } = get()
        const newRow: TableData = {}
        columns.forEach((col) => {
          switch (col.type) {
            case "number":
              newRow[col.id] = 0
              break
            case "boolean":
              newRow[col.id] = false
              break
            case "date":
              newRow[col.id] = new Date().toISOString().split("T")[0]
              break
            default:
              newRow[col.id] = ""
          }
        })
        newRow.id = Math.max(...data.map((d) => d.id || 0)) + 1
        set({ data: [...data, newRow] })
      },

      deleteRow: (index) => {
        const { data } = get()
        set({ data: data.filter((_, i) => i !== index) })
      },

      updateCell: (rowIndex, columnId, value) => {
        const { data } = get()
        const newData = [...data]
        newData[rowIndex][columnId] = value
        set({ data: newData })
      },

      addColumn: (column) => {
        const { columns, data } = get()
        const newColumn: Column = {
          ...column,
          id: column.name?.toLowerCase().replace(/\s+/g, "_") || `col_${Date.now()}`,
        }

        const defaultValue = newColumn.type === "number" ? 0 : newColumn.type === "boolean" ? false : ""

        const updatedData = data.map((row) => ({
          ...row,
          [newColumn.id]: defaultValue,
        }))

        set({
          columns: [...columns, newColumn],
          data: updatedData,
        })
      },

      deleteColumn: (columnId) => {
        const { columns, data } = get()
        const updatedColumns = columns.filter((col) => col.id !== columnId)
        const updatedData = data.map((row) => {
          const newRow = { ...row }
          delete newRow[columnId]
          return newRow
        })

        set({
          columns: updatedColumns,
          data: updatedData,
        })
      },

      setGroupBy: (groupBy) => set({ groupBy }),
      setShowGrouping: (show) => set({ showGrouping: show }),
      setImportOpen: (open) => set({ isImportOpen: open }),
      setAddColumnOpen: (open) => set({ isAddColumnOpen: open }),
      setNewColumn: (column) => set({ newColumn: column }),

      // Import/Export
      importData: (importedData, importedColumns) => {
        set({
          data: importedData,
          columns: importedColumns,
        })
      },

      exportToCSV: () => {
        const { data, columns } = get()
        const headers = columns.map((col) => col.name).join(",")
        const rows = data
          .map((row) =>
            columns
              .map((col) => {
                const value = row[col.id]
                if (typeof value === "string" && (value.includes(",") || value.includes("\n") || value.includes('"'))) {
                  return `"${value.replace(/"/g, '""')}"`
                }
                return value
              })
              .join(","),
          )
          .join("\n")

        return `${headers}\n${rows}`
      },

      exportToJSON: () => {
        const { data, columns } = get()
        const exportData = {
          metadata: {
            exportDate: new Date().toISOString(),
            totalRows: data.length,
            totalColumns: columns.length,
            columns: columns.map((col) => ({
              id: col.id,
              name: col.name,
              type: col.type,
              options: col.options,
            })),
          },
          data: data,
        }

        return JSON.stringify(exportData, null, 2)
      },

      exportToMarkdown: () => {
        const { data, columns } = get()
        const headers = "| " + columns.map((col) => col.name).join(" | ") + " |"
        const separator = "| " + columns.map(() => "---").join(" | ") + " |"

        const rows = data
          .map(
            (row) =>
              "| " +
              columns
                .map((col) => {
                  const value = row[col.id]
                  if (typeof value === "string" && value.length > 50) {
                    return value.substring(0, 47) + "..."
                  }
                  return value || ""
                })
                .join(" | ") +
              " |",
          )
          .join("\n")

        return `# Table Export\n\nExported on: ${new Date().toLocaleString()}\n\n${headers}\n${separator}\n${rows}`
      },

      exportToHTML: () => {
        const { data, columns } = get()
        const tableRows = data
          .map(
            (row) =>
              "<tr>" +
              columns
                .map((col) => {
                  const value = row[col.id]
                  if (col.type === "longtext" && typeof value === "string") {
                    return `<td><div style="max-height: 100px; overflow-y: auto; white-space: pre-wrap;">${value}</div></td>`
                  }
                  return `<td>${value || ""}</td>`
                })
                .join("") +
              "</tr>",
          )
          .join("")

        return `
<!DOCTYPE html>
<html>
<head>
    <title>Table Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .export-info { margin-bottom: 20px; color: #666; }
    </style>
</head>
<body>
    <div class="export-info">
        <h1>Table Export</h1>
        <p>Exported on: ${new Date().toLocaleString()}</p>
        <p>Total rows: ${data.length} | Total columns: ${columns.length}</p>
    </div>
    <table>
        <thead>
            <tr>${columns.map((col) => `<th>${col.name}</th>`).join("")}</tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
</body>
</html>`
      },

      // Computed values
      getGroupedData: () => {
        const { data, groupBy } = get()
        if (!groupBy) {
          return { "All Items": data }
        }

        return data.reduce(
          (groups, row) => {
            const key = row[groupBy] || "Uncategorized"
            if (!groups[key]) {
              groups[key] = []
            }
            groups[key].push(row)
            return groups
          },
          {} as Record<string, TableData[]>,
        )
      },

      getGroupCounts: () => {
        const { data, groupBy } = get()
        if (!groupBy) return {}

        return data.reduce(
          (counts, row) => {
            const key = row[groupBy] || "Uncategorized"
            counts[key] = (counts[key] || 0) + 1
            return counts
          },
          {} as Record<string, number>,
        )
      },

      getStats: () => {
        const { data, columns } = get()
        const groupedData = get().getGroupedData()
        return {
          totalRows: data.length,
          totalColumns: columns.length,
          groupCount: Object.keys(groupedData).length,
        }
      },
    }),
    {
      name: "dynamic-table-storage",
      partialize: (state) => ({
        data: state.data,
        columns: state.columns,
        groupBy: state.groupBy,
      }),
    },
  ),
)
