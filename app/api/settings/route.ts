import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.systemSetting.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ success: true, data: settings });
}
