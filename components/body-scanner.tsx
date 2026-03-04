"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Activity, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface BodyResult {
  bodyFatPercent: number
  muscleGroupAssessment: string
  postureNotes: string
  workoutRecommendations: string[]
}

interface BodyResponse extends Partial<BodyResult> {
  error?: string
}

export function BodyScanner() {
  const [image, setImage] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState("image/jpeg")
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState<BodyResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      setImage(ev.target?.result as string)
      setMimeType(file.type || "image/jpeg")
      setResults(null)
      setError(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!image) return

    setScanning(true)
    setError(null)

    try {
      const base64Image = image.split(",")[1]
      const response = await fetch("/api/body-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Image, mimeType }),
      })

      const data: BodyResponse = await response.json()
      if (!response.ok || !data.bodyFatPercent || !data.workoutRecommendations) {
        throw new Error(data.error || "Could not analyze your body image. Try another photo.")
      }

      setResults(data as BodyResult)
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Could not analyze your body image.")
    } finally {
      setScanning(false)
    }
  }, [image, mimeType])

  const handleReset = useCallback(() => {
    setImage(null)
    setResults(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Body Scanner</h1>
        <p className="mt-2 text-muted-foreground">Upload a body photo for body fat, posture, and workout feedback.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-0">
            {!image ? (
              <label htmlFor="body-upload" className="flex cursor-pointer flex-col items-center justify-center gap-4 p-12 transition-colors hover:bg-muted/50">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Activity className="h-8 w-8" /></div>
                <Button variant="outline" size="sm" className="rounded-lg"><Upload className="mr-2 h-3.5 w-3.5" />Choose File</Button>
                <input ref={fileInputRef} id="body-upload" type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
              </label>
            ) : (
              <div className="relative">
                <img src={image} alt="Uploaded body" className="aspect-[3/4] w-full object-cover" />
                <Button variant="secondary" size="icon" className="absolute right-3 top-3 rounded-full bg-background/80" onClick={handleReset} aria-label="Remove image"><X className="h-4 w-4" /></Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          {image && !results && (
            <Button onClick={handleAnalyze} disabled={scanning} size="lg" className="rounded-xl text-base font-semibold">
              {scanning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : <><Activity className="mr-2 h-4 w-4" />Analyze Body</>}
            </Button>
          )}

          {error && <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          {scanning && <p className="text-sm text-muted-foreground">AI is analyzing your body composition...</p>}

          {results && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="space-y-4 p-5">
                <p><span className="font-semibold">Estimated body fat:</span> {results.bodyFatPercent}%</p>
                <p><span className="font-semibold">Muscle group assessment:</span> {results.muscleGroupAssessment}</p>
                <p><span className="font-semibold">Posture notes:</span> {results.postureNotes}</p>
                <div>
                  <p className="mb-2 font-semibold">Workout recommendations</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {results.workoutRecommendations.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
                <Button variant="outline" onClick={handleReset} className="rounded-xl">Scan Again</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
