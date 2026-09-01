"use client";

import { useState } from "react";

import type { Product } from "./productTypes";

import {
  getStock,
  getTypeLabel,
  getWeightQuantity,
  parseWeights,
} from "./productUtils";

type Props = {
  products: Product[];
  loading: boolean;
  deletingId: number | null;

  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  onRestore: (product: Product) => void;
};

export default function ProductTable({
  products,
  loading,
  deletingId,
  onEdit,
  onDelete,
  onRestore,
}: Props) {
  const [weightsProduct, setWeightsProduct] =
    useState<Product | null>(null);

  const weights = weightsProduct
    ? parseWeights(weightsProduct.weightEntries)
    : [];

  const totalWeight = weights.reduce(
    (total, weight) => total + weight,
    0
  );

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-295">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Purchase</TableHead>
                <TableHead>Selling</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Actions</TableHead>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-14 text-center"
                  >
                    <p className="font-semibold text-slate-600">
                      Loading products...
                    </p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-14 text-center text-sm text-slate-500"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const stock = getStock(product);

                  return (
                    <tr
                      key={product.id}
                      className={
                        product.status === "Archived"
                          ? "bg-slate-50 opacity-75"
                          : "hover:bg-slate-50"
                      }
                    >
                      {/* PRODUCT */}

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {product.name}
                        </div>

                        {(product.brand || product.model) && (
                          <div className="mt-1 text-xs text-slate-500">
                            {product.brand}

                            {product.brand && product.model
                              ? " • "
                              : ""}

                            {product.model}
                          </div>
                        )}
                      </td>

                      {/* CATEGORY + SUBCATEGORY */}

                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-slate-700">
                          {product.categoryName || "Other"}
                        </div>

                        {product.subcategoryName ? (
                          <div className="mt-1 text-xs text-blue-600">
                            {product.subcategoryName}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-slate-400">
                            No subcategory
                          </div>
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            product.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>

                      {/* TYPE */}

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                          {getTypeLabel(product.type)}
                        </span>
                      </td>

                      {/* STOCK */}

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">
                          {product.type === "weight"
                            ? stock.toFixed(2)
                            : stock}
                        </div>

                        <div className="text-xs text-slate-500">
                          {product.type === "weight"
                            ? "KG"
                            : product.unit}
                        </div>
                      </td>

                      {/* QUANTITY */}

                      <td className="px-5 py-4">
                        {product.type === "weight" ? (
                          <>
                            <div className="font-bold text-blue-700">
                              {getWeightQuantity(product)}
                            </div>

                            <div className="text-xs text-slate-500">
                              Bundles
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

                      {/* PURCHASE */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        Rs.{" "}
                        {Number(
                          product.purchasePrice
                        ).toLocaleString("en-PK")}
                      </td>

                      {/* SELLING */}

                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        Rs.{" "}
                        {Number(
                          product.sellingPrice
                        ).toLocaleString("en-PK")}
                      </td>

                      {/* DETAILS */}

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {product.type === "weight" &&
                          product.weightEntries && (
                            <div className="min-w-32">
                              <div className="font-semibold text-slate-700">
                                {getWeightQuantity(product)} Bundles
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setWeightsProduct(product)
                                }
                                className="mt-1 text-xs font-semibold text-blue-600 hover:underline"
                              >
                                View Weights
                              </button>
                            </div>
                          )}

                        {product.quality && (
                          <div className="mt-1">
                            Quality: {product.quality}
                          </div>
                        )}

                        {product.size && (
                          <div className="mt-1">
                            Size: {product.size}
                          </div>
                        )}

                        {product.color && (
                          <div className="mt-1">
                            Color: {product.color}
                          </div>
                        )}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {product.status === "Active" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onEdit(product)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-100"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingId === product.id
                                }
                                onClick={() =>
                                  onDelete(product.id)
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingId === product.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                onRestore(product)
                              }
                              className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================
          BUNDLE WEIGHT POPUP
      ================================================ */}

      {weightsProduct && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="font-bold text-slate-900">
                  {weightsProduct.name} — Bundle Weights
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {weights.length} bundles •{" "}
                  {totalWeight.toFixed(2)} KG
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {weightsProduct.categoryName}

                  {weightsProduct.subcategoryName
                    ? ` → ${weightsProduct.subcategoryName}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setWeightsProduct(null)
                }
                className="h-9 w-9 rounded-full bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {weights.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
                  No bundle weights available.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {weights.map((weight, index) => (
                    <div
                      key={`${index}-${weight}`}
                      className="rounded-xl border bg-slate-50 px-3 py-3"
                    >
                      <div className="text-xs text-slate-400">
                        Bundle{" "}
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div className="mt-1 font-bold text-slate-900">
                        {weight} KG
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}