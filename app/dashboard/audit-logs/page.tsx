"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type LogStatus =
  | "Success"
  | "Warning"
  | "Failed";

type AuditLog = {
  id: number;
  createdAt: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  description: string;
  status: LogStatus;
  ipAddress: string;
};

type ApiRecord = Record<
  string,
  unknown
>;

function isRecord(
  value: unknown
): value is ApiRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function toString(
  value: unknown
) {
  return typeof value === "string"
    ? value
    : value === null ||
      value === undefined
    ? ""
    : String(value);
}

async function readResponse(
  response: Response
) {
  const text = await response.text();

  let data: unknown = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `Invalid server response (${response.status}).`
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      isRecord(data) &&
        typeof data.message ===
          "string"
        ? data.message
        : `Request failed (${response.status}).`
    );
  }

  return data;
}

function normalizeLog(
  raw: unknown
): AuditLog | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = Number(raw.id);

  if (!id) return null;

  const rawStatus =
    toString(raw.status);

  return {
    id,

    createdAt:
      toString(raw.createdAt),

    userName:
      toString(raw.userName) ||
      "System",

    userRole:
      toString(raw.userRole) ||
      "-",

    action:
      toString(raw.action),

    module:
      toString(raw.module),

    description:
      toString(
        raw.description
      ),

    status:
      rawStatus === "Failed"
        ? "Failed"
        : rawStatus ===
          "Warning"
        ? "Warning"
        : "Success",

    ipAddress:
      toString(
        raw.ipAddress
      ) || "-",
  };
}

