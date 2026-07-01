import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const canManage = (role?: string) => ["OWNER", "PHARMACIST"].includes(role ?? "");

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canManage((session.user as any).role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  try {
    const interaction = await prisma.drugInteraction.update({
      where: { id },
      data: {
        ...(body.drugAId !== undefined && { drugAId: body.drugAId }),
        ...(body.drugBId !== undefined && { drugBId: body.drugBId }),
        ...(body.severity !== undefined && { severity: body.severity }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.recommendation !== undefined && { recommendation: body.recommendation || null }),
        ...(body.source !== undefined && { source: body.source || null }),
      },
      include: {
        drugA: { select: { name: true, dosage: true } },
        drugB: { select: { name: true, dosage: true } },
      },
    });
    return NextResponse.json({ success: true, data: interaction });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update interaction" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canManage((session.user as any).role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.drugInteraction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete interaction" }, { status: 500 });
  }
}
