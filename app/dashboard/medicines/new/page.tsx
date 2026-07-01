"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(2, "Required"),
  genericName: z.string().optional(),
  category: z.string().min(1, "Select a category"),
  manufacturer: z.string().min(2, "Required"),
  dosage: z.string().min(1, "Required"),
  form: z.string().min(1, "Required"),
  batchNumber: z.string().min(1, "Required"),
  expiryDate: z.string().min(1, "Required"),
  stockQuantity: z.coerce.number().min(0),
  reorderLevel: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0.01, "Must be greater than 0"),
  requiresPrescription: z.boolean().default(false),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const CATEGORIES = ["ANTIBIOTICS","ANALGESICS","ANTIHYPERTENSIVES","ANTIDIABETICS","ANTIHISTAMINES",
  "VITAMINS","ANTIFUNGALS","ANTIVIRALS","CARDIOVASCULAR","GASTROINTESTINAL","RESPIRATORY",
  "NEUROLOGICAL","HORMONAL","DERMATOLOGICAL","OPHTHALMIC","OTHER"];
const FORMS = ["Tablet","Capsule","Syrup","Injection","Cream","Ointment","Drops","Inhaler","Patch","Suppository"];

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function NewMedicinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/medicines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (result.success) { toast.success("Medicine added"); router.push("/dashboard/medicines"); }
      else toast.error(result.error ?? "Failed");
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto pb-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/medicines" className="btn-secondary p-2.5"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title">Add Medicine</h1>
          <p className="page-subtitle">Register a new medicine to the inventory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <p className="text-sm font-bold text-gray-700 pb-1 border-b border-gray-100">Basic Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Medicine Name *" error={errors.name?.message}>
              <input {...register("name")} className="input" placeholder="e.g. Amoxicillin" />
            </Field>
            <Field label="Generic Name">
              <input {...register("genericName")} className="input" placeholder="e.g. Amoxicillin Trihydrate" />
            </Field>
            <Field label="Category *" error={errors.category?.message}>
              <select {...register("category")} className="input">
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
              </select>
            </Field>
            <Field label="Manufacturer *" error={errors.manufacturer?.message}>
              <input {...register("manufacturer")} className="input" placeholder="e.g. Fidson Healthcare" />
            </Field>
            <Field label="Dosage *" error={errors.dosage?.message}>
              <input {...register("dosage")} className="input" placeholder="e.g. 500mg" />
            </Field>
            <Field label="Form *" error={errors.form?.message}>
              <select {...register("form")} className="input">
                <option value="">Select form</option>
                {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Stock */}
        <div className="card p-6 space-y-4">
          <p className="text-sm font-bold text-gray-700 pb-1 border-b border-gray-100">Stock Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Batch Number *" error={errors.batchNumber?.message}>
              <input {...register("batchNumber")} className="input" placeholder="e.g. AMX-2024-001" />
            </Field>
            <Field label="Expiry Date *" error={errors.expiryDate?.message}>
              <input {...register("expiryDate")} type="date" className="input" />
            </Field>
            <Field label="Stock Quantity *" error={errors.stockQuantity?.message}>
              <input {...register("stockQuantity")} type="number" min="0" className="input" placeholder="0" />
            </Field>
            <Field label="Reorder Level *" error={errors.reorderLevel?.message}>
              <input {...register("reorderLevel")} type="number" min="1" className="input" placeholder="10" />
            </Field>
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-6 space-y-4">
          <p className="text-sm font-bold text-gray-700 pb-1 border-b border-gray-100">Pricing & Dispensing</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Unit Price (₦) *" error={errors.unitPrice?.message}>
              <input {...register("unitPrice")} type="number" step="0.01" min="0" className="input" placeholder="0.00" />
            </Field>
            <div className="flex items-center gap-3 mt-5">
              <input {...register("requiresPrescription")} type="checkbox" id="rx" className="w-4 h-4 accent-teal-600 rounded" />
              <label htmlFor="rx" className="text-sm text-gray-700 cursor-pointer">Requires Prescription</label>
            </div>
          </div>
          <Field label="Description (optional)">
            <textarea {...register("description")} rows={3} className="input resize-none" placeholder="Additional notes…" />
          </Field>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />}
            {loading ? "Saving…" : "Add Medicine"}
          </button>
          <Link href="/dashboard/medicines" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
