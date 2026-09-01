"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  InvoiceOption,
  RefundMethod,
  ReturnFormItem,
  ReturnRecord,
  ReturnStatus,
} from "./returnTypes";

/* =====================================================
   PROPS
===================================================== */

type ReturnModalProps = {
  record: ReturnRecord | null;

  onClose: () => void;

  onSaved: () => Promise<void>;
};

/* =====================================================
   HELPERS
===================================================== */

function parseWeights(
  value: string
) {
  return String(
    value || ""
  )
    .split(/[,+\s]+/)
    .map((item) =>
      Number(
        item.trim()
      )
    )
    .filter(
      (weight) =>
        Number.isFinite(
          weight
        ) &&
        weight > 0
    );
}

function getWeightTotal(
  value: string
) {
  return parseWeights(
    value
  ).reduce(
    (sum, weight) =>
      sum + weight,
    0
  );
}

function money(
  value: number
) {
  return Number(
    value || 0
  ).toLocaleString(
    undefined,
    {
      maximumFractionDigits:
        2,
    }
  );
}

/* =====================================================
   COMPONENT
===================================================== */

export default function ReturnModal({
  record,
  onClose,
  onSaved,
}: ReturnModalProps) {
  /* =====================================================
     STATE
  ===================================================== */

  const [invoices, setInvoices] =
    useState<InvoiceOption[]>([]);

  const [
    completedReturns,
    setCompletedReturns,
  ] = useState<ReturnRecord[]>(
    []
  );

  const [
    loadingInvoices,
    setLoadingInvoices,
  ] = useState(true);

  const [
    invoiceId,
    setInvoiceId,
  ] = useState<number>(
    Number(
      record?.invoiceId ||
        0
    )
  );

  const [
    formItems,
    setFormItems,
  ] = useState<
    ReturnFormItem[]
  >([]);

  const [
    reason,
    setReason,
  ] = useState(
    record?.reason || ""
  );

  const [
    refundAmount,
    setRefundAmount,
  ] = useState(
    record?.refundAmount
      ? String(
          record.refundAmount
        )
      : ""
  );

  const [
    refundMethod,
    setRefundMethod,
  ] =
    useState<RefundMethod>(
      record?.refundMethod ||
        "Cash"
    );

  const [
    status,
    setStatus,
  ] =
    useState<ReturnStatus>(
      record?.status ||
        "Completed"
    );

  const [
    notes,
    setNotes,
  ] = useState(
    record?.notes || ""
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  /* =====================================================
     LOAD INVOICES + RETURNS
  ===================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function loadData() {
      try {
        setLoadingInvoices(
          true
        );

        const [
          invoiceResponse,
          returnResponse,
        ] =
          await Promise.all([
            fetch(
              "/api/invoices?returnOptions=1",
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              "/api/returns",
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        if (
          !invoiceResponse.ok
        ) {
          throw new Error(
            "Unable to load invoices."
          );
        }

        const invoiceData =
          await invoiceResponse.json();

        const invoiceList:
          InvoiceOption[] =
          Array.isArray(
            invoiceData
          )
            ? invoiceData
            : Array.isArray(
                  invoiceData?.invoices
                )
              ? invoiceData.invoices
              : [];

        let returnList:
          ReturnRecord[] =
          [];

        if (
          returnResponse.ok
        ) {
          const returnData =
            await returnResponse.json();

          returnList =
            Array.isArray(
              returnData
            )
              ? returnData
              : Array.isArray(
                    returnData?.returns
                  )
                ? returnData.returns
                : [];
        }

        if (
          cancelled
        ) {
          return;
        }

        setInvoices(
          invoiceList
        );

        setCompletedReturns(
          returnList.filter(
            (item) =>
              item.status ===
              "Completed"
          )
        );
      } catch (
        error
      ) {
        console.error(
          "LOAD RETURN DATA ERROR:",
          error
        );

        if (
          !cancelled
        ) {
          setInvoices([]);
          setCompletedReturns(
            []
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoadingInvoices(
            false
          );
        }
      }
    }

    void loadData();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /* =====================================================
     SELECTED INVOICE
  ===================================================== */

  const invoice =
    useMemo(() => {
      return invoices.find(
        (item) =>
          Number(item.id) ===
          Number(invoiceId)
      );
    }, [
      invoices,
      invoiceId,
    ]);

  /* =====================================================
     CALCULATE PREVIOUS COMPLETED RETURNS
  ===================================================== */

  function getPreviouslyReturned(
    invoiceItemId: number
  ) {
    let total = 0;

    for (
      const returnRecord of completedReturns
    ) {
      for (
        const item of
          returnRecord.items ||
          []
      ) {
        if (
          Number(
            item.invoiceItemId
          ) ===
          Number(
            invoiceItemId
          )
        ) {
          total += Number(
            item.quantity ||
              0
          );
        }
      }
    }

    return total;
  }

  /* =====================================================
     CREATE FORM ITEMS
  ===================================================== */

  function buildFormItems(
    selectedInvoice: InvoiceOption
  ) {
    return (
      selectedInvoice.items ||
      []
    ).map(
      (
        soldItem
      ): ReturnFormItem => {
        const previous =
          getPreviouslyReturned(
            soldItem.id
          );

        const ownExisting =
          record?.items?.find(
            (returnItem) =>
              Number(
                returnItem.invoiceItemId
              ) ===
              Number(
                soldItem.id
              )
          );

        /*
         * Current record is not
         * completed because completed
         * records cannot be edited.
         */

        const available =
          Math.max(
            0,
            Number(
              soldItem.quantity ||
                0
            ) -
              previous
          );

        return {
          invoiceItemId:
            Number(
              soldItem.id
            ),

          productId:
            Number(
              soldItem.productId
            ),

          productName:
            soldItem.productName,

          productType:
            soldItem.productType,

          unit:
            soldItem.unit,

          soldQuantity:
            Number(
              soldItem.quantity ||
                0
            ),

          alreadyReturned:
            previous,

          availableQuantity:
            available,

          rate:
            Number(
              soldItem.rate ||
                0
            ),

          returnQuantity:
            ownExisting
              ? String(
                  ownExisting.quantity
                )
              : "",

          weightEntries:
            ownExisting?.weightEntries ||
            "",
        };
      }
    );
  }

  /* =====================================================
     INITIALIZE EDIT RECORD
  ===================================================== */

  useEffect(() => {
    if (
      !invoice
    ) {
      setFormItems(
        []
      );

      return;
    }

    setFormItems(
      buildFormItems(
        invoice
      )
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    invoice,
    completedReturns,
  ]);

  /* =====================================================
     INVOICE CHANGE
  ===================================================== */

  function handleInvoiceChange(
    value: string
  ) {
    setInvoiceId(
      Number(value)
    );

    setFormItems(
      []
    );

    setRefundAmount(
      ""
    );
  }

  /* =====================================================
     UPDATE RETURN QUANTITY
  ===================================================== */

  function updateReturnQuantity(
    invoiceItemId: number,
    value: string
  ) {
    setFormItems(
      (current) =>
        current.map(
          (item) =>
            item.invoiceItemId ===
            invoiceItemId
              ? {
                  ...item,
                  returnQuantity:
                    value,
                }
              : item
        )
    );
  }

  /* =====================================================
     UPDATE WEIGHT ENTRIES
  ===================================================== */

  function updateWeightEntries(
    invoiceItemId: number,
    value: string
  ) {
    setFormItems(
      (current) =>
        current.map(
          (item) =>
            item.invoiceItemId ===
            invoiceItemId
              ? {
                  ...item,
                  weightEntries:
                    value,
                }
              : item
        )
    );
  }

  /* =====================================================
     ACTIVE RETURN ITEMS
  ===================================================== */

  const activeItems =
    useMemo(() => {
      return formItems.filter(
        (item) => {
          const qty =
            Number(
              item.returnQuantity ||
                0
            );

          return (
            Number.isFinite(
              qty
            ) &&
            qty > 0
          );
        }
      );
    }, [
      formItems,
    ]);

  /* =====================================================
     RETURN TOTAL
  ===================================================== */

  const totalReturnAmount =
    useMemo(() => {
      return activeItems.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.returnQuantity ||
              0
          ) *
            Number(
              item.rate ||
                0
            ),
        0
      );
    }, [
      activeItems,
    ]);

  /* =====================================================
     AUTO REFUND
  ===================================================== */

  useEffect(() => {
    if (
      record
    ) {
      return;
    }

    if (
      totalReturnAmount <=
      0
    ) {
      setRefundAmount(
        ""
      );

      return;
    }

    setRefundAmount(
      String(
        Number(
          totalReturnAmount.toFixed(
            2
          )
        )
      )
    );
  }, [
    totalReturnAmount,
    record,
  ]);

  /* =====================================================
     RETURN CLASSIFICATION
  ===================================================== */

  const returnType =
    useMemo(() => {
      if (
        activeItems.length ===
        0
      ) {
        return "No Items";
      }

      const allAvailableItems =
        formItems.filter(
          (item) =>
            item.availableQuantity >
            0
        );

      const full =
        allAvailableItems.length >
          0 &&
        allAvailableItems.every(
          (item) => {
            const q =
              Number(
                item.returnQuantity ||
                  0
              );

            return (
              Math.abs(
                q -
                  item.availableQuantity
              ) < 0.001
            );
          }
        );

      return full
        ? "Full Invoice Return"
        : "Partial Return";
    }, [
      activeItems,
      formItems,
    ]);

  /* =====================================================
     VALIDATE
  ===================================================== */

  function validate() {
    if (
      !invoice
    ) {
      alert(
        "Please select invoice."
      );

      return false;
    }

    if (
      activeItems.length ===
      0
    ) {
      alert(
        "Enter return quantity for at least one product."
      );

      return false;
    }

    for (
      const item of activeItems
    ) {
      const qty =
        Number(
          item.returnQuantity
        );

      if (
        !Number.isFinite(
          qty
        ) ||
        qty <= 0
      ) {
        alert(
          `Invalid return quantity for ${item.productName}.`
        );

        return false;
      }

      if (
        qty >
        item.availableQuantity
      ) {
        alert(
          `${item.productName}: Maximum returnable is ${item.availableQuantity} ${item.unit}.`
        );

        return false;
      }

      if (
        item.productType !==
          "weight" &&
        !Number.isInteger(
          qty
        )
      ) {
        alert(
          `${item.productName}: Quantity based return must be whole PCS.`
        );

        return false;
      }

      if (
        item.productType ===
          "weight" &&
        status ===
          "Completed"
      ) {
        const weights =
          parseWeights(
            item.weightEntries
          );

        if (
          weights.length ===
          0
        ) {
          alert(
            `${item.productName}: Enter actual returned weight entries.`
          );

          return false;
        }

        const weightTotal =
          getWeightTotal(
            item.weightEntries
          );

        if (
          Math.abs(
            weightTotal -
              qty
          ) >
          0.01
        ) {
          alert(
            `${item.productName}: Weight entries total ${weightTotal} KG but return quantity is ${qty} KG.`
          );

          return false;
        }
      }
    }

    const refund =
      Number(
        refundAmount ||
          0
      );

    if (
      !Number.isFinite(
        refund
      ) ||
      refund < 0
    ) {
      alert(
        "Invalid refund amount."
      );

      return false;
    }

    if (
      refund >
      totalReturnAmount +
        0.01
    ) {
      alert(
        `Refund cannot exceed return value Rs. ${money(
          totalReturnAmount
        )}.`
      );

      return false;
    }

    return true;
  }

  /* =====================================================
     SAVE
  ===================================================== */

  async function save() {
    if (
      !validate()
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      const payload = {
        invoiceId:
          Number(
            invoiceId
          ),

        items:
          activeItems.map(
            (item) => ({
              invoiceItemId:
                item.invoiceItemId,

              quantity:
                Number(
                  item.returnQuantity
                ),

              weightEntries:
                item.productType ===
                "weight"
                  ? item.weightEntries.replace(
                      /\s/g,
                      ""
                    )
                  : "",
            })
          ),

        refundAmount:
          Number(
            refundAmount ||
              0
          ),

        refundMethod,

        reason:
          reason.trim(),

        status,

        notes:
          notes.trim(),
      };

      const response =
        await fetch(
          record
            ? `/api/returns/${record.id}`
            : "/api/returns",
          {
            method: record
              ? "PATCH"
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

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Unable to save return."
        );
      }

      await onSaved();

      onClose();
    } catch (
      error
    ) {
      console.error(
        "SAVE RETURN ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save return."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {record
                ? "Edit Return"
                : "New Return"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Full, partial and multi-item invoice return
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 hover:bg-slate-200"
          >
            ✕
          </button>

        </div>

        <div className="space-y-6 p-5">

          {/* INVOICE */}

          <Field label="Invoice">

            <select
              disabled={
                !!record ||
                loadingInvoices
              }
              value={
                String(
                  invoiceId
                )
              }
              onChange={(
                event
              ) =>
                handleInvoiceChange(
                  event.target
                    .value
                )
              }
              className="return-input cursor-pointer disabled:bg-slate-100"
            >

              <option value="0">

                {loadingInvoices
                  ? "Loading invoices..."
                  : "Select invoice"}

              </option>

              {invoices.map(
                (
                  currentInvoice
                ) => (
                  <option
                    key={
                      currentInvoice.id
                    }
                    value={
                      currentInvoice.id
                    }
                  >
                    {
                      currentInvoice.invoiceNumber
                    }
                    {" — "}
                    {
                      currentInvoice.customerName ||
                        "Walk-in Customer"
                    }
                  </option>
                )
              )}

            </select>

          </Field>

          {/* INVOICE INFO */}

          {invoice && (
            <div className="grid gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-3">

              <Info
                label="Invoice"
                value={
                  invoice.invoiceNumber
                }
              />

              <Info
                label="Customer"
                value={
                  invoice.customerName ||
                  "Walk-in Customer"
                }
              />

              <Info
                label="Phone"
                value={
                  invoice.customerPhone ||
                  "—"
                }
              />

            </div>
          )}

          {/* PRODUCTS */}

          {invoice && (
            <div className="overflow-hidden rounded-2xl border border-slate-200">

              <div className="border-b bg-slate-50 px-5 py-4">

                <h3 className="font-bold text-slate-900">
                  Invoice Products
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Sirf jis saman ka return hai uske Return Qty / KG mein value enter karein.
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1000px]">

                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">

                    <tr>
                      <TableHead>
                        Product
                      </TableHead>

                      <TableHead>
                        Sold
                      </TableHead>

                      <TableHead>
                        Already Returned
                      </TableHead>

                      <TableHead>
                        Available
                      </TableHead>

                      <TableHead>
                        Rate
                      </TableHead>

                      <TableHead>
                        Return Qty / KG
                      </TableHead>

                      <TableHead>
                        Returned Weights
                      </TableHead>

                      <TableHead>
                        Amount
                      </TableHead>
                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {formItems.map(
                      (item) => {
                        const qty =
                          Number(
                            item.returnQuantity ||
                              0
                          );

                        const amount =
                          qty *
                          item.rate;

                        const noStock =
                          item.availableQuantity <=
                          0;

                        return (
                          <tr
                            key={
                              item.invoiceItemId
                            }
                            className={
                              qty > 0
                                ? "bg-emerald-50/40"
                                : ""
                            }
                          >

                            <td className="px-4 py-4">

                              <p className="font-bold text-slate-900">
                                {
                                  item.productName
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  item.productType ===
                                  "weight"
                                    ? "Weight Based"
                                    : "Quantity Based"
                                }
                              </p>

                            </td>

                            <td className="px-4 py-4 font-semibold">
                              {
                                item.soldQuantity
                              }{" "}
                              {
                                item.unit
                              }
                            </td>

                            <td className="px-4 py-4">
                              {
                                item.alreadyReturned
                              }{" "}
                              {
                                item.unit
                              }
                            </td>

                            <td className="px-4 py-4">

                              <span
                                className={
                                  noStock
                                    ? "font-bold text-red-600"
                                    : "font-bold text-emerald-600"
                                }
                              >
                                {
                                  item.availableQuantity
                                }{" "}
                                {
                                  item.unit
                                }
                              </span>

                            </td>

                            <td className="px-4 py-4">
                              Rs.{" "}
                              {money(
                                item.rate
                              )}
                            </td>

                            <td className="px-4 py-4">

                              <input
                                type="number"
                                min="0"
                                max={
                                  item.availableQuantity
                                }
                                step={
                                  item.productType ===
                                  "weight"
                                    ? "0.01"
                                    : "1"
                                }
                                disabled={
                                  noStock
                                }
                                value={
                                  item.returnQuantity
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateReturnQuantity(
                                    item.invoiceItemId,
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="0"
                                className="return-input min-w-32 disabled:bg-slate-100"
                              />

                            </td>

                            <td className="px-4 py-4">

                              {item.productType ===
                              "weight" ? (
                                <div>

                                  <input
                                    type="text"
                                    disabled={
                                      qty <=
                                      0
                                    }
                                    value={
                                      item.weightEntries
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateWeightEntries(
                                        item.invoiceItemId,
                                        event.target
                                          .value
                                      )
                                    }
                                    placeholder="34+20"
                                    className="return-input min-w-40 disabled:bg-slate-100"
                                  />

                                  {item.weightEntries && (
                                    <p className="mt-1 text-xs font-bold text-blue-600">
                                      Total{" "}
                                      {
                                        getWeightTotal(
                                          item.weightEntries
                                        )
                                      }{" "}
                                      KG
                                    </p>
                                  )}

                                </div>
                              ) : (
                                <span className="text-slate-400">
                                  —
                                </span>
                              )}

                            </td>

                            <td className="px-4 py-4 font-bold text-slate-900">
                              Rs.{" "}
                              {money(
                                amount
                              )}
                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          )}

          {/* SUMMARY */}

          {invoice && (
            <div className="grid gap-4 md:grid-cols-3">

              <SummaryCard
                label="Return Type"
                value={
                  returnType
                }
              />

              <SummaryCard
                label="Items Returning"
                value={String(
                  activeItems.length
                )}
              />

              <SummaryCard
                label="Return Value"
                value={`Rs. ${money(
                  totalReturnAmount
                )}`}
                strong
              />

            </div>
          )}

          {/* REFUND */}

          <div className="grid gap-4 sm:grid-cols-2">

            <Field label="Refund Amount">

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  refundAmount
                }
                onChange={(
                  event
                ) =>
                  setRefundAmount(
                    event.target
                      .value
                  )
                }
                className="return-input"
              />

            </Field>

            <Field label="Refund Method">

              <select
                value={
                  refundMethod
                }
                onChange={(
                  event
                ) =>
                  setRefundMethod(
                    event.target
                      .value as RefundMethod
                  )
                }
                className="return-input"
              >

                {[
                  "Cash",
                  "Bank",
                  "Credit",
                  "Other",
                ].map(
                  (method) => (
                    <option
                      key={
                        method
                      }
                      value={
                        method
                      }
                    >
                      {
                        method
                      }
                    </option>
                  )
                )}

              </select>

            </Field>

          </div>

          {/* REASON */}

          <Field label="Reason">

            <input
              value={
                reason
              }
              onChange={(
                event
              ) =>
                setReason(
                  event.target
                    .value
                )
              }
              placeholder="Damaged / Customer changed mind / Wrong item..."
              className="return-input"
            />

          </Field>

          {/* STATUS */}

          <div className="grid gap-4 sm:grid-cols-2">

            <Field label="Status">

              <select
                value={
                  status
                }
                onChange={(
                  event
                ) =>
                  setStatus(
                    event.target
                      .value as ReturnStatus
                  )
                }
                className="return-input"
              >

                {[
                  "Pending",
                  "Approved",
                  "Completed",
                  "Rejected",
                ].map(
                  (
                    currentStatus
                  ) => (
                    <option
                      key={
                        currentStatus
                      }
                    >
                      {
                        currentStatus
                      }
                    </option>
                  )
                )}

              </select>

            </Field>

          </div>

          {/* NOTES */}

          <Field label="Notes">

            <textarea
              rows={
                3
              }
              value={
                notes
              }
              onChange={(
                event
              ) =>
                setNotes(
                  event.target
                    .value
                )
              }
              className="return-input resize-none"
            />

          </Field>

          {/* FOOTER */}

          <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                onClose
              }
              className="rounded-xl border px-5 py-3 font-bold"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                saving ||
                !invoice ||
                activeItems.length ===
                  0
              }
              onClick={() =>
                void save()
              }
              className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >

              {saving
                ? "Saving..."
                : record
                  ? "Update Return"
                  : "Save Return"}

            </button>

          </div>

        </div>

      </div>

      <style jsx global>{`
        .return-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }

        .return-input:focus {
          border-color: #64748b;
          box-shadow: 0 0 0 3px
            rgba(148, 163, 184, 0.15);
        }
      `}</style>

    </div>
  );
}

/* =====================================================
   FIELD
===================================================== */

function Field({
  label,
  children,
}: {
  label: string;

  children:
    React.ReactNode;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      {children}

    </div>
  );
}

/* =====================================================
   INFO
===================================================== */

function Info({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div>

      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}

/* =====================================================
   SUMMARY CARD
===================================================== */

function SummaryCard({
  label,
  value,
  strong = false,
}: {
  label: string;

  value: string;

  strong?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        strong
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >

      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 font-bold ${
          strong
            ? "text-lg text-emerald-800"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>

    </div>
  );
}

/* =====================================================
   TABLE HEAD
===================================================== */

function TableHead({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <th className="px-4 py-3 text-left font-semibold">
      {children}
    </th>
  );
}