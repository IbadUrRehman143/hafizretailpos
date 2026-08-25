"use client";

import { useMemo, useState } from "react";

type ReturnStatus = "Pending" | "Approved" | "Rejected" | "Completed";

type RefundMethod = "Cash" | "Bank" | "Credit" | "Other";

type ReturnItem = {
  id: number;
  productName: string;
  quantity: number;
  unit: "PCS" | "KG";
  price: number;
  total: number;
};

type ReturnRecord = {
  id: number;
  returnNo: string;
  invoiceNo: string;
  date: string;

  customerName: string;
  customerPhone: string;

  items: ReturnItem[];

  totalAmount: number;
  refundAmount: number;

  reason: string;
  refundMethod: RefundMethod;
  status: ReturnStatus;

  notes: string;
};

const initialReturns: ReturnRecord[] = [
  {
    id: 1,
    returnNo: "RET-0001",
    invoiceNo: "INV-0012",
    date: "2026-08-25 10:30 AM",

    customerName: "Muhammad Ali",
    customerPhone: "0300-1234567",

    items: [
      {
        id: 1,
        productName: "Pedestal Fan",
        quantity: 1,
        unit: "PCS",
        price: 8500,
        total: 8500,
      },
    ],

    totalAmount: 8500,
    refundAmount: 8500,

    reason: "Product damaged",
    refundMethod: "Cash",
    status: "Completed",

    notes: "Customer returned damaged fan.",
  },

  {
    id: 2,
    returnNo: "RET-0002",
    invoiceNo: "INV-0018",
    date: "2026-08-24 03:15 PM",

    customerName: "Abdul Rehman",
    customerPhone: "0312-7654321",

    items: [
      {
        id: 2,
        productName: "Cotton",
        quantity: 15,
        unit: "KG",
        price: 250,
        total: 3750,
      },
    ],

    totalAmount: 3750,
    refundAmount: 3750,

    reason: "Wrong quantity",
    refundMethod: "Credit",
    status: "Approved",

    notes: "Amount adjusted in customer account.",
  },

  {
    id: 3,
    returnNo: "RET-0003",
    invoiceNo: "INV-0021",
    date: "2026-08-23 01:20 PM",

    customerName: "Sajid Khan",
    customerPhone: "0333-4567890",

    items: [
      {
        id: 3,
        productName: "Washing Machine",
        quantity: 1,
        unit: "PCS",
        price: 55000,
        total: 55000,
      },
    ],

    totalAmount: 55000,
    refundAmount: 55000,

    reason: "Customer changed mind",
    refundMethod: "Bank",
    status: "Pending",

    notes: "Waiting for return inspection.",
  },

  {
    id: 4,
    returnNo: "RET-0004",
    invoiceNo: "INV-0025",
    date: "2026-08-22 05:40 PM",

    customerName: "Irfan Ahmad",
    customerPhone: "0345-9876543",

    items: [
      {
        id: 4,
        productName: "Ceiling Fan",
        quantity: 2,
        unit: "PCS",
        price: 9000,
        total: 18000,
      },
    ],

    totalAmount: 18000,
    refundAmount: 0,

    reason: "Warranty issue",
    refundMethod: "Other",
    status: "Rejected",

    notes: "Return rejected after inspection.",
  },
];

const emptyForm = {
  invoiceNo: "",
  customerName: "",
  customerPhone: "",
  productName: "",
  quantity: "1",
  unit: "PCS" as "PCS" | "KG",
  price: "",
  reason: "",
  refundAmount: "",
  refundMethod: "Cash" as RefundMethod,
  status: "Pending" as ReturnStatus,
  notes: "",
};

