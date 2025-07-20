"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ChevronDownIcon, ChevronUpIcon, TrashIcon, PlusIcon, XIcon, EditIcon } from "lucide-react"
import type { TestRequest } from "@/stores/test-runner-store"

interface RequestEditorProps {
  request: TestRequest
  index: number
  onUpdate: (field: keyof TestRequest, value: any) => void
  onRemove: () => void
  isRemovable: boolean
}

export function RequestEditor({ request, index, onUpdate, onRemove, isRemovable }: RequestEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)

  const addFormField = () => {
    const newFormData = [...(request.formData || []), { key: "", value: "" }]
    onUpdate("formData", newFormData)
  }

  const updateFormField = (fieldIndex: number, field: "key" | "value", value: string) => {
    const newFormData = [...(request.formData || [])]
    newFormData[fieldIndex] = { ...newFormData[fieldIndex], [field]: value }
    onUpdate("formData", newFormData)
  }

  const removeFormField = (fieldIndex: number) => {
    const newFormData = request.formData?.filter((_, i) => i !== fieldIndex) || []
    onUpdate("formData", newFormData)
  }

  return (
    <Card className="border bg-background/50">
      <CardHeader className="p-2 pb-1 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0 group">
          {isEditingName ? (
            <Input
              value={request.name}
              onChange={(e) => onUpdate("name", e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingName(false)
                if (e.key === "Escape") setIsEditingName(false)
              }}
              className="h-5 text-xs font-medium w-auto max-w-[160px] px-1 py-0.5"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-xs font-medium truncate">{request.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingName(true)}
                onDoubleClick={() => setIsEditingName(true)}
                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
                title="Edit name"
              >
                <EditIcon className="h-2.5 w-2.5" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isRemovable && (
            <Button onClick={onRemove} size="sm" variant="ghost" className="text-red-500 h-5 w-5 p-0">
              <TrashIcon className="h-3 w-3" />
            </Button>
          )}
          <Button onClick={() => setIsExpanded(!isExpanded)} size="sm" variant="ghost" className="h-5 w-5 p-0">
            {isExpanded ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-2 pt-0 space-y-3">
          {/* Body Type Tabs */}
          <div className="space-y-2">
            <div className="flex border-b">
              {[
                { value: "none", label: "None" },
                { value: "raw", label: "Raw" },
                { value: "form-data", label: "Form Data" },
                { value: "x-www-form-urlencoded", label: "URL Encoded" },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => onUpdate("bodyType", type.value)}
                  className={`px-3 py-1 text-xs font-medium border-b-2 transition-colors ${
                    (request.bodyType || "raw") === type.value
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Body Content Based on Type */}
            <div className="min-h-[60px]">
              {request.bodyType === "raw" && (
                <Textarea
                  value={request.body || ""}
                  onChange={(e) => onUpdate("body", e.target.value)}
                  className="font-mono text-xs h-20 resize-none"
                  placeholder="Request body (JSON, text, etc.)"
                />
              )}

              {(request.bodyType === "form-data" || request.bodyType === "x-www-form-urlencoded") && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Form Fields</span>
                    <Button onClick={addFormField} size="sm" variant="outline" className="h-5 text-xs bg-transparent">
                      <PlusIcon className="h-2.5 w-2.5 mr-1" />
                      Add Field
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {request.formData?.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="flex gap-1 items-center">
                        <Input
                          value={field.key}
                          onChange={(e) => updateFormField(fieldIndex, "key", e.target.value)}
                          placeholder="Key"
                          className="h-6 text-xs flex-1"
                        />
                        <Input
                          value={field.value}
                          onChange={(e) => updateFormField(fieldIndex, "value", e.target.value)}
                          placeholder="Value"
                          className="h-6 text-xs flex-1"
                        />
                        <Button
                          onClick={() => removeFormField(fieldIndex)}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {(!request.formData || request.formData.length === 0) && (
                      <div className="text-xs text-muted-foreground py-2 text-center">No form fields added yet</div>
                    )}
                  </div>
                </div>
              )}

              {request.bodyType === "none" && (
                <div className="text-xs text-muted-foreground py-4 text-center">No request body will be sent</div>
              )}
            </div>
          </div>

          {/* Compact Validation Settings */}
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              value={request.expectedStatus}
              onChange={(e) => onUpdate("expectedStatus", Number.parseInt(e.target.value))}
              className="h-6 text-xs"
              min="100"
              max="599"
              title="Expected HTTP status code"
              placeholder="200"
            />
            <Input
              type="number"
              value={request.timeout}
              onChange={(e) => onUpdate("timeout", Number.parseInt(e.target.value))}
              className="h-6 text-xs"
              min="1000"
              step="1000"
              title="Request timeout in milliseconds"
              placeholder="30000"
            />
            <Input
              value={request.expectedResponse}
              onChange={(e) => onUpdate("expectedResponse", e.target.value)}
              placeholder="Expected text in response"
              className="h-6 text-xs"
              title="Text that should be found in the response (optional)"
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}
