"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UploadIcon, AlertCircleIcon } from "lucide-react"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: any[], columns: any[]) => void
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [importData, setImportData] = useState("")
  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv")
  const [error, setError] = useState("")

  const handleImport = () => {
    try {
      setError("")

      if (importFormat === "csv") {
        const lines = importData.trim().split("\n")
        if (lines.length < 2) {
          throw new Error("CSV must have at least a header row and one data row")
        }

        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
        const rows = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
          const row: any = { id: Math.random() }
          headers.forEach((header, index) => {
            const value = values[index] || ""
            const numValue = Number(value)
            row[header.toLowerCase().replace(/\s+/g, "_")] = isNaN(numValue) ? value : numValue
          })
          return row
        })

        const columns = headers.map((header) => ({
          id: header.toLowerCase().replace(/\s+/g, "_"),
          name: header,
          type: "text" as const,
        }))

        onImport(rows, columns)
      } else if (importFormat === "json") {
        const parsed = JSON.parse(importData)

        if (Array.isArray(parsed)) {
          // Direct array of objects
          if (parsed.length === 0) {
            throw new Error("JSON array cannot be empty")
          }

          const firstItem = parsed[0]
          const columns = Object.keys(firstItem).map((key) => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            type:
              typeof firstItem[key] === "number"
                ? ("number" as const)
                : typeof firstItem[key] === "boolean"
                  ? ("boolean" as const)
                  : key.toLowerCase().includes("date")
                    ? ("date" as const)
                    : typeof firstItem[key] === "string" && firstItem[key].length > 100
                      ? ("longtext" as const)
                      : ("text" as const),
          }))

          const dataWithIds = parsed.map((item, index) => ({ ...item, id: item.id || index + 1 }))
          onImport(dataWithIds, columns)
        } else if (parsed.data && Array.isArray(parsed.data)) {
          // Structured export format
          const columns =
            parsed.metadata?.columns ||
            Object.keys(parsed.data[0]).map((key: string) => ({
              id: key,
              name: key.charAt(0).toUpperCase() + key.slice(1),
              type: "text" as const,
            }))

          onImport(parsed.data, columns)
        } else {
          throw new Error("JSON must be an array of objects or have a 'data' property with an array")
        }
      }

      onOpenChange(false)
      setImportData("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse import data")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadIcon className="h-5 w-5" />
            Import Data
          </DialogTitle>
          <DialogDescription>Import data from CSV or JSON format to populate your table</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="import-format">Import Format</Label>
            <Select value={importFormat} onValueChange={(value: "csv" | "json") => setImportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="import-data">Data</Label>
            <Textarea
              id="import-data"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder={
                importFormat === "csv"
                  ? "name,email,age\nJohn Doe,john@example.com,30\nJane Smith,jane@example.com,25"
                  : '[\n  {"name": "John Doe", "email": "john@example.com", "age": 30},\n  {"name": "Jane Smith", "email": "jane@example.com", "age": 25}\n]'
              }
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!importData.trim()}>
            Import Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
