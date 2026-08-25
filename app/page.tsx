'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Activity,
  ArrowRight,
  Bell,
  Brain,
  Check,
  CircleUserRound,
  Dumbbell,
  Instagram,
  LayoutDashboard,
  Menu,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
  Utensils,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

// --- Subdomain URLs ---
const APP_URL = 'https://app.gainai.space'
const PANEL_URL = 'https://panel.gainai.space'
const MEMBER_LOGIN_URL = APP_URL
const GET_STARTED_URL = PANEL_URL

const navLinks = [
  ['Features', '#features'],
  ['For Gyms', '#gyms'],
  ['For Members', '#members'],
  ['Pricing', '#pricing'],
  ['FAQ', '#faq'],
]

const features = [
  { icon: Users, title: 'Member Management', text: 'Keep every member, plan, and milestone organized in one place.' },
  { icon: Zap, title: 'Subscription Management', text: 'Make recurring memberships simple to manage and understand.' },
  { icon: Activity, title: 'Fitness Experience', text: 'Give members a digital home for everything they do at your gym.' },
  { icon: Dumbbell, title: 'Workout Planning', text: 'Build and share personalized training plans in minutes.' },
  { icon: Utensils, title: 'Nutrition & Diet', text: 'Help members make better choices with practical guidance.' },
  { icon: ScanLine, title: 'Food Scanner', text: 'Turn a quick scan into clear, useful nutrition insights.' },
  { icon: Sparkles, title: 'Gym Branding', text: 'Make the member experience unmistakably yours.' },
  { icon: LayoutDashboard, title: 'Digital Gym', text: 'Your operations and member experience, finally connected.' },
]

const faqs = [
  ['What is GainAI?', 'GainAI is the operating system for modern gyms: a simple owner dashboard paired with a branded member experience.'],
  ['Do I need technical skills to get started?', 'Not at all. Create your gym, add your members, and GainAI handles the rest with an intuitive setup flow.'],
  ['Can I use my own gym branding?', 'Yes. Your logo, colors, and identity are central to the white-label member experience.'],
  ['What is included in every plan?', 'Every plan includes the complete GainAI platform. The only difference is the number of members you can manage.'],
  ['Can members use GainAI on mobile?', 'Yes. Members get a responsive digital experience designed to feel great on any phone or desktop.'],
]

// ---------- Logo Component ----------
function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="GainAI home">
      <Image
        src="/logo.png"
        alt="GainAI"
        width={32}
        height={32}
        className="h-8 w-8 object-contain"
        priority
      />
      <span>Gain<span className="text-primary">AI</span></span>
    </a>
  )
}

