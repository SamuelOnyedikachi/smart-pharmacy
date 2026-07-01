import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const canManage = (role?: string) => ["OWNER", "STOCK_KEEPER", "DRIVER"].includes(role ?? "");

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canManage((session.user as any).role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  try {
    const delivery = await prisma.$transaction(async (tx) => {
      const current = await tx.delivery.findUnique({ where: { id }, include: { items: true } });
      if (!current) throw new Error("NOT_FOUND");

      const nextStatus = body.status ?? current.status;
      const updated = await tx.delivery.update({
        where: { id },
        data: {
          ...(body.status !== undefined && {
            status: body.status,
            deliveredAt: body.status === "DELIVERED" ? current.deliveredAt ?? new Date() : current.deliveredAt,
          }),
          ...(body.driverId !== undefined && { driverId: body.driverId || null }),
          ...(body.expectedDate !== undefined && { expectedDate: new Date(body.expectedDate) }),
          ...(body.notes !== undefined && { notes: body.notes || null }),
        },
        include: { items: true, supplier: true },
      });

      if (current.status !== "DELIVERED" && nextStatus === "DELIVERED") {
        for (const item of current.items) {
          await tx.medicine.update({
            where: { id: item.medicineId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
        await tx.notification.create({
          data: {
            title: "Delivery Received",
            message: `${updated.supplier.name} delivery was marked delivered and stock was updated.`,
            type: "DELIVERY",
            entityId: updated.id,
          },
        });
      }

      return updated;
    });
    return NextResponse.json({ success: true, data: delivery });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") return NextResponse.json({ success: false, error: "Delivery not found" }, { status: 404 });
    return NextResponse.json({ success: false, error: "Failed to update delivery" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canManage((session.user as any).role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (delivery?.status === "DELIVERED") {
      return NextResponse.json({ success: false, error: "Delivered stock movements cannot be deleted" }, { status: 400 });
    }
    await prisma.delivery.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete delivery" }, { status: 500 });
  }
}
