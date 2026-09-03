"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  ShoppingBag,
  Receipt,
  Users,
  Truck,
  RotateCcw,
  Wallet,
  BarChart3,
  Bell,
  UserCog,
  Store,
  Settings,
  FileText,
  ChevronDown,
  X,
} from "lucide-react";

type SidebarProps = {
  mobileOpen: boolean;
  collapsed: boolean;
  forceMobile: boolean;
  onMobileClose: () => void;
  onCollapse: () => void;
};

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "POS", href: "/dashboard/invoice", icon: ShoppingCart },
  { label: "Products", href: "/dashboard/product", icon: Package },
  { label: "Inventory", href: "/dashboard/inventory", icon: Boxes },
  { label: "Purchases", href: "/dashboard/purchases", icon: ShoppingBag },
  { label: "Sales", href: "/dashboard/sales", icon: Receipt },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Suppliers", href: "/dashboard/suppliers", icon: Truck },
  { label: "Returns", href: "/dashboard/returns", icon: RotateCcw },
  { label: "Expenses", href: "/dashboard/expenses", icon: Wallet },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Users & Roles", href: "/dashboard/users", icon: UserCog },
  { label: "Branches", href: "/dashboard/branches", icon: Store },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Audit Logs", href: "/dashboard/audit-logs", icon: FileText },
];

export default function Sidebar({
  mobileOpen,
  collapsed,
  forceMobile,
  onMobileClose,
  onCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (forceMobile) {
      onMobileClose();
    }
  }, [pathname, forceMobile, onMobileClose]);

  useEffect(() => {
    if (forceMobile && mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [forceMobile, mobileOpen]);

  return (
    <>
      {forceMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px]"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-dvh flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
          forceMobile
            ? mobileOpen
              ? "w-[86vw] max-w-[280px] translate-x-0 shadow-2xl"
              : "w-[86vw] max-w-[280px] -translate-x-full shadow-xl"
            : collapsed
              ? "w-20 translate-x-0"
              : "w-64 translate-x-0"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <div
            className={`flex min-w-0 items-center gap-3 ${
              !forceMobile && collapsed ? "w-full justify-center" : ""
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Store size={20} />
            </div>

            {(forceMobile || !collapsed) && (
              <div className="min-w-0">
                <h1 className="truncate text-sm font-bold text-slate-900">
                  Hafiz Retail
                </h1>
                <p className="text-[11px] text-slate-500">POS System</p>
              </div>
            )}
          </div>

          {forceMobile && (
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Close sidebar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={21} />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          {(forceMobile || !collapsed) && (
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Main Menu
            </p>
          )}

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!forceMobile && collapsed ? item.label : undefined}
                  className={`group flex min-h-11 items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors sm:text-sm ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  } ${!forceMobile && collapsed ? "justify-center" : ""}`}
                >
                  <Icon
                    size={19}
                    className={`shrink-0 ${
                      isActive
                        ? "text-blue-600"
                        : "text-slate-500 group-hover:text-slate-700"
                    }`}
                  />

                  {(forceMobile || !collapsed) && (
                    <span className="ml-3 truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {!forceMobile && (
          <div className="shrink-0 border-t border-slate-200 p-3">
            <button
              type="button"
              onClick={onCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex min-h-10 w-full items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <ChevronDown
                size={18}
                className={`transition-transform duration-300 ${
                  collapsed ? "-rotate-90" : "rotate-90"
                }`}
              />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}