'use client'

import Image from 'next/image'

export function Header() {
  return (
    <header className="flex h-20 items-center justify-between px-4 md:px-6 border-b">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Image
            src="/aven_logo.svg"
            alt="Aven Logo"
            width={71}
            height={27}
            className="brightness-0 dark:invert"
          />
        </div>
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <h1 className="text-2xl font-bold text-gray-100 dark:text-gray-800 pointer-events-none select-none">
          Aven AI
        </h1>
      </div>
    </header>
  )
} 