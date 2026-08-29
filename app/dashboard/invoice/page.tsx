"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ProductType =
  | "weight"
  | "quantity"
  | "size";

type Bundle = {
  id: number;
  name: string;
  weight: string;
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
  size: string;
  material: string;
  brand: string;
  model: string;
  quality: string;
  color: string;
  bundles: Bundle[];
};

type InvoiceItem = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  rate: number;
};

const PRODUCT_KEY =
  "hafiz_products";

const INVOICE_KEY =
  "hafiz_invoice_number";

const TAX_RATE =
  0.05;

const firstItem: InvoiceItem =
  {
    id: 1,
    productId: 0,
    productName: "",
    quantity: 1,
    rate: 0,
  };

/* ============================
   PRODUCT NORMALIZER
============================ */

function normalizeProduct(
  value: unknown
): Product | null {
  if (
    typeof value !==
      "object" ||
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
    rawType ===
      "weight" ||
    rawType ===
      "size" ||
    rawType ===
      "quantity"
      ? rawType
      : "quantity";

  const bundles: Bundle[] =
    Array.isArray(
      raw.bundles
    )
      ? raw.bundles.map(
          (
            bundleValue,
            index
          ) => {
            const bundle =
              typeof bundleValue ===
                "object" &&
              bundleValue !==
                null
                ? (bundleValue as Record<
                    string,
                    unknown
                  >)
                : {};

            return {
              id:
                Number(
                  bundle.id
                ) ||
                index +
                  1,

              name:
                String(
                  bundle.name ||
                    `B-${String(
                      index +
                        1
                    ).padStart(
                      3,
                      "0"
                    )}`
                ),

              weight:
                String(
                  Number(
                    bundle.weight
                  ) || 0
                ),
            };
          }
        )
      : [];

  return {
    id:
      Number(raw.id) ||
      0,

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
      type ===
      "weight"
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
      Number(
        raw.quantity
      ) || 0,

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
        raw.quality ||
          ""
      ),

    color:
      String(
        raw.color || ""
      ),

    bundles,
  };
}

