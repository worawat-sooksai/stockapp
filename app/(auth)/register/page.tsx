"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

import { signUp } from "@/lib/auth-client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      return
    }

    setLoading(true)

    const { error: authError } = await signUp.email({ name, email, password })

    if (authError) {
      setError(authError.message ?? "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
      setLoading(false)
      return
    }

    toast.success("สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ")
    router.push("/login")
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex-col items-start gap-1">
        <h1 className="text-xl font-bold text-foreground">สมัครสมาชิก</h1>
        <p className="text-sm text-muted-foreground">
          สร้างบัญชีใหม่เพื่อเริ่มใช้งาน Genius Stock
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">ชื่อ-นามสกุล</Label>
            <Input
              id="name"
              type="text"
              placeholder="เช่น สมชาย ใจดี"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">รหัสผ่าน (อย่างน้อย 8 ตัว)</Label>
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

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="h-11 w-full font-bold">
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