export default function ReturnsPage() {
  const [returns, setReturns] =
    useState<ReturnRecord[]>(initialReturns);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | ReturnStatus>("All");

  const [showModal, setShowModal] =
    useState(false);

  const [selectedReturn, setSelectedReturn] =
    useState<ReturnRecord | null>(null);

  const [editingReturn, setEditingReturn] =
    useState<ReturnRecord | null>(null);

  const [form, setForm] =
    useState(emptyForm);

  const [showDetails, setShowDetails] =
    useState(false);

  const formatPrice = (value: number) => {
    return `Rs. ${value.toLocaleString("en-PK")}`;
  };

  const filteredReturns = useMemo(() => {
    const text = search.trim().toLowerCase();

    return returns.filter((item) => {
      const matchesSearch =
        !text ||
        item.returnNo.toLowerCase().includes(text) ||
        item.invoiceNo.toLowerCase().includes(text) ||
        item.customerName.toLowerCase().includes(text) ||
        item.customerPhone.toLowerCase().includes(text);

      const matchesStatus =
        statusFilter === "All" ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [returns, search, statusFilter]);

  const totalReturns = returns.length;

  const completedReturns = returns.filter(
    (item) => item.status === "Completed"
  ).length;

  const pendingReturns = returns.filter(
    (item) => item.status === "Pending"
  ).length;

  const totalRefunds = returns.reduce(
    (sum, item) => sum + item.refundAmount,
    0
  );

  const totalReturnedValue = returns.reduce(
    (sum, item) => sum + item.totalAmount,
    0
  );

  function openAddModal() {
    setEditingReturn(null);

    setForm({
      ...emptyForm,
      refundAmount: "",
    });

    setShowModal(true);
  }

  function openEditModal(item: ReturnRecord) {
    const firstItem = item.items[0];

    setEditingReturn(item);

    setForm({
      invoiceNo: item.invoiceNo,
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      productName: firstItem?.productName || "",
      quantity: String(firstItem?.quantity || 1),
      unit: firstItem?.unit || "PCS",
      price: String(firstItem?.price || ""),
      reason: item.reason,
      refundAmount: String(item.refundAmount),
      refundMethod: item.refundMethod,
      status: item.status,
      notes: item.notes,
    });

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingReturn(null);
  }

  function handleFormChange(
    field: keyof typeof emptyForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSave() {
    if (
      !form.invoiceNo.trim() ||
      !form.customerName.trim() ||
      !form.productName.trim() ||
      !form.price ||
      !form.quantity
    ) {
      window.alert(
        "Please fill Invoice No, Customer, Product, Quantity and Price."
      );

      return;
    }

    const quantity = Number(form.quantity);
    const price = Number(form.price);

    if (quantity <= 0 || price < 0) {
      window.alert(
        "Quantity must be greater than 0 and price cannot be negative."
      );

      return;
    }

    const total = quantity * price;

    const refundAmount = form.refundAmount
      ? Number(form.refundAmount)
      : total;

    const newItem: ReturnItem = {
      id:
        editingReturn?.items[0]?.id ||
        Date.now(),

      productName: form.productName.trim(),

      quantity,

      unit: form.unit,

      price,

      total,
    };

    if (editingReturn) {
      const updatedReturn: ReturnRecord = {
        ...editingReturn,

        invoiceNo: form.invoiceNo.trim(),

        customerName:
          form.customerName.trim(),

        customerPhone:
          form.customerPhone.trim(),

        items: [newItem],

        totalAmount: total,

        refundAmount,

        reason: form.reason.trim(),

        refundMethod: form.refundMethod,

        status: form.status,

        notes: form.notes.trim(),
      };

      setReturns((current) =>
        current.map((item) =>
          item.id === editingReturn.id
            ? updatedReturn
            : item
        )
      );
    } else {
      const newReturn: ReturnRecord = {
        id: Date.now(),

        returnNo: `RET-${String(
          returns.length + 1
        ).padStart(4, "0")}`,

        invoiceNo: form.invoiceNo.trim(),

        date: new Date().toLocaleString(
          "en-PK",
          {
            dateStyle: "medium",
            timeStyle: "short",
          }
        ),

        customerName:
          form.customerName.trim(),

        customerPhone:
          form.customerPhone.trim(),

        items: [newItem],

        totalAmount: total,

        refundAmount,

        reason: form.reason.trim(),

        refundMethod:
          form.refundMethod,

        status: form.status,

        notes: form.notes.trim(),
      };

      setReturns((current) => [
        newReturn,
        ...current,
      ]);
    }

    closeModal();
  }

  function deleteReturn(id: number) {
    const item = returns.find(
      (returnItem) =>
        returnItem.id === id
    );

    if (!item) return;

    const confirmed = window.confirm(
      `Delete ${item.returnNo}?`
    );

    if (!confirmed) return;

    setReturns((current) =>
      current.filter(
        (returnItem) =>
          returnItem.id !== id
      )
    );
  }

  function openDetails(item: ReturnRecord) {
    setSelectedReturn(item);
    setShowDetails(true);
  }

  function closeDetails() {
    setSelectedReturn(null);
    setShowDetails(false);
  }

  function printReturn(item: ReturnRecord) {
    setSelectedReturn(item);

    setTimeout(() => {
      window.print();
    }, 100);
  }

  function getStatusClass(status: ReturnStatus) {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700";

      case "Approved":
        return "bg-blue-50 text-blue-700";

      case "Pending":
        return "bg-amber-50 text-amber-700";

      case "Rejected":
        return "bg-red-50 text-red-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 print:bg-white">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Returns
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage returned products and customer refunds.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95"
          >
            + New Return
          </button>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Returns"
            value={String(totalReturns)}
            icon="↩"
          />

          <StatCard
            title="Completed"
            value={String(completedReturns)}
            icon="✓"
            valueClass="text-emerald-600"
          />

          <StatCard
            title="Pending"
            value={String(pendingReturns)}
            icon="◷"
            valueClass="text-amber-600"
          />

          <StatCard
            title="Total Refunds"
            value={formatPrice(totalRefunds)}
            icon="Rs"
          />

        </div>

        {/* RETURNED VALUE */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Total Returned Product Value
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatPrice(totalReturnedValue)}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Customer Returns
            </div>

          </div>

        </div>

        {/* TABLE CARD */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* FILTERS */}

          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row">

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search return, invoice or customer..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 md:flex-1"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "All"
                    | ReturnStatus
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-slate-400"
            >
              <option value="All">
                All Status
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Approved">
                Approved
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Rejected">
                Rejected
              </option>
            </select>

          </div>

          {/* RESULT COUNT */}

          <div className="border-b border-slate-200 px-5 py-4">

            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-900">
                {filteredReturns.length}
              </span>{" "}
              return
              {filteredReturns.length !== 1
                ? "s"
                : ""}
            </p>

          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-275">

              <thead>

                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Return
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Product
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Qty
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Refund
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredReturns.length === 0 ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >

                      <div className="text-4xl">
                        ↩
                      </div>

                      <h3 className="mt-3 font-bold text-slate-800">
                        No returns found
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Try another search or add a new return.
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredReturns.map(
                    (item) => {

                      const firstItem =
                        item.items[0];

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 transition hover:bg-slate-50"
                        >

                          {/* RETURN */}

                          <td className="px-5 py-4">

                            <p className="font-bold text-slate-900">
                              {item.returnNo}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Invoice: {item.invoiceNo}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {item.date}
                            </p>

                          </td>

                          {/* CUSTOMER */}

                          <td className="px-5 py-4">

                            <p className="font-semibold text-slate-800">
                              {item.customerName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.customerPhone ||
                                "No phone"}
                            </p>

                          </td>

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <p className="font-semibold text-slate-800">
                              {firstItem?.productName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.reason}
                            </p>

                          </td>

                          {/* QTY */}

                          <td className="px-5 py-4">

                            <span className="font-bold text-slate-800">
                              {firstItem?.quantity}{" "}
                              {firstItem?.unit}
                            </span>

                          </td>

                          {/* AMOUNT */}

                          <td className="px-5 py-4">

                            <span className="font-bold text-slate-900">
                              {formatPrice(
                                item.totalAmount
                              )}
                            </span>

                          </td>

                          {/* REFUND */}

                          <td className="px-5 py-4">

                            <p className="font-bold text-emerald-600">
                              {formatPrice(
                                item.refundAmount
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.refundMethod}
                            </p>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClass(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openDetails(item)
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(item)
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteReturn(
                                    item.id
                                  )
                                }
                                className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
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

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 p-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingReturn
                    ? "Edit Return"
                    : "New Return"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter returned product and refund details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <div className="space-y-5 p-5">

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <FormField label="Invoice Number">
                  <input
                    value={form.invoiceNo}
                    onChange={(event) =>
                      handleFormChange(
                        "invoiceNo",
                        event.target.value
                      )
                    }
                    placeholder="INV-0001"
                    className="input-field"
                  />
                </FormField>

                <FormField label="Customer Name">
                  <input
                    value={form.customerName}
                    onChange={(event) =>
                      handleFormChange(
                        "customerName",
                        event.target.value
                      )
                    }
                    placeholder="Customer name"
                    className="input-field"
                  />
                </FormField>

                <FormField label="Customer Phone">
                  <input
                    value={form.customerPhone}
                    onChange={(event) =>
                      handleFormChange(
                        "customerPhone",
                        event.target.value
                      )
                    }
                    placeholder="0300-1234567"
                    className="input-field"
                  />
                </FormField>

                <FormField label="Product">
                  <input
                    value={form.productName}
                    onChange={(event) =>
                      handleFormChange(
                        "productName",
                        event.target.value
                      )
                    }
                    placeholder="Product name"
                    className="input-field"
                  />
                </FormField>

                <FormField label="Quantity">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.quantity}
                    onChange={(event) =>
                      handleFormChange(
                        "quantity",
                        event.target.value
                      )
                    }
                    className="input-field"
                  />
                </FormField>

                <FormField label="Unit">
                  <select
                    value={form.unit}
                    onChange={(event) =>
                      handleFormChange(
                        "unit",
                        event.target.value
                      )
                    }
                    className="input-field"
                  >
                    <option value="PCS">
                      PCS
                    </option>

                    <option value="KG">
                      KG
                    </option>
                  </select>
                </FormField>

                <FormField label="Product Price">
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(event) =>
                      handleFormChange(
                        "price",
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="input-field"
                  />
                </FormField>

                <FormField label="Refund Amount">
                  <input
                    type="number"
                    min="0"
                    value={form.refundAmount}
                    onChange={(event) =>
                      handleFormChange(
                        "refundAmount",
                        event.target.value
                      )
                    }
                    placeholder="Leave empty for full refund"
                    className="input-field"
                  />
                </FormField>

                <FormField label="Refund Method">
                  <select
                    value={form.refundMethod}
                    onChange={(event) =>
                      handleFormChange(
                        "refundMethod",
                        event.target.value
                      )
                    }
                    className="input-field"
                  >
                    <option value="Cash">
                      Cash
                    </option>

                    <option value="Bank">
                      Bank
                    </option>

                    <option value="Credit">
                      Customer Credit
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </FormField>

                <FormField label="Status">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      handleFormChange(
                        "status",
                        event.target.value
                      )
                    }
                    className="input-field"
                  >
                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Approved">
                      Approved
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="Rejected">
                      Rejected
                    </option>
                  </select>
                </FormField>

              </div>

              {/* REASON */}

              <FormField label="Return Reason">
                <select
                  value={form.reason}
                  onChange={(event) =>
                    handleFormChange(
                      "reason",
                      event.target.value
                    )
                  }
                  className="input-field"
                >
                  <option value="">
                    Select reason
                  </option>

                  <option value="Product damaged">
                    Product damaged
                  </option>

                  <option value="Wrong product">
                    Wrong product
                  </option>

                  <option value="Wrong quantity">
                    Wrong quantity
                  </option>

                  <option value="Customer changed mind">
                    Customer changed mind
                  </option>

                  <option value="Warranty issue">
                    Warranty issue
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </FormField>

              {/* NOTES */}

              <FormField label="Notes">

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    handleFormChange(
                      "notes",
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Additional notes..."
                  className="input-field resize-none"
                />

              </FormField>

              {/* PREVIEW */}

              {form.price &&
                form.quantity && (
                  <div className="rounded-xl bg-slate-50 p-4">

                    <div className="flex justify-between text-sm">

                      <span className="text-slate-500">
                        Return Value
                      </span>

                      <span className="font-bold text-slate-900">
                        {formatPrice(
                          Number(form.price) *
                            Number(
                              form.quantity
                            )
                        )}
                      </span>

                    </div>

                    <div className="mt-2 flex justify-between text-sm">

                      <span className="text-slate-500">
                        Refund
                      </span>

                      <span className="font-bold text-emerald-600">
                        {formatPrice(
                          form.refundAmount
                            ? Number(
                                form.refundAmount
                              )
                            : Number(
                                form.price
                              ) *
                                Number(
                                  form.quantity
                                )
                        )}
                      </span>

                    </div>

                  </div>
                )}

            </div>

            {/* ACTIONS */}

            <div className="flex gap-3 border-t border-slate-200 p-5">

              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                {editingReturn
                  ? "Update Return"
                  : "Save Return"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* DETAILS MODAL */}

      {showDetails &&
        selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              <div className="flex items-start justify-between border-b border-slate-200 p-6">

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Return Details
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {selectedReturn.returnNo}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Invoice:{" "}
                    {selectedReturn.invoiceNo}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  ×
                </button>

              </div>

              <div className="space-y-5 p-6">

                {/* CUSTOMER */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <InfoBox
                    label="Customer"
                    value={
                      selectedReturn.customerName
                    }
                  />

                  <InfoBox
                    label="Phone"
                    value={
                      selectedReturn.customerPhone ||
                      "Not provided"
                    }
                  />

                  <InfoBox
                    label="Date"
                    value={
                      selectedReturn.date
                    }
                  />

                  <InfoBox
                    label="Status"
                    value={
                      selectedReturn.status
                    }
                  />

                </div>

                {/* PRODUCT */}

                <div className="overflow-hidden rounded-xl border border-slate-200">

                  <table className="w-full">

                    <thead className="bg-slate-50">

                      <tr>

                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                          Product
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">
                          Qty
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">
                          Price
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">
                          Total
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {selectedReturn.items.map(
                        (item) => (
                          <tr
                            key={item.id}
                            className="border-t border-slate-100"
                          >

                            <td className="px-4 py-4 text-sm font-semibold">
                              {item.productName}
                            </td>

                            <td className="px-4 py-4 text-center text-sm">
                              {item.quantity}{" "}
                              {item.unit}
                            </td>

                            <td className="px-4 py-4 text-right text-sm">
                              {formatPrice(
                                item.price
                              )}
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-bold">
                              {formatPrice(
                                item.total
                              )}
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

                {/* SUMMARY */}

                <div className="ml-auto max-w-sm space-y-3 rounded-xl bg-slate-50 p-4">

                  <div className="flex justify-between">

                    <span className="text-sm text-slate-500">
                      Returned Value
                    </span>

                    <span className="font-bold">
                      {formatPrice(
                        selectedReturn.totalAmount
                      )}
                    </span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-sm text-slate-500">
                      Refund Amount
                    </span>

                    <span className="font-bold text-emerald-600">
                      {formatPrice(
                        selectedReturn.refundAmount
                      )}
                    </span>

                  </div>

                  <div className="flex justify-between border-t border-slate-200 pt-3">

                    <span className="text-sm text-slate-500">
                      Refund Method
                    </span>

                    <span className="font-bold">
                      {
                        selectedReturn.refundMethod
                      }
                    </span>

                  </div>

                </div>

                {/* REASON */}

                <div>

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Return Reason
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedReturn.reason ||
                      "Not specified"}
                  </p>

                </div>

                {/* NOTES */}

                {selectedReturn.notes && (
                  <div>

                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Notes
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {selectedReturn.notes}
                    </p>

                  </div>
                )}

              </div>

              <div className="flex gap-3 border-t border-slate-200 p-5">

                <button
                  type="button"
                  onClick={() =>
                    printReturn(
                      selectedReturn
                    )
                  }
                  className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
                >
                  🖨 Print
                </button>

                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}

      {/* SMALL PRINT CSS */}

      <style jsx global>{`
        .input-field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
        }

        .input-field:focus {
          border-color: rgb(100 116 139);
          background: white;
          box-shadow: 0 0 0 3px rgb(241 245 249);
        }

        @media print {
          body * {
            visibility: hidden;
          }

          .print\\:bg-white,
          .print\\:bg-white * {
            visibility: visible;
          }

          .print\\:bg-white {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

    </div>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  icon,
  valueClass = "text-slate-900",
}: {
  title: string;
  value: string;
  icon: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${valueClass}`}
          >
            {value}
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
          {icon}
        </div>

      </div>

    </div>
  );
}

/* =====================================================
   FORM FIELD
===================================================== */

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      {children}

    </label>
  );
}

/* =====================================================
   INFO BOX
===================================================== */

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-800">
        {value}
      </p>

    </div>
  );
}