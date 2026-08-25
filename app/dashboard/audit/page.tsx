"use client";

import { useMemo, useState } from "react";

type LogType =
  | "Sale"
  | "Purchase"
  | "Product"
  | "Customer"
  | "User"
  | "Settings"
  | "Return"
  | "Expense";

type LogStatus =
  | "Success"
  | "Warning"
  | "Failed";

type AuditLog = {
  id: number;
  date: string;
  user: string;
  role: string;
  action: string;
  module: LogType;
  description: string;
  status: LogStatus;
  ip: string;
};

const initialLogs: AuditLog[] = [
  {
    id: 1,
    date: "2026-08-25 10:30 AM",
    user: "Admin",
    role: "Administrator",
    action: "Sale Created",
    module: "Sale",
    description:
      "Invoice INV-0001 was created successfully.",
    status: "Success",
    ip: "192.168.1.10",
  },
  {
    id: 2,
    date: "2026-08-25 10:15 AM",
    user: "Muhammad Ali",
    role: "Cashier",
    action: "Product Added",
    module: "Product",
    description:
      "Pedestal Fan was added to products.",
    status: "Success",
    ip: "192.168.1.12",
  },
  {
    id: 3,
    date: "2026-08-25 09:45 AM",
    user: "Admin",
    role: "Administrator",
    action: "Customer Updated",
    module: "Customer",
    description:
      "Customer Muhammad Ali information was updated.",
    status: "Success",
    ip: "192.168.1.10",
  },
  {
    id: 4,
    date: "2026-08-24 05:20 PM",
    user: "Abdul Rehman",
    role: "Manager",
    action: "Return Created",
    module: "Return",
    description:
      "Product return was created for invoice INV-0003.",
    status: "Warning",
    ip: "192.168.1.15",
  },
  {
    id: 5,
    date: "2026-08-24 04:10 PM",
    user: "Admin",
    role: "Administrator",
    action: "Settings Updated",
    module: "Settings",
    description:
      "POS invoice settings were updated.",
    status: "Success",
    ip: "192.168.1.10",
  },
  {
    id: 6,
    date: "2026-08-24 02:30 PM",
    user: "Sajid Khan",
    role: "Cashier",
    action: "Login Failed",
    module: "User",
    description:
      "Invalid password was entered.",
    status: "Failed",
    ip: "192.168.1.20",
  },
  {
    id: 7,
    date: "2026-08-23 01:15 PM",
    user: "Admin",
    role: "Administrator",
    action: "Purchase Created",
    module: "Purchase",
    description:
      "Purchase order PO-0007 was created.",
    status: "Success",
    ip: "192.168.1.10",
  },
  {
    id: 8,
    date: "2026-08-23 11:45 AM",
    user: "Irfan Ahmad",
    role: "Manager",
    action: "Expense Added",
    module: "Expense",
    description:
      "Branch electricity expense was added.",
    status: "Success",
    ip: "192.168.1.18",
  },
];

