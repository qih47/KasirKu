import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSubscriptionData } from "@/modules/subscription/actions";
import { SubscriptionClient } from "./subscription-client";
import { Lock, Home, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;
  if (user.role !== "OWNER") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Hak Akses Terbatas (Role: {user.role})
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Halaman Khusus Owner Bisnis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Manajemen lisensi paket langganan, billing, dan perpanjangan invoice hanya dapat dikelola oleh akun Owner.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/dashboard"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Ringkasan Dashboard</span>
            </Link>
            <Link
              href="/pos"
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
              <span>Buka Mesin Kasir POS</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const data = await getSubscriptionData();
  return <SubscriptionClient initialData={data} />;
}
