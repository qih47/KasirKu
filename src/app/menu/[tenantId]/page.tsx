import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { hasSelfOrderPlugin } from "@/modules/self-order/actions";
import { CustomerMenuClient } from "./menu-client";
import { Lock, Store, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CustomerMenuPage({
  params,
  searchParams,
}: {
  params: { tenantId: string };
  searchParams?: { table?: string };
}) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    include: {
      outlets: {
        where: { isActive: true },
        take: 1,
      },
      cafeTables: {
        orderBy: { tableNumber: "asc" },
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  // 1. Guard Plugin: Cek apakah tenant berlangganan modul QR Self-Order
  const isEnabled = await hasSelfOrderPlugin(params.tenantId);

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight text-white">
              Layanan Self-Order Belum Aktif
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Toko <span className="font-bold text-slate-200">{tenant.businessName}</span> belum mengaktifkan plugin premium <span className="font-mono text-indigo-400 font-bold">QR Self-Order &amp; Live Order</span>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50 text-left text-xs space-y-2">
            <div className="text-slate-400 font-medium">Bagi Pemilik Toko:</div>
            <p className="text-slate-300 text-[11px]">
              Silakan aktifkan modul <strong>QR Self-Order</strong> di menu <em>Pengaturan Toko &rarr; Plugin &amp; Add-ons</em> untuk membuka akses menu digital mandiri bagi pelanggan.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda Qassa POS</span>
          </Link>
        </div>
      </div>
    );
  }

  const products = await prisma.product.findMany({
    where: { tenantId: params.tenantId, isActive: true },
    orderBy: { category: "asc" },
  });

  const defaultOutlet = tenant.outlets[0] || null;

  return (
    <CustomerMenuClient
      tenant={{
        id: tenant.id,
        businessName: tenant.businessName,
        logoUrl: tenant.logoUrl,
        outletId: defaultOutlet?.id || "",
        outletName: defaultOutlet?.name || "Outlet Utama",
      }}
      tables={tenant.cafeTables.map((t) => ({
        id: t.id,
        tableNumber: t.tableNumber,
        status: t.status,
      }))}
      initialTableQuery={searchParams?.table}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        imageUrl: p.imageUrl,
        category: p.category || "Umum",
        type: p.type,
        stockQty: p.stockQty,
      }))}
    />
  );
}
