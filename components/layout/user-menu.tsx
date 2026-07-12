"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { signOut, useSession } from "@/lib/auth-client"

export function UserMenu() {
  const router = useRouter()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const user = session?.user
  const displayName = user?.name || "ผู้ใช้งาน"
  const email = user?.email || ""
  const initial = displayName.charAt(0).toUpperCase()

  async function handleSignOut() {
    setLoading(true)
    const { error } = await signOut()

    if (error) {
      toast.error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
      setLoading(false)
      return
    }

    toast.success("ออกจากระบบแล้ว")
    setOpen(false)
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="เมนูผู้ใช้"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex size-[38px] items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
      >
        {initial}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          >
            <div className="border-b border-border px-4 py-3.5">
              <div className="truncate text-[13.5px] font-bold text-foreground">
                {displayName}
              </div>
              {email && (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {email}
                </div>
              )}
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={loading}
              className="block w-full px-4 py-2.5 text-left text-[13px] font-medium text-danger hover:bg-danger-bg disabled:opacity-60"
            >
              {loading ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
