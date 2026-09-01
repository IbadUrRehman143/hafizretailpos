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
import CategoryManager from "./categoryManager";

import {
  createEmptyProduct,
  type Product,
  type Category,
  type Subcategory,
} from "./productTypes";

import {
  calculateWeights,
  cleanWeightEntries,
  getErrorMessage,
  normalizeCategory,
  normalizeProduct,
  normalizeSubcategory,
} from "./productUtils";

export default function ProductsPage() {
  // ====================================================
  // DATA
  // ====================================================

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    categories,
    setCategories,
  ] = useState<Category[]>([]);

  const [
    subcategories,
    setSubcategories,
  ] = useState<
    Subcategory[]
  >([]);

  // ====================================================
  // LOADING
  // ====================================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    categoryLoading,
    setCategoryLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<
    number | null
  >(null);

  // ====================================================
  // MODALS
  // ====================================================

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    showCategories,
    setShowCategories,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState<
    number | null
  >(null);

  // ====================================================
  // FILTERS
  // ====================================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("Active");

  // ====================================================
  // FORM
  // ====================================================

  const [
    form,
    setForm,
  ] = useState<Product>(
    createEmptyProduct()
  );

  // ====================================================
  // LOAD PRODUCTS
  // ====================================================

  const loadProducts =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/products?status=all",
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
          !Array.isArray(data)
        ) {
          throw new Error(
            "Invalid product response."
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
          "Load products:",
          error
        );
      } finally {
        setLoading(false);
      }
    }, []);

  // ====================================================
  // LOAD CATEGORIES
  // ====================================================

  const loadCategories =
    useCallback(async () => {
      try {
        setCategoryLoading(
          true
        );

        const response =
          await fetch(
            "/api/categories",
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
          !Array.isArray(data)
        ) {
          throw new Error(
            "Invalid category response."
          );
        }

        setCategories(
          data
            .map(
              normalizeCategory
            )
            .filter(
              (
                item
              ): item is Category =>
                item !== null
            )
        );
      } catch (error) {
        console.error(
          "Load categories:",
          error
        );
      } finally {
        setCategoryLoading(
          false
        );
      }
    }, []);

  // ====================================================
  // LOAD SUBCATEGORIES
  // ====================================================

  const loadSubcategories =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            "/api/subcategories",
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
          !Array.isArray(data)
        ) {
          throw new Error(
            "Invalid subcategory response."
          );
        }

        setSubcategories(
          data
            .map(
              normalizeSubcategory
            )
            .filter(
              (
                item
              ): item is Subcategory =>
                item !== null
            )
        );
      } catch (error) {
        console.error(
          "Load subcategories:",
          error
        );
      }
    }, []);

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    void Promise.all([
      loadProducts(),
      loadCategories(),
      loadSubcategories(),
    ]);
  }, [
    loadProducts,
    loadCategories,
    loadSubcategories,
  ]);

  // ====================================================
  // ACTIVE CATEGORIES
  // ====================================================

  const activeCategories =
    useMemo(
      () =>
        categories.filter(
          (item) =>
            item.status ===
            "Active"
        ),
      [categories]
    );

  // ====================================================
  // ACTIVE SUBCATEGORIES
  // ====================================================

  const activeSubcategories =
    useMemo(
      () =>
        subcategories.filter(
          (item) =>
            item.status ===
            "Active"
        ),
      [subcategories]
    );

  // ====================================================
  // FILTER PRODUCTS
  // ====================================================

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
              .includes(text) ||
            product.categoryName
              .toLowerCase()
              .includes(text) ||
            product.subcategoryName
              .toLowerCase()
              .includes(text) ||
            product.brand
              .toLowerCase()
              .includes(text) ||
            product.model
              .toLowerCase()
              .includes(text);

          const matchesCategory =
            categoryFilter ===
              "All" ||
            product.categoryName ===
              categoryFilter;

          const matchesStatus =
            statusFilter ===
              "All" ||
            product.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus
          );
        }
      );
    }, [
      products,
      search,
      categoryFilter,
      statusFilter,
    ]);

  // ====================================================
  // ADD PRODUCT
  // ====================================================

  function openAddProduct() {
    const firstCategory =
      activeCategories[0];

    const firstSubcategory =
      firstCategory
        ? activeSubcategories.find(
            (item) =>
              item.categoryId ===
              firstCategory.id
          )
        : undefined;

    setEditingId(null);

    setForm({
      ...createEmptyProduct(),

      categoryId:
        firstCategory?.id ??
        null,

      categoryName:
        firstCategory?.name ??
        "",

      subcategoryId:
        firstSubcategory?.id ??
        null,

      subcategoryName:
        firstSubcategory?.name ??
        "",
    });

    setShowForm(true);
  }

  // ====================================================
  // EDIT PRODUCT
  // ====================================================

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

  // ====================================================
  // CLOSE FORM
  // ====================================================

  function closeForm() {
    setShowForm(false);

    setEditingId(null);

    setForm(
      createEmptyProduct()
    );
  }

  // ====================================================
  // SAVE PRODUCT
  // ====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    // ----------------------------------------
    // Product name
    // ----------------------------------------

    if (!form.name.trim()) {
      alert(
        "Product name is required."
      );

      return;
    }

    // ----------------------------------------
    // Category
    // ----------------------------------------

    if (!form.categoryId) {
      alert(
        "Please select a category."
      );

      return;
    }

    const selectedCategory =
      categories.find(
        (item) =>
          item.id ===
          form.categoryId
      );

    if (!selectedCategory) {
      alert(
        "Selected category does not exist."
      );

      return;
    }

    // ----------------------------------------
    // Subcategory
    // ----------------------------------------

    let selectedSubcategory:
      | Subcategory
      | undefined;

    if (
      form.subcategoryId
    ) {
      selectedSubcategory =
        subcategories.find(
          (item) =>
            item.id ===
            form.subcategoryId
        );

      if (
        !selectedSubcategory
      ) {
        alert(
          "Selected subcategory does not exist."
        );

        return;
      }

      if (
        selectedSubcategory.categoryId !==
        form.categoryId
      ) {
        alert(
          "Selected subcategory does not belong to this category."
        );

        return;
      }
    }

    // ----------------------------------------
    // Quantity validation
    // ----------------------------------------

    if (
      form.type !==
      "weight"
    ) {
      const quantity =
        Number(
          form.quantity
        );

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity < 0
      ) {
        alert(
          "Enter valid quantity."
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

    // ----------------------------------------
    // Weight validation
    // ----------------------------------------

    const weight =
      calculateWeights(
        form.weightEntries
      );

    if (
      form.type ===
        "weight" &&
      form.weightEntries.trim()
    ) {
      if (
        weight.quantity ===
          0 ||
        weight.totalWeight <=
          0
      ) {
        alert(
          "Enter valid bundle weights."
        );

        return;
      }
    }

    // ----------------------------------------
    // Opening stock
    // ----------------------------------------

    const openingStockAmount =
      form.type ===
      "weight"
        ? weight.totalWeight
        : Math.max(
            0,
            Number(
              form.quantity
            ) || 0
          );

    let openingStockConfirmed =
      false;

    if (
      editingId === null &&
      openingStockAmount > 0
    ) {
      openingStockConfirmed =
        window.confirm(
          "OPENING STOCK CONFIRMATION\n\n" +
            "You entered stock while creating this product.\n\n" +
            "Press OK only if this stock was already physically present in the shop before entering it into this POS.\n\n" +
            "If this stock came from a supplier/company purchase, press Cancel and enter it from Purchases.\n\n" +
            "This prevents double stock."
        );

      if (
        !openingStockConfirmed
      ) {
        return;
      }
    }

    // ----------------------------------------
    // Payload
    // ----------------------------------------

    const payload = {
      ...form,

      id: undefined,

      openingStockConfirmed,

      name:
        form.name.trim(),

      categoryId:
        selectedCategory.id,

      categoryName:
        selectedCategory.name,

      subcategoryId:
        selectedSubcategory?.id ??
        null,

      subcategoryName:
        selectedSubcategory?.name ??
        "",

      unit:
        form.type ===
        "weight"
          ? "KG"
          : "PCS",

      quantity:
        form.type ===
        "weight"
          ? 0
          : Math.max(
              0,
              Number(
                form.quantity
              ) || 0
            ),

      weightEntries:
        form.type ===
        "weight"
          ? cleanWeightEntries(
              form.weightEntries
            )
          : "",
    };

    try {
      setSaving(true);

      const response =
        await fetch(
          editingId !== null
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
        error instanceof Error
          ? error.message
          : "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  // ====================================================
  // DELETE PRODUCT
  // ====================================================

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
        `Delete "${product.name}"?\n\n` +
          "If this product has business history, it will be archived instead of permanently deleted."
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);

      const response =
        await fetch(
          `/api/products/${id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Delete failed."
        );
      }

      window.alert(
        data.message
      );

      await loadProducts();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Delete failed."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ====================================================
  // RESTORE PRODUCT
  // ====================================================

  async function restoreProduct(
    product: Product
  ) {
    try {
      const response =
        await fetch(
          `/api/products/${product.id}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status:
                  "Active",
              }),
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
        error instanceof Error
          ? error.message
          : "Unable to restore product."
      );
    }
  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Products
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage products, categories,
              subcategories and opening stock.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setShowCategories(
                  true
                )
              }
              className="rounded-xl border bg-white px-5 py-3 text-sm font-semibold"
            >
              Categories & Subcategories
            </button>

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
        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Active Products"
            value={
              products.filter(
                (item) =>
                  item.status ===
                  "Active"
              ).length
            }
          />

          <StatCard
            title="Archived"
            value={
              products.filter(
                (item) =>
                  item.status ===
                  "Archived"
              ).length
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
            title="Subcategories"
            value={
              activeSubcategories.length
            }
          />
        </div>

        {/* FILTERS */}

        <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_auto_auto]">
          <input
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="Search product, category, subcategory, brand..."
            className="rounded-xl border px-4 py-3"
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
            className="rounded-xl border px-4"
          >
            <option value="All">
              All Categories
            </option>

            {categories.map(
              (category) => (
                <option
                  key={
                    category.id
                  }
                  value={
                    category.name
                  }
                >
                  {
                    category.name
                  }
                </option>
              )
            )}
          </select>

          <select
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target
                  .value
              )
            }
            className="rounded-xl border px-4"
          >
            <option value="Active">
              Active
            </option>

            <option value="Archived">
              Archived
            </option>

            <option value="All">
              All Status
            </option>
          </select>
        </div>

        {/* TABLE */}

        <ProductTable
          products={
            filteredProducts
          }
          loading={
            loading
          }
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
          onRestore={(
            product
          ) =>
            void restoreProduct(
              product
            )
          }
        />
      </div>

      {/* PRODUCT MODAL */}

      <ProductModal
        open={
          showForm
        }
        form={form}
        editingId={
          editingId
        }
        saving={
          saving
        }
        categories={
          activeCategories
        }
        subcategories={
          activeSubcategories
        }
        setForm={
          setForm
        }
        onClose={
          closeForm
        }
        onSubmit={
          handleSubmit
        }
      />

      {/* CATEGORY MANAGER */}

      <CategoryManager
        open={
          showCategories
        }
        categories={
          categories
        }
        subcategories={
          subcategories
        }
        loading={
          categoryLoading
        }
        onClose={() =>
          setShowCategories(
            false
          )
        }
        onRefresh={
          async () => {
            await Promise.all([
              loadCategories(),
              loadSubcategories(),
              loadProducts(),
            ]);
          }
        }
      />
    </div>
  );
}

// ======================================================
// STAT CARD
// ======================================================

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