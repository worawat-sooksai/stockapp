import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'jest-mock-extended'

import type { PrismaClient } from '@/src/generated/prisma/client'
import { TransactionType } from '@/src/generated/prisma/enums'

vi.mock('@/lib/prisma', () => ({
  prisma: mockDeep<PrismaClient>()
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

import { prisma } from '@/lib/prisma'
import { stockOut } from '@/app/actions/stock'

const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>

// สร้าง FormData จำลอง input ของฟอร์มเบิกออก
// note: ตั้งค่าเฉพาะเมื่อส่ง field 'note' มาเท่านั้น — ถ้าไม่ส่งจะ "ไม่ set key note" เลย
// เลียนแบบ client จริง (stock-form.tsx) ที่ไม่ใส่ key note เมื่อผู้ใช้เว้นว่าง
// ทำให้ formData.get('note') คืน null (ไม่ใช่ '') ซึ่งเป็น path จริงที่ต้อง validate ผ่านได้
function buildFormData(fields: { productId?: string, quantity?: string, note?: string }) {
  const fd = new FormData()
  fd.set('productId', fields.productId ?? 'product-1')
  fd.set('quantity', fields.quantity ?? '1')
  if (fields.note !== undefined) fd.set('note', fields.note)
  return fd
}

describe('เบิกออก (Stock Out)', () => {
  beforeEach(() => {
    mockReset(mockPrisma)
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockPrisma))
  })

  describe('เบิกออกสำเร็จ', () => {
    it('เบิกน้อยกว่าที่มี ลด quantity ถูกต้อง และสร้าง StockTransaction type OUT ใน transaction เดียว', async () => {
      // arrange
      mockPrisma.product.findFirst.mockResolvedValue({
        name: 'ปากกาลูกลื่น',
        quantity: 20,
        unit: 'ด้าม'
      } as any)
      mockPrisma.product.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.stockTransaction.create.mockResolvedValue({} as any)

      const formData = buildFormData({ productId: 'product-1', quantity: '5' })

      // act
      const result = await stockOut(formData)

      // assert
      expect(result.ok).toBe(true)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
      expect(mockPrisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: 'product-1', deletedAt: null, quantity: { gte: 5 } },
        data: { quantity: { decrement: 5 } }
      })
      expect(mockPrisma.stockTransaction.create).toHaveBeenCalledWith({
        data: { productId: 'product-1', type: TransactionType.OUT, quantity: 5, note: undefined }
      })
      if (result.ok) {
        expect(result.message).toContain('คงเหลือ 15')
      }
    })

    it('เบิกพอดีเท่าจำนวนที่มี (exact match) สำเร็จ และเหลือ 0', async () => {
      // arrange
      mockPrisma.product.findFirst.mockResolvedValue({
        name: 'สมุดโน้ต',
        quantity: 8,
        unit: 'เล่ม'
      } as any)
      mockPrisma.product.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.stockTransaction.create.mockResolvedValue({} as any)

      const formData = buildFormData({ productId: 'product-2', quantity: '8' })

      // act
      const result = await stockOut(formData)

      // assert
      expect(result.ok).toBe(true)
      expect(mockPrisma.stockTransaction.create).toHaveBeenCalledWith({
        data: { productId: 'product-2', type: TransactionType.OUT, quantity: 8, note: undefined }
      })
      if (result.ok) {
        expect(result.message).toContain('คงเหลือ 0')
      }
    })

    it('เบิกออกสำเร็จเมื่อไม่กรอกหมายเหตุ (ไม่มี key note ใน FormData → note เป็น null)', async () => {
      // arrange — เลียนแบบ client จริงที่ไม่ set key note เมื่อผู้ใช้เว้นว่าง
      // regression: เดิม parseMovement ส่ง null เข้า zod .optional() ทำให้ validate fail ทุกครั้ง
      mockPrisma.product.findFirst.mockResolvedValue({
        name: 'ปากกาลูกลื่น',
        quantity: 20,
        unit: 'ด้าม'
      } as any)
      mockPrisma.product.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.stockTransaction.create.mockResolvedValue({} as any)

      const formData = buildFormData({ productId: 'product-1', quantity: '5' })
      expect(formData.get('note')).toBeNull()

      // act
      const result = await stockOut(formData)

      // assert — ต้องผ่าน validation และบันทึกได้ตามปกติ ไม่ใช่ปฏิเสธเพราะ note null
      expect(result.ok).toBe(true)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
      expect(mockPrisma.stockTransaction.create).toHaveBeenCalledWith({
        data: { productId: 'product-1', type: TransactionType.OUT, quantity: 5, note: undefined }
      })
    })
  })

  describe('ป้องกันเบิกเกินจำนวนคงเหลือ', () => {
    it('ปฏิเสธเมื่อเบิกเกินจำนวนที่มี 1 หน่วย ไม่สร้าง txn และไม่แก้ quantity', async () => {
      // arrange — มีของ 5 ชิ้น ขอเบิก 6 ชิ้น (เกิน 1)
      mockPrisma.product.findFirst.mockResolvedValue({
        name: 'กระดาษ A4',
        quantity: 5,
        unit: 'รีม'
      } as any)
      mockPrisma.product.updateMany.mockResolvedValue({ count: 0 })

      const formData = buildFormData({ productId: 'product-3', quantity: '6' })

      // act
      const result = await stockOut(formData)

      // assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain('เบิกเกินจำนวนคงเหลือ')
        expect(result.error).toContain('5')
      }
      expect(mockPrisma.stockTransaction.create).not.toHaveBeenCalled()
      expect(mockPrisma.product.update).not.toHaveBeenCalled()
    })

    it('ปฏิเสธเมื่อสินค้าคงเหลือเป็น 0', async () => {
      // arrange
      mockPrisma.product.findFirst.mockResolvedValue({
        name: 'หมึกพิมพ์',
        quantity: 0,
        unit: 'ขวด'
      } as any)
      mockPrisma.product.updateMany.mockResolvedValue({ count: 0 })

      const formData = buildFormData({ productId: 'product-4', quantity: '1' })

      // act
      const result = await stockOut(formData)

      // assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain('เบิกเกินจำนวนคงเหลือ')
      }
      expect(mockPrisma.stockTransaction.create).not.toHaveBeenCalled()
    })
  })

  describe('ป้องกัน race condition', () => {
    it('ปฏิเสธเมื่อ updateMany คืน count 0 แม้ตอน findFirst จะดูเหมือนมีของพอ (ถูกเบิกไปก่อนหน้าโดย transaction คู่ขนาน)', async () => {
      // arrange — findFirst อ่านค่าตอนแรกว่ามี 10 แต่มี transaction อื่นเบิกตัดหน้าไปแล้ว
      // ทำให้ updateMany (เงื่อนไข gte ที่ระดับ row) ไม่ match แถวใด ๆ คืน count 0
      mockPrisma.product.findFirst.mockResolvedValue({
        name: 'เทปกาว',
        quantity: 10,
        unit: 'ม้วน'
      } as any)
      mockPrisma.product.updateMany.mockResolvedValue({ count: 0 })

      const formData = buildFormData({ productId: 'product-5', quantity: '3' })

      // act
      const result = await stockOut(formData)

      // assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeTruthy()
      }
      expect(mockPrisma.stockTransaction.create).not.toHaveBeenCalled()
      expect(mockPrisma.product.update).not.toHaveBeenCalled()
    })
  })

  describe('กรณีไม่พบสินค้า', () => {
    it('คืน ok:false เมื่อไม่พบสินค้า (ถูกลบหรือไม่มีอยู่จริง)', async () => {
      // arrange
      mockPrisma.product.findFirst.mockResolvedValue(null)

      const formData = buildFormData({ productId: 'not-exist', quantity: '1' })

      // act
      const result = await stockOut(formData)

      // assert
      expect(result).toEqual({ ok: false, error: 'ไม่พบสินค้าที่เลือก' })
      expect(mockPrisma.product.updateMany).not.toHaveBeenCalled()
      expect(mockPrisma.stockTransaction.create).not.toHaveBeenCalled()
    })
  })

  describe('validate input ด้วย zod', () => {
    it('ปฏิเสธเมื่อ quantity เป็น 0 และไม่เรียก prisma เลย', async () => {
      // arrange
      const formData = buildFormData({ quantity: '0' })

      // act
      const result = await stockOut(formData)

      // assert
      expect(result.ok).toBe(false)
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('ปฏิเสธเมื่อ quantity ติดลบ', async () => {
      // arrange
      const formData = buildFormData({ quantity: '-5' })

      // act
      const result = await stockOut(formData)

      // assert
      expect(result.ok).toBe(false)
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('ปฏิเสธเมื่อ quantity ไม่ใช่จำนวนเต็ม', async () => {
      // arrange
      const formData = buildFormData({ quantity: '2.5' })

      // act
      const result = await stockOut(formData)

      // assert
      expect(result.ok).toBe(false)
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('ปฏิเสธเมื่อไม่ได้เลือกสินค้า (productId ว่าง)', async () => {
      // arrange
      const formData = buildFormData({ productId: '' })

      // act
      const result = await stockOut(formData)

      // assert
      expect(result.ok).toBe(false)
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })
  })
})
