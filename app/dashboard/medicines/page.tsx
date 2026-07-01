import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, daysUntilExpiry, cn } from "@/lib/utils";
import Link from "next/link";
import { Plus, AlertTriangle, Clock, Search } from "lucide-react";
import { MedicineActions } from "@/components/crud/DashboardActions";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

async function getMedicines(search?: string, category?: string) {
  return prisma.medicine.findMany({
    where: {
      isActive: true,
      ...(search && { OR: [
        { name: { contains: search, mode: "insensitive" } },
        { genericName: { contains: search, mode: "insensitive" } },
        { batchNumber: { contains: search, mode: "insensitive" } },
      ]}),
      ...(category && { category: category as any }),
    },
    orderBy: { name: "asc" },
  });
}

const CATEGORIES = [
  "ANTIBIOTICS","ANALGESICS","ANTIHYPERTENSIVES","ANTIDIABETICS",
  "ANTIHISTAMINES","VITAMINS","ANTIFUNGALS","ANTIVIRALS",
  "CARDIOVASCULAR","GASTROINTESTINAL","RESPIRATORY","OTHER",
];

export default async function MedicinesPage({ searchParams }: { searchParams: Promise<{ search?: string; category?: string }> }) {
  const session = await auth();
  const canManageMedicines = ["OWNER", "STOCK_KEEPER"].includes((session?.user as any)?.role ?? "");
  const params = await searchParams;
  const meds = await getMedicines(params.search, params.category);
  const now = new Date();

  return (
    <div className="space-y-5 pb-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Medicine Inventory</h1>
          <p className="page-subtitle">{meds.length} medicines · sorted by name</p>
        </div>
        {canManageMedicines && (
          <Link href="/dashboard/medicines/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Add Medicine
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="toolbar">
        <form className="flex-1 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input name="search" defaultValue={params.search}
              placeholder="Search name, generic name, batch…"
              className="input pl-9 h-10" />
          </div>
          <select name="category" defaultValue={params.category} className="input h-10 w-48">
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </select>
          <button type="submit" className="btn-primary h-10">Filter</button>
          {(params.search || params.category) && (
            <Link href="/dashboard/medicines" className="btn-secondary h-10">Clear</Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["Medicine","Category","Dosage","Batch #","Stock","Unit Price","Expiry","Actions"].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meds.length === 0 ? (
                <tr><td colSpan={8} className="table-td text-center py-16 text-gray-400">No medicines found</td></tr>
              ) : meds.map((med) => {
                const days = daysUntilExpiry(med.expiryDate);
                const isExpired     = days <= 0;
                const isExpiringSoon= days > 0 && days <= 90;
                const isLowStock    = med.stockQuantity <= med.reorderLevel;

                return (
                  <tr key={med.id} className="table-row">
                    <td className="table-td">
                      <p className="font-semibold text-gray-900">{med.name}</p>
                      {med.genericName && <p className="text-xs text-gray-400 mt-0.5">{med.genericName}</p>}
                      {med.requiresPrescription && <span className="badge badge-purple mt-1">Rx</span>}
                    </td>
                    <td className="table-td">
                      <span className="badge badge-gray">{med.category.replace(/_/g," ")}</span>
                    </td>
                    <td className="table-td text-gray-600">{med.dosage} · {med.form}</td>
                    <td className="table-td font-mono text-xs text-gray-500">{med.batchNumber}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5">
                        {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                        <span className={cn("font-bold text-sm",
                          med.stockQuantity === 0 ? "text-red-600"
                          : isLowStock ? "text-amber-600"
                          : "text-emerald-700")}>
                          {med.stockQuantity}
                        </span>
                        <span className="text-xs text-gray-400">units</span>
                      </div>
                    </td>
                    <td className="table-td font-semibold text-gray-900">{formatCurrency(Number(med.unitPrice))}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5">
                        {(isExpired || isExpiringSoon) && (
                          <Clock className={cn("w-3.5 h-3.5 flex-shrink-0", isExpired ? "text-red-500" : "text-amber-500")} />
                        )}
                        <div>
                          <p className={cn("text-sm font-medium",
                            isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-gray-700")}>
                            {formatDate(med.expiryDate)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {isExpired ? "Expired" : `${days}d left`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <div className="space-y-2">
                        <Link href={`/dashboard/medicines/${med.id}`}
                          className="text-xs font-semibold text-teal-700 hover:text-teal-900">
                          View
                        </Link>
                        <MedicineActions
                          id={med.id}
                          stockQuantity={med.stockQuantity}
                          reorderLevel={med.reorderLevel}
                          canManage={canManageMedicines}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
