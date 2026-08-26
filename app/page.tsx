'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Big_Shoulders_Display, Inter, IBM_Plex_Mono } from 'next/font/google'
import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarCheck,
  Check,
  CircleUserRound,
  CreditCard,
  Dumbbell,
  Instagram,
  LayoutDashboard,
  Menu,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const display = Big_Shoulders_Display({ subsets: ['latin'], weight: ['700', '900'], variable: '--font-display' })
const body = Inter({ subsets: ['latin'], variable: '--font-body' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500'], variable: '--font-mono' })

// --- Subdomain URLs ---
const APP_URL = 'https://app.gainai.space/food-scanner'
const PANEL_URL = 'https://panel.gainai.space'
const MEMBER_LOGIN_URL = APP_URL
const GET_STARTED_URL = PANEL_URL

// --- Palette (as class fragments, kept together so the system stays consistent) ---
const C = {
  ink: '#14171A',
  inkCard: '#1C2029',
  inkLine: '#262B33',
  paper: '#F1F3F2',
  card: '#FFFFFF',
  line: '#E1E3DE',
  steel: '#5B6169',
  cobalt: '#2745F5',
  cobaltSoft: '#E7EBFF',
  lime: '#9FE870',
}

const displayFont = { fontFamily: 'var(--font-display)' }
const monoFont = { fontFamily: 'var(--font-mono)' }

const navLinks = [
  ['Features', '#features'],
  ['Attendance', '#attendance'],
  ['Notifications', '#notifications'],
  ['Pricing', '#pricing'],
  ['FAQ', '#faq'],
]

const features = [
  { icon: Users, title: 'Member management', text: 'Every member, plan and note in one record — no spreadsheets to keep in sync.' },
  { icon: CalendarCheck, title: 'Attendance tracker', text: 'Members check in from the app. You get a live log of who walked in today.' },
  { icon: CreditCard, title: 'Subscriptions & billing', text: 'Set plans once. Track who is paid, due, or overdue at a glance.' },
  { icon: BellRing, title: 'Renewal notifications', text: 'Members are notified before a plan expires, so renewals happen without a phone call.' },
  { icon: Building2, title: 'White-label branding', text: 'Your logo, your colors, your gym name — on the app members open every day.' },
  { icon: LayoutDashboard, title: 'Owner dashboard', text: 'Members, attendance and revenue in one screen you can actually read.' },
  { icon: Dumbbell, title: 'Workout planning', text: 'Assign training plans members can follow without asking you to repeat it.' },
  { icon: ScanLine, title: 'Nutrition & food scanner', text: 'A quick scan gives members clear guidance, so questions stop landing on your desk.' },
]

const faqs = [
  ['How does the attendance tracker work?', 'Members check in from their app when they arrive. You see a live daily log — no register, no manual entry, and a clear view of who has stopped showing up.'],
  ['Will members be notified about their subscription?', 'Yes. GainAI reminds members before a plan expires and again if it lapses, right inside the app they already use — so renewals stop depending on you chasing people down.'],
  ['Can I use my own gym branding?', 'Yes. Your logo, colors and gym name run through the entire member app — white-label is included on every plan, not sold as an add-on.'],
  ['Do I need technical skills to get started?', 'No. Create your gym, add your members, and GainAI handles the rest — most owners are fully set up in under a day.'],
  ['What is included in every plan?', 'The complete platform: member management, attendance, subscriptions, notifications, white-label branding and the owner dashboard. Plans only differ by member limit.'],
  ['Can members use GainAI on their phone?', 'Yes. The member app is built for mobile first, so check-ins, notifications and workouts all work from a phone.'],
]

// ---------- Logo ----------
function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="GainAI home" style={{ color: dark ? C.paper : C.ink }}>
      <Image src="/logo.png" alt="GainAI" width={30} height={30} className="h-7 w-7 object-contain" priority />
      <span style={displayFont} className="text-lg">Gain<span style={{ color: C.cobalt }}>AI</span></span>
    </a>
  )
}

