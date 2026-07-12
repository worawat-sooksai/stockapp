import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { TransactionType } from '../src/generated/prisma/enums'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const products = [
  { sku: 'SKU-1001', name: 'น้ำดื่มขวดใหญ่ 1.5L', category: 'เครื่องดื่ม', unit: 'แพ็ค', quantity: 120, reorderPoint: 20, price: 89 },
  { sku: 'SKU-1002', name: 'กาแฟดำกระป๋อง 180ml', category: 'เครื่องดื่ม', unit: 'กระป๋อง', quantity: 8, reorderPoint: 24, price: 15 },
  { sku: 'SKU-1003', name: 'ปากกาลูกลื่น Pilot 0.5mm', category: 'เครื่องเขียน', unit: 'ด้าม', quantity: 0, reorderPoint: 20, price: 25 },
  { sku: 'SKU-1004', name: 'กระดาษ A4 70g/m² (รีม)', category: 'เครื่องเขียน', unit: 'รีม', quantity: 35, reorderPoint: 10, price: 120 },
  { sku: 'SKU-1005', name: 'เมาส์ไร้สาย Logitech M185', category: 'อุปกรณ์ IT', unit: 'ชิ้น', quantity: 5, reorderPoint: 5, price: 590 },
  { sku: 'SKU-1006', name: 'ถุงขยะดำ 30L (แพ็ค 50 ใบ)', category: 'ของใช้', unit: 'แพ็ค', quantity: 12, reorderPoint: 5, price: 45 },
  { sku: 'SKU-1007', name: 'กล่องกระดาษลูกฟูก เบอร์ 5', category: 'บรรจุภัณฑ์', unit: 'ใบ', quantity: 3, reorderPoint: 20, price: 18 },
]

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

async function main() {
  // ลบข้อมูลเดิม: StockTransaction ก่อน Product (เพราะมี FK relation)
  await prisma.stockTransaction.deleteMany()
  await prisma.product.deleteMany()

  const created = await Promise.all(
    products.map((data) => prisma.product.create({ data }))
  )

  const bySku = new Map(created.map((p) => [p.sku, p]))
  const idOf = (sku: string) => {
    const product = bySku.get(sku)
    if (!product) {
      throw new Error(`ไม่พบสินค้า sku: ${sku}`)
    }
    return product.id
  }

  // ประวัติการเคลื่อนไหวตัวอย่างที่สมเหตุสมผล 9 รายการ (กระจายย้อนหลังเพื่อให้กราฟแนวโน้มมีข้อมูล)
  const transactions = [
    { sku: 'SKU-1001', type: TransactionType.IN, quantity: 120, note: 'รับเข้าล็อตแรก บิล #IN-2601-001 (ซัพพลายเออร์ ทิพย์เครื่องดื่ม)', createdAt: daysAgo(12) },
    { sku: 'SKU-1002', type: TransactionType.IN, quantity: 32, note: 'รับเข้ากาแฟกระป๋อง บิล #IN-2601-002', createdAt: daysAgo(11) },
    { sku: 'SKU-1003', type: TransactionType.IN, quantity: 20, note: 'รับเข้าปากกา บิล #IN-2601-003', createdAt: daysAgo(10) },
    { sku: 'SKU-1004', type: TransactionType.IN, quantity: 40, note: 'รับเข้ากระดาษ A4 บิล #IN-2601-004', createdAt: daysAgo(9) },
    { sku: 'SKU-1001', type: TransactionType.OUT, quantity: 30, note: 'เบิกไปจุดขายหน้าร้าน (ผู้เบิก: ฝ่ายขาย)', createdAt: daysAgo(7) },
    { sku: 'SKU-1002', type: TransactionType.OUT, quantity: 24, note: 'เบิกจัดกิจกรรมสัมมนา', createdAt: daysAgo(3) },
    { sku: 'SKU-1003', type: TransactionType.OUT, quantity: 20, note: 'เบิกแจกทีมขายทั้งหมด (สต็อกหมด)', createdAt: daysAgo(2) },
    { sku: 'SKU-1007', type: TransactionType.OUT, quantity: 12, note: 'เบิกกล่องแพ็คสินค้าส่งออก', createdAt: daysAgo(1) },
    { sku: 'SKU-1005', type: TransactionType.OUT, quantity: 3, note: 'เบิกเมาส์ให้พนักงานใหม่', createdAt: daysAgo(1) },
  ]

  await prisma.stockTransaction.createMany({
    data: transactions.map((t) => ({
      productId: idOf(t.sku),
      type: t.type,
      quantity: t.quantity,
      note: t.note,
      createdAt: t.createdAt,
    })),
  })

  console.log(`Seed สำเร็จ: สินค้า ${created.length} รายการ, การเคลื่อนไหว ${transactions.length} รายการ`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
