import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const canManage = (role?: string) => ["OWNER", "STOCK_KEEPER"].includes(role ?? "");

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const medicine = await prisma.medicine.findUnique({ where: { id } });
  if (!medicine) return NextResponse.json({ success: false, error: "Medicine not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: { ...medicine, unitPrice: Number(medicine.unitPrice) } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canManage((session.user as any).role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  try {
    const medicine = await prisma.medicine.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.genericName !== undefined && { genericName: body.genericName || null }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.manufacturer !== undefined && { manufacturer: body.manufacturer }),
        ...(body.dosage !== undefined && { dosage: body.dosage }),
        ...(body.form !== undefined && { form: body.form }),
        ...(body.batchNumber !== undefined && { batchNumber: body.batchNumber }),
        ...(body.expiryDate !== undefined && { expiryDate: new Date(body.expiryDate) }),
        ...(body.stockQuantity !== undefined && { stockQuantity: Number(body.stockQuantity) }),
        ...(body.reorderLevel !== undefined && { reorderLevel: Number(body.reorderLevel) }),
        ...(body.unitPrice !== undefined && { unitPrice: body.unitPrice }),
        ...(body.requiresPrescription !== undefined && { requiresPrescription: Boolean(body.requiresPrescription) }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "UPDATE",
        entity: "Medicine",
        entityId: medicine.id,
        details: { name: medicine.name },
      },
    });

    if (medicine.isActive && medicine.stockQuantity <= medicine.reorderLevel) {
      await prisma.notification.create({
        data: {
          title: "Low Stock Alert",
          message: `${medicine.name} stock is ${medicine.stockQuantity} units (reorder level: ${medicine.reorderLevel}).`,
          type: "LOW_STOCK",
          entityId: medicine.id,
        },
      });
    }

    return NextResponse.json({ success: true, data: { ...medicine, unitPrice: Number(medicine.unitPrice) } });
  } catch (error: any) {
    if (error.code === "P2025") return NextResponse.json({ success: false, error: "Medicine not found" }, { status: 404 });
    return NextResponse.json({ success: false, error: "Failed to update medicine" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canManage((session.user as any).role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const medicine = await prisma.medicine.update({ where: { id }, data: { isActive: false } });
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "DEACTIVATE",
        entity: "Medicine",
        entityId: medicine.id,
        details: { name: medicine.name },
      },
    });
    return NextResponse.json({ success: true, data: medicine });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to deactivate medicine" }, { status: 500 });
  }
}
