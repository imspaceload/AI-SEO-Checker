"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  History,
  Settings,
  Activity,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/checker", label: "Rank Checker", icon: Search },
  { href: "/results", label: "Results History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-30">
      <div className="p-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">
              AI SEO
            </h1>
            <p className="text-xs text-gray-500 -mt-0.5">Rank Checker</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-brand-600" : "text-gray-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-700">AI Models</p>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-600">ChatGPT</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-600">Claude</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600">Gemini</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
