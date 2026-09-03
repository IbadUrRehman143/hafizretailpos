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
    (index * chartAreaWidth) /
      (salesData.length - 1)
  );
}

function getY(value: number) {
  const chartAreaHeight =
    chartHeight - paddingTop - paddingBottom;

  return (
    paddingTop +
    chartAreaHeight -
    (value / maxSales) *
      chartAreaHeight
  );
}

function formatCurrency(value: number) {
  if (value >= 100000) {
    return `${(
      value / 100000
    ).toFixed(1)}L`;
  }

  if (value >= 1000) {
    return `${Math.round(
      value / 1000
    )}K`;
  }

  return value.toString();
}

export default function SalesChart() {
  const [
    selectedDay,
    setSelectedDay,
  ] = useState<number | null>(null);

  const points = salesData
    .map(
      (item, index) =>
        `${getX(index)},${getY(
          item.sales
        )}`
    )
    .join(" ");

  const totalSales =
    salesData.reduce(
      (total, item) =>
        total + item.sales,
      0
    );

  const averageSales =
    Math.round(
      totalSales /
        salesData.length
    );

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {/* ================================================= */}
      {/* CHART */}
      {/* ================================================= */}

      <div className="w-full min-w-0 overflow-hidden">
        <div className="relative h-[200px] w-full min-w-0 sm:h-[240px] md:h-[280px] lg:h-[320px]">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            className="block h-full w-full max-w-full"
          >
            {/* =========================================== */}
            {/* HORIZONTAL GRID LINES */}
            {/* =========================================== */}

            {[
              0,
              25000,
              50000,
              75000,
              100000,
            ].map((value) => {
              const y =
                getY(value);

              return (
                <g key={value}>
                  <line
                    x1={
                      paddingLeft
                    }
                    y1={y}
                    x2={
                      chartWidth -
                      paddingRight
                    }
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-100"
                    strokeWidth="1"
                  />

                  <text
                    x="4"
                    y={y + 4}
                    className="fill-slate-400 text-[9px] sm:text-[10px] lg:text-[11px]"
                  >
                    {formatCurrency(
                      value
                    )}
                  </text>
                </g>
              );
            })}

            {/* =========================================== */}
            {/* AREA FILL */}
            {/* =========================================== */}

            <polygon
              points={`${paddingLeft},${
                chartHeight -
                paddingBottom
              } ${points} ${
                chartWidth -
                paddingRight
              },${
                chartHeight -
                paddingBottom
              }`}
              className="fill-blue-50"
            />

            {/* =========================================== */}
            {/* SALES LINE */}
            {/* =========================================== */}

            <polyline
              points={points}
              fill="none"
              stroke="currentColor"
              className="text-blue-600"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* =========================================== */}
            {/* DATA POINTS */}
            {/* =========================================== */}

            {salesData.map(
              (
                item,
                index
              ) => {
                const x =
                  getX(index);

                const y =
                  getY(
                    item.sales
                  );

                return (
                  <g
                    key={
                      item.day
                    }
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r="7"
                      className="cursor-pointer fill-white stroke-blue-600"
                      strokeWidth="3"
                      onMouseEnter={() =>
                        setSelectedDay(
                          index
                        )
                      }
                      onMouseLeave={() =>
                        setSelectedDay(
                          null
                        )
                      }
                      onClick={() =>
                        setSelectedDay(
                          selectedDay ===
                            index
                            ? null
                            : index
                        )
                      }
                    />

                    {/* DAY LABEL */}

                    <text
                      x={x}
                      y={
                        chartHeight -
                        12
                      }
                      textAnchor="middle"
                      className="fill-slate-400 text-[9px] font-medium sm:text-[10px] lg:text-[11px]"
                    >
                      {item.day}
                    </text>
                  </g>
                );
              }
            )}
          </svg>

          {/* ============================================= */}
          {/* TOOLTIP */}
          {/* ============================================= */}

          {selectedDay !==
            null && (
            <div
              className="pointer-events-none absolute z-20 min-w-[95px] rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-lg sm:min-w-[105px] sm:px-3"
              style={{
                left: `${Math.min(
                  86,
                  Math.max(
                    14,
                    ((selectedDay +
                      0.5) /
                      salesData.length) *
                      100
                  )
                )}%`,
                top: "6%",
                transform:
                  "translateX(-50%)",
              }}
            >
              <p className="text-[10px] font-medium text-slate-500 sm:text-xs">
                {
                  salesData[
                    selectedDay
                  ].day
                }
              </p>

              <p className="mt-1 whitespace-nowrap text-[11px] font-bold text-slate-900 sm:text-sm">
                Rs.{" "}
                {salesData[
                  selectedDay
                ].sales.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ================================================= */}
      {/* SUMMARY */}
      {/* ================================================= */}

      <div className="mt-3 grid w-full min-w-0 grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 sm:gap-4">
        {/* TOTAL SALES */}

        <div className="min-w-0 rounded-lg bg-slate-50 p-3 sm:bg-transparent sm:p-0">
          <p className="text-[11px] text-slate-400 sm:text-xs">
            Total Sales
          </p>

          <p className="mt-1 break-words text-sm font-bold text-slate-900 sm:text-base md:text-lg lg:text-xl">
            Rs.{" "}
            {totalSales.toLocaleString()}
          </p>
        </div>

        {/* AVERAGE */}

        <div className="min-w-0 rounded-lg bg-slate-50 p-3 sm:bg-transparent sm:p-0 sm:text-right">
          <p className="text-[11px] text-slate-400 sm:text-xs">
            Average / Day
          </p>

          <p className="mt-1 break-words text-sm font-bold text-slate-900 sm:text-base md:text-lg lg:text-xl">
            Rs.{" "}
            {averageSales.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}