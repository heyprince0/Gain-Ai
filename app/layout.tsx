import type { Metadata, Viewport } from "next"
import { cookies } from "next/headers"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { AuthLayout } from "@/components/auth-layout"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const gymId = cookieStore.get("gainai_pending_gym_id")?.value

  return {
    title: "GainAi - AI-Powered Nutrition & Body Analysis",
    description:
      "Your premium AI fitness tool. Scan food for macros, analyze body composition, and get personalized coaching from your AI fitness assistant.",
    icons: {
      icon: "/logo.png",
    },
    // Gym-specific manifest when a pending install belongs to a gym —
    // this is what makes the installed icon/name show the gym's own
    // branding instead of plain GainAi. Falls back to the default
    // manifest for everyone else, unchanged.
    manifest: gymId ? `/api/manifest/${gymId}` : "/manifest.json",
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <AuthLayout>{children}</AuthLayout>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
