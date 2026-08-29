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
   NORMALIZE PRODUCT
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
        raw.quality || ""
      ),

    color:
      String(
        raw.color || ""
      ),
  };
}

/* =========================================
   API ERROR MESSAGE
========================================= */

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
     CUSTOMER
  ========================================= */

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
    useState<InvoiceItem[]>(
      []
    );

  /* =========================================
     PAYMENT
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
    useState(0);

  /* =========================================
     TAX

     Default = 0%
  ========================================= */

  const [
    taxRate,
    setTaxRate,
  ] =
    useState(0);

  /* =========================================
     NOTES
  ========================================= */

  const [
    notes,
    setNotes,
  ] =
    useState("");

  /* =========================================
     SAVE STATE
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
     INITIAL INVOICE
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

    setTaxRate(
      0
    );
  }, []);

  /* =========================================
     LOAD PRODUCTS FROM DATABASE
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

          setProducts(
            []
          );

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

  /* =========================================
     LOAD PRODUCTS ON PAGE OPEN
  ========================================= */

  useEffect(() => {
    void loadProducts();
  }, [
    loadProducts,
  ]);

  /* =========================================
     TOTALS
  ========================================= */

  const totals =
    useMemo(() => {
      return calculateInvoiceTotals(
        items,
        amountPaid,
        taxRate
      );
    }, [
      items,
      amountPaid,
      taxRate,
    ]);

  /* =========================================
     PAYMENT STATUS
  ========================================= */

  const status =
    useMemo(() => {
      return getInvoiceStatus(
        totals.grandTotal,
        amountPaid
      );
    }, [
      totals.grandTotal,
      amountPaid,
    ]);

  /* =========================================
     ADD ITEM
  ========================================= */

  function addItem() {
    /*
     * Saved invoice cannot change.
     */

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
              ) > 0
            : Number(
                item.quantity
              ) > 0
        )
    );
  }

  /* =========================================
     VALIDATE CURRENT STOCK

     ONLY FOR UNSAVED INVOICE
  ========================================= */

  function validateStock() {
    const validItems =
      getValidItems();

    if (
      validItems.length ===
      0
    ) {
      alert(
        "Please select at least one product."
      );

      return false;
    }

    /*
     * Same product multiple rows
     * mein ho sakta hai.
     */

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

      if (
        !product
      ) {
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
     VALIDATE UNSAVED INVOICE
  ========================================= */

  function validateInvoice() {
    /*
     * Saved invoice has already
     * passed validation and backend
     * stock validation.
     */

    if (
      invoiceSaved
    ) {
      return true;
    }

    if (
      !validateStock()
    ) {
      return false;
    }

    if (
      totals.grandTotal <=
      0
    ) {
      alert(
        "Invoice total must be greater than 0."
      );

      return false;
    }

    if (
      taxRate < 0
    ) {
      alert(
        "Tax rate cannot be negative."
      );

      return false;
    }

    return true;
  }

  /* =========================================
     SAVE INVOICE
  ========================================= */

  async function saveInvoice() {
    /* Already saved */

    if (
      invoiceSaved
    ) {
      alert(
        "Invoice already saved."
      );

      return;
    }

    /* Validate */

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

      /* =====================================
         BUILD PAYLOAD
      ===================================== */

      const payload = {
        /*
         * Final invoice number backend
         * database ID se generate karega.
         */

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

        amountPaid:
          Number(
            amountPaid
          ) || 0,

        taxRate:
          Number(
            taxRate
          ) || 0,

        subtotal:
          totals.subtotal,

        discount:
          totals.discount,

        tax:
          totals.tax,

        grandTotal:
          totals.grandTotal,

        remaining:
          totals.remaining,

        change:
          totals.change,

        status,

        notes:
          notes.trim(),
      };

      /* =====================================
         SAVE TO POSTGRESQL
      ===================================== */

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

      /* =====================================
         ERROR
      ===================================== */

      if (
        !response.ok
      ) {
        throw new Error(
          await getErrorMessage(
            response
          )
        );
      }

      /* =====================================
         RESPONSE
      ===================================== */

      const data =
        (await response.json()) as {
          message?: string;

          invoice?: {
            invoiceId?: number;

            invoiceNumber?: string;

            status?: string;

            total?: number;

            paidAmount?: number;

            remainingBalance?: number;
          };
        };

      /* =====================================
         FINAL INVOICE NUMBER

         Example:
         INV-0001
      ===================================== */

      if (
        data.invoice
          ?.invoiceNumber
      ) {
        setInvoiceNumber(
          data.invoice.invoiceNumber
        );
      }

      /* =====================================
         MARK AS SAVED

         From now on Print/Reprint
         will NOT check stock.
      ===================================== */

      setInvoiceSaved(
        true
      );

      /*
       * VERY IMPORTANT:
       *
       * DO NOT loadProducts() here.
       *
       * Database stock has already
       * been deducted by backend,
       * but current invoice should
       * keep its original stock snapshot.
       *
       * New invoice will reload
       * latest database stock.
       */

      alert(
        data.message ||
          "Invoice saved successfully. Stock updated."
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

     THIS FIXES YOUR MAIN BUG
  ========================================= */

  function printInvoice() {
    /*
     * SAVED INVOICE:
     *
     * Stock already deducted.
     * Do NOT check live stock.
     * Do NOT POST again.
     * Do NOT deduct anything.
     */

    if (
      invoiceSaved
    ) {
      window.print();

      return;
    }

    /*
     * UNSAVED INVOICE:
     *
     * Validation can run.
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
      getValidItems().length >
      0;

    /*
     * Unsaved invoice warning.
     */

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

    /* =====================================
       RESET INVOICE
    ===================================== */

    setInvoiceNumber(
      "AUTO"
    );

    setInvoiceDate(
      getCurrentDate()
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

    setAmountPaid(
      0
    );

    setTaxRate(
      0
    );

    setNotes(
      ""
    );

    setInvoiceSaved(
      false
    );

    /*
     * NOW load fresh reduced stock.
     *
     * Example:
     *
     * Before Sale = 3 PCS
     * Saved Sale = 1 PCS
     * Database = 2 PCS
     *
     * New Invoice = 2 PCS
     */

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

  /* =========================================
     FORM SUBMIT BLOCK
  ========================================= */

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
      {/* =====================================
          SCREEN
      ===================================== */}

      <div className="min-h-screen bg-slate-50 p-4 md:p-6 print:hidden">

        <div className="mx-auto max-w-7xl space-y-6">

          {/* =================================
              HEADER
          ================================= */}

          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h1 className="text-2xl font-bold text-slate-900">
                Invoice Maker
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Hafiz Electronic Charpai & Cotton West Merchant
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                void newInvoice()
              }
              className="w-fit rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              + New Invoice
            </button>

          </header>

          {/* =================================
              PRODUCT ERROR
          ================================= */}

          {productError && (

            <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">

              <span className="text-sm font-semibold text-red-700">
                {productError}
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

          {/* =================================
              INVOICE INFORMATION
          ================================= */}

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

              {/* CUSTOMER NAME */}

              <InputField
                label="Customer Name"
                value={
                  customer.name
                }
                disabled={
                  invoiceSaved
                }
                placeholder="Walk-in Customer"
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
                label="Customer Phone"
                value={
                  customer.phone
                }
                disabled={
                  invoiceSaved
                }
                placeholder="03XX XXXXXXX"
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
                placeholder="Customer address"
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

          </form>

          {/* =================================
              ITEMS
          ================================= */}

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

          {/* =================================
              SAVED NOTICE
          ================================= */}

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

          {/* =================================
              NOTES
          ================================= */}

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
                  event.target.value
                )
              }
              placeholder="Optional invoice notes..."
              rows={
                3
              }
              className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
            />

          </section>

          {/* =================================
              SUMMARY
          ================================= */}

          <InvoiceSummary
            totals={
              totals
            }
            paymentMethod={
              paymentMethod
            }
            setPaymentMethod={
              invoiceSaved
                ? () => {}
                : setPaymentMethod
            }
            amountPaid={
              amountPaid
            }
            setAmountPaid={
              invoiceSaved
                ? () => {}
                : setAmountPaid
            }
            taxRate={
              taxRate
            }
            setTaxRate={
              invoiceSaved
                ? () => {}
                : setTaxRate
            }
            status={
              status
            }
          />

          {/* =================================
              ACTIONS
          ================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            {invoiceSaved && (

              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">

                {invoiceNumber} saved successfully in PostgreSQL.
                Stock has been updated.

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

          </section>

        </div>

      </div>

      {/* =====================================
          PRINT COMPONENT
      ===================================== */}

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
          taxRate
        }
        notes={
          notes
        }
      />

      {/* =====================================
          PRINT CSS
      ===================================== */}

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
}: {
  label: string;

  value: string;

  onChange: (
    value: string
  ) => void;

  placeholder?: string;

  disabled?: boolean;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type="text"
        value={
          value
        }
        disabled={
          disabled
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
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
      />

    </div>
  );
}