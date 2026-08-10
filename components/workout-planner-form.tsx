'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Loader2, X, ChevronLeft, ChevronRight, User } from 'lucide-react'

interface Props {
  userId: string
  existingBodyFat?: number
  onComplete: () => void
  onClose: () => void  // <-- added
}

// ... rest of the component unchanged until the return ...

export function WorkoutPlannerForm({ userId, existingBodyFat, onComplete, onClose }: Props) {
  // ... all existing state and hooks ...

  // ... all existing functions (handleGeneratePlan, etc.) ...

  // In the return, we add the close button at the top of the form container

  return (
    <div className="p-6 relative">  {/* added relative */}
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted/50 transition-colors"
        aria-label="Close form"
      >
        <X className="h-5 w-5 text-foreground/70" />
      </button>

      {/* existing content: header, progress, steps, navigation ... */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {getStepTitle(currentStep)}
          </h2>
          <p className="text-xs text-muted-foreground">Step {currentStep} of 8</p>
        </div>
        <Progress value={(currentStep / 8) * 100} className="h-2" />
      </div>

      {/* Step content (unchanged) */}
      <div className="mb-8">
        {/* ... all step components ... */}
      </div>

      {/* Navigation buttons (unchanged) */}
      <div className="flex gap-3">
        {/* ... */}
      </div>
    </div>
  )
}

// All the step components (Step1Gender, Step2Goal, etc.) remain exactly as they were.
// The file ends with the helper functions getStepTitle and isStepValid.
