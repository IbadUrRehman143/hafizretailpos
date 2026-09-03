"use client";

import { useEffect, useMemo, useState } from "react";

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

  const ITEMS_PER_PAGE = 10;

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        products.length /
          ITEMS_PER_PAGE
      )
    );

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedProducts =
    useMemo(
      () => {
        const start =
          (currentPage - 1) *
          ITEMS_PER_PAGE;

        return products.slice(
          start,
          start +
            ITEMS_PER_PAGE
        );
      },
      [
        products,
        currentPage,
      ]
    );

  const startProduct =
    products.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const endProduct =
    Math.min(
      currentPage *
        ITEMS_PER_PAGE,
      products.length
    );

  const weights = weightsProduct
    ? parseWeights(weightsProduct.weightEntries)
    : [];

  const totalWeight = weights.reduce(
    (total, weight) => total + weight,
    0
  );

  return (
    <>
      {/* ================================================
          MOBILE / TABLET PRODUCT CARDS
      ================================================ */}

      <div className="space-y-3 lg:hidden">

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-14 text-center shadow-sm">
            <p className="font-semibold text-slate-600">
              Loading products...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-14 text-center text-sm text-slate-500 shadow-sm">
            No products found.
          </div>
        ) : (
          paginatedProducts.map(
            (product) => {
              const stock =
                getStock(
                  product
                );

              const isWeight =
                product.type ===
                "weight";

              return (
                <div
                  key={product.id}
                  className={`w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
                    product.status ===
                    "Archived"
                      ? "opacity-75"
                      : ""
                  }`}
                >
                  {/* TOP */}

                  <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 p-3.5">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-slate-900">
                        {product.name}
                      </h3>

                      {(product.brand ||
                        product.model) && (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {product.brand}

                          {product.brand &&
                          product.model
                            ? " • "
                            : ""}

                          {product.model}
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        product.status ===
                        "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>

                  {/* CATEGORY */}

                  <div className="border-b border-slate-100 px-3.5 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Category
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {product.categoryName ||
                        "Other"}
                    </p>

                    <p className="mt-1 truncate text-xs text-blue-600">
                      {product.subcategoryName ||
                        "No subcategory"}
                    </p>
                  </div>

                  {/* PRODUCT INFO */}

                  <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">

                    <InfoCard
                      label="Type"
                      value={
                        getTypeLabel(
                          product.type
                        )
                      }
                    />

                    <InfoCard
                      label="Stock"
                      value={
                        isWeight
                          ? `${stock.toFixed(
                              2
                            )} KG`
                          : `${stock} ${product.unit}`
                      }
                    />

                    <InfoCard
                      label={
                        isWeight
                          ? "Bundles"
                          : "Quantity"
                      }
                      value={
                        isWeight
                          ? String(
                              getWeightQuantity(
                                product
                              )
                            )
                          : `${product.quantity} PCS`
                      }
                    />

                    <InfoCard
                      label="Purchase"
                      value={`Rs. ${Number(
                        product.purchasePrice
                      ).toLocaleString(
                        "en-PK"
                      )}`}
                    />

                    <InfoCard
                      label="Selling"
                      value={`Rs. ${Number(
                        product.sellingPrice
                      ).toLocaleString(
                        "en-PK"
                      )}`}
                    />

                    <InfoCard
                      label="Details"
                      value={
                        product.quality ||
                        product.size ||
                        product.color ||
                        "-"
                      }
                    />

                  </div>

                  {/* WEIGHTS */}

                  {isWeight &&
                    product.weightEntries && (
                      <div className="border-t border-slate-100 px-3 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setWeightsProduct(
                              product
                            )
                          }
                          className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          View Bundle Weights
                        </button>
                      </div>
                    )}

                  {/* ACTIONS */}

                  <div className="border-t border-slate-100 p-3">
                    {product.status ===
                    "Active" ? (
                      <div className="grid grid-cols-2 gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            onEdit(
                              product
                            )
                          }
                          className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
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
                          className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId ===
                          product.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>

                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onRestore(
                            product
                          )
                        }
                        className="min-h-10 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              );
            }
          )
        )}

      </div>

      {/* ================================================
          LAPTOP / DESKTOP TABLE
      ================================================ */}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1050px]">
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
              ) : products.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-14 text-center text-sm text-slate-500"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(
                  (product) => {
                    const stock =
                      getStock(
                        product
                      );

                    return (
                      <tr
                        key={
                          product.id
                        }
                        className={
                          product.status ===
                          "Archived"
                            ? "bg-slate-50 opacity-75"
                            : "hover:bg-slate-50"
                        }
                      >
                        <td className="px-4 py-4">
                          <div className="max-w-[180px]">
                            <div className="truncate font-semibold text-slate-900">
                              {
                                product.name
                              }
                            </div>

                            {(product.brand ||
                              product.model) && (
                              <div className="mt-1 truncate text-xs text-slate-500">
                                {
                                  product.brand
                                }

                                {product.brand &&
                                product.model
                                  ? " • "
                                  : ""}

                                {
                                  product.model
                                }
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="max-w-[150px]">
                            <div className="truncate text-sm font-semibold text-slate-700">
                              {product.categoryName ||
                                "Other"}
                            </div>

                            <div className="mt-1 truncate text-xs text-blue-600">
                              {product.subcategoryName ||
                                "No subcategory"}
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              product.status ===
                              "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {
                              product.status
                            }
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                            {getTypeLabel(
                              product.type
                            )}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
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

                        <td className="whitespace-nowrap px-4 py-4">
                          {product.type ===
                          "weight" ? (
                            <>
                              <div className="font-bold text-blue-700">
                                {getWeightQuantity(
                                  product
                                )}
                              </div>

                              <div className="text-xs text-slate-500">
                                Bundles
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-bold">
                                {
                                  product.quantity
                                }
                              </div>

                              <div className="text-xs text-slate-500">
                                PCS
                              </div>
                            </>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                          Rs.{" "}
                          {Number(
                            product.purchasePrice
                          ).toLocaleString(
                            "en-PK"
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-900">
                          Rs.{" "}
                          {Number(
                            product.sellingPrice
                          ).toLocaleString(
                            "en-PK"
                          )}
                        </td>

                        <td className="px-4 py-4 text-xs text-slate-500">
                          <div className="max-w-[160px]">
                            {product.type ===
                              "weight" &&
                              product.weightEntries && (
                                <div>
                                  <div className="font-semibold text-slate-700">
                                    {getWeightQuantity(
                                      product
                                    )}{" "}
                                    Bundles
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setWeightsProduct(
                                        product
                                      )
                                    }
                                    className="mt-1 text-xs font-semibold text-blue-600 hover:underline"
                                  >
                                    View Weights
                                  </button>
                                </div>
                              )}

                            {product.quality && (
                              <div className="mt-1 truncate">
                                Quality:{" "}
                                {
                                  product.quality
                                }
                              </div>
                            )}

                            {product.size && (
                              <div className="mt-1 truncate">
                                Size:{" "}
                                {
                                  product.size
                                }
                              </div>
                            )}

                            {product.color && (
                              <div className="mt-1 truncate">
                                Color:{" "}
                                {
                                  product.color
                                }
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex gap-2">
                            {product.status ===
                            "Active" ? (
                              <>
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
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  onRestore(
                                    product
                                  )
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
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================
          PAGINATION
      ================================================ */}

      {!loading &&
        products.length >
          0 && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">

            <p className="text-center text-xs text-slate-500 sm:text-left">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {startProduct}
              </span>
              {" - "}
              <span className="font-semibold text-slate-700">
                {endProduct}
              </span>
              {" of "}
              <span className="font-semibold text-slate-700">
                {products.length}
              </span>
              {" products"}
            </p>

            <div className="flex items-center justify-center gap-2">

              <button
                type="button"
                disabled={
                  currentPage ===
                  1
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        1,
                        page - 1
                      )
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <div className="min-w-24 rounded-lg bg-slate-100 px-3 py-2 text-center text-xs font-bold text-slate-700">
                Page{" "}
                {
                  currentPage
                }
                {" / "}
                {
                  totalPages
                }
              </div>

              <button
                type="button"
                disabled={
                  currentPage ===
                  totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        totalPages,
                        page + 1
                      )
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>

            </div>

          </div>
        )}

      {/* ================================================
          BUNDLE WEIGHT POPUP
      ================================================ */}

      {weightsProduct && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
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

            <div className="max-h-[70vh] overflow-y-auto p-3 sm:p-5">
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

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
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