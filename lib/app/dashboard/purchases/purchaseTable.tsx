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

  onPaySupplier: (
    purchase: Purchase
  ) => void;

  onEdit: (
    purchase: Purchase
  ) => void;

  onDelete: (
    purchase: Purchase
  ) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px]">
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
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-14 text-center text-sm text-slate-500"
                >
                  Loading purchases...
                </td>
              </tr>
            ) : purchases.length ===
              0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-14 text-center text-sm text-slate-500"
                >
                  No purchases found.
                </td>
              </tr>
            ) : (
              purchases.map(
                (purchase) => {
                  const item =
                    purchase.items[0];

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
                      key={
                        purchase.id
                      }
                      className="transition hover:bg-slate-50"
                    >
                      {/* PURCHASE */}

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {
                            purchase.invoiceNo
                          }
                        </span>
                      </td>

                      {/* DATE */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {purchase.date}
                      </td>

                      {/* SUPPLIER */}

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {
                            purchase.supplierName
                          }
                        </p>

                        {purchase.supplierPhone && (
                          <p className="mt-1 text-xs text-slate-500">
                            {
                              purchase.supplierPhone
                            }
                          </p>
                        )}
                      </td>

                      {/* PRODUCT */}

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {item
                            ? item.productName
                            : "-"}
                        </p>
                      </td>

                      {/* QUANTITY */}

                      <td className="px-5 py-4">
                        {item ? (
                          <>
                            <p className="font-semibold text-slate-900">
                              {item.quantity.toLocaleString(
                                "en-PK",
                                {
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </p>

                            <p className="text-xs text-slate-500">
                              {
                                item.unit
                              }
                            </p>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* TOTAL */}

                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(
                          purchase.subtotal
                        )}
                      </td>

                      {/* PAID */}

                      <td className="px-5 py-4 text-sm font-semibold text-emerald-600">
                        {formatCurrency(
                          purchase.paidAmount
                        )}
                      </td>

                      {/* PAYABLE */}

                      <td className="px-5 py-4">
                        <p
                          className={`text-sm font-semibold ${
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
                          <p className="mt-1 text-[11px] font-medium text-emerald-600">
                            Fully Paid
                          </p>
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            purchase.status
                          }
                        />
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {/* PAY SUPPLIER */}

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
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isPaying
                                ? "Paying..."
                                : "Pay Supplier"}
                            </button>
                          )}

                          {/* EDIT */}

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
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Edit
                          </button>

                          {/* DELETE */}

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
                            className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}