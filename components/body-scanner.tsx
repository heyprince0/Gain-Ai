"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Upload,
    Activity,
    X,
    Loader2,
    TrendingUp,
    TrendingDown,
    Minus,
    Camera,
    Sparkles,
    Dumbbell,
    Heart,
    Droplet,
    Bone,
    User,
    CheckCircle2,
    AlertCircle,
    Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { processImageFile } from "@/lib/image"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

// ─── Types ────────────────────────────────────────────────────────────────

interface BodyResult {
    body_fat: number
    bmi: number
    body_type: string
    body_type_description: string
    body_type_characteristics?: string[]
    muscle: number
    fat: number
    bone: number
    water: number
    areas_to_improve?: string[]
    notes: string
    is_perfect?: boolean
    // legacy fallback
    bodyFatPercent?: number
    category?: string
    muscleMass?: string
    recommendations?: string[]
    composition?: {
        label: string
        value: number
        color: string
    }[]
}

type Gender = "male" | "female"

// ─── Body Type Data ──────────────────────────────────────────────────────

const BODY_TYPE_INFO: Record<
    string,
    {
        label: string
        emoji: string
        bg: string
        text: string
        border: string
        description: string
        characteristics: string[]
        advice: string
    }
> = {
    // ── Male types ──
    Ectomorph: {
        label: "Ectomorph",
        emoji: "🧍",
        bg: "#3b82f6",
        text: "#fff",
        border: "border-blue-500/30",
        description:
            "Naturally lean and slender with a fast metabolism. You have a smaller frame and find it challenging to gain weight or muscle mass.",
        characteristics: ["Lean build", "Fast metabolism", "Small frame", "Hard gainer"],
        advice:
            "Focus on compound lifts (squats, deadlifts, bench press) with progressive overload. Increase calorie intake with nutrient-dense foods and prioritize protein (1.6–2.2g per kg of body weight).",
    },
    Mesomorph: {
        label: "Mesomorph",
        emoji: "💪",
        bg: "#22c55e",
        text: "#000",
        border: "border-green-500/30",
        description:
            "Naturally athletic and muscular with a medium frame. You gain muscle easily and maintain a lean physique with relative ease.",
        characteristics: ["Athletic build", "Gains muscle easily", "Medium frame", "Responsive to training"],
        advice:
            "Capitalize on your genetics with a balanced training split (push/pull/legs or upper/lower). Keep nutrition consistent—you're primed for both strength and hypertrophy.",
    },
    Endomorph: {
        label: "Endomorph",
        emoji: "🔄",
        bg: "#f97316",
        text: "#000",
        border: "border-orange-500/30",
        description:
            "Naturally broader and rounder with a larger frame. You gain muscle and fat easily, making weight management a key focus.",
        characteristics: ["Broader frame", "Gains weight easily", "Soft physique", "Strong lower body"],
        advice:
            "Prioritize a caloric deficit with high protein and fiber. Combine strength training with regular cardio (LISS and HIIT) to manage body fat while preserving muscle.",
    },
    Athletic: {
        label: "Athletic",
        emoji: "🏋️",
        bg: "#00ff88",
        text: "#000",
        border: "border-emerald-400/30",
        description:
            "Highly muscular and lean with exceptional muscle definition. You're in peak physical condition with low body fat and strong cardiovascular fitness.",
        characteristics: ["Low body fat", "High muscle definition", "Strong cardiovascular", "Peak condition"],
        advice:
            "Maintain your routine with periodized training. Focus on weak points, mobility work, and recovery. Keep protein high and stay consistent—you're already at an elite level.",
    },
    Overweight: {
        label: "Overweight",
        emoji: "⚖️",
        bg: "#fb923c",
        text: "#000",
        border: "border-amber-500/30",
        description:
            "Carrying excess weight relative to height with a higher proportion of body fat. Focus on gradual, sustainable weight loss.",
        characteristics: ["Higher body fat", "Reduced muscle definition", "Risk of metabolic issues"],
        advice:
            "Start with a moderate caloric deficit (300–500 kcal/day) and low-impact cardio (walking, cycling). Add resistance training 2–3x/week to preserve muscle. Consistency over perfection.",
    },
    Fat: {
        label: "Fat",
        emoji: "📊",
        bg: "#ef4444",
        text: "#fff",
        border: "border-red-500/30",
        description:
            "Significantly higher body fat percentage with limited muscle definition. Weight loss and lifestyle changes are the primary focus.",
        characteristics: ["High body fat", "Low muscle definition", "Increased health risks"],
        advice:
            "Consult a healthcare professional before starting. Begin with gentle activity (walking, swimming) and a structured nutrition plan. Focus on whole foods, portion control, and gradual progress.",
    },
    Obese: {
        label: "Obese",
        emoji: "⚠️",
        bg: "#dc2626",
        text: "#fff",
        border: "border-red-600/30",
        description:
            "Very high body fat percentage that may pose significant health risks. Immediate lifestyle changes are recommended.",
        characteristics: ["Very high body fat", "Low muscle mass", "Increased health risks"],
        advice:
            "Consult a healthcare professional immediately. Start with a medically supervised plan focusing on nutrition, gentle movement, and behavioral changes. Small, consistent steps lead to big results.",
    },
    Skinny: {
        label: "Skinny",
        emoji: "🦴",
        bg: "#6b7280",
        text: "#fff",
        border: "border-gray-500/30",
        description:
            "Very lean with low muscle mass and low body fat. You have a slender frame and may struggle to gain weight or muscle.",
        characteristics: ["Low muscle mass", "Low body fat", "Slender frame", "Underweight"],
        advice:
            "Focus on strength training with heavy compound movements. Increase calorie intake with a focus on protein and healthy fats. Aim for 3–4 meals daily with snacks to support muscle growth.",
    },

    // ── Female types ──
    Hourglass: {
        label: "Hourglass",
        emoji: "⌛",
        bg: "#ec4899",
        text: "#fff",
        border: "border-pink-500/30",
        description:
            "Well-defined waist with balanced bust and hip measurements. This is a classic feminine silhouette with natural curves and proportion.",
        characteristics: ["Defined waist", "Balanced bust & hips", "Natural curves", "Proportionate"],
        advice:
            "Maintain your physique with a mix of cardio (2–3x/week) and strength training (3x/week). Focus on core work and full-body movements to preserve your balanced shape.",
    },
    Pear: {
        label: "Pear",
        emoji: "🍐",
        bg: "#f472b6",
        text: "#000",
        border: "border-pink-400/30",
        description:
            "Hips are wider than the bust with a well-defined waist. Weight tends to accumulate in the lower body, giving a 'pear' or 'triangle' shape.",
        characteristics: ["Wider hips", "Defined waist", "Smaller bust", "Lower-body weight"],
        advice:
            "Focus on upper body strength training (shoulders, back, chest) to create balance. For lower body, use higher reps with moderate weight to tone without bulking.",
    },
    Apple: {
        label: "Apple",
        emoji: "🍎",
        bg: "#f97316",
        text: "#000",
        border: "border-orange-500/30",
        description:
            "Bust is wider than the hips with a fuller midsection. Weight tends to accumulate in the upper body and abdomen.",
        characteristics: ["Fuller midsection", "Wider bust", "Narrower hips", "Upper-body weight"],
        advice:
            "Prioritize core-strengthening exercises (planks, hollow holds) and full-body workouts. Incorporate cardio (3–4x/week) and reduce refined carbs to manage midsection fat.",
    },
    Rectangle: {
        label: "Rectangle",
        emoji: "▬",
        bg: "#8b5cf6",
        text: "#fff",
        border: "border-purple-500/30",
        description:
            "Straight silhouette with minimal waist definition. Bust and hip measurements are similar, creating a 'banana' or 'column' shape.",
        characteristics: ["Straight silhouette", "Minimal waist definition", "Balanced bust & hips", "Athletic frame"],
        advice:
            "Build curves through targeted muscle building. Focus on glute bridges, hip thrusts, and lateral raises. A mix of strength training and Pilates can enhance your natural shape.",
    },
    "Inverted Triangle": {
        label: "Inverted Triangle",
        emoji: "🔻",
        bg: "#a78bfa",
        text: "#000",
        border: "border-violet-500/30",
        description:
            "Bust is wider than the hips with a straighter waist. Weight tends to accumulate in the upper body, creating a 'V' or 'inverted triangle' shape.",
        characteristics: ["Wider bust", "Straight waist", "Narrower hips", "Upper-body weight"],
        advice:
            "Focus on lower body strength training (squats, lunges, leg press) to balance your upper body. For upper body, use higher reps to tone without adding bulk.",
    },
}

