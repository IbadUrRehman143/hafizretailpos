"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import ProductTable from "./productTable";
import ProductModal from "./productModal";

import {
  categories,
  createEmptyProduct,
  type Product,
} from "./productTypes";

import {
  calculateWeights,
  getErrorMessage,
  normalizeProduct,
} from "./productUtils";

export default function ProductsPage() {
  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      []
    );

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
    useState<number | null>(
      null
    );

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    editingId,
    setEditingId,
  ] =
    useState<number | null>(
      null
    );

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
    form,
    setForm,
  ] =
    useState<Product>(
      createEmptyProduct()
    );

  const loadProducts =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const response =
            await fetch(
              "/api/products",
              {
                cache:
                  "no-store",
              }
            );

          if (!response.ok) {
            throw new Error(
              await getErrorMessage(
                response
              )
            );
          }

          const data: unknown =
            await response.json();

          if (
            !Array.isArray(
              data
            )
          ) {
            throw new Error(
              "Invalid response."
            );
          }

          setProducts(
            data
              .map(
                normalizeProduct
              )
              .filter(
                (
                  product
                ): product is Product =>
                  product !==
                    null
              )
          );
        } catch (error) {
          console.error(
            error
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const matchesSearch =
            product.name
              .toLowerCase()
              .includes(
                text
              ) ||
            product.category
              .toLowerCase()
              .includes(
                text
              ) ||
            product.brand
              .toLowerCase()
              .includes(
                text
              );

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

  function openAddProduct() {
    setEditingId(null);

    setForm(
      createEmptyProduct()
    );

    setShowForm(true);
  }

  function editProduct(
    product: Product
  ) {
    setEditingId(
      product.id
    );

    setForm({
      ...product,
    });

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);

    setEditingId(null);

    setForm(
      createEmptyProduct()
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert(
        "Product name is required."
      );

      return;
    }

    if (
      form.type ===
      "weight"
    ) {
      const weight =
        calculateWeights(
          form.weightEntries
        );

      if (
        weight.quantity ===
          0 ||
        weight.totalWeight <=
          0
      ) {
        alert(
          "Enter valid weight. Example: 12+13+15+16"
        );

        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        ...form,

        id:
          undefined,

        name:
          form.name.trim(),

        unit:
          form.type ===
          "weight"
            ? "KG"
            : "PCS",

        quantity:
          form.type ===
          "weight"
            ? 0
            : form.quantity,

        weightEntries:
          form.type ===
          "weight"
            ? form.weightEntries.replace(
                /\s/g,
                ""
              )
            : "",
      };

      const response =
        await fetch(
          editingId !==
            null
            ? `/api/products/${editingId}`
            : "/api/products",
          {
            method:
              editingId !==
              null
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response
          )
        );
      }

      closeForm();

      await loadProducts();
    } catch (error) {
      alert(
        error instanceof
          Error
          ? error.message
          : "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(
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

    if (
      !window.confirm(
        `Delete "${product.name}"?`
      )
    ) {
      return;
    }

    try {
      setDeletingId(
        id
      );

      const response =
        await fetch(
          `/api/products/${id}`,
          {
            method:
              "DELETE",
          }
        );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response
          )
        );
      }

      await loadProducts();
    } catch (error) {
      alert(
        error instanceof
          Error
          ? error.message
          : "Delete failed."
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Products
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage products, prices and stock.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openAddProduct
            }
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            + Add Product
          </button>

        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <StatCard
            title="Total Products"
            value={
              products.length
            }
          />

          <StatCard
            title="Weight Products"
            value={
              products.filter(
                (product) =>
                  product.type ===
                  "weight"
              ).length
            }
          />

          <StatCard
            title="Quantity Products"
            value={
              products.filter(
                (product) =>
                  product.type ===
                  "quantity"
              ).length
            }
          />

          <StatCard
            title="Categories"
            value={
              new Set(
                products.map(
                  (product) =>
                    product.category
                )
              ).size
            }
          />

        </div>

        <div className="flex gap-3 rounded-2xl border bg-white p-4">

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search products..."
            className="flex-1 rounded-xl border px-4 py-3"
          />

          <select
            value={
              categoryFilter
            }
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
            className="rounded-xl border px-4"
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
                  {category}
                </option>
              )
            )}

          </select>

        </div>

        <ProductTable
          products={
            filteredProducts
          }
          loading={loading}
          deletingId={
            deletingId
          }
          onEdit={
            editProduct
          }
          onDelete={(id) =>
            void deleteProduct(
              id
            )
          }
        />

      </div>

      <ProductModal
        open={showForm}
        form={form}
        editingId={
          editingId
        }
        saving={saving}
        setForm={setForm}
        onClose={
          closeForm
        }
        onSubmit={
          handleSubmit
        }
      />

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