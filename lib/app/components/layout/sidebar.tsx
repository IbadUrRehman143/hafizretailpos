"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

// ======================================================
// MENU ITEMS
// ======================================================

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "POS",
    href: "/dashboard/invoice",
    icon: ShoppingCart,
  },
  {
    label: "Products",
    href: "/dashboard/product",
    icon: Package,
  },
  {
    label: "Inventory",
    href: "/dashboard/inventory",
    icon: Boxes,
  },
  {
    label: "Purchases",
    href: "/dashboard/purchases",
    icon: ShoppingBag,
  },
  {
    label: "Sales",
    href: "/dashboard/sales",
    icon: Receipt,
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    label: "Suppliers",
    href: "/dashboard/suppliers",
    icon: Truck,
  },
  {
    label: "Returns",
    href: "/dashboard/returns",
    icon: RotateCcw,
  },
  {
    label: "Expenses",
    href: "/dashboard/expenses",
    icon: Wallet,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    label: "Users & Roles",
    href: "/dashboard/users",
    icon: UserCog,
  },
  {
    label: "Branches",
    href: "/dashboard/branches",
    icon: Store,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    label: "Audit Logs",
    href: "/dashboard/audit-logs",
    icon: FileText,
  },
];

// ======================================================
// SIDEBAR
// ======================================================

export default function Sidebar() {
  const pathname = usePathname();

  const [
    collapsed,
    setCollapsed,
  ] = useState(false);

  // ====================================================
  // HEADER MENU EVENT
  // ====================================================

  useEffect(() => {
    const handleToggleSidebar =
      () => {
        setCollapsed(
          (current) => !current
        );
      };

    window.addEventListener(
      "toggle-sidebar",
      handleToggleSidebar
    );

    return () => {
      window.removeEventListener(
        "toggle-sidebar",
        handleToggleSidebar
      );
    };
  }, []);

  // ====================================================
  // UI
  // ====================================================

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed
          ? "w-20"
          : "w-64"
      }`}
    >
      {/* ============================================= */}
      {/* LOGO */}
      {/* ============================================= */}

      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">

        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Store size={20} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-slate-900">
                Hafiz Retail
              </h1>

              <p className="text-xs text-slate-500">
                POS System
              </p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Store size={20} />
          </div>
        )}
      </div>

      {/* ============================================= */}
      {/* NAVIGATION */}
      {/* ============================================= */}

      <nav className="flex-1 overflow-y-auto px-3 py-4">

        {!collapsed && (
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>
        )}

        <div className="space-y-1">

          {menuItems.map(
            (item) => {
              const Icon =
                item.icon;

              const isActive =
                item.href ===
                "/dashboard"
                  ? pathname ===
                    "/dashboard"
                  : pathname ===
                      item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

              return (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  title={
                    collapsed
                      ? item.label
                      : undefined
                  }
                  className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  } ${
                    collapsed
                      ? "justify-center"
                      : ""
                  }`}
                >
                  <Icon
                    size={19}
                    className={`shrink-0 ${
                      isActive
                        ? "text-blue-600"
                        : "text-slate-500 group-hover:text-slate-700"
                    }`}
                  />

                  {!collapsed && (
                    <span className="ml-3">
                      {
                        item.label
                      }
                    </span>
                  )}
                </Link>
              );
            }
          )}
        </div>
      </nav>

      {/* ============================================= */}
      {/* COLLAPSE BUTTON */}
      {/* ============================================= */}

      <div className="border-t border-slate-200 p-3">

        <button
          type="button"
          onClick={() =>
            setCollapsed(
              (current) =>
                !current
            )
          }
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          title={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >
          <ChevronDown
            size={18}
            className={`transition-transform duration-300 ${
              collapsed
                ? "-rotate-90"
                : "rotate-90"
            }`}
          />
        </button>
      </div>
    </aside>
  );
}