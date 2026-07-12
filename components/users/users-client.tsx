"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { deleteUser } from "@/app/actions/users"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Icon } from "@/components/icons"

export type UserRow = {
  id: string
  name: string
  email: string
  joinedLabel: string
  isSelf: boolean
}

export function UsersClient({ users }: { users: UserRow[] }) {
  const [deleting, setDeleting] = useState<UserRow | null>(null)
  const [pending, startTransition] = useTransition()

  function confirmDelete() {
    if (!deleting) return
    const target = deleting
    startTransition(async () => {
      const result = await deleteUser(target.id)
      if (result.ok) {
        toast.success(result.message)
        setDeleting(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(1,45,46,0.06)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ผู้ใช้</TableHead>
              <TableHead>อีเมล</TableHead>
              <TableHead>วันที่สมัคร</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  ยังไม่มีผู้ใช้ในระบบ
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-foreground">
                          {u.name}
                        </span>
                        {u.isSelf && (
                          <span className="rounded-full bg-primary-soft px-2 py-px text-[10.5px] font-bold text-primary">
                            คุณ
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] text-text-medium">
                    {u.email}
                  </TableCell>
                  <TableCell className="text-[13px] text-text-medium">
                    {u.joinedLabel}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDeleting(u)}
                        disabled={u.isSelf}
                        className="text-[12.5px] font-bold text-danger hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                      >
                        ลบ
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ยืนยันการลบผู้ใช้ */}
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(next) => {
          if (!next && !pending) setDeleting(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบผู้ใช้</DialogTitle>
            <DialogDescription>
              ต้องการลบบัญชี{" "}
              <span className="font-semibold text-foreground">
                {deleting?.name}
              </span>{" "}
              ({deleting?.email}) ใช่หรือไม่? การลบนี้ถาวรและไม่สามารถกู้คืนได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 px-5"
                  disabled={pending}
                >
                  ยกเลิก
                </Button>
              }
            />
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending}
              className="h-11 gap-2 px-5"
            >
              {pending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-danger/30 border-t-danger" />
              ) : (
                <Icon name="trash" size={16} strokeWidth={2} />
              )}
              ลบผู้ใช้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
