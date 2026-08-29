"use client";

import type {
  Product,
} from "./productTypes";

import {
  getStock,
  getTypeLabel,
  getWeightQuantity,
} from "./productUtils";

type Props = {
  products: Product[];
  loading: boolean;
  deletingId: number | null;

  onEdit: (
    product: Product
  ) => void;

  onDelete: (
    id: number
  ) => void;
};

export default function ProductTable({
  products,
  loading,
  deletingId,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="overflow-x-auto">

        <table className="w-full min-w-275">

          <thead className="border-b border-slate-200 bg-slate-50">

            <tr>
              <TableHead>
                Product
              </TableHead>

              <TableHead>
                Category
              </TableHead>

              <TableHead>
                Type
              </TableHead>

              <TableHead>
                Stock
              </TableHead>

              <TableHead>
                Quantity
              </TableHead>

              <TableHead>
                Purchase
              </TableHead>

              <TableHead>
                Selling
              </TableHead>

              <TableHead>
                Details
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
                  colSpan={9}
                  className="px-6 py-14 text-center"
                >
                  <p className="font-semibold text-slate-600">
                    Loading products...
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Reading from PostgreSQL
                  </p>
                </td>
              </tr>

            ) : products.length === 0 ? (

              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-14 text-center text-sm text-slate-500"
                >
                  No products found.
                </td>
              </tr>

            ) : (

              products.map(
                (product) => {

                  const stock =
                    getStock(product);

                  return (
                    <tr
                      key={
                        product.id
                      }
                      className="hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">

                        <div className="font-semibold text-slate-900">
                          {product.name}
                        </div>

                        {product.brand && (
                          <div className="mt-1 text-xs text-slate-500">

                            {product.brand}

                            {product.model
                              ? ` • ${product.model}`
                              : ""}

                          </div>
                        )}

                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {product.category}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            product.type ===
                            "weight"
                              ? "bg-blue-50 text-blue-700"
                              : product.type ===
                                "size"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {getTypeLabel(
                            product.type
                          )}
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <div className="font-bold text-slate-900">

                          {product.type ===
                          "weight"
                            ? stock.toFixed(
                                2
                              )
                            : stock}

                        </div>

                        <div className="text-xs text-slate-500">

                          {product.type ===
                          "weight"
                            ? "KG"
                            : product.unit}

                        </div>

                      </td>

                      <td className="px-5 py-4">

                        {product.type ===
                        "weight" ? (

                          <>
                            <div className="font-bold text-blue-700">
                              {getWeightQuantity(
                                product
                              )}
                            </div>

                            <div className="text-xs text-slate-500">
                              Weight Entries
                            </div>
                          </>

                        ) : (

                          <>
                            <div className="font-bold">
                              {product.quantity}
                            </div>

                            <div className="text-xs text-slate-500">
                              PCS
                            </div>
                          </>

                        )}

                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">

                        Rs.{" "}

                        {Number(
                          product.purchasePrice
                        ).toLocaleString(
                          "en-PK"
                        )}

                      </td>

                      <td className="px-5 py-4 text-sm font-semibold">

                        Rs.{" "}

                        {Number(
                          product.sellingPrice
                        ).toLocaleString(
                          "en-PK"
                        )}

                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">

                        {product.type ===
                          "weight" &&
                          product.weightEntries && (
                            <div>
                              Weight:{" "}
                              {
                                product.weightEntries
                              }
                            </div>
                          )}

                        {product.quality && (
                          <div>
                            Quality:{" "}
                            {product.quality}
                          </div>
                        )}

                        {product.size && (
                          <div>
                            Size:{" "}
                            {product.size}
                          </div>
                        )}

                        {product.material && (
                          <div>
                            Material:{" "}
                            {product.material}
                          </div>
                        )}

                        {product.color && (
                          <div>
                            Color:{" "}
                            {product.color}
                          </div>
                        )}

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              onEdit(
                                product
                              )
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingId ===
                              product.id
                            }
                            onClick={() =>
                              onDelete(
                                product.id
                              )
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId ===
                            product.id
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

function TableHead({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}