"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/icons"

const STORAGE_KEY = "geniusstock-theme"

export function ThemeSetting() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  function apply(next: boolean) {
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light")
    } catch {
      // localStorage อาจถูกปิด — ข้ามได้
    }
  }

  const optionClass = (selected: boolean) =>
    cn(
      "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-medium transition-colors",
      selected
        ? "border-primary bg-primary font-bold text-primary-foreground"
        : "border-border bg-card text-text-medium hover:bg-muted"
    )

  return (
    <div className="flex max-w-xs gap-2.5">
      <button type="button" onClick={() => apply(false)} className={optionClass(!dark)}>
        <Icon name="sun" size={17} />
        สว่าง
      </button>
      <button type="button" onClick={() => apply(true)} className={optionClass(dark)}>
        <Icon name="moon" size={17} />
        มืด
      </button>
    </div>
  )
}
