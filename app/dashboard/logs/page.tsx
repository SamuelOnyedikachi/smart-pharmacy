import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { FileText, ShieldCheck, Activity, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

async function getLogs() {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, role: true } } },
  });
}

export default async function LogsPage() {
  const logs = await getLogs();

  const stats = [
    { label: "Recorded Events", value: logs.length, icon: Activity, color: "text-teal-700", bg: "bg-teal-50 border-teal-100", sub: "Most recent 100 actions" },
    { label: "Audit Coverage", value: "Role-Based", icon: ShieldCheck, color: "text-blue-700", bg: "bg-blue-50 border-blue-100", sub: "Owner & security visibility" },
    { label: "Privacy Layer", value: "Enabled", icon: Lock, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", sub: "No patient data in summaries" },
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Security Logs</h1>
          <p className="page-subtitle">Audit trail for sensitive actions across users, sales, inventory, and safety modules.</p>
        </div>
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
            <p className="section-title">Activity Trail</p>
            <p className="section-sub">Designed for accountability in a standalone pharmacy</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{["User","Action","Entity","IP Address","Time"].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="table-td text-center py-16">
                  <div className="empty-state">
                    <ShieldCheck className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-gray-400">No activity logs recorded yet</p>
                  </div>
                </td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="table-row">
                  <td className="table-td">
                    <p className="font-semibold text-gray-900">{log.user.name}</p>
                    <p className="text-xs text-gray-400">{log.user.role.replace("_"," ")}</p>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-800">{log.action}</span>
                    </div>
                  </td>
                  <td className="table-td text-gray-600">{log.entity}</td>
                  <td className="table-td font-mono text-xs text-gray-400">{log.ipAddress ?? "Not captured"}</td>
                  <td className="table-td text-xs text-gray-400">{formatDateTime(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
