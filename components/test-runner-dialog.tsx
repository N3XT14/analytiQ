"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { UploadIcon, DownloadIcon, FileTextIcon } from "lucide-react"
import { useTestRunnerStore, type TestCase } from "@/stores/test-runner-store"
import { useAppStore } from "@/stores/app-store"
import { TestCasesList } from "./test-runner/test-cases-list"
import { TestCaseDetail } from "./test-runner/test-case-detail"
import { ImportDialog } from "./import-dialog"
import { DialogTitle } from "@radix-ui/react-dialog"

interface TestRunnerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TestRunnerDialog({ open, onOpenChange }: TestRunnerDialogProps) {
  const {
    testCases,
    selectedTestCaseId,
    setSelectedTestCaseId,
    importTestCases,
    exportTestCase: exportSingleTestCase,
  } = useTestRunnerStore()
  const { addNotification } = useAppStore()

  const [isImportTestCasesOpen, setIsImportTestCasesOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Select the first test case when the dialog opens if none is selected
  useEffect(() => {
    if (open && !selectedTestCaseId && testCases.length > 0) {
      setSelectedTestCaseId(testCases[0].id)
    }
  }, [open, selectedTestCaseId, testCases, setSelectedTestCaseId])

  const handleImportTestCases = (importedData: any[]) => {
    const newTestCases: TestCase[] = importedData.map((item: any, index: number) => ({
      id: `imported-${Date.now()}-${index}`,
      name: item.name || `Imported Test Case ${index + 1}`,
      description: item.description || "",
      type: (item.requests?.length || 0) > 1 ? "batch" : "individual",
      endpoint: item.endpoint || "",
      method: item.method || "POST",
      headers: item.headers || { "Content-Type": "application/json" },
      requests: item.requests || [
        {
          id: `req-${Date.now()}-${index}`,
          name: "Default Request",
          bodyType: "raw",
          body: "",
          expectedStatus: 200,
          expectedResponse: "",
          timeout: 30000,
        },
      ],
      tags: item.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
    importTestCases(newTestCases)
    setIsImportTestCasesOpen(false)
    addNotification({
      type: "success",
      title: "Test Cases Imported",
      message: `${newTestCases.length} test cases added`,
    })
  }

  const handleExportAllTestCases = () => {
    const exportData = testCases.map((tc) => ({
      name: tc.name,
      description: tc.description,
      endpoint: tc.endpoint,
      method: tc.method,
      headers: tc.headers,
      requests: tc.requests,
      tags: tc.tags,
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `all-test-cases-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    addNotification({
      type: "success",
      title: "Export Complete",
      message: `All ${testCases.length} test cases exported successfully`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle></DialogTitle>
      <DialogContent className="max-w-none max-h-none w-screen h-screen flex flex-col m-0 rounded-none border-0 p-0">
        {/* Top Bar with Import/Export */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsImportTestCasesOpen(true)} className="h-6 text-xs">
              <UploadIcon className="h-3 w-3 mr-1" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAllTestCases}
              className="h-6 text-xs bg-transparent"
            >
              <DownloadIcon className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <TestCasesList
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
          <div className="flex-1 overflow-hidden">
            {selectedTestCaseId ? (
              <TestCaseDetail testCaseId={selectedTestCaseId} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileTextIcon className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm mb-1">Select a test case or create a new one</p>
                <p className="text-xs">Create a collection first to organize your tests</p>
              </div>
            )}
          </div>
        </div>

        <ImportDialog
          open={isImportTestCasesOpen}
          onOpenChange={setIsImportTestCasesOpen}
          onImport={handleImportTestCases}
        />
      </DialogContent>
    </Dialog>
  )
}
