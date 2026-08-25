"use client";

import { useMemo, useState } from "react";

type PaymentMethod =
  | "Cash"
  | "Bank"
  | "Credit"
  | "Other";

type PurchaseStatus =
  | "Paid"
  | "Partial"
  | "Unpaid";

type Supplier = {
  id: number;
  name: string;
  phone: string;
};

type Product = {
  id: number;
  name: string;
  category: string;
  unit: "KG" | "PCS";
};

type PurchaseItem = {
  productId: number;
  productName: string;
  quantity: number;
  unit: "KG" | "PCS";
  purchasePrice: number;
  total: number;
};

type Purchase = {
  id: number;
  invoiceNo: string;
  date: string;
  supplierId: number;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  status: PurchaseStatus;
  notes: string;
};

/* =========================
   Dummy Suppliers
========================= */

const suppliers: Supplier[] = [
  {
    id: 1,
    name: "Khan Traders",
    phone: "03001234567",
  },
  {
    id: 2,
    name: "Ali Electronics",
    phone: "03111234567",
  },
  {
    id: 3,
    name: "Swabi Cotton Center",
    phone: "03221234567",
  },
];

/* =========================
   Dummy Products
========================= */

const products: Product[] = [
  {
    id: 1,
    name: "Cotton",
    category: "Cotton",
    unit: "KG",
  },
  {
    id: 2,
    name: "Washing Machine",
    category: "Appliances",
    unit: "PCS",
  },
  {
    id: 3,
    name: "Pedestal Fan",
    category: "Electronics",
    unit: "PCS",
  },
  {
    id: 4,
    name: "Ceiling Fan",
    category: "Electronics",
    unit: "PCS",
  },
  {
    id: 5,
    name: "Charpai 6x3",
    category: "Furniture",
    unit: "PCS",
  },
];

/* =========================
   Dummy Purchases
========================= */

const initialPurchases: Purchase[] = [
  {
    id: 1,
    invoiceNo: "PUR-0001",
    date: "2026-08-25",
    supplierId: 3,
    supplierName: "Swabi Cotton Center",

    items: [
      {
        productId: 1,
        productName: "Cotton",
        quantity: 150,
        unit: "KG",
        purchasePrice: 180,
        total: 27000,
      },
    ],

    subtotal: 27000,
    paidAmount: 20000,
    remainingAmount: 7000,
    paymentMethod: "Cash",
    status: "Partial",
    notes: "",
  },

  {
    id: 2,
    invoiceNo: "PUR-0002",
    date: "2026-08-24",
    supplierId: 2,
    supplierName: "Ali Electronics",

    items: [
      {
        productId: 3,
        productName: "Pedestal Fan",
        quantity: 10,
        unit: "PCS",
        purchasePrice: 7000,
        total: 70000,
      },
    ],

    subtotal: 70000,
    paidAmount: 70000,
    remainingAmount: 0,
    paymentMethod: "Cash",
    status: "Paid",
    notes: "",
  },
];

