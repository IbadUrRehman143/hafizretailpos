"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  customers,
  products,
  PaymentMethod,
  Sale,
  SaleStatus,
} from "./page";

type Props = {
  sale: Sale | null;

  onClose: () => void;

  onSave: (
    sale: Sale
  ) => void;
};

export default function SaleModal({
  sale,
  onClose,
  onSave,
}: Props) {
  const [customerId, setCustomerId] =
    useState(
      sale?.customerId.toString() ||
        ""
    );

  const [productId, setProductId] =
    useState(
      sale?.items[0]?.productId.toString() ||
        ""
    );

  const [quantity, setQuantity] =
    useState(
      sale?.items[0]?.quantity.toString() ||
        ""
    );

  const [price, setPrice] =
    useState(
      sale?.items[0]?.price.toString() ||
        ""
    );

  const [discount, setDiscount] =
    useState(
      sale?.discount.toString() ||
        "0"
    );

  const [paidAmount, setPaidAmount] =
    useState(
      sale?.paidAmount.toString() ||
        ""
    );

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>(
      sale?.paymentMethod ||
        "Cash"
    );

  const [notes, setNotes] =
    useState(
      sale?.notes || ""
    );

  const [invoiceNo, setInvoiceNo] =
    useState(
      sale?.invoiceNo ||
        generateInvoice()
    );

  const selectedProduct =
    products.find(
      (product) =>
        product.id ===
        Number(productId)
    );

  const qty =
    Number(quantity) || 0;

  const sellingPrice =
    Number(price) || 0;

  const discountValue =
    Number(discount) || 0;

  const paid =
    Number(paidAmount) || 0;

  const subtotal =
    qty * sellingPrice;

  const grandTotal =
    Math.max(
      subtotal -
        discountValue,
      0
    );

  const remaining =
    Math.max(
      grandTotal - paid,
      0
    );

  useEffect(() => {
    if (!selectedProduct) return;

    if (!sale) {
      setPrice(
        selectedProduct.price.toString()
      );
    }
  }, [
    productId,
    selectedProduct,
    sale,
  ]);

  function handleProductChange(
    value: string
  ) {
    setProductId(value);

    const product =
      products.find(
        (item) =>
          item.id ===
          Number(value)
      );

    if (product) {
      setPrice(
        product.price.toString()
      );
    }
  }

  function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!customerId) {
      alert(
        "Please select customer."
      );
      return;
    }

    if (!productId) {
      alert(
        "Please select product."
      );
      return;
    }

    if (qty <= 0) {
      alert(
        "Quantity must be greater than 0."
      );
      return;
    }

    if (sellingPrice <= 0) {
      alert(
        "Price must be greater than 0."
      );
      return;
    }

    if (
      discountValue >
      subtotal
    ) {
      alert(
        "Discount cannot be greater than subtotal."
      );
      return;
    }

    if (paid > grandTotal) {
      alert(
        "Paid amount cannot be greater than total."
      );
      return;
    }

    const customer =
      customers.find(
        (item) =>
          item.id ===
          Number(customerId)
      );

    const product =
      products.find(
        (item) =>
          item.id ===
          Number(productId)
      );

    if (!customer || !product) {
      return;
    }

    let status: SaleStatus =
      "Unpaid";

    if (
      paid >= grandTotal &&
      grandTotal > 0
    ) {
      status = "Paid";
    } else if (paid > 0) {
      status = "Partial";
    }

    const saleData: Sale = {
      id:
        sale?.id ||
        Date.now(),

      invoiceNo,

      date:
        sale?.date ||
        new Date().toLocaleString(),

      customerId:
        customer.id,

      customerName:
        customer.name,

      customerPhone:
        customer.phone,

      items: [
        {
          productId:
            product.id,

          productName:
            product.name,

          quantity: qty,

          unit:
            product.unit,

          price:
            sellingPrice,

          total:
            subtotal,
        },
      ],

      subtotal,

      discount:
        discountValue,

      grandTotal,

      paidAmount:
        paid,

      remainingAmount:
        remaining,

      paymentMethod,

      status,

      notes,
    };

    onSave(saleData);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">

          <div>

            <h2 className="text-xl font-bold">
              {sale
                ? "Edit Sale"
                : "New Sale"}
            </h2>

            <p className="text-sm text-slate-500">
              Create customer sale and invoice.
            </p>

          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-slate-100 text-lg"
          >
            ×
          </button>

        </div>

        {/* FORM */}

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6 p-6"
        >

          {/* SALE INFO */}

          <section className="rounded-2xl border p-5">

            <h3 className="font-bold">
              Sale Information
            </h3>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <Input
                label="Invoice Number"
                value={invoiceNo}
                onChange={
                  setInvoiceNo
                }
              />

              <Input
                label="Date"
                value={
                  sale?.date ||
                  new Date().toLocaleString()
                }
                onChange={() => {}}
              />

              <Select
                label="Customer"
                value={
                  customerId
                }
                onChange={
                  setCustomerId
                }
                placeholder="Select Customer"
                options={customers.map(
                  (customer) => ({
                    value:
                      customer.id.toString(),

                    label:
                      customer.phone
                        ? `${customer.name} - ${customer.phone}`
                        : customer.name,
                  })
                )}
              />

              <Select
                label="Product"
                value={
                  productId
                }
                onChange={
                  handleProductChange
                }
                placeholder="Select Product"
                options={products.map(
                  (product) => ({
                    value:
                      product.id.toString(),

                    label:
                      `${product.name} (${product.unit})`,
                  })
                )}
              />

            </div>

          </section>

          {/* PRODUCT */}

          <section className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5">

            <h3 className="font-bold">
              Product Details
            </h3>

            {selectedProduct && (
              <div className="mt-4 rounded-xl bg-white p-4">

                <p className="text-xs text-slate-400">
                  SELECTED PRODUCT
                </p>

                <p className="mt-1 font-bold">
                  {
                    selectedProduct.name
                  }
                </p>

                <p className="text-xs text-slate-500">
                  Unit:{" "}
                  {
                    selectedProduct.unit
                  }
                </p>

              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <Input
                label={`Quantity ${
                  selectedProduct
                    ? `(${selectedProduct.unit})`
                    : ""
                }`}
                type="number"
                value={quantity}
                onChange={
                  setQuantity
                }
                placeholder="0"
              />

              <Input
                label="Selling Price / Unit"
                type="number"
                value={price}
                onChange={
                  setPrice
                }
                placeholder="0"
              />

            </div>

            <div className="mt-4 flex justify-between rounded-xl bg-white p-4">

              <span className="text-sm text-slate-500">
                Subtotal
              </span>

              <span className="text-xl font-bold">
                Rs.{" "}
                {subtotal.toLocaleString()}
              </span>

            </div>

          </section>

          {/* DISCOUNT */}

          <section className="rounded-2xl border p-5">

            <h3 className="font-bold">
              Discount
            </h3>

            <div className="mt-4">

              <Input
                label="Discount Amount"
                type="number"
                value={
                  discount
                }
                onChange={
                  setDiscount
                }
                placeholder="0"
              />

            </div>

            <div className="mt-4 flex justify-between rounded-xl bg-slate-50 p-4">

              <span className="font-medium">
                Grand Total
              </span>

              <span className="text-2xl font-bold">
                Rs.{" "}
                {grandTotal.toLocaleString()}
              </span>

            </div>

          </section>

          {/* PAYMENT */}

          <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5">

            <h3 className="font-bold">
              Payment
            </h3>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <Input
                label="Paid Amount"
                type="number"
                value={
                  paidAmount
                }
                onChange={
                  setPaidAmount
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
                options={[
                  {
                    value: "Cash",
                    label: "Cash",
                  },
                  {
                    value: "Bank",
                    label: "Bank",
                  },
                  {
                    value: "Credit",
                    label: "Credit",
                  },
                  {
                    value: "Other",
                    label: "Other",
                  },
                ]}
              />

            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">

              <div className="rounded-xl bg-white p-4">

                <p className="text-xs text-slate-500">
                  Paid
                </p>

                <p className="mt-1 text-lg font-bold text-green-600">
                  Rs.{" "}
                  {paid.toLocaleString()}
                </p>

              </div>

              <div className="rounded-xl bg-white p-4">

                <p className="text-xs text-slate-500">
                  Remaining
                </p>

                <p className="mt-1 text-lg font-bold text-red-600">
                  Rs.{" "}
                  {remaining.toLocaleString()}
                </p>

              </div>

            </div>

          </section>

          {/* NOTES */}

          <div>

            <label className="text-sm font-medium">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              rows={3}
              placeholder="Optional notes..."
              className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

          </div>

          {/* BUTTONS */}

          <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={
                onClose
              }
              className="rounded-xl border px-5 py-3 text-sm font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
            >
              {sale
                ? "Update Sale"
                : "Save Sale"}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: {
    value: string;
    label: string;
  }[];
  placeholder?: string;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >

        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}

      </select>

    </label>
  );
}

/* =====================================================
   GENERATE INVOICE
===================================================== */

function generateInvoice() {
  return `INV-${String(
    Math.floor(
      Math.random() * 9999
    ) + 1
  ).padStart(4, "0")}`;
}