"use client";

import type {
  InvoiceItem,
  Product,
} from "./invoiceTypes";

import {
  calculateItemTotal,
  getProductStock,
  getProductUnit,
} from "./InvoiceUtils";

type Props = {
  items: InvoiceItem[];
  products: Product[];

  setItems: React.Dispatch<
    React.SetStateAction<InvoiceItem[]>
  >;

  onAddItem: () => void;
};

export default function InvoiceItems({
  items,
  products,
  setItems,
  onAddItem,
}: Props) {
  function updateItem(
    id: string,
    changes: Partial<InvoiceItem>
  ) {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const updated = {
          ...item,
          ...changes,
        };

        return {
          ...updated,
          total: calculateItemTotal(updated),
        };
      })
    );
  }

  function selectProduct(
    itemId: string,
    productId: string
  ) {
    const id = Number(productId);

    const product = products.find(
      (item) => item.id === id
    );

    if (!product) {
      updateItem(itemId, {
        productId: null,
        name: "",
        price: 0,
        quantity: 1,
        weight: 0,
        discount: 0,
        total: 0,
      });

      return;
    }

    const unit = getProductUnit(product);

    updateItem(itemId, {
      productId: product.id,
      name: product.name,
      type: product.type,
      unit,
      price: Number(product.sellingPrice) || 0,
      quantity: product.type === "weight" ? 0 : 1,
      weight: 0,
      discount: 0,
    });
  }

  function removeItem(id: string) {
    setItems((currentItems) => {
      if (currentItems.length === 1) {
        return currentItems;
      }

      return currentItems.filter(
        (item) => item.id !== id
      );
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-bold text-slate-900">
            Invoice Items
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Select products and enter quantity or weight.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddItem}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          + Add Item
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-275">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <TableHead>Product</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Qty / Weight</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Action</TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const selectedProduct =
                item.productId !== null
                  ? products.find(
                      (product) =>
                        product.id === item.productId
                    )
                  : undefined;

              const stock = selectedProduct
                ? getProductStock(selectedProduct)
                : 0;

              return (
                <tr key={item.id}>
                  {/* PRODUCT */}

                  <td className="min-w-62.5 px-4 py-4">
                    <select
                      value={item.productId ?? ""}
                      onChange={(event) =>
                        selectProduct(
                          item.id,
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">
                        Select Product
                      </option>

                      {products.map((product) => (
                        <option
                          key={product.id}
                          value={product.id}
                        >
                          {product.name}
                        </option>
                      ))}
                    </select>

                    {selectedProduct && (
                      <div className="mt-2 text-xs text-slate-500">
                        {selectedProduct.category}

                        {selectedProduct.brand
                          ? ` • ${selectedProduct.brand}`
                          : ""}
                      </div>
                    )}
                  </td>

                  {/* STOCK */}

                  <td className="px-4 py-4">
                    {selectedProduct ? (
                      <>
                        <div className="font-bold text-slate-900">
                          {selectedProduct.type === "weight"
                            ? stock.toFixed(2)
                            : stock}
                        </div>

                        <div className="text-xs text-slate-500">
                          {getProductUnit(selectedProduct)}
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-400">
                        —
                      </span>
                    )}
                  </td>

                  {/* QUANTITY / WEIGHT */}

                  <td className="min-w-37.5 px-4 py-4">
                    {item.type === "weight" ? (
                      <div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.weight || ""}
                          disabled={!selectedProduct}
                          onChange={(event) =>
                            updateItem(item.id, {
                              weight: Math.max(
                                0,
                                Number(
                                  event.target.value
                                ) || 0
                              ),
                            })
                          }
                          placeholder="KG"
                          className="w-28 rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 disabled:bg-slate-100"
                        />

                        <div className="mt-1 text-xs text-slate-500">
                          KG
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          disabled={!selectedProduct}
                          onChange={(event) =>
                            updateItem(item.id, {
                              quantity: Math.max(
                                1,
                                Number(
                                  event.target.value
                                ) || 1
                              ),
                            })
                          }
                          className="w-28 rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 disabled:bg-slate-100"
                        />

                        <div className="mt-1 text-xs text-slate-500">
                          {item.unit || "PCS"}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* PRICE */}

                  <td className="min-w-35 px-4 py-4">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.price}
                      disabled={!selectedProduct}
                      onChange={(event) =>
                        updateItem(item.id, {
                          price: Math.max(
                            0,
                            Number(
                              event.target.value
                            ) || 0
                          ),
                        })
                      }
                      className="w-32 rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />

                    <div className="mt-1 text-xs text-slate-500">
                      Rs.
                    </div>
                  </td>

                  {/* DISCOUNT */}

                  <td className="min-w-35 px-4 py-4">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.discount}
                      disabled={!selectedProduct}
                      onChange={(event) =>
                        updateItem(item.id, {
                          discount: Math.max(
                            0,
                            Number(
                              event.target.value
                            ) || 0
                          ),
                        })
                      }
                      className="w-32 rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />

                    <div className="mt-1 text-xs text-slate-500">
                      Rs.
                    </div>
                  </td>

                  {/* TOTAL */}

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900">
                      Rs.{" "}
                      {calculateItemTotal(
                        item
                      ).toLocaleString("en-PK", {
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </td>

                  {/* REMOVE */}

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      disabled={items.length === 1}
                      onClick={() =>
                        removeItem(item.id)
                      }
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="border-t border-slate-100 px-5 py-4 text-sm text-amber-700">
          No products loaded. Products will later come from
          PostgreSQL through `/api/products`.
        </div>
      )}
    </section>
  );
}

function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}