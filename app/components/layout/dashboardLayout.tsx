"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import Sidebar from "./sidebar";
import Header from "./header";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [forceMobile, setForceMobile] = useState(true);

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent || "";
      const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
      const narrowViewport = window.innerWidth < 1024;
      const smallestScreenSide = Math.min(window.screen.width, window.screen.height);
      const narrowPhysicalScreen = smallestScreenSide < 820;

      const mobile = mobileUserAgent || narrowPhysicalScreen || narrowViewport;

      setForceMobile(mobile);

      if (!mobile) {
        setMobileSidebarOpen(false);
      }
    };

    detectDevice();

    window.addEventListener("resize", detectDevice);
    window.addEventListener("orientationchange", detectDevice);

    return () => {
      window.removeEventListener("resize", detectDevice);
      window.removeEventListener("orientationchange", detectDevice);
    };
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const handleCollapse = useCallback(() => {
    setSidebarCollapsed((current) => !current);
  }, []);

  const handleMenuClick = useCallback(() => {
    if (forceMobile) {
      setMobileSidebarOpen((current) => !current);
      return;
    }

    setSidebarCollapsed((current) => !current);
  }, [forceMobile]);

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 ${
        forceMobile ? "dashboard-force-mobile" : ""
      }`}
    >
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        collapsed={sidebarCollapsed}
        forceMobile={forceMobile}
        onMobileClose={handleMobileClose}
        onCollapse={handleCollapse}
      />

      <main
        className={`min-h-screen min-w-0 max-w-full overflow-x-hidden transition-[margin] duration-300 ${
          forceMobile
            ? "ml-0 w-full"
            : sidebarCollapsed
              ? "ml-20"
              : "ml-64"
        }`}
      >
        <Header onMenuClick={handleMenuClick} />

        <div className="w-full min-w-0 max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>

      <style jsx global>{`
        .dashboard-force-mobile {
          width: 100% !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
        }

        .dashboard-force-mobile main {
          margin-left: 0 !important;
          width: 100% !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
        }

        .dashboard-force-mobile .dashboard-page-shell {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          padding-left: 16px !important;
          padding-right: 16px !important;
          overflow-x: hidden !important;
        }

        .dashboard-force-mobile .dashboard-top-row,
        .dashboard-force-mobile .dashboard-sales-head {
          flex-direction: column !important;
          align-items: stretch !important;
        }

        .dashboard-force-mobile .dashboard-new-sale,
        .dashboard-force-mobile .dashboard-sales-link {
          width: 100% !important;
        }

        .dashboard-force-mobile .dashboard-stat-grid,
        .dashboard-force-mobile .dashboard-bottom-grid {
          grid-template-columns: minmax(0, 1fr) !important;
        }
      `}</style>
    </div>
  );
}