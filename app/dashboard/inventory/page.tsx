"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Loader2,
  Package,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

/* =====================================================
   TYPES
===================================================== */

type ProductType =
  | "weight"
  | "quantity"
  | "size";

type StockType =
  | "Weight"
  | "Quantity"
  | "Size";

type StockStatus =
  | "In Stock"
  | "Low Stock"
  | "Out of Stock";

type ApiProduct = {
  id: number;

  name: string;

  category?: string | null;

  type?:
    | ProductType
    | string
    | null;

  unit?: string | null;

  purchasePrice?: number | string | null;

  sellingPrice?: number | string | null;

  quantity?: number | string | null;

  weightEntries?: string | null;

  size?: string | null;

  material?: string | null;

  brand?: string | null;

  model?: string | null;

  quality?: string | null;

  color?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

type InventoryItem = {
  id: number;

  name: string;

  sku: string;

  category: string;

  productType: ProductType;

  type: StockType;

  stock: number;

  unit: "KG" | "PCS";

  lowStockLimit: number;

  purchasePrice: number;

  sellingPrice: number;

  weightEntries: string;

  originalProduct: ApiProduct;
};

/* =====================================================
   HELPERS
===================================================== */

function safeNumber(
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

/* =====================================================
   NORMALIZE PRODUCT TYPE
===================================================== */

function normalizeProductType(
  value: unknown
): ProductType {
  const type =
    String(
      value || ""
    ).toLowerCase();

  if (
    type === "weight"
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

/* =====================================================
   WEIGHT ENTRIES

   Example:
   "87+76+98+12"
===================================================== */

function parseWeightEntries(
  value: unknown
) {
  return String(
    value || ""
  )
    .split("+")
    .map(
      (
        item
      ) =>
        safeNumber(
          item.trim()
        )
    )
    .filter(
      (
        item
      ) =>
        item > 0
    );
}

/* =====================================================
   TOTAL WEIGHT STOCK
===================================================== */

function calculateWeightStock(
  value: unknown
) {
  return parseWeightEntries(
    value
  ).reduce(
    (
      total,
      weight
    ) =>
      total +
      weight,
    0
  );
}

/* =====================================================
   FORMAT WEIGHT ENTRIES
===================================================== */

function formatWeightEntries(
  entries: number[]
) {
  return entries
    .filter(
      (
        entry
      ) =>
        entry > 0
    )
    .map(
      (
        entry
      ) =>
        Number(
          entry.toFixed(
            2
          )
        )
    )
    .join("+");
}

/* =====================================================
   REMOVE WEIGHT FIFO

   Example:

   Current:
   80 + 60 + 50

   Remove:
   100

   Result:
   40 + 50
===================================================== */

function removeWeightFIFO(
  currentEntries: number[],
  amountToRemove: number
) {
  let remaining =
    amountToRemove;

  const updatedEntries =
    [...currentEntries];

  while (
    remaining > 0 &&
    updatedEntries.length >
      0
  ) {
    const firstWeight =
      updatedEntries[0];

    if (
      firstWeight <=
      remaining
    ) {
      remaining -=
        firstWeight;

      updatedEntries.shift();
    } else {
      updatedEntries[0] =
        firstWeight -
        remaining;

      remaining = 0;
    }
  }

  return updatedEntries;
}

/* =====================================================
   INVENTORY NORMALIZER
===================================================== */

function normalizeInventoryItem(
  product: ApiProduct
): InventoryItem {
  const productType =
    normalizeProductType(
      product.type
    );

  const isWeight =
    productType ===
    "weight";

  const stock =
    isWeight
      ? calculateWeightStock(
          product.weightEntries
        )
      : Math.max(
          0,
          safeNumber(
            product.quantity
          )
        );

  const type: StockType =
    productType ===
    "weight"
      ? "Weight"
      : productType ===
          "size"
        ? "Size"
        : "Quantity";

  /*
    Business Low Stock Rules

    Weight products:
    <= 100 KG

    Quantity / Size products:
    <= 5 PCS
  */

  const lowStockLimit =
    isWeight
      ? 100
      : 5;

  return {
    id:
      Number(
        product.id
      ),

    name:
      String(
        product.name ||
          "Unnamed Product"
      ),

    sku:
      `PRD-${String(
        product.id
      ).padStart(
        4,
        "0"
      )}`,

    category:
      String(
        product.category ||
          "Other"
      ),

    productType,

    type,

    stock,

    unit:
      isWeight
        ? "KG"
        : "PCS",

    lowStockLimit,

    purchasePrice:
      Math.max(
        0,
        safeNumber(
          product.purchasePrice
        )
      ),

    sellingPrice:
      Math.max(
        0,
        safeNumber(
          product.sellingPrice
        )
      ),

    weightEntries:
      String(
        product.weightEntries ||
          ""
      ),

    originalProduct:
      product,
  };
}

/* =====================================================
   STOCK STATUS
===================================================== */

function getStockStatus(
  item: InventoryItem
): StockStatus {
  if (
    item.stock <= 0
  ) {
    return "Out of Stock";
  }

  if (
    item.stock <=
    item.lowStockLimit
  ) {
    return "Low Stock";
  }

  return "In Stock";
}

/* =====================================================
   CURRENCY
===================================================== */

function formatCurrency(
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

/* =====================================================
   MAIN PAGE
===================================================== */

export default function InventoryPage() {

  /* =================================================
     STATE
  ================================================= */

  const [
    inventory,
    setInventory,
  ] =
    useState<
      InventoryItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("All");

  const [
    showAdjustment,
    setShowAdjustment,
  ] =
    useState(false);

  const [
    selectedItem,
    setSelectedItem,
  ] =
    useState<
      InventoryItem | null
    >(null);

  const [
    adjustmentType,
    setAdjustmentType,
  ] =
    useState<
      "add" | "remove"
    >("add");

  const [
    adjustmentAmount,
    setAdjustmentAmount,
  ] =
    useState("");

  const [
    adjustmentSaving,
    setAdjustmentSaving,
  ] =
    useState(false);

  /* =================================================
     LOAD PRODUCTS
  ================================================= */

  const loadInventory =
    useCallback(
      async () => {
        try {
          setLoading(
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
            const text =
              await response.text();

            throw new Error(
              text ||
                "Failed to load inventory."
            );
          }

          const data =
            await response.json();

          /*
            Supports both:

            [
              product,
              product
            ]

            OR

            {
              products: [...]
            }
          */

          const products: ApiProduct[] =
            Array.isArray(
              data
            )
              ? data
              : Array.isArray(
                    data?.products
                  )
                ? data.products
                : [];

          const normalized =
            products.map(
              (
                product
              ) =>
                normalizeInventoryItem(
                  product
                )
            );

          normalized.sort(
            (
              a,
              b
            ) =>
              a.name.localeCompare(
                b.name
              )
          );

          setInventory(
            normalized
          );
        } catch (
          loadError
        ) {
          console.error(
            loadError
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Failed to load inventory."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  /* =================================================
     INITIAL LOAD
  ================================================= */

  useEffect(
    () => {
      loadInventory();
    },
    [
      loadInventory,
    ]
  );

  /* =================================================
     CATEGORIES
  ================================================= */

  const categories =
    useMemo(
      () => {
        const values =
          Array.from(
            new Set(
              inventory
                .map(
                  (
                    item
                  ) =>
                    item.category
                )
                .filter(
                  Boolean
                )
            )
          ).sort();

        return [
          "All",
          ...values,
        ];
      },
      [
        inventory,
      ]
    );

  /* =================================================
     FILTER INVENTORY
  ================================================= */

  const filteredInventory =
    useMemo(
      () => {
        const searchValue =
          search
            .trim()
            .toLowerCase();

        return inventory.filter(
          (
            item
          ) => {
            const matchesSearch =
              !searchValue ||
              item.name
                .toLowerCase()
                .includes(
                  searchValue
                ) ||
              item.sku
                .toLowerCase()
                .includes(
                  searchValue
                ) ||
              item.category
                .toLowerCase()
                .includes(
                  searchValue
                );

            const matchesCategory =
              categoryFilter ===
                "All" ||
              item.category ===
                categoryFilter;

            const status =
              getStockStatus(
                item
              );

            const matchesStatus =
              statusFilter ===
                "All" ||
              status ===
                statusFilter;

            return (
              matchesSearch &&
              matchesCategory &&
              matchesStatus
            );
          }
        );
      },
      [
        inventory,
        search,
        categoryFilter,
        statusFilter,
      ]
    );

  /* =================================================
     STATS
  ================================================= */

  const totalItems =
    inventory.length;

  const inStock =
    inventory.filter(
      (
        item
      ) =>
        getStockStatus(
          item
        ) ===
        "In Stock"
    ).length;

  const lowStock =
    inventory.filter(
      (
        item
      ) =>
        getStockStatus(
          item
        ) ===
        "Low Stock"
    ).length;

  const outOfStock =
    inventory.filter(
      (
        item
      ) =>
        getStockStatus(
          item
        ) ===
        "Out of Stock"
    ).length;

  const totalStockValue =
    inventory.reduce(
      (
        total,
        item
      ) =>
        total +
        item.stock *
          item.purchasePrice,
      0
    );

  /* =================================================
     OPEN ADJUSTMENT
  ================================================= */

  function openAdjustment(
    item: InventoryItem
  ) {
    setSelectedItem(
      item
    );

    setAdjustmentType(
      "add"
    );

    setAdjustmentAmount(
      ""
    );

    setShowAdjustment(
      true
    );
  }

  /* =================================================
     CLOSE ADJUSTMENT
  ================================================= */

  function closeAdjustment() {
    if (
      adjustmentSaving
    ) {
      return;
    }

    setShowAdjustment(
      false
    );

    setSelectedItem(
      null
    );

    setAdjustmentAmount(
      ""
    );

    setAdjustmentType(
      "add"
    );
  }

  /* =================================================
     STOCK ADJUSTMENT
  ================================================= */

  async function handleAdjustment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !selectedItem
    ) {
      return;
    }

    const amount =
      Number(
        adjustmentAmount
      );

    /* ===============================================
       VALIDATION
    =============================================== */

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      alert(
        "Enter a valid stock quantity."
      );

      return;
    }

    if (
      selectedItem.unit ===
        "PCS" &&
      !Number.isInteger(
        amount
      )
    ) {
      alert(
        "PCS stock must be a whole number."
      );

      return;
    }

    if (
      adjustmentType ===
        "remove" &&
      amount >
        selectedItem.stock
    ) {
      alert(
        `Cannot remove ${amount} ${selectedItem.unit}. Current stock is only ${selectedItem.stock} ${selectedItem.unit}.`
      );

      return;
    }

    try {
      setAdjustmentSaving(
        true
      );

      const product =
        selectedItem.originalProduct;

      /* =============================================
         UPDATE BODY
      ============================================= */

      let updatedQuantity =
        safeNumber(
          product.quantity
        );

      let updatedWeightEntries =
        String(
          product.weightEntries ||
            ""
        );

      /* =============================================
         WEIGHT PRODUCT
      ============================================= */

      if (
        selectedItem.productType ===
        "weight"
      ) {
        const currentEntries =
          parseWeightEntries(
            product.weightEntries
          );

        if (
          adjustmentType ===
          "add"
        ) {
          /*
            Manual added weight becomes a
            new stock entry.

            Example:
            80+70

            Add 25:

            80+70+25
          */

          const newEntries =
            [
              ...currentEntries,
              amount,
            ];

          updatedWeightEntries =
            formatWeightEntries(
              newEntries
            );
        } else {
          /*
            Remove using FIFO
          */

          const newEntries =
            removeWeightFIFO(
              currentEntries,
              amount
            );

          updatedWeightEntries =
            formatWeightEntries(
              newEntries
            );
        }
      }

      /* =============================================
         QUANTITY / SIZE PRODUCT
      ============================================= */

      else {
        updatedQuantity =
          adjustmentType ===
          "add"
            ? selectedItem.stock +
              amount
            : selectedItem.stock -
              amount;

        updatedQuantity =
          Math.max(
            0,
            updatedQuantity
          );
      }

      /* =============================================
         PUT PRODUCT

         We send existing product fields as well,
         so current Product API can safely update it.
      ============================================= */

      const response =
        await fetch(
          `/api/products/${selectedItem.id}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  name:
                    product.name,

                  category:
                    product.category,

                  type:
                    selectedItem.productType,

                  unit:
                    selectedItem.productType ===
                    "weight"
                      ? "KG"
                      : product.unit ||
                        "PCS",

                  purchasePrice:
                    safeNumber(
                      product.purchasePrice
                    ),

                  sellingPrice:
                    safeNumber(
                      product.sellingPrice
                    ),

                  quantity:
                    selectedItem.productType ===
                    "weight"
                      ? safeNumber(
                          product.quantity
                        )
                      : updatedQuantity,

                  weightEntries:
                    selectedItem.productType ===
                    "weight"
                      ? updatedWeightEntries
                      : product.weightEntries ||
                        "",

                  size:
                    product.size ||
                    "",

                  material:
                    product.material ||
                    "",

                  brand:
                    product.brand ||
                    "",

                  model:
                    product.model ||
                    "",

                  quality:
                    product.quality ||
                    "",

                  color:
                    product.color ||
                    "",
                }
              ),
          }
        );

      /* =============================================
         RESPONSE ERROR
      ============================================= */

      if (
        !response.ok
      ) {
        let message =
          "Failed to update stock.";

        try {
          const errorData =
            await response.json();

          message =
            errorData?.error ||
            errorData?.message ||
            message;
        } catch {
          const text =
            await response.text();

          if (
            text
          ) {
            message =
              text;
          }
        }

        throw new Error(
          message
        );
      }

      /* =============================================
         RELOAD REAL DATABASE STOCK
      ============================================= */

      await loadInventory();

      closeAdjustment();

      alert(
        adjustmentType ===
        "add"
          ? `Stock added successfully: +${amount} ${selectedItem.unit}`
          : `Stock removed successfully: -${amount} ${selectedItem.unit}`
      );
    } catch (
      adjustmentError
    ) {
      console.error(
        adjustmentError
      );

      alert(
        adjustmentError instanceof
          Error
          ? adjustmentError.message
          : "Failed to update stock."
      );
    } finally {
      setAdjustmentSaving(
        false
      );
    }
  }

  /* =================================================
     UI
  ================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Inventory
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor real product stock, inventory value and stock status.
            </p>

          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            {/* REFRESH */}

            <button
              type="button"
              onClick={
                loadInventory
              }
              disabled={
                loading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            {/* INVENTORY VALUE */}

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

              <p className="text-xs text-slate-500">
                Inventory Value
              </p>

              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(
                  totalStockValue
                )}
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

            <XCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>

              <p className="font-semibold text-red-700">
                Failed to load inventory
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>

            </div>

          </div>

        )}

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <StatCard
            title="Total Items"
            value={
              totalItems
            }
            icon={
              <Boxes
                size={20}
              />
            }
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="In Stock"
            value={
              inStock
            }
            icon={
              <CheckCircle2
                size={20}
              />
            }
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Low Stock"
            value={
              lowStock
            }
            icon={
              <AlertTriangle
                size={20}
              />
            }
            iconClass="bg-amber-50 text-amber-600"
          />

          <StatCard
            title="Out of Stock"
            value={
              outOfStock
            }
            icon={
              <XCircle
                size={20}
              />
            }
            iconClass="bg-red-50 text-red-600"
          />

        </div>

        {/* =================================================
            SEARCH & FILTERS
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="grid gap-3 md:grid-cols-[1fr_200px_200px]">

            {/* SEARCH */}

            <div className="relative">

              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search product, SKU or category..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* CATEGORY */}

            <select
              value={
                categoryFilter
              }
              onChange={(
                event
              ) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
            >

              {categories.map(
                (
                  category
                ) => (

                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {category ===
                    "All"
                      ? "All Categories"
                      : category}
                  </option>

                )
              )}

            </select>

            {/* STATUS */}

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
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

        {/* =================================================
            INVENTORY TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px]">

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

                {/* =========================================
                    LOADING
                ========================================= */}

                {loading ? (

                  <tr>

                    <td
                      colSpan={
                        10
                      }
                      className="px-6 py-16"
                    >

                      <div className="flex flex-col items-center justify-center">

                        <Loader2
                          size={32}
                          className="animate-spin text-blue-600"
                        />

                        <p className="mt-3 text-sm font-medium text-slate-600">
                          Loading inventory...
                        </p>

                      </div>

                    </td>

                  </tr>

                ) : filteredInventory.length ===
                  0 ? (

                  /* =========================================
                     EMPTY
                  ========================================= */

                  <tr>

                    <td
                      colSpan={
                        10
                      }
                      className="px-6 py-16 text-center"
                    >

                      <Package
                        size={36}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-3 font-semibold text-slate-700">
                        No inventory items found.
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or filters.
                      </p>

                    </td>

                  </tr>

                ) : (

                  /* =========================================
                     PRODUCTS
                  ========================================= */

                  filteredInventory.map(
                    (
                      item
                    ) => {
                      const status =
                        getStockStatus(
                          item
                        );

                      const stockValue =
                        item.stock *
                        item.purchasePrice;

                      return (

                        <tr
                          key={
                            item.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <p className="font-semibold text-slate-900">
                              {item.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Low stock limit:{" "}
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

                          {/* CATEGORY */}

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {item.category}
                          </td>

                          {/* TYPE */}

                          <td className="px-5 py-4">

                            <TypeBadge
                              type={
                                item.type
                              }
                            />

                          </td>

                          {/* STOCK */}

                          <td className="px-5 py-4">

                            <p className="text-lg font-bold text-slate-900">
                              {item.stock.toLocaleString(
                                "en-PK",
                                {
                                  maximumFractionDigits:
                                    2,
                                }
                              )}
                            </p>

                            <p className="text-xs text-slate-500">
                              {item.unit}
                            </p>

                          </td>

                          {/* PURCHASE */}

                          <td className="px-5 py-4 text-sm text-slate-600">

                            {formatCurrency(
                              item.purchasePrice
                            )}

                            <p className="mt-1 text-xs text-slate-400">
                              per{" "}
                              {item.unit}
                            </p>

                          </td>

                          {/* SELLING */}

                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">

                            {formatCurrency(
                              item.sellingPrice
                            )}

                            <p className="mt-1 text-xs font-normal text-slate-400">
                              per{" "}
                              {item.unit}
                            </p>

                          </td>

                          {/* STOCK VALUE */}

                          <td className="px-5 py-4 text-sm font-bold text-slate-700">

                            {formatCurrency(
                              stockValue
                            )}

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <StatusBadge
                              status={
                                status
                              }
                            />

                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <button
                              type="button"
                              onClick={() =>
                                openAdjustment(
                                  item
                                )
                              }
                              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                            >
                              Adjust Stock
                            </button>

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

      {/* =================================================
          STOCK ADJUSTMENT MODAL
      ================================================= */}

      {showAdjustment &&
        selectedItem && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">

              {/* HEADER */}

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
                  type="button"
                  onClick={
                    closeAdjustment
                  }
                  disabled={
                    adjustmentSaving
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
                >
                  ×
                </button>

              </div>

              {/* CURRENT STOCK */}

              <div className="px-6 pt-6">

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs text-slate-500">
                    Current Stock
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {selectedItem.stock.toLocaleString(
                      "en-PK",
                      {
                        maximumFractionDigits:
                          2,
                      }
                    )}{" "}
                    {selectedItem.unit}
                  </p>

                  {selectedItem.productType ===
                    "weight" &&
                    selectedItem.weightEntries && (

                      <p className="mt-2 break-all text-xs text-slate-500">
                        Weight entries:{" "}
                        {selectedItem.weightEntries}
                      </p>

                    )}

                </div>

              </div>

              {/* FORM */}

              <form
                onSubmit={
                  handleAdjustment
                }
                className="space-y-5 p-6"
              >

                {/* ADJUSTMENT TYPE */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Adjustment Type
                  </label>

                  <div className="grid grid-cols-2 gap-3">

                    <button
                      type="button"
                      disabled={
                        adjustmentSaving
                      }
                      onClick={() =>
                        setAdjustmentType(
                          "add"
                        )
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        adjustmentType ===
                        "add"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      + Add Stock
                    </button>

                    <button
                      type="button"
                      disabled={
                        adjustmentSaving
                      }
                      onClick={() =>
                        setAdjustmentType(
                          "remove"
                        )
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        adjustmentType ===
                        "remove"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      − Remove Stock
                    </button>

                  </div>

                </div>

                {/* AMOUNT */}

                <label className="block">

                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Quantity (
                    {selectedItem.unit}
                    )
                  </span>

                  <input
                    type="number"
                    min="0"
                    step={
                      selectedItem.unit ===
                      "KG"
                        ? "0.01"
                        : "1"
                    }
                    value={
                      adjustmentAmount
                    }
                    onChange={(
                      event
                    ) =>
                      setAdjustmentAmount(
                        event.target.value
                      )
                    }
                    disabled={
                      adjustmentSaving
                    }
                    placeholder={`Enter ${selectedItem.unit}`}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />

                </label>

                {/* PREVIEW */}

                {adjustmentAmount &&
                  safeNumber(
                    adjustmentAmount
                  ) >
                    0 && (

                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                      <p className="text-xs font-medium text-blue-600">
                        Stock After Adjustment
                      </p>

                      <p className="mt-1 text-xl font-bold text-blue-900">

                        {Math.max(
                          0,
                          adjustmentType ===
                            "add"
                            ? selectedItem.stock +
                                safeNumber(
                                  adjustmentAmount
                                )
                            : selectedItem.stock -
                                safeNumber(
                                  adjustmentAmount
                                )
                        ).toLocaleString(
                          "en-PK",
                          {
                            maximumFractionDigits:
                              2,
                          }
                        )}{" "}
                        {selectedItem.unit}

                      </p>

                    </div>

                  )}

                {/* FOOTER */}

                <div className="flex gap-3 border-t border-slate-200 pt-5">

                  <button
                    type="button"
                    onClick={
                      closeAdjustment
                    }
                    disabled={
                      adjustmentSaving
                    }
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      adjustmentSaving
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {adjustmentSaving ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />

                        Saving...
                      </>
                    ) : (
                      "Update Stock"
                    )}

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

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
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between gap-3">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>

        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

      </div>

    </div>

  );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({
  status,
}: {
  status: StockStatus;
}) {
  const styles: Record<
    StockStatus,
    string
  > = {
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

/* =====================================================
   TYPE BADGE
===================================================== */

function TypeBadge({
  type,
}: {
  type: StockType;
}) {
  const styles: Record<
    StockType,
    string
  > = {
    Weight:
      "bg-blue-50 text-blue-700",

    Quantity:
      "bg-emerald-50 text-emerald-700",

    Size:
      "bg-purple-50 text-purple-700",
  };

  return (

    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[type]}`}
    >
      {type}
    </span>

  );
}

/* =====================================================
   TABLE HEAD
===================================================== */

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