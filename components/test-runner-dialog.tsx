"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  CopyIcon,
  DownloadIcon,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTestRunnerStore, type TestCase, type TestRequest } from "@/stores/test-runner-store"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface TestRunnerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TestRunnerDialog({ open, onOpenChange }: TestRunnerDialogProps) {
  const {
    testCases,
    testResults,
    isRunning,
    runProgress,
    addTestCase,
    deleteTestCase,
    duplicateTestCase,
    addTestResult,
    updateTestResult,
    setRunning,
    setRunProgress,
    getTestCaseResults,
    getFilteredTestCases,
    getStats,
  } = useTestRunnerStore()

  const [activeTab, setActiveTab] = useState("tests")
  const [importData, setImportData] = useState("")
  const [showImport, setShowImport] = useState(false)

  // New test case form
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({
    type: "individual",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    requests: [
      {
        id: "new-req-1",
        name: "Request 1",
        body: "",
        expectedStatus: 200,
        expectedResponse: "",
        timeout: 30000,
      } as TestRequest,
    ],
    tags: [],
  })

  const runSingleRequest = async (request: TestRequest, testCase: TestCase) => {
    const resultId = `${request.id}-${Date.now()}`
    const startTime = Date.now()

    // Add running result
    const runningResult = {
      id: resultId,
      testCaseId: testCase.id,
      requestId: request.id,
      status: "running" as const,
      timestamp: new Date().toISOString(),
    }
    addTestResult(runningResult)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), request.timeout)

      const response = await fetch(testCase.endpoint, {
        method: testCase.method,
        headers: testCase.headers,
        body: testCase.method !== "GET" ? request.body : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      const responseText = await response.text()

      const passed =
        response.status === request.expectedStatus &&
        (request.expectedResponse ? responseText.toLowerCase().includes(request.expectedResponse.toLowerCase()) : true)

      const result = {
        actualStatus: response.status,
        actualResponse: responseText,
        duration,
        status: passed ? ("passed" as const) : ("failed" as const),
      }

      updateTestResult(resultId, result)

      // addNotification({
      //   type: passed ? "success" : "error",
      //   title: `Test ${passed ? "Passed" : "Failed"}`,
      //   message: `${testCase.name} - ${request.name}`,
      // })

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const isTimeout = error instanceof Error && error.name === "AbortError"

      const result = {
        status: isTimeout ? ("timeout" as const) : ("failed" as const),
        duration,
        error: error instanceof Error ? error.message : "Unknown error",
      }

      updateTestResult(resultId, result)

      // addNotification({
      //   type: "error",
      //   title: `Test ${isTimeout ? "Timeout" : "Error"}`,
      //   message: `${testCase.name} - ${request.name}`,
      // })

      return result
    }
  }

  const runTestCase = async (testCase: TestCase) => {
    setRunning(true, testCase.id)
    setRunProgress(0)

    for (let i = 0; i < testCase.requests.length; i++) {
      await runSingleRequest(testCase.requests[i], testCase)
      setRunProgress(((i + 1) / testCase.requests.length) * 100)
    }

    setRunning(false)

    // addNotification({
    //   type: "info",
    //   title: "Test Complete",
    //   message: `Finished running ${testCase.name}`,
    // })
  }

  const addRequest = () => {
    const newRequest: TestRequest = {
      id: `req-${Date.now()}`,
      name: `Request ${(newTestCase.requests?.length || 0) + 1}`,
      body: "",
      expectedStatus: 200,
      expectedResponse: "",
      timeout: 30000,
    }

    setNewTestCase((prev) => ({
      ...prev,
      requests: [...(prev.requests || []), newRequest],
      type: (prev.requests?.length || 0) + 1 > 1 ? "batch" : "individual",
    }))
  }

  const removeRequest = (requestId: string) => {
    setNewTestCase((prev) => {
      const updatedRequests = prev.requests?.filter((r) => r.id !== requestId) || []
      return {
        ...prev,
        requests: updatedRequests,
        type: updatedRequests.length > 1 ? "batch" : "individual",
      }
    })
  }

  const updateRequest = (requestId: string, field: keyof TestRequest, value: any) => {
    setNewTestCase((prev) => ({
      ...prev,
      requests: prev.requests?.map((r) => (r.id === requestId ? { ...r, [field]: value } : r)) || [],
    }))
  }

  const saveTestCase = () => {
    if (!newTestCase.name || !newTestCase.endpoint || !newTestCase.requests?.length) return

    const testCaseToAdd = {
      name: newTestCase.name,
      description: newTestCase.description || "",
      type: (newTestCase.requests?.length || 0) > 1 ? ("batch" as const) : ("individual" as const),
      endpoint: newTestCase.endpoint || "",
      method: newTestCase.method || ("POST" as const),
      headers: newTestCase.headers || {},
      requests: newTestCase.requests || [],
      tags: newTestCase.tags || [],
    }

    addTestCase(testCaseToAdd)

    // addNotification({
    //   type: "success",
    //   title: "Test Case Created",
    //   message: `${newTestCase.name} has been added`,
    // })

    // Reset form
    setNewTestCase({
      type: "individual",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      requests: [
        {
          id: "new-req-1",
          name: "Request 1",
          body: "",
          expectedStatus: 200,
          expectedResponse: "",
          timeout: 30000,
        } as TestRequest,
      ],
      tags: [],
    })
  }

  const exportTestCase = (testCase: TestCase) => {
    const exportData = {
      name: testCase.name,
      description: testCase.description,
      endpoint: testCase.endpoint,
      method: testCase.method,
      headers: testCase.headers,
      requests: testCase.requests,
      tags: testCase.tags,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${testCase.name.replace(/\s+/g, "_")}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // addNotification({
    //   type: "success",
    //   title: "Export Complete",
    //   message: `${testCase.name} exported successfully`,
    // })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <ClockIcon className="h-4 w-4 text-blue-500 animate-spin" />
      case "passed":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      case "timeout":
        return <XCircleIcon className="h-4 w-4 text-orange-500" />
    }
  }

  const getTestCaseStatus = (testCase: TestCase) => {
    const results = getTestCaseResults(testCase.id)
    if (results.length === 0) return null

    const latestResults = results.slice(0, testCase.requests.length)
    if (latestResults.some((r) => r.status === "running")) return "running"
    if (latestResults.every((r) => r.status === "passed")) return "passed"
    if (latestResults.some((r) => r.status === "failed" || r.status === "timeout")) return "failed"
    return null
  }

  const stats = getStats()
  const filteredTestCases = getFilteredTestCases()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayIcon className="h-5 w-5" />
            Test Case Runner
          </DialogTitle>
          <DialogDescription>
            Run individual test cases or batch tests for API endpoints and validation
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tests">Test Cases</TabsTrigger>
            <TabsTrigger value="manage">Manage Tests</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline">{stats.totalTests} total tests</Badge>
                <Badge variant="outline">{stats.individualTests} individual</Badge>
                <Badge variant="outline">{stats.batchTests} batch</Badge>
              </div>
            </div>

            <ScrollArea className="h-[60vh]">
              <div className="space-y-3 pr-4">
                {filteredTestCases.map((testCase) => {
                  const status = getTestCaseStatus(testCase)
                  const results = getTestCaseResults(testCase.id)

                  return (
                    <Card key={testCase.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{testCase.name}</h3>
                            {status && getStatusIcon(status)}
                            <Badge variant={testCase.type === "batch" ? "default" : "secondary"} className="text-xs">
                              {testCase.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {testCase.requests.length} request{testCase.requests.length !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{testCase.description}</p>
                          <div className="text-xs text-muted-foreground mb-2">
                            <span className="font-medium">{testCase.method}</span> {testCase.endpoint}
                          </div>
                          {testCase.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {testCase.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button onClick={() => runTestCase(testCase)} disabled={isRunning} size="sm">
                            {isRunning ? (
                              <>
                                <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                                Running...
                              </>
                            ) : (
                              <>
                                <PlayIcon className="h-4 w-4 mr-2" />
                                Run
                              </>
                            )}
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => exportTestCase(testCase)}>
                                <DownloadIcon className="h-4 w-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateTestCase(testCase.id)}>
                                <CopyIcon className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteTestCase(testCase.id)} className="text-red-600">
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {isRunning && (
                        <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Running Tests...</span>
                            <span className="text-sm text-muted-foreground">{Math.round(runProgress)}%</span>
                          </div>
                          <Progress value={runProgress} className="w-full" />
                        </div>
                      )}

                      <Separator className="my-3" />
                      <div className="space-y-2">
                        {testCase.requests.map((request) => (
                          <div key={request.id} className="text-sm p-3 bg-muted/30 rounded border-l-2 border-muted">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{request.name}</span>
                              <Badge variant="outline" className="text-xs">
                                Expects {request.expectedStatus}
                              </Badge>
                            </div>
                            {request.expectedResponse && (
                              <p className="text-xs text-muted-foreground">
                                Should contain: "{request.expectedResponse}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {results.length > 0 && (
                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                          Last run: {new Date(results[0].timestamp).toLocaleString()}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <ScrollArea className="h-[70vh]">
              <div className="space-y-6 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Test Case</CardTitle>
                    <CardDescription>
                      Configure shared endpoint settings, then add multiple requests for batch testing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Shared Configuration */}
                    <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                      <h4 className="font-medium text-sm">Shared Configuration</h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="test-name">Test Case Name</Label>
                          <Input
                            id="test-name"
                            value={newTestCase.name || ""}
                            onChange={(e) => setNewTestCase((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter test case name"
                          />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Badge variant={newTestCase.type === "batch" ? "default" : "secondary"} className="ml-2">
                            {newTestCase.type} ({newTestCase.requests?.length || 0} request
                            {(newTestCase.requests?.length || 0) !== 1 ? "s" : ""})
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="test-description">Description</Label>
                        <Input
                          id="test-description"
                          value={newTestCase.description || ""}
                          onChange={(e) => setNewTestCase((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="What does this test validate?"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Method</Label>
                          <Select
                            value={newTestCase.method}
                            onValueChange={(value: "GET" | "POST" | "PUT" | "DELETE") =>
                              setNewTestCase((prev) => ({ ...prev, method: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label>Endpoint</Label>
                          <Input
                            value={newTestCase.endpoint || ""}
                            onChange={(e) => setNewTestCase((prev) => ({ ...prev, endpoint: e.target.value }))}
                            placeholder="https://api.example.com/endpoint"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Headers (JSON)</Label>
                        <Textarea
                          value={JSON.stringify(newTestCase.headers, null, 2)}
                          onChange={(e) => {
                            try {
                              const headers = JSON.parse(e.target.value)
                              setNewTestCase((prev) => ({ ...prev, headers }))
                            } catch {}
                          }}
                          className="font-mono text-xs"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Tags (comma-separated)</Label>
                        <Input
                          value={newTestCase.tags?.join(", ") || ""}
                          onChange={(e) =>
                            setNewTestCase((prev) => ({
                              ...prev,
                              tags: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            }))
                          }
                          placeholder="ai, performance, integration"
                        />
                      </div>
                    </div>

                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Requests</Label>
                        <div className="flex gap-2">
                          <Button onClick={addRequest} size="sm" variant="outline">
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Request
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {newTestCase.requests?.map((request, index) => (
                          <Card key={request.id} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-sm">Request {index + 1}</h4>
                              {(newTestCase.requests?.length || 0) > 1 && (
                                <Button
                                  onClick={() => removeRequest(request.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div className="space-y-3">
                              <div>
                                <Label>Request Name</Label>
                                <Input
                                  value={request.name}
                                  onChange={(e) => updateRequest(request.id, "name", e.target.value)}
                                  placeholder="Request name"
                                />
                              </div>

                              <div>
                                <Label>Request Body</Label>
                                <Textarea
                                  value={request.body}
                                  onChange={(e) => updateRequest(request.id, "body", e.target.value)}
                                  className="font-mono text-xs"
                                  rows={4}
                                  placeholder="Request body (JSON, etc.)"
                                />
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <Label>Expected Status</Label>
                                  <Input
                                    type="number"
                                    value={request.expectedStatus}
                                    onChange={(e) =>
                                      updateRequest(request.id, "expectedStatus", Number.parseInt(e.target.value))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Timeout (ms)</Label>
                                  <Input
                                    type="number"
                                    value={request.timeout}
                                    onChange={(e) =>
                                      updateRequest(request.id, "timeout", Number.parseInt(e.target.value))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Expected Response</Label>
                                  <Input
                                    value={request.expectedResponse}
                                    onChange={(e) => updateRequest(request.id, "expectedResponse", e.target.value)}
                                    placeholder="Text to find"
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={saveTestCase}
                      className="w-full"
                      disabled={!newTestCase.name || !newTestCase.endpoint}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Save Test Case
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Test Results</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      <div className="w-2 h-2 rounded-full mr-1 bg-green-500" />
                      passed: {stats.recentResults.passed}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <div className="w-2 h-2 rounded-full mr-1 bg-red-500" />
                      failed: {stats.recentResults.failed}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <div className="w-2 h-2 rounded-full mr-1 bg-orange-500" />
                      timeout: {stats.recentResults.timeout}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {testResults.map((result) => {
                      const testCase = testCases.find((tc) => tc.id === result.testCaseId)
                      const request = testCase?.requests.find((r) => r.id === result.requestId)

                      return (
                        <Card key={result.id} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusIcon(result.status)}
                                <h4 className="font-medium text-sm">
                                  {testCase?.name || "Unknown Test"} - {request?.name || "Unknown Request"}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {result.duration ? `${result.duration}ms` : ""}
                                </Badge>
                              </div>

                              {result.actualStatus && (
                                <div className="text-xs space-y-1">
                                  <div className="flex gap-4">
                                    <span>Status: {result.actualStatus}</span>
                                    <span>Expected: {request?.expectedStatus}</span>
                                  </div>
                                </div>
                              )}

                              {result.error && <div className="text-xs text-red-600 mt-1">Error: {result.error}</div>}

                              {result.actualResponse && (
                                <details className="mt-2">
                                  <summary className="text-xs cursor-pointer text-muted-foreground">
                                    View Response
                                  </summary>
                                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                                    {result.actualResponse.substring(0, 500)}
                                    {result.actualResponse.length > 500 ? "..." : ""}
                                  </pre>
                                </details>
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </Card>
                      )
                    })}

                    {testResults.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <FileTextIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No test results yet. Run some tests to see results here.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
