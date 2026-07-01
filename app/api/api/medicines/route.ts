import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const active = searchParams.get("active");

  try {
    const medicines = await prisma.medicine.findMany({
      where: {
        ...(active === "true" && { isActive: true }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { genericName: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(category && { category: category as any }),
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: medicines.map((m) => ({
        ...m,
        unitPrice: Number(m.unitPrice),
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch medicines" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["OWNER", "STOCK_KEEPER"].includes(role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const medicine = await prisma.medicine.create({
      data: {
        name: body.name,
        genericName: body.genericName || null,
        category: body.category,
        manufacturer: body.manufacturer,
        dosage: body.dosage,
        form: body.form,
        batchNumber: body.batchNumber,
        expiryDate: new Date(body.expiryDate),
        stockQuantity: body.stockQuantity,
        reorderLevel: body.reorderLevel,
        unitPrice: body.unitPrice,
        requiresPrescription: body.requiresPrescription ?? false,
        description: body.description || null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CREATE",
        entity: "Medicine",
        entityId: medicine.id,
        details: { name: medicine.name },
      },
    });

    // Check if should generate low stock notification
    if (medicine.stockQuantity <= medicine.reorderLevel) {
      await prisma.notification.create({
        data: {
          title: "Low Stock Alert",
          message: `${medicine.name} was added with stock below reorder level (${medicine.stockQuantity} units).`,
          type: "LOW_STOCK",
          entityId: medicine.id,
        },
      });
    }

    return NextResponse.json({ success: true, data: medicine }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "Batch number already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to create medicine" }, { status: 500 });
  }
}
