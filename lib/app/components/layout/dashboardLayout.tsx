"use client";

import type { ReactNode } from "react";

import {
  useEffect,
  useState,
} from "react";

import Sidebar from "./sidebar";
import Header from "./header";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  // ======================================================
  // LISTEN TO SIDEBAR TOGGLE
  // ======================================================

  useEffect(() => {
    const handleToggleSidebar =
      () => {
        setSidebarCollapsed(
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed
            ? "ml-20"
            : "ml-64"
        }`}
      >
        <Header />

        <div>
          {children}
        </div>
      </main>
    </div>
  );
}