// ─── Helper Functions ──────────────────────────────────────────────────

function getBodyTypeInfo(type?: string): typeof BODY_TYPE_INFO[string] | null {
    if (!type) return null
    // try exact match, then case-insensitive
    if (BODY_TYPE_INFO[type]) return BODY_TYPE_INFO[type]
    const lower = type.toLowerCase()
    for (const [key, val] of Object.entries(BODY_TYPE_INFO)) {
        if (key.toLowerCase() === lower) return val
    }
    return null
}

function getBodyTypeColor(type?: string) {
    const info = getBodyTypeInfo(type)
    if (info) return { bg: info.bg, text: info.text }
    return { bg: "#6b7280", text: "#fff" }
}

// ─── Sub-Components ─────────────────────────────────────────────────────

function BodyTypeCard({ bodyType, description, characteristics }: {
    bodyType: string
    description: string
    characteristics?: string[]
}) {
    const info = getBodyTypeInfo(bodyType)
    const colors = getBodyTypeColor(bodyType)

    return (
        <Card className={cn("overflow-hidden border-2", info?.border || "border-border/50")}>
            <CardContent className="p-5">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">
                            {info?.label || bodyType}
                        </h3>
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Body Type
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                    {characteristics && characteristics.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {characteristics.map((char, i) => (
                                <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-[10px] font-medium"
                                >
                                    {char}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function AreasToImproveCard({
    areas,
    isPerfect,
    bodyType,
    notes,
}: {
    areas?: string[]
    isPerfect?: boolean
    bodyType?: string
    notes?: string
}) {
    const info = getBodyTypeInfo(bodyType)

    // If the user is in great shape, show a "perfect" message
    if (isPerfect || bodyType === "Athletic" || bodyType === "Mesomorph") {
        return (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-emerald-700 dark:text-emerald-400">
                                You're in Great Shape! 💪
                            </h4>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {notes ||
                                    "Your body composition is excellent. Keep up your current routine—focus on maintenance, mobility, and enjoying your fitness journey."}
                            </p>
                            {info && (
                                <p className="mt-2 text-xs text-muted-foreground/70">
                                    {info.advice}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // If there are areas to improve, show them
    if (areas && areas.length > 0) {
        return (
            <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-amber-700 dark:text-amber-400">
                                Areas to Improve
                            </h4>
                            <div className="mt-3 space-y-2">
                                {areas.map((area, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-2 rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm"
                                    >
                                        <span className="mt-0.5 text-amber-500">•</span>
                                        <span className="text-foreground/90">{area}</span>
                                    </div>
                                ))}
                            </div>
                            {notes && (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {notes}
                                </p>
                            )}
                            {info && (
                                <p className="mt-2 text-xs text-muted-foreground/70">
                                    💡 {info.advice}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Fallback: no areas and not perfect – show generic advice
    return (
        <Card className="border-border/50">
            <CardContent className="p-5">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Info className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground">Personalized Advice</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {notes || "Focus on consistency in your training and nutrition. Small daily habits lead to long-term results."}
                        </p>
                        {info && (
                            <p className="mt-2 text-xs text-muted-foreground/70">
                                💡 {info.advice}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// ─── Main Component ─────────────────────────────────────────────────────

export function BodyScanner() {
    const { user } = useAuth()
    const router = useRouter()

    // ── State ──
    const [gender, setGender] = useState<Gender>("male")
    const [image, setImage] = useState<string | null>(null)
    const [scanning, setScanning] = useState(false)
    const [results, setResults] = useState<BodyResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)
    const [saveMessage, setSaveMessage] = useState("")
    const [preparing, setPreparing] = useState(false)
    const [cameraInputKey, setCameraInputKey] = useState(0)
    const [loadingProfile, setLoadingProfile] = useState(true)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // ── Fetch user profile to get gender ──
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoadingProfile(false)
                return
            }
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('gender')
                    .eq('id', user.id)
                    .single()

                if (error) {
                    console.error('Error fetching profile gender:', error)
                } else if (data?.gender) {
                    // Map the profile gender string to our Gender type
                    const genderLower = data.gender.toLowerCase()
                    if (genderLower === 'male' || genderLower === 'female') {
                        setGender(genderLower as Gender)
                    }
                }
            } catch (err) {
                console.error('Failed to load profile gender:', err)
            } finally {
                setLoadingProfile(false)
            }
        }

        fetchProfile()
    }, [user])

    // ── Session restore for image ──
    useEffect(() => {
        const fromCamera = sessionStorage.getItem('bodyScannerFromCamera')
        if (fromCamera) {
            const stored = sessionStorage.getItem('bodyScannerImage')
            if (stored) setImage(stored)
            sessionStorage.removeItem('bodyScannerFromCamera')
        } else {
            sessionStorage.removeItem('bodyScannerImage')
        }
    }, [])

    const setImageWithStorage = useCallback((dataUrl: string | null) => {
        if (dataUrl) {
            sessionStorage.setItem('bodyScannerImage', dataUrl)
            sessionStorage.setItem('bodyScannerFromCamera', 'true')
        } else {
            sessionStorage.removeItem('bodyScannerImage')
            sessionStorage.removeItem('bodyScannerFromCamera')
        }
        setImage(dataUrl)
    }, [])

    const colors = getBodyTypeColor(results?.body_type)

    // ── Handlers ──

    const handleUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const input = e.target
            const file = input.files?.[0]
            if (!file) {
                input.value = ''
                return
            }
            setError(null)
            setResults(null)
            setPreparing(true)
            try {
                const dataUrl = await processImageFile(file)
                setImageWithStorage(dataUrl)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not load the image')
            } finally {
                setPreparing(false)
                input.value = ''
            }
        },
        [setImageWithStorage]
    )

    const handleAnalyze = useCallback(async () => {
        if (!image) return
        setScanning(true)
        setError(null)
        try {
            const base64Image = image.split(',')[1]

            const genderLabel = gender === 'male' ? 'male' : 'female'
            const bodyTypesForGender =
                gender === 'male'
                    ? 'Ectomorph, Mesomorph, Endomorph, Athletic, Overweight, Fat, Obese, Skinny'
                    : 'Hourglass, Pear, Apple, Rectangle, Inverted Triangle'

            const prompt = `Analyze this body image of a ${genderLabel} person and return ONLY valid JSON with no markdown, no extra text.

The JSON must have this exact structure:
{
  "body_fat": <number 0-100>,
  "bmi": <number 10-50>,
  "body_type": "<one of: ${bodyTypesForGender}>",
  "body_type_description": "<one-sentence description of the body type>",
  "body_type_characteristics": ["<char 1>", "<char 2>", "<char 3>"],
  "muscle": <number 0-100>,
  "fat": <number 0-100>,
  "bone": <number 0-100>,
  "water": <number 0-100>,
  "areas_to_improve": ["<area 1>", "<area 2>", "<area 3>"],
  "notes": "<brief personalized advice>",
  "is_perfect": <true if the person is in excellent shape (athletic, low body fat, good muscle definition), otherwise false>
}

Important rules:
- For ${genderLabel} body types, use the appropriate ${genderLabel} categories.
- If the person is highly muscular and lean with low body fat, set is_perfect = true and make areas_to_improve a short array (1-2 items max) with general maintenance advice.
- If the person is not in great shape, set is_perfect = false and provide 3-4 specific, actionable areas to improve.
- For "Skinny" or "Ectomorph", areas should focus on muscle building.
- For "Overweight", "Fat", "Obese", or "Endomorph", areas should focus on fat loss and nutrition.
- For female types: Hourglass → maintenance, Pear → upper body focus, Apple → core + cardio, Rectangle → curve building, Inverted Triangle → lower body focus.
- All percentages (muscle, fat, bone, water) should sum to approximately 100.
- BMI should be a realistic number based on the visual assessment.

Return ONLY the JSON object. No explanations, no markdown.`

            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                                { text: prompt },
                            ],
                        },
                    ],
                }),
            })

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error.message)
            }

            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('No response from body analysis')
            }

            const rawText = data.candidates[0].content.parts[0].text
            const cleanText = rawText.replace(/```json|```/g, '').trim()
            const parsed = JSON.parse(cleanText)

            // ensure fields exist
            const result: BodyResult = {
                body_fat: parsed.body_fat ?? parsed.bodyFatPercent ?? 0,
                bmi: parsed.bmi ?? 0,
                body_type: parsed.body_type || 'Unknown',
                body_type_description: parsed.body_type_description || '',
                body_type_characteristics: parsed.body_type_characteristics || [],
                muscle: parsed.muscle ?? 0,
                fat: parsed.fat ?? 0,
                bone: parsed.bone ?? 0,
                water: parsed.water ?? 0,
                areas_to_improve: parsed.areas_to_improve || [],
                notes: parsed.notes || '',
                is_perfect: parsed.is_perfect ?? false,
            }

            setResults(result)
            setSaved(false)
            setSaveMessage('')
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to analyze body'
            setError(errorMsg)
            setResults(null)
        } finally {
            setScanning(false)
        }
    }, [image, gender])

    const handleSave = async () => {
        if (!user || !results) return
        setSaved(true)
        try {
            const now = new Date().toISOString()
            const insertObj: any = {
                user_id: user.id,
                body_fat: Number(results.body_fat ?? results.bodyFatPercent ?? 0) || 0,
                body_type: results.body_type || 'Unknown',
                notes: results.notes || '',
                scanned_at: now,
            }

            const { error } = await supabase.from('body_scans').insert(insertObj)
            if (error) throw error
            setSaveMessage('✅ Saved to Dashboard!')
            router.refresh()
        } catch (err) {
            console.error(err)
            setSaveMessage('Failed to save')
            setSaved(false)
        }
    }

    const handleReset = useCallback(() => {
        setImageWithStorage(null)
        setResults(null)
        setError(null)
        setSaved(false)
        setSaveMessage('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }, [setImageWithStorage])

    // If still loading profile, show a spinner (optional – you can also just render with default "male")
    if (loadingProfile) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // ─── Render ──────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Body Scanner
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Upload a full-body photo to get AI-powered body composition analysis.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* ─── Upload Area ─── */}
                <Card className="overflow-hidden border-border/50">
                    <CardContent className="p-0">
                        {!image ? (
                            <div className="flex flex-col items-center justify-center gap-5 p-8">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    {preparing ? (
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    ) : (
                                        <Activity className="h-8 w-8" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-foreground">
                                        {preparing ? 'Preparing your photo…' : 'Upload body photo'}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {preparing
                                            ? 'This takes a couple of seconds for big photos'
                                            : 'Full-body photo for best results'}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-lg"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="mr-2 h-3.5 w-3.5" />
                                        Upload Image
                                    </Button>
                                    <label className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 h-8 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors whitespace-nowrap">
                                        <Camera className="mr-2 h-3.5 w-3.5" />
                                        Take Photo
                                        <input
                                            key={cameraInputKey}
                                            type="file"
                                            accept="image/*"
                                            capture="user"
                                            className="sr-only"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (!file) return
                                                setError(null)
                                                setResults(null)
                                                setPreparing(true)
                                                setCameraInputKey((k) => k + 1)
                                                processImageFile(file)
                                                    .then((dataUrl) => setImageWithStorage(dataUrl))
                                                    .catch((err) =>
                                                        setError(
                                                            err instanceof Error ? err.message : 'Could not load the image'
                                                        )
                                                    )
                                                    .finally(() => setPreparing(false))
                                            }}
                                        />
                                    </label>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={handleUpload}
                                />
                            </div>
                        ) : (
                            <div className="relative">
                                <img
                                    src={image}
                                    alt="Uploaded body photo"
                                    className="aspect-[3/4] w-full object-cover"
                                />
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute right-3 top-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                                    onClick={handleReset}
                                    aria-label="Remove image"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ─── Right Column ─── */}
                <div className="flex flex-col gap-4">
                    {results ? (
                        <>
                            {/* Body Type Card — prominent */}
                            <BodyTypeCard
                                bodyType={results.body_type}
                                description={results.body_type_description}
                                characteristics={results.body_type_characteristics}
                            />

                            {/* Body Analysis — fat + BMI */}
                            <Card className="border-primary/20 bg-primary/5">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-foreground">Body Analysis</p>
                                        <Badge
                                            className="text-[10px] font-medium uppercase tracking-wider"
                                            style={{
                                                background: colors.bg,
                                                color: colors.text,
                                            }}
                                        >
                                            {results.body_type}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <p className="text-2xl font-bold text-primary">
                                                {(results.body_fat ?? results.bodyFatPercent)}%
                                            </p>
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                                Body Fat
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{results.bmi}</p>
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                                BMI
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Body Composition */}
                            <Card className="border-border/50">
                                <CardContent className="p-4">
                                    <p className="mb-3 text-sm font-semibold text-foreground">Body Composition</p>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Muscle', value: results.muscle ?? 0, icon: Dumbbell },
                                            { label: 'Fat', value: results.fat ?? 0, icon: TrendingDown },
                                            { label: 'Bone', value: results.bone ?? 0, icon: Bone },
                                            { label: 'Water', value: results.water ?? 0, icon: Droplet },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center justify-between">
                                                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <item.icon className="h-3.5 w-3.5" />
                                                    {item.label}
                                                </span>
                                                <span className="text-sm font-medium">{item.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Areas to Improve */}
                            <AreasToImproveCard
                                areas={results.areas_to_improve}
                                isPerfect={results.is_perfect}
                                bodyType={results.body_type}
                                notes={results.notes}
                            />

                            {/* Save & Actions */}
                            <div className="flex flex-wrap gap-2">
                                {!saved ? (
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-xl bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                                        onClick={handleSave}
                                    >
                                        <Heart className="mr-2 h-4 w-4" />
                                        Save to Dashboard
                                    </Button>
                                ) : (
                                    <Button variant="outline" disabled className="flex-1 rounded-xl">
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Saved ✅
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    className="rounded-xl"
                                >
                                    Scan Again
                                </Button>
                            </div>
                            {saveMessage && (
                                <p className="text-sm text-green-600 dark:text-green-400">{saveMessage}</p>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Analyze Button (image uploaded, no results yet) */}
                            {image && !results && (
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={scanning}
                                    size="lg"
                                    className="rounded-xl text-base font-semibold shadow-lg shadow-primary/25"
                                >
                                    {scanning ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Analyzing…
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Analyze Body
                                        </>
                                    )}
                                </Button>
                            )}

                            {/* Scanning status */}
                            {scanning && (
                                <Card className="border-border/50">
                                    <CardContent className="flex flex-col items-center gap-3 p-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-sm font-medium text-muted-foreground">
                                            AI is analyzing your body composition…
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Error */}
                            {error && (
                                <Card className="border-red-500/50 bg-red-500/5">
                                    <CardContent className="p-4">
                                        <p className="text-sm text-red-600">Error: {error}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Empty state */}
                            {!image && !results && (
                                <Card className="border-border/50">
                                    <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                                        <Activity className="h-8 w-8 text-muted-foreground/50" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                No body scan yet
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground/70">
                                                Upload a full-body photo for AI-powered composition analysis.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
