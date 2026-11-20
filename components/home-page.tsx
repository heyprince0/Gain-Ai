'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Activity, ArrowUpRight, Brain, Flame, ScanLine, Sparkles, Target, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  { icon: ScanLine, title: 'Understand every meal', description: 'Turn a food photo into useful calories and macros, then keep your daily log in one place.' },
  { icon: Brain, title: 'Train with a plan', description: 'Build a routine around your goals and get a clear workout to follow each day.' },
  { icon: Activity, title: 'See your progress', description: 'Track your nutrition, body scans, and consistency as your habits take shape.' },
]

export function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="GainAI home">
          <Image src="/logo.png" alt="GainAI" width={36} height={36} priority className="size-9 object-contain" />
          <span className="text-lg font-bold tracking-tight">Gain<span className="text-primary">AI</span></span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main navigation">
          <a href="#features" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">Features</a>
          <Button variant="ghost" asChild><Link href="/dashboard">Sign in</Link></Button>
          <Button asChild><Link href="/dashboard?signup=1">Get started <ArrowUpRight className="ml-1 size-4" /></Link></Button>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 md:pb-28 md:pt-24 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" /> Your personal fitness companion
          </div>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Build habits that make you feel <span className="text-primary">stronger.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            One calm place for your workouts, nutrition, and progress. Get a plan that fits your goals and keep showing up, one day at a time.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild><Link href="/dashboard?signup=1">Start your journey <ArrowUpRight className="ml-2 size-4" /></Link></Button>
            <Button size="lg" variant="outline" asChild><a href="#features">Explore GainAI</a></Button>
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"><Target className="size-4 text-primary" /> A personal plan, built around you.</div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-8 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="relative rounded-[2rem] border border-border bg-card p-5 shadow-2xl shadow-primary/5 sm:p-7">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Your day, in balance</p><p className="mt-1 text-xl font-semibold">Today&apos;s overview</p></div>
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Flame className="size-5" /></span>
            </div>
            <div className="mt-6 rounded-2xl bg-secondary/70 p-5">
              <div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Nutrition goal</p><p className="mt-1 text-2xl font-semibold">1,480 <span className="text-sm font-normal text-muted-foreground">/ 2,100 kcal</span></p></div><Utensils className="size-5 text-primary" /></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-background"><div className="h-full w-[70%] rounded-full bg-primary" /></div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs"><div><p className="text-muted-foreground">Protein</p><p className="mt-1 font-semibold">82 / 130g</p></div><div><p className="text-muted-foreground">Carbs</p><p className="mt-1 font-semibold">146 / 220g</p></div><div><p className="text-muted-foreground">Fats</p><p className="mt-1 font-semibold">42 / 70g</p></div></div>
            </div>
            <div className="mt-4 flex items-center gap-4 rounded-2xl border border-border p-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Activity className="size-5" /></span>
              <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">Up next</p><p className="mt-1 truncate font-semibold">Full-body strength</p><p className="mt-1 text-xs text-muted-foreground">35 min · 6 movements</p></div>
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary p-4 text-primary-foreground"><div><p className="text-sm font-medium">A little progress adds up.</p><p className="mt-1 text-xs opacity-80">Keep your streak moving today.</p></div><Flame className="size-5" /></div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-border bg-secondary/30 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl"><p className="text-sm font-medium text-primary">Fitness, made personal</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need to keep moving forward.</h2><p className="mt-4 leading-7 text-muted-foreground">Simple tools to make consistency feel less complicated — and your progress easier to understand.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-2xl border border-border bg-background p-6 sm:p-7"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></article>)}
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-5 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:p-8"><div><h3 className="text-xl font-semibold">Your next step starts here.</h3><p className="mt-2 text-sm text-muted-foreground">Set up your profile and make GainAI yours.</p></div><Button asChild><Link href="/dashboard?signup=1">Create your account <ArrowUpRight className="ml-2 size-4" /></Link></Button></div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl items-center justify-between px-5 py-8 text-xs text-muted-foreground lg:px-8"><span>© {new Date().getFullYear()} GainAI</span><span>Made for your next rep, meal, and milestone.</span></footer>
      <div className="sr-only">GainAI personal fitness dashboard for workouts, nutrition, and progress.</div>
    </main>
  )
}
