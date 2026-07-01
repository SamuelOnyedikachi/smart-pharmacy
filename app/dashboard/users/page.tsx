"use client";

import { useState, useEffect } from "react";
import { Plus, X, Users } from "lucide-react";
import { getRoleBadgeColor, formatDate, cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface User { id: string; name: string; email: string; role: string; phone: string | null; isActive: boolean; createdAt: string; }

const roles = ["OWNER","STOCK_KEEPER","CASHIER","PHARMACIST","DRIVER","QA_PERSONNEL","SECURITY"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "CASHIER", phone: "" });
  const [loading, setLoading] = useState(false);

  const loadUsers = () => fetch("/api/users").then(r => r.json()).then(d => { if (d.success) setUsers(d.data); });
  useEffect(() => { loadUsers(); }, []);

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) return toast.error("Fill in all required fields");
    setLoading(true);
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) {
        toast.success("Staff account created");
        setUsers(prev => [...prev, data.data]);
        setShowForm(false);
        setForm({ name: "", email: "", password: "", role: "CASHIER", phone: "" });
      } else toast.error(data.error ?? "Failed");
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  const toggleActive = async (userId: string, current: boolean) => {
    const res = await fetch(`/api/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !current }) });
    const data = await res.json();
    if (data.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !current } : u));
      toast.success(current ? "Account deactivated" : "Account activated");
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Accounts</h1>
          <p className="page-subtitle">{users.length} accounts · manage roles and access</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{["Name","Email","Role","Phone","Status","Joined",""].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-16">
                  <div className="empty-state"><Users className="w-8 h-8 text-gray-300 mb-2" /><p className="text-gray-400">No staff accounts yet</p></div>
                </td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="table-row">
                  <td className="table-td font-semibold text-gray-900">{u.name}</td>
                  <td className="table-td text-gray-500">{u.email}</td>
                  <td className="table-td"><span className={cn("badge", getRoleBadgeColor(u.role))}>{u.role.replace("_"," ")}</span></td>
                  <td className="table-td text-gray-500">{u.phone ?? "—"}</td>
                  <td className="table-td"><span className={u.isActive ? "badge badge-green" : "badge badge-gray"}>{u.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="table-td text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                  <td className="table-td">
                    <button onClick={() => toggleActive(u.id, u.isActive)}
                      className={cn("text-xs font-semibold", u.isActive ? "text-red-600 hover:text-red-800" : "text-emerald-600 hover:text-emerald-800")}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Add Staff Account</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Staff full name" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" placeholder="staff@pharmacy.com" />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input" placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="label">Role *</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input">
                  {roles.map(r => <option key={r} value={r}>{r.replace("_"," ")}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+234-800-000-0000" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={createUser} disabled={loading} className="btn-primary flex-1">
                  {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />}
                  {loading ? "Creating…" : "Create Account"}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
