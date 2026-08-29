"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

/* =====================================================
   TYPES
===================================================== */

type PaymentMethod =
  | "Cash"
  | "Bank"
  | "Credit"
  | "Other";

type PurchaseStatus =
  | "Paid"
  | "Partial"
  | "Unpaid";

type ProductType =
  | "weight"
  | "quantity"
  | "size";

type Supplier = {
  id: number;
  name: string;
  phone: string;
};

type Product = {
  id: number;
  name: string;
  category: string;
  type: ProductType;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  weightEntries: string;
};

type PurchaseItem = {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unit: "KG" | "PCS";
  purchasePrice: number;
  total: number;
  weightEntries?: string;
};

type Purchase = {
  id: number;
  invoiceNo: string;
  date: string;
  supplierId: number;
  supplierName: string;
  supplierPhone?: string;
  items: PurchaseItem[];
  subtotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  status: PurchaseStatus;
  notes: string;
  createdAt?: string;
};

type PurchaseForm = {
  date: string;
  supplierId: string;
  productId: string;
  quantity: string;
  bundleWeights: string;
  purchasePrice: string;
  paidAmount: string;
  paymentMethod: PaymentMethod;
  notes: string;
};

type SupplierForm = {
  name: string;
  phone: string;
};

type ApiRecord = Record<string, unknown>;

/* =====================================================
   RECORD HELPERS
===================================================== */

function isRecord(
  value: unknown
): value is ApiRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getRecord(
  value: unknown
): ApiRecord {
  return isRecord(value)
    ? value
    : {};
}

function getString(
  record: ApiRecord,
  key: string,
  fallback = ""
) {
  const value =
    record[key];

  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(value);
}

function getNumber(
  record: ApiRecord,
  key: string,
  fallback = 0
) {
  const value =
    Number(record[key]);

  return Number.isFinite(value)
    ? value
    : fallback;
}

function getArray(
  record: ApiRecord,
  key: string
): unknown[] {
  const value =
    record[key];

  return Array.isArray(value)
    ? value
    : [];
}

/* =====================================================
   NUMBER
===================================================== */

function numberValue(
  value: unknown
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

/* =====================================================
   DATE
===================================================== */

function getTodayDate() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

/* =====================================================
   CURRENCY
===================================================== */

function formatCurrency(
  value: number
) {
  return `Rs. ${numberValue(
    value
  ).toLocaleString(
    "en-PK",
    {
      maximumFractionDigits:
        2,
    }
  )}`;
}

/* =====================================================
   STATUS
===================================================== */

function normalizeStatus(
  value: unknown
): PurchaseStatus {
  const status =
    String(
      value || ""
    ).toUpperCase();

  if (status === "PAID") {
    return "Paid";
  }

  if (
    status === "PARTIAL"
  ) {
    return "Partial";
  }

  return "Unpaid";
}

/* =====================================================
   PAYMENT METHOD
===================================================== */

function normalizePaymentMethod(
  value: unknown
): PaymentMethod {
  const method =
    String(
      value || "Cash"
    );

  if (
    method === "Bank" ||
    method === "Credit" ||
    method === "Other"
  ) {
    return method;
  }

  return "Cash";
}

/* =====================================================
   PRODUCT TYPE
===================================================== */

function normalizeProductType(
  value: unknown
): ProductType {
  const type =
    String(
      value || "quantity"
    ).toLowerCase();

  if (type === "weight") {
    return "weight";
  }

  if (type === "size") {
    return "size";
  }

  return "quantity";
}

/* =====================================================
   WEIGHT PARSER
===================================================== */

function parseBundleWeights(
  value: string
) {
  return String(
    value || ""
  )
    .split(/[,+]/)
    .map((item) =>
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
    );
}

/* =====================================================
   SAFE JSON RESPONSE
===================================================== */

async function readApiResponse(
  response: Response
): Promise<ApiRecord> {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    const parsed:
      unknown =
      JSON.parse(text);

    return getRecord(
      parsed
    );
  } catch {
    /*
      Agar Next.js 404 HTML
      return kare to yahan
      Unexpected token <
      crash nahi hoga.
    */

    if (
      response.status ===
      404
    ) {
      throw new Error(
        "API route not found. Check app/api/purchases/route.ts path."
      );
    }

    throw new Error(
      `Server returned invalid response (${response.status}).`
    );
  }
}

/* =====================================================
   NORMALIZE PRODUCT
===================================================== */

