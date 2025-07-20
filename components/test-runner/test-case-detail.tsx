"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  UploadIcon,
  EditIcon,
  TagIcon,
  FolderIcon,
  ChevronRightIcon,
  HomeIcon,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTestRunnerStore, type TestCase, type TestRequest, type TestResult } from "@/stores/test-runner-store"
import { useAppStore } from "@/stores/app-store"
import { Progress } from "@/components/ui/progress"
import { RequestEditor } from "./request-editor"

interface TestCaseDetailProps {
  testCaseId: string
}

export function TestCaseDetail({ testCaseId }: TestCaseDetailProps) {
  const {
    getTestCase,
    updateTestCase,
    deleteTestCase,
    duplicateTestCase,
    addTestResult,
    updateTestResult,
    isRunning,
    runningTestCaseId,
    runProgress,
    setRunning,
    setRunProgress,
    getTestCaseResults,
    clearResults,
    folders,
  } = useTestRunnerStore()
  const { addNotification } = useAppStore()

  const testCase = getTestCase(testCaseId)

  const [localTestCase, setLocalTestCase] = useState<TestCase | null>(null)
  const [isImportRequestsOpen, setIsImportRequestsOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [activeTab, setActiveTab] = useState<"headers" | "auth" | "params">("headers")
  const [activeResultsTab, setActiveResultsTab] = useState<"results" | "history">("results")
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null)

  useEffect(() => {
    if (testCase) {
      setLocalTestCase(testCase)
    }
  }, [testCase])

  if (!localTestCase) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <FileTextIcon className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm">Select a test case or create a new one.</p>
      </div>
    )
  }

  const handleUpdateTestCase = (updates: Partial<TestCase>) => {
    setLocalTestCase((prev) => (prev ? { ...prev, ...updates } : null))
    updateTestCase(localTestCase.id, updates)
  }

  const handleAddRequest = () => {
    const newRequest: TestRequest = {
      id: `req-${Date.now()}`,
      name: `Request ${(localTestCase.requests?.length || 0) + 1}`,
      bodyType: "raw",
      body: "",
      formData: [],
      expectedStatus: 200,
      expectedResponse: "",
      timeout: 30000,
    }
    const updatedRequests = [...(localTestCase.requests || []), newRequest]
    handleUpdateTestCase({
      requests: updatedRequests,
      type: updatedRequests.length > 1 ? "batch" : "individual",
    })
  }

  const handleRemoveRequest = (requestId: string) => {
    const updatedRequests = localTestCase.requests.filter((r) => r.id !== requestId)
    handleUpdateTestCase({
      requests: updatedRequests,
      type: updatedRequests.length > 1 ? "batch" : "individual",
    })
  }

  const handleUpdateRequest = (requestId: string, field: keyof TestRequest, value: any) => {
    const updatedRequests = localTestCase.requests.map((r) => (r.id === requestId ? { ...r, [field]: value } : r))
    handleUpdateTestCase({ requests: updatedRequests })
  }

  const runSingleRequest = async (request: TestRequest, testCase: TestCase) => {
    const resultId = `${request.id}-${Date.now()}`
    const startTime = Date.now()

    const runningResult: TestResult = {
      id: resultId,
      testCaseId: testCase.id,
      requestId: request.id,
      status: "running",
      timestamp: new Date().toISOString(),
    }
    addTestResult(runningResult)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), request.timeout)

      // Build URL with query params
      const url = new URL(testCase.endpoint)
      if (testCase.queryParams) {
        Object.entries(testCase.queryParams).forEach(([key, value]) => {
          if (value) url.searchParams.append(key, value)
        })
      }

      // Build headers with auth
      const headers = { ...testCase.headers }
      if (testCase.authorization?.type === "bearer" && testCase.authorization.token) {
        headers.Authorization = `Bearer ${testCase.authorization.token}`
      } else if (
        testCase.authorization?.type === "basic" &&
        testCase.authorization.username &&
        testCase.authorization.password
      ) {
        headers.Authorization = `Basic ${btoa(`${testCase.authorization.username}:${testCase.authorization.password}`)}`
      } else if (
        testCase.authorization?.type === "apikey" &&
        testCase.authorization.key &&
        testCase.authorization.value
      ) {
        headers[testCase.authorization.key] = testCase.authorization.value
      }

      // Build request body based on type
      let body: string | FormData | undefined
      if (testCase.method !== "GET") {
        if (request.bodyType === "raw") {
          body = request.body
        } else if (request.bodyType === "form-data") {
          body = new FormData()
          request.formData?.forEach((item) => {
            if (item.key && item.value) {
              ;(body as FormData).append(item.key, item.value)
            }
          })
        } else if (request.bodyType === "x-www-form-urlencoded") {
          headers["Content-Type"] = "application/x-www-form-urlencoded"
          body = new URLSearchParams(
            request.formData?.filter((item) => item.key && item.value).map((item) => [item.key, item.value]) || [],
          ).toString()
        }
      }

      const response = await fetch(url.toString(), {
        method: testCase.method,
        headers,
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      const responseText = await response.text()

      const passed =
        response.status === request.expectedStatus &&
        (request.expectedResponse ? responseText.toLowerCase().includes(request.expectedResponse.toLowerCase()) : true)

      const result: Partial<TestResult> = {
        actualStatus: response.status,
        actualResponse: responseText,
        duration,
        status: passed ? "passed" : "failed",
      }

      updateTestResult(resultId, result)

      addNotification({
        type: passed ? "success" : "error",
        title: `Test ${passed ? "Passed" : "Failed"}`,
        message: `${testCase.name} - ${request.name}`,
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const isTimeout = error instanceof Error && error.name === "AbortError"

      const result: Partial<TestResult> = {
        status: isTimeout ? "timeout" : "failed",
        duration,
        error: error instanceof Error ? error.message : "Unknown error",
      }

      updateTestResult(resultId, result)

      addNotification({
        type: "error",
        title: `Test ${isTimeout ? "Timeout" : "Error"}`,
        message: `${testCase.name} - ${request.name}`,
      })

      return result
    }
  }

  const handleRunTestCase = async () => {
    if (!localTestCase) return

    setRunning(true, localTestCase.id)
    setRunProgress(0)

    for (let i = 0; i < localTestCase.requests.length; i++) {
      await runSingleRequest(localTestCase.requests[i], localTestCase)
      setRunProgress(((i + 1) / localTestCase.requests.length) * 100)
    }

    setRunning(false)

    addNotification({
      type: "info",
      title: "Test Complete",
      message: `Finished running ${localTestCase.name}`,
    })
  }

  const handleExportTestCase = () => {
    if (!localTestCase) return
    const exportData = {
      name: localTestCase.name,
      description: localTestCase.description,
      endpoint: localTestCase.endpoint,
      method: localTestCase.method,
      headers: localTestCase.headers,
      authorization: localTestCase.authorization,
      queryParams: localTestCase.queryParams,
      requests: localTestCase.requests,
      tags: localTestCase.tags,
      folderId: localTestCase.folderId,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${localTestCase.name.replace(/\s+/g, "_")}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    addNotification({
      type: "success",
      title: "Export Complete",
      message: `${localTestCase.name} exported successfully`,
    })
  }

  const handleImportRequests = (importedData: any[]) => {
    const requests: TestRequest[] = importedData.map((item, index) => ({
      id: `imported-${Date.now()}-${index}`,
      name: item.name || `Imported Request ${index + 1}`,
      bodyType: item.bodyType || "raw",
      body: typeof item.body === "string" ? item.body : JSON.stringify(item.body || {}, null, 2),
      formData: item.formData || [],
      expectedStatus: item.expectedStatus || 200,
      expectedResponse: item.expectedResponse || "",
      timeout: item.timeout || 30000,
    }))

    const updatedRequests = [...(localTestCase.requests || []), ...requests]
    handleUpdateTestCase({
      requests: updatedRequests,
      type: updatedRequests.length > 1 ? "batch" : "individual",
    })
    setIsImportRequestsOpen(false)
    addNotification({
      type: "success",
      title: "Requests Imported",
      message: `${requests.length} requests added to ${localTestCase.name}`,
    })
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "running":
        return <ClockIcon className="h-3 w-3 text-blue-500 animate-spin" />
      case "passed":
        return <CheckCircleIcon className="h-3 w-3 text-green-500" />
      case "failed":
        return <XCircleIcon className="h-3 w-3 text-red-500" />
      case "timeout":
        return <XCircleIcon className="h-3 w-3 text-orange-500" />
    }
  }

  const testCaseResults = getTestCaseResults(localTestCase.id)

  // Group results by test run (timestamp)
  const groupedResults = testCaseResults.reduce(
    (groups, result) => {
      const runKey =
        result.timestamp.split("T")[0] + "_" + result.timestamp.split("T")[1].split(":").slice(0, 2).join(":")
      if (!groups[runKey]) {
        groups[runKey] = []
      }
      groups[runKey].push(result)
      return groups
    },
    {} as Record<string, TestResult[]>,
  )

  const sortedRunKeys = Object.keys(groupedResults).sort().reverse()
  const latestResults = sortedRunKeys.length > 0 ? groupedResults[sortedRunKeys[0]] : []

  return (
    <div className="flex flex-col h-full">

      {/* Header with Test Case Name and Actions */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/10">
        <div className="flex items-center gap-2 flex-1 min-w-0 group">
          {isEditingName ? (
            <Input
              value={localTestCase.name}
              onChange={(e) => handleUpdateTestCase({ name: e.target.value })}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingName(false)
                if (e.key === "Escape") setIsEditingName(false)
              }}
              className="text-sm font-medium h-7 w-auto max-w-[160px] px-1 py-0.5"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-sm font-medium truncate">{localTestCase.name}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingName(true)}
                onDoubleClick={() => setIsEditingName(true)}
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
              >
                <EditIcon className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Tags */}
          <div className="flex items-center gap-1">
            {localTestCase.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1">
                {tag}
              </Badge>
            ))}
            {isEditingTags ? (
              <Input
                value={localTestCase.tags?.join(", ") || ""}
                onChange={(e) =>
                  handleUpdateTestCase({
                    tags: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                onBlur={() => setIsEditingTags(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsEditingTags(false)
                  if (e.key === "Escape") setIsEditingTags(false)
                }}
                placeholder="tag1, tag2"
                className="text-xs h-6 w-24"
                autoFocus
              />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTags(true)}
                className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                title="Add tags"
              >
                <TagIcon className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            onClick={handleRunTestCase}
            disabled={isRunning && runningTestCaseId === localTestCase.id}
            size="sm"
            className="h-6 text-xs"
          >
            {isRunning && runningTestCaseId === localTestCase.id ? (
              <>
                <ClockIcon className="h-3 w-3 mr-1 animate-spin" />
                Running
              </>
            ) : (
              <>
                <PlayIcon className="h-3 w-3 mr-1" />
                Run
              </>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontalIcon className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleExportTestCase} className="text-xs">
                <DownloadIcon className="h-3 w-3 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateTestCase(localTestCase.id)} className="text-xs">
                <CopyIcon className="h-3 w-3 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem className="text-xs">
                    <FolderIcon className="h-3 w-3 mr-2" />
                    Move to Folder
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="left" className="w-40">
                  <DropdownMenuItem onClick={() => handleUpdateTestCase({ folderId: null })} className="text-xs">
                    Uncategorized
                  </DropdownMenuItem>
                  {folders.map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={() => handleUpdateTestCase({ folderId: folder.id })}
                      className="text-xs"
                    >
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenuItem onClick={() => deleteTestCase(localTestCase.id)} className="text-xs text-red-600">
                <TrashIcon className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Description */}
      <div className="px-3 border-b bg-muted/5">
        {isEditingDescription ? (
          <Input
            value={localTestCase.description || ""}
            onChange={(e) => handleUpdateTestCase({ description: e.target.value })}
            onBlur={() => setIsEditingDescription(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") setIsEditingDescription(false)
            }}
            placeholder="Add description..."
            className="text-xs h-8"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-1.5 min-h-[2rem] group cursor-pointer" onDoubleClick={() => setIsEditingDescription(true)}>
            <span className="text-xs text-muted-foreground flex-1 truncate">
              {localTestCase.description || "Add description..."}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingDescription(true)}
              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
              title="Edit description"
            >
              <EditIcon className="h-2.5 w-2.5" />
            </Button>
          </div>
        )}
      </div>


      {/* Running Progress */}
      {isRunning && runningTestCaseId === localTestCase.id && (
        <div className="px-3 py-2 bg-muted/20 border-b">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Running Tests...</span>
            <span className="text-xs text-muted-foreground">{Math.round(runProgress)}%</span>
          </div>
          <Progress value={runProgress} className="w-full h-1" />
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Basic Configuration */}
          <Card className="border-0 shadow-sm bg-muted/20">
            <CardContent className="p-3 space-y-2">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <Select
                  value={localTestCase.method}
                  onValueChange={(value: "GET" | "POST" | "PUT" | "DELETE") => handleUpdateTestCase({ method: value })}
                >
                  <SelectTrigger className="h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={localTestCase.endpoint || ""}
                  onChange={(e) => handleUpdateTestCase({ endpoint: e.target.value })}
                  placeholder="https://api.example.com/endpoint"
                  className="h-6 text-xs"
                />
              </div>

              {/* Compact Configuration Tabs */}
              <div className="space-y-3">
                <div className="flex border-b">
                  <button
                    onClick={() => setActiveTab("headers")}
                    className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === "headers"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Headers
                  </button>
                  <button
                    onClick={() => setActiveTab("auth")}
                    className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === "auth"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Auth
                  </button>
                  <button
                    onClick={() => setActiveTab("params")}
                    className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === "params"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Params
                  </button>
                </div>

                {/* Tab Content */}
                <div className="min-h-[80px]">
                  {activeTab === "headers" && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Key-Value pairs (JSON format)</div>
                      <Textarea
                        value={JSON.stringify(localTestCase.headers || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const headers = JSON.parse(e.target.value)
                            handleUpdateTestCase({ headers })
                          } catch {}
                        }}
                        className="font-mono text-xs h-16 resize-none"
                        placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                      />
                    </div>
                  )}

                  {activeTab === "auth" && (
                    <div className="space-y-3">
                      {/* Compact Auth Type Selection */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "none", label: "None" },
                          { value: "bearer", label: "Bearer" },
                          { value: "basic", label: "Basic" },
                          { value: "apikey", label: "API Key" },
                        ].map((auth) => (
                          <Button
                            key={auth.value}
                            variant={
                              localTestCase.authorization?.type === auth.value ||
                              (!localTestCase.authorization && auth.value === "none")
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              handleUpdateTestCase({
                                authorization: { type: auth.value as "bearer" | "basic" | "apikey" | "none" },
                              })
                            }
                            className="h-6 text-xs px-2"
                          >
                            {auth.label}
                          </Button>
                        ))}
                      </div>

                      {/* Auth Fields */}
                      {localTestCase.authorization?.type === "bearer" && (
                        <Input
                          value={localTestCase.authorization.token || ""}
                          onChange={(e) =>
                            handleUpdateTestCase({
                              authorization: { ...localTestCase.authorization, type: localTestCase.authorization?.type ?? "bearer", token: e.target.value },
                            })
                          }
                          placeholder="Bearer token"
                          className="h-7 text-xs"
                        />
                      )}

                      {localTestCase.authorization?.type === "basic" && (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={localTestCase.authorization.username || ""}
                            onChange={(e) =>
                              handleUpdateTestCase({
                                authorization: { ...localTestCase.authorization, type: localTestCase.authorization?.type ?? "basic", username: e.target.value },
                              })
                            }
                            placeholder="Username"
                            className="h-7 text-xs"
                          />
                          <Input
                            type="password"
                            value={localTestCase.authorization.password || ""}
                            onChange={(e) =>
                              handleUpdateTestCase({
                                authorization: { ...localTestCase.authorization, type: localTestCase.authorization?.type ?? "basic", password: e.target.value },
                              })
                            }
                            placeholder="Password"
                            className="h-7 text-xs"
                          />
                        </div>
                      )}

                      {localTestCase.authorization?.type === "apikey" && (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={localTestCase.authorization.key || ""}
                            onChange={(e) =>
                              handleUpdateTestCase({
                                authorization: { ...localTestCase.authorization, type: localTestCase.authorization?.type ?? "apikey", key: e.target.value },
                              })
                            }
                            placeholder="Header name (e.g., X-API-Key)"
                            className="h-7 text-xs"
                          />
                          <Input
                            value={localTestCase.authorization.value || ""}
                            onChange={(e) =>
                              handleUpdateTestCase({
                                authorization: { ...localTestCase.authorization, type: localTestCase.authorization?.type ?? "apikey",value: e.target.value },
                              })
                            }
                            placeholder="API key value"
                            className="h-7 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "params" && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Query parameters (JSON format)</div>
                      <Textarea
                        value={JSON.stringify(localTestCase.queryParams || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const queryParams = JSON.parse(e.target.value)
                            handleUpdateTestCase({ queryParams })
                          } catch {}
                        }}
                        className="font-mono text-xs h-16 resize-none"
                        placeholder='{"param1": "value1", "param2": "value2"}'
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests Section */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <Card className="border-0 shadow-sm bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChevronRightIcon className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                      <span className="text-xs font-medium">Requests</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1">
                        {localTestCase.requests.length}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsImportRequestsOpen(true)
                        }}
                        size="sm"
                        variant="outline"
                        className="h-5 text-xs"
                      >
                        <UploadIcon className="h-2.5 w-2.5 mr-1" />
                        Import
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddRequest()
                        }}
                        size="sm"
                        variant="outline"
                        className="h-5 text-xs bg-transparent"
                      >
                        <PlusIcon className="h-2.5 w-2.5 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-3">
                {localTestCase.requests.length === 0 && (
                  <div className="text-center text-muted-foreground py-3 text-xs">No requests defined.</div>
                )}
                <ScrollArea className="max-h-96">
                  <div className="space-y-2 pr-2">
                    {localTestCase.requests.map((request, index) => (
                      <div key={request.id} className="shadow-sm">
                        <RequestEditor
                          request={request}
                          index={index}
                          onUpdate={(field, value) => handleUpdateRequest(request.id, field, value)}
                          onRemove={() => handleRemoveRequest(request.id)}
                          isRemovable={localTestCase.requests.length > 1}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Test Results Section */}
          <div className="space-y-2">
            {/* Result Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/20 rounded-t-lg border-b">
              <div className="flex items-center gap-4">
                {/* Result Tab */}
                <button
                  onClick={() => setActiveResultsTab('results')}
                  className="text-xs font-medium hover:underline focus:outline-none"
                >
                  Result
                </button>
                {/* History Tab */}
                <button
                  onClick={() => setActiveResultsTab('history')}
                  className="text-xs font-medium hover:underline focus:outline-none"
                >
                  History
                </button>
              </div>
            </div>

            {/* Latest Results */}
            {activeResultsTab === 'results' && (
              latestResults.length === 0 ? (
                <div className="text-center text-muted-foreground py-6 text-xs bg-muted/10 rounded-b-lg">
                  <FileTextIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="mb-1">No test results yet</p>
                  <p className="text-[10px]">Run the test to see results here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {latestResults.map((result, index) => {
                    const request = localTestCase.requests.find((r) => r.id === result.requestId)
                    const isExpanded = expandedResultId === result.id
                    const isOnlyResult = latestResults.length === 1

                    return (
                      <Card key={result.id} className="border shadow-sm bg-background/80">
                        <CardContent className="p-3 space-y-3">
                          {/* Request Header with Stats - Always visible for single result, clickable for multiple */}
                          <div
                            className={`flex items-center justify-between ${
                              !isOnlyResult ? "cursor-pointer hover:bg-muted/20 -m-3 p-3 rounded" : ""
                            }`}
                            onClick={() => {
                              if (!isOnlyResult) {
                                setExpandedResultId(isExpanded ? null : result.id)
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {!isOnlyResult && (
                                <ChevronRightIcon
                                  className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                />
                              )}
                              {getStatusIcon(result.status)}
                              <span className="font-medium text-sm">{request?.name || "Unknown Request"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <div
                                className={`flex items-center gap-1 ${
                                  result.actualStatus === request?.expectedStatus ? "text-green-600" : "text-red-600"
                                }`}
                                title={`Status: ${result.actualStatus} (Expected: ${request?.expectedStatus})`}
                              >
                                <span className="font-medium">{result.actualStatus}</span>
                                <span className="text-muted-foreground">/{request?.expectedStatus}</span>
                              </div>
                              {result.duration && (
                                <div className="text-muted-foreground" title={`Duration: ${result.duration}ms`}>
                                  {result.duration}ms
                                </div>
                              )}
                              <div
                                className={`font-medium ${
                                  result.status === "passed"
                                    ? "text-green-600"
                                    : result.status === "timeout"
                                      ? "text-orange-600"
                                      : "text-red-600"
                                }`}
                                title={`Result: ${result.status.toUpperCase()}`}
                              >
                                {result.status.toUpperCase()}
                              </div>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigator.clipboard.writeText(result.actualResponse || "")
                                }}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                title="Copy response"
                              >
                                <CopyIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Expandable Content - Always visible for single result, conditional for multiple */}
                          {(isOnlyResult || isExpanded) && (
                            <>
                              {/* Error Display */}
                              {result.error && (
                                <div className="bg-red-50 border border-red-200 p-3 rounded shadow-sm">
                                  <div className="text-xs font-semibold text-red-800 mb-1">Error Details</div>
                                  <div className="text-xs text-red-700 font-mono break-words">{result.error}</div>
                                </div>
                              )}

                              {/* Response Content */}
                              {result.actualResponse && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold">Response Body</span>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-[9px] h-3 px-1">
                                        {result.actualResponse.length.toLocaleString()} chars
                                      </Badge>
                                      <Badge variant="outline" className="text-[9px] h-3 px-1">
                                        {result.actualResponse.split("\n").length} lines
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 border rounded-lg p-3 max-h-64 overflow-auto shadow-inner">
                                    <pre className="text-[10px] font-mono whitespace-pre-wrap break-words leading-relaxed">
                                      {(() => {
                                        try {
                                          const parsed = JSON.parse(result.actualResponse)
                                          return JSON.stringify(parsed, null, 2)
                                        } catch {
                                          return result.actualResponse
                                        }
                                      })()}
                                    </pre>
                                  </div>

                                  {/* Content Validation */}
                                  {request?.expectedResponse && (
                                    <div className="bg-muted/30 p-2 rounded text-xs shadow-sm">
                                      <div className="font-medium text-muted-foreground mb-1">
                                        Expected Content Check:
                                      </div>
                                      <div className="font-mono text-[10px] mb-1">"{request.expectedResponse}"</div>
                                      <div
                                        className={`font-medium ${
                                          result.actualResponse
                                            .toLowerCase()
                                            .includes(request.expectedResponse.toLowerCase())
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {result.actualResponse
                                          .toLowerCase()
                                          .includes(request.expectedResponse.toLowerCase())
                                          ? "✓ Found in response"
                                          : "✗ Not found in response"}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )
            )}

            {/* History Header */}
            {activeResultsTab === 'history' && sortedRunKeys.length > 1 && (
              <>
                {/* Historical Results */}
                <div className="bg-muted/10 rounded-b-lg">
                  <ScrollArea className="max-h-80">
                    <div className="space-y-2">
                      {sortedRunKeys.slice(1).map((runKey) => {
                        const runResults = groupedResults[runKey]
                        const runTime = new Date(runResults[0].timestamp)
                        const passedCount = runResults.filter((r) => r.status === "passed").length
                        const failedCount = runResults.filter(
                          (r) => r.status === "failed" || r.status === "timeout",
                        ).length
                        const isExpanded = expandedResultId === runKey

                        return (
                          <Card key={runKey} className="border bg-background/50 shadow-sm">
                            <CardContent className="p-2">
                              <Button
                                variant="ghost"
                                className="w-full justify-between h-auto p-2 text-left hover:bg-muted/50"
                                onClick={() => {
                                  setExpandedResultId(isExpanded ? null : runKey)
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <ChevronRightIcon
                                    className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                  />
                                  <span className="text-xs font-medium">
                                    {runTime.toLocaleDateString()} {runTime.toLocaleTimeString()}
                                  </span>
                                  <div className="flex gap-1">
                                    {passedCount > 0 && (
                                      <Badge variant="outline" className="text-[9px] h-3 px-1 text-green-600">
                                        {passedCount} ✓
                                      </Badge>
                                    )}
                                    {failedCount > 0 && (
                                      <Badge variant="outline" className="text-[9px] h-3 px-1 text-red-600">
                                        {failedCount} ✗
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </Button>

                              {isExpanded && (
                                <div className="ml-4 mt-2 space-y-2">
                                  {runResults.map((result) => {
                                    const request = localTestCase.requests.find((r) => r.id === result.requestId)
                                    return (
                                      <div key={result.id} className="border-l-2 border-l-muted pl-3 py-2 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            {getStatusIcon(result.status)}
                                            <span className="text-xs font-medium">{request?.name}</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-xs">
                                            {result.actualStatus && (
                                              <div
                                                className={
                                                  result.actualStatus === request?.expectedStatus
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                                }
                                                title={`Status: ${result.actualStatus} (Expected: ${request?.expectedStatus})`}
                                              >
                                                {result.actualStatus}
                                              </div>
                                            )}
                                            {result.duration && (
                                              <div
                                                className="text-muted-foreground"
                                                title={`Duration: ${result.duration}ms`}
                                              >
                                                {result.duration}ms
                                              </div>
                                            )}
                                            <Button
                                              onClick={() => navigator.clipboard.writeText(result.actualResponse || "")}
                                              size="sm"
                                              variant="ghost"
                                              className="h-4 w-4 p-0"
                                              title="Copy response"
                                            >
                                              <CopyIcon className="h-2.5 w-2.5" />
                                            </Button>
                                          </div>
                                        </div>

                                        {result.error && (
                                          <div className="text-[9px] text-red-600 font-mono bg-red-50 p-2 rounded mb-2 shadow-sm">
                                            {result.error}
                                          </div>
                                        )}

                                        {result.actualResponse && (
                                          <div className="bg-muted/50 p-2 rounded text-[8px] font-mono max-h-32 overflow-auto shadow-inner">
                                            <pre className="whitespace-pre-wrap break-words">
                                              {result.actualResponse.substring(0, 500)}
                                              {result.actualResponse.length > 500 ? "..." : ""}
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
