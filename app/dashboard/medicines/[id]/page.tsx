import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, daysUntilExpiry, cn } from "@/lib/utils";
import { ArrowLeft, AlertTriangle, Clock, Package, Pill } from "lucide-react";
import { MedicineActions } from "@/components/crud/DashboardActions";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

async function getMedicine(id: string) {
  return prisma.medicine.findUnique({
    where: { id },
    include: {
      interactionsA: { include: { drugB: { select: { name: true } } } },
      interactionsB: { include: { drugA: { select: { name: true } } } },
    },
  });
}

export default async function MedicineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const canManageMedicines = ["OWNER", "STOCK_KEEPER"].includes((session?.user as any)?.role ?? "");
  const { id } = await params;
  const med = await getMedicine(id);
  if (!med) notFound();

  const days = daysUntilExpiry(med.expiryDate);
  const isExpired = days <= 0;
  const isExpiringSoon = days > 0 && days <= 90;
  const isLowStock = med.stockQuantity <= med.reorderLevel;

  const interactions = [
    ...med.interactionsA.map(i => ({ name: i.drugB.name, severity: i.severity })),
    ...med.interactionsB.map(i => ({ name: i.drugA.name, severity: i.severity })),
  ];

  return (
    <div className="max-w-3xl mx-auto pb-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/medicines" className="btn-secondary p-2.5"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title">{med.name}</h1>
          <p className="page-subtitle">{med.genericName ?? "No generic name on record"}</p>
        </div>
        <div className="ml-auto">
          <MedicineActions
            id={med.id}
            stockQuantity={med.stockQuantity}
            reorderLevel={med.reorderLevel}
            canManage={canManageMedicines}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-label">Stock Level</p>
            <div className={cn("w-9 h-9 border rounded-lg flex items-center justify-center", isLowStock ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100")}>
              <Package className={cn("w-4 h-4", isLowStock ? "text-amber-700" : "text-emerald-700")} />
            </div>
          </div>
          <p className="stat-value">{med.stockQuantity} units</p>
          <p className="stat-sub">Reorder at {med.reorderLevel}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-label">Unit Price</p>
            <div className="w-9 h-9 border rounded-lg flex items-center justify-center bg-teal-50 border-teal-100">
              <Pill className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <p className="stat-value">{formatCurrency(Number(med.unitPrice))}</p>
          <p className="stat-sub">{med.dosage} · {med.form}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-label">Expiry</p>
            <div className={cn("w-9 h-9 border rounded-lg flex items-center justify-center", isExpired ? "bg-red-50 border-red-100" : isExpiringSoon ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100")}>
              <Clock className={cn("w-4 h-4", isExpired ? "text-red-700" : isExpiringSoon ? "text-amber-700" : "text-gray-500")} />
            </div>
          </div>
          <p className="stat-value">{formatDate(med.expiryDate)}</p>
          <p className="stat-sub">{isExpired ? "Expired" : `${days} days left`}</p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <p className="text-sm font-bold text-gray-700 pb-1 border-b border-gray-100">Details</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-gray-400 mb-0.5">Category</p><p className="font-medium text-gray-800">{med.category.replace(/_/g," ")}</p></div>
          <div><p className="text-xs text-gray-400 mb-0.5">Manufacturer</p><p className="font-medium text-gray-800">{med.manufacturer}</p></div>
          <div><p className="text-xs text-gray-400 mb-0.5">Batch Number</p><p className="font-mono text-gray-800">{med.batchNumber}</p></div>
          <div><p className="text-xs text-gray-400 mb-0.5">Prescription</p><p className="font-medium text-gray-800">{med.requiresPrescription ? "Required" : "Not required"}</p></div>
        </div>
        {med.description && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-600 leading-relaxed">{med.description}</p>
          </div>
        )}
      </div>

      {interactions.length > 0 && (
        <div className="card p-6 space-y-3">
          <p className="text-sm font-bold text-gray-700 pb-1 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Known Interactions
          </p>
          <div className="space-y-2">
            {interactions.map((i, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{i.name}</span>
                <span className={cn("badge", i.severity === "SEVERE" || i.severity === "CONTRAINDICATED" ? "badge-red" : "badge-amber")}>{i.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
