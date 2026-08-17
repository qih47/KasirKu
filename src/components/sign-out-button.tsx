"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-slate-400 dark:hover:text-red-400 transition"
      title="Keluar dari Akun"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
}
