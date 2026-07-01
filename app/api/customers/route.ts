// app/api/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: { address: true, _count: { select: { sales: true } } },
  });

  return NextResponse.json({ success: true, data: customers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  try {
    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
      },
    });
    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create customer" }, { status: 500 });
  }
}
