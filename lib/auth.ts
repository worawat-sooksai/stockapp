import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // Dev mode: log reset link ใน console แทนการส่งอีเมลจริง (ยังไม่มี email provider)
      console.log("\n[better-auth] ลิงก์รีเซ็ตรหัสผ่าน (dev mode)")
      console.log(`  ผู้ใช้: ${user.email}`)
      console.log(`  ลิงก์: ${url}\n`)
    }
  }
})
