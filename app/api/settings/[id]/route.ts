import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SETTING_STATUS_TONES } from "@/lib/system-settings";

const canManageSettings = (role?: string) => role === "OWNER";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canManageSettings((session.user as any).role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const status = typeof body.status === "string" ? body.status.trim() : undefined;
  const statusTone = typeof body.statusTone === "string" ? body.statusTone.trim() : undefined;

  if (title !== undefined && title.length === 0) {
    return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
  }

  if (description !== undefined && description.length === 0) {
    return NextResponse.json({ success: false, error: "Description is required" }, { status: 400 });
  }

  if (status !== undefined && status.length === 0) {
    return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 });
  }

  if (statusTone !== undefined && !SETTING_STATUS_TONES.includes(statusTone as any)) {
    return NextResponse.json({ success: false, error: "Invalid status tone" }, { status: 400 });
  }

  try {
    const setting = await prisma.systemSetting.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(statusTone !== undefined && { statusTone }),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "UPDATE_SETTING",
        entity: "SystemSetting",
        entityId: setting.id,
        details: { key: setting.key, status: setting.status },
      },
    });

    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Setting not found" }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: "Failed to update setting" }, { status: 500 });
  }
}
