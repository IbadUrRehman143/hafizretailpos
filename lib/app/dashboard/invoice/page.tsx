"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import InvoiceItems from "./inoviceItems";
import InvoiceSummary from "./invoiceSummary";
import InvoicePrint from "./InvoicePrint";

import type {
  Customer,
  InvoiceItem,
  PaymentMethod,
  Product,
  ProductType,
} from "./invoiceTypes";

import {
  calculateInvoiceTotals,
  createEmptyInvoiceItem,
  getCurrentDate,
  getInvoiceStatus,
  getProductStock,
} from "./InvoiceUtils";

/* =========================================
   TYPES
========================================= */

type SaleType =
  | "RETAIL"
  | "WHOLESALE";

/* =========================================
   PRODUCT NORMALIZER
========================================= */

function normalizeProduct(
  value: unknown
): Product | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const raw =
    value as Record<
      string,
      unknown
    >;

  const rawType =
    raw.type;

  const type: ProductType =
    rawType === "weight" ||
    rawType === "quantity" ||
    rawType === "size"
      ? rawType
      : "quantity";

  return {
    id:
      Number(
        raw.id
      ) || 0,

    name:
      String(
        raw.name || ""
      ),

    category:
      String(
        raw.category ||
          "Other"
      ),

    type,

    unit:
      type === "weight"
        ? "KG"
        : String(
            raw.unit ||
              "PCS"
          ),

    purchasePrice:
      Number(
        raw.purchasePrice
      ) || 0,

    sellingPrice:
      Number(
        raw.sellingPrice
      ) || 0,

    quantity:
      type === "weight"
        ? 0
        : Math.max(
            0,
            Number(
              raw.quantity
            ) || 0
          ),

    weightEntries:
      type === "weight"
        ? String(
            raw.weightEntries ||
              ""
          )
        : "",

    size:
      String(
        raw.size || ""
      ),

    material:
      String(
        raw.material ||
          ""
      ),

    brand:
      String(
        raw.brand || ""
      ),

    model:
      String(
        raw.model || ""
      ),

    quality:
      String(
        raw.quality ||
          ""
      ),

    color:
      String(
        raw.color || ""
      ),
  };
}

/* =========================================
   HELPERS
========================================= */

async function getErrorMessage(
  response: Response
) {
  try {
    const data =
      (await response.json()) as {
        message?: string;
        error?: string;
      };

    return (
      data.message ||
      data.error ||
      "Something went wrong."
    );
  } catch {
    return `Request failed (${response.status}).`;
  }
}

function cleanPhone(
  value: string
) {
  /*
   * Digits only
   * max 11
   */

  return value
    .replace(
      /\D/g,
      ""
    )
    .slice(
      0,
      11
    );
}

function validPhone(
  value: string
) {
  return /^\d{11}$/.test(
    value
  );
}