// ---------- Stamp badge (signature element) ----------
function StampBadge({ label, sub, size = 'md' }: { label: string; sub?: string; size?: 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'size-32 text-[11px]' : 'size-20 text-[8px]'
  return (
    <div
      className={`grid ${dims} shrink-0 place-items-center rounded-full border-2 border-dashed text-center leading-tight`}
      style={{ borderColor: C.cobalt, color: C.cobalt, transform: 'rotate(-8deg)' }}
    >
      <div>
        <p style={monoFont} className="font-semibold uppercase tracking-widest">{label}</p>
        {sub && <p style={monoFont} className="mt-1 opacity-70">{sub}</p>}
      </div>
    </div>
  )
}

// ---------- Section eyebrow with plate marker ----------
function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-sm font-medium" style={{ color: C.cobalt }}>
      <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: C.cobalt }} />
      {children}
    </p>
  )
}

// ---------- Owner Dashboard Mockup ----------
function DashboardMockup() {
  return (
    <div className="w-full overflow-hidden rounded-2xl shadow-2xl" style={{ backgroundColor: C.card, boxShadow: '0 30px 60px -20px rgba(20,23,26,0.35)' }}>
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: C.line }}>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: C.cobalt }} />
          <span className="text-xs font-semibold" style={{ color: C.ink }}>GainAI <span style={{ color: C.steel }}>/ Owner dashboard</span></span>
        </div>
        <CircleUserRound className="size-4" style={{ color: C.steel }} />
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-[1.4fr_1fr] sm:p-5">
        <div className="rounded-xl p-4" style={{ backgroundColor: C.paper }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={monoFont} className="text-[10px] uppercase tracking-widest" style={{ color: C.steel }}>Members</p>
              <p style={displayFont} className="mt-1 text-3xl" style={{ color: C.ink }}>248</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: C.cobaltSoft, color: C.cobalt }}><Users className="size-4" /></div>
          </div>
          <div className="mt-5 flex h-16 items-end gap-1.5">
            {[35, 48, 42, 62, 55, 78, 70, 92, 82, 100].map((height, index) => (
              <span key={index} className="flex-1 rounded-t-sm" style={{ height: `${height}%`, backgroundColor: C.cobalt, opacity: 0.35 + (height / 200) }} />
            ))}
          </div>
          <p style={monoFont} className="mt-2 text-[10px]" style={{ color: C.cobalt }}>+18.4% checked in this month</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border p-4" style={{ borderColor: C.line }}>
            <p style={monoFont} className="text-[10px] uppercase tracking-widest" style={{ color: C.steel }}>Checked in today</p>
            <p style={displayFont} className="mt-2 text-2xl" style={{ color: C.ink }}>86</p>
            <div className="mt-3 h-1.5 rounded-full" style={{ backgroundColor: C.line }}>
              <span className="block h-full w-2/3 rounded-full" style={{ backgroundColor: C.cobalt }} />
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: C.ink }}>
            <p style={monoFont} className="text-[10px] uppercase tracking-widest opacity-60" style={{ color: C.paper }}>Quick action</p>
            <p className="mt-2 text-sm font-medium" style={{ color: C.paper }}>Add a new member</p>
            <ArrowRight className="mt-4 size-4" style={{ color: C.lime }} />
          </div>
        </div>
      </div>
      <div className="mx-4 mb-4 rounded-xl border" style={{ borderColor: C.line }}>
        <div className="flex items-center justify-between border-b px-3 py-2 text-[10px]" style={{ borderColor: C.line, color: C.steel }}>
          <span>Renewals due this week</span>
          <span>View all</span>
        </div>
        {[
          ['Alex Morgan', '2 days left'],
          ['Sam Rivera', '4 days left'],
          ['Jordan Lee', 'Due today'],
        ].map(([name, due]) => (
          <div key={name} className="flex items-center justify-between px-3 py-2.5 text-xs" style={{ color: C.ink }}>
            <span className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full text-[9px] font-semibold" style={{ backgroundColor: C.cobaltSoft, color: C.cobalt }}>
                {name.split(' ').map((n) => n[0]).join('')}
              </span>
              {name}
            </span>
            <span style={{ color: due === 'Due today' ? C.cobalt : C.steel }}>{due}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Attendance mockup ----------
function AttendanceMockup() {
  const rows = [
    ['Priya Nair', '6:42 AM', '18-day streak'],
    ['Karan Shah', '7:05 AM', '4-day streak'],
    ['Meera Iyer', '7:31 AM', '32-day streak'],
    ['Rohit Verma', '8:14 AM', '2-day streak'],
  ]
  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl" style={{ backgroundColor: C.card, boxShadow: '0 30px 60px -20px rgba(20,23,26,0.35)' }}>
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: C.line }}>
        <span className="text-xs font-semibold" style={{ color: C.ink }}>Today&apos;s check-ins</span>
        <span style={monoFont} className="text-[10px]" style={{ color: C.steel }}>26 Aug</span>
      </div>
      <div className="p-2">
        {rows.map(([name, time, streak]) => (
          <div key={name} className="flex items-center justify-between rounded-lg px-3 py-3 text-xs" style={{ color: C.ink }}>
            <span className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full text-[9px] font-semibold" style={{ backgroundColor: C.cobaltSoft, color: C.cobalt }}>
                {name.split(' ').map((n) => n[0]).join('')}
              </span>
              <span>
                <span className="block font-medium">{name}</span>
                <span style={monoFont} className="text-[10px]" style={{ color: C.steel }}>{streak}</span>
              </span>
            </span>
            <span style={monoFont} className="text-[10px]" style={{ color: C.steel }}>{time}</span>
          </div>
        ))}
      </div>
      <div className="absolute -right-4 -top-4">
        <StampBadge label="Checked in" sub="6:42 AM" />
      </div>
    </div>
  )
}

