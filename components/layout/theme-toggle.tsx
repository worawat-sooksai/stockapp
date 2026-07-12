"use client"

import { useEffect, useState } from "react"

import { Icon } from "@/components/icons"

const STORAGE_KEY = "geniusstock-theme"

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light")
    } catch {
      // localStorage อาจถูกปิด — ข้ามได้
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
      className="flex size-[38px] items-center justify-center rounded-lg border border-border bg-card text-text-medium transition-colors hover:bg-muted"
    >
      <Icon name={dark ? "sun" : "moon"} size={17} />
    </button>
  )
}
