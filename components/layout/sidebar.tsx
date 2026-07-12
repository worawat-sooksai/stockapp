"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/icons"

type NavItem = {
  href: string
  label: string
  icon: IconName
  showLowBadge?: boolean
  disabled?: boolean
}

const MAIN_NAV: NavItem[] = [
  { href: "/", label: "ภาพรวม", icon: "grid" },
  { href: "/products", label: "สินค้า", icon: "box" },
  { href: "/stock-in", label: "รับสินค้าเข้า", icon: "inTray" },
  { href: "/stock-out", label: "เบิกจ่ายสินค้า", icon: "outTray" },
  { href: "/low-stock", label: "สินค้าใกล้หมด", icon: "alertTri", showLowBadge: true },
]

const OTHER_NAV: NavItem[] = [
  { href: "/reports", label: "รายงาน", icon: "chart" },
  { href: "/users", label: "ผู้ใช้งาน", icon: "users" },
  { href: "/settings", label: "ตั้งค่า", icon: "settings" },
]

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

function NavLink({
  item,
  active,
  lowStockCount,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  lowStockCount: number
  onNavigate?: () => void
}) {
  const content = (
    <>
      <Icon name={item.icon} size={18} strokeWidth={active ? 1.9 : 1.7} />
      <span className="flex-1">{item.label}</span>
      {item.showLowBadge && lowStockCount > 0 && (
        <span className="rounded-full bg-danger px-1.5 py-px text-[10.5px] font-bold text-white">
          {lowStockCount}
        </span>
      )}
    </>
  )

  const classes = cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] whitespace-nowrap transition-colors",
    active
      ? "bg-sidebar-accent font-bold text-white"
      : "font-medium text-sidebar-foreground hover:bg-white/5 hover:text-white",
    item.disabled && "cursor-not-allowed opacity-70 hover:bg-transparent"
  )

  if (item.disabled) {
    return (
      <span className={classes} aria-disabled="true">
        {content}
      </span>
    )
  }

  return (
    <Link href={item.href} className={classes} onClick={onNavigate}>
      {content}
    </Link>
  )
}

export function Sidebar({
  open,
  onClose,
  lowStockCount,
}: {
  open: boolean
  onClose: () => void
  lowStockCount: number
}) {
  const pathname = usePathname()

  return (
    <>
      {/* backdrop สำหรับ drawer บนจอเล็ก */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/35 lg:hidden",
          open ? "block" : "hidden"
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col gap-0.5 overflow-y-auto bg-sidebar p-3.5 transition-transform duration-250 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0",
          open ? "translate-x-0 shadow-[8px_0_24px_rgba(0,0,0,0.25)]" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-5">
          <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-primary-light to-primary text-sm font-bold text-white">
            G
          </div>
          <div>
            <div className="text-sm font-bold text-white">Genius Stock</div>
            <div className="text-[10.5px] text-white/50">ระบบคลังสินค้าเบิกจ่าย</div>
          </div>
        </div>

        <div className="px-3 pt-1 pb-2 text-[10.5px] font-bold tracking-wider text-white/40 uppercase">
          เมนูหลัก
        </div>
        {MAIN_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            lowStockCount={lowStockCount}
            onNavigate={onClose}
          />
        ))}

        <div className="px-3 pt-4 pb-2 text-[10.5px] font-bold tracking-wider text-white/40 uppercase">
          อื่น ๆ
        </div>
        {OTHER_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            lowStockCount={lowStockCount}
            onNavigate={onClose}
          />
        ))}
      </aside>
    </>
  )
}
