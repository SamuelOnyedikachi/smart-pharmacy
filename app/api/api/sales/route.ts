import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const take = parseInt(searchParams.get("take") ?? "50");
  const skip = parseInt(searchParams.get("skip") ?? "0");

  try {
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        take,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          cashier: { select: { name: true } },
          customer: { select: { name: true } },
          items: {
            include: { medicine: { select: { name: true, dosage: true } } },
          },
        },
      }),
      prisma.sale.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: sales.map((s) => ({
        ...s,
        totalAmount: Number(s.totalAmount),
        discount: Number(s.discount),
        amountPaid: Number(s.amountPaid),
        change: Number(s.change),
        items: s.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          subtotal: Number(i.subtotal),
        })),
      })),
      total,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["OWNER", "CASHIER", "PHARMACIST"].includes(role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { customerId, items, totalAmount, discount, amountPaid, change } = body;

    if (!items?.length) {
      return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 });
    }

    // Verify stock availability
    for (const item of items) {
      const med = await prisma.medicine.findUnique({
        where: { id: item.medicineId },
        select: { stockQuantity: true, name: true },
      });
      if (!med) {
        return NextResponse.json({ success: false, error: `Medicine not found` }, { status: 404 });
      }
      if (med.stockQuantity < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${med.name}` },
          { status: 400 }
        );
      }
    }

    // Create sale in transaction
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          cashierId: (session.user as any).id,
          customerId: customerId || null,
          totalAmount,
          discount: discount ?? 0,
          amountPaid,
          change: change ?? 0,
          receiptNumber: `RX-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          items: {
            create: items.map((i: any) => ({
              medicineId: i.medicineId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              subtotal: i.subtotal,
            })),
          },
        },
        include: {
          items: { include: { medicine: { select: { name: true } } } },
          customer: { select: { name: true } },
        },
      });

      // Deduct stock
      for (const item of items) {
        const updated = await tx.medicine.update({
          where: { id: item.medicineId },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        // Low stock notification
        if (updated.stockQuantity <= updated.reorderLevel) {
          await tx.notification.create({
            data: {
              title: "Low Stock Alert",
              message: `${updated.name} stock is now ${updated.stockQuantity} units (below reorder level of ${updated.reorderLevel}).`,
              type: "LOW_STOCK",
              entityId: updated.id,
            },
          });
        }
      }

      return newSale;
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "SALE",
        entity: "Sale",
        entityId: sale.id,
        details: { total: totalAmount, items: items.length },
      },
    });

    return NextResponse.json({ success: true, data: { ...sale, totalAmount: Number(sale.totalAmount) } }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to process sale" }, { status: 500 });
  }
}
