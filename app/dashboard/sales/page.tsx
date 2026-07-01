"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Search, Plus, Minus, Trash2, ShoppingCart, Receipt, CheckCircle } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { CartItem } from "@/types";

interface Medicine { id: string; name: string; dosage: string; form: string; unitPrice: number; stockQuantity: number; requiresPrescription: boolean; }
interface Customer  { id: string; name: string; phone: string | null; }

export default function SalesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch]   = useState("");
  const [cart, setCart]       = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  useEffect(() => {
    fetch("/api/medicines?active=true").then(r => r.json()).then(d => { if (d.success) setMedicines(d.data); });
    fetch("/api/customers").then(r => r.json()).then(d => { if (d.success) setCustomers(d.data); });
  }, []);

  const filtered = medicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) && m.stockQuantity > 0);

  const addToCart = (med: Medicine) => {
    setCart(prev => {
      const existing = prev.find(i => i.medicineId === med.id);
      if (existing) {
        if (existing.quantity >= med.stockQuantity) { toast.error("Not enough stock"); return prev; }
        return prev.map(i => i.medicineId === med.id ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice } : i);
      }
      return [...prev, { medicineId: med.id, medicineName: med.name, dosage: med.dosage, unitPrice: med.unitPrice, quantity: 1, subtotal: med.unitPrice, requiresPrescription: med.requiresPrescription }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.medicineId === id
      ? { ...i, quantity: Math.max(0, i.quantity + delta), subtotal: Math.max(0, i.quantity + delta) * i.unitPrice }
      : i).filter(i => i.quantity > 0));
  };

  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const total    = subtotal - discount;
  const change   = parseFloat(amountPaid || "0") - total;
  const hasPrescription = cart.some(i => i.requiresPrescription);

  const processSale = async () => {
    if (!cart.length) return toast.error("Cart is empty");
    if (parseFloat(amountPaid || "0") < total) return toast.error("Insufficient amount paid");
    setLoading(true);
    try {
      const res = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customerId || null, items: cart.map(i => ({ medicineId: i.medicineId, quantity: i.quantity, unitPrice: i.unitPrice, subtotal: i.subtotal })),
          totalAmount: total, discount, amountPaid: parseFloat(amountPaid), change: Math.max(0, change) }) });
      const result = await res.json();
      if (result.success) {
        toast.success("Sale completed!");
        setLastReceipt(result.data);
        setCart([]); setAmountPaid(""); setDiscount(0); setCustomerId("");
        fetch("/api/medicines?active=true").then(r => r.json()).then(d => { if (d.success) setMedicines(d.data); });
      } else toast.error(result.error ?? "Failed");
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div>
        <h1 className="page-title">Point of Sale</h1>
        <p className="page-subtitle">Process sales and generate receipts</p>
      </div>

      {lastReceipt && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl fade-in">
          <div className="flex items-center gap-2.5 text-emerald-800">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Sale #{lastReceipt.receiptNumber?.substring(0, 14)}… — {formatCurrency(Number(lastReceipt.totalAmount))}</span>
          </div>
          <button onClick={() => setLastReceipt(null)} className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Medicine browser */}
        <div className="lg:col-span-2 space-y-3">
          <div className="toolbar">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search medicines in stock…" className="input pl-9 h-10" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filtered.map(med => (
              <button key={med.id} onClick={() => addToCart(med)}
                className="card p-3.5 text-left hover:border-teal-300 hover:shadow-md active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <p className="font-semibold text-gray-900 text-sm leading-tight">{med.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{med.dosage} · {med.form}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-teal-700 font-bold text-sm">{formatCurrency(med.unitPrice)}</span>
                  <span className={cn("text-xs font-medium", med.stockQuantity <= 10 ? "text-amber-600" : "text-gray-400")}>
                    {med.stockQuantity} left
                  </span>
                </div>
                {med.requiresPrescription && <span className="badge badge-purple mt-1.5">Rx</span>}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 py-16 text-center text-gray-400 text-sm">
                No medicines found in stock
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="card flex flex-col">
          <div className="section-head">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-gray-600" />
              <p className="section-title">Cart</p>
            </div>
            {cart.length > 0 && (
              <span className="badge badge-teal">{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-64">
            {cart.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400">Add medicines to cart</p>
            ) : cart.map(item => (
              <div key={item.medicineId} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.medicineName}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(item.unitPrice)} each</p>
                  </div>
                  <button onClick={() => setCart(prev => prev.filter(i => i.medicineId !== item.medicineId))}
                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.medicineId, -1)}
                      className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                      <Minus className="w-3 h-3 text-gray-600" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                    <button onClick={() => updateQty(item.medicineId, 1)}
                      className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 p-4 space-y-3">
            <div>
              <label className="label">Customer</label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="input h-9">
                <option value="">Walk-in customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span className="font-medium text-gray-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>Discount (₦)</span>
                <input type="number" min="0" max={subtotal} value={discount}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-right text-sm focus:outline-none focus:border-teal-500" />
              </div>
              <div className="flex justify-between font-bold text-base text-gray-900 pt-1.5 border-t border-gray-100">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div>
              <label className="label">Amount Paid (₦)</label>
              <input type="number" min={total} step="0.01" value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                className="input" placeholder="0.00" />
            </div>

            {amountPaid && parseFloat(amountPaid) >= total && (
              <div className="flex justify-between text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                <span>Change</span><span>{formatCurrency(Math.max(0, change))}</span>
              </div>
            )}

            {hasPrescription && (
              <p className="text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                ⚠️ Cart contains prescription medicines. Verify before dispensing.
              </p>
            )}

            <button onClick={processSale} disabled={loading || !cart.length} className="btn-primary w-full">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />Processing…</>
                : <><Receipt className="w-4 h-4" />Complete Sale</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
