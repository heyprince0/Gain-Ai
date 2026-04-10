'use client'

import { Download, Smartphone, Star, Zap, Shield, CheckCircle, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

const steps = [
  {
    step: "1",
    title: "Download the APK",
    description: 'Tap the "Download APK" button below to save the file to your device.',
  },
  {
    step: "2",
    title: 'Allow "Unknown Sources"',
    description: 'Go to Settings → Security → enable "Install from unknown sources" or "Install unknown apps".',
  },
  {
    step: "3",
    title: "Open & Install",
    description: "Open the downloaded GainAi.apk file and tap Install. Takes less than 30 seconds.",
  },
  {
    step: "4",
    title: "Launch & Sign In",
    description: "Open GainAi, sign in with your account, and start scanning food and analyzing your body.",
  },
]

const features = [
  { icon: Smartphone, label: "Native Android experience" },
  { icon: Zap, label: "Faster camera & scanning" },
  { icon: Shield, label: "Safe & secure" },
  { icon: Star, label: "All premium features included" },
  { icon: Wifi, label: "Works on any connection" },
  { icon: CheckCircle, label: "Free — no hidden charges" },
]

export default function DownloadPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
          </div>
          <div className="mx-auto max-w-6xl px-4 py-20 lg:px-6 lg:py-28">
            <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-20">
              {/* Left content */}
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left flex-1">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                  <Smartphone className="h-3.5 w-3.5" />
                  Android App — Free Download
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  GainAi for{" "}
                  <span className="text-primary">Android</span>
                </h1>

                <p className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
                  Get the full GainAi experience on your Android phone. Scan food,
                  analyze your body composition, and chat with your AI coach — all
                  natively from your device.
                </p>

                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
                  <a href="/GainAi.apk" download="GainAi.apk">
                    <Button
                      size="lg"
                      className="rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/25 gap-2"
                    >
                      <Download className="h-5 w-5" />
                      Download APK
                    </Button>
                  </a>
                  <div className="flex flex-col items-center justify-center text-center sm:items-start sm:text-left">
                    <p className="text-xs text-muted-foreground">Free · Android · v1.0</p>
                    <p className="text-xs text-muted-foreground">~1.7 MB · No Play Store needed</p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  Enable "Install from unknown sources" in your Android settings before installing.
                </p>
              </div>

              {/* Phone mockup */}
              <div className="flex flex-col items-center gap-4 flex-shrink-0">
                <div className="relative flex h-[360px] w-[180px] items-center justify-center rounded-[2.5rem] border-4 border-foreground/10 bg-card shadow-2xl shadow-primary/10">
                  <div className="absolute -top-1.5 left-1/2 h-3 w-16 -translate-x-1/2 rounded-full bg-foreground/10" />
                  <div className="flex flex-col items-center gap-4 px-5 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 shadow-inner">
                      <span className="text-4xl font-black text-primary">G</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">GainAi</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                        AI Nutrition &amp; Body Analysis
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                    <div className="w-full rounded-xl bg-primary px-3 py-2">
                      <p className="text-xs font-semibold text-primary-foreground">Free Download</p>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-foreground/10" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="border-b border-border/50 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
            <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-foreground">
              Why download the app?
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {features.map((f) => (
                <div
                  key={f.label}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card p-5 text-center"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-foreground leading-tight">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Install steps */}
        <section className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-foreground">
            How to install
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-14 flex flex-col items-center gap-4 text-center">
            <p className="text-lg font-semibold text-foreground">Ready to get started?</p>
            <a href="/GainAi.apk" download="GainAi.apk">
              <Button
                size="lg"
                className="rounded-xl px-10 text-base font-semibold shadow-lg shadow-primary/25 gap-2"
              >
                <Download className="h-5 w-5" />
                Download GainAi APK
              </Button>
            </a>
            <p className="text-xs text-muted-foreground">Free · No account required to download</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
