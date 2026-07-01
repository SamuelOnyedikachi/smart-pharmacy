"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock, Mail, Phone, ShieldPlus, User, UserRoundPlus } from "lucide-react";

const roles = [
  { value: "PHARMACIST", label: "Pharmacist" },
  { value: "CASHIER", label: "Cashier" },
  { value: "STOCK_KEEPER", label: "Stock keeper" },
  { value: "QA_PERSONNEL", label: "QA personnel" },
  { value: "DRIVER", label: "Driver" },
  { value: "SUPPLIER", label: "Supplier" },
] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(["STOCK_KEEPER", "CASHIER", "PHARMACIST", "DRIVER", "QA_PERSONNEL", "SUPPLIER"]),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "PHARMACIST" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!result.success) {
        toast.error(result.error ?? "Failed to create account");
        return;
      }

      toast.success("Account created. You can sign in now.");
      router.push("/login");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-gray-900 flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
            <ShieldPlus className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">SmartPharm</span>
        </div>

        <div>
          <div className="space-y-5">
            {[
              { stat: "Fast", label: "Create staff access in moments" },
              { stat: "Role", label: "Permissions match pharmacy duties" },
              { stat: "Secure", label: "Passwords are encrypted before storage" },
            ].map((item) => (
              <div key={item.stat} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-600/20 border border-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-400 font-bold text-sm">{item.stat}</span>
                </div>
                <p className="text-gray-300 text-sm">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-8 leading-relaxed">
            Smart Pharmacy Management System - designed for standalone community pharmacies.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
              <ShieldPlus className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">SmartPharm</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 text-sm mt-1 mb-8">Set up your pharmacy staff access</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input {...register("name")} type="text" autoComplete="name" placeholder="Jane Doe" className="input pl-9" />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input {...register("email")} type="email" autoComplete="email" placeholder="you@pharmacy.com" className="input pl-9" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Role</label>
                <select {...register("role")} className="select">
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
              </div>

              <div>
                <label className="label">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input {...register("phone")} type="tel" autoComplete="tel" placeholder="Optional" className="input pl-9" />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input {...register("password")} type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="Create a password" className="input pl-9 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />}
              <UserRoundPlus className="w-4 h-4" />
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-900">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
