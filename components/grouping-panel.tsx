"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

interface Column {
  id: string
  name: string
  type: string
}

interface GroupingPanelProps {
  columns: Column[]
  groupBy: string
  onGroupByChange: (groupBy: string) => void
  data: any[]
}

export function GroupingPanel({ columns, groupBy, onGroupByChange, data }: GroupingPanelProps) {
  const groupableColumns = columns.filter((col) => col.type === "text" || col.type === "select")

  const getGroupCounts = () => {
    if (!groupBy) return {}

    return data.reduce(
      (counts, row) => {
        const key = row[groupBy] || "Uncategorized"
        counts[key] = (counts[key] || 0) + 1
        return counts
      },
      {} as Record<string, number>,
    )
  }

  const groupCounts = getGroupCounts()

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Group By</CardTitle>
          <CardDescription className="text-xs">Organize your data by column values</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={groupBy} onValueChange={onGroupByChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select column..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              {groupableColumns.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  {column.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {groupBy && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {columns.find((c) => c.id === groupBy)?.name}
              </Badge>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => onGroupByChange("")}>
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {groupBy && Object.keys(groupCounts).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Group Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(groupCounts).map(([group, count]) => (
                <div key={group} className="flex items-center justify-between text-sm">
                  <span className="truncate">{group}</span>
                  <Badge variant="outline" className="text-xs">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
