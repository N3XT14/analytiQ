"use client"

import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ArrowDownIcon, ArrowUpIcon, FilterIcon, RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ComparisonTable } from "@/components/comparison-table"
import { FilterDrawer } from "@/components/filter-drawer"

// Sample data for demonstration
const data1 = [
  { name: "Jan", value: 400, prevValue: 240 },
  { name: "Feb", value: 300, prevValue: 139 },
  { name: "Mar", value: 200, prevValue: 980 },
  { name: "Apr", value: 278, prevValue: 390 },
  { name: "May", value: 189, prevValue: 480 },
  { name: "Jun", value: 239, prevValue: 380 },
  { name: "Jul", value: 349, prevValue: 430 },
]

const data2 = [
  { name: "Jan", value: 240, prevValue: 400 },
  { name: "Feb", value: 139, prevValue: 300 },
  { name: "Mar", value: 980, prevValue: 200 },
  { name: "Apr", value: 390, prevValue: 278 },
  { name: "May", value: 480, prevValue: 189 },
  { name: "Jun", value: 380, prevValue: 239 },
  { name: "Jul", value: 430, prevValue: 349 },
]

export default function Dashboard() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [timeRange, setTimeRange] = useState("7d")
  const [dataset1, setDataset1] = useState(data1)
  const [dataset2, setDataset2] = useState(data2)

  // Calculate summary statistics
  const calculateStats = (data: typeof data1) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const prevTotal = data.reduce((sum, item) => sum + item.prevValue, 0)
    const change = ((total - prevTotal) / prevTotal) * 100
    return { total, change }
  }

  const stats1 = calculateStats(dataset1)
  const stats2 = calculateStats(dataset2)

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex flex-1 items-center gap-2">
          <h1 className="text-xl font-semibold">Results Analysis Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setIsFilterOpen(true)}>
            <FilterIcon className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
          <Button variant="outline" size="icon">
            <RefreshCwIcon className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Dataset A</CardTitle>
              <CardDescription>Performance metrics for Dataset A</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-muted-foreground">Total Value</div>
                  <div className="text-2xl font-bold">{stats1.total.toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {stats1.change > 0 ? (
                      <>
                        <ArrowUpIcon className="h-3 w-3 text-emerald-500" />
                        <span className="text-emerald-500">{stats1.change.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownIcon className="h-3 w-3 text-rose-500" />
                        <span className="text-rose-500">{Math.abs(stats1.change).toFixed(1)}%</span>
                      </>
                    )}
                    <span className="text-muted-foreground">vs previous period</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-muted-foreground">Average</div>
                  <div className="text-2xl font-bold">{(stats1.total / dataset1.length).toFixed(1)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Dataset B</CardTitle>
              <CardDescription>Performance metrics for Dataset B</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-muted-foreground">Total Value</div>
                  <div className="text-2xl font-bold">{stats2.total.toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {stats2.change > 0 ? (
                      <>
                        <ArrowUpIcon className="h-3 w-3 text-emerald-500" />
                        <span className="text-emerald-500">{stats2.change.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownIcon className="h-3 w-3 text-rose-500" />
                        <span className="text-rose-500">{Math.abs(stats2.change).toFixed(1)}%</span>
                      </>
                    )}
                    <span className="text-muted-foreground">vs previous period</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-muted-foreground">Average</div>
                  <div className="text-2xl font-bold">{(stats2.total / dataset2.length).toFixed(1)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <Tabs defaultValue="bar">
                <div className="flex items-center justify-between">
                  <CardTitle>Dataset A Visualization</CardTitle>
                  <TabsList>
                    <TabsTrigger value="bar">Bar</TabsTrigger>
                    <TabsTrigger value="line">Line</TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="bar">
                <TabsContent value="bar" className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataset1}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Current" fill="#6366f1" />
                      <Bar dataKey="prevValue" name="Previous" fill="#e2e8f0" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="line" className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dataset1}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" name="Current" stroke="#6366f1" strokeWidth={2} />
                      <Line type="monotone" dataKey="prevValue" name="Previous" stroke="#94a3b8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Tabs defaultValue="bar">
                <div className="flex items-center justify-between">
                  <CardTitle>Dataset B Visualization</CardTitle>
                  <TabsList>
                    <TabsTrigger value="bar">Bar</TabsTrigger>
                    <TabsTrigger value="line">Line</TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="bar">
                <TabsContent value="bar" className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataset2}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Current" fill="#ec4899" />
                      <Bar dataKey="prevValue" name="Previous" fill="#e2e8f0" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="line" className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dataset2}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" name="Current" stroke="#ec4899" strokeWidth={2} />
                      <Line type="monotone" dataKey="prevValue" name="Previous" stroke="#94a3b8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Detailed Comparison</CardTitle>
            <CardDescription>Side-by-side comparison of both datasets</CardDescription>
          </CardHeader>
          <CardContent>
            <ComparisonTable dataset1={dataset1} dataset2={dataset2} />
          </CardContent>
        </Card>
      </main>
      <FilterDrawer open={isFilterOpen} onOpenChange={setIsFilterOpen} />
    </div>
  )
}
