"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";

import * as XLSX from "xlsx";

import type {
  Category,
  Subcategory,
} from "./productTypes";

type Props = {
  open: boolean;
  categories: Category[];
  subcategories: Subcategory[];
  onClose: () => void;
  onComplete: () => Promise<void>;
};

type ExcelRow = {
  name: string;
  barcode: string;
  category: string;
  subcategory: string;
  type: "quantity" | "weight" | "size";
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  weightEntries: string;
  size: string;
  material: string;
  brand: string;
  model: string;
  quality: string;
  color: string;
};

type ImportResult = {
  success: number;
  failed: number;
  errors: string[];
};

function text(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function number(
  value: unknown
) {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function normalizeType(
  value: unknown
): ExcelRow["type"] {
  const type =
    text(value)
      .toLowerCase();

  if (
    type === "weight" ||
    type === "size"
  ) {
    return type;
  }

  return "quantity";
}

function normalizeHeader(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export default function ImportProductsModal({
  open,
  categories,
  subcategories,
  onClose,
  onComplete,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    rows,
    setRows,
  ] = useState<ExcelRow[]>([]);

  const [
    fileName,
    setFileName,
  ] = useState("");

  const [
    importing,
    setImporting,
  ] = useState(false);

  const [
    result,
    setResult,
  ] = useState<ImportResult | null>(
    null
  );

  const preview =
    useMemo(
      () =>
        rows.slice(
          0,
          10
        ),
      [rows]
    );

  if (!open) {
    return null;
  }

  function reset() {
    setRows([]);
    setFileName("");
    setResult(null);

    if (inputRef.current) {
      inputRef.current.value =
        "";
    }
  }

  function close() {
    if (importing) {
      return;
    }

    reset();
    onClose();
  }

  async function readFile(
    file: File
  ) {
    setResult(null);

    const buffer =
      await file.arrayBuffer();

    const workbook =
      XLSX.read(
        buffer,
        {
          type: "array",
        }
      );

    const firstSheetName =
      workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error(
        "Excel file has no sheet."
      );
    }

    const sheet =
      workbook.Sheets[
        firstSheetName
      ];

    const rawRows =
      XLSX.utils.sheet_to_json<
        Record<string, unknown>
      >(sheet, {
        defval: "",
      });

    const normalized =
      rawRows.map(
        (raw) => {
          const values =
            new Map<
              string,
              unknown
            >();

          Object.entries(
            raw
          ).forEach(
            ([
              key,
              value,
            ]) => {
              values.set(
                normalizeHeader(
                  key
                ),
                value
              );
            }
          );

          const get = (
            ...keys: string[]
          ) => {
            for (
              const key of keys
            ) {
              const value =
                values.get(
                  normalizeHeader(
                    key
                  )
                );

              if (
                value !==
                undefined
              ) {
                return value;
              }
            }

            return "";
          };

          const type =
            normalizeType(
              get(
                "type",
                "producttype"
              )
            );

          return {
            name:
              text(
                get(
                  "name",
                  "productname"
                )
              ),

            barcode:
              text(
                get(
                  "barcode",
                  "barcodeno",
                  "barcode number"
                )
              ),

            category:
              text(
                get(
                  "category",
                  "categoryname"
                )
              ),

            subcategory:
              text(
                get(
                  "subcategory",
                  "subcategoryname"
                )
              ),

            type,

            unit:
              type === "weight"
                ? "KG"
                : text(
                    get(
                      "unit"
                    )
                  ) ||
                  "PCS",

            purchasePrice:
              Math.max(
                0,
                number(
                  get(
                    "purchaseprice",
                    "purchase price"
                  )
                )
              ),

            sellingPrice:
              Math.max(
                0,
                number(
                  get(
                    "sellingprice",
                    "selling price",
                    "saleprice"
                  )
                )
              ),

            quantity:
              type === "weight"
                ? 0
                : Math.max(
                    0,
                    number(
                      get(
                        "quantity",
                        "qty"
                      )
                    )
                  ),

            weightEntries:
              type === "weight"
                ? text(
                    get(
                      "weightentries",
                      "weights",
                      "bundleweights"
                    )
                  )
                : "",

            size:
              text(
                get(
                  "size"
                )
              ),

            material:
              text(
                get(
                  "material"
                )
              ),

            brand:
              text(
                get(
                  "brand"
                )
              ),

            model:
              text(
                get(
                  "model"
                )
              ),

            quality:
              text(
                get(
                  "quality"
                )
              ),

            color:
              text(
                get(
                  "color"
                )
              ),
          };
        }
      )
      .filter(
        (row) =>
          row.name
      );

    if (
      normalized.length === 0
    ) {
      throw new Error(
        "No valid product rows found. Column 'name' is required."
      );
    }

    setRows(
      normalized
    );

    setFileName(
      file.name
    );
  }

  async function handleFile(
    file:
      | File
      | undefined
  ) {
    if (!file) {
      return;
    }

    try {
      await readFile(
        file
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to read Excel file."
      );

      reset();
    }
  }

  function findCategory(
    name: string
  ) {
    const normalized =
      name
        .trim()
        .toLowerCase();

    return categories.find(
      (item) =>
        item.name
          .trim()
          .toLowerCase() ===
        normalized
    );
  }

  function findSubcategory(
    categoryId: number,
    name: string
  ) {
    const normalized =
      name
        .trim()
        .toLowerCase();

    return subcategories.find(
      (item) =>
        item.categoryId ===
          categoryId &&
        item.name
          .trim()
          .toLowerCase() ===
          normalized
    );
  }

  async function importRows() {
    if (
      rows.length === 0 ||
      importing
    ) {
      return;
    }

    try {
      setImporting(true);

      let success = 0;
      let failed = 0;

      const errors:
        string[] = [];

      /*
        IMPORTANT:
        Do not reject an Excel row just because its category
        does not already exist in the Products page.

        /api/products already accepts categoryName and can
        resolve/create the category.

        Existing category/subcategory IDs are still used when
        they are available.
      */

      for (
        let index = 0;
        index <
        rows.length;
        index += 1
      ) {
        const row =
          rows[index];

        const category =
          row.category
            ? findCategory(
                row.category
              )
            : undefined;

        /*
          Subcategory can only be resolved to an existing ID
          when its category already exists locally.

          If category is new, we do not block the product.
          We send the names to the API instead.
        */
        const subcategory =
          category &&
          row.subcategory
            ? findSubcategory(
                category.id,
                row.subcategory
              )
            : undefined;

        try {
          const response =
            await fetch(
              "/api/products",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    ...row,

                    categoryId:
                      category?.id ??
                      null,

                    categoryName:
                      row.category ||
                      category?.name ||
                      "Other",

                    subcategoryId:
                      subcategory?.id ??
                      null,

                    subcategoryName:
                      row.subcategory ||
                      subcategory?.name ||
                      "",

                    openingStockConfirmed:
                      row.type ===
                      "weight"
                        ? Boolean(
                            row.weightEntries
                          )
                        : row.quantity >
                          0,
                  }),
              }
            );

          if (
            !response.ok
          ) {
            const data =
              (await response.json()) as {
                message?: string;
              };

            throw new Error(
              data.message ||
                "Import failed."
            );
          }

          success += 1;
        } catch (error) {
          failed += 1;

          errors.push(
            `Row ${
              index + 2
            }: ${
              error instanceof Error
                ? error.message
                : "Import failed."
            }`
          );
        }
      }

      setResult({
        success,
        failed,
        errors:
          errors.slice(
            0,
            20
          ),
      });

      if (
        success > 0
      ) {
        await onComplete();
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-2 sm:p-4">

      <div className="max-h-[96vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl">

        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 sm:items-center sm:px-6 sm:py-5">

          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Import Products
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Select an Excel .xlsx or .xls file.
            </p>
          </div>

          <button
            type="button"
            disabled={
              importing
            }
            onClick={
              close
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl hover:bg-slate-200 disabled:opacity-50"
          >
            ×
          </button>

        </div>

        <div className="max-h-[calc(96vh-85px)] overflow-y-auto p-3 sm:p-6">

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            disabled={
              importing
            }
            onChange={(
              event
            ) =>
              void handleFile(
                event.target
                  .files?.[0]
              )
            }
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
          />

          {fileName && (
            <p className="mt-3 break-all text-xs text-slate-500">
              {fileName}
            </p>
          )}

          {rows.length >
            0 && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    Rows
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {
                      rows.length
                    }
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-3">
                          Product
                        </th>
                        <th className="px-3 py-3">
                          Barcode
                        </th>
                        <th className="px-3 py-3">
                          Category
                        </th>
                        <th className="px-3 py-3">
                          Type
                        </th>
                        <th className="px-3 py-3">
                          Qty / Weights
                        </th>
                        <th className="px-3 py-3">
                          Selling
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {preview.map(
                        (
                          row,
                          index
                        ) => (
                          <tr
                            key={`${row.name}-${index}`}
                          >
                            <td className="px-3 py-3 font-semibold">
                              {
                                row.name
                              }
                            </td>

                            <td className="px-3 py-3">
                              {row.barcode ||
                                "-"}
                            </td>

                            <td className="px-3 py-3">
                              {
                                row.category
                              }
                            </td>

                            <td className="px-3 py-3">
                              {
                                row.type
                              }
                            </td>

                            <td className="px-3 py-3">
                              {row.type ===
                              "weight"
                                ? row.weightEntries ||
                                  "-"
                                : row.quantity}
                            </td>

                            <td className="px-3 py-3">
                              Rs.{" "}
                              {row.sellingPrice.toLocaleString(
                                "en-PK"
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {rows.length >
                10 && (
                <p className="mt-2 text-xs text-slate-500">
                  Previewing first
                  10 rows.
                </p>
              )}
            </>
          )}

          {result && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold text-slate-900">
                Import complete
              </p>

              <p className="mt-2 text-sm text-emerald-700">
                Imported:{" "}
                {
                  result.success
                }
              </p>

              <p className="text-sm text-red-600">
                Failed:{" "}
                {
                  result.failed
                }
              </p>

              {result.errors.length >
                0 && (
                <div className="mt-3 max-h-40 overflow-y-auto rounded-xl bg-white p-3 text-xs text-red-600">
                  {result.errors.map(
                    (
                      error,
                      index
                    ) => (
                      <p
                        key={
                          index
                        }
                        className="py-1"
                      >
                        {
                          error
                        }
                      </p>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

            <button
              type="button"
              disabled={
                importing
              }
              onClick={
                close
              }
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Close
            </button>

            <button
              type="button"
              disabled={
                importing ||
                rows.length ===
                  0
              }
              onClick={() =>
                void importRows()
              }
              className="min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing
                ? "Importing..."
                : `Import ${rows.length} Products`}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
