import Sidebar from "./sidebar";
import Header from "./header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">

      <Sidebar />

      <main className="ml-64 min-h-screen">

        <Header />

        <div>
          {children}
        </div>

      </main>

    </div>
  );
}