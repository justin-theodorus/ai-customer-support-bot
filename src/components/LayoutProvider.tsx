'use client'

import { Header } from '@/components/Header'

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
} 