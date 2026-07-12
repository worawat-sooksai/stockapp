import type { ReactNode } from "react"

const features = [
  "ติดตามสต็อกแบบ Real-time",
  "ป้องกันการเบิกเกินจำนวน",
  "รายงานการเคลื่อนไหวครบถ้วน",
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* LEFT: brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary-light via-primary to-primary-dark p-12 text-primary-foreground lg:flex lg:w-[44%] lg:flex-col">
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/95 shadow-lg">
            <div className="size-5 rounded-md bg-accent" />
          </div>
          <div>
            <div className="text-lg font-bold">Genius Stock</div>
            <div className="text-xs text-primary-foreground/65">ระบบคลังสินค้าเบิกจ่าย</div>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center">
          <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight">
            จัดการคลังสินค้า
            <br />
            อย่างชาญฉลาด
          </h1>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-primary-foreground/80">
            ระบบเบิกจ่ายสินค้าที่ออกแบบมาเพื่อประสิทธิภาพสูงสุดขององค์กรคุณ
            ป้องกันสต็อกเพี้ยน และเห็นภาพรวมได้แบบเรียลไทม์
          </p>
          <ul className="flex flex-col gap-3.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-primary-foreground/90">
                <span className="flex size-5 items-center justify-center rounded-full bg-white/15 text-xs">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs text-primary-foreground/50">
          © 2569 Genius Stock · IT Genius Engineering
        </div>
      </aside>

      {/* RIGHT: form panel */}
      <main className="flex flex-1 items-center justify-center bg-background p-6">
        {children}
      </main>
    </div>
  )
}
