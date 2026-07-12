"use client"

import { Suspense, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

import { resetPassword } from "@/lib/auth-client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      return
    }
    if (password !== confirm) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน")
      return
    }

    setLoading(true)

    const { error: authError } = await resetPassword({ newPassword: password, token })

    if (authError) {
      setError(authError.message ?? "ตั้งรหัสผ่านใหม่ไม่สำเร็จ ลิงก์อาจหมดอายุ")
      setLoading(false)
      return
    }

    toast.success("ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบ")
    router.push("/login")
  }

  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="flex-col items-start gap-1">
          <h1 className="text-xl font-bold text-foreground">ลิงก์ไม่ถูกต้อง</h1>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            ไม่พบ token สำหรับตั้งรหัสผ่านใหม่ ลิงก์อาจไม่สมบูรณ์หรือหมดอายุแล้ว
            กรุณาขอลิงก์ใหม่อีกครั้ง
          </p>
          <p className="mt-5 text-center text-sm">
            <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
              ← ขอลิงก์รีเซ็ตใหม่
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex-col items-start gap-1">
        <h1 className="text-xl font-bold text-foreground">ตั้งรหัสผ่านใหม่</h1>
        <p className="text-sm text-muted-foreground">
          กรอกรหัสผ่านใหม่ที่ต้องการใช้เข้าสู่ระบบ
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm">ยืนยันรหัสผ่านใหม่</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="h-11 w-full font-bold">
            {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            ← กลับไปเข้าสู่ระบบ
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">กำลังโหลด...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
