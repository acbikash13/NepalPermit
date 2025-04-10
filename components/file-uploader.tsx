"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileIcon, Loader2 } from "lucide-react"

interface FileUploaderProps {
  accept?: string
  maxSize?: number
  onFileSelect: (file: File | null) => void
  label?: string
}

export function FileUploader({
  accept,
  maxSize = 5 * 1024 * 1024, // 5MB default
  onFileSelect,
  label = "Upload file",
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null

    if (!selectedFile) {
      setFile(null)
      setPreview(null)
      onFileSelect(null)
      return
    }

    setIsLoading(true)
    setError(null)

    // Check file size
    if (selectedFile.size > maxSize) {
      setError(`File size exceeds the limit of ${formatFileSize(maxSize)}`)
      setIsLoading(false)
      return
    }

    // Validate file type if accept is specified
    if (accept) {
      const acceptedTypes = accept.split(",").map((type) => type.trim())
      const fileType = selectedFile.type
      const fileExtension = `.${selectedFile.name.split(".").pop()?.toLowerCase()}`

      const isValidType = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          // Extension check
          return fileExtension === type
        } else if (type.includes("*")) {
          // Wildcard MIME type check (e.g., "image/*")
          return fileType.startsWith(type.split("*")[0])
        } else {
          // Exact MIME type check
          return fileType === type
        }
      })

      if (!isValidType) {
        setError(`Invalid file type. Accepted formats: ${accept}`)
        setIsLoading(false)
        return
      }
    }

    setFile(selectedFile)
    onFileSelect(selectedFile)

    // Create preview for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
        setIsLoading(false)
      }
      reader.onerror = () => {
        setError("Failed to read file")
        setIsLoading(false)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      // For non-image files, show a generic preview based on file type
      setPreview(null)
      setIsLoading(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    onFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-2">
      {!file ? (
        <div
          className="border-2 border-dashed rounded-md p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xs text-gray-400 mt-1">
            {accept ? `Accepted formats: ${accept}` : ""}
            {accept && maxSize ? " • " : ""}
            {maxSize ? `Max size: ${formatFileSize(maxSize)}` : ""}
          </p>
          <input type="file" ref={fileInputRef} className="hidden" accept={accept} onChange={handleFileChange} />
        </div>
      ) : (
        <div className="border rounded-md p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            ) : preview ? (
              <img src={preview || "/placeholder.svg"} alt="Preview" className="h-10 w-10 object-cover rounded" />
            ) : (
              <FileIcon className="h-10 w-10 text-blue-500" />
            )}
            <div className="text-sm">
              <p className="font-medium truncate max-w-[200px]">{file.name}</p>
              <p className="text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
