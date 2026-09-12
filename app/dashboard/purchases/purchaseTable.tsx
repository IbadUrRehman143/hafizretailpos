import type { Purchase } from "./purchaseTypes";
import { formatCurrency } from "./purchaseUtils";
import {
  StatusBadge,
  TableHead,
} from "./purchaseUi";

export default function PurchaseTable({
  purchases,
  loading,
  deletingId,
  payingId,
  onPaySupplier,
  onEdit,
  onDelete,
}: {
  purchases: Purchase[];
  loading: boolean;
  deletingId: number | null;
  payingId: number | null;

  onPaySupplier: (purchase: Purchase) => void;
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchase: Purchase) => void;
}) {
  const safePurchases = Array.isArray(purchases)
    ? purchases
    : [];

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
        Loading purchases...
      </div>
    );
  }

  if (safePurchases.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
        No purchases found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* MOBILE / TABLET */}
      <div className="divide-y divide-slate-100 xl:hidden">
        {safePurchases.map((purchase) => {
          const item = purchase.items?.[0];

          const hasPayable =
            Number(purchase.remainingAmount) > 0;

          const isPaying =
            payingId === purchase.id;

          const isDeleting =
            deletingId === purchase.id;

          return (
            <div
              key={purchase.id}
              className="p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex max-w-full break-all rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {purchase.invoiceNo}
                    </span>

                    <p className="mt-2 text-xs text-slate-500">
                      {purchase.date}
                    </p>
                  </div>

                  <StatusBadge
                    status={purchase.status}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoCard
                    label="Supplier"
                    value={
                      purchase.supplierName || "-"
                    }
                    subValue={
                      purchase.supplierPhone ||
                      undefined
                    }
                  />

                  <InfoCard
                    label="Product"
                    value={
                      item?.productName || "-"
                    }
                  />

                  <InfoCard
                    label="Quantity"
                    value={
                      item
                        ? Number(
                            item.quantity
                          ).toLocaleString(
                            "en-PK",
                            {
                              maximumFractionDigits: 2,
                            }
                          )
                        : "-"
                    }
                    subValue={
                      item?.unit || undefined
                    }
                  />

                  <InfoCard
                    label="Total"
                    value={formatCurrency(
                      purchase.subtotal
                    )}
                  />

                  <InfoCard
                    label="Paid"
                    value={formatCurrency(
                      purchase.paidAmount
                    )}
                    valueClassName="text-emerald-600"
                  />

                  <InfoCard
                    label="Payable"
                    value={formatCurrency(
                      purchase.remainingAmount
                    )}
                    subValue={
                      !hasPayable
                        ? "Fully Paid"
                        : undefined
                    }
                    valueClassName={
                      hasPayable
                        ? "text-red-600"
                        : "text-emerald-600"
                    }
                    subValueClassName={
                      !hasPayable
                        ? "text-emerald-600"
                        : undefined
                    }
                  />
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap">
                  {hasPayable && (
                    <button
                      type="button"
                      disabled={
                        isPaying ||
                        isDeleting
                      }
                      onClick={() =>
                        onPaySupplier(
                          purchase
                        )
                      }
                      className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {isPaying
                        ? "Paying..."
                        : "Pay Supplier"}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={
                      isPaying ||
                      isDeleting
                    }
                    onClick={() =>
                      onEdit(purchase)
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={
                      isDeleting ||
                      isPaying
                    }
                    onClick={() =>
                      onDelete(purchase)
                    }
                    className="w-full rounded-lg border border-red-100 px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isDeleting
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE - NO INTERNAL HORIZONTAL SCROLL */}
      <div className="hidden xl:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[9%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
            <col className="w-[7%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[12%]" />
          </colgroup>

          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <TableHead>
                Purchase
              </TableHead>

              <TableHead>
                Date
              </TableHead>

              <TableHead>
                Supplier
              </TableHead>

              <TableHead>
                Product
              </TableHead>

              <TableHead>
                Qty
              </TableHead>

              <TableHead>
                Total
              </TableHead>

              <TableHead>
                Paid
              </TableHead>

              <TableHead>
                Payable
              </TableHead>

              <TableHead>
                Status
              </TableHead>

              <TableHead>
                Actions
              </TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {safePurchases.map(
              (purchase) => {
                const item =
                  purchase.items?.[0];

                const hasPayable =
                  Number(
                    purchase.remainingAmount
                  ) > 0;

                const isPaying =
                  payingId ===
                  purchase.id;

                const isDeleting =
                  deletingId ===
                  purchase.id;

                return (
                  <tr
                    key={purchase.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="break-words px-2.5 py-4 align-top">
                      <span className="inline-flex max-w-full break-all rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                        {purchase.invoiceNo}
                      </span>
                    </td>

                    <td className="break-words px-2.5 py-4 align-top text-xs text-slate-600">
                      {purchase.date}
                    </td>

                    <td className="min-w-0 px-2.5 py-4 align-top">
                      <p className="break-words text-xs font-semibold text-slate-900">
                        {purchase.supplierName ||
                          "-"}
                      </p>

                      {purchase.supplierPhone && (
                        <p className="mt-1 break-all text-[11px] text-slate-500">
                          {
                            purchase.supplierPhone
                          }
                        </p>
                      )}
                    </td>

                    <td className="min-w-0 px-2.5 py-4 align-top">
                      <p className="break-words text-xs font-medium text-slate-800">
                        {item?.productName ||
                          "-"}
                      </p>
                    </td>

                    <td className="px-2.5 py-4 align-top">
                      {item ? (
                        <>
                          <p className="text-xs font-semibold text-slate-900">
                            {Number(
                              item.quantity
                            ).toLocaleString(
                              "en-PK",
                              {
                                maximumFractionDigits: 2,
                              }
                            )}
                          </p>

                          <p className="text-[11px] text-slate-500">
                            {item.unit}
                          </p>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="break-words px-2.5 py-4 align-top text-xs font-semibold text-slate-900">
                      {formatCurrency(
                        purchase.subtotal
                      )}
                    </td>

                    <td className="break-words px-2.5 py-4 align-top text-xs font-semibold text-emerald-600">
                      {formatCurrency(
                        purchase.paidAmount
                      )}
                    </td>

                    <td className="px-2.5 py-4 align-top">
                      <p
                        className={`break-words text-xs font-semibold ${
                          hasPayable
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {formatCurrency(
                          purchase.remainingAmount
                        )}
                      </p>

                      {!hasPayable && (
                        <p className="mt-1 text-[10px] font-medium text-emerald-600">
                          Fully Paid
                        </p>
                      )}
                    </td>

                    <td className="px-2.5 py-4 align-top">
                      <StatusBadge
                        status={
                          purchase.status
                        }
                      />
                    </td>

                    <td className="px-2.5 py-4 align-top">
                      <div className="flex flex-col gap-1.5">
                        {hasPayable && (
                          <button
                            type="button"
                            disabled={
                              isPaying ||
                              isDeleting
                            }
                            onClick={() =>
                              onPaySupplier(
                                purchase
                              )
                            }
                            className="w-full rounded-lg bg-emerald-600 px-2 py-2 text-[10px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isPaying
                              ? "Paying..."
                              : "Pay Supplier"}
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={
                            isPaying ||
                            isDeleting
                          }
                          onClick={() =>
                            onEdit(
                              purchase
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 px-2 py-2 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={
                            isDeleting ||
                            isPaying
                          }
                          onClick={() =>
                            onDelete(
                              purchase
                            )
                          }
                          className="w-full rounded-lg border border-red-100 px-2 py-2 text-[10px] font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isDeleting
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  subValue,
  valueClassName = "text-slate-900",
  subValueClassName = "text-slate-500",
}: {
  label: string;
  value: string;
  subValue?: string;
  valueClassName?: string;
  subValueClassName?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-semibold ${valueClassName}`}
      >
        {value}
      </p>

      {subValue && (
        <p
          className={`mt-1 break-all text-xs ${subValueClassName}`}
        >
          {subValue}
        </p>
      )}
    </div>
  );
}