// ---------- Dashboard Mockup ----------
function DashboardMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-foreground/10 bg-card shadow-2xl shadow-primary/10 ${compact ? 'w-full max-w-[340px]' : 'w-full'}`}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" />
          <span className="text-xs font-semibold">GainAI <span className="text-muted-foreground">/ Dashboard</span></span>
        </div>
        <CircleUserRound className="size-4 text-muted-foreground" />
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-[1.5fr_1fr] sm:p-5">
        <div className="rounded-xl bg-secondary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Members</p>
              <p className="mt-1 text-2xl font-semibold">248</p>
            </div>
            <div className="rounded-lg bg-primary/15 p-2 text-primary"><Users className="size-4" /></div>
          </div>
          <div className="mt-5 flex h-20 items-end gap-2">
            {[35, 48, 42, 62, 55, 78, 70, 92, 82, 100].map((height, index) => (
              <span key={index} className="flex-1 rounded-t-sm bg-primary/70" style={{ height: `${height}%` }} />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-primary">+18.4% this month</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Active plans</p>
            <p className="mt-2 text-xl font-semibold">196</p>
            <div className="mt-3 h-1.5 rounded-full bg-secondary">
              <span className="block h-full w-3/4 rounded-full bg-primary" />
            </div>
          </div>
          <div className="rounded-xl bg-foreground p-4 text-background">
            <p className="text-[10px] uppercase tracking-widest opacity-60">Quick action</p>
            <p className="mt-2 text-sm font-medium">Add a new member</p>
            <ArrowRight className="mt-4 size-4 text-primary" />
          </div>
        </div>
      </div>
      <div className="mx-4 mb-4 rounded-xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 text-[10px] text-muted-foreground">
          <span>Recent members</span>
          <span>View all</span>
        </div>
        {['Alex Morgan', 'Sam Rivera', 'Jordan Lee'].map((name, i) => (
          <div key={name} className="flex items-center justify-between px-3 py-2.5 text-xs">
            <span className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-[9px] font-semibold text-primary">
                {name.split(' ').map((n) => n[0]).join('')}
              </span>
              {name}
            </span>
            <span className="text-muted-foreground">{i === 0 ? 'Active' : 'On track'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Phone Mockup ----------
function PhoneMockup() {
  return (
    <div className="mx-auto w-[230px] rounded-[2.2rem] border-[7px] border-foreground/90 bg-card p-2 shadow-2xl shadow-primary/20">
      <div className="overflow-hidden rounded-[1.6rem] bg-background">
        <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
          <span className="text-xs font-semibold">Northstar Gym</span>
          <Bell className="size-3" />
        </div>
        <div className="flex flex-col gap-3 p-4">
          <p className="text-[10px] text-muted-foreground">Good morning, Alex</p>
          <p className="text-lg font-semibold leading-tight">Ready to make<br />today count?</p>
          <div className="rounded-xl bg-secondary p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium">Today&apos;s workout</span>
              <Dumbbell className="size-3 text-primary" />
            </div>
            <p className="mt-2 text-xs font-semibold">Upper body strength</p>
            <div className="mt-2 h-1 rounded-full bg-border">
              <span className="block h-full w-2/3 rounded-full bg-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border p-3">
              <Target className="size-3 text-primary" />
              <p className="mt-3 text-[10px] text-muted-foreground">Weekly goal</p>
              <p className="text-sm font-semibold">3 / 4</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <Utensils className="size-3 text-primary" />
              <p className="mt-3 text-[10px] text-muted-foreground">Calories</p>
              <p className="text-sm font-semibold">1,840</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Main Page ----------
export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div id="top" className="min-h-screen overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map(([label, href]) => (
              <a key={href} href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" asChild>
              <a href={MEMBER_LOGIN_URL}>Member Login</a>
            </Button>
            <Button asChild>
              <a href={GET_STARTED_URL}>Get Started <ArrowRight className="ml-2 size-4" /></a>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {mobileOpen && (
          <nav className="flex flex-col gap-1 border-t border-border px-5 py-4 md:hidden">
            {navLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {label}
              </a>
            ))}
            <a href={MEMBER_LOGIN_URL} className="px-3 py-3 text-sm">Member Login</a>
            <Button asChild>
              <a href={GET_STARTED_URL}>Get Started <ArrowRight className="ml-2 size-4" /></a>
            </Button>
          </nav>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 md:pb-28 md:pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="size-3" /> The smarter way to run a gym
            </div>
            <h1 className="max-w-2xl text-balance text-5xl font-semibold tracking-[-0.06em] md:text-7xl">
              Turn your gym into a <span className="text-primary">smarter</span> fitness experience.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">
              GainAI connects your gym operations with a modern digital member experience, so your team can focus on what matters: helping people get stronger.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <a href={PANEL_URL}>Start Your Gym <ArrowRight className="ml-2 size-4" /></a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={APP_URL}>I&apos;m a Member</a>
              </Button>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" /> No complicated setup. Give your gym a modern digital experience.
            </p>
          </div>
          <div className="animate-fade-up [animation-delay:120ms]">
            <DashboardMockup />
          </div>
        </section>

        {/* User Type Selection */}
        <section className="border-y border-border bg-secondary/40 py-20" id="gyms">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-primary">One platform. Two powerful experiences.</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Choose your GainAI experience.</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <Card className="border-primary/50 bg-primary p-2 text-primary-foreground shadow-xl shadow-primary/10">
                <div className="rounded-[calc(var(--radius)-2px)] p-6 md:p-8">
                  <Dumbbell className="size-8" />
                  <h3 className="mt-12 text-2xl font-semibold">I&apos;m a Gym Owner</h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 opacity-80">
                    Run your gym with less admin and give members an experience they&apos;ll love coming back to.
                  </p>
                  <Button className="mt-7 bg-foreground text-background hover:bg-foreground/90" asChild>
                    <a href={PANEL_URL}>Set Up My Gym <ArrowRight className="ml-2 size-4" /></a>
                  </Button>
                </div>
              </Card>
              <Card className="p-2">
                <div className="rounded-[calc(var(--radius)-2px)] p-6 md:p-8">
                  <UserRound className="size-8 text-primary" />
                  <h3 className="mt-12 text-2xl font-semibold">I&apos;m a Member</h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                    Your workouts, nutrition, progress, and membership info — all in one place built around you.
                  </p>
                  <Button className="mt-7" variant="outline" asChild>
                    <a href={APP_URL}>Open Member App <ArrowRight className="ml-2 size-4" /></a>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8" id="features">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Built for the whole business</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Everything your gym needs. <span className="text-muted-foreground">One platform.</span>
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Stop stitching together tools that were never designed to work together. GainAI brings your operations and your members into one clear system.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-background p-6 transition-colors hover:bg-secondary">
                <Icon className="size-5 text-primary" />
                <h3 className="mt-8 text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Before vs After */}
        <section className="border-y border-border bg-secondary/40 py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-primary">A better baseline</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Less admin. More momentum.</h2>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <Card className="border-border bg-background">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <X className="size-4" /> Without GainAI
                  </div>
                  <CardTitle className="pt-4 text-2xl">Disconnected tools slow everyone down.</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-4 text-sm text-muted-foreground">
                    {['Member information spread across spreadsheets', 'Manual follow-ups and repetitive admin', 'A generic experience after the front desk', 'Missed opportunities to keep members engaged'].map((item) => (
                      <li key={item} className="flex gap-3">
                        <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-primary/40 bg-primary text-primary-foreground">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                    <Check className="size-4" /> With GainAI
                  </div>
                  <CardTitle className="pt-4 text-2xl">One clear system keeps progress moving.</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-4 text-sm opacity-85">
                    {['One source of truth for your members', 'Simple tools your team actually enjoys using', 'A branded experience members open every day', 'More visibility into retention and growth'].map((item) => (
                      <li key={item} className="flex gap-3">
                        <Check className="mt-0.5 size-4 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-medium text-primary">Simple from day one</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Get your gym on GainAI in minutes.</h2>
          </div>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              ['01', 'Create Your Gym', 'Set up your profile, brand, and membership structure in one focused flow.'],
              ['02', 'Add Your Members', 'Bring your community in with the tools to organize and manage everyone.'],
              ['03', 'Give Members Their Digital Experience', 'Your members log in to a space that feels like it was made for them.'],
            ].map(([number, title, text], index) => (
              <div key={number} className="relative text-center md:text-left">
                <div className="mx-auto grid size-12 place-items-center rounded-full border border-primary bg-primary/10 font-mono text-sm text-primary md:mx-0">
                  {number}
                </div>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                {index < 2 && (
                  <div className="absolute left-[calc(50%+35px)] top-6 hidden h-px w-[calc(100%-70px)] bg-border md:block" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* White Label */}
        <section className="border-y border-border bg-foreground py-24 text-background" id="members">
          <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-sm font-medium text-primary">Your identity, everywhere</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Make GainAI feel like your gym.</h2>
              <p className="mt-5 max-w-lg text-base leading-7 opacity-65">
                The strongest communities are built on connection. Put your brand at the center of the digital experience and give members another reason to feel at home.
              </p>
              <p className="mt-10 text-xl font-medium">Your gym. Your brand. Your members.</p>
              <Button className="mt-8" size="lg" asChild>
                <a href={PANEL_URL}>Create My Gym <ArrowRight className="ml-2 size-4" /></a>
              </Button>
            </div>
            <div className="flex justify-center"><PhoneMockup /></div>
          </div>
        </section>

        {/* Member Experience */}
        <section className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 lg:grid-cols-[1fr_0.8fr] lg:px-8">
          <div className="order-2 flex justify-center lg:order-1"><PhoneMockup /></div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-medium text-primary">More than a membership</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Give your members more than a gym membership.</h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              A helpful digital companion turns good intentions into consistent habits — before, during, and after every workout.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {['Personalized workouts', 'Nutrition guidance', 'Food scanner', 'Progress tracking', 'Membership info'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Dashboard Showcase */}
        <section className="border-y border-border bg-secondary/40 py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-primary">Clarity at a glance</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Your gym, in view.</h2>
              </div>
              <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                Make confident decisions with the information your team needs, without the noise.
              </p>
            </div>
            <div className="mt-12"><DashboardMockup /></div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8" id="pricing">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">Simple pricing that scales</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Start growing your digital gym.</h2>
            <p className="mt-5 text-muted-foreground">All core features included. Choose the member limit that fits your community today.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ['Basic', '100 members', 'For focused communities getting started.'],
              ['Pro', '300 members', 'For established gyms ready to grow.', 'Most popular'],
              ['Pro Max', '750 members', 'For ambitious gyms building their future.'],
            ].map(([name, limit, text, badge]) => (
              <Card key={name} className={badge ? 'border-primary shadow-lg shadow-primary/10' : ''}>
                <CardHeader>
                  {badge && (
                    <span className="mb-2 w-fit rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                      {badge}
                    </span>
                  )}
                  <CardTitle className="text-2xl">{name}</CardTitle>
                  <p className="text-3xl font-semibold text-primary">{limit}</p>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-3 text-sm">
                    {['All GainAI core features', 'Owner dashboard', 'Branded member experience', 'Workout and nutrition tools'].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="size-4 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-8 w-full" variant={badge ? 'default' : 'outline'} asChild>
                    <a href={PANEL_URL}>Get Started <ArrowRight className="ml-2 size-4" /></a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-y border-border bg-secondary/40 py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-primary">Built for modern gyms</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">The next generation is already moving.</h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                ['50+', 'Gyms onboarded'],
                ['10,000+', 'Members managed'],
                ['24/7', 'Digital support'],
              ].map(([number, label]) => (
                <div key={label} className="rounded-2xl border border-border bg-background p-6 text-center">
                  <p className="text-4xl font-semibold text-primary">{number}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm leading-6 text-muted-foreground">&quot;The GainAI community is growing. Customer stories are coming soon.&quot;</p>
                  <p className="mt-5 text-xs font-medium text-muted-foreground">[Customer Name] — Coming Soon</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm leading-6 text-muted-foreground">&quot;Built with the next generation of gym operators in mind.&quot;</p>
                  <p className="mt-5 text-xs font-medium text-muted-foreground">[Customer Name] — Coming Soon</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-5 py-24 lg:px-8" id="faq">
          <div className="text-center">
            <p className="text-sm font-medium text-primary">Questions, answered</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Frequently asked questions.</h2>
          </div>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map(([question, answer], index) => (
              <AccordionItem key={question} value={`item-${index}`}>
                <AccordionTrigger className="text-base hover:no-underline">{question}</AccordionTrigger>
                <AccordionContent className="leading-6 text-muted-foreground">{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Final CTA */}
        <section className="mx-5 mb-20 rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground md:px-10 md:py-24">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-4xl font-semibold tracking-tight md:text-6xl">Ready to give your gym a digital upgrade?</h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-7 opacity-80">
              Make every part of your gym experience work harder for your team and your members.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90" asChild>
                <a href={PANEL_URL}>Start Your Gym <ArrowRight className="ml-2 size-4" /></a>
              </Button>
              <Button size="lg" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" variant="outline" asChild>
                <a href={APP_URL}>I&apos;m a Member</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo />
            <p className="mt-3 text-xs text-muted-foreground">The smarter fitness experience.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs text-muted-foreground">
            {[
              ['Home', '#top'],
              ['Features', '#features'],
              ['For Gyms', '#gyms'],
              ['For Members', '#members'],
              ['Pricing', '#pricing'],
              ['FAQ', '#faq'],
            ].map(([label, href]) => (
              <a key={label} href={href} className="hover:text-foreground">{label}</a>
            ))}
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
            <a href="https://instagram.com" aria-label="Instagram" className="hover:text-foreground"><Instagram className="size-4" /></a>
            <a href="https://linkedin.com" aria-label="LinkedIn" className="hover:text-foreground"><Brain className="size-4" /></a>
          </div>
        </div>
        <div className="border-t border-border px-5 py-5 text-center text-xs text-muted-foreground lg:px-8">
          © 2026 GainAI. Built for the future of fitness.
        </div>
      </footer>
    </div>
  )
}