export default function InvoicePage() {
  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      []
    );

  const [
    invoiceNumber,
    setInvoiceNumber,
  ] =
    useState("INV-1");

  const [
    invoiceDate,
    setInvoiceDate,
  ] =
    useState("");

  const [
    customerName,
    setCustomerName,
  ] =
    useState("");

  const [
    customerPhone,
    setCustomerPhone,
  ] =
    useState("");

  const [
    paidAmount,
    setPaidAmount,
  ] =
    useState("");

  const [
    items,
    setItems,
  ] =
    useState<
      InvoiceItem[]
    >([
      firstItem,
    ]);

  const nextItemId =
    useRef(2);

  /* ============================
     INITIAL LOAD
  ============================ */

  useEffect(() => {
    loadProducts();
    loadInvoiceNumber();
    updateDate();
  }, []);

  /* ============================
     RELOAD WHEN TAB ACTIVE
  ============================ */

  useEffect(() => {
    function handleFocus() {
      loadProducts();
    }

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);

  /* ============================
     LOAD PRODUCTS
  ============================ */

  function loadProducts() {
    try {
      const saved =
        localStorage.getItem(
          PRODUCT_KEY
        );

      if (!saved) {
        setProducts([]);
        return;
      }

      const parsed:
        unknown =
        JSON.parse(saved);

      if (
        !Array.isArray(
          parsed
        )
      ) {
        setProducts([]);
        return;
      }

      const cleanProducts =
        parsed
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
    } catch {
      setProducts([]);
    }
  }

  /* ============================
     INVOICE NUMBER
  ============================ */

  function loadInvoiceNumber() {
    try {
      const saved =
        localStorage.getItem(
          INVOICE_KEY
        );

      let number =
        Number(
          saved || "1"
        );

      if (
        !Number.isFinite(
          number
        ) ||
        number < 1
      ) {
        number = 1;

        localStorage.setItem(
          INVOICE_KEY,
          "1"
        );
      }

      setInvoiceNumber(
        `INV-${Math.floor(
          number
        )}`
      );
    } catch {
      setInvoiceNumber(
        "INV-1"
      );
    }
  }

  /* ============================
     DATE
  ============================ */

  function updateDate() {
    const now =
      new Date();

    setInvoiceDate(
      now.toLocaleString(
        "en-PK",
        {
          dateStyle:
            "medium",

          timeStyle:
            "short",
        }
      )
    );
  }

  /* ============================
     STOCK
  ============================ */

  function getStock(
    product: Product
  ) {
    if (
      product.type ===
      "weight"
    ) {
      return product.bundles.reduce(
        (
          total,
          bundle
        ) =>
          total +
          (Number(
            bundle.weight
          ) || 0),
        0
      );
    }

    return Math.max(
      0,
      Number(
        product.quantity
      ) || 0
    );
  }

  function getUnit(
    product: Product
  ) {
    if (
      product.type ===
      "weight"
    ) {
      return "KG";
    }

    return (
      product.unit ||
      "PCS"
    );
  }

  /* ============================
     PRICE
  ============================ */

  function formatPrice(
    value: number
  ) {
    return (
      "Rs. " +
      Number(
        value || 0
      ).toLocaleString(
        "en-PK",
        {
          minimumFractionDigits:
            2,

          maximumFractionDigits:
            2,
        }
      )
    );
  }

  /* ============================
     ADD ITEM
  ============================ */

  function addItem() {
    const id =
      nextItemId.current;

    nextItemId.current +=
      1;

    setItems(
      (current) => [
        ...current,

        {
          id,
          productId: 0,
          productName: "",
          quantity: 1,
          rate: 0,
        },
      ]
    );
  }

  /* ============================
     REMOVE ITEM
  ============================ */

  function removeItem(
    id: number
  ) {
    setItems(
      (current) => {
        if (
          current.length ===
          1
        ) {
          return current;
        }

        return current.filter(
          (item) =>
            item.id !== id
        );
      }
    );
  }

  /* ============================
     SELECT PRODUCT
  ============================ */

  function selectProduct(
    itemId: number,
    productId: number
  ) {
    const product =
      products.find(
        (current) =>
          current.id ===
          productId
      );

    if (!product) {
      setItems(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              itemId
                ? {
                    ...item,

                    productId:
                      0,

                    productName:
                      "",

                    quantity:
                      1,

                    rate: 0,
                  }
                : item
          )
      );

      return;
    }

    const stock =
      getStock(
        product
      );

    if (stock <= 0) {
      alert(
        `${product.name} is out of stock.`
      );

      return;
    }

    setItems(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            itemId
              ? {
                  ...item,

                  productId:
                    product.id,

                  productName:
                    product.name,

                  quantity:
                    product.type ===
                    "weight"
                      ? 1
                      : 1,

                  rate:
                    product.sellingPrice,
                }
              : item
        )
    );
  }

  /* ============================
     QUANTITY
  ============================ */

  function updateQuantity(
    itemId: number,
    value: string
  ) {
    const item =
      items.find(
        (current) =>
          current.id ===
          itemId
      );

    if (
      !item ||
      item.productId ===
        0
    ) {
      return;
    }

    const product =
      products.find(
        (current) =>
          current.id ===
          item.productId
      );

    if (!product) {
      return;
    }

    let quantity =
      Number(value);

    if (
      !Number.isFinite(
        quantity
      )
    ) {
      quantity = 0;
    }

    quantity =
      Math.max(
        0,
        quantity
      );

    if (
      product.type !==
      "weight"
    ) {
      quantity =
        Math.floor(
          quantity
        );
    }

    const stock =
      getStock(
        product
      );

    const usedElsewhere =
      items
        .filter(
          (current) =>
            current.id !==
              itemId &&
            current.productId ===
              product.id
        )
        .reduce(
          (
            total,
            current
          ) =>
            total +
            Number(
              current.quantity
            ),
          0
        );

    const available =
      Math.max(
        0,
        stock -
          usedElsewhere
      );

    if (
      quantity >
      available
    ) {
      alert(
        `Available stock: ${available} ${getUnit(
          product
        )}`
      );

      quantity =
        available;
    }

    setItems(
      (current) =>
        current.map(
          (
            currentItem
          ) =>
            currentItem.id ===
            itemId
              ? {
                  ...currentItem,
                  quantity,
                }
              : currentItem
        )
    );
  }

  /* ============================
     RATE
  ============================ */

  function updateRate(
    itemId: number,
    value: string
  ) {
    let rate =
      Number(value);

    if (
      !Number.isFinite(
        rate
      )
    ) {
      rate = 0;
    }

    rate =
      Math.max(
        0,
        rate
      );

    setItems(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            itemId
              ? {
                  ...item,
                  rate,
                }
              : item
        )
    );
  }

  /* ============================
     TOTALS
  ============================ */

  const subtotal =
    useMemo(() => {
      return items.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.quantity
          ) *
            Number(
              item.rate
            ),
        0
      );
    }, [
      items,
    ]);

  const tax =
    subtotal *
    TAX_RATE;

  const total =
    subtotal +
    tax;

  const paid =
    Math.max(
      0,
      Number(
        paidAmount
      ) || 0
    );

  const remaining =
    Math.max(
      0,
      total - paid
    );

  const change =
    Math.max(
      0,
      paid - total
    );

  /* ============================
     VALID ITEMS
  ============================ */

  function getValidItems() {
    return items.filter(
      (item) =>
        item.productId >
          0 &&
        item.quantity > 0
    );
  }

  /* ============================
     VALIDATE
  ============================ */

  function validateInvoice() {
    const validItems =
      getValidItems();

    if (
      validItems.length ===
      0
    ) {
      alert(
        "Select at least one product."
      );

      return false;
    }

    const soldMap =
      new Map<
        number,
        number
      >();

    validItems.forEach(
      (item) => {
        soldMap.set(
          item.productId,

          (soldMap.get(
            item.productId
          ) || 0) +
            item.quantity
        );
      }
    );

    for (const [
      productId,
      soldQuantity,
    ] of soldMap) {
      const product =
        products.find(
          (current) =>
            current.id ===
            productId
        );

      if (!product) {
        alert(
          "Product not found."
        );

        return false;
      }

      const stock =
        getStock(
          product
        );

      if (
        soldQuantity >
        stock
      ) {
        alert(
          `${product.name} has only ${stock} ${getUnit(
            product
          )}`
        );

        return false;
      }
    }

    return true;
  }

  /* ============================
     REDUCE COTTON BUNDLES
  ============================ */

  function reduceWeight(
    product: Product,
    soldWeight: number
  ) {
    let weightToRemove =
      soldWeight;

    const bundles =
      product.bundles
        .map(
          (bundle) => {
            const currentWeight =
              Number(
                bundle.weight
              ) || 0;

            if (
              weightToRemove <=
              0
            ) {
              return bundle;
            }

            if (
              currentWeight <=
              weightToRemove
            ) {
              weightToRemove -=
                currentWeight;

              return {
                ...bundle,
                weight: "0",
              };
            }

            const newWeight =
              currentWeight -
              weightToRemove;

            weightToRemove =
              0;

            return {
              ...bundle,

              weight:
                String(
                  Number(
                    newWeight.toFixed(
                      2
                    )
                  )
                ),
            };
          }
        )
        .filter(
          (bundle) =>
            Number(
              bundle.weight
            ) > 0
        );

    return {
      ...product,
      bundles,
    };
  }

  /* ============================
     SAVE INVOICE
  ============================ */

  function saveInvoice() {
    if (
      !validateInvoice()
    ) {
      return;
    }

    const validItems =
      getValidItems();

    const soldMap =
      new Map<
        number,
        number
      >();

    validItems.forEach(
      (item) => {
        soldMap.set(
          item.productId,

          (soldMap.get(
            item.productId
          ) || 0) +
            item.quantity
        );
      }
    );

    const updatedProducts =
      products.map(
        (product) => {
          const sold =
            soldMap.get(
              product.id
            ) || 0;

          if (
            sold <= 0
          ) {
            return product;
          }

          if (
            product.type ===
            "weight"
          ) {
            return reduceWeight(
              product,
              sold
            );
          }

          return {
            ...product,

            quantity:
              Math.max(
                0,
                product.quantity -
                  sold
              ),
          };
        }
      );

    try {
      localStorage.setItem(
        PRODUCT_KEY,

        JSON.stringify(
          updatedProducts
        )
      );

      setProducts(
        updatedProducts
      );

      let number =
        Number(
          localStorage.getItem(
            INVOICE_KEY
          ) || "1"
        );

      if (
        !Number.isFinite(
          number
        ) ||
        number < 1
      ) {
        number = 1;
      }

      const nextNumber =
        Math.floor(
          number
        ) + 1;

      localStorage.setItem(
        INVOICE_KEY,
        String(
          nextNumber
        )
      );

      alert(
        "Invoice saved successfully. Product stock updated."
      );

      setInvoiceNumber(
        `INV-${nextNumber}`
      );

      resetForm();
    } catch {
      alert(
        "Could not save invoice."
      );
    }
  }

  /* ============================
     RESET FORM
  ============================ */

  function resetForm() {
    setCustomerName(
      ""
    );

    setCustomerPhone(
      ""
    );

    setPaidAmount(
      ""
    );

    setItems([
      {
        id: 1,

        productId:
          0,

        productName:
          "",

        quantity:
          1,

        rate: 0,
      },
    ]);

    nextItemId.current =
      2;

    updateDate();
  }

  /* ============================
     NEW INVOICE
  ============================ */

  function newInvoice() {
    resetForm();

    loadProducts();

    let number =
      Number(
        localStorage.getItem(
          INVOICE_KEY
        ) || "1"
      );

    if (
      !Number.isFinite(
        number
      ) ||
      number < 1
    ) {
      number = 1;
    }

    setInvoiceNumber(
      `INV-${Math.floor(
        number
      )}`
    );
  }

  /* ============================
     PRINT
  ============================ */

  function printInvoice() {
    if (
      !validateInvoice()
    ) {
      return;
    }

    window.print();
  }

  return (
    <>

      {/* SCREEN */}

      <div className="min-h-screen bg-slate-50 p-4 md:p-6 print:hidden">

        <div className="mx-auto max-w-7xl">

          {/* HEADER */}

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h1 className="text-2xl font-bold text-slate-900">
                Invoice Maker
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Hafiz Electronic Charpai & Cotton West Merchant
              </p>

            </div>

            <div className="flex gap-2">

              <button
                type="button"
                onClick={
                  newInvoice
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
              >
                New Invoice
              </button>

              <button
                type="button"
                onClick={
                  printInvoice
                }
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
              >
                Print Invoice
              </button>

            </div>

          </div>

          {/* CUSTOMER INFO */}

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-lg font-bold">
                Invoice Information
              </h2>

              <div className="rounded-xl bg-blue-50 px-4 py-2 font-bold text-blue-700">
                {
                  invoiceNumber
                }
              </div>

            </div>

            <div className="grid gap-4 md:grid-cols-3">

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Customer Name
                </label>

                <input
                  value={
                    customerName
                  }
                  onChange={(
                    event
                  ) =>
                    setCustomerName(
                      event.target
                        .value
                    )
                  }
                  placeholder="Customer name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Customer Phone
                </label>

                <input
                  value={
                    customerPhone
                  }
                  onChange={(
                    event
                  ) =>
                    setCustomerPhone(
                      event.target
                        .value
                    )
                  }
                  placeholder="03XX XXXXXXX"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Date & Time
                </label>

                <div className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm">
                  {invoiceDate ||
                    "-"}
                </div>

              </div>

            </div>

          </div>

          {/* ITEMS */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-lg font-bold">
                  Invoice Items
                </h2>

                <p className="text-sm text-slate-500">
                  Products page ke saved products yahan automatically load honge.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  addItem
                }
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
              >
                + Add Item
              </button>

            </div>

            {products.length ===
              0 && (

              <div className="border-b border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
                No products available. First add products from Products page.
              </div>

            )}

            <div className="overflow-x-auto p-5">

              <table className="w-full min-w-262.5">

                <thead>

                  <tr className="border-b text-left text-xs uppercase text-slate-500">

                    <th className="px-3 py-3">
                      #
                    </th>

                    <th className="px-3 py-3">
                      Product
                    </th>

                    <th className="px-3 py-3">
                      Stock
                    </th>

                    <th className="px-3 py-3">
                      Qty / Weight
                    </th>

                    <th className="px-3 py-3">
                      Rate
                    </th>

                    <th className="px-3 py-3 text-right">
                      Amount
                    </th>

                    <th className="px-3 py-3">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {items.map(
                    (
                      item,
                      index
                    ) => {

                      const product =
                        products.find(
                          (
                            current
                          ) =>
                            current.id ===
                            item.productId
                        );

                      const stock =
                        product
                          ? getStock(
                              product
                            )
                          : 0;

                      const unit =
                        product
                          ? getUnit(
                              product
                            )
                          : "";

                      const amount =
                        item.quantity *
                        item.rate;

                      return (
                        <tr
                          key={
                            item.id
                          }
                          className="border-b border-slate-100"
                        >

                          <td className="px-3 py-4 font-semibold">
                            {index +
                              1}
                          </td>

                          {/* PRODUCT */}

                          <td className="px-3 py-4">

                            <select
                              value={
                                item.productId
                              }
                              onChange={(
                                event
                              ) =>
                                selectProduct(
                                  item.id,

                                  Number(
                                    event
                                      .target
                                      .value
                                  )
                                )
                              }
                              className="w-80 rounded-xl border border-slate-200 bg-white px-3 py-3"
                            >

                              <option
                                value={
                                  0
                                }
                              >
                                Select Product
                              </option>

                              {products.map(
                                (
                                  option
                                ) => {

                                  const optionStock =
                                    getStock(
                                      option
                                    );

                                  return (
                                    <option
                                      key={
                                        option.id
                                      }
                                      value={
                                        option.id
                                      }
                                      disabled={
                                        optionStock <=
                                        0
                                      }
                                    >
                                      {
                                        option.name
                                      }{" "}
                                      -{" "}
                                      {
                                        optionStock
                                      }{" "}
                                      {getUnit(
                                        option
                                      )}
                                    </option>
                                  );
                                }
                              )}

                            </select>

                            {product && (

                              <div className="mt-2 text-xs text-slate-500">

                                {
                                  product.category
                                }

                                {product.brand
                                  ? ` • ${product.brand}`
                                  : ""}

                                {product.model
                                  ? ` • ${product.model}`
                                  : ""}

                                {product.quality
                                  ? ` • ${product.quality}`
                                  : ""}

                                {product.size
                                  ? ` • Size ${product.size}`
                                  : ""}

                              </div>

                            )}

                          </td>

                          {/* STOCK */}

                          <td className="px-3 py-4">

                            {product ? (
                              <>

                                <div
                                  className={`font-bold ${
                                    stock >
                                    0
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {
                                    stock
                                  }{" "}
                                  {
                                    unit
                                  }
                                </div>

                                <div className="text-xs text-slate-400">
                                  Available
                                </div>

                              </>
                            ) : (
                              "—"
                            )}

                          </td>

                          {/* QUANTITY */}

                          <td className="px-3 py-4">

                            <input
                              type="number"
                              min="0"
                              step={
                                product?.type ===
                                "weight"
                                  ? "0.01"
                                  : "1"
                              }
                              value={
                                item.quantity
                              }
                              disabled={
                                !product
                              }
                              onChange={(
                                event
                              ) =>
                                updateQuantity(
                                  item.id,
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                            />

                            {product && (

                              <div className="mt-1 text-xs text-slate-400">
                                {
                                  unit
                                }
                              </div>

                            )}

                          </td>

                          {/* RATE */}

                          <td className="px-3 py-4">

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.rate
                              }
                              disabled={
                                !product
                              }
                              onChange={(
                                event
                              ) =>
                                updateRate(
                                  item.id,
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                            />

                          </td>

                          {/* AMOUNT */}

                          <td className="px-3 py-4 text-right font-bold">
                            {formatPrice(
                              amount
                            )}
                          </td>

                          {/* REMOVE */}

                          <td className="px-3 py-4">

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  item.id
                                )
                              }
                              disabled={
                                items.length ===
                                1
                              }
                              className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 disabled:text-slate-300"
                            >
                              Remove
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

            {/* TOTALS */}

            <div className="border-t p-5">

              <div className="ml-auto max-w-md space-y-3">

                <div className="flex justify-between">

                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {formatPrice(
                      subtotal
                    )}
                  </strong>

                </div>

                <div className="flex justify-between">

                  <span>
                    Tax (5%)
                  </span>

                  <strong>
                    {formatPrice(
                      tax
                    )}
                  </strong>

                </div>

                <div className="flex justify-between border-t border-dashed pt-3">

                  <span className="text-lg font-bold">
                    Total
                  </span>

                  <strong className="text-xl text-blue-600">
                    {formatPrice(
                      total
                    )}
                  </strong>

                </div>

                {/* PAID */}

                <div className="flex items-center justify-between gap-4 pt-3">

                  <label className="font-semibold">
                    Paid Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      paidAmount
                    }
                    onChange={(
                      event
                    ) =>
                      setPaidAmount(
                        event.target
                          .value
                      )
                    }
                    className="w-40 rounded-xl border border-slate-200 px-3 py-3 text-right"
                  />

                </div>

                {/* REMAINING */}

                {total >
                  paid && (

                  <div className="flex justify-between rounded-xl bg-red-50 px-4 py-3 font-bold text-red-600">

                    <span>
                      Remaining Balance
                    </span>

                    <span>
                      {formatPrice(
                        remaining
                      )}
                    </span>

                  </div>

                )}

                {/* PAID */}

                {total >
                  0 &&
                  paid >=
                    total && (

                  <div className="flex justify-between rounded-xl bg-green-50 px-4 py-3 font-bold text-green-700">

                    <span>
                      Payment Status
                    </span>

                    <span>
                      PAID
                    </span>

                  </div>

                )}

                {/* CHANGE */}

                {change >
                  0 && (

                  <div className="flex justify-between rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700">

                    <span>
                      Change
                    </span>

                    <span>
                      {formatPrice(
                        change
                      )}
                    </span>

                  </div>

                )}

                {/* SAVE */}

                <button
                  type="button"
                  onClick={
                    saveInvoice
                  }
                  className="mt-4 w-full rounded-xl bg-slate-900 px-5 py-4 font-bold text-white hover:bg-slate-800"
                >
                  Save Invoice & Update Stock
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =========================
          PRINT INVOICE
      ========================= */}

      <div className="invoice-print hidden">

        <div className="print-header">

          <div>

            <h1>
              HAFIZ ELECTRONIC CHARPAI & COTTON WEST MERCHANT
            </h1>

            <p>
              Retail Sales Invoice
            </p>

          </div>

          <strong>
            {
              invoiceNumber
            }
          </strong>

        </div>

        <div className="print-info">

          <div>

            <b>
              Customer:
            </b>{" "}

            {customerName ||
              "Walk-in Customer"}

          </div>

          <div>

            <b>
              Phone:
            </b>{" "}

            {customerPhone ||
              "-"}

          </div>

          <div>

            <b>
              Date:
            </b>{" "}

            {
              invoiceDate
            }

          </div>

        </div>

        <table className="print-table">

          <thead>

            <tr>

              <th>
                #
              </th>

              <th>
                Product
              </th>

              <th>
                Details
              </th>

              <th>
                Qty / Weight
              </th>

              <th>
                Rate
              </th>

              <th>
                Amount
              </th>

            </tr>

          </thead>

          <tbody>

            {getValidItems().map(
              (
                item,
                index
              ) => {

                const product =
                  products.find(
                    (
                      current
                    ) =>
                      current.id ===
                      item.productId
                  );

                const details =
                  product
                    ? [
                        product.brand,

                        product.model,

                        product.quality,

                        product.size
                          ? `Size ${product.size}`
                          : "",

                        product.material,

                        product.color,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " / "
                        ) ||
                      "-"
                    : "-";

                return (
                  <tr
                    key={
                      item.id
                    }
                  >

                    <td>
                      {index +
                        1}
                    </td>

                    <td>
                      {
                        item.productName
                      }
                    </td>

                    <td>
                      {
                        details
                      }
                    </td>

                    <td>

                      {
                        item.quantity
                      }{" "}

                      {product
                        ? getUnit(
                            product
                          )
                        : ""}

                    </td>

                    <td>
                      {formatPrice(
                        item.rate
                      )}
                    </td>

                    <td>
                      {formatPrice(
                        item.quantity *
                          item.rate
                      )}
                    </td>

                  </tr>
                );
              }
            )}

          </tbody>

        </table>

        <div className="print-summary">

          <div>

            <span>
              Subtotal
            </span>

            <strong>
              {formatPrice(
                subtotal
              )}
            </strong>

          </div>

          <div>

            <span>
              Tax (5%)
            </span>

            <strong>
              {formatPrice(
                tax
              )}
            </strong>

          </div>

          <div className="print-total">

            <span>
              Total
            </span>

            <strong>
              {formatPrice(
                total
              )}
            </strong>

          </div>

          <div>

            <span>
              Paid
            </span>

            <strong>
              {formatPrice(
                paid
              )}
            </strong>

          </div>

          {remaining >
            0 && (

            <div>

              <span>
                Remaining
              </span>

              <strong>
                {formatPrice(
                  remaining
                )}
              </strong>

            </div>

          )}

          {change >
            0 && (

            <div>

              <span>
                Change
              </span>

              <strong>
                {formatPrice(
                  change
                )}
              </strong>

            </div>

          )}

        </div>

        <div className="print-footer">
          Thank you for shopping with us!
        </div>

      </div>

      {/* =========================
          PRINT CSS
      ========================= */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          .invoice-print {
            display: block !important;
            width: 100%;
            color: #111827;
            font-family: Arial, sans-serif;
          }

          .print-header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            border-bottom: 2px solid #111827;
            padding-bottom: 12px;
            margin-bottom: 15px;
          }

          .print-header h1 {
            margin: 0;
            font-size: 22px;
          }

          .print-header p {
            margin: 4px 0 0;
            font-size: 13px;
          }

          .print-header strong {
            border: 1px solid #111827;
            padding: 8px 14px;
            height: fit-content;
          }

          .print-info {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
            font-size: 13px;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #374151;
            padding: 8px;
            text-align: left;
          }

          .print-table th:last-child,
          .print-table td:last-child {
            text-align: right;
          }

          .print-summary {
            width: 350px;
            margin-left: auto;
            margin-top: 18px;
            font-size: 13px;
          }

          .print-summary > div {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }

          .print-total {
            border-top: 2px solid #111827;
            border-bottom: 1px solid #111827;
            padding: 8px 0 !important;
            font-size: 16px;
          }

          .print-footer {
            margin-top: 25px;
            border-top: 1px solid #9ca3af;
            padding-top: 10px;
            text-align: center;
            font-size: 13px;
          }
        }
      `}</style>

    </>
  );
}