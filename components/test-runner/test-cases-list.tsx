"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  PlusIcon,
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FolderIcon,
  FileIcon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  FolderPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { useTestRunnerStore, type TestCase, type Folder } from "@/stores/test-runner-store"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface FolderTreeItemProps {
  folder: Folder
  level: number
}

function FolderTreeItem({ folder, level }: FolderTreeItemProps) {
  const {
    getFolderChildren,
    getFolderTestCases,
    getFilteredTestCases,
    selectedTestCaseId,
    setSelectedTestCaseId,
    getTestCaseResults,
    addTestCase,
    addFolder,
    updateFolder,
    deleteFolder,
  } = useTestRunnerStore()

  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditingFolder, setIsEditingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isAddingSubfolder, setIsAddingSubfolder] = useState(false)

  const childFolders = getFolderChildren(folder.id)
  const allFilteredTestCases = getFilteredTestCases()
  const folderTestCases = allFilteredTestCases.filter((tc) => tc.folderId === folder.id)

  const getTestCaseStatus = (testCase: TestCase) => {
    const results = getTestCaseResults(testCase.id)
    if (results.length === 0) return null

    const latestResults = results.slice(0, testCase.requests.length)
    if (latestResults.some((r) => r.status === "running")) return "running"
    if (latestResults.every((r) => r.status === "passed")) return "passed"
    if (latestResults.some((r) => r.status === "failed" || r.status === "timeout")) return "failed"
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <ClockIcon className="h-2.5 w-2.5 text-blue-500 animate-spin" />
      case "passed":
        return <CheckCircleIcon className="h-2.5 w-2.5 text-green-500" />
      case "failed":
        return <XCircleIcon className="h-2.5 w-2.5 text-red-500" />
      case "timeout":
        return <XCircleIcon className="h-2.5 w-2.5 text-orange-500" />
    }
  }

  const handleAddTestCase = () => {
    const newTestCase: Omit<TestCase, "id" | "createdAt" | "updatedAt"> = {
      name: "New Test Case",
      description: "",
      type: "individual",
      endpoint: "",
      method: "GET",
      headers: { "Content-Type": "application/json" },
      requests: [
        {
          id: `req-${Date.now()}`,
          name: "Default Request",
          bodyType: "raw",
          body: "",
          expectedStatus: 200,
          expectedResponse: "",
          timeout: 30000,
        },
      ],
      tags: [],
      folderId: folder.id,
    }
    const createdTestCase = addTestCase(newTestCase)
    setSelectedTestCaseId(createdTestCase.id)
  }

  const handleAddSubfolder = () => {
    if (newFolderName.trim()) {
      addFolder({ name: newFolderName.trim(), parentId: folder.id })
      setNewFolderName("")
      setIsAddingSubfolder(false)
    }
  }

  const handleEditFolder = () => {
    if (newFolderName.trim()) {
      updateFolder(folder.id, { name: newFolderName.trim() })
      setNewFolderName("")
      setIsEditingFolder(false)
    }
  }

  const openEditFolderDialog = () => {
    setNewFolderName(folder.name)
    setIsEditingFolder(true)
  }

  const renderTestCaseItem = (testCase: TestCase) => {
    const status = getTestCaseStatus(testCase)
    return (
      <div key={testCase.id} className="group flex items-center">
        <Button
          variant={selectedTestCaseId === testCase.id ? "secondary" : "ghost"}
          className="flex-1 justify-start h-7 py-1 px-2 text-left text-xs"
          onClick={() => setSelectedTestCaseId(testCase.id)}
          style={{ paddingLeft: `${(level + 2) * 12}px` }}
        >
          <div className="flex items-center gap-1.5 w-full min-w-0">
            <FileIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate flex-1 text-xs">{testCase.name}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge variant="outline" className="px-1 py-0 text-[9px] font-normal h-4">
                {testCase.type}
              </Badge>
              {status && getStatusIcon(status)}
            </div>
          </div>
        </Button>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted">
                <MoreHorizontalIcon className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setSelectedTestCaseId(testCase.id)} className="text-xs">
                <EditIcon className="h-3 w-3 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs text-red-600">
                <TrashIcon className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  const totalItems = childFolders.length + folderTestCases.length

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="w-full">
        <div className="flex items-center group">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex-1 justify-start h-7 py-1 px-2 text-left text-xs"
              style={{ paddingLeft: `${level * 12}px` }}
            >
              <div className="flex items-center gap-1.5 w-full">
                <ChevronDownIcon className="h-3 w-3 shrink-0 transition-transform duration-200 data-[state=closed]:rotate-[-90deg]" />
                <FolderIcon className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium flex-1 text-xs">{folder.name}</span>
                <Badge variant="outline" className="px-1 py-0 text-[9px] font-normal h-4">
                  {totalItems}
                </Badge>
              </div>
            </Button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={handleAddTestCase}
              title="Add Test Case"
            >
              <PlusIcon className="h-3 w-3" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted">
                  <MoreHorizontalIcon className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setIsAddingSubfolder(true)} className="text-xs">
                  <FolderPlusIcon className="h-3 w-3 mr-2" />
                  Add Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openEditFolderDialog} className="text-xs">
                  <EditIcon className="h-3 w-3 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => deleteFolder(folder.id)} className="text-xs text-red-600">
                  <TrashIcon className="h-3 w-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CollapsibleContent className="space-y-0.5">
          {/* Render child folders */}
          {childFolders.map((childFolder) => (
            <FolderTreeItem key={childFolder.id} folder={childFolder} level={level + 1} />
          ))}

          {/* Render test cases */}
          {folderTestCases.map((testCase) => renderTestCaseItem(testCase))}

          {totalItems === 0 && (
            <p className="text-[10px] text-muted-foreground py-1 px-2" style={{ paddingLeft: `${(level + 1) * 12}px` }}>
              No items in this folder.
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Add Subfolder Dialog */}
      <Dialog open={isAddingSubfolder} onOpenChange={setIsAddingSubfolder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add New Folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Label htmlFor="new-subfolder-name" className="text-sm">
              Folder Name
            </Label>
            <Input
              id="new-subfolder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g., Authentication Tests"
              className="text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingSubfolder(false)} size="sm">
              Cancel
            </Button>
            <Button onClick={handleAddSubfolder} disabled={!newFolderName.trim()} size="sm">
              Add Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditingFolder} onOpenChange={setIsEditingFolder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Label htmlFor="edit-folder-name" className="text-sm">
              Folder Name
            </Label>
            <Input
              id="edit-folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g., Authentication Tests"
              className="text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingFolder(false)} size="sm">
              Cancel
            </Button>
            <Button onClick={handleEditFolder} disabled={!newFolderName.trim()} size="sm">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function TestCasesList({
  isCollapsed,
  onToggleCollapse,
}: { isCollapsed: boolean; onToggleCollapse: () => void }) {
  const {
    searchTerm,
    setSearchTerm,
    selectedType,
    setSelectedType,
    testCases,
    selectedTestCaseId,
    setSelectedTestCaseId,
    getTestCaseResults,
    addTestCase,
    folders,
    addFolder,
    getFolderChildren,
    getFilteredTestCases,
  } = useTestRunnerStore()

  const [newFolderName, setNewFolderName] = useState("")
  const [isAddingRootFolder, setIsAddingRootFolder] = useState(false)
  const [isCollectionsCollapsed, setIsCollectionsCollapsed] = useState(false)

  const allFilteredTestCases = getFilteredTestCases()
  const rootFolders = getFolderChildren(null) // Get root folders
  const uncategorizedTestCases = allFilteredTestCases.filter((tc) => tc.folderId === null || tc.folderId === undefined)

  const getTestCaseStatus = (testCase: TestCase) => {
    const results = getTestCaseResults(testCase.id)
    if (results.length === 0) return null

    const latestResults = results.slice(0, testCase.requests.length)
    if (latestResults.some((r) => r.status === "running")) return "running"
    if (latestResults.every((r) => r.status === "passed")) return "passed"
    if (latestResults.some((r) => r.status === "failed" || r.status === "timeout")) return "failed"
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <ClockIcon className="h-2.5 w-2.5 text-blue-500 animate-spin" />
      case "passed":
        return <CheckCircleIcon className="h-2.5 w-2.5 text-green-500" />
      case "failed":
        return <XCircleIcon className="h-2.5 w-2.5 text-red-500" />
      case "timeout":
        return <XCircleIcon className="h-2.5 w-2.5 text-orange-500" />
    }
  }

  const handleAddRootFolder = () => {
    if (newFolderName.trim()) {
      addFolder({ name: newFolderName.trim(), parentId: null })
      setNewFolderName("")
      setIsAddingRootFolder(false)
    }
  }

  const renderUncategorizedTestCase = (testCase: TestCase) => {
    const status = getTestCaseStatus(testCase)
    return (
      <div key={testCase.id} className="group flex items-center">
        <Button
          variant={selectedTestCaseId === testCase.id ? "secondary" : "ghost"}
          className="flex-1 justify-start h-7 py-1 px-2 text-left text-xs"
          onClick={() => setSelectedTestCaseId(testCase.id)}
        >
          <div className="flex items-center gap-1.5 w-full min-w-0">
            <FileIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate flex-1 text-xs">{testCase.name}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge variant="outline" className="px-1 py-0 text-[9px] font-normal h-4">
                {testCase.type}
              </Badge>
              {status && getStatusIcon(status)}
            </div>
          </div>
        </Button>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted">
                <MoreHorizontalIcon className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setSelectedTestCaseId(testCase.id)} className="text-xs">
                <EditIcon className="h-3 w-3 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs text-red-600">
                <TrashIcon className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  if (isCollapsed) {
    return (
      <div className="w-12 border-r bg-muted/10 flex flex-col items-center py-3">
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 mb-2"
          title="Expand sidebar"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <div className="flex flex-col gap-2">
          <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
            <SearchIcon className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
            <FolderIcon className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Collapse Button */}
      <div className="p-3 border-b flex items-center justify-between">
        <span className="text-sm font-medium">Test Cases</span>
        <Button onClick={onToggleCollapse} variant="ghost" size="sm" className="h-6 w-6 p-0" title="Collapse sidebar">
          <ChevronLeftIcon className="h-3 w-3" />
        </Button>
      </div>

      {/* Search Section */}
      <div className="p-3 pt-1 space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search tests..."
            className="pl-7 h-8 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-1">
          <Button
            variant={selectedType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("all")}
            className="flex-1 h-7 text-xs"
          >
            All
          </Button>
          <Button
            variant={selectedType === "individual" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("individual")}
            className="flex-1 h-7 text-xs"
          >
            Individual
          </Button>
          <Button
            variant={selectedType === "batch" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("batch")}
            className="flex-1 h-7 text-xs"
          >
            Batch
          </Button>
        </div>
      </div>

      {/* Collections Section */}
      <Collapsible open={!isCollectionsCollapsed} onOpenChange={setIsCollectionsCollapsed}>
        <div className="border-b">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-10 px-3 text-left">
              <div className="flex items-center gap-2">
                <FolderIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Collections</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsAddingRootFolder(true)
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-muted"
                  title="Add Collection"
                  asChild
                >
                  <PlusIcon className="h-3 w-3" />
                </Button>
                <ChevronDownIcon className="h-3 w-3 transition-transform duration-200 data-[state=closed]:rotate-[-90deg]" />
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="max-h-80">
              <div className="p-2 space-y-0.5">
                {/* Show message if no collections exist */}
                {rootFolders.length === 0 && (
                  <div className="text-center text-muted-foreground text-xs py-8">
                    <FolderIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="mb-1">No collections yet</p>
                    <p className="text-[10px]">Create a collection first to organize your test cases</p>
                  </div>
                )}

                {/* Root folders */}
                {rootFolders.map((folder) => (
                  <FolderTreeItem key={folder.id} folder={folder} level={0} />
                ))}

                {/* Uncategorized test cases - only show if they exist */}
                {uncategorizedTestCases.length > 0 && (
                  <>
                    {rootFolders.length > 0 && <div className="h-2" />}
                    <div className="text-xs text-muted-foreground px-2 py-1 font-medium">Uncategorized</div>
                    {uncategorizedTestCases.map((testCase) => renderUncategorizedTestCase(testCase))}
                  </>
                )}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Add Root Collection Dialog */}
      <Dialog open={isAddingRootFolder} onOpenChange={setIsAddingRootFolder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Label htmlFor="new-root-folder-name" className="text-sm">
              Collection Name
            </Label>
            <Input
              id="new-root-folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g., API Tests"
              className="text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingRootFolder(false)} size="sm">
              Cancel
            </Button>
            <Button onClick={handleAddRootFolder} disabled={!newFolderName.trim()} size="sm">
              Create Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
