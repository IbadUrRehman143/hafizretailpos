import type {
  InvoiceItem,
  InvoiceStatus,
  InvoiceTotals,
  Product,
} from "./invoiceTypes";

/* =========================================
   DEFAULT TAX
========================================= */

export const DEFAULT_TAX_RATE = 0;

/* =========================================
   PRICE FORMAT
========================================= */

export function formatPrice(
  value: number
) {
  return Number(
    value || 0
  ).toLocaleString(
    "en-PK",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}

/* =========================================
   WEIGHT CALCULATION
========================================= */

export function calculateWeights(
  value: string
) {
  const weights = String(
    value || ""
  )
    .split("+")
    .map((item) =>
      Number(item.trim())
    )
    .filter(
      (item) =>
        Number.isFinite(item) &&
        item > 0
    );

  const quantity =
    weights.length;

  const totalWeight =
    weights.reduce(
      (total, weight) =>
        total + weight,
      0
    );

  return {
    weights,
    quantity,
    totalWeight,
  };
}

/* =========================================
   PRODUCT STOCK
========================================= */

export function getProductStock(
  product: Product
) {
  if (
    product.type === "weight"
  ) {
    return calculateWeights(
      product.weightEntries
    ).totalWeight;
  }

  return Math.max(
    0,
    Number(
      product.quantity
    ) || 0
  );
}

/* =========================================
   PRODUCT UNIT
========================================= */

export function getProductUnit(
  product: Product
) {
  if (
    product.type === "weight"
  ) {
    return "KG";
  }

  return product.unit || "PCS";
}

/* =========================================
   ITEM QUANTITY
========================================= */

export function getItemQuantity(
  item: InvoiceItem
) {
  if (
    item.type === "weight"
  ) {
    return Math.max(
      0,
      Number(
        item.weight
      ) || 0
    );
  }

  return Math.max(
    0,
    Number(
      item.quantity
    ) || 0
  );
}

/* =========================================
   ITEM SUBTOTAL
========================================= */

export function calculateItemSubtotal(
  item: InvoiceItem
) {
  const quantity =
    getItemQuantity(item);

  const price =
    Math.max(
      0,
      Number(
        item.price
      ) || 0
    );

  return quantity * price;
}

/* =========================================
   ITEM TOTAL
========================================= */

export function calculateItemTotal(
  item: InvoiceItem
) {
  const subtotal =
    calculateItemSubtotal(
      item
    );

  const discount =
    Math.max(
      0,
      Number(
        item.discount
      ) || 0
    );

  return Math.max(
    0,
    subtotal - discount
  );
}

/* =========================================
   INVOICE TOTALS
========================================= */

export function calculateInvoiceTotals(
  items: InvoiceItem[],
  amountPaid: number,
  taxRate: number = DEFAULT_TAX_RATE
): InvoiceTotals {
  const subtotal =
    items.reduce(
      (total, item) =>
        total +
        calculateItemSubtotal(
          item
        ),
      0
    );

  const discount =
    items.reduce(
      (total, item) =>
        total +
        Math.max(
          0,
          Number(
            item.discount
          ) || 0
        ),
      0
    );

  const afterDiscount =
    Math.max(
      0,
      subtotal - discount
    );

  const safeTaxRate =
    Math.max(
      0,
      Number(
        taxRate
      ) || 0
    );

  const tax =
    afterDiscount *
    (safeTaxRate / 100);

  const grandTotal =
    afterDiscount + tax;

  const paid =
    Math.max(
      0,
      Number(
        amountPaid
      ) || 0
    );

  const remaining =
    Math.max(
      0,
      grandTotal - paid
    );

  const change =
    Math.max(
      0,
      paid - grandTotal
    );

  return {
    subtotal,
    discount,
    tax,
    grandTotal,
    amountPaid: paid,
    remaining,
    change,
  };
}

/* =========================================
   PAYMENT STATUS
========================================= */

export function getInvoiceStatus(
  grandTotal: number,
  amountPaid: number
): InvoiceStatus {
  const total =
    Math.max(
      0,
      Number(
        grandTotal
      ) || 0
    );

  const paid =
    Math.max(
      0,
      Number(
        amountPaid
      ) || 0
    );

  if (
    total > 0 &&
    paid >= total
  ) {
    return "Paid";
  }

  if (
    paid > 0 &&
    paid < total
  ) {
    return "Partial";
  }

  return "Unpaid";
}

/* =========================================
   FRONTEND INVOICE NUMBER

   Final number backend save ke baad milega.
========================================= */

export function generateInvoiceNumber() {
  return "AUTO";
}

/* =========================================
   CURRENT DATE
========================================= */

export function getCurrentDate() {
  const now = new Date();

  return now.toLocaleString(
    "en-PK",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

/* =========================================
   SAFE ITEM ID
========================================= */

function generateItemId() {
  try {
    if (
      typeof globalThis !==
        "undefined" &&
      globalThis.crypto &&
      typeof globalThis.crypto
        .randomUUID ===
        "function"
    ) {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    // fallback below
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/* =========================================
   EMPTY INVOICE ITEM
========================================= */

export function createEmptyInvoiceItem(): InvoiceItem {
  return {
    id: generateItemId(),

    productId: null,

    name: "",

    type: "quantity",

    unit: "PCS",

    quantity: 1,

    weight: 0,

    price: 0,

    discount: 0,

    total: 0,
  };
}