export default function PurchasesPage() {
  const [purchases, setPurchases] =
    useState<Purchase[]>(initialPurchases);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  /* =========================
     Form State
  ========================= */

  const [form, setForm] = useState({
    invoiceNo: "",
    date: new Date()
      .toISOString()
      .split("T")[0],

    supplierId: "",
    productId: "",

    quantity: "",
    purchasePrice: "",
    paidAmount: "",

    paymentMethod:
      "Cash" as PaymentMethod,

    notes: "",
  });

  /* =========================
     Selected Product
  ========================= */

  const selectedProduct = products.find(
    (product) =>
      product.id === Number(form.productId)
  );

  /* =========================
     Calculations
  ========================= */

  const quantity =
    Number(form.quantity) || 0;

  const purchasePrice =
    Number(form.purchasePrice) || 0;

  const totalAmount =
    quantity * purchasePrice;

  const paidAmount =
    Number(form.paidAmount) || 0;

  const remainingAmount = Math.max(
    totalAmount - paidAmount,
    0
  );

  /* =========================
     Filter Purchases
  ========================= */

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const searchValue =
        search.toLowerCase();

      const matchesSearch =
        purchase.invoiceNo
          .toLowerCase()
          .includes(searchValue) ||
        purchase.supplierName
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        purchase.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    purchases,
    search,
    statusFilter,
  ]);

  /* =========================
     Statistics
  ========================= */

  const totalPurchases = purchases.reduce(
    (total, purchase) =>
      total + purchase.subtotal,
    0
  );

  const totalPaid = purchases.reduce(
    (total, purchase) =>
      total + purchase.paidAmount,
    0
  );

  const totalPayable = purchases.reduce(
    (total, purchase) =>
      total + purchase.remainingAmount,
    0
  );

  /* =========================
     Form Functions
  ========================= */

  function resetForm() {
    setForm({
      invoiceNo: "",
      date: new Date()
        .toISOString()
        .split("T")[0],

      supplierId: "",
      productId: "",

      quantity: "",
      purchasePrice: "",
      paidAmount: "",

      paymentMethod: "Cash",

      notes: "",
    });

    setEditingId(null);
  }

  function openAddPurchase() {
    resetForm();

    setForm((previous) => ({
      ...previous,

      invoiceNo:
        generateInvoiceNumber(),
    }));

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function updateForm(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* =========================
     Product Change
  ========================= */

  function handleProductChange(
    productId: string
  ) {
    const product = products.find(
      (item) =>
        item.id === Number(productId)
    );

    setForm((previous) => ({
      ...previous,

      productId,

      purchasePrice: product
        ? getDefaultPrice(
            product.id
          )
        : "",
    }));
  }

  /* =========================
     Submit Purchase
  ========================= */

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.supplierId) {
      alert(
        "Please select a supplier."
      );
      return;
    }

    if (!form.productId) {
      alert(
        "Please select a product."
      );
      return;
    }

    if (quantity <= 0) {
      alert(
        "Quantity must be greater than 0."
      );
      return;
    }

    if (purchasePrice <= 0) {
      alert(
        "Purchase price must be greater than 0."
      );
      return;
    }

    if (paidAmount > totalAmount) {
      alert(
        "Paid amount cannot be greater than total."
      );
      return;
    }

    const supplier = suppliers.find(
      (item) =>
        item.id ===
        Number(form.supplierId)
    );

    const product = products.find(
      (item) =>
        item.id ===
        Number(form.productId)
    );

    if (!supplier || !product) {
      return;
    }

    let status: PurchaseStatus;

    if (paidAmount === 0) {
      status = "Unpaid";
    } else if (
      paidAmount >= totalAmount
    ) {
      status = "Paid";
    } else {
      status = "Partial";
    }

    const purchaseItem: PurchaseItem = {
      productId: product.id,

      productName: product.name,

      quantity,

      unit: product.unit,

      purchasePrice,

      total: totalAmount,
    };

    const purchaseData: Purchase = {
      id:
        editingId !== null
          ? editingId
          : Date.now(),

      invoiceNo:
        form.invoiceNo,

      date: form.date,

      supplierId:
        supplier.id,

      supplierName:
        supplier.name,

      items: [purchaseItem],

      subtotal:
        totalAmount,

      paidAmount,

      remainingAmount,

      paymentMethod:
        form.paymentMethod,

      status,

      notes:
        form.notes,
    };

    /* Edit */

    if (editingId !== null) {
      setPurchases(
        (previous) =>
          previous.map(
            (purchase) =>
              purchase.id ===
              editingId
                ? purchaseData
                : purchase
          )
      );
    }

    /* New Purchase */

    else {
      setPurchases(
        (previous) => [
          purchaseData,
          ...previous,
        ]
      );
    }

    closeForm();
  }

  /* =========================
     Edit Purchase
  ========================= */

  function editPurchase(
    purchase: Purchase
  ) {
    const item =
      purchase.items[0];

    setForm({
      invoiceNo:
        purchase.invoiceNo,

      date:
        purchase.date,

      supplierId:
        purchase.supplierId.toString(),

      productId:
        item.productId.toString(),

      quantity:
        item.quantity.toString(),

      purchasePrice:
        item.purchasePrice.toString(),

      paidAmount:
        purchase.paidAmount.toString(),

      paymentMethod:
        purchase.paymentMethod,

      notes:
        purchase.notes,
    });

    setEditingId(
      purchase.id
    );

    setShowForm(true);
  }

  /* =========================
     Delete Purchase
  ========================= */

  function deletePurchase(
    id: number
  ) {
    const purchase =
      purchases.find(
        (item) =>
          item.id === id
      );

    if (!purchase) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${purchase.invoiceNo}?`
      );

    if (!confirmed) {
      return;
    }

    setPurchases(
      (previous) =>
        previous.filter(
          (purchase) =>
            purchase.id !== id
        )
    );
  }

  /* =========================
     Currency
  ========================= */

  function formatCurrency(
    value: number
  ) {
    return `Rs. ${value.toLocaleString()}`;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* =========================
            Header
        ========================= */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Purchases
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Record purchases and supplier payments.
            </p>

          </div>

          <button
            onClick={
              openAddPurchase
            }
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            + New Purchase
          </button>

        </div>

        {/* =========================
            Statistics
        ========================= */}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <StatCard
            title="Purchase Value"
            value={formatCurrency(
              totalPurchases
            )}
          />

          <StatCard
            title="Total Paid"
            value={formatCurrency(
              totalPaid
            )}
          />

          <StatCard
            title="Payable"
            value={formatCurrency(
              totalPayable
            )}
          />

          <StatCard
            title="Purchase Entries"
            value={purchases.length.toString()}
          />

        </div>

        {/* =========================
            Search & Filter
        ========================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="grid gap-3 md:grid-cols-[1fr_200px]">

            <div className="relative">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                🔎
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search invoice or supplier..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
              />

            </div>

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
            >

              <option value="All">
                All Status
              </option>

              <option value="Paid">
                Paid
              </option>

              <option value="Partial">
                Partial
              </option>

              <option value="Unpaid">
                Unpaid
              </option>

            </select>

          </div>

        </div>

        {/* =========================
            Purchase Table
        ========================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-275">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr>

                  <TableHead>
                    Invoice
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

                {filteredPurchases.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={10}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No purchases found.
                    </td>

                  </tr>

                ) : (

                  filteredPurchases.map(
                    (purchase) => {

                      const item =
                        purchase.items[0];

                      return (
                        <tr
                          key={
                            purchase.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* Invoice */}

                          <td className="px-5 py-4">

                            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              {
                                purchase.invoiceNo
                              }
                            </span>

                          </td>

                          {/* Date */}

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {
                              purchase.date
                            }
                          </td>

                          {/* Supplier */}

                          <td className="px-5 py-4">

                            <p className="font-semibold text-slate-900">
                              {
                                purchase.supplierName
                              }
                            </p>

                          </td>

                          {/* Product */}

                          <td className="px-5 py-4">

                            <p className="text-sm font-medium text-slate-800">
                              {
                                item.productName
                              }
                            </p>

                          </td>

                          {/* Quantity */}

                          <td className="px-5 py-4">

                            <p className="font-semibold text-slate-900">
                              {
                                item.quantity
                              }
                            </p>

                            <p className="text-xs text-slate-500">
                              {
                                item.unit
                              }
                            </p>

                          </td>

                          {/* Total */}

                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                            {formatCurrency(
                              purchase.subtotal
                            )}
                          </td>

                          {/* Paid */}

                          <td className="px-5 py-4 text-sm font-semibold text-green-600">
                            {formatCurrency(
                              purchase.paidAmount
                            )}
                          </td>

                          {/* Payable */}

                          <td className="px-5 py-4 text-sm font-semibold text-red-600">
                            {formatCurrency(
                              purchase.remainingAmount
                            )}
                          </td>

                          {/* Status */}

                          <td className="px-5 py-4">

                            <StatusBadge
                              status={
                                purchase.status
                              }
                            />

                          </td>

                          {/* Actions */}

                          <td className="px-5 py-4">

                            <div className="flex gap-2">

                              <button
                                onClick={() =>
                                  editPurchase(
                                    purchase
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  deletePurchase(
                                    purchase.id
                                  )
                                }
                                className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Delete
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

      </div>

      {/* =========================
          Add/Edit Modal
      ========================= */}

      {showForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* Modal Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {editingId !== null
                    ? "Edit Purchase"
                    : "New Purchase"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add product purchase and supplier payment.
                </p>

              </div>

              <button
                onClick={
                  closeForm
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            {/* Form */}

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-6 p-6"
            >

              {/* =========================
                  Purchase Information
              ========================= */}

              <section className="rounded-2xl border border-slate-200 p-5">

                <h3 className="font-bold text-slate-900">
                  Purchase Information
                </h3>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  <Input
                    label="Invoice Number"
                    value={
                      form.invoiceNo
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "invoiceNo",
                        value
                      )
                    }
                    placeholder="PUR-0001"
                  />

                  <Input
                    label="Purchase Date"
                    type="date"
                    value={
                      form.date
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "date",
                        value
                      )
                    }
                  />

                  <Select
                    label="Supplier"
                    value={
                      form.supplierId
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "supplierId",
                        value
                      )
                    }
                    placeholder="Select Supplier"
                    options={suppliers.map(
                      (
                        supplier
                      ) => ({
                        value:
                          supplier.id.toString(),

                        label:
                          `${supplier.name} - ${supplier.phone}`,
                      })
                    )}
                  />

                  <Select
                    label="Product"
                    value={
                      form.productId
                    }
                    onChange={
                      handleProductChange
                    }
                    placeholder="Select Product"
                    options={products.map(
                      (
                        product
                      ) => ({
                        value:
                          product.id.toString(),

                        label:
                          `${product.name} (${product.unit})`,
                      })
                    )}
                  />

                </div>

              </section>

              {/* =========================
                  Product Details
              ========================= */}

              <section className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5">

                <h3 className="font-bold text-slate-900">
                  Product Details
                </h3>

                {selectedProduct && (

                  <div className="mt-3 rounded-xl bg-white p-4">

                    <p className="text-sm text-slate-500">
                      Selected Product
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {
                        selectedProduct.name
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
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
                    value={
                      form.quantity
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "quantity",
                        value
                      )
                    }
                    placeholder={
                      selectedProduct?.unit ===
                      "KG"
                        ? "e.g. 82"
                        : "e.g. 10"
                    }
                  />

                  <Input
                    label="Purchase Price / Unit"
                    type="number"
                    value={
                      form.purchasePrice
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "purchasePrice",
                        value
                      )
                    }
                    placeholder="0"
                  />

                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4">

                  <span className="text-sm font-medium text-slate-600">
                    Total Purchase
                  </span>

                  <span className="text-xl font-bold text-slate-900">
                    {formatCurrency(
                      totalAmount
                    )}
                  </span>

                </div>

              </section>

              {/* =========================
                  Payment
              ========================= */}

              <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5">

                <h3 className="font-bold text-slate-900">
                  Payment
                </h3>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  <Input
                    label="Paid Amount"
                    type="number"
                    value={
                      form.paidAmount
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "paidAmount",
                        value
                      )
                    }
                    placeholder="0"
                  />

                  {/* FIXED PAYMENT METHOD */}

                  <Select
                    label="Payment Method"
                    value={
                      form.paymentMethod
                    }
                    onChange={(
                      value
                    ) =>
                      setForm(
                        (previous) => ({
                          ...previous,

                          paymentMethod:
                            value as PaymentMethod,
                        })
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

                {/* Payment Summary */}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">

                  <SummaryBox
                    title="Paid"
                    value={formatCurrency(
                      paidAmount
                    )}
                  />

                  <SummaryBox
                    title="Remaining Payable"
                    value={formatCurrency(
                      remainingAmount
                    )}
                    danger={
                      remainingAmount > 0
                    }
                  />

                </div>

              </section>

              {/* =========================
                  Notes
              ========================= */}

              <section>

                <label className="block">

                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Notes
                  </span>

                  <textarea
                    value={
                      form.notes
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "notes",
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Optional notes..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />

                </label>

              </section>

              {/* =========================
                  Footer
              ========================= */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {editingId !== null
                    ? "Update Purchase"
                    : "Save Purchase"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

/* =========================
   Helper Functions
========================= */

function generateInvoiceNumber() {
  return `PUR-${String(
    Math.floor(
      Math.random() * 9999
    ) + 1
  ).padStart(4, "0")}`;
}

function getDefaultPrice(
  productId: number
) {
  const prices: Record<
    number,
    number
  > = {
    1: 180,
    2: 45000,
    3: 7000,
    4: 7500,
    5: 5000,
  };

  return prices[
    productId
  ]?.toString() ?? "";
}

/* =========================
   Stat Card
========================= */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}

/* =========================
   Table Head
========================= */

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

/* =========================
   Status Badge
========================= */

function StatusBadge({
  status,
}: {
  status: PurchaseStatus;
}) {
  const styles: Record<
    PurchaseStatus,
    string
  > = {
    Paid:
      "bg-green-50 text-green-700",

    Partial:
      "bg-orange-50 text-orange-700",

    Unpaid:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/* =========================
   Input
========================= */

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
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
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />

    </label>
  );
}

/* =========================
   Select
========================= */

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
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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

/* =========================
   Summary Box
========================= */

function SummaryBox({
  title,
  value,
  danger = false,
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white p-4">

      <p className="text-xs text-slate-500">
        {title}
      </p>

      <p
        className={`mt-1 text-lg font-bold ${
          danger
            ? "text-red-600"
            : "text-green-600"
        }`}
      >
        {value}
      </p>

    </div>
  );
}