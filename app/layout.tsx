import type { Metadata, Viewport } from "next"
import { cookies } from "next/headers"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { AuthLayout } from "@/components/auth-layout"
import { BottomNavProvider } from "@/contexts/bottom-nav-context"
import "./globals.css"

// 👇 This line runs the module's side effects BEFORE any component mounts
import "@/lib/pwa-install"

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
    manifest: gymId ? `/manifest/${gymId}` : "/manifest.json",
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
            <BottomNavProvider>
              <AuthLayout>{children}</AuthLayout>
            </BottomNavProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
