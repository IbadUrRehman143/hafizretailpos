import type { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  iconClassName?: string;
};

export default function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendUp = true,
  iconClassName = "bg-blue-100 text-blue-600",
}: StatCardProps) {
  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            {trend && (
              <span
                className={`text-xs font-bold ${
                  trendUp ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {trend}
              </span>
            )}

            <span className="text-xs text-slate-400">{description}</span>
          </div>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition duration-200 ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
