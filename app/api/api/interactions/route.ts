import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const drugAId = searchParams.get("drugA");
  const drugBId = searchParams.get("drugB");

  // Check specific pair
  if (drugAId && drugBId) {
    const interaction = await prisma.drugInteraction.findFirst({
      where: {
        OR: [
          { drugAId, drugBId },
          { drugAId: drugBId, drugBId: drugAId },
        ],
      },
      include: {
        drugA: { select: { name: true, dosage: true } },
        drugB: { select: { name: true, dosage: true } },
      },
    });
    return NextResponse.json({ success: true, data: interaction });
  }

  // Get all interactions
  const interactions = await prisma.drugInteraction.findMany({
    include: {
      drugA: { select: { name: true, dosage: true } },
      drugB: { select: { name: true, dosage: true } },
    },
    orderBy: { severity: "desc" },
  });

  return NextResponse.json({ success: true, data: interactions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["OWNER", "PHARMACIST"].includes(role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  try {
    const interaction = await prisma.drugInteraction.create({
      data: {
        drugAId: body.drugAId,
        drugBId: body.drugBId,
        severity: body.severity,
        description: body.description,
        recommendation: body.recommendation || null,
        source: body.source || null,
      },
      include: {
        drugA: { select: { name: true } },
        drugB: { select: { name: true } },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        title: "Drug Interaction Recorded",
        message: `${interaction.severity} interaction recorded between ${interaction.drugA.name} and ${interaction.drugB.name}.`,
        type: "INTERACTION",
        entityId: interaction.id,
      },
    });

    return NextResponse.json({ success: true, data: interaction }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "Interaction between these drugs already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to record interaction" }, { status: 500 });
  }
}
