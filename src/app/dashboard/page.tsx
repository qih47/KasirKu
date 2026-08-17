import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Sparkles,
  ShoppingBag,
  Scissors,
  Coffee,
  Shirt,
  DollarSign,
  Receipt,
  Users,
  Layers,
  ArrowRight,
  ShieldAlert,
  TrendingUp,
  Store,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  // Fetch tenant info and active plugins
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    include: {
      subscriptions: {
        where: { isActive: true },
        include: {
          licenseTier: true,
          plugins: {
            include: {
              plugin: true,
            },
          },
        },
      },
      outlets: true,
      users: true,
    },
  });

  const activeSubscription = tenant?.subscriptions[0];
  const activePlugins = activeSubscription?.plugins || [];

  const getPluginIcon = (code: string) => {
    switch (code) {
      case "barbershop":
        return <Scissors className="w-5 h-5 text-amber-500" />;
      case "cafe":
        return <Coffee className="w-5 h-5 text-emerald-500" />;
      case "retail":
        return <ShoppingBag className="w-5 h-5 text-blue-500" />;
      case "laundry":
        return <Shirt className="w-5 h-5 text-purple-500" />;
      default:
        return <Layers className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner - Clean Material Elevated Hero */}
      <div className="p-6 sm:p-8 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Sistem POS Aktif &bull; {tenant?.businessName}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Selamat Datang, {user.name}! 👋
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm max-w-xl leading-relaxed">
            Aplikasi kasir siap digunakan dengan modul vertikal terpilih. Kelola transaksi, shift kasir, produk, dan laporan harian dengan mudah.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link
            href="/pos"
            className="px-6 py-3.5 rounded-2xl bg-white text-indigo-600 font-extrabold text-xs shadow-lg hover:bg-indigo-50 transition flex items-center gap-2"
          >
            <span>Buka Kasir (POS)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Subscription & Active Plugins Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Active License Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Lisensi Kapasitas
            </span>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {activeSubscription?.licenseTier?.name || "Lisensi Basic"}
            </span>
          </div>

          <div>
            <p className="text-2xl font-black text-slate-950">
              {tenant?.outlets.length || 1} /{" "}
              {activeSubscription?.licenseTier?.outletLimit
                ? `${activeSubscription.licenseTier.outletLimit} Outlet`
                : "Unlimited Outlet"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Maksimal{" "}
              {activeSubscription?.licenseTier?.kasirLimitPerOutlet || 5} kasir
              per outlet.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard/subscription"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Kelola Paket & Lisensi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Active Vertical Plugins */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Modul Vertikal Aktif (Plugin)
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              {activePlugins.length} Modul Terpasang
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activePlugins.length > 0 ? (
              activePlugins.map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5"
                >
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                    {getPluginIcon(item.plugin.code)}
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-950">
                      {item.plugin.name}
                    </h2>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {item.plugin.code}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Belum ada modul vertikal aktif. Silakan aktifkan di menu Langganan.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">
              Penjualan Hari Ini
            </span>
            <p className="text-2xl font-black text-slate-950">Rp 0</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-sm">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">
              Transaksi Selesai
            </span>
            <p className="text-2xl font-black text-slate-950">0 Struk</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">
              Total Pengguna & Kasir
            </span>
            <p className="text-2xl font-black text-slate-950">
              {tenant?.users.length || 1} Akun
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
