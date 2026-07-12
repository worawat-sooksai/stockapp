// ฟอร์แมตตัวเลข/เงินแบบไทย ใช้ทั่วทั้งแอป

const nf = new Intl.NumberFormat("th-TH")

export function formatNumber(value: number): string {
  return nf.format(value)
}

export function formatBaht(value: number): string {
  return "฿" + nf.format(Math.round(value))
}

export function formatBahtPrecise(value: number): string {
  return "฿" + new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

// วันที่/เวลาแบบไทย (พ.ศ.)
export function formatThaiDate(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export function formatThaiDateTime(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatThaiDateShort(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatThaiTime(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
