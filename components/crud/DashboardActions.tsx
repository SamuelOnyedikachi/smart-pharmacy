"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Edit3, Plus, RotateCcw, Save, Trash2, X, XCircle } from "lucide-react";

async function requestJson(url: string, init: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.error ?? "Request failed");
  return data;
}

function ActionButton({
  children,
  className = "btn-secondary",
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${className} px-3 py-1.5 text-xs`}>
      {children}
    </button>
  );
}

function useRefreshAction() {
  const router = useRouter();
  return async (fn: () => Promise<void>, success: string) => {
    try {
      await fn();
      toast.success(success);
      router.refresh();
      return true;
    } catch (error: any) {
      toast.error(error.message ?? "Action failed");
      return false;
    }
  };
}

function CrudModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function MedicineActions({
  id,
  stockQuantity,
  reorderLevel,
  canManage = true,
}: {
  id: string;
  stockQuantity: number;
  reorderLevel: number;
  canManage?: boolean;
}) {
  const run = useRefreshAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    stockQuantity: String(stockQuantity),
    reorderLevel: String(reorderLevel),
  });
  const [loading, setLoading] = useState(false);

  const updateStock = async () => {
    const nextStock = Number(form.stockQuantity);
    const nextReorder = Number(form.reorderLevel);

    if (!Number.isInteger(nextStock) || nextStock < 0) {
      return toast.error("Stock quantity must be a whole number of 0 or more");
    }
    if (!Number.isInteger(nextReorder) || nextReorder < 1) {
      return toast.error("Reorder level must be a whole number of 1 or more");
    }

    setLoading(true);
    const ok = await run(
      () => requestJson(`/api/medicines/${id}`, { method: "PATCH", body: JSON.stringify({ stockQuantity: nextStock, reorderLevel: nextReorder }) }).then(() => undefined),
      "Medicine stock updated"
    );
    setLoading(false);
    if (!ok) return;
    setOpen(false);
  };

  const deactivate = () => {
    if (!window.confirm("Deactivate this medicine? It will no longer appear in active inventory.")) return;
    run(() => requestJson(`/api/medicines/${id}`, { method: "DELETE" }).then(() => undefined), "Medicine deactivated");
  };

  return (
    <div className="flex flex-wrap gap-2">
      {canManage ? (
        <>
          <ActionButton onClick={() => setOpen(true)}><Edit3 className="w-3.5 h-3.5" /> Stock</ActionButton>
          <ActionButton className="btn-danger" onClick={deactivate}><Trash2 className="w-3.5 h-3.5" /> Deactivate</ActionButton>
        </>
      ) : (
        <span className="badge badge-gray">View only</span>
      )}
      {open && (
        <CrudModal title="Edit Medicine Stock" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Stock Quantity *">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stockQuantity}
                  onChange={e => setForm({ ...form, stockQuantity: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Reorder Level *">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.reorderLevel}
                  onChange={e => setForm({ ...form, reorderLevel: e.target.value })}
                  className="input"
                />
              </Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={updateStock} disabled={loading} className="btn-primary flex-1">
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />}
                {loading ? "Saving..." : "Save Stock"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </CrudModal>
      )}
    </div>
  );
}

export function CustomerActions({ id, name, phone, email }: { id: string; name: string; phone: string | null; email: string | null }) {
  const run = useRefreshAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name, phone: phone ?? "", email: email ?? "" });
  const [loading, setLoading] = useState(false);

  const edit = async () => {
    if (!form.name.trim()) return toast.error("Customer name is required");
    setLoading(true);
    const ok = await run(
      () => requestJson(`/api/customers/${id}`, { method: "PATCH", body: JSON.stringify(form) }).then(() => undefined),
      "Customer updated"
    );
    setLoading(false);
    if (!ok) return;
    setOpen(false);
  };

  const remove = () => {
    if (!window.confirm("Delete this customer? Customers with linked sales are protected.")) return;
    run(() => requestJson(`/api/customers/${id}`, { method: "DELETE" }).then(() => undefined), "Customer deleted");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton onClick={() => setOpen(true)}><Edit3 className="w-3.5 h-3.5" /> Edit</ActionButton>
      <ActionButton className="btn-danger" onClick={remove}><Trash2 className="w-3.5 h-3.5" /> Delete</ActionButton>
      {open && (
        <CrudModal title="Edit Customer" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Field label="Customer Name *">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone">
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
              </Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={edit} disabled={loading} className="btn-primary flex-1">
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />}
                {loading ? "Saving..." : "Save Customer"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </CrudModal>
      )}
    </div>
  );
}

export function SupplierActions({ id, name, contactName, email, phone, isActive }: { id: string; name: string; contactName: string; email: string; phone: string; isActive: boolean }) {
  const run = useRefreshAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name, contactName, email, phone });
  const [loading, setLoading] = useState(false);

  const edit = async () => {
    if (!form.name.trim() || !form.contactName.trim() || !form.email.trim() || !form.phone.trim()) {
      return toast.error("Fill in all required supplier fields");
    }
    setLoading(true);
    const ok = await run(
      () => requestJson(`/api/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(form) }).then(() => undefined),
      "Supplier updated"
    );
    setLoading(false);
    if (!ok) return;
    setOpen(false);
  };

  const toggle = () => run(
    () => requestJson(`/api/suppliers/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !isActive }) }).then(() => undefined),
    isActive ? "Supplier deactivated" : "Supplier activated"
  );

  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton onClick={() => setOpen(true)}><Edit3 className="w-3.5 h-3.5" /> Edit</ActionButton>
      <ActionButton className={isActive ? "btn-danger" : "btn-primary"} onClick={toggle}>
        {isActive ? <XCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />} {isActive ? "Deactivate" : "Activate"}
      </ActionButton>
      {open && (
        <CrudModal title="Edit Supplier" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Field label="Supplier Name *">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
            </Field>
            <Field label="Contact Person *">
              <input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="input" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email *">
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
              </Field>
              <Field label="Phone *">
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
              </Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={edit} disabled={loading} className="btn-primary flex-1">
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />}
                {loading ? "Saving..." : "Save Supplier"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </CrudModal>
      )}
    </div>
  );
}

export function DeliveryActions({ id, status }: { id: string; status: string }) {
  const run = useRefreshAction();

  const updateStatus = (nextStatus: string) => {
    run(
      () => requestJson(`/api/deliveries/${id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) }).then(() => undefined),
      nextStatus === "DELIVERED" ? "Delivery received and stock updated" : "Delivery status updated"
    );
  };

  const remove = () => {
    if (!window.confirm("Delete this delivery? Delivered stock movements are protected.")) return;
    run(() => requestJson(`/api/deliveries/${id}`, { method: "DELETE" }).then(() => undefined), "Delivery deleted");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <select value={status} onChange={(event) => updateStatus(event.target.value)} className="input h-8 w-36 py-1 text-xs">
        <option value="PENDING">Pending</option>
        <option value="IN_TRANSIT">In transit</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <ActionButton className="btn-danger" onClick={remove}><Trash2 className="w-3.5 h-3.5" /> Delete</ActionButton>
    </div>
  );
}

