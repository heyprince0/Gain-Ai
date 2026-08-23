'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type BottomNavContextType = {
  showBottomNav: boolean
  setShowBottomNav: (show: boolean) => void
}

const BottomNavContext = createContext<BottomNavContextType | undefined>(undefined)

export function BottomNavProvider({ children }: { children: ReactNode }) {
  const [showBottomNav, setShowBottomNav] = useState(true)
  return (
    <BottomNavContext.Provider value={{ showBottomNav, setShowBottomNav }}>
      {children}
    </BottomNavContext.Provider>
  )
}

export function useBottomNav() {
  const context = useContext(BottomNavContext)
  if (!context) throw new Error('useBottomNav must be used within BottomNavProvider')
  return context
}
