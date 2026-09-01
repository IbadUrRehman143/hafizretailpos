"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  Category,
  Subcategory,
} from "./productTypes";

import {
  getErrorMessage,
} from "./productUtils";

type Props = {
  open: boolean;

  categories: Category[];

  subcategories: Subcategory[];

  loading: boolean;

  onClose: () => void;

  onRefresh: () => Promise<void>;
};

export default function CategoryManager({
  open,
  categories,
  subcategories,
  loading,
  onClose,
  onRefresh,
}: Props) {
  const [saving, setSaving] =
    useState(false);

  const [
    deletingKey,
    setDeletingKey,
  ] = useState<string | null>(
    null
  );

  const [
    categoryName,
    setCategoryName,
  ] = useState("");

  const [
    categoryDescription,
    setCategoryDescription,
  ] = useState("");

  const [
    categoryStatus,
    setCategoryStatus,
  ] = useState<
    "Active" | "Inactive"
  >("Active");

  const [
    editingCategoryId,
    setEditingCategoryId,
  ] = useState<number | null>(
    null
  );

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] = useState<number | null>(
    null
  );

  const [
    subcategoryName,
    setSubcategoryName,
  ] = useState("");

  const [
    subcategoryDescription,
    setSubcategoryDescription,
  ] = useState("");

  const [
    subcategoryStatus,
    setSubcategoryStatus,
  ] = useState<
    "Active" | "Inactive"
  >("Active");

  const [
    editingSubcategoryId,
    setEditingSubcategoryId,
  ] = useState<number | null>(
    null
  );

  const sortedCategories =
    useMemo(
      () =>
        [...categories].sort(
          (a, b) =>
            a.name.localeCompare(
              b.name
            )
        ),
      [categories]
    );

  if (!open) {
    return null;
  }

  function resetCategoryForm() {
    setEditingCategoryId(
      null
    );

    setCategoryName("");

    setCategoryDescription(
      ""
    );

    setCategoryStatus(
      "Active"
    );
  }

  function resetSubcategoryForm() {
    setEditingSubcategoryId(
      null
    );

    setSubcategoryName("");

    setSubcategoryDescription(
      ""
    );

    setSubcategoryStatus(
      "Active"
    );
  }

  function startEditCategory(
    category: Category
  ) {
    setEditingCategoryId(
      category.id
    );

    setCategoryName(
      category.name
    );

    setCategoryDescription(
      category.description
    );

    setCategoryStatus(
      category.status
    );
  }

  function startEditSubcategory(
    subcategory: Subcategory
  ) {
    setSelectedCategoryId(
      subcategory.categoryId
    );

    setEditingSubcategoryId(
      subcategory.id
    );

    setSubcategoryName(
      subcategory.name
    );

    setSubcategoryDescription(
      subcategory.description
    );

    setSubcategoryStatus(
      subcategory.status
    );
  }

  async function saveCategory() {
    const name =
      categoryName.trim();

    if (!name) {
      alert(
        "Category name is required."
      );

      return;
    }

    try {
      setSaving(true);

      const isEditing =
        editingCategoryId !==
        null;

      const response =
        await fetch(
          isEditing
            ? `/api/categories/${editingCategoryId}`
            : "/api/categories",
          {
            method:
              isEditing
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name,

                description:
                  categoryDescription.trim(),

                status:
                  categoryStatus,
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

      const result =
        await response
          .json()
          .catch(() => null);

      const savedCategory =
        result?.category ??
        result?.data ??
        result;

      if (
        !isEditing &&
        savedCategory?.id
      ) {
        setSelectedCategoryId(
          Number(
            savedCategory.id
          )
        );
      }

      if (
        isEditing &&
        editingCategoryId
      ) {
        setSelectedCategoryId(
          editingCategoryId
        );
      }

      resetCategoryForm();

      await onRefresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(
    category: Category
  ) {
    if (
      category.name
        .trim()
        .toLowerCase() ===
      "other"
    ) {
      alert(
        '"Other" category cannot be deleted.'
      );

      return;
    }

    const children =
      subcategories.filter(
        (item) =>
          item.categoryId ===
          category.id
      );

    const confirmed =
      window.confirm(
        `Delete category "${category.name}"?\n\n` +
          `${children.length} subcategory(s) will also be deleted.\n\n` +
          "Products will NOT be deleted. They will safely move to Other."
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingKey(
        `category-${category.id}`
      );

      const response =
        await fetch(
          `/api/categories/${category.id}`,
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

      if (
        selectedCategoryId ===
        category.id
      ) {
        setSelectedCategoryId(
          null
        );

        resetSubcategoryForm();
      }

      resetCategoryForm();

      await onRefresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete category."
      );
    } finally {
      setDeletingKey(null);
    }
  }

  async function saveSubcategory() {
    if (
      !selectedCategoryId
    ) {
      alert(
        "Please select a category."
      );

      return;
    }

    const name =
      subcategoryName.trim();

    if (!name) {
      alert(
        "Subcategory name is required."
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          editingSubcategoryId !==
          null
            ? `/api/subcategories/${editingSubcategoryId}`
            : "/api/subcategories",
          {
            method:
              editingSubcategoryId !==
              null
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                categoryId:
                  selectedCategoryId,

                name,

                description:
                  subcategoryDescription.trim(),

                status:
                  subcategoryStatus,
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

      resetSubcategoryForm();

      await onRefresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save subcategory."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteSubcategory(
    subcategory: Subcategory
  ) {
    const confirmed =
      window.confirm(
        `Delete subcategory "${subcategory.name}"?\n\n` +
          "Category will remain.\n" +
          "Products will NOT be deleted."
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingKey(
        `subcategory-${subcategory.id}`
      );

      const response =
        await fetch(
          `/api/subcategories/${subcategory.id}`,
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

      if (
        editingSubcategoryId ===
        subcategory.id
      ) {
        resetSubcategoryForm();
      }

      await onRefresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete subcategory."
      );
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-slate-50 shadow-2xl">

        {/* HEADER */}

        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Categories & Subcategories
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage product hierarchy.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl"
          >
            ×
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-2">

          {/* ==========================================
              CATEGORY SIDE
          ========================================== */}

          <section className="rounded-2xl border bg-white p-5">
            <h3 className="text-lg font-bold">
              Categories
            </h3>

            <div className="mt-5 space-y-3">
              <Input
                label="Category Name"
                value={
                  categoryName
                }
                onChange={
                  setCategoryName
                }
                placeholder="Example: Cotton"
              />

              <Input
                label="Description"
                value={
                  categoryDescription
                }
                onChange={
                  setCategoryDescription
                }
                placeholder="Optional"
              />

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Status
                </span>

                <select
                  value={
                    categoryStatus
                  }
                  onChange={(
                    event
                  ) =>
                    setCategoryStatus(
                      event.target
                        .value as
                        | "Active"
                        | "Inactive"
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void saveCategory()
                  }
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {editingCategoryId !==
                  null
                    ? "Update Category"
                    : "+ Add Category"}
                </button>

                {editingCategoryId !==
                  null && (
                  <button
                    type="button"
                    onClick={
                      resetCategoryForm
                    }
                    className="rounded-xl border px-4 py-3 text-sm font-semibold"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 border-t pt-5">
              {loading ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Loading...
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedCategories.map(
                    (category) => {
                      const children =
                        subcategories.filter(
                          (item) =>
                            item.categoryId ===
                            category.id
                        );

                      return (
                        <div
                          key={
                            category.id
                          }
                          className={`rounded-xl border p-4 ${
                            selectedCategoryId ===
                            category.id
                              ? "border-blue-400 bg-blue-50"
                              : "bg-white"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategoryId(
                                category.id
                              );

                              resetSubcategoryForm();
                            }}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-bold text-slate-900">
                                  {
                                    category.name
                                  }
                                </p>

                                <div className="mt-2">
                                  <p className="text-xs font-medium text-slate-500">
                                    {
                                      children.length
                                    }{" "}
                                    subcategories
                                  </p>

                                  {children.length >
                                    0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {[...children]
                                        .sort(
                                          (
                                            a,
                                            b
                                          ) =>
                                            a.name.localeCompare(
                                              b.name
                                            )
                                        )
                                        .map(
                                          (
                                            subcategory
                                          ) => (
                                            <span
                                              key={
                                                subcategory.id
                                              }
                                              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                                                subcategory.status ===
                                                "Active"
                                                  ? "border-blue-100 bg-blue-50 text-blue-700"
                                                  : "border-slate-200 bg-slate-100 text-slate-500"
                                              }`}
                                            >
                                              {
                                                subcategory.name
                                              }
                                            </span>
                                          )
                                        )}
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-xs text-slate-400">
                                      No subcategories
                                    </p>
                                  )}
                                </div>
                              </div>

                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  category.status ===
                                  "Active"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {
                                  category.status
                                }
                              </span>
                            </div>
                          </button>

                          <div className="mt-3 flex gap-2 border-t pt-3">
                            <button
                              type="button"
                              onClick={() =>
                                startEditCategory(
                                  category
                                )
                              }
                              className="rounded-lg border px-3 py-2 text-xs font-semibold"
                            >
                              Edit
                            </button>

                            {category.name
                              .trim()
                              .toLowerCase() !==
                              "other" && (
                              <button
                                type="button"
                                disabled={
                                  deletingKey ===
                                  `category-${category.id}`
                                }
                                onClick={() =>
                                  void deleteCategory(
                                    category
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                              >
                                {deletingKey ===
                                `category-${category.id}`
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ==========================================
              SUBCATEGORY SIDE
          ========================================== */}

          <section className="rounded-2xl border bg-white p-5">
            <h3 className="text-lg font-bold">
              Subcategories
            </h3>

            {!selectedCategoryId ? (
              <div className="mt-5 rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">
                Left side se category
                select karein.
              </div>
            ) : (
              <>
                <div className="mt-2 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700">
                  Category:{" "}
                  {categories.find(
                    (item) =>
                      item.id ===
                      selectedCategoryId
                  )?.name ??
                    "Unknown"}
                </div>

                <div className="mt-5 space-y-3">
                  <Input
                    label="Subcategory Name"
                    value={
                      subcategoryName
                    }
                    onChange={
                      setSubcategoryName
                    }
                    placeholder="Example: PC 1"
                  />

                  <Input
                    label="Description"
                    value={
                      subcategoryDescription
                    }
                    onChange={
                      setSubcategoryDescription
                    }
                    placeholder="Optional"
                  />

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      Status
                    </span>

                    <select
                      value={
                        subcategoryStatus
                      }
                      onChange={(
                        event
                      ) =>
                        setSubcategoryStatus(
                          event.target
                            .value as
                            | "Active"
                            | "Inactive"
                        )
                      }
                      className="w-full rounded-xl border px-4 py-3"
                    >
                      <option value="Active">
                        Active
                      </option>

                      <option value="Inactive">
                        Inactive
                      </option>
                    </select>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        void saveSubcategory()
                      }
                      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {editingSubcategoryId !==
                      null
                        ? "Update Subcategory"
                        : "+ Add Subcategory"}
                    </button>

                    {editingSubcategoryId !==
                      null && (
                      <button
                        type="button"
                        onClick={
                          resetSubcategoryForm
                        }
                        className="rounded-xl border px-4 py-3 text-sm font-semibold"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-y-2 border-t pt-5">
                  {subcategories
                    .filter(
                      (item) =>
                        item.categoryId ===
                        selectedCategoryId
                    )
                    .sort((a, b) =>
                      a.name.localeCompare(
                        b.name
                      )
                    )
                    .map(
                      (
                        subcategory
                      ) => (
                        <div
                          key={
                            subcategory.id
                          }
                          className="rounded-xl border p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-900">
                                {
                                  subcategory.name
                                }
                              </p>

                              {subcategory.description && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    subcategory.description
                                  }
                                </p>
                              )}
                            </div>

                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                subcategory.status ===
                                "Active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {
                                subcategory.status
                              }
                            </span>
                          </div>

                          <div className="mt-3 flex gap-2 border-t pt-3">
                            <button
                              type="button"
                              onClick={() =>
                                startEditSubcategory(
                                  subcategory
                                )
                              }
                              className="rounded-lg border px-3 py-2 text-xs font-semibold"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={
                                deletingKey ===
                                `subcategory-${subcategory.id}`
                              }
                              onClick={() =>
                                void deleteSubcategory(
                                  subcategory
                                )
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                            >
                              {deletingKey ===
                              `subcategory-${subcategory.id}`
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </div>
                      )
                    )}

                  {subcategories.filter(
                    (item) =>
                      item.categoryId ===
                      selectedCategoryId
                  ).length ===
                    0 && (
                    <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
                      No subcategories yet.
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}
      </span>

      <input
        value={value}
        placeholder={
          placeholder
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
      />
    </label>
  );
}