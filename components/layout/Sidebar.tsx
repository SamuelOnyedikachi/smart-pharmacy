"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn, getRoleBadgeColor } from "@/lib/utils";
import { Role } from "@/types";
import {
  LayoutDashboard, ShoppingCart, Truck, Users, UserCheck,
  AlertTriangle, ClipboardCheck, LogOut, ShieldPlus, Settings,
  Boxes, FileText, Package,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: "Dashboard",       href: "/dashboard",                icon: LayoutDashboard, roles: ["OWNER","STOCK_KEEPER","CASHIER","PHARMACIST","QA_PERSONNEL","SECURITY","DRIVER"] },
  { label: "Medicine Inventory", href: "/dashboard/medicines",   icon: Boxes,           roles: ["OWNER","STOCK_KEEPER","PHARMACIST","QA_PERSONNEL"] },
  { label: "Point of Sale",   href: "/dashboard/sales",          icon: ShoppingCart,    roles: ["OWNER","CASHIER","PHARMACIST"] },
  { label: "Customers",       href: "/dashboard/customers",      icon: UserCheck,       roles: ["OWNER","CASHIER","PHARMACIST"] },
  { label: "Suppliers",       href: "/dashboard/suppliers",      icon: Truck,           roles: ["OWNER","STOCK_KEEPER"] },
  { label: "Deliveries",      href: "/dashboard/deliveries",     icon: Package,         roles: ["OWNER","STOCK_KEEPER","DRIVER"] },
  { label: "Drug Safety",     href: "/dashboard/interactions",   icon: AlertTriangle,   roles: ["OWNER","PHARMACIST"] },
  { label: "Quality Assurance", href: "/dashboard/quality",      icon: ClipboardCheck,  roles: ["OWNER","QA_PERSONNEL"] },
  { label: "Staff Accounts",  href: "/dashboard/users",          icon: Users,           roles: ["OWNER"] },
  { label: "Security Logs",   href: "/dashboard/logs",           icon: FileText,        roles: ["OWNER","SECURITY"] },
  { label: "Settings",        href: "/dashboard/settings",       icon: Settings,        roles: ["OWNER"] },
];

const roleInitial = (role: string) => role.split("_").map(w => w[0]).join("").substring(0, 2);

export default function Sidebar({ role, userName }: { role: Role; userName: string }) {
  const pathname = usePathname();
  const filteredNav = navItems.filter((i) => i.roles.includes(role));
  const mobileNav  = filteredNav.slice(0, 5);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-64 bg-gray-900 flex-col h-full flex-shrink-0">

        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/30">
            <ShieldPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">SmartPharm</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Pharmacy Management</p>
          </div>
        </div>

        {/* User pill */}
        <div className="mx-3 mt-4 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-3">
          <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{userName.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">{userName}</p>
            <span className={cn("badge mt-1 text-[10px]", getRoleBadgeColor(role))}>
              {role.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Menu</p>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 select-none",
                  isActive
                    ? "bg-teal-600 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150">
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-gray-900 border-t border-white/10 px-2 py-1.5">
        <div className="flex gap-1 overflow-x-auto">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "min-w-16 flex-1 flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-semibold transition-colors",
                  isActive ? "bg-teal-600 text-white" : "text-gray-400 hover:text-white"
                )}>
                <Icon className="w-4 h-4" />
                <span className="truncate">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