function safeNumber(
  value:
    | string
    | number
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

/* =========================================
   MAIN PAGE
========================================= */

export default function InvoicePage() {
  /* =========================================
     PRODUCTS
  ========================================= */

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      []
    );

  const [
    loadingProducts,
    setLoadingProducts,
  ] =
    useState(true);

  const [
    productError,
    setProductError,
  ] =
    useState("");

  /* =========================================
     INVOICE
  ========================================= */

  const [
    invoiceNumber,
    setInvoiceNumber,
  ] =
    useState(
      "AUTO"
    );

  const [
    invoiceDate,
    setInvoiceDate,
  ] =
    useState("");

  /* =========================================
     SALE TYPE
  ========================================= */

  const [
    saleType,
    setSaleType,
  ] =
    useState<SaleType>(
      "RETAIL"
    );

  /* =========================================
     CUSTOMER LINK
  ========================================= */

  const [
    customerId,
    setCustomerId,
  ] =
    useState<
      number | null
    >(null);

  const [
    customer,
    setCustomer,
  ] =
    useState<Customer>({
      name: "",
      phone: "",
      address: "",
    });

  /* =========================================
     ITEMS
  ========================================= */

  const [
    items,
    setItems,
  ] =
    useState<
      InvoiceItem[]
    >([]);

  /* =========================================
     PAYMENT

     String use kiya hai
     taa-ke blank field detect ho.
  ========================================= */

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<PaymentMethod>(
      "Cash"
    );

  const [
    amountPaid,
    setAmountPaid,
  ] =
    useState("");

  const [
    taxRate,
    setTaxRate,
  ] =
    useState("0");

  /* =========================================
     NOTES
  ========================================= */

  const [
    notes,
    setNotes,
  ] =
    useState("");

  /* =========================================
     SAVE
  ========================================= */

  const [
    invoiceSaved,
    setInvoiceSaved,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  /* =========================================
     INITIAL PAGE + URL

     /dashboard/invoice
       = RETAIL

     /dashboard/invoice?saleType=WHOLESALE
       = NEW WHOLESALE CUSTOMER

     Existing customer:
     ?saleType=WHOLESALE
     &customerId=12
     &customerName=Ali
     &customerPhone=03001234567
  ========================================= */

  useEffect(() => {
    setInvoiceNumber(
      "AUTO"
    );

    setInvoiceDate(
      getCurrentDate()
    );

    setItems([
      createEmptyInvoiceItem(),
    ]);

    setAmountPaid("");

    setTaxRate("0");

    const params =
      new URLSearchParams(
        window.location.search
      );

    const requestedSaleType =
      String(
        params.get(
          "saleType"
        ) || ""
      ).toUpperCase();

    if (
      requestedSaleType ===
      "WHOLESALE"
    ) {
      setSaleType(
        "WHOLESALE"
      );

      const id =
        Number(
          params.get(
            "customerId"
          )
        );

      if (
        Number.isInteger(
          id
        ) &&
        id > 0
      ) {
        setCustomerId(
          id
        );
      }

      const name =
        params.get(
          "customerName"
        );

      const phone =
        params.get(
          "customerPhone"
        );

      setCustomer({
        name:
          name || "",

        phone:
          cleanPhone(
            phone || ""
          ),

        address: "",
      });
    } else {
      setSaleType(
        "RETAIL"
      );

      setCustomerId(
        null
      );
    }
  }, []);

  /* =========================================
     LOAD PRODUCTS
  ========================================= */

  const loadProducts =
    useCallback(
      async () => {
        try {
          setLoadingProducts(
            true
          );

          setProductError("");

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

          const data:
            unknown =
            await response.json();

          if (
            !Array.isArray(
              data
            )
          ) {
            throw new Error(
              "Invalid products response."
            );
          }

          const cleanProducts =
            data
              .map(
                normalizeProduct
              )
              .filter(
                (
                  product
                ): product is Product =>
                  product !==
                    null &&
                  product.id >
                    0
              );

          setProducts(
            cleanProducts
          );
        } catch (error) {
          console.error(
            "LOAD PRODUCTS ERROR:",
            error
          );

          setProducts([]);

          setProductError(
            error instanceof
              Error
              ? error.message
              : "Unable to load products."
          );
        } finally {
          setLoadingProducts(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  /* =========================================
     NUMERIC VALUES
  ========================================= */

  const numericPaid =
    safeNumber(
      amountPaid
    );

  const numericTaxRate =
    safeNumber(
      taxRate
    );

  /* =========================================
     TOTALS
  ========================================= */

  const totals =
    useMemo(() => {
      return calculateInvoiceTotals(
        items,
        numericPaid,
        numericTaxRate
      );
    }, [
      items,
      numericPaid,
      numericTaxRate,
    ]);

  /* =========================================
     STATUS
  ========================================= */

  const status =
    useMemo(() => {
      return getInvoiceStatus(
        totals.grandTotal,
        numericPaid
      );
    }, [
      totals.grandTotal,
      numericPaid,
    ]);

  /* =========================================
     ADD ITEM
  ========================================= */

  function addItem() {
    if (
      invoiceSaved
    ) {
      return;
    }

    setItems(
      (
        current
      ) => [
        ...current,
        createEmptyInvoiceItem(),
      ]
    );
  }

  /* =========================================
     REQUIRED ITEM VALIDATION

     IMPORTANT:
     Ek bhi incomplete row ho
     to Save / Print block.
  ========================================= */

  function validateItemFields() {
    if (
      items.length ===
      0
    ) {
      alert(
        "At least one product is required."
      );

      return false;
    }

    for (
      let index = 0;
      index <
      items.length;
      index++
    ) {
      const item =
        items[index];

      const row =
        index + 1;

      /* PRODUCT */

      if (
        item.productId ===
        null
      ) {
        alert(
          `Row ${row}: Product is required.`
        );

        return false;
      }

      /* QUANTITY / KG */

      const quantity =
        item.type ===
        "weight"
          ? Number(
              item.weight
            )
          : Number(
              item.quantity
            );

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {
        alert(
          item.type ===
            "weight"
            ? `Row ${row}: KG / Weight is required.`
            : `Row ${row}: Quantity is required.`
        );

        return false;
      }

      /* RATE */

      const rate =
        Number(
          item.price
        );

      if (
        !Number.isFinite(
          rate
        ) ||
        rate <= 0
      ) {
        alert(
          `Row ${row}: Rate / Price is required.`
        );

        return false;
      }
    }

    return true;
  }

  /* =========================================
     GET VALID ITEMS
  ========================================= */

  function getValidItems() {
    return items.filter(
      (
        item
      ) =>
        item.productId !==
          null &&
        (
          item.type ===
          "weight"
            ? Number(
                item.weight
              ) >
              0
            : Number(
                item.quantity
              ) >
              0
        ) &&
        Number(
          item.price
        ) >
          0
    );
  }

  /* =========================================
     STOCK
  ========================================= */

  function validateStock() {
    const validItems =
      getValidItems();

    const soldMap =
      new Map<
        number,
        number
      >();

    for (
      const item of
      validItems
    ) {
      if (
        item.productId ===
        null
      ) {
        continue;
      }

      const sold =
        item.type ===
        "weight"
          ? Number(
              item.weight
            ) || 0
          : Number(
              item.quantity
            ) || 0;

      soldMap.set(
        item.productId,
        (
          soldMap.get(
            item.productId
          ) || 0
        ) + sold
      );
    }

    for (const [
      productId,
      soldAmount,
    ] of soldMap) {
      const product =
        products.find(
          (
            current
          ) =>
            current.id ===
            productId
        );

      if (!product) {
        alert(
          "Product not found."
        );

        return false;
      }

      const stock =
        getProductStock(
          product
        );

      if (
        soldAmount >
        stock
      ) {
        alert(
          `${product.name} has only ${Number(
            stock.toFixed(
              2
            )
          )} ${
            product.type ===
            "weight"
              ? "KG"
              : product.unit
          } available.`
        );

        return false;
      }
    }

    return true;
  }

  /* =========================================
     FINAL VALIDATION
  ========================================= */

  function validateInvoice() {
    /*
     * Saved invoice already
     * validated.
     */

    if (
      invoiceSaved
    ) {
      return true;
    }

    /* =====================================
       WHOLESALE CUSTOMER
    ===================================== */

    if (
      saleType ===
      "WHOLESALE"
    ) {
      if (
        !customer.name.trim()
      ) {
        alert(
          "Customer Name is required."
        );

        return false;
      }

      if (
        !customer.phone.trim()
      ) {
        alert(
          "Phone Number is required."
        );

        return false;
      }

      if (
        !validPhone(
          customer.phone
        )
      ) {
        alert(
          "Phone Number exactly 11 digits hona chahiye. Sirf numbers allowed hain."
        );

        return false;
      }
    }

    /* =====================================
       ITEMS
    ===================================== */

    if (
      !validateItemFields()
    ) {
      return false;
    }

    /* =====================================
       STOCK
    ===================================== */

    if (
      !validateStock()
    ) {
      return false;
    }

    /* =====================================
       PAYMENT METHOD
    ===================================== */

    if (
      !paymentMethod
    ) {
      alert(
        "Payment Method is required."
      );

      return false;
    }

    /* =====================================
       AMOUNT PAID REQUIRED
    ===================================== */

    if (
      amountPaid.trim() ===
      ""
    ) {
      alert(
        "Initial Paid Amount is required. Agar payment nahi mili to 0 enter karein."
      );

      return false;
    }

    if (
      numericPaid < 0
    ) {
      alert(
        "Paid Amount cannot be negative."
      );

      return false;
    }

    /*
     * Initial invoice par
     * overpayment nahi.
     *
     * Change later received
     * payment ke liye use
     * hoga.
     */

    if (
      numericPaid >
      totals.grandTotal
    ) {
      alert(
        "Paid Amount invoice Grand Total se zyada nahi ho sakta."
      );

      return false;
    }

    /* =====================================
       TAX REQUIRED
    ===================================== */

    if (
      taxRate.trim() ===
      ""
    ) {
      alert(
        "Tax field required hai. Tax nahi hai to 0 enter karein."
      );

      return false;
    }

    if (
      numericTaxRate <
      0
    ) {
      alert(
        "Tax rate cannot be negative."
      );

      return false;
    }

    /* =====================================
       GRAND TOTAL
    ===================================== */

    if (
      totals.grandTotal <=
      0
    ) {
      alert(
        "Invoice total must be greater than 0."
      );

      return false;
    }

    return true;
  }

  /* =========================================
     SAVE
  ========================================= */

  async function saveInvoice() {
    if (
      invoiceSaved
    ) {
      alert(
        "Invoice already saved."
      );

      return;
    }

    /*
     * Required field missing
     * = NO SAVE
     */

    if (
      !validateInvoice()
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      const validItems =
        getValidItems();

      const payload = {
        /*
         * FINAL BUSINESS TYPE
         */

        saleType,

        /*
         * Existing wholesale
         * customer ho to ID.
         *
         * New wholesale ho to null,
         * backend create karega.
         */

        customerId,

        customer: {
          name:
            customer.name.trim(),

          phone:
            customer.phone.trim(),

          address:
            customer.address.trim(),
        },

        items:
          validItems.map(
            (
              item
            ) => ({
              productId:
                item.productId as number,

              name:
                item.name,

              type:
                item.type,

              unit:
                item.unit,

              quantity:
                Number(
                  item.quantity
                ) || 0,

              weight:
                Number(
                  item.weight
                ) || 0,

              price:
                Number(
                  item.price
                ) || 0,

              discount:
                Number(
                  item.discount
                ) || 0,

              total:
                Number(
                  item.total
                ) || 0,
            })
          ),

        paymentMethod,

        /*
         * INITIAL PAYMENT
         */

        amountPaid:
          numericPaid,

        taxRate:
          numericTaxRate,

        subtotal:
          totals.subtotal,

        discount:
          totals.discount,

        tax:
          totals.tax,

        grandTotal:
          totals.grandTotal,

        remaining:
          Math.max(
            0,
            totals.grandTotal -
              numericPaid
          ),

        /*
         * IMPORTANT:
         *
         * Initial invoice
         * Change = ZERO.
         *
         * Sales → Receive Payment
         * latest later amount
         * changeAmount banayegi.
         */

        change:
          0,

        status,

        notes:
          notes.trim(),
      };

      const response =
        await fetch(
          "/api/invoices",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
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

          invoice?: {
            invoiceId?: number;

            invoiceNumber?: string;

            customerId?:
              | number
              | null;

            saleType?: string;

            status?: string;

            total?: number;

            paidAmount?: number;

            remainingBalance?: number;

            changeAmount?: number;
          };
        };

      /* FINAL SERIAL */

      if (
        data.invoice
          ?.invoiceNumber
      ) {
        setInvoiceNumber(
          data.invoice
            .invoiceNumber
        );
      }

      /* WHOLESALE CUSTOMER ID */

      if (
        data.invoice
          ?.customerId
      ) {
        setCustomerId(
          data.invoice
            .customerId
        );
      }

      /* LOCK */

      setInvoiceSaved(
        true
      );

      /*
       * DO NOT reload
       * current stock snapshot.
       */

      alert(
        data.message ||
          (
            saleType ===
            "WHOLESALE"
              ? "Wholesale invoice saved. Customer and Sales updated."
              : "Invoice saved successfully."
          )
      );
    } catch (error) {
      console.error(
        "SAVE INVOICE ERROR:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to save invoice."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =========================================
     PRINT / REPRINT
  ========================================= */

  function printInvoice() {
    /*
     * Saved invoice:
     * already valid.
     */

    if (
      invoiceSaved
    ) {
      window.print();

      return;
    }

    /*
     * Unsaved invoice:
     *
     * Ek bhi required
     * field missing =
     * NO PRINT.
     */

    if (
      !validateInvoice()
    ) {
      return;
    }

    window.print();
  }

  /* =========================================
     NEW INVOICE
  ========================================= */

  async function newInvoice() {
    const hasItems =
      items.some(
        (
          item
        ) =>
          item.productId !==
          null
      );

    if (
      hasItems &&
      !invoiceSaved
    ) {
      const confirmed =
        window.confirm(
          "Current invoice is not saved. Create a new invoice?"
        );

      if (
        !confirmed
      ) {
        return;
      }
    }

    setInvoiceNumber(
      "AUTO"
    );

    setInvoiceDate(
      getCurrentDate()
    );

    /*
     * Sale Type preserve.
     *
     * Wholesale screen
     * par rehne se new
     * wholesale invoice.
     */

    setCustomerId(
      null
    );

    setCustomer({
      name: "",
      phone: "",
      address: "",
    });

    setItems([
      createEmptyInvoiceItem(),
    ]);

    setPaymentMethod(
      "Cash"
    );

    setAmountPaid("");

    setTaxRate(
      "0"
    );

    setNotes("");

    setInvoiceSaved(
      false
    );

    await loadProducts();
  }

  /* =========================================
     CUSTOMER UPDATE
  ========================================= */

  function updateCustomer(
    field:
      keyof Customer,

    value:
      string
  ) {
    if (
      invoiceSaved
    ) {
      return;
    }

    /*
     * PHONE:
     * numbers only
     * max 11
     */

    if (
      field ===
      "phone"
    ) {
      setCustomer(
        (
          current
        ) => ({
          ...current,

          phone:
            cleanPhone(
              value
            ),
        })
      );

      return;
    }

    setCustomer(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );
  }

  function preventSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 print:hidden">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* HEADER */}

          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  Invoice Maker
                </h1>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    saleType ===
                    "WHOLESALE"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {
                    saleType
                  }
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Hafiz Electronic Charpai & Cotton West Merchant
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {saleType ===
                "WHOLESALE" && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      "/dashboard/customers";
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
                >
                  ← Customers
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  void newInvoice()
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                + New Invoice
              </button>
            </div>
          </header>

          {/* WHOLESALE INFO */}

          {saleType ===
            "WHOLESALE" && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <p className="font-bold text-violet-900">
                Wholesale Invoice
              </p>

              <p className="mt-1 text-sm leading-6 text-violet-700">
                Customer Name aur Phone required hain.
                Phone exactly 11 digits hoga.
                Invoice Save hone par new wholesale customer
                automatically create hoga ya existing customer
                ke account mein sale add hogi.
              </p>
            </div>
          )}

          {/* PRODUCT ERROR */}

          {productError && (
            <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-semibold text-red-700">
                {
                  productError
                }
              </span>

              <button
                type="button"
                onClick={() =>
                  void loadProducts()
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          )}

          {/* INVOICE INFORMATION */}

          <form
            onSubmit={
              preventSubmit
            }
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Invoice Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Customer and invoice details
                </p>
              </div>

              <div className="flex items-center gap-2">
                {invoiceSaved && (
                  <span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    SAVED
                  </span>
                )}

                <span className="rounded-xl bg-blue-50 px-4 py-2 font-bold text-blue-700">
                  {invoiceNumber ===
                  "AUTO"
                    ? "New Invoice"
                    : invoiceNumber}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* NAME */}

              <InputField
                label="Customer Name"
                value={
                  customer.name
                }
                disabled={
                  invoiceSaved
                }
                required={
                  saleType ===
                  "WHOLESALE"
                }
                placeholder={
                  saleType ===
                  "WHOLESALE"
                    ? "Customer Name"
                    : "Walk-in Customer"
                }
                onChange={(
                  value
                ) =>
                  updateCustomer(
                    "name",
                    value
                  )
                }
              />

              {/* PHONE */}

              <InputField
                label="Phone Number"
                value={
                  customer.phone
                }
                disabled={
                  invoiceSaved
                }
                required={
                  saleType ===
                  "WHOLESALE"
                }
                numeric
                maxLength={
                  11
                }
                placeholder="03001234567"
                onChange={(
                  value
                ) =>
                  updateCustomer(
                    "phone",
                    value
                  )
                }
              />

              {/* ADDRESS */}

              <InputField
                label="Address"
                value={
                  customer.address
                }
                disabled={
                  invoiceSaved
                }
                placeholder="Optional address"
                onChange={(
                  value
                ) =>
                  updateCustomer(
                    "address",
                    value
                  )
                }
              />

              {/* DATE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Date
                </label>

                <div className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                  {invoiceDate ||
                    "-"}
                </div>
              </div>
            </div>

            {/* PHONE COUNTER */}

            {saleType ===
              "WHOLESALE" && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span
                  className={
                    customer.phone
                      .length ===
                    11
                      ? "font-bold text-emerald-600"
                      : "font-bold text-slate-500"
                  }
                >
                  Phone:{" "}
                  {
                    customer.phone
                      .length
                  }
                  /11
                </span>

                {customer.phone
                  .length ===
                  11 && (
                  <span className="font-bold text-emerald-600">
                    ✓
                  </span>
                )}
              </div>
            )}
          </form>

          {/* ITEMS */}

          {loadingProducts ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="font-semibold text-slate-700">
                Loading products...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Reading stock from PostgreSQL
              </p>
            </div>
          ) : (
            <InvoiceItems
              items={
                items
              }
              products={
                products
              }
              setItems={
                invoiceSaved
                  ? () => {}
                  : setItems
              }
              onAddItem={
                addItem
              }
            />
          )}

          {/* SAVED NOTICE */}

          {invoiceSaved && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <strong>
                Saved invoice:
              </strong>{" "}
              {invoiceNumber}

              <br />

              Stock has already been deducted.
              Print/Reprint will not change stock.
            </div>
          )}

          {/* NOTES */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">
              Notes
            </h2>

            <textarea
              value={
                notes
              }
              disabled={
                invoiceSaved
              }
              onChange={(
                event
              ) =>
                setNotes(
                  event.target
                    .value
                )
              }
              placeholder="Optional invoice notes..."
              rows={3}
              className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </section>

          {/* SUMMARY */}

          <InvoiceSummary
            totals={
              totals
            }
            paymentMethod={
              paymentMethod
            }
            setPaymentMethod={
              setPaymentMethod
            }
            amountPaid={
              amountPaid
            }
            setAmountPaid={
              setAmountPaid
            }
            taxRate={
              taxRate
            }
            setTaxRate={
              setTaxRate
            }
            status={
              status
            }
            disabled={
              invoiceSaved
            }
          />

          {/* ACTIONS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {invoiceSaved && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
                {invoiceNumber} saved successfully.
                Stock updated.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {/* SAVE */}

              <button
                type="button"
                disabled={
                  saving ||
                  invoiceSaved
                }
                onClick={() =>
                  void saveInvoice()
                }
                className="rounded-xl bg-slate-900 px-5 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {saving
                  ? "Saving..."
                  : invoiceSaved
                    ? `${invoiceNumber} Saved`
                    : "Save Invoice"}
              </button>

              {/* PRINT */}

              <button
                type="button"
                onClick={
                  printInvoice
                }
                className="rounded-xl bg-blue-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                {invoiceSaved
                  ? `Print / Reprint ${invoiceNumber}`
                  : "Print Invoice"}
              </button>
            </div>

            {!invoiceSaved && (
              <p className="mt-3 text-center text-xs text-slate-500">
                Required field missing ho to Save aur Print nahi hoga.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* PRINT */}

      <InvoicePrint
        invoiceNumber={
          invoiceNumber ===
          "AUTO"
            ? "Unsaved Invoice"
            : invoiceNumber
        }
        date={
          invoiceDate
        }
        customer={
          customer
        }
        items={
          items
        }
        totals={
          totals
        }
        paymentMethod={
          paymentMethod
        }
        status={
          status
        }
        taxRate={
          numericTaxRate
        }
        notes={
          notes
        }
      />

      {/* PRINT CSS */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          html,
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          #invoice-print,
          #invoice-print * {
            visibility: visible;
          }

          #invoice-print {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

/* =========================================
   INPUT FIELD
========================================= */

function InputField({
  label,
  value,
  onChange,
  placeholder = "",
  disabled = false,
  required = false,
  numeric = false,
  maxLength,
}: {
  label: string;

  value: string;

  onChange: (
    value: string
  ) => void;

  placeholder?: string;

  disabled?: boolean;

  required?: boolean;

  numeric?: boolean;

  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        /*
         * Text field.
         *
         * Phone ke liye
         * numeric keyboard.
         *
         * Browser ↑↓ arrows
         * nahi aayenge.
         */
        type="text"
        inputMode={
          numeric
            ? "numeric"
            : "text"
        }
        value={
          value
        }
        required={
          required
        }
        disabled={
          disabled
        }
        maxLength={
          maxLength
        }
        autoComplete="off"
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
      />
    </div>
  );
}