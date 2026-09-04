"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Upload,
} from "lucide-react";

import ProductTable from "./productTable";
import ProductModal from "./productModal";
import CategoryManager from "./categoryManager";
import ImportProductsModal from "./importProductsModal";

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
  const router =
    useRouter();

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
    showImport,
    setShowImport,
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
            product.barcode
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
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-slate-50 px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6">
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-4 sm:space-y-5 lg:space-y-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

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
                Products
              </h1>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Manage products, categories,
                subcategories and opening stock.
              </p>
            </div>

          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto">

            <button
              type="button"
              onClick={() =>
                setShowImport(
                  true
                )
              }
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:w-auto"
            >
              <Upload size={17} />
              Import Excel
            </button>

            <button
              type="button"
              onClick={() =>
                setShowCategories(
                  true
                )
              }
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:w-auto"
            >
              Categories & Subcategories
            </button>

            <button
              type="button"
              onClick={
                openAddProduct
              }
              className="min-h-11 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 lg:w-auto"
            >
              + Add Product
            </button>
          </div>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
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

        <div className="grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
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
            placeholder="Search product, barcode, category, subcategory, brand..."
            className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
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
            className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
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
            className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
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

        <div className="w-full min-w-0 overflow-x-auto">
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

      {/* IMPORT EXCEL */}

      <ImportProductsModal
        open={
          showImport
        }
        categories={
          activeCategories
        }
        subcategories={
          activeSubcategories
        }
        onClose={() =>
          setShowImport(
            false
          )
        }
        onComplete={
          async () => {
            await loadProducts();
          }
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
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5">
      <p className="text-xs leading-5 text-slate-500 sm:text-sm">
        {title}
      </p>

      <p className="mt-1.5 text-xl font-bold text-slate-900 sm:mt-2 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}