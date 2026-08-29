"use client";

import {
  useEffect,
  useMemo,
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

export type Product = {
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

const STORAGE_KEY = "hafiz_products";

const categories = [
  "Cotton",
  "Electronics",
  "Beds",
  "Furniture",
  "Appliances",
  "Bamboo",
  "Bed Items",
  "Other",
];

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Cotton",
    category: "Cotton",
    type: "weight",
    unit: "KG",
    purchasePrice: 180,
    sellingPrice: 220,
    quantity: 0,
    size: "",
    material: "",
    brand: "",
    model: "",
    quality: "Premium",
    color: "",
    bundles: [
      {
        id: 1,
        name: "B-001",
        weight: "82",
      },
      {
        id: 2,
        name: "B-002",
        weight: "115",
      },
      {
        id: 3,
        name: "B-003",
        weight: "67",
      },
    ],
  },

  {
    id: 2,
    name: "Washing Machine",
    category: "Appliances",
    type: "quantity",
    unit: "PCS",
    purchasePrice: 45000,
    sellingPrice: 50000,
    quantity: 5,
    size: "",
    material: "",
    brand: "Dawlance",
    model: "DW-123",
    quality: "A Grade",
    color: "White",
    bundles: [],
  },

  {
    id: 3,
    name: "Pedestal Fan",
    category: "Electronics",
    type: "quantity",
    unit: "PCS",
    purchasePrice: 7000,
    sellingPrice: 8500,
    quantity: 10,
    size: "",
    material: "",
    brand: "Pak Fan",
    model: "PF-01",
    quality: "A Grade",
    color: "Black",
    bundles: [],
  },

  {
    id: 4,
    name: "Charpai 6x3",
    category: "Furniture",
    type: "size",
    unit: "PCS",
    purchasePrice: 5000,
    sellingPrice: 6500,
    quantity: 5,
    size: "6 x 3",
    material: "Wood",
    brand: "",
    model: "",
    quality: "Premium",
    color: "Brown",
    bundles: [],
  },
];

const emptyProduct: Product = {
  id: 0,
  name: "",
  category: "Electronics",
  type: "quantity",
  unit: "PCS",
  purchasePrice: 0,
  sellingPrice: 0,
  quantity: 1,
  size: "",
  material: "",
  brand: "",
  model: "",
  quality: "",
  color: "",
  bundles: [],
};

