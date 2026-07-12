import type { Metadata } from "next"
import { Inter, Anuphan, JetBrains_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "Genius Stock — ระบบคลังสินค้าเบิกจ่าย",
  description: "ระบบจัดการคลังสินค้าเบิกจ่าย บันทึกสินค้า รับเข้า เบิกออก พร้อมแจ้งเตือนสินค้าใกล้หมด",
}

// ตั้ง .dark ก่อน paint กัน flash — อ่านจาก localStorage คีย์เดียวกับ design
const themeScript = `
try {
  var t = localStorage.getItem('geniusstock-theme')
  if (t === 'dark') document.documentElement.classList.add('dark')
} catch (e) {}
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${inter.variable} ${anuphan.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
