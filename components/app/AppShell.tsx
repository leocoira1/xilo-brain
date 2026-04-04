"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Search } from "lucide-react"
import { NAV } from "./app-config"

export default function AppShell({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-[#F7F9FC]">
      {/* Sidebar */}
      <aside className="w-[240px] bg-[#0F1B2E] px-6 py-6 text-white">
        <div className="mb-10">
          {/* Replace with your SVG later */}
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0">
              <div className="absolute left-[6px] top-[6px] h-[2px] w-[28px] rotate-45 rounded-full bg-white" />
              <div className="absolute left-[6px] top-[30px] h-[2px] w-[28px] -rotate-45 rounded-full bg-white" />
              <div className="absolute left-[2px] top-[18px] h-[2px] w-[20px] rotate-45 rounded-full bg-white" />
              <div className="absolute right-[2px] top-[18px] h-[2px] w-[20px] -rotate-45 rounded-full bg-white" />
              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#25B3A8]" />
            </div>
            <span className="text-2xl font-semibold tracking-wide">XILO</span>
          </div>
        </div>

        <nav className="space-y-2">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-4 py-3 transition ${
                  active
                    ? "bg-[#25B3A8] text-white"
                    : "text-[#C7D2E6] hover:bg-[#1C2A44]"
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex min-h-screen flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#E5EAF5] bg-white px-8 py-5">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-semibold text-[#132447]">{title}</h1>

            <div className="relative w-[420px] max-w-[40vw]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7A99]" />
              <input
                className="h-11 w-full rounded-full border border-[#E6EAF3] bg-[#F3F6FB] pl-11 pr-4 text-sm text-[#132447] outline-none placeholder:text-[#6B7A99]"
                placeholder="Search claim, or bill ID..."
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-sm text-[#6B7A99]">
              Updated 2m ago <span className="mx-1 text-[#27AE60]">●</span>
              <span className="font-semibold text-[#132447]">Live</span>
            </div>

            <button className="text-[#132447]">
              <Bell className="h-5 w-5" />
            </button>

            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
              alt="User avatar"
              className="h-10 w-10 rounded-full object-cover"
            />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  )
}
