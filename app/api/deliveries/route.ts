import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const canManage = (role?: string) => ["OWNER", "STOCK_KEEPER", "DRIVER"].includes(role ?? "");

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const deliveries = await prisma.delivery.findMany({
    orderBy: { createdAt: "desc" },
    include: { supplier: true, driver: { select: { name: true, phone: true } }, items: { include: { medicine: true } } },
  });
  return NextResponse.json({ success: true, data: deliveries });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canManage((session.user as any).role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  try {
    const delivery = await prisma.delivery.create({
      data: {
        supplierId: body.supplierId,
        driverId: body.driverId || null,
        expectedDate: new Date(body.expectedDate),
        notes: body.notes || null,
        items: {
          create: (body.items ?? []).map((item: any) => ({
            medicineId: item.medicineId,
            quantity: Number(item.quantity),
            unitCost: item.unitCost,
          })),
        },
      },
      include: { items: true },
    });
    return NextResponse.json({ success: true, data: delivery }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create delivery" }, { status: 500 });
  }
}
