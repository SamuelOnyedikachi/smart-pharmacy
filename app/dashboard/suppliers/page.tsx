import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Building2, Mail, Phone, Boxes, Truck, CheckCircle2 } from "lucide-react";
import { AddSupplierButton, SupplierActions } from "@/components/crud/DashboardActions";

export const dynamic = "force-dynamic";

async function getSuppliers() {
  return prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { address: true, _count: { select: { deliveries: true } } },
  });
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();
  const active = suppliers.filter(s => s.isActive).length;
  const totalDeliveries = suppliers.reduce((sum, s) => sum + s._count.deliveries, 0);

  const stats = [
    { label: "Suppliers", value: suppliers.length, icon: Boxes, color: "text-teal-700", bg: "bg-teal-50 border-teal-100", sub: "Total supply partners" },
    { label: "Active", value: active, icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", sub: "Available for procurement" },
    { label: "Deliveries", value: totalDeliveries, icon: Truck, color: "text-blue-700", bg: "bg-blue-50 border-blue-100", sub: "Linked stock movements" },
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Manage medicine supply partners, contact persons, and delivery relationships.</p>
        </div>
        <AddSupplierButton />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {suppliers.length === 0 && (
          <div className="card empty-state lg:col-span-2">
            <p className="text-gray-400">No suppliers added yet</p>
          </div>
        )}
        {suppliers.map(s => (
          <div key={s.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{s.name}</h2>
                  <p className="text-sm text-gray-500">{s.contactName}</p>
                </div>
              </div>
              <span className={s.isActive ? "badge badge-green" : "badge badge-gray"}>
                {s.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
              <p className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" />{s.phone}</p>
              <p className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-400" />{s.email}</p>
            </div>
            <div className="mt-4 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Address</p>
              <p className="text-sm text-gray-700 mt-1">
                {s.address ? `${s.address.street}, ${s.address.city}, ${s.address.state}` : "No address recorded"}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>{s._count.deliveries} deliveries</span>
              <span>Added {formatDate(s.createdAt)}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <SupplierActions id={s.id} name={s.name} contactName={s.contactName} email={s.email} phone={s.phone} isActive={s.isActive} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
