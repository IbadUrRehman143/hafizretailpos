import { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
};

export default function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendUp = true,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>

          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span
                className={`text-xs font-semibold ${
                  trendUp ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend}
              </span>
            )}

            <span className="text-xs text-slate-400">
              {description}
            </span>
          </div>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>

      </div>
    </div>
  );
}