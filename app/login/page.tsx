"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, ShieldPlus, Lock, Mail } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});
type FormData = z.infer<typeof schema>;

type LoginStat = { stat: string; label: string };
type DemoUser = { role: string; email: string };

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginStats, setLoginStats] = useState<LoginStat[]>([]);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    let mounted = true;
    fetch("/api/login-data", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!mounted || !data.success) return;
        setLoginStats(data.data.stats ?? []);
        setDemoUsers(data.data.demoUsers ?? []);
      })
      .catch(() => {
        if (!mounted) return;
        setLoginStats([]);
        setDemoUsers([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await signIn("credentials", { ...data, redirect: false });
      if (res?.error) { toast.error("Invalid email or password"); }
      else { toast.success("Welcome back!"); router.push("/dashboard"); router.refresh(); }
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-gray-900 flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
            <ShieldPlus className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">SmartPharm</span>
        </div>

        <div>
          {loginStats.length > 0 && (
            <div className="space-y-5">
              {loginStats.map((item) => (
              <div key={item.stat} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-600/20 border border-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-400 font-bold text-sm">{item.stat}</span>
                </div>
                <p className="text-gray-300 text-sm">{item.label}</p>
              </div>
              ))}
            </div>
          )}
          <p className="text-gray-600 text-xs mt-8 leading-relaxed">
            Smart Pharmacy Management System — designed for standalone community pharmacies.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
              <ShieldPlus className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">SmartPharm</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="text-gray-500 text-sm mt-1 mb-8">Enter your staff credentials to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input {...register("email")} type="email" autoComplete="email"
                  placeholder="you@pharmacy.com"
                  className="input pl-9" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input {...register("password")} type={showPw ? "text" : "password"}
                  autoComplete="current-password" placeholder="••••••••"
                  className="input pl-9 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full mt-2">
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              No account yet?{" "}
              <Link href="/signup" className="font-semibold text-teal-700 hover:text-teal-900">
                Create one
              </Link>
            </p>
          </div>

          {demoUsers.length > 0 && (
            <div className="mt-8 p-4 bg-white border border-gray-200 rounded-xl">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Active staff accounts</p>
              <div className="space-y-2">
                {demoUsers.map((u) => (
                  <button key={u.email} type="button"
                    onClick={() => setValue("email", u.email)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-gray-50 hover:bg-teal-50 hover:border-teal-200 border border-transparent transition-colors text-sm">
                    <span className="font-medium text-gray-700">{u.role}</span>
                    <span className="text-gray-400 text-xs font-mono truncate">{u.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
