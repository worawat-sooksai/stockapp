"use client"

import { useEffect, useState } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster(props: ToasterProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const el = document.documentElement
    const sync = () => setTheme(el.classList.contains("dark") ? "dark" : "light")
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(el, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return (
    <Sonner
      theme={theme}
      position="top-right"
      richColors
      toastOptions={{
        style: {
          fontFamily: "var(--font-inter), var(--font-anuphan), sans-serif",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
