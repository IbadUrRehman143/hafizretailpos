"use client";

import { useMemo, useState } from "react";

type StockType = "Weight" | "Quantity" | "Size";
type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  category: string;
  type: StockType;
  stock: number;
  unit: "KG" | "PCS";
  lowStockLimit: number;
  purchasePrice: number;
  sellingPrice: number;
};

const initialInventory: InventoryItem[] = [
  {
    id: 1,
    name: "Cotton",
    sku: "COT-001",
    category: "Cotton",
    type: "Weight",
    stock: 264,
    unit: "KG",
    lowStockLimit: 100,
    purchasePrice: 180,
    sellingPrice: 220,
  },
  {
    id: 2,
    name: "Washing Machine",
    sku: "WM-001",
    category: "Appliances",
    type: "Quantity",
    stock: 10,
    unit: "PCS",
    lowStockLimit: 3,
    purchasePrice: 45000,
    sellingPrice: 50000,
  },
  {
    id: 3,
    name: "Pedestal Fan",
    sku: "PF-001",
    category: "Electronics",
    type: "Quantity",
    stock: 2,
    unit: "PCS",
    lowStockLimit: 5,
    purchasePrice: 7000,
    sellingPrice: 8500,
  },
  {
    id: 4,
    name: "Charpai 6x3",
    sku: "CHR-001",
    category: "Furniture",
    type: "Size",
    stock: 0,
    unit: "PCS",
    lowStockLimit: 2,
    purchasePrice: 5000,
    sellingPrice: 6500,
  },
  {
    id: 5,
    name: "Ceiling Fan",
    sku: "CF-001",
    category: "Electronics",
    type: "Quantity",
    stock: 15,
    unit: "PCS",
    lowStockLimit: 5,
    purchasePrice: 7500,
    sellingPrice: 9000,
  },
];

const categories = [
  "All",
  "Cotton",
  "Electronics",
  "Appliances",
  "Furniture",
  "Beds",
  "Bamboo",
  "Other",
];