export default function AuditLogsPage() {
  const [logs, setLogs] =
    useState<AuditLog[]>(initialLogs);

  const [search, setSearch] =
    useState("");

  const [moduleFilter, setModuleFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [selectedLog, setSelectedLog] =
    useState<AuditLog | null>(null);

  const filteredLogs = useMemo(() => {
    const text =
      search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        !text ||
        log.user
          .toLowerCase()
          .includes(text) ||
        log.action
          .toLowerCase()
          .includes(text) ||
        log.description
          .toLowerCase()
          .includes(text) ||
        log.ip
          .toLowerCase()
          .includes(text);

      const matchesModule =
        moduleFilter === "All" ||
        log.module === moduleFilter;

      const matchesStatus =
        statusFilter === "All" ||
        log.status === statusFilter;

      return (
        matchesSearch &&
        matchesModule &&
        matchesStatus
      );
    });
  }, [
    logs,
    search,
    moduleFilter,
    statusFilter,
  ]);

  const totalLogs = logs.length;

  const successfulLogs = logs.filter(
    (log) => log.status === "Success"
  ).length;

  const warningLogs = logs.filter(
    (log) => log.status === "Warning"
  ).length;

  const failedLogs = logs.filter(
    (log) => log.status === "Failed"
  ).length;

  function clearLogs() {
    const confirmed =
      window.confirm(
        "Are you sure you want to clear all audit logs?"
      );

    if (!confirmed) return;

    setLogs([]);
    setSelectedLog(null);
  }

  function clearFilters() {
    setSearch("");
    setModuleFilter("All");
    setStatusFilter("All");
  }

  function getModuleIcon(
    module: LogType
  ) {
    switch (module) {
      case "Sale":
        return "🛒";

      case "Purchase":
        return "📦";

      case "Product":
        return "🏷️";

      case "Customer":
        return "👤";

      case "User":
        return "👥";

      case "Settings":
        return "⚙️";

      case "Return":
        return "↩️";

      case "Expense":
        return "💰";

      default:
        return "📋";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Audit Logs
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track user activity and system changes
            </p>
          </div>

          <button
            type="button"
            onClick={clearLogs}
            className="rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-100"
          >
            Clear Logs
          </button>

        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Activities"
            value={String(totalLogs)}
            icon="📋"
          />

          <StatCard
            title="Successful"
            value={String(
              successfulLogs
            )}
            icon="✓"
          />

          <StatCard
            title="Warnings"
            value={String(
              warningLogs
            )}
            icon="⚠️"
          />

          <StatCard
            title="Failed"
            value={String(
              failedLogs
            )}
            icon="✕"
          />

        </div>

        {/* FILTERS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search user, action, description..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={moduleFilter}
              onChange={(event) =>
                setModuleFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">
                All Modules
              </option>

              <option value="Sale">
                Sale
              </option>

              <option value="Purchase">
                Purchase
              </option>

              <option value="Product">
                Product
              </option>

              <option value="Customer">
                Customer
              </option>

              <option value="User">
                User
              </option>

              <option value="Settings">
                Settings
              </option>

              <option value="Return">
                Return
              </option>

              <option value="Expense">
                Expense
              </option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">
                All Status
              </option>

              <option value="Success">
                Success
              </option>

              <option value="Warning">
                Warning
              </option>

              <option value="Failed">
                Failed
              </option>
            </select>

          </div>

          <div className="mt-3 flex items-center justify-between">

            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {filteredLogs.length}
              </span>{" "}
              activities
            </p>

            {(search ||
              moduleFilter !== "All" ||
              statusFilter !== "All") && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </button>
            )}

          </div>

        </div>

        {/* LOG TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-275">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Date & Time
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    User
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Action
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Module
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Description
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredLogs.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center"
                    >
                      <div className="text-4xl">
                        📋
                      </div>

                      <h3 className="mt-3 font-bold text-slate-800">
                        No audit logs found
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(
                    (log) => (
                      <tr
                        key={log.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >

                        {/* DATE */}
                        <td className="px-5 py-4">

                          <p className="text-sm font-semibold text-slate-800">
                            {log.date}
                          </p>

                        </td>

                        {/* USER */}
                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                              {log.user
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {log.user}
                              </p>

                              <p className="text-xs text-slate-500">
                                {log.role}
                              </p>
                            </div>

                          </div>

                        </td>

                        {/* ACTION */}
                        <td className="px-5 py-4">

                          <span className="text-sm font-bold text-slate-800">
                            {log.action}
                          </span>

                        </td>

                        {/* MODULE */}
                        <td className="px-5 py-4">

                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">

                            <span>
                              {getModuleIcon(
                                log.module
                              )}
                            </span>

                            {log.module}

                          </span>

                        </td>

                        {/* DESCRIPTION */}
                        <td className="max-w-87.5 px-5 py-4">

                          <p className="truncate text-sm text-slate-500">
                            {log.description}
                          </p>

                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">

                          <StatusBadge
                            status={
                              log.status
                            }
                          />

                        </td>

                        {/* VIEW */}
                        <td className="px-5 py-4">

                          <div className="flex justify-end">

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedLog(
                                  log
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                              View
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* DETAILS MODAL */}
      {selectedLog && (
        <LogDetailsModal
          log={selectedLog}
          getModuleIcon={
            getModuleIcon
          }
          onClose={() =>
            setSelectedLog(null)
          }
        />
      )}

    </div>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({
  status,
}: {
  status: LogStatus;
}) {
  const styles =
    status === "Success"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Warning"
      ? "bg-amber-50 text-amber-700"
      : "bg-red-50 text-red-600";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${styles}`}
    >
      {status}
    </span>
  );
}

/* =====================================================
   DETAILS MODAL
===================================================== */

function LogDetailsModal({
  log,
  getModuleIcon,
  onClose,
}: {
  log: AuditLog;
  getModuleIcon: (
    module: LogType
  ) => string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5 sm:p-6">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
              {getModuleIcon(
                log.module
              )}
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Activity Details
              </h2>

              <p className="text-xs text-slate-500">
                Log #{log.id}
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            ✕
          </button>

        </div>

        {/* CONTENT */}
        <div className="space-y-4 p-5 sm:p-6">

          <DetailRow
            label="Date & Time"
            value={log.date}
          />

          <DetailRow
            label="User"
            value={log.user}
          />

          <DetailRow
            label="Role"
            value={log.role}
          />

          <DetailRow
            label="Action"
            value={log.action}
          />

          <DetailRow
            label="Module"
            value={log.module}
          />

          <DetailRow
            label="IP Address"
            value={log.ip}
          />

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Description
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              {log.description}
            </p>

          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">

            <span className="text-sm font-semibold text-slate-600">
              Status
            </span>

            <StatusBadge
              status={log.status}
            />

          </div>

        </div>

        {/* FOOTER */}
        <div className="flex justify-end border-t border-slate-200 p-5 sm:p-6">

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   DETAIL ROW
===================================================== */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">

      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>

      <span className="text-sm font-bold text-slate-800">
        {value}
      </span>

    </div>
  );
}