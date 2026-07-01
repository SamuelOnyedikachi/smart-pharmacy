import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const canManage = (role?: string) => ["OWNER", "QA_PERSONNEL", "PHARMACIST"].includes(role ?? "");

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canManage((session.user as any).role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  try {
    const check = await prisma.qualityCheck.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.batchNumber !== undefined && { batchNumber: body.batchNumber }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
    });
    return NextResponse.json({ success: true, data: check });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update quality check" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canManage((session.user as any).role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.qualityCheck.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete quality check" }, { status: 500 });
  }
}
