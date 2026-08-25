'use client'

import { useState } from 'react'
import Image from 'next/image'  // <-- ADD THIS
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  Check,
  ChevronDown,
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

const APP_URL = 'https://app.gainai.space/food-scanner'
const PANEL_URL = 'https://panel.gainai.space'

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

function DashboardMockup({ compact = false }: { compact?: boolean }) {
  // ... (rest unchanged)
}

function PhoneMockup() {
  // ... (rest unchanged)
}

export default function HomePage() {
  // ... (rest unchanged)
}
