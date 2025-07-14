"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  PlusIcon,
  MoreHorizontalIcon,
  TrashIcon,
  GripVerticalIcon,
  GroupIcon,
  UploadIcon,
} from "lucide-react"
import { EditableCell } from "@/components/editable-cell"
import { GroupingPanel } from "@/components/grouping-panel"
import { ImportDialog } from "@/components/import-dialog"

const sampleData = [
  {
    "id": 1,
    "Test Case": "HSPX - Lennox",
    "Column 1": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates perferendis iure, amet velit accusantium dolores tempore excepturi sit, at odio, vitae et reiciendis alias cumque cum mollitia? Nemo, ab? Fugit.",
    "Column 2": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates perferendis iure, amet velit accusantium dolores tempore excepturi sit, at odio, vitae et reiciendis alias cumque cum mollitia? Nemo, ab? Fugit."
  }
]

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

export default function DynamicTable() {
  const [data, setData] = useState<TableData[]>(sampleData)
  const [columns, setColumns] = useState<Column[]>([])
  const [newColumn, setNewColumn] = useState<Partial<Column>>({})
  const [groupBy, setGroupBy] = useState<string>("")
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [showGrouping, setShowGrouping] = useState(false)

  const initializeColumns = useCallback(() => {
    if (data.length > 0 && columns.length === 0) {
      const firstRow = data[0]
      const detectedColumns: Column[] = Object.keys(firstRow).map((key) => {
        const value = firstRow[key]
        let type: ColumnType = "text"

        if (typeof value === "number") {
          type = "number"
        } else if (typeof value === "boolean") {
          type = "boolean"
        } else if (key.toLowerCase().includes("date") || key.toLowerCase().includes("timestamp")) {
          type = "date"
        } else if (key === "status" || key === "category" || key === "model") {
          // Detect potential select fields
          const uniqueValues = [...new Set(data.map((row) => row[key]))]
          if (uniqueValues.length <= 10) {
            type = "select"
            return {
              id: key,
              name: key.charAt(0).toUpperCase() + key.slice(1),
              type,
              options: uniqueValues,
            }
          }
        } else if (key === "response" || key === "prompt" || (typeof value === "string" && value.length > 100)) {
          // Detect long text fields (LLM outputs)
          type = "longtext"
        }

        return {
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          type,
        }
      })
      setColumns(detectedColumns)
    }
  }, [data, columns.length])

  // Initialize columns on component mount
  useState(() => {
    initializeColumns()
  })

  const addRow = () => {
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
    setData([...data, newRow])
  }

  const deleteRow = (index: number) => {
    setData(data.filter((_, i) => i !== index))
  }

  const addColumn = () => {
    if (newColumn.name && newColumn.type) {
      const column: Column = {
        id: newColumn.name.toLowerCase().replace(/\s+/g, "_"),
        name: newColumn.name,
        type: newColumn.type,
        options: newColumn.options,
      }

      setColumns([...columns, column])

      // Add default value to all existing rows
      const defaultValue = column.type === "number" ? 0 : column.type === "boolean" ? false : ""

      setData(
        data.map((row) => ({
          ...row,
          [column.id]: defaultValue,
        })),
      )

      setNewColumn({})
      setIsAddColumnOpen(false)
    }
  }

  const deleteColumn = (columnId: string) => {
    setColumns(columns.filter((col) => col.id !== columnId))
    setData(
      data.map((row) => {
        const newRow = { ...row }
        delete newRow[columnId]
        return newRow
      }),
    )
  }

  const updateCell = (rowIndex: number, columnId: string, value: any) => {
    const newData = [...data]
    newData[rowIndex][columnId] = value
    setData(newData)
  }

  const handleImport = (importedData: any[], importedColumns: any[]) => {
    setData(importedData)
    setColumns(importedColumns)
  }

  const groupedData = groupBy
    ? data.reduce(
        (groups, row) => {
          const key = row[groupBy]
          if (!groups[key]) {
            groups[key] = []
          }
          groups[key].push(row)
          return groups
        },
        {} as Record<string, TableData[]>,
      )
    : { "All Items": data }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex flex-1 items-center gap-2">
          <h1 className="text-xl font-semibold">Dynamic Table Editor</h1>
          <Badge variant="secondary">{data.length} rows</Badge>
          <Badge variant="outline">{columns.length} columns</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
          >
            <UploadIcon className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGrouping(!showGrouping)}
          >
            <GroupIcon className="h-4 w-4 mr-2" />
            Group
          </Button>
          <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Column</DialogTitle>
                <DialogDescription>
                  Create a new column for your table
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="column-name">Column Name</Label>
                  <Input
                    id="column-name"
                    value={newColumn.name || ""}
                    onChange={(e) =>
                      setNewColumn({ ...newColumn, name: e.target.value })
                    }
                    placeholder="Enter column name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="column-type">Column Type</Label>
                  <Select
                    value={newColumn.type || ""}
                    onValueChange={(value: ColumnType) =>
                      setNewColumn({ ...newColumn, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="longtext">Long Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newColumn.type === "select" && (
                  <div className="grid gap-2">
                    <Label htmlFor="column-options">
                      Options (comma-separated)
                    </Label>
                    <Input
                      id="column-options"
                      value={newColumn.options?.join(", ") || ""}
                      onChange={(e) =>
                        setNewColumn({
                          ...newColumn,
                          options: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={addColumn}>Add Column</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={addRow} size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {showGrouping && (
          <div className="w-64 border-r bg-muted/10">
            <GroupingPanel columns={columns} groupBy={groupBy} onGroupByChange={setGroupBy} data={data} />
          </div>
        )}

        <main className="flex-1 p-4 md:p-6">
          <div className="space-y-6">
            {Object.entries(groupedData).map(([groupName, groupData]) => (
              <Card key={groupName}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {groupBy ? `${columns.find((c) => c.id === groupBy)?.name}: ${groupName}` : groupName}
                      </CardTitle>
                      <CardDescription>
                        {groupData.length} item{groupData.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="w-8"></th>
                          {columns.map((column) => (
                            <th key={column.id} className="text-left p-2 font-medium">
                              <div className="flex items-center gap-2">
                                <span>{column.name}</span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <MoreHorizontalIcon className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuItem
                                      onClick={() => deleteColumn(column.id)}
                                      className="text-destructive"
                                    >
                                      <TrashIcon className="h-4 w-4 mr-2" />
                                      Delete Column
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groupData.map((row: any, rowIndex: any) => {
                          const actualRowIndex = data.findIndex((d) => d.id === row.id)
                          return (
                            <tr key={row.id || rowIndex} className="border-b hover:bg-muted/50 h-20">
                              <td className="p-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <GripVerticalIcon className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuItem
                                      onClick={() => deleteRow(actualRowIndex)}
                                      className="text-destructive"
                                    >
                                      <TrashIcon className="h-4 w-4 mr-2" />
                                      Delete Row
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                              {columns.map((column) => (
                                <td key={column.id} className="p-2">
                                  <EditableCell
                                    value={row[column.id]}
                                    type={column.type}
                                    options={column.options}
                                    onChange={(value) => updateCell(actualRowIndex, column.id, value)}
                                  />
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
      <ImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} onImport={handleImport} />
    </div>
  );
}
