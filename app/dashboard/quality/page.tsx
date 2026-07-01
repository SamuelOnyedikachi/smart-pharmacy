import { prisma } from "@/lib/prisma";
import { cn, formatDateTime } from "@/lib/utils";
import { ClipboardCheck, AlertOctagon, ShieldAlert, FileSearch } from "lucide-react";
import { AddQualityButton, QualityActions } from "@/components/crud/DashboardActions";

export const dynamic = "force-dynamic";

async function getQualityChecks() {
  return prisma.qualityCheck.findMany({
    orderBy: { checkedAt: "desc" },
    include: { medicine: { select: { name: true, manufacturer: true } }, inspector: { select: { name: true } } },
  });
}

async function getMedicinesForQuality() {
  return prisma.medicine.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, batchNumber: true, manufacturer: true },
  });
}

const statusBadge: Record<string, string> = {
  PASSED: "badge-green",
  FAILED: "badge-red",
  UNDER_REVIEW: "badge-amber",
};

export default async function QualityPage() {
  const checks = await getQualityChecks();
  const medicines = await getMedicinesForQuality();
  const failed = checks.filter(c => c.status === "FAILED").length;
  const underReview = checks.filter(c => c.status === "UNDER_REVIEW").length;

  const stats = [
    { label: "Checks", value: checks.length, icon: FileSearch, color: "text-teal-700", bg: "bg-teal-50 border-teal-100", sub: "Inspection records" },
    { label: "Under Review", value: underReview, icon: ShieldAlert, color: "text-amber-700", bg: "bg-amber-50 border-amber-100", sub: "Needs QA decision" },
    { label: "Failed", value: failed, icon: AlertOctagon, color: "text-red-700", bg: "bg-red-50 border-red-100", sub: "Quarantine required" },
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quality Assurance</h1>
          <p className="page-subtitle">Batch-level inspection records for counterfeit, damaged, expired, or suspect medicines.</p>
        </div>
        <AddQualityButton medicines={medicines} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between">
                <p className="stat-label">{s.label}</p>
                <div className={`w-9 h-9 border rounded-lg flex items-center justify-center ${s.bg}`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <p className="stat-value">{s.value}</p>
              <p className="stat-sub">{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="section-head">
          <div>
            <p className="section-title">Batch Inspection Log</p>
            <p className="section-sub">Maintained by QA personnel before stock is trusted for dispensing</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{["Medicine","Batch","Status","Inspector","Notes","Checked","Actions"].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {checks.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-16 text-gray-400">No quality checks recorded yet</td></tr>
              ) : checks.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{c.medicine.name}</p>
                        <p className="text-xs text-gray-400">{c.medicine.manufacturer}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td font-mono text-xs text-gray-500">{c.batchNumber}</td>
                  <td className="table-td"><span className={cn("badge", statusBadge[c.status])}>{c.status.replace("_"," ")}</span></td>
                  <td className="table-td text-gray-700">{c.inspector.name}</td>
                  <td className="table-td max-w-md text-gray-500">{c.notes ?? "No notes"}</td>
                  <td className="table-td text-xs text-gray-400">{formatDateTime(c.checkedAt)}</td>
                  <td className="table-td">
                    <QualityActions id={c.id} status={c.status} batchNumber={c.batchNumber} notes={c.notes} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
