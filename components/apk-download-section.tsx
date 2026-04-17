"use client"

import { Download, Smartphone, Star, Zap, MonitorSmartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePwaInstall } from "@/hooks/use-pwa-install"

export function ApkDownloadSection() {
  const { isInstallable, isInstalled, installApp } = usePwaInstall()

  return (
    <section className="border-t border-border/50 bg-gradient-to-b from-muted/20 to-background">
      <div className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left flex-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <MonitorSmartphone className="h-3.5 w-3.5" />
              Install on Any Device
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Take GainAi{" "}
              <span className="text-primary">everywhere</span>
            </h2>
            <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
              Install GainAi directly to your home screen — no app store needed.
              Scan food, analyze your body, and chat with your AI coach from any device.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-primary" />
                <span>Offline support</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                <span>Faster camera access</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-primary" />
                <span>Native app experience</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-start gap-3">
              {isInstalled ? (
                <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm font-medium text-primary">
                  <Star className="h-4 w-4 fill-primary" />
                  GainAi is already installed!
                </div>
              ) : isInstallable ? (
                <Button
                  size="lg"
                  className="rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/25 gap-2"
                  onClick={installApp}
                >
                  <Download className="h-5 w-5" />
                  Install App
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    size="lg"
                    className="rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/25 gap-2"
                    disabled
                  >
                    <Download className="h-5 w-5" />
                    Install App
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    To install, use your browser menu → "Add to Home Screen"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 flex-shrink-0">
            <div className="relative flex h-[320px] w-[160px] items-center justify-center rounded-[2.5rem] border-4 border-foreground/10 bg-card shadow-2xl shadow-primary/10">
              <div className="absolute -top-1.5 left-1/2 h-3 w-16 -translate-x-1/2 rounded-full bg-foreground/10" />
              <div className="flex flex-col items-center gap-3 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <span className="text-3xl font-black text-primary">G</span>
                </div>
                <p className="text-sm font-bold text-foreground">GainAi</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  AI Nutrition &amp; Body Analysis
                </p>
                <div className="mt-1 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                  ))}
                </div>
              </div>
              <div className="absolute bottom-3 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-foreground/10" />
            </div>
            <div className="rounded-xl border border-border/50 bg-card px-4 py-2.5 text-center">
              <p className="text-xs font-semibold text-foreground">Free Install</p>
              <p className="text-[10px] text-muted-foreground">No App Store needed</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