function formatDate(
  value: string
) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value || "-";
  }

  return date.toLocaleString(
    "en-PK",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] =
    useState<AuditLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [
    moduleFilter,
    setModuleFilter,
  ] = useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    selectedLog,
    setSelectedLog,
  ] = useState<AuditLog | null>(
    null
  );

  const loadLogs =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/audit-logs",
            {
              cache: "no-store",
            }
          );

        const data =
          await readResponse(
            response
          );

        if (!isRecord(data)) {
          return;
        }

        const raw =
          Array.isArray(
            data.logs
          )
            ? data.logs
            : [];

        setLogs(
          raw
            .map(normalizeLog)
            .filter(
              (
                log
              ): log is AuditLog =>
                log !== null
            )
        );
      } catch {} finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const modules =
    useMemo(
      () => [
        "All",
        ...Array.from(
          new Set(
            logs
              .map(
                (log) =>
                  log.module
              )
              .filter(Boolean)
          )
        ),
      ],
      [logs]
    );

  const filteredLogs =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return logs.filter(
        (log) => {
          const matchesSearch =
            !text ||
            `${log.userName} ${log.userRole} ${log.action} ${log.module} ${log.description} ${log.ipAddress}`
              .toLowerCase()
              .includes(text);

          const matchesModule =
            moduleFilter ===
              "All" ||
            log.module ===
              moduleFilter;

          const matchesStatus =
            statusFilter ===
              "All" ||
            log.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesModule &&
            matchesStatus
          );
        }
      );
    }, [
      logs,
      search,
      moduleFilter,
      statusFilter,
    ]);

  async function clearLogs() {

    try {
      const response =
        await fetch(
          "/api/audit-logs",
          {
            method: "DELETE",
          }
        );

      await readResponse(response);

      setLogs([]);
      setSelectedLog(null);
    } catch {}
  }

  const successful =
    logs.filter(
      (log) =>
        log.status ===
        "Success"
    ).length;

  const warnings =
    logs.filter(
      (log) =>
        log.status ===
        "Warning"
    ).length;

  const failed =
    logs.filter(
      (log) =>
        log.status ===
        "Failed"
    ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Back to Dashboard"
              title="Back to Dashboard"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Audit Logs
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Track user activity and system changes
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={logs.length === 0}
            onClick={() => void clearLogs()}
            className="w-full rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600 disabled:opacity-50 sm:w-auto"
          >
            Clear Logs
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Activities"
            value={logs.length}
          />

          <StatCard
            title="Successful"
            value={successful}
          />

          <StatCard
            title="Warnings"
            value={warnings}
          />

          <StatCard
            title="Failed"
            value={failed}
          />
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search user, action or description..."
              className="w-full min-w-0 rounded-xl border bg-slate-50 px-4 py-3"
            />

            <select
              value={
                moduleFilter
              }
              onChange={(event) =>
                setModuleFilter(
                  event.target.value
                )
              }
              className="w-full min-w-0 rounded-xl border bg-slate-50 px-4 py-3"
            >
              {modules.map(
                (module) => (
                  <option
                    key={module}
                    value={module}
                  >
                    {module ===
                    "All"
                      ? "All Modules"
                      : module}
                  </option>
                )
              )}
            </select>

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="w-full min-w-0 rounded-xl border bg-slate-50 px-4 py-3"
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
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No audit logs found.
            </div>
          ) : (
            <>
              {/* MOBILE / TABLET CARDS */}
              <div className="divide-y divide-slate-100 xl:hidden">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-bold text-slate-900">
                          {log.userName}
                        </p>

                        <p className="mt-1 break-words text-xs text-slate-500">
                          {log.userRole}
                        </p>
                      </div>

                      <StatusBadge status={log.status} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">
                          Action
                        </p>
                        <p className="mt-1 break-words text-sm font-bold text-slate-800">
                          {log.action}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">
                          Module
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                          {getModuleIcon(log.module)} {log.module}
                        </p>
                      </div>

                      <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">
                          Date & Time
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Description
                      </p>
                      <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                        {log.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE - NO HORIZONTAL SCROLL */}
              <div className="hidden xl:block">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[15%]" />
                    <col className="w-[14%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                    <col className="w-[27%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                  </colgroup>

                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        "Date & Time",
                        "User",
                        "Action",
                        "Module",
                        "Description",
                        "Status",
                        "View",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-2.5 py-4 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-t hover:bg-slate-50"
                      >
                        <td className="px-2.5 py-4 align-top text-[12px]">
                          <span className="break-words">
                            {formatDate(log.createdAt)}
                          </span>
                        </td>

                        <td className="px-2.5 py-4 align-top">
                          <p className="break-words text-[13px] font-bold text-slate-900">
                            {log.userName}
                          </p>

                          <p className="mt-1 break-words text-[11px] text-slate-500">
                            {log.userRole}
                          </p>
                        </td>

                        <td className="px-2.5 py-4 align-top text-[13px] font-bold">
                          <span className="break-words">
                            {log.action}
                          </span>
                        </td>

                        <td className="px-2.5 py-4 align-top">
                          <span className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold">
                            <span className="break-words">
                              {getModuleIcon(log.module)} {log.module}
                            </span>
                          </span>
                        </td>

                        <td className="px-2.5 py-4 align-top text-[12px] text-slate-500">
                          <p className="break-words">
                            {log.description}
                          </p>
                        </td>

                        <td className="px-2.5 py-4 align-top">
                          <StatusBadge status={log.status} />
                        </td>

                        <td className="px-2.5 py-4 align-top">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="w-full rounded-lg border px-2 py-2 text-[11px] font-bold"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
          <div className="mx-auto my-4 w-full max-w-xl rounded-2xl bg-white shadow-2xl sm:my-0">
            <div className="flex items-center justify-between gap-3 border-b p-4 sm:p-5">
              <div>
                <h2 className="text-xl font-bold">
                  Activity Details
                </h2>

                <p className="text-xs text-slate-500">
                  Log #
                  {selectedLog.id}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedLog(null)
                }
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              <Detail
                label="Date & Time"
                value={formatDate(
                  selectedLog.createdAt
                )}
              />

              <Detail
                label="User"
                value={
                  selectedLog.userName
                }
              />

              <Detail
                label="Role"
                value={
                  selectedLog.userRole
                }
              />

              <Detail
                label="Action"
                value={
                  selectedLog.action
                }
              />

              <Detail
                label="Module"
                value={
                  selectedLog.module
                }
              />

              <Detail
                label="IP Address"
                value={
                  selectedLog.ipAddress
                }
              />

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Description
                </p>

                <p className="mt-2 text-sm leading-6">
                  {
                    selectedLog.description
                  }
                </p>
              </div>

              <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span className="text-sm font-semibold">
                  Status
                </span>

                <StatusBadge
                  status={
                    selectedLog.status
                  }
                />
              </div>
            </div>

            <div className="border-t p-4 sm:flex sm:justify-end sm:p-5">
              <button
                onClick={() =>
                  setSelectedLog(null)
                }
                className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white sm:w-auto"
              >
                Close
              </button>
            </div>
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

function StatusBadge({
  status,
}: {
  status: LogStatus;
}) {
  const classes =
    status === "Success"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Warning"
      ? "bg-amber-50 text-amber-700"
      : "bg-red-50 text-red-600";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${classes}`}
    >
      {status}
    </span>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
      <span className="text-xs font-bold uppercase text-slate-400">
        {label}
      </span>

      <span className="break-words text-sm font-bold">
        {value}
      </span>
    </div>
  );
}

function getModuleIcon(
  module: string
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

    case "Supplier":
      return "🚚";

    case "User":
      return "👥";

    case "Branch":
      return "🏢";

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