/* =====================================================
   PRODUCT TYPES
===================================================== */

export type ProductType =
  | "weight"
  | "quantity"
  | "size";

/* =====================================================
   STOCK TYPES
===================================================== */

export type StockType =
  | "Weight"
  | "Quantity"
  | "Size";

/* =====================================================
   STOCK STATUS
===================================================== */

export type StockStatus =
  | "In Stock"
  | "Low Stock"
  | "Out of Stock";

/* =====================================================
   API PRODUCT
===================================================== */

export type ApiProduct = {
  id: number;

  name: string;

  category?: string | null;

  type?:
    | ProductType
    | string
    | null;

  unit?: string | null;

  purchasePrice?:
    | number
    | string
    | null;

  sellingPrice?:
    | number
    | string
    | null;

  quantity?:
    | number
    | string
    | null;

  weightEntries?:
    | string
    | null;

  size?: string | null;

  material?: string | null;

  brand?: string | null;

  model?: string | null;

  quality?: string | null;

  color?: string | null;

  createdAt?: string;

  updatedAt?: string;
};

/* =====================================================
   INVENTORY ITEM
===================================================== */

export type InventoryItem = {
  id: number;

  name: string;

  sku: string;

  category: string;

  productType:
    ProductType;

  type:
    StockType;

  stock: number;

  unit:
    "KG" | "PCS";

  lowStockLimit:
    number;

  purchasePrice:
    number;

  sellingPrice:
    number;

  weightEntries:
    string;

  originalProduct:
    ApiProduct;
};

/* =====================================================
   INVENTORY TRANSACTION TYPES
===================================================== */

export type InventoryTransactionType =
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "OPENING_STOCK"
  | "SALE_CANCEL";

/* =====================================================
   INVENTORY DIRECTION
===================================================== */

export type InventoryDirection =
  | "IN"
  | "OUT";

/* =====================================================
   INVENTORY TRANSACTION
===================================================== */

export type InventoryTransaction = {
  id: number;

  productId: number;

  productName: string;

  category: string;

  productType: string;

  type:
    | InventoryTransactionType
    | string;

  direction:
    InventoryDirection;

  quantity: number;

  unit: string;

  referenceType:
    | string
    | null;

  referenceId:
    | number
    | null;

  note:
    | string
    | null;

  createdAt: string;
};

/* =====================================================
   INVENTORY HISTORY STATS
===================================================== */

export type InventoryHistoryStats = {
  totalTransactions: number;

  totalIn: number;

  totalOut: number;
};

/* =====================================================
   INVENTORY HISTORY API RESPONSE
===================================================== */

export type InventoryHistoryApiResponse = {
  success: boolean;

  transactions:
    InventoryTransaction[];

  stats:
    InventoryHistoryStats;

  pagination?: {
    page: number;

    limit: number;

    total: number;

    totalPages: number;
  };

  message?: string;
};