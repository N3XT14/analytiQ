import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"

type DataItem = {
  name: string
  value: number
  prevValue: number
}

interface ComparisonTableProps {
  dataset1: DataItem[]
  dataset2: DataItem[]
}

export function ComparisonTable({ dataset1, dataset2 }: ComparisonTableProps) {
  // Combine datasets for comparison
  const comparisonData = dataset1.map((item, index) => {
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

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Dataset A</TableHead>
            <TableHead className="text-right">Dataset B</TableHead>
            <TableHead className="text-right">Difference</TableHead>
            <TableHead className="text-right">% Difference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comparisonData.map((row) => (
            <TableRow key={row.period}>
              <TableCell className="font-medium">{row.period}</TableCell>
              <TableCell className="text-right">{row.dataset1Value.toLocaleString()}</TableCell>
              <TableCell className="text-right">{row.dataset2Value.toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {row.difference > 0 ? (
                    <ArrowUpIcon className="h-3 w-3 text-emerald-500" />
                  ) : row.difference < 0 ? (
                    <ArrowDownIcon className="h-3 w-3 text-rose-500" />
                  ) : (
                    <MinusIcon className="h-3 w-3 text-muted-foreground" />
                  )}
                  {Math.abs(row.difference).toLocaleString()}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    row.difference > 0
                      ? "text-emerald-500"
                      : row.difference < 0
                        ? "text-rose-500"
                        : "text-muted-foreground"
                  }
                >
                  {row.difference > 0 ? "+" : row.difference < 0 ? "-" : ""}
                  {Math.abs(Number.parseFloat(row.percentDifference))}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
