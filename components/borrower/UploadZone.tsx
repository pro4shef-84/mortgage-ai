'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { Upload, Camera, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatFileSize } from '@/src/lib/utils'

interface UploadZoneProps {
  requirementId: string
  portalToken: string
  docTypeLabel: string
  onSuccess?: () => void
}

type UploadState = 'idle' | 'dragging' | 'selected' | 'uploading' | 'success' | 'error'

export function UploadZone({ requirementId, portalToken, docTypeLabel, onSuccess }: UploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [issues, setIssues] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setState('dragging')
  }

  function handleDragLeave() {
    setState('idle')
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) selectFile(dropped)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) selectFile(selected)
  }

  function selectFile(f: File) {
    const MAX = 25 * 1024 * 1024
    const ALLOWED = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif']

    if (f.size > MAX) {
      setState('error')
      setErrorMessage('File is too large. Maximum size is 25MB.')
      return
    }
    if (!ALLOWED.includes(f.type)) {
      setState('error')
      setErrorMessage('File type not supported. Please use PDF, JPG, or PNG.')
      return
    }
    setFile(f)
    setState('selected')
  }

  async function handleUpload() {
    if (!file) return
    setState('uploading')
    setIssues([])

    const formData = new FormData()
    formData.append('file', file)
    formData.append('requirement_id', requirementId)

    try {
      const res = await fetch(`/api/portal/${portalToken}/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setState('error')
        setErrorMessage(data.error ?? 'Upload failed. Please try again.')
        return
      }

      if (data.validation_issues?.length > 0) {
        setIssues(data.validation_issues)
      }

      setState('success')
      onSuccess?.()
    } catch {
      setState('error')
      setErrorMessage('Network error. Please check your connection and try again.')
    }
  }

  function reset() {
    setState('idle')
    setFile(null)
    setErrorMessage('')
    setIssues([])
    if (inputRef.current) inputRef.current.value = ''
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">Document received!</p>
          <p className="text-sm text-slate-500 mt-1">
            We&apos;re reviewing your {docTypeLabel}. You&apos;ll hear back if anything else is needed.
          </p>
        </div>
        {issues.length > 0 && (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
            <p className="font-semibold text-amber-800 mb-2">A few things to note:</p>
            <ul className="space-y-1">
              {issues.map((issue, i) => (
                <li key={i} className="text-sm text-amber-700">• {issue}</li>
              ))}
            </ul>
          </div>
        )}
        <Button variant="ghost" onClick={reset}>Upload another file</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          state === 'dragging'
            ? 'border-amber-400 bg-amber-50'
            : state === 'selected'
            ? 'border-emerald-400 bg-emerald-50'
            : state === 'error'
            ? 'border-red-300 bg-red-50'
            : 'border-slate-300 bg-slate-50 hover:border-amber-400 hover:bg-amber-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
          capture="environment"
          onChange={handleFileChange}
        />

        {state === 'selected' && file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 text-emerald-500" />
            <p className="font-medium text-slate-900">{file.name}</p>
            <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
          </div>
        ) : state === 'error' ? (
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="font-medium text-red-700">{errorMessage}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-slate-400" />
            <div>
              <p className="font-medium text-slate-700">Drop your file here</p>
              <p className="text-sm text-slate-500 mt-1">or tap to browse</p>
            </div>
            <p className="text-xs text-slate-400">PDF, JPG, PNG up to 25MB</p>
          </div>
        )}
      </div>

      {/* Mobile camera shortcut */}
      <button
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.removeAttribute('capture')
            inputRef.current.setAttribute('capture', 'environment')
            inputRef.current.click()
          }
        }}
        className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors"
      >
        <Camera className="w-4 h-4" />
        Take a photo with your camera
      </button>

      {/* Action buttons */}
      <div className="flex gap-3">
        {(state === 'selected' || state === 'uploading') && (
          <>
            <Button
              variant="outline"
              onClick={reset}
              disabled={state === 'uploading'}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              loading={state === 'uploading'}
              className="flex-1"
              size="lg"
            >
              {state === 'uploading' ? 'Uploading...' : 'Submit Document'}
            </Button>
          </>
        )}
        {state === 'error' && (
          <Button variant="outline" onClick={reset} className="w-full">
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}
