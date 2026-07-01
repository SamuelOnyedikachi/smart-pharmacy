import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const canManage = (role?: string) => ["OWNER", "QA_PERSONNEL", "PHARMACIST"].includes(role ?? "");

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const checks = await prisma.qualityCheck.findMany({
    orderBy: { checkedAt: "desc" },
    include: { medicine: true, inspector: { select: { name: true } } },
  });
  return NextResponse.json({ success: true, data: checks });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canManage((session.user as any).role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  try {
    const check = await prisma.qualityCheck.create({
      data: {
        medicineId: body.medicineId,
        inspectorId: (session.user as any).id,
        status: body.status,
        batchNumber: body.batchNumber,
        notes: body.notes || null,
      },
    });
    if (check.status !== "PASSED") {
      await prisma.notification.create({
        data: {
          title: "Quality Check Attention",
          message: `Batch ${check.batchNumber} was marked ${check.status.replace("_", " ")}.`,
          type: "QUALITY",
          entityId: check.id,
        },
      });
    }
    return NextResponse.json({ success: true, data: check }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create quality check" }, { status: 500 });
  }
}
