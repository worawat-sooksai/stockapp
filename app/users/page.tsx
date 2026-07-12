import { headers } from "next/headers"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getLowStockCount } from "@/lib/queries"
import { formatNumber, formatThaiDateShort } from "@/lib/format"
import { AppShell } from "@/components/layout/app-shell"
import { UsersClient, type UserRow } from "@/components/users/users-client"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const [session, users, lowStockCount] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    getLowStockCount(),
  ])

  const currentUserId = session?.user.id ?? null

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    joinedLabel: formatThaiDateShort(u.createdAt),
    isSelf: u.id === currentUserId,
  }))

  return (
    <AppShell
      title="ผู้ใช้งาน"
      subtitle={`บัญชีผู้ใช้ในระบบ (${formatNumber(rows.length)} คน)`}
      lowStockCount={lowStockCount}
    >
      <UsersClient users={rows} />
    </AppShell>
  )
}
