import { Role, MedicineCategory, DeliveryStatus, SaleStatus, QualityStatus, InteractionSeverity } from "@prisma/client";

export type { Role, MedicineCategory, DeliveryStatus, SaleStatus, QualityStatus, InteractionSeverity };

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface DashboardStats {
  totalMedicines: number;
  lowStockCount: number;
  expiringSoonCount: number;
  todaySales: number;
  todayRevenue: number;
  pendingDeliveries: number;
  totalCustomers: number;
  monthlyRevenue: number;
}

export interface MedicineWithStatus {
  id: string;
  name: string;
  genericName: string | null;
  category: MedicineCategory;
  manufacturer: string;
  dosage: string;
  form: string;
  batchNumber: string;
  expiryDate: Date;
  stockQuantity: number;
  reorderLevel: number;
  unitPrice: number;
  requiresPrescription: boolean;
  isActive: boolean;
  isLowStock: boolean;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

export interface SaleWithDetails {
  id: string;
  receiptNumber: string;
  totalAmount: number;
  discount: number;
  amountPaid: number;
  change: number;
  status: SaleStatus;
  createdAt: Date;
  cashier: { name: string };
  customer: { name: string } | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    medicine: { name: string; dosage: string };
  }[];
}

export interface CartItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  requiresPrescription: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
