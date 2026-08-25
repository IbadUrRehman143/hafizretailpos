"use client";

import { useState } from "react";

type SalesData = {
  day: string;
  sales: number;
};

const salesData: SalesData[] = [
  { day: "Mon", sales: 42000 },
  { day: "Tue", sales: 58000 },
  { day: "Wed", sales: 51000 },
  { day: "Thu", sales: 72000 },
  { day: "Fri", sales: 65000 },
  { day: "Sat", sales: 89000 },
  { day: "Sun", sales: 76000 },
];

const chartWidth = 760;
const chartHeight = 280;

const paddingLeft = 55;
const paddingRight = 20;
const paddingTop = 20;
const paddingBottom = 40;

const maxSales = 100000;

function getX(index: number) {
  const chartAreaWidth =
    chartWidth - paddingLeft - paddingRight;

  return (
    paddingLeft +
    (index * chartAreaWidth) / (salesData.length - 1)
  );
}

function getY(value: number) {
  const chartAreaHeight =
    chartHeight - paddingTop - paddingBottom;

  return (
    paddingTop +
    chartAreaHeight -
    (value / maxSales) * chartAreaHeight
  );
}

function formatCurrency(value: number) {
  if (value >= 100000) {
    return `${(value / 100000).toFixed(1)}L`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  return value.toString();
}

export default function SalesChart() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const points = salesData
    .map((item, index) => `${getX(index)},${getY(item.sales)}`)
    .join(" ");

  return (
    <div className="w-full">
      {/* Chart */}
      <div className="relative h-80 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          {/* Horizontal Grid Lines */}
          {[0, 25000, 50000, 75000, 100000].map((value) => {
            const y = getY(value);

            return (
              <g key={value}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100"
                  strokeWidth="1"
                />

                <text
                  x="0"
                  y={y + 4}
                  className="fill-slate-400 text-[11px]"
                >
                  {formatCurrency(value)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <polygon
            points={`${paddingLeft},${chartHeight - paddingBottom} ${points} ${
              chartWidth - paddingRight
            },${chartHeight - paddingBottom}`}
            className="fill-blue-50"
          />

          {/* Sales Line */}
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            className="text-blue-600"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {salesData.map((item, index) => {
            const x = getX(index);
            const y = getY(item.sales);

            return (
              <g key={item.day}>
                <circle
                  cx={x}
                  cy={y}
                  r="7"
                  className="cursor-pointer fill-white stroke-blue-600"
                  strokeWidth="3"
                  onMouseEnter={() => setSelectedDay(index)}
                  onMouseLeave={() => setSelectedDay(null)}
                />

                {/* Day */}
                <text
                  x={x}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  className="fill-slate-400 text-[11px]"
                >
                  {item.day}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {selectedDay !== null && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg"
            style={{
              left: `${((selectedDay + 0.5) / salesData.length) * 100}%`,
              top: "10%",
              transform: "translateX(-50%)",
            }}
          >
            <p className="text-xs font-medium text-slate-500">
              {salesData[selectedDay].day}
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              Rs. {salesData[selectedDay].sales.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs text-slate-400">
            Total Sales
          </p>

          <p className="mt-1 text-lg font-bold text-slate-900">
            Rs. {salesData
              .reduce((total, item) => total + item.sales, 0)
              .toLocaleString()}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400">
            Average / Day
          </p>

          <p className="mt-1 text-lg font-bold text-slate-900">
            Rs.{" "}
            {Math.round(
              salesData.reduce(
                (total, item) => total + item.sales,
                0
              ) / salesData.length
            ).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}