export function QualityActions({ id, status, batchNumber, notes }: { id: string; status: string; batchNumber?: string; notes?: string | null }) {
  const run = useRefreshAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ status, batchNumber: batchNumber ?? "", notes: notes ?? "" });
  const [loading, setLoading] = useState(false);

  const updateStatus = (nextStatus: string) => {
    setForm({ ...form, status: nextStatus });
    run(
      () => requestJson(`/api/quality/${id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) }).then(() => undefined),
      "Quality check updated"
    );
  };

  const save = async () => {
    if (!form.batchNumber.trim()) return toast.error("Batch number is required");
    setLoading(true);
    const ok = await run(
      () => requestJson(`/api/quality/${id}`, { method: "PATCH", body: JSON.stringify(form) }).then(() => undefined),
      "Quality check updated"
    );
    setLoading(false);
    if (!ok) return;
    setOpen(false);
  };

  const remove = () => {
    if (!window.confirm("Delete this quality check?")) return;
    run(() => requestJson(`/api/quality/${id}`, { method: "DELETE" }).then(() => undefined), "Quality check deleted");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <select value={status} onChange={(event) => updateStatus(event.target.value)} className="input h-8 w-36 py-1 text-xs">
        <option value="PASSED">Passed</option>
        <option value="FAILED">Failed</option>
        <option value="UNDER_REVIEW">Under review</option>
      </select>
      <ActionButton onClick={() => setOpen(true)}><Edit3 className="w-3.5 h-3.5" /> Edit</ActionButton>
      <ActionButton className="btn-danger" onClick={remove}><Trash2 className="w-3.5 h-3.5" /> Delete</ActionButton>
      {open && (
        <CrudModal title="Edit Quality Check" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Status *">
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                  <option value="UNDER_REVIEW">Under review</option>
                </select>
              </Field>
              <Field label="Batch Number *">
                <input value={form.batchNumber} onChange={e => setForm({ ...form, batchNumber: e.target.value })} className="input" />
              </Field>
            </div>
            <Field label="Notes">
              <textarea rows={4} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input resize-none" />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={save} disabled={loading} className="btn-primary flex-1">
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />}
                {loading ? "Saving..." : "Save Check"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </CrudModal>
      )}
    </div>
  );
}

export function AddCustomerButton() {
  const run = useRefreshAction();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const create = async () => {
    if (!form.name.trim()) return toast.error("Customer name is required");
    setLoading(true);
    const ok = await run(
      () => requestJson("/api/customers", { method: "POST", body: JSON.stringify(form) }).then(() => undefined),
      "Customer added"
    );
    setLoading(false);
    if (!ok) return;
    setOpen(false);
    setForm({ name: "", phone: "", email: "" });
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Add Customer
      </button>
      {open && (
        <CrudModal title="Add Customer" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Field label="Customer Name *">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Customer full name" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone">
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+234..." />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" placeholder="customer@email.com" />
              </Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={create} disabled={loading} className="btn-primary flex-1">
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />}
                {loading ? "Adding..." : "Add Customer"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </CrudModal>
      )}
    </>
  );
}

export function AddSupplierButton() {
  const run = useRefreshAction();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", contactName: "", email: "", phone: "" });

  const create = async () => {
    if (!form.name.trim() || !form.contactName.trim() || !form.email.trim() || !form.phone.trim()) {
      return toast.error("Fill in all required supplier fields");
    }
    setLoading(true);
    const ok = await run(
      () => requestJson("/api/suppliers", { method: "POST", body: JSON.stringify(form) }).then(() => undefined),
      "Supplier added"
    );
    setLoading(false);
    if (!ok) return;
    setOpen(false);
    setForm({ name: "", contactName: "", email: "", phone: "" });
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Add Supplier
      </button>
      {open && (
        <CrudModal title="Add Supplier" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Field label="Supplier Name *">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Supplier company" />
            </Field>
            <Field label="Contact Person *">
              <input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="input" placeholder="Primary contact" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email *">
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" placeholder="supplier@email.com" />
              </Field>
              <Field label="Phone *">
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+234..." />
              </Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={create} disabled={loading} className="btn-primary flex-1">
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />}
                {loading ? "Adding..." : "Add Supplier"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </CrudModal>
      )}
    </>
  );
}

export function AddQualityButton({ medicines }: { medicines: { id: string; name: string; batchNumber: string; manufacturer: string }[] }) {
  const run = useRefreshAction();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ medicineId: "", status: "PASSED", batchNumber: "", notes: "" });

  const selectMedicine = (medicineId: string) => {
    const medicine = medicines.find(m => m.id === medicineId);
    setForm({ ...form, medicineId, batchNumber: medicine?.batchNumber ?? "" });
  };

  const create = async () => {
    if (!form.medicineId || !form.batchNumber.trim()) return toast.error("Select a medicine and batch number");
    setLoading(true);
    const ok = await run(
      () => requestJson("/api/quality", { method: "POST", body: JSON.stringify(form) }).then(() => undefined),
      "Quality check recorded"
    );
    setLoading(false);
    if (!ok) return;
    setOpen(false);
    setForm({ medicineId: "", status: "PASSED", batchNumber: "", notes: "" });
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Record Check
      </button>
      {open && (
        <CrudModal title="Record Quality Check" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Field label="Medicine *">
              <select value={form.medicineId} onChange={e => selectMedicine(e.target.value)} className="input">
                <option value="">Select medicine</option>
                {medicines.map(m => <option key={m.id} value={m.id}>{m.name} - {m.manufacturer}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Status *">
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                  <option value="UNDER_REVIEW">Under review</option>
                </select>
              </Field>
              <Field label="Batch Number *">
                <input value={form.batchNumber} onChange={e => setForm({ ...form, batchNumber: e.target.value })} className="input" />
              </Field>
            </div>
            <Field label="Notes">
              <textarea rows={4} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input resize-none" placeholder="Inspection findings, quarantine notes, or approval comments" />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={create} disabled={loading || medicines.length === 0} className="btn-primary flex-1">
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />}
                {loading ? "Recording..." : "Record Check"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </CrudModal>
      )}
    </>
  );
}

export function InteractionActions({ id, severity, description, recommendation, source }: { id: string; severity: string; description: string; recommendation: string | null; source: string | null }) {
  const run = useRefreshAction();

  const edit = () => {
    const nextSeverity = window.prompt("Severity: MILD, MODERATE, SEVERE, or CONTRAINDICATED", severity);
    if (nextSeverity === null) return;
    const nextDescription = window.prompt("Description", description);
    if (nextDescription === null || !nextDescription.trim()) return;
    const nextRecommendation = window.prompt("Recommendation", recommendation ?? "");
    if (nextRecommendation === null) return;
    const nextSource = window.prompt("Source", source ?? "");
    if (nextSource === null) return;
    run(
      () => requestJson(`/api/interactions/${id}`, { method: "PATCH", body: JSON.stringify({ severity: nextSeverity, description: nextDescription, recommendation: nextRecommendation, source: nextSource }) }).then(() => undefined),
      "Interaction updated"
    );
  };

  const remove = () => {
    if (!window.confirm("Delete this interaction?")) return;
    run(() => requestJson(`/api/interactions/${id}`, { method: "DELETE" }).then(() => undefined), "Interaction deleted");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton onClick={edit}><Edit3 className="w-3.5 h-3.5" /> Edit</ActionButton>
      <ActionButton className="btn-danger" onClick={remove}><Trash2 className="w-3.5 h-3.5" /> Delete</ActionButton>
    </div>
  );
}

export function SaleRefundAction({ id, status }: { id: string; status: string }) {
  const run = useRefreshAction();
  if (status === "REFUNDED") return <span className="badge badge-gray">Refunded</span>;

  const refund = () => {
    if (!window.confirm("Refund this sale? Sold quantities will be returned to inventory.")) return;
    run(() => requestJson(`/api/sales/${id}`, { method: "PATCH", body: JSON.stringify({ status: "REFUNDED" }) }).then(() => undefined), "Sale refunded and stock restored");
  };

  return (
    <ActionButton className="btn-secondary" onClick={refund}>
      <RotateCcw className="w-3.5 h-3.5" /> Refund
    </ActionButton>
  );
}
