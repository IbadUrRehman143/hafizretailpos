"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  PaymentMethod,
  Sale,
  SaleStatus,
} from "./page.tsx";

/* =====================================================
   TYPES
===================================================== */

type Props = {
  sale: Sale;

  onClose: () => void;

  onUpdated:
    () =>
      | void
      | Promise<void>;
};

type ProductType =
  | "weight"
  | "quantity"
  | "size";

type ApiProduct = {
  id?: number;

  name?: string;

  category?: string;

  type?: string;

  unit?: string;

  purchasePrice?: number;

  sellingPrice?: number;

  quantity?: number;

  weightEntries?: string;
};

type ProductOption = {
  id: number;

  name: string;

  type: ProductType;

  unit: string;

  sellingPrice: number;

  quantity: number;

  weightEntries: string;
};

type EditItem = {
  rowId: string;

  productId: number;

  productName: string;

  type: ProductType;

  unit: string;

  quantity: string;

  rate: string;

  discount: string;
};

/* =====================================================
   HELPERS
===================================================== */

function numberValue(
  value: unknown
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

function makeRowId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeProductType(
  value: unknown,
  unit?: unknown
): ProductType {
  const type =
    String(
      value || ""
    ).toLowerCase();

  if (
    type === "weight" ||
    String(
      unit || ""
    ).toUpperCase() ===
      "KG"
  ) {
    return "weight";
  }

  if (
    type === "size"
  ) {
    return "size";
  }

  return "quantity";
}

function calculateWeightStock(
  value: string
) {
  return String(
    value || ""
  )
    .split("+")
    .map(
      (item) =>
        Number(
          item.trim()
        )
    )
    .filter(
      (item) =>
        Number.isFinite(
          item
        ) &&
        item > 0
    )
    .reduce(
      (
        total,
        item
      ) =>
        total + item,
      0
    );
}

function currency(
  value: number
) {
  return `Rs. ${Number(
    value || 0
  ).toLocaleString(
    "en-PK",
    {
      maximumFractionDigits:
        2,
    }
  )}`;
}

async function getErrorMessage(
  response: Response
) {
  try {
    const data =
      (await response.json()) as {
        message?: string;
      };

    return (
      data.message ||
      "Something went wrong."
    );
  } catch {
    return "Something went wrong.";
  }
}

/* =====================================================
   COMPONENT
===================================================== */

export default function SaleModal({
  sale,
  onClose,
  onUpdated,
}: Props) {
  const [
    products,
    setProducts,
  ] =
    useState<ProductOption[]>(
      []
    );

  const [
    loadingProducts,
    setLoadingProducts,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    customerName,
    setCustomerName,
  ] =
    useState(
      sale.customerName || ""
    );

  const [
    customerPhone,
    setCustomerPhone,
  ] =
    useState(
      sale.customerPhone || ""
    );

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<PaymentMethod>(
      sale.paymentMethod ||
        "Cash"
    );

  const [
    paidAmount,
    setPaidAmount,
  ] =
    useState(
      String(
        sale.paidAmount || 0
      )
    );

  const [
    notes,
    setNotes,
  ] =
    useState(
      sale.notes || ""
    );

  const initialTaxRate =
    useMemo(
      () => {
        const base =
          Math.max(
            0,
            sale.subtotal -
              sale.discount
          );

        if (
          base <= 0 ||
          sale.tax <= 0
        ) {
          return 0;
        }

        return (
          sale.tax /
          base
        ) *
          100;
      },
      [
        sale,
      ]
    );

  const [
    taxRate,
    setTaxRate,
  ] =
    useState(
      String(
        Number(
          initialTaxRate.toFixed(
            2
          )
        )
      )
    );

  const [
    items,
    setItems,
  ] =
    useState<EditItem[]>(
      () =>
        sale.items.map(
          (
            item
          ) => {
            const gross =
              Math.max(
                0,
                item.quantity *
                  item.price
              );

            const itemDiscount =
              Math.max(
                0,
                gross -
                  item.total
              );

            return {
              rowId:
                makeRowId(),

              productId:
                item.productId,

              productName:
                item.productName,

              type:
                normalizeProductType(
                  undefined,
                  item.unit
                ),

              unit:
                item.unit,

              quantity:
                String(
                  item.quantity
                ),

              rate:
                String(
                  item.price
                ),

              discount:
                String(
                  Number(
                    itemDiscount.toFixed(
                      2
                    )
                  )
                ),
            };
          }
        )
    );

  /* =====================================================
     LOAD PRODUCTS
  ===================================================== */

  useEffect(() => {
    let mounted =
      true;

    async function loadProducts() {
      try {
        setLoadingProducts(
          true
        );

        setError("");

        const response =
          await fetch(
            "/api/products",
            {
              method:
                "GET",

              cache:
                "no-store",
            }
          );

        if (
          !response.ok
        ) {
          throw new Error(
            await getErrorMessage(
              response
            )
          );
        }

        const raw:
          unknown =
          await response.json();

        const source =
          Array.isArray(
            raw
          )
            ? raw
            : typeof raw ===
                  "object" &&
                raw !== null &&
                Array.isArray(
                  (
                    raw as {
                      products?: unknown;
                    }
                  ).products
                )
              ? (
                  raw as {
                    products:
                      unknown[];
                  }
                ).products
              : [];

        const clean =
          source
            .map(
              (
                value
              ) => {
                if (
                  typeof value !==
                    "object" ||
                  value ===
                    null
                ) {
                  return null;
                }

                const product =
                  value as ApiProduct;

                const id =
                  Number(
                    product.id
                  ) || 0;

                if (
                  id <= 0
                ) {
                  return null;
                }

                const type =
                  normalizeProductType(
                    product.type,
                    product.unit
                  );

                return {
                  id,

                  name:
                    String(
                      product.name ||
                        `Product ${id}`
                    ),

                  type,

                  unit:
                    type ===
                    "weight"
                      ? "KG"
                      : String(
                          product.unit ||
                            "PCS"
                        ),

                  sellingPrice:
                    Math.max(
                      0,
                      numberValue(
                        product.sellingPrice
                      )
                    ),

                  quantity:
                    Math.max(
                      0,
                      numberValue(
                        product.quantity
                      )
                    ),

                  weightEntries:
                    String(
                      product.weightEntries ||
                        ""
                    ),
                } satisfies ProductOption;
              }
            )
            .filter(
              (
                product
              ): product is ProductOption =>
                product !==
                null
            );

        if (
          mounted
        ) {
          setProducts(
            clean
          );
        }
      } catch (error) {
        console.error(
          "LOAD EDIT PRODUCTS ERROR:",
          error
        );

        if (
          mounted
        ) {
          setError(
            error instanceof
              Error
              ? error.message
              : "Unable to load products."
          );
        }
      } finally {
        if (
          mounted
        ) {
          setLoadingProducts(
            false
          );
        }
      }
    }

    void loadProducts();

    return () => {
      mounted =
        false;
    };
  }, []);

  /* =====================================================
     CALCULATIONS
  ===================================================== */

  const calculations =
    useMemo(
      () => {
        const itemRows =
          items.map(
            (
              item
            ) => {
              const quantity =
                Math.max(
                  0,
                  numberValue(
                    item.quantity
                  )
                );

              const rate =
                Math.max(
                  0,
                  numberValue(
                    item.rate
                  )
                );

              const discount =
                Math.max(
                  0,
                  numberValue(
                    item.discount
                  )
                );

              const gross =
                quantity *
                rate;

              const finalAmount =
                Math.max(
                  0,
                  gross -
                    discount
                );

              return {
                ...item,

                quantityNumber:
                  quantity,

                rateNumber:
                  rate,

                discountNumber:
                  discount,

                gross,

                finalAmount,
              };
            }
          );

        const subtotal =
          itemRows.reduce(
            (
              total,
              item
            ) =>
              total +
              item.gross,
            0
          );

        const discount =
          itemRows.reduce(
            (
              total,
              item
            ) =>
              total +
              item.discountNumber,
            0
          );

        const taxableBase =
          Math.max(
            0,
            subtotal -
              discount
          );

        const taxPercent =
          Math.max(
            0,
            numberValue(
              taxRate
            )
          );

        const tax =
          taxableBase *
          (taxPercent /
            100);

        const grandTotal =
          taxableBase +
          tax;

        const paid =
          Math.max(
            0,
            numberValue(
              paidAmount
            )
          );

        const remaining =
          Math.max(
            0,
            grandTotal -
              paid
          );

        const change =
          Math.max(
            0,
            paid -
              grandTotal
          );

        let status:
          SaleStatus =
          "Unpaid";

        if (
          grandTotal >
            0 &&
          paid >=
            grandTotal
        ) {
          status =
            "Paid";
        } else if (
          paid > 0
        ) {
          status =
            "Partial";
        }

        return {
          itemRows,

          subtotal,

          discount,

          taxableBase,

          taxPercent,

          tax,

          grandTotal,

          paid,

          remaining,

          change,

          status,
        };
      },
      [
        items,
        paidAmount,
        taxRate,
      ]
    );

  /* =====================================================
     ITEM ACTIONS
  ===================================================== */

  function updateItem(
    rowId: string,
    patch:
      Partial<EditItem>
  ) {
    setItems(
      (
        current
      ) =>
        current.map(
          (
            item
          ) =>
            item.rowId ===
            rowId
              ? {
                  ...item,
                  ...patch,
                }
              : item
        )
    );
  }

  function handleProductChange(
    rowId: string,
    productIdValue: string
  ) {
    const productId =
      Number(
        productIdValue
      );

    const product =
      products.find(
        (
          item
        ) =>
          item.id ===
          productId
      );

    if (
      !product
    ) {
      return;
    }

    updateItem(
      rowId,
      {
        productId:
          product.id,

        productName:
          product.name,

        type:
          product.type,

        unit:
          product.unit,

        rate:
          String(
            product.sellingPrice
          ),

        discount:
          "0",
      }
    );
  }

  function addItem() {
    const firstProduct =
      products[0];

    setItems(
      (
        current
      ) => [
        ...current,
        {
          rowId:
            makeRowId(),

          productId:
            firstProduct?.id ||
            0,

          productName:
            firstProduct?.name ||
            "",

          type:
            firstProduct?.type ||
            "quantity",

          unit:
            firstProduct?.unit ||
            "PCS",

          quantity:
            "",

          rate:
            firstProduct
              ? String(
                  firstProduct.sellingPrice
                )
              : "",

          discount:
            "0",
        },
      ]
    );
  }

  function removeItem(
    rowId: string
  ) {
    if (
      items.length <=
      1
    ) {
      alert(
        "Invoice must have at least one item."
      );

      return;
    }

    setItems(
      (
        current
      ) =>
        current.filter(
          (
            item
          ) =>
            item.rowId !==
            rowId
        )
    );
  }

  /* =====================================================
     SUBMIT
  ===================================================== */

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      saving
    ) {
      return;
    }

    setError("");

    const cleanName =
      customerName.trim();

    if (
      !cleanName
    ) {
      setError(
        "Customer name is required."
      );

      return;
    }

    if (
      items.length ===
      0
    ) {
      setError(
        "Invoice must contain at least one product."
      );

      return;
    }

    for (
      const item of
      calculations.itemRows
    ) {
      if (
        item.productId <=
        0
      ) {
        setError(
          "Please select product for every row."
        );

        return;
      }

      if (
        item.quantityNumber <=
        0
      ) {
        setError(
          `${item.productName || "Product"} quantity must be greater than 0.`
        );

        return;
      }

      if (
        item.rateNumber <=
        0
      ) {
        setError(
          `${item.productName || "Product"} selling price must be greater than 0.`
        );

        return;
      }

      if (
        item.discountNumber >
        item.gross
      ) {
        setError(
          `${item.productName || "Product"} discount cannot be greater than item amount.`
        );

        return;
      }
    }

    try {
      setSaving(
        true
      );

      const response =
        await fetch(
          `/api/invoices/${sale.id}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                customer: {
                  name:
                    cleanName,

                  phone:
                    customerPhone.trim(),

                  address:
                    "",
                },

                items:
                  calculations.itemRows.map(
                    (
                      item
                    ) => ({
                      productId:
                        item.productId,

                      name:
                        item.productName,

                      type:
                        item.type,

                      unit:
                        item.unit,

                      quantity:
                        item.quantityNumber,

                      weight:
                        item.type ===
                        "weight"
                          ? item.quantityNumber
                          : 0,

                      price:
                        item.rateNumber,

                      discount:
                        item.discountNumber,

                      total:
                        item.finalAmount,
                    })
                  ),

                paymentMethod,

                amountPaid:
                  calculations.paid,

                taxRate:
                  calculations.taxPercent,

                subtotal:
                  calculations.subtotal,

                discount:
                  calculations.discount,

                tax:
                  calculations.tax,

                grandTotal:
                  calculations.grandTotal,

                remaining:
                  calculations.remaining,

                change:
                  calculations.change,

                status:
                  calculations.status,

                notes,
              }),
          }
        );

      if (
        !response.ok
      ) {
        throw new Error(
          await getErrorMessage(
            response
          )
        );
      }

      const data =
        (await response.json()) as {
          message?: string;
        };

      alert(
        data.message ||
          `${sale.invoiceNo} updated successfully.`
      );

      await onUpdated();
    } catch (error) {
      console.error(
        "UPDATE SALE ERROR:",
        error
      );

      setError(
        error instanceof
          Error
          ? error.message
          : "Unable to update sale."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">

      <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-5 py-4 sm:px-6">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Edit Existing Invoice
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {sale.invoiceNo}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Stock will be restored and recalculated automatically when you save.
            </p>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
            className="h-10 w-10 rounded-full bg-slate-100 text-xl text-slate-700 disabled:opacity-50"
          >
            ×
          </button>

        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6 p-5 sm:p-6"
        >

          {error && (

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>

          )}

          {/* CUSTOMER */}

          <section className="rounded-2xl border border-slate-200 p-5">

            <h3 className="font-bold text-slate-900">
              Customer
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">

              <Input
                label="Customer Name"
                value={
                  customerName
                }
                onChange={
                  setCustomerName
                }
                placeholder="Customer name"
              />

              <Input
                label="Phone"
                value={
                  customerPhone
                }
                onChange={
                  setCustomerPhone
                }
                placeholder="Phone number"
              />

            </div>

          </section>

          {/* ITEMS */}

          <section className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h3 className="font-bold text-slate-900">
                  Invoice Items
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  You can edit, add or remove products.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  addItem
                }
                disabled={
                  loadingProducts ||
                  saving
                }
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                + Add Item
              </button>

            </div>

            {loadingProducts && (

              <div className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-500">
                Loading products...
              </div>

            )}

            <div className="mt-5 space-y-4">

              {calculations.itemRows.map(
                (
                  item,
                  index
                ) => {
                  const selectedProduct =
                    products.find(
                      (
                        product
                      ) =>
                        product.id ===
                        item.productId
                    );

                  const currentStock =
                    selectedProduct
                      ? selectedProduct.type ===
                        "weight"
                        ? calculateWeightStock(
                            selectedProduct.weightEntries
                          )
                        : selectedProduct.quantity
                      : 0;

                  return (
                    <div
                      key={
                        item.rowId
                      }
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >

                      <div className="mb-4 flex items-center justify-between">

                        <div>

                          <p className="text-sm font-bold text-slate-900">
                            Item {index + 1}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            Current stock:{" "}
                            {currentStock.toLocaleString(
                              "en-PK",
                              {
                                maximumFractionDigits:
                                  2,
                              }
                            )}{" "}
                            {selectedProduct?.unit ||
                              item.unit}
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(
                              item.rowId
                            )
                          }
                          disabled={
                            saving
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                        >
                          Remove
                        </button>

                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">

                        <Select
                          label="Product"
                          value={
                            String(
                              item.productId
                            )
                          }
                          onChange={(
                            value
                          ) =>
                            handleProductChange(
                              item.rowId,
                              value
                            )
                          }
                          disabled={
                            loadingProducts ||
                            saving
                          }
                          options={[
                            ...(!products.some(
                              (
                                product
                              ) =>
                                product.id ===
                                item.productId
                            ) &&
                            item.productId >
                              0
                              ? [
                                  {
                                    value:
                                      String(
                                        item.productId
                                      ),
                                    label:
                                      `${item.productName} (existing)`,
                                  },
                                ]
                              : []),

                            ...products.map(
                              (
                                product
                              ) => ({
                                value:
                                  String(
                                    product.id
                                  ),

                                label:
                                  `${product.name} (${product.unit})`,
                              })
                            ),
                          ]}
                        />

                        <Input
                          label={
                            item.type ===
                            "weight"
                              ? "Weight (KG)"
                              : `Quantity (${item.unit})`
                          }
                          type="number"
                          step="0.01"
                          value={
                            item.quantity
                          }
                          onChange={(
                            value
                          ) =>
                            updateItem(
                              item.rowId,
                              {
                                quantity:
                                  value,
                              }
                            )
                          }
                          disabled={
                            saving
                          }
                          placeholder="0"
                        />

                        <Input
                          label="Selling Price"
                          type="number"
                          step="0.01"
                          value={
                            item.rate
                          }
                          onChange={(
                            value
                          ) =>
                            updateItem(
                              item.rowId,
                              {
                                rate:
                                  value,
                              }
                            )
                          }
                          disabled={
                            saving
                          }
                          placeholder="0"
                        />

                        <Input
                          label="Discount"
                          type="number"
                          step="0.01"
                          value={
                            item.discount
                          }
                          onChange={(
                            value
                          ) =>
                            updateItem(
                              item.rowId,
                              {
                                discount:
                                  value,
                              }
                            )
                          }
                          disabled={
                            saving
                          }
                          placeholder="0"
                        />

                        <div>

                          <p className="mb-2 text-sm font-medium text-slate-700">
                            Final Amount
                          </p>

                          <div className="flex min-h-12 items-center rounded-xl bg-slate-50 px-4 font-bold text-slate-900">
                            {currency(
                              item.finalAmount
                            )}
                          </div>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </section>

          {/* PAYMENT */}

          <section className="rounded-2xl border border-orange-200 bg-orange-50/30 p-5">

            <h3 className="font-bold text-slate-900">
              Payment & Tax
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-3">

              <Input
                label="Tax Rate (%)"
                type="number"
                step="0.01"
                value={
                  taxRate
                }
                onChange={
                  setTaxRate
                }
                disabled={
                  saving
                }
                placeholder="0"
              />

              <Input
                label="Paid Amount"
                type="number"
                step="0.01"
                value={
                  paidAmount
                }
                onChange={
                  setPaidAmount
                }
                disabled={
                  saving
                }
                placeholder="0"
              />

              <Select
                label="Payment Method"
                value={
                  paymentMethod
                }
                onChange={(
                  value
                ) =>
                  setPaymentMethod(
                    value as PaymentMethod
                  )
                }
                disabled={
                  saving
                }
                options={[
                  {
                    value:
                      "Cash",
                    label:
                      "Cash",
                  },
                  {
                    value:
                      "Bank",
                    label:
                      "Bank",
                  },
                  {
                    value:
                      "Credit",
                    label:
                      "Credit",
                  },
                  {
                    value:
                      "Other",
                    label:
                      "Other",
                  },
                ]}
              />

            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <SummaryCard
                label="Subtotal"
                value={
                  currency(
                    calculations.subtotal
                  )
                }
              />

              <SummaryCard
                label="Discount"
                value={
                  currency(
                    calculations.discount
                  )
                }
              />

              <SummaryCard
                label="Tax"
                value={
                  currency(
                    calculations.tax
                  )
                }
              />

              <SummaryCard
                label="Grand Total"
                value={
                  currency(
                    calculations.grandTotal
                  )
                }
                strong
              />

              <SummaryCard
                label="Paid"
                value={
                  currency(
                    calculations.paid
                  )
                }
              />

              <SummaryCard
                label="Remaining"
                value={
                  currency(
                    calculations.remaining
                  )
                }
              />

              <SummaryCard
                label="Change"
                value={
                  currency(
                    calculations.change
                  )
                }
              />

              <SummaryCard
                label="Status"
                value={
                  calculations.status
                }
                strong
              />

            </div>

          </section>

          {/* NOTES */}

          <section className="rounded-2xl border border-slate-200 p-5">

            <label className="block">

              <span className="text-sm font-medium text-slate-700">
                Notes
              </span>

              <textarea
                value={
                  notes
                }
                onChange={(
                  event
                ) =>
                  setNotes(
                    event.target.value
                  )
                }
                rows={3}
                disabled={
                  saving
                }
                placeholder="Optional notes..."
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
              />

            </label>

          </section>

          {/* ACTIONS */}

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t bg-white pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                loadingProducts
              }
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Updating Sale..."
                : "Update Sale"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

/* =====================================================
   INPUT
===================================================== */

function Input({
  label,
  value,
  onChange,
  type = "text",
  step,
  placeholder,
  disabled = false,
}: {
  label: string;

  value: string;

  onChange:
    (
      value: string
    ) => void;

  type?: string;

  step?: string;

  placeholder?: string;

  disabled?: boolean;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type={
          type
        }
        step={
          step
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        disabled={
          disabled
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
      />

    </label>
  );
}

/* =====================================================
   SELECT
===================================================== */

function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;

  value: string;

  onChange:
    (
      value: string
    ) => void;

  options: {
    value: string;
    label: string;
  }[];

  disabled?: boolean;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        disabled={
          disabled
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
      >

        <option value="">
          Select Product
        </option>

        {options.map(
          (
            option
          ) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}

      </select>

    </label>
  );
}

/* =====================================================
   SUMMARY
===================================================== */

function SummaryCard({
  label,
  value,
  strong = false,
}: {
  label: string;

  value: string;

  strong?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        strong
          ? "border-slate-300 bg-white"
          : "border-white bg-white/80"
      }`}
    >

      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 ${
          strong
            ? "text-lg font-bold text-slate-900"
            : "font-semibold text-slate-800"
        }`}
      >
        {value}
      </p>

    </div>
  );
}
