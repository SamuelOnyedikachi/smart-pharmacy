import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pill, ShoppingCart, AlertTriangle, TrendingUp, Users, Truck, Clock, CheckCircle2 } from "lucide-react";
import RevenueChart from "@/components/dashboard/RevenueChart";
import { startOfDay, endOfDay, subDays, startOfMonth } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const monthStart = startOfMonth(now);

  const [totalMedicines, lowStockMeds, expiringMeds, expiredMeds, todaySales, monthlySales,
         pendingDeliveries, totalCustomers, recentSales, revenueByDay, lowStockList] = await Promise.all([
    prisma.medicine.count({ where: { isActive: true } }),
    prisma.medicine.count({ where: { isActive: true, stockQuantity: { lte: prisma.medicine.fields.reorderLevel } } }),
    prisma.medicine.count({ where: { isActive: true, expiryDate: { gte: now, lte: in90Days } } }),
    prisma.medicine.count({ where: { isActive: true, expiryDate: { lt: now } } }),
    prisma.sale.aggregate({ where: { createdAt: { gte: startOfDay(now), lte: endOfDay(now) } }, _count: true, _sum: { totalAmount: true } }),
    prisma.sale.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { totalAmount: true } }),
    prisma.delivery.count({ where: { status: "PENDING" } }),
    prisma.customer.count(),
    prisma.sale.findMany({ take: 6, orderBy: { createdAt: "desc" }, include: { cashier: { select: { name: true } }, customer: { select: { name: true } }, items: true } }),
    Promise.all(Array.from({ length: 7 }, (_, i) => {
      const day = subDays(now, 6 - i);
      return prisma.sale.aggregate({
        where: { createdAt: { gte: startOfDay(day), lte: endOfDay(day) }, status: "COMPLETED" },
        _sum: { totalAmount: true },
      }).then(r => ({ date: formatDate(day), revenue: Number(r._sum.totalAmount ?? 0) }));
    })),
    prisma.medicine.findMany({ where: { isActive: true, stockQuantity: { lte: 20 } }, orderBy: { stockQuantity: "asc" }, take: 6, select: { id: true, name: true, stockQuantity: true, reorderLevel: true, expiryDate: true } }),
  ]);

  return {
    stats: {
      totalMedicines, lowStockCount: lowStockMeds, expiringSoonCount: expiringMeds,
      expiredCount: expiredMeds, todaySalesCount: todaySales._count,
      todayRevenue: Number(todaySales._sum.totalAmount ?? 0),
      monthlyRevenue: Number(monthlySales._sum.totalAmount ?? 0),
      pendingDeliveries, totalCustomers,
    },
    recentSales, lowStockList, revenueByDay,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const { stats, recentSales, lowStockList, revenueByDay } = await getDashboardData();

  const statCards = [
    { label: "Today's Revenue",    value: formatCurrency(stats.todayRevenue),       icon: TrendingUp,    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", sub: `${stats.todaySalesCount} sales today` },
    { label: "Monthly Revenue",    value: formatCurrency(stats.monthlyRevenue),      icon: ShoppingCart,  color: "text-blue-700",    bg: "bg-blue-50 border-blue-100",     sub: "This month" },
    { label: "Total Medicines",    value: stats.totalMedicines,                      icon: Pill,          color: "text-teal-700",    bg: "bg-teal-50 border-teal-100",     sub: `${stats.expiredCount} expired` },
    { label: "Low Stock Items",    value: stats.lowStockCount,                       icon: AlertTriangle, color: "text-amber-700",   bg: "bg-amber-50 border-amber-100",   sub: "Below reorder level" },
    { label: "Total Customers",    value: stats.totalCustomers,                      icon: Users,         color: "text-violet-700",  bg: "bg-violet-50 border-violet-100", sub: "Registered" },
    { label: "Pending Deliveries", value: stats.pendingDeliveries,                   icon: Truck,         color: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-100", sub: "Awaiting arrival" },
    { label: "Expiring Soon",      value: stats.expiringSoonCount,                   icon: Clock,         color: "text-rose-700",    bg: "bg-rose-50 border-rose-100",     sub: "Within 90 days" },
    { label: "Usable Medicines",   value: stats.totalMedicines - stats.expiredCount, icon: CheckCircle2,  color: "text-teal-700",    bg: "bg-teal-50 border-teal-100",     sub: "In good standing" },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="page-subtitle">Inventory health, sales, and medicine safety at a glance.</p>
        </div>
        {/* Quick alerts strip */}
        <div className="flex gap-2">
          {stats.expiredCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {stats.expiredCount} expired
            </div>
          )}
          {stats.lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {stats.lowStockCount} low stock
            </div>
          )}
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card group">
              <div className="flex items-center justify-between">
                <p className="stat-label">{card.label}</p>
                <div className={`w-9 h-9 border rounded-lg flex items-center justify-center ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="stat-value">{card.value}</p>
              <p className="stat-sub">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2">
          <div className="section-head">
            <div>
              <p className="section-title">Revenue Trend</p>
              <p className="section-sub">Completed sales · last 7 days</p>
            </div>
          </div>
          <div className="p-5 pt-2">
            <RevenueChart data={revenueByDay} />
          </div>
        </div>

        <div className="card">
          <div className="section-head">
            <div>
              <p className="section-title">Stock Risk Queue</p>
              <p className="section-sub">Items needing reorder</p>
            </div>
            <Link href="/dashboard/medicines" className="text-xs font-semibold text-teal-700 hover:text-teal-900">View all</Link>
          </div>
          <div className="p-4 space-y-1">
            {lowStockList.length === 0 ? (
              <div className="empty-state py-8">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All medicines well stocked</p>
              </div>
            ) : lowStockList.map((med) => (
              <div key={med.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{med.name}</p>
                  <p className="text-xs text-gray-400">Exp {formatDate(med.expiryDate)}</p>
                </div>
                <span className={`badge ml-3 flex-shrink-0 ${med.stockQuantity === 0 ? "badge-red" : "badge-amber"}`}>
                  {med.stockQuantity} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent sales */}
      <div className="card">
        <div className="section-head">
          <div>
            <p className="section-title">Recent Sales</p>
            <p className="section-sub">Latest receipts from cashiers and pharmacists</p>
          </div>
          <Link href="/dashboard/sales" className="text-xs font-semibold text-teal-700 hover:text-teal-900">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["Receipt", "Customer", "Cashier", "Items", "Total", "Date"].map(h => (
                  <th key={h} className="table-th first:rounded-none last:rounded-none">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-10">No sales recorded yet</td></tr>
              ) : recentSales.map((sale) => (
                <tr key={sale.id} className="table-row">
                  <td className="table-td font-mono text-xs text-teal-700">{sale.receiptNumber.substring(0, 14)}…</td>
                  <td className="table-td">{sale.customer?.name ?? <span className="text-gray-400">Walk-in</span>}</td>
                  <td className="table-td text-gray-500">{sale.cashier.name}</td>
                  <td className="table-td"><span className="badge badge-gray">{sale.items.length}</span></td>
                  <td className="table-td font-semibold text-gray-900">{formatCurrency(Number(sale.totalAmount))}</td>
                  <td className="table-td text-gray-400 text-xs">{formatDate(sale.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
