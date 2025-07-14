"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ExpandIcon, CopyIcon, CheckIcon } from "lucide-react"

interface EditableCellProps {
  value: any
  type: "text" | "number" | "date" | "select" | "boolean" | "longtext"
  options?: string[]
  onChange: (value: any) => void
}

export function EditableCell({ value, type, options, onChange }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleSave = () => {
    onChange(editValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && type !== "longtext") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      setEditValue(value)
      setIsEditing(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value?.toString() || "")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const truncateText = (text: string, maxLength = 100) => {
    if (!text) return ""
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  const getWordCount = (text: string) => {
    return text ? text.trim().split(/\s+/).length : 0
  }

  const getCharCount = (text: string) => {
    return text ? text.length : 0
  }

  if (type === "boolean") {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox checked={value} onCheckedChange={(checked) => onChange(checked)} />
      </div>
    )
  }

  if (type === "select" && options) {
    return (
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Handle long text content (LLM outputs)
  if (type === "longtext" || (typeof value === "string" && value.length > 100)) {
    const displayValue = value?.toString() || ""
    const wordCount = getWordCount(displayValue)
    const charCount = getCharCount(displayValue)

    if (isEditing) {
      return (
        <div className="space-y-2">
          <Textarea
            value={editValue || ""}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] w-full resize-y"
            placeholder="Enter text..."
            autoFocus
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {getWordCount(editValue || "")} words
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getCharCount(editValue || "")} chars
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="group relative">
        <div className="space-y-2">
          <div
            className="min-h-[60px] max-h-[120px] overflow-hidden cursor-pointer hover:bg-muted/50 rounded p-2 border border-transparent hover:border-border transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{truncateText(displayValue, 200)}</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                {wordCount} words
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {charCount} chars
              </Badge>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={copyToClipboard}>
                {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
              </Button>

              <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <ExpandIcon className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      <span>Full Content</span>
                      <div className="flex gap-2">
                        <Badge variant="outline">{wordCount} words</Badge>
                        <Badge variant="outline">{charCount} characters</Badge>
                      </div>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="max-h-[60vh] overflow-auto">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted/30 rounded-lg">
                        {displayValue}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={copyToClipboard}>
                        {copied ? (
                          <>
                            <CheckIcon className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <CopyIcon className="h-4 w-4 mr-2" />
                            Copy All
                          </>
                        )}
                      </Button>
                      <Button onClick={() => setIsEditing(true)}>Edit Content</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Handle regular short content
  if (isEditing) {
    return (
      <Input
        type={type === "number" ? "number" : type === "date" ? "date" : "text"}
        value={editValue || ""}
        onChange={(e) => setEditValue(type === "number" ? Number(e.target.value) : e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full"
        autoFocus
      />
    )
  }

  return (
    <div className="min-h-[32px] px-2 py-1 cursor-pointer hover:bg-muted/50 rounded" onClick={() => setIsEditing(true)}>
      {type === "number" && typeof value === "number"
        ? value.toLocaleString()
        : type === "date"
          ? new Date(value).toLocaleDateString()
          : value?.toString() || ""}
    </div>
  )
}
