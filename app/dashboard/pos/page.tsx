"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ScanBarcode } from "lucide-react";
import ProductCard from "@/app/components/pos/productCard";
import CartItem from "@/app/components/pos/cartItem";
import Checkout from "@/app/components/pos/checkOut";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  icon: string;
  barcode: string;
  type: "quantity" | "weight" | "size";
  unit: string;
};

type CartProduct = Product & {
  quantity: number;
};

function parseWeights(
  value: unknown
) {
  return String(
    value || ""
  )
    .split(/[+,\n\r\s]+/)
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

export default function POSPage() {
  const router =
    useRouter();

  const scanInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    loadingProducts,
    setLoadingProducts,
  ] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartProduct[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const [
    barcodeValue,
    setBarcodeValue,
  ] = useState("");

  const [
    scanMessage,
    setScanMessage,
  ] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(
          true
        );

        const response =
          await fetch(
            "/api/products?status=active",
            {
              cache:
                "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to load products."
          );
        }

        const data =
          (await response.json()) as Array<
            Record<string, unknown>
          >;

        const mapped =
          data.map(
            (raw) => {
              const type =
                raw.type ===
                  "weight" ||
                raw.type ===
                  "size"
                  ? raw.type
                  : "quantity";

              const stock =
                type ===
                "weight"
                  ? parseWeights(
                      raw.weightEntries
                    ).reduce(
                      (
                        total,
                        weight
                      ) =>
                        total +
                        weight,
                      0
                    )
                  : Math.max(
                      0,
                      Number(
                        raw.quantity
                      ) || 0
                    );

              return {
                id:
                  Number(
                    raw.id
                  ) || 0,

                name:
                  String(
                    raw.name ||
                      ""
                  ),

                category:
                  String(
                    raw.categoryName ||
                      raw.category ||
                      "Other"
                  ),

                price:
                  Math.max(
                    0,
                    Number(
                      raw.sellingPrice
                    ) || 0
                  ),

                stock,

                icon:
                  "📦",

                barcode:
                  String(
                    raw.barcode ||
                      ""
                  ).trim(),

                type,

                unit:
                  type ===
                  "weight"
                    ? "KG"
                    : String(
                        raw.unit ||
                          "PCS"
                      ),
              } satisfies Product;
            }
          )
          .filter(
            (product) =>
              product.id >
                0 &&
              product.name
          );

        setProducts(
          mapped
        );
      } catch (error) {
        console.error(
          "Load POS products:",
          error
        );

        setScanMessage(
          "Unable to load products."
        );
      } finally {
        setLoadingProducts(
          false
        );
      }
    }

    void loadProducts();
  }, []);

  const categories =
    useMemo(
      () => [
        "All",
        ...Array.from(
          new Set(
            products.map(
              (product) =>
                product.category
            )
          )
        ),
      ],
      [products]
    );

  const filteredProducts = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        searchText === "" ||
        product.name.toLowerCase().includes(searchText) ||
        product.category.toLowerCase().includes(searchText);

      const matchesCategory =
        category === "All" ||
        product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  // ADD TO CART
  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        if (existing.quantity >= product.stock) {
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  async function scanBarcode() {
    const barcode =
      barcodeValue.trim();

    if (!barcode) {
      scanInputRef.current?.focus();
      return;
    }

    try {
      setScanMessage(
        "Scanning..."
      );

      const response =
        await fetch(
          `/api/products/barcode/${encodeURIComponent(
            barcode
          )}`,
          {
            cache:
              "no-store",
          }
        );

      const data =
        (await response.json()) as Record<
          string,
          unknown
        >;

      if (!response.ok) {
        throw new Error(
          String(
            data.message ||
              "Product not found."
          )
        );
      }

      const type =
        data.type ===
          "weight" ||
        data.type ===
          "size"
          ? data.type
          : "quantity";

      const stock =
        type ===
        "weight"
          ? parseWeights(
              data.weightEntries
            ).reduce(
              (
                total,
                weight
              ) =>
                total +
                weight,
              0
            )
          : Math.max(
              0,
              Number(
                data.quantity
              ) || 0
            );

      const product: Product = {
        id:
          Number(
            data.id
          ) || 0,

        name:
          String(
            data.name ||
              ""
          ),

        category:
          String(
            data.categoryName ||
              data.category ||
              "Other"
          ),

        price:
          Math.max(
            0,
            Number(
              data.sellingPrice
            ) || 0
          ),

        stock,

        icon:
          "📦",

        barcode:
          String(
            data.barcode ||
              ""
          ),

        type,

        unit:
          type ===
          "weight"
            ? "KG"
            : String(
                data.unit ||
                  "PCS"
              ),
      };

      if (
        product.stock <= 0
      ) {
        throw new Error(
          "Product is out of stock."
        );
      }

      if (
        product.type ===
        "weight"
      ) {
        const entered =
          window.prompt(
            `Enter KG for ${product.name}\nAvailable: ${product.stock.toFixed(
              2
            )} KG`
          );

        if (
          entered ===
            null
        ) {
          setBarcodeValue(
            ""
          );

          setScanMessage(
            ""
          );

          scanInputRef.current?.focus();

          return;
        }

        const kg =
          Number(
            entered
          );

        if (
          !Number.isFinite(
            kg
          ) ||
          kg <= 0 ||
          kg >
            product.stock
        ) {
          throw new Error(
            "Enter valid KG within available stock."
          );
        }

        setCart(
          (
            currentCart
          ) => {
            const existing =
              currentCart.find(
                (item) =>
                  item.id ===
                  product.id
              );

            if (existing) {
              const nextQuantity =
                existing.quantity +
                kg;

              if (
                nextQuantity >
                product.stock
              ) {
                return currentCart;
              }

              return currentCart.map(
                (item) =>
                  item.id ===
                  product.id
                    ? {
                        ...item,
                        quantity:
                          nextQuantity,
                      }
                    : item
              );
            }

            return [
              ...currentCart,
              {
                ...product,
                quantity:
                  kg,
              },
            ];
          }
        );
      } else {
        addToCart(
          product
        );
      }

      setScanMessage(
        `${product.name} added to cart.`
      );

      setBarcodeValue(
        ""
      );

      window.setTimeout(
        () => {
          setScanMessage(
            ""
          );

          scanInputRef.current?.focus();
        },
        1200
      );
    } catch (error) {
      setScanMessage(
        error instanceof Error
          ? error.message
          : "Product not found."
      );

      setBarcodeValue(
        ""
      );

      scanInputRef.current?.focus();
    }
  }

  // INCREASE
  const increaseQuantity = (id: number) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id && item.quantity < item.stock
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // DECREASE
  const decreaseQuantity = (id: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // REMOVE
  const removeFromCart = (id: number) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  };

  // CLEAR
  const clearCart = () => {
    setCart([]);
    setShowCheckout(false);
  };

  // TOTALS
  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const totalItems = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const formatPrice = (price: number = 0) =>
    `Rs. ${Number(price || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // CONFIRM SALE
  const handleConfirmSale = (
    paymentMethod: string,
    amountReceived: number
  ) => {
    console.log({
      cart,
      subtotal,
      tax,
      total,
      paymentMethod,
      amountReceived,
    });

    const change =
      paymentMethod === "Cash"
        ? Math.max(0, amountReceived - total)
        : 0;

    alert(
      `Sale Completed!\n\nPayment: ${paymentMethod}\nTotal: ${formatPrice(
        total
      )}\nChange: ${formatPrice(change)}`
    );

    setCart([]);
    setShowCheckout(false);
  };

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-slate-50 px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6">

      {/* HEADER */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex min-w-0 items-start gap-3">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Back to Dashboard"
            title="Back to Dashboard"
          >
            <ArrowLeft
              size={19}
            />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Point of Sale
            </h1>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Create a new customer sale
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={clearCart}
          disabled={cart.length === 0}
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Clear Cart
        </button>

      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">

        {/* PRODUCTS */}
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">

          {/* BARCODE SCANNER */}
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">

            <div className="flex items-center gap-2">
              <ScanBarcode
                size={20}
                className="shrink-0 text-slate-600"
              />

              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">
                  Barcode Scanner
                </p>

                <p className="text-xs text-slate-500">
                  Scan barcode or type it and press Enter.
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">

              <input
                ref={
                  scanInputRef
                }
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={
                  barcodeValue
                }
                onChange={(
                  event
                ) =>
                  setBarcodeValue(
                    event.target.value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();
                    void scanBarcode();
                  }
                }}
                placeholder="Scan barcode..."
                className="min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={() =>
                  void scanBarcode()
                }
                className="min-h-11 shrink-0 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Add Item
              </button>

            </div>

            {scanMessage && (
              <p className={`mt-2 text-xs font-semibold ${
                scanMessage.includes(
                  "added to cart"
                )
                  ? "text-emerald-600"
                  : scanMessage ===
                    "Scanning..."
                    ? "text-slate-500"
                    : "text-red-600"
              }`}>
                {scanMessage}
              </p>
            )}

          </div>

          {/* SEARCH */}
          <div className="mb-5">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search products e.g. Washing Machine..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* CATEGORY */}
          <div className="mb-5 flex max-w-full gap-2 overflow-x-auto pb-1 sm:mb-6">

            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  category === item
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item}
              </button>
            ))}

          </div>

          <div className="mb-4 text-sm text-slate-500">
            {filteredProducts.length} product
            {filteredProducts.length !== 1 ? "s" : ""} found
          </div>

          {/* PRODUCTS */}
          {loadingProducts ? (

            <div className="flex min-h-56 items-center justify-center text-sm font-semibold text-slate-500">
              Loading products...
            </div>

          ) : filteredProducts.length === 0 ? (

            <div className="flex min-h-75 items-center justify-center text-center">

              <div>
                <div className="mb-3 text-5xl">
                  🔍
                </div>

                <h3 className="font-bold text-slate-800">
                  No product found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try another product name.
                </p>
              </div>

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                />
              ))}

            </div>

          )}

        </section>

        {/* RIGHT PANEL */}
        <section className="h-fit rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6">

          {!showCheckout ? (

            <>
              {/* CART HEADER */}
              <div className="border-b border-slate-200 p-5">

                <h2 className="text-lg font-bold text-slate-900">
                  Current Order
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {totalItems} item
                  {totalItems !== 1 ? "s" : ""}
                </p>

              </div>

              {/* CART */}
              <div className="p-3 sm:p-4 xl:max-h-107.5 xl:overflow-y-auto">

                {cart.length === 0 ? (

                  <div className="flex min-h-62.5 items-center justify-center text-center">

                    <div>
                      <div className="mb-3 text-5xl">
                        🛒
                      </div>

                      <h3 className="font-bold text-slate-800">
                        Cart is empty
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Click Add to Cart on a product.
                      </p>
                    </div>

                  </div>

                ) : (

                  <div className="space-y-3">

                    {cart.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onIncrease={increaseQuantity}
                        onDecrease={decreaseQuantity}
                        onRemove={removeFromCart}
                      />
                    ))}

                  </div>

                )}

              </div>

              {/* SUMMARY */}
              <div className="border-t border-slate-200 p-5">

                <div className="space-y-3">

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Subtotal
                    </span>

                    <span className="font-semibold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Tax (5%)
                    </span>

                    <span className="font-semibold">
                      {formatPrice(tax)}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-3">

                    <div className="flex justify-between">

                      <span className="font-bold">
                        Total
                      </span>

                      <span className="text-xl font-bold text-blue-600">
                        {formatPrice(total)}
                      </span>

                    </div>

                  </div>

                </div>

                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => setShowCheckout(true)}
                  className="mt-5 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  💳 Proceed to Checkout
                </button>

              </div>
            </>

          ) : (

            <>
              {/* CHECKOUT HEADER */}
              <div className="flex items-center gap-3 border-b border-slate-200 p-5">

                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200"
                  aria-label="Back to cart"
                  title="Back to cart"
                >
                  <ArrowLeft size={18} />
                </button>

                <div>
                  <h2 className="text-lg font-bold">
                    Checkout
                  </h2>

                  <p className="text-sm text-slate-500">
                    Complete payment
                  </p>
                </div>

              </div>

              <div className="p-5">

                <Checkout
                  subtotal={Number(subtotal) || 0}
                  tax={Number(tax) || 0}
                  total={Number(total) || 0}
                  onConfirm={handleConfirmSale}
                />

              </div>
            </>

          )}

        </section>

      </div>
    </div>
  );
}