function normalizeProduct(
  value: unknown
): Product {
  const raw =
    getRecord(value);

  const type =
    normalizeProductType(
      raw.type
    );

  return {
    id:
      getNumber(
        raw,
        "id"
      ),

    name:
      getString(
        raw,
        "name"
      ),

    category:
      getString(
        raw,
        "category"
      ),

    type,

    unit:
      type === "weight"
        ? "KG"
        : getString(
            raw,
            "unit",
            "PCS"
          ),

    purchasePrice:
      getNumber(
        raw,
        "purchasePrice"
      ),

    sellingPrice:
      getNumber(
        raw,
        "sellingPrice"
      ),

    quantity:
      getNumber(
        raw,
        "quantity"
      ),

    weightEntries:
      getString(
        raw,
        "weightEntries"
      ),
  };
}

/* =====================================================
   NORMALIZE SUPPLIER
===================================================== */

function normalizeSupplier(
  value: unknown
): Supplier {
  const raw =
    getRecord(value);

  return {
    id:
      getNumber(
        raw,
        "id"
      ),

    name:
      getString(
        raw,
        "name"
      ),

    phone:
      getString(
        raw,
        "phone"
      ),
  };
}

/* =====================================================
   NORMALIZE PURCHASE ITEM
===================================================== */

function normalizePurchaseItem(
  value: unknown
): PurchaseItem {
  const raw =
    getRecord(value);

  const unit:
    "KG" | "PCS" =
    getString(
      raw,
      "unit",
      "PCS"
    ).toUpperCase() ===
    "KG"
      ? "KG"
      : "PCS";

  const quantity =
    getNumber(
      raw,
      "quantity"
    );

  const purchasePrice =
    getNumber(
      raw,
      "purchasePrice"
    );

  const amount =
    getNumber(
      raw,
      "amount"
    );

  const total =
    getNumber(
      raw,
      "total"
    );

  const id =
    getNumber(
      raw,
      "id"
    );

  return {
    id:
      id > 0
        ? id
        : undefined,

    productId:
      getNumber(
        raw,
        "productId"
      ),

    productName:
      getString(
        raw,
        "productName",
        getString(
          raw,
          "name",
          "Product"
        )
      ),

    quantity,

    unit,

    purchasePrice,

    total:
      total > 0
        ? total
        : amount > 0
          ? amount
          : quantity *
            purchasePrice,

    weightEntries:
      getString(
        raw,
        "weightEntries"
      ),
  };
}

/* =====================================================
   NORMALIZE PURCHASE
===================================================== */

function normalizePurchase(
  value: unknown
): Purchase {
  const raw =
    getRecord(value);

  const items =
    getArray(
      raw,
      "items"
    ).map(
      normalizePurchaseItem
    );

  const calculatedSubtotal =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        item.total,
      0
    );

  const subtotal =
    getNumber(
      raw,
      "subtotal",
      calculatedSubtotal
    );

  const paidAmount =
    getNumber(
      raw,
      "paidAmount"
    );

  const remainingBalance =
    raw.remainingBalance;

  const remainingAmountRaw =
    raw.remainingAmount;

  let remainingAmount =
    Math.max(
      0,
      subtotal -
        paidAmount
    );

  if (
    remainingBalance !==
    undefined
  ) {
    remainingAmount =
      numberValue(
        remainingBalance
      );
  } else if (
    remainingAmountRaw !==
    undefined
  ) {
    remainingAmount =
      numberValue(
        remainingAmountRaw
      );
  }

  const supplierRecord =
    getRecord(
      raw.supplier
    );

  const id =
    getNumber(
      raw,
      "id"
    );

  const purchaseNumber =
    getString(
      raw,
      "purchaseNumber"
    );

  const invoiceNo =
    getString(
      raw,
      "invoiceNo"
    );

  const purchaseDate =
    getString(
      raw,
      "purchaseDate"
    );

  const date =
    getString(
      raw,
      "date"
    );

  const createdAt =
    getString(
      raw,
      "createdAt"
    );

  const finalDate =
    (
      date ||
      purchaseDate ||
      createdAt
    ).split("T")[0];

  return {
    id,

    invoiceNo:
      purchaseNumber ||
      invoiceNo ||
      `PUR-${String(
        id
      ).padStart(
        4,
        "0"
      )}`,

    date:
      finalDate,

    supplierId:
      getNumber(
        raw,
        "supplierId"
      ),

    supplierName:
      getString(
        raw,
        "supplierName",
        getString(
          supplierRecord,
          "name",
          "Supplier"
        )
      ),

    supplierPhone:
      getString(
        raw,
        "supplierPhone",
        getString(
          supplierRecord,
          "phone"
        )
      ),

    items,

    subtotal,

    paidAmount,

    remainingAmount,

    paymentMethod:
      normalizePaymentMethod(
        raw.paymentMethod
      ),

    status:
      normalizeStatus(
        raw.status
      ),

    notes:
      getString(
        raw,
        "notes"
      ),

    createdAt:
      createdAt ||
      undefined,
  };
}

