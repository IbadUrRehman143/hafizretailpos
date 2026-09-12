"use client";

import type { InventoryTransaction } from "./inventoryTypes";

function displayValue(value: unknown) {
  return value === null ||
    value === undefined
    ? ""
    : String(value);
}

export default function InventoryHistory({
  transactions,
  loading,
}: {
  transactions: InventoryTransaction[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Loading stock history...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}

      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <h2 className="font-bold text-slate-900">
          Stock History
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Purchase, sale, return, opening stock
          and manual adjustments.
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          No stock history found.
        </div>
      ) : (
        <>
          {/* =========================================
              MOBILE / TABLET
              NO INTERNAL SCROLL
          ========================================= */}

          <div className="divide-y divide-slate-100 md:hidden">
            {transactions.map(
              (transaction) => {
                const row =
                  transaction as unknown as Record<
                    string,
                    unknown
                  >;

                const product =
                  row.product &&
                  typeof row.product ===
                    "object"
                    ? (row.product as Record<
                        string,
                        unknown
                      >)
                    : null;

                const dateText =
                  row.createdAt
                    ? new Date(
                        String(
                          row.createdAt
                        )
                      ).toLocaleString(
                        "en-PK"
                      )
                    : "-";

                const productName =
                  displayValue(
                    row.productName
                  ) ||
                  displayValue(
                    product?.name
                  ) ||
                  `Product #${displayValue(
                    row.productId
                  )}`;

                const reference =
                  row.referenceType ||
                  row.referenceId
                    ? `${displayValue(
                        row.referenceType
                      )}${
                        row.referenceId
                          ? ` #${displayValue(
                              row.referenceId
                            )}`
                          : ""
                      }`
                    : "-";

                return (
                  <div
                    key={displayValue(
                      row.id
                    )}
                    className="p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="wrap-break-word font-bold text-slate-900">
                          {productName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {dateText}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {displayValue(
                          row.type
                        ) || "-"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <InfoBox
                        label="Quantity"
                        value={`${
                          displayValue(
                            row.quantity
                          ) || "0"
                        } ${
                          displayValue(
                            row.unit
                          ) || ""
                        }`}
                      />

                      <InfoBox
                        label="Reference"
                        value={reference}
                      />

                      <div className="sm:col-span-2">
                        <InfoBox
                          label="Note"
                          value={
                            displayValue(
                              row.note
                            ) || "-"
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* =========================================
              DESKTOP TABLE
              NO overflow-x-auto
              NO min-width
          ========================================= */}

          <div className="hidden md:block">
            <table className="w-full table-fixed">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="w-[15%] px-4 py-4">
                    Date
                  </th>

                  <th className="w-[20%] px-4 py-4">
                    Product
                  </th>

                  <th className="w-[12%] px-4 py-4">
                    Type
                  </th>

                  <th className="w-[13%] px-4 py-4">
                    Quantity
                  </th>

                  <th className="w-[18%] px-4 py-4">
                    Reference
                  </th>

                  <th className="w-[22%] px-4 py-4">
                    Note
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {transactions.map(
                  (transaction) => {
                    const row =
                      transaction as unknown as Record<
                        string,
                        unknown
                      >;

                    const product =
                      row.product &&
                      typeof row.product ===
                        "object"
                        ? (row.product as Record<
                            string,
                            unknown
                          >)
                        : null;

                    const dateText =
                      row.createdAt
                        ? new Date(
                            String(
                              row.createdAt
                            )
                          ).toLocaleString(
                            "en-PK"
                          )
                        : "-";

                    const productName =
                      displayValue(
                        row.productName
                      ) ||
                      displayValue(
                        product?.name
                      ) ||
                      `Product #${displayValue(
                        row.productId
                      )}`;

                    const reference =
                      row.referenceType ||
                      row.referenceId
                        ? `${displayValue(
                            row.referenceType
                          )}${
                            row.referenceId
                              ? ` #${displayValue(
                                  row.referenceId
                                )}`
                              : ""
                          }`
                        : "-";

                    return (
                      <tr
                        key={displayValue(
                          row.id
                        )}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="wrap-break-word px-4 py-4 text-sm text-slate-600">
                          {dateText}
                        </td>

                        <td className="wrap-break-word px-4 py-4 text-sm font-semibold text-slate-900">
                          {productName}
                        </td>

                        <td className="wrap-break-word px-4 py-4 text-sm text-slate-600">
                          {displayValue(
                            row.type
                          ) || "-"}
                        </td>

                        <td className="wrap-break-word px-4 py-4 text-sm font-semibold text-slate-900">
                          {displayValue(
                            row.quantity
                          )}{" "}
                          {displayValue(
                            row.unit
                          )}
                        </td>

                        <td className="wrap-break-word px-4 py-4 text-sm text-slate-600">
                          {reference}
                        </td>

                        <td className="wrap-break-word px-4 py-4 text-sm text-slate-600">
                          {displayValue(
                            row.note
                          ) || "-"}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}