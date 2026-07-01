import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  CASHIER: "Cashier",
  PHARMACIST: "Pharmacist",
  STOCK_KEEPER: "Stock Keeper",
  DRIVER: "Driver",
  QA_PERSONNEL: "QA",
  SECURITY: "Security",
  SUPPLIER: "Supplier",
};

const demoRoleOrder = ["OWNER", "CASHIER", "PHARMACIST", "STOCK_KEEPER", "QA_PERSONNEL", "SECURITY", "DRIVER"];

export async function GET() {
  const [users, interactionCount, prescriptionCount] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      select: { email: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.drugInteraction.count(),
    prisma.prescription.count(),
  ]);

  const activeRoles = new Set(users.map((user) => user.role));
  const demoUsers = demoRoleOrder
    .map((role) => users.find((user) => user.role === role))
    .filter(Boolean)
    .slice(0, 3)
    .map((user) => ({
      role: roleLabels[user!.role] ?? user!.role.replace(/_/g, " "),
      email: user!.email,
    }));

  return NextResponse.json({
    success: true,
    data: {
      stats: [
        { stat: `${activeRoles.size}`, label: "Active staff roles" },
        { stat: `${interactionCount}`, label: "Drug interactions tracked" },
        { stat: `${prescriptionCount}`, label: "Prescriptions recorded" },
      ],
      demoUsers,
    },
  });
}