/* =====================================================
   PAGE
===================================================== */

export default function PurchasesPage() {
  /* =================================================
     DATA
  ================================================= */

  const [
    purchases,
    setPurchases,
  ] =
    useState<
      Purchase[]
    >([]);

  const [
    suppliers,
    setSuppliers,
  ] =
    useState<
      Supplier[]
    >([]);

  const [
    products,
    setProducts,
  ] =
    useState<
      Product[]
    >([]);

  /* =================================================
     LOADING
  ================================================= */

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<
      number | null
    >(null);

  /* =================================================
     PURCHASE MODAL
  ================================================= */

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    editingId,
    setEditingId,
  ] =
    useState<
      number | null
    >(null);

  /* =================================================
     SUPPLIER MODAL
  ================================================= */

  const [
    showSupplierModal,
    setShowSupplierModal,
  ] =
    useState(false);

  const [
    savingSupplier,
    setSavingSupplier,
  ] =
    useState(false);

  const [
    supplierForm,
    setSupplierForm,
  ] =
    useState<SupplierForm>({
      name: "",
      phone: "",
    });

  /* =================================================
     FILTER
  ================================================= */

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("All");

  /* =================================================
     PURCHASE FORM
  ================================================= */

  const [
    form,
    setForm,
  ] =
    useState<PurchaseForm>({
      date:
        getTodayDate(),

      supplierId:
        "",

      productId:
        "",

      quantity:
        "",

      bundleWeights:
        "",

      purchasePrice:
        "",

      paidAmount:
        "",

      paymentMethod:
        "Cash",

      notes:
        "",
    });

  /* =================================================
     LOAD
  ================================================= */

  useEffect(() => {
    void loadAllData();
  }, []);

  /* =================================================
     LOAD ALL
  ================================================= */

  async function loadAllData() {
    setLoading(
      true
    );

    try {
      await Promise.all([
        loadPurchases(),
        loadSuppliers(),
        loadProducts(),
      ]);
    } finally {
      setLoading(
        false
      );
    }
  }

  /* =================================================
     LOAD PURCHASES
  ================================================= */

  async function loadPurchases() {
    try {
      const response =
        await fetch(
          "/api/purchases",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await readApiResponse(
          response
        );

      if (
        !response.ok
      ) {
        throw new Error(
          getString(
            data,
            "error"
          ) ||
            getString(
              data,
              "message"
            ) ||
            "Failed to load purchases."
        );
      }

      const purchaseValues =
        Array.isArray(
          data.purchases
        )
          ? data.purchases
          : [];

      const list =
        purchaseValues
          .map(
            normalizePurchase
          )
          .filter(
            (
              purchase
            ) =>
              purchase.id >
              0
          )
          .sort(
            (
              a,
              b
            ) =>
              b.id -
              a.id
          );

      setPurchases(
        list
      );
    } catch (error) {
      console.error(
        "Load purchases:",
        error
      );
    }
  }

  /* =================================================
     LOAD SUPPLIERS
  ================================================= */

  async function loadSuppliers() {
    try {
      const response =
        await fetch(
          "/api/suppliers",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await readApiResponse(
          response
        );

      if (
        !response.ok
      ) {
        throw new Error(
          getString(
            data,
            "error"
          ) ||
            getString(
              data,
              "message"
            ) ||
            "Failed to load suppliers."
        );
      }

      const supplierValues =
        Array.isArray(
          data.suppliers
        )
          ? data.suppliers
          : [];

      setSuppliers(
        supplierValues
          .map(
            normalizeSupplier
          )
          .filter(
            (
              supplier
            ) =>
              supplier.id >
              0
          )
      );
    } catch (error) {
      console.error(
        "Load suppliers:",
        error
      );
    }
  }

  /* =================================================
     LOAD PRODUCTS
  ================================================= */

  async function loadProducts() {
    try {
      const response =
        await fetch(
          "/api/products",
          {
            cache:
              "no-store",
          }
        );

      const text =
        await response.text();

      let parsed:
        unknown = [];

      try {
        parsed =
          text
            ? JSON.parse(
                text
              )
            : [];
      } catch {
        throw new Error(
          "Products API returned invalid response."
        );
      }

      if (
        !response.ok
      ) {
        const errorRecord =
          getRecord(
            parsed
          );

        throw new Error(
          getString(
            errorRecord,
            "error"
          ) ||
            getString(
              errorRecord,
              "message"
            ) ||
            "Failed to load products."
        );
      }

      let productValues:
        unknown[] = [];

      if (
        Array.isArray(
          parsed
        )
      ) {
        productValues =
          parsed;
      } else {
        const record =
          getRecord(
            parsed
          );

        if (
          Array.isArray(
            record.products
          )
        ) {
          productValues =
            record.products;
        }
      }

      setProducts(
        productValues
          .map(
            normalizeProduct
          )
          .filter(
            (
              product
            ) =>
              product.id >
              0
          )
      );
    } catch (error) {
      console.error(
        "Load products:",
        error
      );
    }
  }

  /* =================================================
     SELECTED SUPPLIER
  ================================================= */

  const selectedSupplier =
    suppliers.find(
      (
        supplier
      ) =>
        supplier.id ===
        Number(
          form.supplierId
        )
    );

  /* =================================================
     SELECTED PRODUCT
  ================================================= */

  const selectedProduct =
    products.find(
      (
        product
      ) =>
        product.id ===
        Number(
          form.productId
        )
    );

  /* =================================================
     BUNDLES
  ================================================= */

  const bundleWeights =
    parseBundleWeights(
      form.bundleWeights
    );

  const totalBundleWeight =
    bundleWeights.reduce(
      (
        total,
        weight
      ) =>
        total +
        weight,
      0
    );

  /* =================================================
     QUANTITY
  ================================================= */

  const quantity =
    selectedProduct?.type ===
    "weight"
      ? totalBundleWeight
      : numberValue(
          form.quantity
        );

  /* =================================================
     PRICE
  ================================================= */

  const purchasePrice =
    numberValue(
      form.purchasePrice
    );

  /* =================================================
     TOTAL
  ================================================= */

  const totalAmount =
    quantity *
    purchasePrice;

  /* =================================================
     PAID
  ================================================= */

  const paidAmount =
    numberValue(
      form.paidAmount
    );

  /* =================================================
     REMAINING
  ================================================= */

  const remainingAmount =
    Math.max(
      0,
      totalAmount -
        paidAmount
    );

  /* =================================================
     CURRENT STATUS
  ================================================= */

  const currentStatus:
    PurchaseStatus =
    totalAmount <= 0 ||
    paidAmount <= 0
      ? "Unpaid"
      : paidAmount >=
          totalAmount
        ? "Paid"
        : "Partial";

  /* =================================================
     FILTER
  ================================================= */

  const filteredPurchases =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return purchases.filter(
        (
          purchase
        ) => {
          const itemNames =
            purchase.items
              .map(
                (
                  item
                ) =>
                  item.productName
              )
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !text ||
            purchase.invoiceNo
              .toLowerCase()
              .includes(
                text
              ) ||
            purchase.supplierName
              .toLowerCase()
              .includes(
                text
              ) ||
            itemNames.includes(
              text
            );

          const matchesStatus =
            statusFilter ===
              "All" ||
            purchase.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      purchases,
      search,
      statusFilter,
    ]);

  /* =================================================
     STATS
  ================================================= */

  const totalPurchases =
    purchases.reduce(
      (
        total,
        purchase
      ) =>
        total +
        purchase.subtotal,
      0
    );

  const totalPaid =
    purchases.reduce(
      (
        total,
        purchase
      ) =>
        total +
        purchase.paidAmount,
      0
    );

  const totalPayable =
    purchases.reduce(
      (
        total,
        purchase
      ) =>
        total +
        purchase.remainingAmount,
      0
    );

  /* =================================================
     RESET FORM
  ================================================= */

  function resetForm() {
    setForm({
      date:
        getTodayDate(),

      supplierId:
        "",

      productId:
        "",

      quantity:
        "",

      bundleWeights:
        "",

      purchasePrice:
        "",

      paidAmount:
        "",

      paymentMethod:
        "Cash",

      notes:
        "",
    });

    setEditingId(
      null
    );
  }

  /* =================================================
     OPEN ADD
  ================================================= */

  function openAddPurchase() {
    resetForm();

    setShowForm(
      true
    );
  }

  /* =================================================
     CLOSE FORM
  ================================================= */

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(
      false
    );

    resetForm();
  }

  /* =================================================
     UPDATE FORM
  ================================================= */

  function updateForm<
    K extends keyof PurchaseForm,
  >(
    field: K,
    value: PurchaseForm[K]
  ) {
    setForm(
      (
        previous
      ) => ({
        ...previous,
        [field]:
          value,
      })
    );
  }

  /* =================================================
     SUPPLIER CHANGE
  ================================================= */

  function handleSupplierChange(
    value: string
  ) {
    if (
      value ===
      "ADD_NEW_SUPPLIER"
    ) {
      setSupplierForm({
        name: "",
        phone: "",
      });

      setShowSupplierModal(
        true
      );

      return;
    }

    updateForm(
      "supplierId",
      value
    );
  }

  /* =================================================
     PRODUCT CHANGE
  ================================================= */

  function handleProductChange(
    value: string
  ) {
    const product =
      products.find(
        (
          item
        ) =>
          item.id ===
          Number(value)
      );

    setForm(
      (
        previous
      ) => ({
        ...previous,

        productId:
          value,

        quantity:
          "",

        bundleWeights:
          "",

        purchasePrice:
          product &&
          product.purchasePrice >
            0
            ? String(
                product.purchasePrice
              )
            : "",
      })
    );
  }

  /* =================================================
     ADD SUPPLIER
  ================================================= */

  async function handleAddSupplier(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const name =
      supplierForm.name.trim();

    const phone =
      supplierForm.phone.trim();

    if (!name) {
      alert(
        "Supplier name is required."
      );

      return;
    }

    setSavingSupplier(
      true
    );

    try {
      const response =
        await fetch(
          "/api/suppliers",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  name,
                  phone,
                }
              ),
          }
        );

      const data =
        await readApiResponse(
          response
        );

      if (
        !response.ok
      ) {
        alert(
          getString(
            data,
            "error"
          ) ||
            getString(
              data,
              "message"
            ) ||
            "Failed to add supplier."
        );

        return;
      }

      const supplierValue =
        data.supplier;

      const newSupplier =
        normalizeSupplier(
          supplierValue
        );

      if (
        newSupplier.id <=
        0
      ) {
        alert(
          "Supplier saved but valid ID was not returned."
        );

        await loadSuppliers();

        return;
      }

      setSuppliers(
        (
          previous
        ) => {
          const exists =
            previous.some(
              (
                supplier
              ) =>
                supplier.id ===
                newSupplier.id
            );

          if (exists) {
            return previous;
          }

          return [
            ...previous,
            newSupplier,
          ];
        }
      );

      /*
        New supplier
        automatically selected.
      */

      setForm(
        (
          previous
        ) => ({
          ...previous,

          supplierId:
            String(
              newSupplier.id
            ),
        })
      );

      setSupplierForm({
        name: "",
        phone: "",
      });

      setShowSupplierModal(
        false
      );
    } catch (error) {
      console.error(
        "Add supplier:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Something went wrong while adding supplier."
      );
    } finally {
      setSavingSupplier(
        false
      );
    }
  }

  /* =================================================
     SAVE PURCHASE
  ================================================= */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !form.supplierId
    ) {
      alert(
        "Please select a supplier."
      );

      return;
    }

    if (
      !selectedSupplier
    ) {
      alert(
        "Selected supplier was not found."
      );

      return;
    }

    if (
      !form.productId
    ) {
      alert(
        "Please select a product."
      );

      return;
    }

    if (
      !selectedProduct
    ) {
      alert(
        "Selected product was not found."
      );

      return;
    }

    /* ===============================================
       WEIGHT
    =============================================== */

    if (
      selectedProduct.type ===
      "weight"
    ) {
      if (
        bundleWeights.length ===
        0
      ) {
        alert(
          "Please enter bundle weights."
        );

        return;
      }

      if (
        totalBundleWeight <=
        0
      ) {
        alert(
          "Total weight must be greater than 0."
        );

        return;
      }
    } else {
      /* =============================================
         PCS
      ============================================= */

      if (
        quantity <= 0
      ) {
        alert(
          "Quantity must be greater than 0."
        );

        return;
      }

      if (
        !Number.isInteger(
          quantity
        )
      ) {
        alert(
          "PCS quantity must be a whole number."
        );

        return;
      }
    }

    if (
      purchasePrice <=
      0
    ) {
      alert(
        "Purchase price must be greater than 0."
      );

      return;
    }

    if (
      paidAmount < 0
    ) {
      alert(
        "Paid amount cannot be negative."
      );

      return;
    }

    if (
      paidAmount >
      totalAmount
    ) {
      alert(
        "Paid amount cannot be greater than purchase total."
      );

      return;
    }

    /* ===============================================
       WEIGHT ENTRIES
    =============================================== */

    const weightEntries =
      selectedProduct.type ===
      "weight"
        ? bundleWeights.join(
            "+"
          )
        : "";

    /* ===============================================
       BODY
    =============================================== */

    const requestBody = {
      supplierId:
        Number(
          form.supplierId
        ),

      supplierName:
        selectedSupplier.name,

      supplierPhone:
        selectedSupplier.phone,

      date:
        form.date,

      purchaseDate:
        form.date,

      items: [
        {
          productId:
            selectedProduct.id,

          quantity,

          purchasePrice,

          weightEntries,
        },
      ],

      paidAmount,

      paymentMethod:
        form.paymentMethod,

      notes:
        form.notes.trim(),
    };

    setSaving(
      true
    );

    try {
      const isEditing =
        editingId !==
        null;

      const url =
        isEditing
          ? `/api/purchases/${editingId}`
          : "/api/purchases";

      const method =
        isEditing
          ? "PUT"
          : "POST";

      const response =
        await fetch(
          url,
          {
            method,

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

      const data =
        await readApiResponse(
          response
        );

      if (
        !response.ok
      ) {
        alert(
          getString(
            data,
            "error"
          ) ||
            getString(
              data,
              "message"
            ) ||
            "Failed to save purchase."
        );

        return;
      }

      await Promise.all([
        loadPurchases(),
        loadProducts(),
        loadSuppliers(),
      ]);

      setShowForm(
        false
      );

      resetForm();

      alert(
        isEditing
          ? "Purchase updated successfully."
          : "Purchase saved successfully."
      );
    } catch (error) {
      console.error(
        "Save purchase:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Something went wrong while saving purchase."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =================================================
     EDIT
  ================================================= */

  function editPurchase(
    purchase: Purchase
  ) {
    const item =
      purchase.items[0];

    if (!item) {
      alert(
        "Purchase item not found."
      );

      return;
    }

    const product =
      products.find(
        (
          productItem
        ) =>
          productItem.id ===
          item.productId
      );

    const isWeight =
      product?.type ===
        "weight" ||
      item.unit === "KG";

    setForm({
      date:
        purchase.date ||
        getTodayDate(),

      supplierId:
        String(
          purchase.supplierId
        ),

      productId:
        String(
          item.productId
        ),

      quantity:
        isWeight
          ? ""
          : String(
              item.quantity
            ),

      bundleWeights:
        isWeight
          ? item.weightEntries &&
            item.weightEntries.trim()
            ? item.weightEntries
            : String(
                item.quantity
              )
          : "",

      purchasePrice:
        String(
          item.purchasePrice
        ),

      paidAmount:
        String(
          purchase.paidAmount
        ),

      paymentMethod:
        purchase.paymentMethod,

      notes:
        purchase.notes,
    });

    setEditingId(
      purchase.id
    );

    setShowForm(
      true
    );
  }

  /* =================================================
     DELETE
  ================================================= */

  async function deletePurchase(
    purchase: Purchase
  ) {
    const confirmed =
      window.confirm(
        `Delete ${purchase.invoiceNo}?\n\nStock added by this purchase will also be reversed.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(
      purchase.id
    );

    try {
      const response =
        await fetch(
          `/api/purchases/${purchase.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await readApiResponse(
          response
        );

      if (
        !response.ok
      ) {
        alert(
          getString(
            data,
            "error"
          ) ||
            getString(
              data,
              "message"
            ) ||
            "Failed to delete purchase."
        );

        return;
      }

      await Promise.all([
        loadPurchases(),
        loadProducts(),
        loadSuppliers(),
      ]);

      alert(
        "Purchase deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete purchase:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Something went wrong while deleting purchase."
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  /* =================================================
     UI
  ================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Purchases
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Record supplier purchases, payments and stock receiving.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openAddPurchase
            }
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + New Purchase
          </button>
        </div>

        {/* STATS */}

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
            value={String(
              purchases.length
            )}
          />
        </div>

        {/* FILTER */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                🔎
              </span>

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
                placeholder="Search purchase, supplier or product..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>

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

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <TableHead>
                    Purchase
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={
                        10
                      }
                      className="px-6 py-14 text-center text-sm text-slate-500"
                    >
                      Loading purchases...
                    </td>
                  </tr>
                ) : filteredPurchases.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={
                        10
                      }
                      className="px-6 py-14 text-center text-sm text-slate-500"
                    >
                      No purchases found.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map(
                    (
                      purchase
                    ) => {
                      const item =
                        purchase.items[0];

                      return (
                        <tr
                          key={
                            purchase.id
                          }
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              {
                                purchase.invoiceNo
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {
                              purchase.date
                            }
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {
                                purchase.supplierName
                              }
                            </p>

                            {purchase.supplierPhone && (
                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  purchase.supplierPhone
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800">
                              {item
                                ? item.productName
                                : "-"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            {item ? (
                              <>
                                <p className="font-semibold text-slate-900">
                                  {item.quantity.toLocaleString(
                                    "en-PK",
                                    {
                                      maximumFractionDigits:
                                        2,
                                    }
                                  )}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {
                                    item.unit
                                  }
                                </p>
                              </>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                            {formatCurrency(
                              purchase.subtotal
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-emerald-600">
                            {formatCurrency(
                              purchase.paidAmount
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-red-600">
                            {formatCurrency(
                              purchase.remainingAmount
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={
                                purchase.status
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button
                                type="button"
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
                                type="button"
                                disabled={
                                  deletingId ===
                                  purchase.id
                                }
                                onClick={() =>
                                  void deletePurchase(
                                    purchase
                                  )
                                }
                                className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingId ===
                                purchase.id
                                  ? "Deleting..."
                                  : "Delete"}
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

      {/* =================================================
          PURCHASE MODAL
      ================================================= */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId !==
                  null
                    ? "Edit Purchase"
                    : "New Purchase"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add supplier purchase and receive stock.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                disabled={
                  saving
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 hover:bg-slate-200"
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
              {/* PURCHASE */}

              <section className="rounded-2xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900">
                  Purchase Information
                </h3>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
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

                  {/* SUPPLIER */}

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Supplier
                    </span>

                    <select
                      value={
                        form.supplierId
                      }
                      onChange={(
                        event
                      ) =>
                        handleSupplierChange(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">
                        Select Supplier
                      </option>

                      {suppliers.map(
                        (
                          supplier
                        ) => (
                          <option
                            key={
                              supplier.id
                            }
                            value={String(
                              supplier.id
                            )}
                          >
                            {
                              supplier.name
                            }

                            {supplier.phone
                              ? ` - ${supplier.phone}`
                              : ""}
                          </option>
                        )
                      )}

                      <option value="ADD_NEW_SUPPLIER">
                        + Add New Supplier
                      </option>
                    </select>

                    {selectedSupplier && (
                      <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        Selected:{" "}
                        <strong>
                          {
                            selectedSupplier.name
                          }
                        </strong>

                        {selectedSupplier.phone
                          ? ` • ${selectedSupplier.phone}`
                          : ""}
                      </div>
                    )}
                  </label>

                  {/* PRODUCT */}

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Product
                    </span>

                    <select
                      value={
                        form.productId
                      }
                      onChange={(
                        event
                      ) =>
                        handleProductChange(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">
                        Select Product
                      </option>

                      {products.map(
                        (
                          product
                        ) => (
                          <option
                            key={
                              product.id
                            }
                            value={String(
                              product.id
                            )}
                          >
                            {
                              product.name
                            }{" "}
                            (
                            {product.type ===
                            "weight"
                              ? "KG"
                              : product.unit}
                            )
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>
              </section>

              {/* PRODUCT DETAILS */}

              <section className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
                <h3 className="font-bold text-slate-900">
                  Product Details
                </h3>

                {selectedProduct ? (
                  <>
                    <div className="mt-4 rounded-xl bg-white p-4">
                      <p className="text-xs font-medium uppercase text-slate-400">
                        Selected Product
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {
                          selectedProduct.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Category:{" "}
                        {selectedProduct.category ||
                          "-"}{" "}
                        • Type:{" "}
                        {
                          selectedProduct.type
                        }
                      </p>
                    </div>

                    {/* WEIGHT */}

                    {selectedProduct.type ===
                    "weight" ? (
                      <div className="mt-5">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            Bundle Weights (KG)
                          </span>

                          <input
                            value={
                              form.bundleWeights
                            }
                            onChange={(
                              event
                            ) =>
                              updateForm(
                                "bundleWeights",
                                event.target.value
                              )
                            }
                            placeholder="82+115+67+94"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                          />
                        </label>

                        <div className="mt-3 rounded-xl bg-white p-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500">
                              Bundles
                            </span>

                            <strong>
                              {
                                bundleWeights.length
                              }
                            </strong>
                          </div>

                          <div className="mt-2 flex justify-between">
                            <span className="text-sm text-slate-500">
                              Total Weight
                            </span>

                            <strong className="text-blue-600">
                              {totalBundleWeight.toLocaleString(
                                "en-PK",
                                {
                                  maximumFractionDigits:
                                    2,
                                }
                              )}{" "}
                              KG
                            </strong>
                          </div>

                          {bundleWeights.length >
                            0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {bundleWeights.map(
                                (
                                  weight,
                                  index
                                ) => (
                                  <span
                                    key={`${weight}-${index}`}
                                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                                  >
                                    B-
                                    {String(
                                      index +
                                        1
                                    ).padStart(
                                      3,
                                      "0"
                                    )}
                                    :{" "}
                                    {
                                      weight
                                    }{" "}
                                    KG
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5">
                        <Input
                          label="Quantity (PCS)"
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
                          placeholder="10"
                        />
                      </div>
                    )}

                    <div className="mt-4">
                      <Input
                        label={
                          selectedProduct.type ===
                          "weight"
                            ? "Purchase Price / KG"
                            : "Purchase Price / Unit"
                        }
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
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Total Purchase
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {quantity.toLocaleString(
                            "en-PK",
                            {
                              maximumFractionDigits:
                                2,
                            }
                          )}{" "}
                          {selectedProduct.type ===
                          "weight"
                            ? "KG"
                            : "PCS"}{" "}
                          ×{" "}
                          {formatCurrency(
                            purchasePrice
                          )}
                        </p>
                      </div>

                      <span className="text-xl font-bold text-slate-900">
                        {formatCurrency(
                          totalAmount
                        )}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-xl bg-white p-5 text-center text-sm text-slate-500">
                    Select a product first.
                  </div>
                )}
              </section>

              {/* PAYMENT */}

              <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">
                    Payment
                  </h3>

                  <StatusBadge
                    status={
                      currentStatus
                    }
                  />
                </div>

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

                  <Select
                    label="Payment Method"
                    value={
                      form.paymentMethod
                    }
                    onChange={(
                      value
                    ) =>
                      updateForm(
                        "paymentMethod",
                        normalizePaymentMethod(
                          value
                        )
                      )
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

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <SummaryBox
                    title="Purchase Total"
                    value={formatCurrency(
                      totalAmount
                    )}
                  />

                  <SummaryBox
                    title="Paid"
                    value={formatCurrency(
                      paidAmount
                    )}
                    success
                  />

                  <SummaryBox
                    title="Remaining Payable"
                    value={formatCurrency(
                      remainingAmount
                    )}
                    danger={
                      remainingAmount >
                      0
                    }
                  />
                </div>
              </section>

              {/* NOTES */}

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
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />
              </label>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving
                    ? editingId !==
                      null
                      ? "Updating..."
                      : "Saving..."
                    : editingId !==
                        null
                      ? "Update Purchase"
                      : "Save Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          SUPPLIER MODAL
      ================================================= */}

      {showSupplierModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add New Supplier
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Supplier will be saved permanently.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowSupplierModal(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleAddSupplier
              }
              className="space-y-5 p-6"
            >
              <Input
                label="Supplier Name"
                value={
                  supplierForm.name
                }
                onChange={(
                  value
                ) =>
                  setSupplierForm(
                    (
                      previous
                    ) => ({
                      ...previous,
                      name:
                        value,
                    })
                  )
                }
                placeholder="Khan Traders"
              />

              <Input
                label="Phone"
                value={
                  supplierForm.phone
                }
                onChange={(
                  value
                ) =>
                  setSupplierForm(
                    (
                      previous
                    ) => ({
                      ...previous,
                      phone:
                        value,
                    })
                  )
                }
                placeholder="03001234567"
              />

              <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
                Save ke baad supplier automatically current purchase mein select ho jayega.
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setShowSupplierModal(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    savingSupplier
                  }
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingSupplier
                    ? "Saving..."
                    : "Save Supplier"}
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

/* =====================================================
   TABLE HEAD
===================================================== */

function TableHead({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({
  status,
}: {
  status:
    PurchaseStatus;
}) {
  const styles:
    Record<
      PurchaseStatus,
      string
    > = {
    Paid:
      "bg-emerald-50 text-emerald-700",

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

/* =====================================================
   INPUT
===================================================== */

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value:
    string | number;
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
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
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
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
      >
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
   SUMMARY BOX
===================================================== */

function SummaryBox({
  title,
  value,
  danger = false,
  success = false,
}: {
  title: string;
  value: string;
  danger?: boolean;
  success?: boolean;
}) {
  let valueClass =
    "text-slate-900";

  if (danger) {
    valueClass =
      "text-red-600";
  } else if (
    success
  ) {
    valueClass =
      "text-emerald-600";
  }

  return (
    <div className="rounded-xl bg-white p-4">
      <p className="text-xs text-slate-500">
        {title}
      </p>

      <p
        className={`mt-1 text-lg font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}