"use client"

import { useState, type ReactNode } from "react"

import { Icon } from "@/components/icons"
import { Sidebar } from "@/components/layout/sidebar"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserMenu } from "@/components/layout/user-menu"

export function AppShell({
  title,
  subtitle,
  actions,
  lowStockCount,
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  lowStockCount: number
  children: ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lowStockCount={lowStockCount}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="เปิดเมนู"
                className="flex size-[38px] shrink-0 items-center justify-center rounded-lg border border-border bg-card text-text-medium lg:hidden"
              >
                <Icon name="menu" size={18} strokeWidth={1.8} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-foreground">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              <ThemeToggle />
              <UserMenu />
              {actions}
            </div>
          </header>

          {children}
        </div>
      </div>
    </div>
  )
}
