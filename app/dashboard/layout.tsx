import type { ReactNode } from "react";

type DashboardRootLayoutProps = {
  children: ReactNode;
};

export default function DashboardRootLayout({
  children,
}: DashboardRootLayoutProps) {
  return <>{children}</>;
}