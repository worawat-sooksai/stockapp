import { vi } from "vitest"
import "@testing-library/jest-dom/vitest"

// jest-mock-extended ใช้ global `jest` ภายใน (calledWithFn ฯลฯ) — เทียบ API เข้ากันได้กับ `vi`
// shim ให้ mockDeep/mockReset ของ jest-mock-extended ทำงานได้บน Vitest
// (@types/jest ติดตั้งไว้เพื่อให้ type ของ jest-mock-extended resolve ได้เท่านั้น ไม่ได้รัน jest จริง)
globalThis.jest = vi as unknown as typeof jest
