import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const canRefund = (role?: string) => ["OWNER", "CASHIER", "PHARMACIST"].includes(role ?? "");

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canRefund((session.user as any).role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  if (body.status !== "REFUNDED") {
    return NextResponse.json({ success: false, error: "Only refund updates are supported" }, { status: 400 });
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const current = await tx.sale.findUnique({ where: { id }, include: { items: true } });
      if (!current) throw new Error("NOT_FOUND");
      if (current.status === "REFUNDED") throw new Error("ALREADY_REFUNDED");

      for (const item of current.items) {
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }

      return tx.sale.update({ where: { id }, data: { status: "REFUNDED", notes: body.notes || "Refunded" } });
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "REFUND",
        entity: "Sale",
        entityId: sale.id,
        details: { receiptNumber: sale.receiptNumber },
      },
    });

    return NextResponse.json({ success: true, data: sale });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") return NextResponse.json({ success: false, error: "Sale not found" }, { status: 404 });
    if (error.message === "ALREADY_REFUNDED") return NextResponse.json({ success: false, error: "Sale is already refunded" }, { status: 400 });
    return NextResponse.json({ success: false, error: "Failed to refund sale" }, { status: 500 });
  }
}
