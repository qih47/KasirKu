"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  User,
  Settings,
  CreditCard,
  ShoppingBag,
  LogOut,
  ChevronDown,
  Shield,
  Store,
  ExternalLink,
} from "lucide-react";

interface UserNavMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    image?: string | null;
  };
  primaryColor?: string;
  isLuxeDark?: boolean;
}

export function UserNavMenu({
  user,
  primaryColor = "#4f46e5",
  isLuxeDark = false,
}: UserNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (user.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-2xl border transition-all cursor-pointer ${
          isOpen
            ? isLuxeDark
              ? "bg-slate-800 border-slate-700 shadow-md ring-2 ring-indigo-500/30"
              : "bg-slate-100 border-slate-300 shadow-md ring-2 ring-indigo-500/20"
            : isLuxeDark
            ? "bg-[#111A2E] border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700"
            : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
        }`}
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm flex-shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            initials
          )}
        </div>

        {/* User Info Text */}
        <div className="hidden sm:block text-left">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-black truncate max-w-[110px] ${
                isLuxeDark ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {user.name || "Pengguna"}
            </span>
            <span
              className="text-[9px] font-black px-1.5 py-0.2 rounded border uppercase tracking-wider"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
                borderColor: `${primaryColor}30`,
              }}
            >
              {user.role || "OWNER"}
            </span>
          </div>
          <p
            className={`text-[10px] truncate max-w-[130px] ${
              isLuxeDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {user.email}
          </p>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-500" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-64 rounded-3xl border shadow-2xl p-2 z-50 animate-fadeIn ${
            isLuxeDark
              ? "bg-[#111A2E] border-slate-800 text-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
              : "bg-white border-slate-200 text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
          }`}
        >
          {/* Header Card in Dropdown */}
          <div
            className={`p-3 rounded-2xl mb-1.5 border ${
              isLuxeDark
                ? "bg-slate-900/60 border-slate-800"
                : "bg-slate-50/80 border-slate-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {initials}
              </div>
              <div className="overflow-hidden">
                <h4
                  className={`text-xs font-black truncate ${
                    isLuxeDark ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  {user.name || "Pengguna"}
                </h4>
                <p
                  className={`text-[11px] truncate ${
                    isLuxeDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {user.email}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3 text-indigo-500" />
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    Role: {user.role || "OWNER"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="space-y-0.5">
            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                isLuxeDark
                  ? "hover:bg-slate-800/80 text-slate-200 hover:text-white"
                  : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
              }`}
            >
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
                <Settings className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <span className="block leading-tight">Pengaturan Bisnis</span>
                <span
                  className={`text-[10px] font-normal ${
                    isLuxeDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Profil, struk &amp; modul vertikal
                </span>
              </div>
            </Link>

            <Link
              href="/dashboard/subscription"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                isLuxeDark
                  ? "hover:bg-slate-800/80 text-slate-200 hover:text-white"
                  : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
              }`}
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <span className="block leading-tight">Paket &amp; Langganan</span>
                <span
                  className={`text-[10px] font-normal ${
                    isLuxeDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Status lisensi &amp; pembayaran
                </span>
              </div>
            </Link>

            <Link
              href="/dashboard/store"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                isLuxeDark
                  ? "hover:bg-slate-800/80 text-slate-200 hover:text-white"
                  : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
              }`}
            >
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <span className="block leading-tight">Store Tema &amp; Layout</span>
                <span
                  className={`text-[10px] font-normal ${
                    isLuxeDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Katalog tema &amp; layout POS
                </span>
              </div>
            </Link>
          </div>

          <div
            className={`my-1.5 border-t ${
              isLuxeDark ? "border-slate-800" : "border-slate-100"
            }`}
          />

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              signOut({ callbackUrl: "/login" });
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer`}
          >
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
              <LogOut className="w-4 h-4" />
            </div>
            <span>Keluar dari Akun</span>
          </button>
        </div>
      )}
    </div>
  );
}
