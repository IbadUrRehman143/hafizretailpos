import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";

import DashboardLayout from "../components/layout/dashboardLayout";
import StatCard from "../dashboard/statCard";
import RecentSales from "../dashboard/recentSales";
import LowStock from "../dashboard/salesChart";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">

        {/* PAGE HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Welcome back. Here's what's happening in your store today.
            </p>
          </div>

          <button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
            + New Sale
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Today's Sales"
            value="Rs. 125,500"
            description="vs. yesterday"
            trend="+12.5%"
            trendUp={true}
            icon={<DollarSign size={21} />}
          />

          <StatCard
            title="Total Orders"
            value="248"
            description="vs. yesterday"
            trend="+8.2%"
            trendUp={true}
            icon={<ShoppingCart size={21} />}
          />

          <StatCard
            title="Today's Profit"
            value="Rs. 32,400"
            description="vs. yesterday"
            trend="+6.4%"
            trendUp={true}
            icon={<TrendingUp size={21} />}
          />

          <StatCard
            title="Customers"
            value="1,245"
            description="total customers"
            trend="+24"
            trendUp={true}
            icon={<Users size={21} />}
          />

        </div>

        {/* SALES OVERVIEW */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Sales Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your sales performance over the last 7 days.
              </p>
            </div>

            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This year</option>
            </select>
          </div>

          <div className="mt-8 flex h-64 items-center justify-center rounded-lg bg-slate-50">
            <p className="text-sm text-slate-400">
              Sales chart will appear here
            </p>
          </div>
        </div>

        {/* RECENT SALES + LOW STOCK */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <RecentSales />
          <LowStock />
        </div>

      </div>
    </DashboardLayout>
  );
}