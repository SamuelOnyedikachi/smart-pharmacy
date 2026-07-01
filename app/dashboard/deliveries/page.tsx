import { prisma } from "@/lib/prisma";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { CalendarClock, PackageCheck, Truck, Clock, Wallet } from "lucide-react";
import { DeliveryActions } from "@/components/crud/DashboardActions";

export const dynamic = "force-dynamic";

async function getDeliveries() {
  return prisma.delivery.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      supplier: true,
      driver: { select: { name: true, phone: true } },
      items: { include: { medicine: { select: { name: true, dosage: true } } } },
    },
  });
}

const statusBadge: Record<string, string> = {
  PENDING: "badge-amber",
  IN_TRANSIT: "badge-blue",
  DELIVERED: "badge-green",
  CANCELLED: "badge-red",
};

export default async function DeliveriesPage() {
  const deliveries = await getDeliveries();
  const pending = deliveries.filter(d => d.status === "PENDING").length;
  const inTransit = deliveries.filter(d => d.status === "IN_TRANSIT").length;
  const totalValue = deliveries.reduce((sum, d) => sum + d.items.reduce((t, i) => t + Number(i.unitCost) * i.quantity, 0), 0);

  const stats = [
    { label: "Pending", value: pending, icon: Clock, color: "text-amber-700", bg: "bg-amber-50 border-amber-100", sub: "Awaiting dispatch or receipt" },
    { label: "In Transit", value: inTransit, icon: Truck, color: "text-blue-700", bg: "bg-blue-50 border-blue-100", sub: "Driver assigned" },
    { label: "Delivery Value", value: formatCurrency(totalValue), icon: Wallet, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", sub: "Incoming stock cost" },
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Deliveries</h1>
          <p className="page-subtitle">Track incoming stock, drivers, supplier commitments, and delivery value.</p>
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
            <p className="section-title">Delivery Ledger</p>
            <p className="section-sub">Supplier stock movements for inventory reconciliation</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["Supplier","Status","Driver","Items","Expected","Value","Actions"].map(h => <th key={h} className="table-th">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-16 text-gray-400">No deliveries recorded</td></tr>
              ) : deliveries.map(d => {
                const value = d.items.reduce((t, i) => t + Number(i.unitCost) * i.quantity, 0);
                return (
                  <tr key={d.id} className="table-row">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{d.supplier.name}</p>
                          <p className="text-xs text-gray-400">{d.supplier.contactName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={cn("badge", statusBadge[d.status])}>{d.status.replace("_"," ")}</span>
                    </td>
                    <td className="table-td">
                      {d.driver ? (
                        <div>
                          <p className="font-medium text-gray-800">{d.driver.name}</p>
                          <p className="text-xs text-gray-400">{d.driver.phone ?? "No phone"}</p>
                        </div>
                      ) : <span className="text-gray-400">Not assigned</span>}
                    </td>
                    <td className="table-td">
                      <div className="space-y-1">
                        {d.items.map(i => (
                          <p key={i.id} className="text-sm text-gray-700">
                            {i.medicine.name} <span className="text-gray-400">{i.medicine.dosage} × {i.quantity}</span>
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="table-td">
                      <p className="flex items-center gap-2 text-gray-700"><CalendarClock className="w-4 h-4 text-gray-400" />{formatDate(d.expectedDate)}</p>
                      {d.deliveredAt && (
                        <p className="flex items-center gap-2 text-xs text-emerald-700 mt-1"><PackageCheck className="w-3.5 h-3.5" />{formatDate(d.deliveredAt)}</p>
                      )}
                    </td>
                    <td className="table-td font-bold text-gray-900">{formatCurrency(value)}</td>
                    <td className="table-td">
                      <DeliveryActions id={d.id} status={d.status} />
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
