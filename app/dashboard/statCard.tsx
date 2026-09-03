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
    <div className="h-full min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
            {title}
          </p>

          <h3 className="mt-1.5 break-words text-xl font-bold leading-tight tracking-tight text-slate-900 sm:mt-2 sm:text-2xl">
            {value}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {trend && (
              <span
                className={`shrink-0 text-[11px] font-semibold sm:text-xs ${
                  trendUp
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {trend}
              </span>
            )}

            <span className="min-w-0 text-[11px] leading-5 text-slate-400 sm:text-xs">
              {description}
            </span>
          </div>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 sm:h-11 sm:w-11">
          {icon}
        </div>

      </div>
    </div>
  );
}