export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>(initialProducts);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [form, setForm] =
    useState<Product>({
      ...emptyProduct,
      bundles: [],
    });

  /* =========================
     LOAD LOCAL STORAGE
  ========================= */

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (!saved) {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            initialProducts
          )
        );

        return;
      }

      const parsed: unknown =
        JSON.parse(saved);

      if (
        Array.isArray(parsed)
      ) {
        setProducts(
          parsed as Product[]
        );
      }
    } catch (error) {
      console.error(
        "Product load error:",
        error
      );
    }
  }, []);

  /* =========================
     SAVE PRODUCTS
  ========================= */

  function saveProducts(
    nextProducts: Product[]
  ) {
    setProducts(nextProducts);

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          nextProducts
        )
      );
    } catch (error) {
      console.error(
        "Product save error:",
        error
      );
    }
  }

  /* =========================
     TOTAL BUNDLE WEIGHT
  ========================= */

  const totalBundleWeight =
    useMemo(() => {
      return form.bundles.reduce(
        (total, bundle) => {
          return (
            total +
            (Number(
              bundle.weight
            ) || 0)
          );
        },
        0
      );
    }, [form.bundles]);

  /* =========================
     FILTER
  ========================= */

  const filteredProducts =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const matchesSearch =
            !text ||
            product.name
              .toLowerCase()
              .includes(text) ||
            product.category
              .toLowerCase()
              .includes(text) ||
            product.brand
              .toLowerCase()
              .includes(text) ||
            product.model
              .toLowerCase()
              .includes(text) ||
            product.quality
              .toLowerCase()
              .includes(text);

          const matchesCategory =
            categoryFilter ===
              "All" ||
            product.category ===
              categoryFilter;

          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );
    }, [
      products,
      search,
      categoryFilter,
    ]);

  /* =========================
     STATS
  ========================= */

  const totalProducts =
    products.length;

  const weightProducts =
    products.filter(
      (product) =>
        product.type === "weight"
    ).length;

  const quantityProducts =
    products.filter(
      (product) =>
        product.type === "quantity"
    ).length;

  const sizeProducts =
    products.filter(
      (product) =>
        product.type === "size"
    ).length;

  /* =========================
     FORM
  ========================= */

  function resetForm() {
    setForm({
      ...emptyProduct,
      bundles: [],
    });

    setEditingId(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);

    setForm({
      ...emptyProduct,
      bundles: [],
    });
  }

  function handleChange(
    field: keyof Product,
    value: string | number
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* =========================
     TYPE
  ========================= */

  function handleTypeChange(
    type: ProductType
  ) {
    setForm((current) => ({
      ...current,

      type,

      unit:
        type === "weight"
          ? "KG"
          : "PCS",

      quantity:
        type === "weight"
          ? 0
          : current.quantity > 0
          ? current.quantity
          : 1,

      bundles:
        type === "weight"
          ? current.bundles
          : [],
    }));
  }

  /* =========================
     BUNDLES
  ========================= */

  function addBundle() {
    const nextNumber =
      form.bundles.length + 1;

    const newBundle: Bundle = {
      id:
        Date.now() +
        Math.floor(
          Math.random() * 1000
        ),

      name: `B-${String(
        nextNumber
      ).padStart(3, "0")}`,

      weight: "",
    };

    setForm((current) => ({
      ...current,

      bundles: [
        ...current.bundles,
        newBundle,
      ],
    }));
  }

  function updateBundle(
    id: number,
    field:
      | "name"
      | "weight",
    value: string
  ) {
    setForm((current) => ({
      ...current,

      bundles:
        current.bundles.map(
          (bundle) =>
            bundle.id === id
              ? {
                  ...bundle,
                  [field]: value,
                }
              : bundle
        ),
    }));
  }

  function removeBundle(
    id: number
  ) {
    setForm((current) => ({
      ...current,

      bundles:
        current.bundles.filter(
          (bundle) =>
            bundle.id !== id
        ),
    }));
  }

  /* =========================
     SAVE PRODUCT
  ========================= */

  function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      window.alert(
        "Product name is required."
      );

      return;
    }

    if (
      form.purchasePrice < 0 ||
      form.sellingPrice < 0
    ) {
      window.alert(
        "Price cannot be negative."
      );

      return;
    }

    if (
      form.type === "weight"
    ) {
      if (
        form.bundles.length ===
        0
      ) {
        window.alert(
          "Please add at least one bundle."
        );

        return;
      }

      const invalid =
        form.bundles.some(
          (bundle) =>
            Number(
              bundle.weight
            ) <= 0
        );

      if (invalid) {
        window.alert(
          "Every bundle must have valid weight."
        );

        return;
      }
    }

    if (
      form.type !== "weight" &&
      form.quantity < 0
    ) {
      window.alert(
        "Quantity cannot be negative."
      );

      return;
    }

    if (
      editingId !== null
    ) {
      const nextProducts =
        products.map(
          (product) =>
            product.id ===
            editingId
              ? {
                  ...form,
                  id:
                    editingId,
                  name:
                    form.name.trim(),
                }
              : product
        );

      saveProducts(
        nextProducts
      );
    } else {
      const newProduct: Product = {
        ...form,

        id:
          Date.now(),

        name:
          form.name.trim(),
      };

      saveProducts([
        newProduct,
        ...products,
      ]);
    }

    closeForm();
  }

  /* =========================
     EDIT
  ========================= */

  function editProduct(
    product: Product
  ) {
    setEditingId(
      product.id
    );

    setForm({
      ...product,

      bundles:
        product.bundles.map(
          (bundle) => ({
            ...bundle,
          })
        ),
    });

    setShowForm(true);
  }

  /* =========================
     DELETE
  ========================= */

  function deleteProduct(
    id: number
  ) {
    const product =
      products.find(
        (item) =>
          item.id === id
      );

    if (!product) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${product.name}"?`
      );

    if (!confirmed) {
      return;
    }

    saveProducts(
      products.filter(
        (item) =>
          item.id !== id
      )
    );
  }

  /* =========================
     STOCK
  ========================= */

  function getStock(
    product: Product
  ) {
    if (
      product.type ===
      "weight"
    ) {
      return product.bundles.reduce(
        (total, bundle) =>
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

  function formatStock(
    product: Product
  ) {
    const stock =
      getStock(product);

    if (
      product.type ===
      "weight"
    ) {
      return `${stock.toLocaleString(
        "en-PK",
        {
          maximumFractionDigits:
            2,
        }
      )} KG`;
    }

    return `${stock} ${
      product.unit ||
      "PCS"
    }`;
  }

  function formatPrice(
    value: number
  ) {
    return `Rs. ${Number(
      value || 0
    ).toLocaleString(
      "en-PK"
    )}`;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Products
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage products, stock,
              prices and specifications
            </p>

          </div>

          <button
            type="button"
            onClick={
              openAddForm
            }
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            + Add Product
          </button>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">

          <StatCard
            title="Total Products"
            value={
              totalProducts
            }
          />

          <StatCard
            title="Weight Based"
            value={
              weightProducts
            }
          />

          <StatCard
            title="Quantity Based"
            value={
              quantityProducts
            }
          />

          <StatCard
            title="Size Based"
            value={
              sizeProducts
            }
          />

        </div>

        {/* SEARCH */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="grid gap-3 md:grid-cols-[1fr_220px]">

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search product..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />

            <select
              value={
                categoryFilter
              }
              onChange={(
                event
              ) =>
                setCategoryFilter(
                  event.target
                    .value
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >

              <option value="All">
                All Categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {
                      category
                    }
                  </option>
                )
              )}

            </select>

          </div>

        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">

            <p className="text-sm text-slate-500">
              Showing{" "}
              <strong className="text-slate-900">
                {
                  filteredProducts.length
                }
              </strong>{" "}
              products
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-262.5">

              <thead>

                <tr className="border-b border-slate-200 bg-slate-50">

                  <TableHead>
                    Product
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
                    Details
                  </TableHead>

                  <TableHead>
                    Actions
                  </TableHead>

                </tr>

              </thead>

              <tbody>

                {filteredProducts.map(
                  (product) => (

                    <tr
                      key={
                        product.id
                      }
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">

                        <p className="font-bold text-slate-900">
                          {
                            product.name
                          }
                        </p>

                        {(product.brand ||
                          product.model) && (

                          <p className="mt-1 text-xs text-slate-500">

                            {
                              product.brand
                            }

                            {product.brand &&
                            product.model
                              ? " • "
                              : ""}

                            {
                              product.model
                            }

                          </p>

                        )}

                      </td>

                      <td className="px-5 py-4">

                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                          {
                            product.category
                          }
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <TypeBadge
                          type={
                            product.type
                          }
                        />

                      </td>

                      <td className="px-5 py-4">

                        <p className="font-bold">
                          {formatStock(
                            product
                          )}
                        </p>

                        {product.type ===
                          "weight" && (

                          <p className="mt-1 text-xs text-blue-600">
                            {
                              product
                                .bundles
                                .length
                            }{" "}
                            Bundles
                          </p>

                        )}

                      </td>

                      <td className="px-5 py-4 text-sm">
                        {formatPrice(
                          product.purchasePrice
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold">
                        {formatPrice(
                          product.sellingPrice
                        )}
                      </td>

                      <td className="px-5 py-4">

                        <div className="space-y-1 text-xs text-slate-500">

                          {product.quality && (
                            <p>
                              Quality:{" "}
                              {
                                product.quality
                              }
                            </p>
                          )}

                          {product.size && (
                            <p>
                              Size:{" "}
                              {
                                product.size
                              }
                            </p>
                          )}

                          {product.material && (
                            <p>
                              Material:{" "}
                              {
                                product.material
                              }
                            </p>
                          )}

                          {product.color && (
                            <p>
                              Color:{" "}
                              {
                                product.color
                              }
                            </p>
                          )}

                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              editProduct(
                                product
                              )
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteProduct(
                                product.id
                              )
                            }
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* ADD EDIT MODAL */}

      {showForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">

              <div>

                <h2 className="text-xl font-bold">
                  {editingId !==
                  null
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Product information
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100"
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-6 p-5"
            >

              {/* INFORMATION */}

              <section className="rounded-2xl border p-5">

                <h3 className="font-bold">
                  Product Information
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  <Input
                    label="Product Name"
                    value={
                      form.name
                    }
                    required
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "name",
                        value
                      )
                    }
                  />

                  <Select
                    label="Category"
                    value={
                      form.category
                    }
                    options={
                      categories
                    }
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "category",
                        value
                      )
                    }
                  />

                  <Select
                    label="Product Type"
                    value={
                      form.type
                    }
                    options={[
                      "weight",
                      "quantity",
                      "size",
                    ]}
                    labels={{
                      weight:
                        "Weight Based",
                      quantity:
                        "Quantity Based",
                      size:
                        "Size Based",
                    }}
                    onChange={(
                      value
                    ) =>
                      handleTypeChange(
                        value as ProductType
                      )
                    }
                  />

                  <Input
                    label="Unit"
                    value={
                      form.unit
                    }
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "unit",
                        value.toUpperCase()
                      )
                    }
                  />

                  <Input
                    label="Purchase Price"
                    type="number"
                    value={
                      form.purchasePrice
                    }
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "purchasePrice",
                        Number(
                          value
                        )
                      )
                    }
                  />

                  <Input
                    label="Selling Price"
                    type="number"
                    value={
                      form.sellingPrice
                    }
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "sellingPrice",
                        Number(
                          value
                        )
                      )
                    }
                  />

                </div>

              </section>

              {/* SPECIFICATIONS */}

              <section className="rounded-2xl border p-5">

                <h3 className="font-bold">
                  Specifications
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                  <Input
                    label="Brand"
                    value={
                      form.brand
                    }
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "brand",
                        value
                      )
                    }
                  />

                  <Input
                    label="Model"
                    value={
                      form.model
                    }
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "model",
                        value
                      )
                    }
                  />

                  <Input
                    label="Quality"
                    value={
                      form.quality
                    }
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "quality",
                        value
                      )
                    }
                  />

                  <Input
                    label="Size"
                    value={
                      form.size
                    }
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "size",
                        value
                      )
                    }
                  />

                  <Input
                    label="Material"
                    value={
                      form.material
                    }
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "material",
                        value
                      )
                    }
                  />

                  <Input
                    label="Color"
                    value={
                      form.color
                    }
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "color",
                        value
                      )
                    }
                  />

                </div>

              </section>

              {/* QUANTITY */}

              {form.type ===
                "quantity" && (

                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

                  <Input
                    label={`Quantity (${form.unit})`}
                    type="number"
                    value={
                      form.quantity
                    }
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "quantity",
                        Math.max(
                          0,
                          Math.floor(
                            Number(
                              value
                            ) || 0
                          )
                        )
                      )
                    }
                  />

                </section>

              )}

              {/* SIZE */}

              {form.type ===
                "size" && (

                <section className="rounded-2xl border border-purple-200 bg-purple-50 p-5">

                  <div className="grid gap-4 sm:grid-cols-3">

                    <Input
                      label="Size"
                      value={
                        form.size
                      }
                      onChange={(
                        value
                      ) =>
                        handleChange(
                          "size",
                          value
                        )
                      }
                    />

                    <Input
                      label="Material"
                      value={
                        form.material
                      }
                      onChange={(
                        value
                      ) =>
                        handleChange(
                          "material",
                          value
                        )
                      }
                    />

                    <Input
                      label="Quantity"
                      type="number"
                      value={
                        form.quantity
                      }
                      onChange={(
                        value
                      ) =>
                        handleChange(
                          "quantity",
                          Math.max(
                            0,
                            Math.floor(
                              Number(
                                value
                              ) || 0
                            )
                          )
                        )
                      }
                    />

                  </div>

                </section>

              )}

              {/* WEIGHT */}

              {form.type ===
                "weight" && (

                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="font-bold">
                        Bundles
                      </h3>

                      <p className="text-xs text-slate-500">
                        Individual bundle weights
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={
                        addBundle
                      }
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
                    >
                      + Add Bundle
                    </button>

                  </div>

                  <div className="mt-4 space-y-3">

                    {form.bundles.map(
                      (
                        bundle
                      ) => (

                        <div
                          key={
                            bundle.id
                          }
                          className="grid gap-3 rounded-xl bg-white p-3 sm:grid-cols-[1fr_1fr_auto]"
                        >

                          <input
                            value={
                              bundle.name
                            }
                            onChange={(
                              event
                            ) =>
                              updateBundle(
                                bundle.id,
                                "name",
                                event.target
                                  .value
                              )
                            }
                            className="rounded-lg border px-3 py-2"
                          />

                          <input
                            type="number"
                            value={
                              bundle.weight
                            }
                            placeholder="Weight KG"
                            onChange={(
                              event
                            ) =>
                              updateBundle(
                                bundle.id,
                                "weight",
                                event.target
                                  .value
                              )
                            }
                            className="rounded-lg border px-3 py-2"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeBundle(
                                bundle.id
                              )
                            }
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
                          >
                            Remove
                          </button>

                        </div>

                      )
                    )}

                  </div>

                  <div className="mt-4 flex justify-between rounded-xl bg-white p-4">

                    <span className="font-semibold">
                      Total Weight
                    </span>

                    <strong className="text-blue-600">
                      {totalBundleWeight.toFixed(
                        2
                      )}{" "}
                      KG
                    </strong>

                  </div>

                </section>

              )}

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t pt-5">

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  className="rounded-xl border px-5 py-3 font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
                >
                  {editingId !==
                  null
                    ? "Update Product"
                    : "Save Product"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}

function TypeBadge({
  type,
}: {
  type: ProductType;
}) {
  const label =
    type === "weight"
      ? "Weight"
      : type === "quantity"
      ? "Quantity"
      : "Size";

  return (
    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
      {label}
    </span>
  );
}

function TableHead({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
      {children}
    </th>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value:
    | string
    | number;
  onChange: (
    value: string
  ) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-bold">
        {label}
      </span>

      <input
        type={type}
        value={value}
        required={
          required
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
      />

    </label>
  );
}

function Select({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  labels?: Record<
    string,
    string
  >;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-bold">
        {label}
      </span>

      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
      >

        {options.map(
          (option) => (
            <option
              key={
                option
              }
              value={
                option
              }
            >
              {labels?.[
                option
              ] ??
                option}
            </option>
          )
        )}

      </select>

    </label>
  );
}