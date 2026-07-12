"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { requestPasswordReset } from "@/lib/auth-client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    })

    setLoading(false)

    if (authError) {
      setError(authError.message ?? "ส่งลิงก์รีเซ็ตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
      return
    }

    setSent(true)
    toast.success("ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว")
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex-col items-start gap-1">
        <h1 className="text-xl font-bold text-foreground">ลืมรหัสผ่าน?</h1>
        <p className="text-sm text-muted-foreground">
          กรอกอีเมลที่ใช้สมัครไว้ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้ทันที
        </p>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="rounded-lg bg-success-bg p-4 text-sm text-success-foreground">
            หากอีเมล <span className="font-semibold">{email}</span> มีอยู่ในระบบ
            เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว กรุณาตรวจสอบกล่องจดหมาย
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="h-11 w-full font-bold">
              {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ต"}
            </Button>
          </form>
        )}

        <p className="mt-5 text-center text-sm">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            ← กลับไปเข้าสู่ระบบ
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
