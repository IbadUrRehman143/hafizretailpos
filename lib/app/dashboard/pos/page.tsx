"use client";

import { useMemo, useState } from "react";
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
};

type CartProduct = Product & {
  quantity: number;
};

const products: Product[] = [
  {
    id: 1,
    name: "Washing Machine",
    category: "Appliances",
    price: 45000,
    stock: 8,
    icon: "🧺",
  },
  {
    id: 2,
    name: "Air Cooler",
    category: "Appliances",
    price: 18500,
    stock: 12,
    icon: "❄️",
  },
  {
    id: 3,
    name: "Cotton Mattress",
    category: "Bed Items",
    price: 8500,
    stock: 20,
    icon: "🛏️",
  },
  {
    id: 4,
    name: "Charpai",
    category: "Furniture",
    price: 6500,
    stock: 15,
    icon: "🛏️",
  },
  {
    id: 5,
    name: "Bamboo",
    category: "Bamboo",
    price: 1200,
    stock: 35,
    icon: "🎋",
  },
  {
    id: 6,
    name: "Bed Sheet",
    category: "Bed Items",
    price: 2500,
    stock: 25,
    icon: "🛌",
  },
  {
    id: 7,
    name: "Pillow",
    category: "Bed Items",
    price: 1200,
    stock: 40,
    icon: "🛏️",
  },
  {
    id: 8,
    name: "Electric Fan",
    category: "Appliances",
    price: 6500,
    stock: 18,
    icon: "🌀",
  },
];

const categories = [
  "All",
  "Appliances",
  "Furniture",
  "Bed Items",
  "Bamboo",
];

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartProduct[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

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
  }, [search, category]);

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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Point of Sale
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create a new customer sale
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          disabled={cart.length === 0}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear Cart
        </button>

      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">

        {/* PRODUCTS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

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
          <div className="mb-6 flex gap-2 overflow-x-auto">

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
          {filteredProducts.length === 0 ? (

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
              <div className="max-h-107.5 overflow-y-auto p-4">

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
                >
                  ←
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