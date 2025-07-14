"use client"
import Dashboard from "@/components/dashboard"
import DynamicTable from "@/components/dynamic-table"
import { TestRunnerDialog } from "@/components/test-runner-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PlayIcon } from "lucide-react"
import { useState } from "react"

export default function Home() {
  const [ isTestRunnerOpen, setTestRunnerOpen ] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Global Test Runner Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button onClick={() => setTestRunnerOpen(true)} className="shadow-lg" size="sm">
          <PlayIcon className="h-4 w-4 mr-2" />
          Test Runner
        </Button>
      </div>

      <Tabs value="table" className="w-full">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <TabsList className="grid w-[400px] grid-cols-2">
              <TabsTrigger value="dashboard">Analysis Dashboard</TabsTrigger>
              <TabsTrigger value="table">Dynamic Table</TabsTrigger>
            </TabsList>
          </div>
        </div>
        <TabsContent value="dashboard" className="mt-0">
          <Dashboard />
        </TabsContent>
        <TabsContent value="table" className="mt-0">
          <DynamicTable />
        </TabsContent>
      </Tabs>

      <TestRunnerDialog open={isTestRunnerOpen} onOpenChange={setTestRunnerOpen} />
    </div>
  )
}
