import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { AuthLayout } from "@/components/auth-layout"
import { BottomNavProvider } from "@/contexts/bottom-nav-context"
import { ServiceWorkerRegister } from "@/components/sw-register"
import "../globals.css"
import "@/lib/pwa-install"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "GainAI | Personal Fitness",
  description: "Build fitness habits with personalized workouts, nutrition tracking, AI food scanning, and progress tools in one place.",
  icons: { icon: "/logo.png" },
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" }],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning className="bg-background"><body className={`${inter.variable} font-sans antialiased`}><ServiceWorkerRegister /><AuthProvider><ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange><BottomNavProvider><AuthLayout>{children}</AuthLayout></BottomNavProvider></ThemeProvider></AuthProvider></body></html>
}
