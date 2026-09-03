"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  RefreshCw,
  XCircle,
} from "lucide-react";

import AdjustmentModal from "./adjustmentModal";
import InventoryFilters from "./inventoryFilters";
import InventoryHistory from "./inventoryHistory";
import InventoryStats from "./inventoryStats";
import InventoryTable from "./inventoryTable";

import type {
  ApiProduct,
  InventoryItem,
  InventoryTransaction,
} from "./inventoryTypes";

import {
  formatCurrency,
  getStockStatus,
  normalizeInventoryItem,
} from "./inventoryUtils";

/* =====================================================
   INVENTORY PAGE
===================================================== */

export default function InventoryPage() {
  /* =================================================
     INVENTORY STATE
  ================================================= */

  const [inventory, setInventory] =
    useState<InventoryItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =================================================
     INVENTORY HISTORY STATE
  ================================================= */

  const [
    transactions,
    setTransactions,
  ] = useState<
    InventoryTransaction[]
  >([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(true);

  const [
    historyError,
    setHistoryError,
  ] = useState("");

  /* =================================================
     FILTER STATE
  ================================================= */

  const [search, setSearch] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  /* =================================================
     ADJUSTMENT MODAL STATE
  ================================================= */

  const [
    showAdjustment,
    setShowAdjustment,
  ] = useState(false);

  const [
    selectedItem,
    setSelectedItem,
  ] = useState<InventoryItem | null>(
    null
  );

  const [
    adjustmentType,
    setAdjustmentType,
  ] = useState<"add" | "remove">(
    "add"
  );

  const [
    adjustmentAmount,
    setAdjustmentAmount,
  ] = useState("");

  const [
    adjustmentSaving,
    setAdjustmentSaving,
  ] = useState(false);

  /* =================================================
     LOAD INVENTORY
  ================================================= */

  const loadInventory =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/products",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        /* =============================================
           API ERROR
        ============================================= */

        if (!response.ok) {
          let message =
            "Failed to load inventory.";

          try {
            const data =
              await response.json();

            message =
              data?.error ||
              data?.message ||
              message;
          } catch {
            try {
              const text =
                await response.text();

              if (text) {
                message = text;
              }
            } catch {
              // Keep default error
            }
          }

          throw new Error(
            message
          );
        }

        /* =============================================
           RESPONSE
        ============================================= */

        const data =
          await response.json();

        /*
          Products API can return:

          [
            {...},
            {...}
          ]

          OR

          {
            products: [...]
          }

          OR

          {
            data: [...]
          }
        */

        const products: ApiProduct[] =
          Array.isArray(data)
            ? data
            : Array.isArray(
                  data?.products
                )
              ? data.products
              : Array.isArray(
                    data?.data
                  )
                ? data.data
                : [];

        /* =============================================
           NORMALIZE PRODUCTS
        ============================================= */

        const normalized =
          products.map(
            (product) =>
              normalizeInventoryItem(
                product
              )
          );

        /* =============================================
           SORT PRODUCTS
        ============================================= */

        normalized.sort(
          (a, b) =>
            a.name.localeCompare(
              b.name
            )
        );

        setInventory(
          normalized
        );
      } catch (loadError) {
        console.error(
          "LOAD INVENTORY ERROR:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load inventory."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* =================================================
     LOAD INVENTORY HISTORY
  ================================================= */

  const loadInventoryHistory =
    useCallback(async () => {
      try {
        setHistoryLoading(
          true
        );

        setHistoryError("");

        const response =
          await fetch(
            "/api/inventory-transactions",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        /* =============================================
           RESPONSE
        ============================================= */

        let data:
          | {
              success?: boolean;

              transactions?:
                InventoryTransaction[];

              data?:
                InventoryTransaction[];

              message?: string;

              error?: string;
            }
          | InventoryTransaction[]
          | null = null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        /* =============================================
           API ERROR
        ============================================= */

        if (!response.ok) {
          let message =
            "Failed to load inventory history.";

          if (
            data &&
            !Array.isArray(data)
          ) {
            message =
              data.error ||
              data.message ||
              message;
          }

          throw new Error(
            message
          );
        }

        /* =============================================
           NORMALIZE HISTORY RESPONSE
        ============================================= */

        let history:
          InventoryTransaction[] =
          [];

        if (
          Array.isArray(data)
        ) {
          history = data;
        } else if (
          data &&
          Array.isArray(
            data.transactions
          )
        ) {
          history =
            data.transactions;
        } else if (
          data &&
          Array.isArray(
            data.data
          )
        ) {
          history =
            data.data;
        }

        /* =============================================
           SORT NEWEST FIRST

           API may already sort it,
           but frontend keeps it safe.
        ============================================= */

        history.sort(
          (a, b) => {
            const first = a.createdAt
              ? new Date(a.createdAt).getTime()
              : Number.NaN;

            const second = b.createdAt
              ? new Date(b.createdAt).getTime()
              : Number.NaN;

            if (
              Number.isNaN(first) ||
              Number.isNaN(second)
            ) {
              return (
                Number(b.id) -
                Number(a.id)
              );
            }

            return (
              second - first
            );
          }
        );

        setTransactions(
          history
        );
      } catch (loadError) {
        console.error(
          "LOAD INVENTORY HISTORY ERROR:",
          loadError
        );

        setHistoryError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load inventory history."
        );

        setTransactions(
          []
        );
      } finally {
        setHistoryLoading(
          false
        );
      }
    }, []);

  /* =================================================
     INITIAL LOAD
  ================================================= */

  useEffect(() => {
    loadInventory();
    loadInventoryHistory();
  }, [
    loadInventory,
    loadInventoryHistory,
  ]);

  /* =================================================
     REFRESH ALL
  ================================================= */

  async function refreshAll() {
    await Promise.all([
      loadInventory(),
      loadInventoryHistory(),
    ]);
  }

  /* =================================================
     CATEGORY LIST
  ================================================= */

  const categories =
    useMemo(() => {
      const values =
        Array.from(
          new Set(
            inventory
              .map(
                (item) =>
                  item.category
              )
              .filter(Boolean)
          )
        ).sort(
          (a, b) =>
            a.localeCompare(b)
        );

      return [
        "All",
        ...values,
      ];
    }, [inventory]);

  /* =================================================
     FILTERED INVENTORY
  ================================================= */

  const filteredInventory =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return inventory.filter(
        (item) => {
          /* ===========================================
             SEARCH
          =========================================== */

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

          /* ===========================================
             CATEGORY
          =========================================== */

          const matchesCategory =
            categoryFilter ===
              "All" ||
            item.category ===
              categoryFilter;

          /* ===========================================
             STATUS
          =========================================== */

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
    }, [
      inventory,
      search,
      categoryFilter,
      statusFilter,
    ]);

  /* =================================================
     INVENTORY STATISTICS
  ================================================= */

  const totalItems =
    inventory.length;

  const inStock =
    inventory.filter(
      (item) =>
        getStockStatus(
          item
        ) === "In Stock"
    ).length;

  const lowStock =
    inventory.filter(
      (item) =>
        getStockStatus(
          item
        ) === "Low Stock"
    ).length;

  const outOfStock =
    inventory.filter(
      (item) =>
        getStockStatus(
          item
        ) === "Out of Stock"
    ).length;

  /* =================================================
     TOTAL INVENTORY VALUE
  ================================================= */

  const totalStockValue =
    inventory.reduce(
      (total, item) => {
        const stock =
          Number(
            item.stock
          ) || 0;

        const purchasePrice =
          Number(
            item.purchasePrice
          ) || 0;

        return (
          total +
          stock *
            purchasePrice
        );
      },
      0
    );

  /* =================================================
     OPEN ADJUSTMENT MODAL
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
     CLOSE ADJUSTMENT MODAL
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
     MANUAL STOCK ADJUSTMENT

     SAFE FLOW:

     Inventory Page
         ↓
     POST /api/inventory-adjustments
         ↓
     Database Transaction
         ↓
     Product Stock Update
         +
     InventoryTransaction
  ================================================= */

  async function handleAdjustment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    /* =============================================
       PRODUCT CHECK
    ============================================= */

    if (!selectedItem) {
      return;
    }

    /* =============================================
       PRODUCT TYPE
    ============================================= */

    const isWeightProduct =
      selectedItem.productType ===
      "weight";

    /* =============================================
       WEIGHT VALUES
    ============================================= */

    let weightEntries: number[] =
      [];

    let weightEntriesText =
      "";

    let amount = 0;

    /* =============================================
       WEIGHT PRODUCT
    ============================================= */

    if (isWeightProduct) {
      /* ===========================================
         ADD STOCK

         Example:
         34+60+70+56+56+
                ↓
         5 bundles
         276 KG
      =========================================== */

      if (
        adjustmentType ===
        "add"
      ) {
        weightEntries =
          adjustmentAmount
            .split("+")
            .map((entry) =>
              Number(
                entry.trim()
              )
            )
            .filter(
              (entry) =>
                Number.isFinite(
                  entry
                ) &&
                entry > 0
            );

        if (
          weightEntries.length ===
          0
        ) {
          alert(
            "Enter valid bundle weights. Example: 45+34+34"
          );

          return;
        }

        amount =
          weightEntries.reduce(
            (
              total,
              weight
            ) =>
              total + weight,
            0
          );

        weightEntriesText =
          weightEntries.join(
            "+"
          );
      }

      /* ===========================================
         REMOVE STOCK

         Remove remains total KG.
         Backend removes FIFO from old bundles.
      =========================================== */

      else {
        amount =
          Number(
            adjustmentAmount
          );

        if (
          !Number.isFinite(
            amount
          ) ||
          amount <= 0
        ) {
          alert(
            "Enter a valid weight to remove."
          );

          return;
        }
      }
    }

    /* =============================================
       QUANTITY / SIZE PRODUCT
    ============================================= */

    else {
      amount =
        Number(
          adjustmentAmount
        );

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

      /* ===========================================
         PCS MUST BE WHOLE NUMBER
      =========================================== */

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
    }

    /* =============================================
       FINAL VALIDATION
    ============================================= */

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      alert(
        isWeightProduct
          ? "Enter valid bundle weights."
          : "Enter a valid stock quantity."
      );

      return;
    }

    /* =============================================
       REMOVE STOCK VALIDATION
    ============================================= */

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

      /* ===========================================
         REQUEST BODY
      =========================================== */

      const requestBody = {
        productId:
          selectedItem.id,

        adjustmentType,

        amount,

        weightEntries:
          isWeightProduct &&
          adjustmentType ===
            "add"
            ? weightEntriesText
            : null,

        bundleCount:
          isWeightProduct &&
          adjustmentType ===
            "add"
            ? weightEntries.length
            : null,

        note:
          adjustmentType ===
          "add"
            ? isWeightProduct
              ? `Manual stock added: ${weightEntries.length} bundle(s), ${amount} KG`
              : "Manual stock added from Inventory page"
            : "Manual stock removed from Inventory page",
      };

      /* ===========================================
         SAFE ADJUSTMENT API
      =========================================== */

      const response =
        await fetch(
          "/api/inventory-adjustments",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                requestBody
              ),
          }
        );

      /* ===========================================
         RESPONSE DATA
      =========================================== */

      let data:
        | {
            success?: boolean;
            message?: string;
            error?: string;

            adjustment?: {
              productId?: number;
              productName?: string;
              productType?: string;
              adjustmentType?: string;
              amount?: number;
              unit?: string;
              previousStock?: number;
              currentStock?: number;
              transactionType?: string;
              weightEntries?:
                | string
                | null;
              bundleCount?:
                | number
                | null;
            };
          }
        | null = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      /* ===========================================
         API ERROR
      =========================================== */

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to update stock."
        );
      }

      /* ===========================================
         RELOAD STOCK + HISTORY
      =========================================== */

      await Promise.all([
        loadInventory(),
        loadInventoryHistory(),
      ]);

      /* ===========================================
         SUCCESS MESSAGE

         Save selected values before closing state.
      =========================================== */

      let successMessage =
        data?.message ||
        "Stock updated successfully.";

      if (
        isWeightProduct &&
        adjustmentType ===
          "add"
      ) {
        successMessage =
          `Stock added successfully.\n\n` +
          `Weight: ${amount} KG\n` +
          `Bundles: ${weightEntries.length}\n` +
          `Entries: ${weightEntriesText}`;
      } else if (
        adjustmentType ===
        "add"
      ) {
        successMessage =
          `Stock added successfully: +${amount} ${selectedItem.unit}`;
      } else {
        successMessage =
          `Stock removed successfully: -${amount} ${selectedItem.unit}`;
      }

      /* ===========================================
         CLOSE MODAL
      =========================================== */

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

      alert(
        successMessage
      );
    } catch (
      adjustmentError
    ) {
      console.error(
        "STOCK ADJUSTMENT ERROR:",
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
     PAGE UI
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
              Monitor product stock,
              inventory value, stock
              status and movement
              history.
            </p>
          </div>

          {/* ===============================================
              HEADER ACTIONS
          =============================================== */}

          <div className="flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={
                refreshAll
              }
              disabled={
                loading ||
                historyLoading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading ||
                  historyLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            {/* =============================================
                INVENTORY VALUE
            ============================================= */}

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
            INVENTORY ERROR
        ================================================= */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <XCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="font-semibold text-red-700">
                Failed to load
                inventory
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            INVENTORY STATS
        ================================================= */}

        <InventoryStats
          totalItems={
            totalItems
          }
          inStock={
            inStock
          }
          lowStock={
            lowStock
          }
          outOfStock={
            outOfStock
          }
        />

        {/* =================================================
            SEARCH / FILTERS
        ================================================= */}

        <InventoryFilters
          search={
            search
          }
          setSearch={
            setSearch
          }
          categoryFilter={
            categoryFilter
          }
          setCategoryFilter={
            setCategoryFilter
          }
          statusFilter={
            statusFilter
          }
          setStatusFilter={
            setStatusFilter
          }
          categories={
            categories
          }
        />

        {/* =================================================
            INVENTORY TABLE
        ================================================= */}

        <InventoryTable
          inventory={
            filteredInventory
          }
          loading={
            loading
          }
          onAdjust={
            openAdjustment
          }
        />

        {/* =================================================
            STOCK HISTORY ERROR
        ================================================= */}

        {historyError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <XCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="font-semibold text-red-700">
                Failed to load
                stock history
              </p>

              <p className="mt-1 text-sm text-red-600">
                {historyError}
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            INVENTORY STOCK HISTORY
        ================================================= */}

        <InventoryHistory
          transactions={
            transactions
          }
          loading={
            historyLoading
          }
        />
      </div>

      {/* =================================================
          STOCK ADJUSTMENT MODAL
      ================================================= */}

      <AdjustmentModal
        open={
          showAdjustment
        }
        item={
          selectedItem
        }
        adjustmentType={
          adjustmentType
        }
        setAdjustmentType={
          setAdjustmentType
        }
        adjustmentAmount={
          adjustmentAmount
        }
        setAdjustmentAmount={
          setAdjustmentAmount
        }
        saving={
          adjustmentSaving
        }
        onClose={
          closeAdjustment
        }
        onSubmit={
          handleAdjustment
        }
      />
    </div>
  );
}