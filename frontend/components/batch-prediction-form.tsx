"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Download, Loader2, Upload } from "lucide-react"
import { submitBatchPrediction, checkBatchStatus } from "@/lib/api"
import { Progress } from "@/components/ui/progress"

export default function BatchPredictionForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [batchStatus, setBatchStatus] = useState<string | null>(null)
  const [resultsUrl, setResultsUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== "text/csv") {
        setError("Please upload a CSV file")
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const response = await submitBatchPrediction(file)
      setBatchId(response.batch_id)
      setBatchStatus(response.status)

      // Start polling for status updates
      const interval = setInterval(async () => {
        if (batchId) {
          const statusResponse = await checkBatchStatus(batchId)
          setBatchStatus(statusResponse.status)

          if (statusResponse.status === "completed") {
            setResultsUrl(statusResponse.results_url)
            if (pollingInterval) clearInterval(pollingInterval)
          } else if (statusResponse.status === "failed") {
            setError("Batch processing failed. Please try again.")
            if (pollingInterval) clearInterval(pollingInterval)
          }
        }
      }, 5000) // Poll every 5 seconds

      setPollingInterval(interval)
    } catch (error) {
      console.error("Batch upload failed:", error)
      setError("Failed to upload batch file. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setBatchId(null)
    setBatchStatus(null)
    setResultsUrl(null)
    setError(null)
    if (pollingInterval) clearInterval(pollingInterval)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {batchStatus === "completed" && resultsUrl ? (
        <div className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Processing Complete</AlertTitle>
            <AlertDescription className="text-green-700">
              Your batch prediction has been processed successfully.
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Button asChild className="w-full sm:w-auto">
              <a href={resultsUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download Results
              </a>
            </Button>
          </div>

          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={resetForm}>
              Process Another Batch
            </Button>
          </div>
        </div>
      ) : batchStatus === "processing" ? (
        <div className="space-y-4">
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Processing</AlertTitle>
            <AlertDescription>Your batch file is being processed. This may take a few minutes.</AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing batch</span>
              <span>Please wait...</span>
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="csv-upload">Upload CSV File</Label>
            <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} disabled={isUploading} />
            <p className="text-sm text-muted-foreground">
              CSV must include headers: date, department, team, targeted_productivity, smv_minutes, over_time_hours,
              incentive_level, idle_time_minutes, idle_men_count, style_change_count, worker_count
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={!file || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload and Process
                </>
              )}
            </Button>

            <Button type="button" variant="outline" onClick={() => setFile(null)} disabled={!file || isUploading}>
              Clear
            </Button>
          </div>

          {file && (
            <p className="text-sm">
              Selected file: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </form>
      )}
    </div>
  )
}
