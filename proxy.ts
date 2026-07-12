import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicPath = publicPaths.includes(pathname)
  const sessionCookie = getSessionCookie(request)

  // ยังไม่ login + เข้าหน้า protected → เด้งไป /login
  if (!sessionCookie && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // login แล้ว + เข้าหน้า public (login/register/...) → เด้งกลับหน้าแรก
  if (sessionCookie && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
}