// ---------- Phone Mockup (workout / renewal variants) ----------
function PhoneMockup({ variant = 'workout' }: { variant?: 'workout' | 'renewal' }) {
  return (
    <div className="mx-auto w-[230px] rounded-[2.2rem] p-2 shadow-2xl" style={{ backgroundColor: C.ink, boxShadow: '0 30px 60px -20px rgba(20,23,26,0.5)' }}>
      <div className="overflow-hidden rounded-[1.6rem]" style={{ backgroundColor: C.card }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: C.cobalt }}>
          <span className="text-xs font-semibold text-white">Northstar Gym</span>
          <BellRing className="size-3 text-white" />
        </div>

        {variant === 'workout' ? (
          <div className="flex flex-col gap-3 p-4">
            <p className="text-[10px]" style={{ color: C.steel }}>Good morning, Alex</p>
            <p style={displayFont} className="text-xl leading-tight" style={{ color: C.ink }}>Ready to make<br />today count?</p>
            <div className="rounded-xl p-3" style={{ backgroundColor: C.paper }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium" style={{ color: C.ink }}>Today&apos;s workout</span>
                <Dumbbell className="size-3" style={{ color: C.cobalt }} />
              </div>
              <p className="mt-2 text-xs font-semibold" style={{ color: C.ink }}>Upper body strength</p>
              <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: C.line }}>
                <span className="block h-full w-2/3 rounded-full" style={{ backgroundColor: C.cobalt }} />
              </div>
            </div>
            <div className="rounded-xl border p-3" style={{ borderColor: C.line }}>
              <span className="text-[10px] font-medium" style={{ color: C.ink }}>Checked in</span>
              <p style={displayFont} className="mt-1 text-lg" style={{ color: C.cobalt }}>6:42 AM</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4">
            <p className="text-[10px]" style={{ color: C.steel }}>Membership</p>
            <div className="rounded-xl border-2 border-dashed p-4" style={{ borderColor: C.cobalt, backgroundColor: C.cobaltSoft }}>
              <BellRing className="size-4" style={{ color: C.cobalt }} />
              <p className="mt-3 text-sm font-semibold" style={{ color: C.ink }}>Your plan renews in 3 days</p>
              <p className="mt-1 text-[11px]" style={{ color: C.steel }}>Pro Monthly · ₹1,999</p>
              <button className="mt-4 w-full rounded-lg py-2 text-xs font-semibold text-white" style={{ backgroundColor: C.cobalt }}>Renew now</button>
            </div>
            <div className="rounded-xl border p-3" style={{ borderColor: C.line }}>
              <span className="text-[10px] font-medium" style={{ color: C.ink }}>Status</span>
              <p className="mt-1 text-xs" style={{ color: C.lime === C.lime ? '#4C9A2A' : C.ink }}>Active · paid to date</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Main Page ----------
export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div
      id="top"
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen overflow-hidden`}
      style={{ backgroundColor: C.paper, color: C.ink, fontFamily: 'var(--font-body)' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: C.line, backgroundColor: 'rgba(241,243,242,0.88)' }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map(([label, href]) => (
              <a key={href} href={href} className="text-sm transition-colors hover:opacity-70" style={{ color: C.steel }}>
                {label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" asChild>
              <a href={MEMBER_LOGIN_URL} style={{ color: C.steel }}>Member login</a>
            </Button>
            <Button asChild style={{ backgroundColor: C.ink, color: C.paper }}>
              <a href={GET_STARTED_URL}>Start your gym <ArrowRight className="ml-2 size-4" /></a>
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {mobileOpen && (
          <nav className="flex flex-col gap-1 border-t px-5 py-4 md:hidden" style={{ borderColor: C.line }}>
            {navLinks.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 text-sm" style={{ color: C.steel }}>
                {label}
              </a>
            ))}
            <a href={MEMBER_LOGIN_URL} className="px-3 py-3 text-sm" style={{ color: C.steel }}>Member login</a>
            <Button asChild style={{ backgroundColor: C.ink, color: C.paper }}>
              <a href={GET_STARTED_URL}>Start your gym <ArrowRight className="ml-2 size-4" /></a>
            </Button>
          </nav>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 md:pb-28 md:pt-24 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium" style={{ borderColor: C.cobalt, color: C.cobalt }}>
              <Sparkles className="size-3" /> Built for gym owners, not spreadsheets
            </div>
            <h1 style={displayFont} className="max-w-xl text-5xl leading-[0.95] tracking-tight md:text-7xl">
              Every check-in, renewal and rupee — tracked automatically.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 md:text-lg" style={{ color: C.steel }}>
              GainAI gives your gym one system for members, attendance and subscriptions — with your own branded app on top. Less admin for you, a sharper experience for them.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild style={{ backgroundColor: C.cobalt, color: '#fff' }}>
                <a href={PANEL_URL}>Start your gym <ArrowRight className="ml-2 size-4" /></a>
              </Button>
              <Button size="lg" variant="outline" asChild style={{ borderColor: C.ink, color: C.ink }}>
                <a href={APP_URL}>See the member app</a>
              </Button>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs" style={{ color: C.steel }}>
              <ShieldCheck className="size-4" style={{ color: C.cobalt }} /> No setup calls. No spreadsheets. Live in a day.
            </p>
          </div>
          <div className="relative">
            <DashboardMockup />
            <div className="absolute -bottom-6 -left-6 hidden md:block">
              <StampBadge label="Checked in" sub="Today · 86" />
            </div>
          </div>
        </section>

        {/* Three-up value props */}
        <section className="py-20" style={{ backgroundColor: C.ink, color: C.paper }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p style={monoFont} className="text-xs uppercase tracking-[0.2em]" style={{ color: C.lime }}>What changes on day one</p>
              <h2 style={displayFont} className="mt-3 text-3xl md:text-5xl">Three things every gym owner is tired of.</h2>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                [CalendarCheck, 'Chasing attendance', 'Members check in from the app. You see who showed up today, without a register.'],
                [BellRing, 'Chasing renewals', 'Members get notified before their plan expires. Renewals start happening on their own.'],
                [Building2, 'Looking like everyone else', 'The app members open every day carries your gym\u2019s name, logo and colors — not ours.'],
              ].map(([Icon, title, text]) => (
                <div key={title as string} className="rounded-2xl border p-6" style={{ borderColor: C.inkLine, backgroundColor: C.inkCard }}>
                  <div className="grid size-11 place-items-center rounded-xl" style={{ backgroundColor: 'rgba(39,69,245,0.18)', color: '#7C93FF' }}>
                    {/* @ts-expect-error icon component from array */}
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 opacity-70">{text as string}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Attendance deep-dive */}
        <section className="py-24" id="attendance">
          <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-2 lg:px-8">
            <div className="order-2 lg:order-1"><AttendanceMockup /></div>
            <div className="order-1 lg:order-2">
              <Eyebrow>Never wonder who showed up</Eyebrow>
              <h2 style={displayFont} className="text-4xl md:text-5xl">A front desk that keeps its own records.</h2>
              <p className="mt-5 text-base leading-7" style={{ color: C.steel }}>
                Every check-in is logged the moment a member arrives — no register, no manual entry. See daily attendance, spot who&apos;s slipping, and follow up before they cancel.
              </p>
              <ul className="mt-8 flex flex-col gap-4">
                {['A live daily check-in log for every member', 'Attendance streaks members can see in their own app', 'An early-warning list for members who\u2019ve stopped showing up'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full" style={{ backgroundColor: C.cobaltSoft, color: C.cobalt }}>
                      <Check className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Notifications deep-dive */}
        <section className="py-24" id="notifications" style={{ backgroundColor: C.ink, color: C.paper }}>
          <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-2 lg:px-8">
            <div>
              <p style={monoFont} className="mb-3 flex items-center gap-2 text-sm font-medium" style={{ color: C.lime }}>
                <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: C.lime }} /> Renewals that handle themselves
              </p>
              <h2 style={displayFont} className="text-4xl md:text-5xl">Members always know where their subscription stands.</h2>
              <p className="mt-5 text-base leading-7 opacity-70">
                GainAI notifies members before their plan expires, right inside the app they already use to check their workouts — so you&apos;re not the one chasing payments.
              </p>
              <ul className="mt-8 flex flex-col gap-4">
                {['Automatic reminders before a plan expires', 'An in-app alert the moment a plan is due or overdue', 'One dashboard view of every member\u2019s subscription status'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm opacity-90">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full" style={{ backgroundColor: 'rgba(159,232,112,0.15)', color: C.lime }}>
                      <Check className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center"><PhoneMockup variant="renewal" /></div>
          </div>
        </section>

        {/* White label */}
        <section className="py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-2 lg:px-8">
            <div className="flex justify-center lg:order-1"><PhoneMockup variant="workout" /></div>
            <div className="lg:order-2">
              <Eyebrow>Your identity, everywhere</Eyebrow>
              <h2 style={displayFont} className="text-4xl md:text-5xl">Make GainAI feel like your gym.</h2>
              <p className="mt-5 max-w-lg text-base leading-7" style={{ color: C.steel }}>
                Put your logo, colors and gym name at the center of the member experience. White-label is built into every plan — not an upgrade you pay extra for.
              </p>
              <p style={displayFont} className="mt-10 text-2xl">Your gym. Your brand. Your members.</p>
              <Button className="mt-8" size="lg" asChild style={{ backgroundColor: C.cobalt, color: '#fff' }}>
                <a href={PANEL_URL}>Set up my gym <ArrowRight className="ml-2 size-4" /></a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="py-24" id="features" style={{ backgroundColor: C.ink, color: C.paper }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-2xl">
              <p style={monoFont} className="text-xs uppercase tracking-[0.2em]" style={{ color: C.lime }}>Built for the whole business</p>
              <h2 style={displayFont} className="mt-3 text-4xl md:text-5xl">Everything your gym needs. One platform.</h2>
              <p className="mt-5 text-base leading-7 opacity-70">
                Stop stitching together tools that were never designed to work together. GainAI brings your operations and your members into one clear system.
              </p>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-4" style={{ backgroundColor: C.inkLine }}>
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="p-6 transition-colors" style={{ backgroundColor: C.inkCard }}>
                  <Icon className="size-5" style={{ color: '#7C93FF' }} />
                  <h3 className="mt-8 text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 opacity-65">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8" id="pricing">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Simple pricing that scales</Eyebrow>
            <h2 style={displayFont} className="text-4xl md:text-5xl">Start growing your digital gym.</h2>
            <p className="mt-5" style={{ color: C.steel }}>Every plan includes attendance, notifications and white-label branding. Choose the member limit that fits your gym today.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ['Basic', '100 members', 'For focused gyms getting started.'],
              ['Pro', '300 members', 'For established gyms ready to grow.', 'Most popular'],
              ['Pro Max', '750 members', 'For ambitious gyms building their future.'],
            ].map(([name, limit, text, badge]) => (
              <Card key={name} className="border-0" style={{ backgroundColor: C.card, boxShadow: badge ? `0 0 0 2px ${C.cobalt}` : `0 0 0 1px ${C.line}` }}>
                <CardHeader>
                  {badge && (
                    <span className="mb-2 w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white" style={{ backgroundColor: C.cobalt }}>
                      {badge}
                    </span>
                  )}
                  <CardTitle className="text-2xl" style={displayFont}>{name}</CardTitle>
                  <p style={displayFont} className="text-3xl" style={{ color: C.cobalt }}>{limit}</p>
                  <p className="text-sm" style={{ color: C.steel }}>{text}</p>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-3 text-sm">
                    {['Attendance tracker', 'Subscription & renewal notifications', 'White-label branded app', 'Owner dashboard'].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="size-4" style={{ color: C.cobalt }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-8 w-full" asChild style={badge ? { backgroundColor: C.cobalt, color: '#fff' } : { borderColor: C.ink, color: C.ink }} variant={badge ? 'default' : 'outline'}>
                    <a href={PANEL_URL}>Get started <ArrowRight className="ml-2 size-4" /></a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Social proof */}
        <section className="py-24" style={{ backgroundColor: C.ink, color: C.paper }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p style={monoFont} className="text-xs uppercase tracking-[0.2em]" style={{ color: C.lime }}>Built for modern gyms</p>
              <h2 style={displayFont} className="mt-3 text-4xl md:text-5xl">The next generation is already checking in.</h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                ['50+', 'Gyms onboarded'],
                ['10,000+', 'Members managed'],
                ['24/7', 'Digital support'],
              ].map(([number, label]) => (
                <div key={label} className="rounded-2xl p-6 text-center" style={{ backgroundColor: C.inkCard, border: `1px solid ${C.inkLine}` }}>
                  <p style={displayFont} className="text-4xl" style={{ color: '#7C93FF' }}>{number}</p>
                  <p className="mt-2 text-sm opacity-70">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-5 py-24 lg:px-8" id="faq">
          <div className="text-center">
            <Eyebrow>Questions, answered</Eyebrow>
            <h2 style={displayFont} className="text-4xl">Frequently asked questions.</h2>
          </div>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map(([question, answer], index) => (
              <AccordionItem key={question} value={`item-${index}`} style={{ borderColor: C.line }}>
                <AccordionTrigger className="text-base hover:no-underline">{question}</AccordionTrigger>
                <AccordionContent className="leading-6" style={{ color: C.steel }}>{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Final CTA */}
        <section className="mx-5 mb-20 rounded-3xl px-6 py-16 text-center md:px-10 md:py-24" style={{ backgroundColor: C.cobalt, color: '#fff' }}>
          <div className="mx-auto max-w-2xl">
            <h2 style={displayFont} className="text-4xl md:text-6xl">Ready to give your gym a digital upgrade?</h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-7 opacity-85">
              Attendance, renewals and your brand — running in the background, so you can spend your time on the floor.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild style={{ backgroundColor: C.ink, color: '#fff' }}>
                <a href={PANEL_URL}>Start your gym <ArrowRight className="ml-2 size-4" /></a>
              </Button>
              <Button size="lg" variant="outline" asChild style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff', backgroundColor: 'transparent' }}>
                <a href={APP_URL}>I&apos;m a member</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: C.line }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo />
            <p className="mt-3 text-xs" style={{ color: C.steel }}>The operating system for modern gyms.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs" style={{ color: C.steel }}>
            {[
              ['Home', '#top'],
              ['Features', '#features'],
              ['Attendance', '#attendance'],
              ['Notifications', '#notifications'],
              ['Pricing', '#pricing'],
              ['FAQ', '#faq'],
            ].map(([label, href]) => (
              <a key={label} href={href} className="hover:opacity-70">{label}</a>
            ))}
            <a href="#" className="hover:opacity-70">Privacy policy</a>
            <a href="#" className="hover:opacity-70">Terms of service</a>
            <a href="https://instagram.com" aria-label="Instagram" className="hover:opacity-70"><Instagram className="size-4" /></a>
          </div>
        </div>
        <div className="border-t px-5 py-5 text-center text-xs lg:px-8" style={{ borderColor: C.line, color: C.steel }}>
          © 2026 GainAI. Built for the future of fitness.
        </div>
      </footer>
    </div>
  )
}
