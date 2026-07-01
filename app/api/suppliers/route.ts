import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const canManage = (role?: string) => ["OWNER", "STOCK_KEEPER"].includes(role ?? "");

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { address: true, _count: { select: { deliveries: true } } },
  });
  return NextResponse.json({ success: true, data: suppliers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canManage((session.user as any).role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  try {
    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
      },
    });
    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") return NextResponse.json({ success: false, error: "Supplier email already exists" }, { status: 400 });
    return NextResponse.json({ success: false, error: "Failed to create supplier" }, { status: 500 });
  }
}
