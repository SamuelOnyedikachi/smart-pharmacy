import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Mail, Phone, UserCheck, Users, FileText, Wallet } from "lucide-react";
import { AddCustomerButton, CustomerActions } from "@/components/crud/DashboardActions";

export const dynamic = "force-dynamic";

async function getCustomers() {
  return prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      address: true,
      sales: { select: { totalAmount: true } },
      _count: { select: { prescriptions: true, sales: true } },
    },
  });
}

export default async function CustomersPage() {
  const customers = await getCustomers();
  const totalSales = customers.reduce((sum, c) => sum + c.sales.reduce((t, s) => t + Number(s.totalAmount), 0), 0);
  const prescriptions = customers.reduce((sum, c) => sum + c._count.prescriptions, 0);

  const stats = [
    { label: "Registered Customers", value: customers.length, icon: Users, color: "text-teal-700", bg: "bg-teal-50 border-teal-100", sub: "Customer records" },
    { label: "Linked Prescriptions", value: prescriptions, icon: FileText, color: "text-fuchsia-700", bg: "bg-fuchsia-50 border-fuchsia-100", sub: "Prescription references" },
    { label: "Customer Revenue", value: formatCurrency(totalSales), icon: Wallet, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", sub: "Registered customer sales" },
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Walk-in and registered customers, prescription history, and purchase activity.</p>
        </div>
        <AddCustomerButton />
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
            <p className="section-title">Customer Directory</p>
            <p className="section-sub">Useful for repeat dispensing and prescription follow-up</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["Customer","Contact","Address","Sales","Prescriptions","Created","Actions"].map(h => <th key={h} className="table-th">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-16 text-gray-400">No registered customers yet</td></tr>
              ) : customers.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.dateOfBirth ? formatDate(c.dateOfBirth) : "No DOB"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <p className="flex items-center gap-2 text-sm text-gray-700"><Phone className="w-3.5 h-3.5 text-gray-400" />{c.phone ?? "—"}</p>
                    <p className="flex items-center gap-2 text-sm text-gray-400 mt-0.5"><Mail className="w-3.5 h-3.5 text-gray-400" />{c.email ?? "—"}</p>
                  </td>
                  <td className="table-td text-gray-500">{c.address ? `${c.address.city}, ${c.address.state}` : "Not recorded"}</td>
                  <td className="table-td font-semibold text-gray-900">{c._count.sales}</td>
                  <td className="table-td"><span className="badge badge-fuchsia">{c._count.prescriptions}</span></td>
                  <td className="table-td text-xs text-gray-400">{formatDate(c.createdAt)}</td>
                  <td className="table-td">
                    <CustomerActions id={c.id} name={c.name} phone={c.phone} email={c.email} />
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