export default function InventoryPage() {
  const [inventory, setInventory] =
    useState<InventoryItem[]>(initialInventory);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [showAdjustment, setShowAdjustment] =
    useState(false);

  const [selectedItem, setSelectedItem] =
    useState<InventoryItem | null>(null);

  const [adjustmentType, setAdjustmentType] =
    useState<"add" | "remove">("add");

  const [adjustmentAmount, setAdjustmentAmount] =
    useState("");

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        item.name.toLowerCase().includes(searchValue) ||
        item.sku.toLowerCase().includes(searchValue) ||
        item.category.toLowerCase().includes(searchValue);

      const matchesCategory =
        categoryFilter === "All" ||
        item.category === categoryFilter;

      const status = getStockStatus(item);

      const matchesStatus =
        statusFilter === "All" ||
        status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    inventory,
    search,
    categoryFilter,
    statusFilter,
  ]);

  const totalItems = inventory.length;

  const inStock = inventory.filter(
    (item) => getStockStatus(item) === "In Stock"
  ).length;

  const lowStock = inventory.filter(
    (item) => getStockStatus(item) === "Low Stock"
  ).length;

  const outOfStock = inventory.filter(
    (item) => getStockStatus(item) === "Out of Stock"
  ).length;

  const totalStockValue = inventory.reduce(
    (total, item) =>
      total + item.stock * item.purchasePrice,
    0
  );

  function openAdjustment(item: InventoryItem) {
    setSelectedItem(item);
    setAdjustmentType("add");
    setAdjustmentAmount("");
    setShowAdjustment(true);
  }

  function closeAdjustment() {
    setShowAdjustment(false);
    setSelectedItem(null);
    setAdjustmentAmount("");
  }

  function handleAdjustment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedItem) return;

    const amount = Number(adjustmentAmount);

    if (!amount || amount <= 0) {
      alert("Enter a valid quantity.");
      return;
    }

    setInventory((previous) =>
      previous.map((item) => {
        if (item.id !== selectedItem.id) {
          return item;
        }

        const newStock =
          adjustmentType === "add"
            ? item.stock + amount
            : Math.max(item.stock - amount, 0);

        return {
          ...item,
          stock: newStock,
        };
      })
    );

    closeAdjustment();
  }

  function formatCurrency(value: number) {
    return `Rs. ${value.toLocaleString()}`;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Inventory
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor stock, stock value and inventory status.
            </p>
          </div>

          <div className="rounded-xl bg-white px-4 py-3 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500">
              Inventory Value
            </p>

            <p className="text-lg font-bold text-slate-900">
              {formatCurrency(totalStockValue)}
            </p>
          </div>

        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <StatCard
            title="Total Items"
            value={totalItems}
          />

          <StatCard
            title="In Stock"
            value={inStock}
          />

          <StatCard
            title="Low Stock"
            value={lowStock}
          />

          <StatCard
            title="Out of Stock"
            value={outOfStock}
          />

        </div>

        {/* Search & Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="grid gap-3 md:grid-cols-[1fr_200px_200px]">

            {/* Search */}
            <div className="relative">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                🔎
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search product, SKU or category..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
              />

            </div>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category === "All"
                    ? "All Categories"
                    : category}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="All">
                All Status
              </option>

              <option value="In Stock">
                In Stock
              </option>

              <option value="Low Stock">
                Low Stock
              </option>

              <option value="Out of Stock">
                Out of Stock
              </option>
            </select>

          </div>

        </div>

        {/* Inventory Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-275">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr>

                  <TableHead>
                    Product
                  </TableHead>

                  <TableHead>
                    SKU
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
                    Purchase
                  </TableHead>

                  <TableHead>
                    Selling
                  </TableHead>

                  <TableHead>
                    Stock Value
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Action
                  </TableHead>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredInventory.length === 0 ? (

                  <tr>

                    <td
                      colSpan={10}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No inventory items found.
                    </td>

                  </tr>

                ) : (

                  filteredInventory.map((item) => {

                    const status =
                      getStockStatus(item);

                    const stockValue =
                      item.stock *
                      item.purchasePrice;

                    return (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50"
                      >

                        {/* Product */}
                        <td className="px-5 py-4">

                          <p className="font-semibold text-slate-900">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Limit:{" "}
                            {item.lowStockLimit}{" "}
                            {item.unit}
                          </p>

                        </td>

                        {/* SKU */}
                        <td className="px-5 py-4">

                          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {item.sku}
                          </span>

                        </td>

                        {/* Category */}
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {item.category}
                        </td>

                        {/* Type */}
                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.type === "Weight"
                                ? "bg-blue-50 text-blue-700"
                                : item.type === "Quantity"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-purple-50 text-purple-700"
                            }`}
                          >
                            {item.type}
                          </span>

                        </td>

                        {/* Stock */}
                        <td className="px-5 py-4">

                          <p className="text-lg font-bold text-slate-900">
                            {item.stock}
                          </p>

                          <p className="text-xs text-slate-500">
                            {item.unit}
                          </p>

                        </td>

                        {/* Purchase */}
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatCurrency(
                            item.purchasePrice
                          )}
                        </td>

                        {/* Selling */}
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {formatCurrency(
                            item.sellingPrice
                          )}
                        </td>

                        {/* Stock Value */}
                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {formatCurrency(stockValue)}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">

                          <StatusBadge
                            status={status}
                          />

                        </td>

                        {/* Action */}
                        <td className="px-5 py-4">

                          <button
                            onClick={() =>
                              openAdjustment(item)
                            }
                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            Adjust Stock
                          </button>

                        </td>

                      </tr>
                    );
                  })

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustment && selectedItem && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  Adjust Stock
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedItem.name}
                </p>

              </div>

              <button
                onClick={closeAdjustment}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            {/* Current Stock */}
            <div className="px-6 pt-6">

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs text-slate-500">
                  Current Stock
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {selectedItem.stock}{" "}
                  {selectedItem.unit}
                </p>

              </div>

            </div>

            {/* Form */}
            <form
              onSubmit={handleAdjustment}
              className="space-y-5 p-6"
            >

              {/* Adjustment Type */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Adjustment Type
                </label>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setAdjustmentType("add")
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                      adjustmentType === "add"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    + Add Stock
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAdjustmentType("remove")
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                      adjustmentType === "remove"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    − Remove Stock
                  </button>

                </div>

              </div>

              {/* Amount */}
              <label className="block">

                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Quantity ({selectedItem.unit})
                </span>

                <input
                  type="number"
                  min="0"
                  step={
                    selectedItem.unit === "KG"
                      ? "0.01"
                      : "1"
                  }
                  value={adjustmentAmount}
                  onChange={(event) =>
                    setAdjustmentAmount(
                      event.target.value
                    )
                  }
                  placeholder="Enter quantity"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

              </label>

              {/* Footer */}
              <div className="flex gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  onClick={closeAdjustment}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Update Stock
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

function getStockStatus(
  item: InventoryItem
): StockStatus {
  if (item.stock <= 0) {
    return "Out of Stock";
  }

  if (item.stock <= item.lowStockLimit) {
    return "Low Stock";
  }

  return "In Stock";
}

/* =========================
   Components
========================= */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: StockStatus;
}) {
  const styles = {
    "In Stock":
      "bg-green-50 text-green-700",
    "Low Stock":
      "bg-orange-50 text-orange-700",
    "Out of Stock":
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