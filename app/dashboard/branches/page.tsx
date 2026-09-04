"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type BranchStatus =
  | "Active"
  | "Inactive";

type Branch = {
  id: number;
  name: string;
  code: string;
  manager: string;
  phone: string;
  address: string;
  status: BranchStatus;
  totalSales: number;
  totalUsers: number;
};

const emptyForm = {
  name: "",
  code: "",
  manager: "",
  phone: "",
  address: "",
  status: "Active" as BranchStatus,
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

function toNumber(
  value: unknown,
  fallback = 0
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function toString(
  value: unknown,
  fallback = ""
) {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return fallback;
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

function normalizeBranch(
  raw: unknown
): Branch | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = toNumber(raw.id);

  if (!id) return null;

  return {
    id,

    name: toString(raw.name),

    code: toString(raw.code),

    manager: toString(
      raw.manager
    ),

    phone: toString(raw.phone),

    address: toString(
      raw.address
    ),

    status:
      raw.status === "Inactive"
        ? "Inactive"
        : "Active",

    totalSales: toNumber(
      raw.totalSales
    ),

    totalUsers: toNumber(
      raw.totalUsers
    ),
  };
}

export default function BranchesPage() {
  const router = useRouter();

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingBranch,
    setEditingBranch,
  ] = useState<Branch | null>(
    null
  );

  const [
    selectedBranch,
    setSelectedBranch,
  ] = useState<Branch | null>(
    null
  );

  const [form, setForm] =
    useState(emptyForm);

  const loadBranches =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/branches",
            {
              cache: "no-store",
            }
          );

        const data =
          await readResponse(
            response
          );

        if (!isRecord(data)) {
          throw new Error(
            "Invalid branches response."
          );
        }

        const raw =
          Array.isArray(
            data.branches
          )
            ? data.branches
            : [];

        setBranches(
          raw
            .map(normalizeBranch)
            .filter(
              (
                branch
              ): branch is Branch =>
                branch !== null
            )
        );
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const filteredBranches =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return branches.filter(
        (branch) => {
          const searchable =
            `${branch.name} ${branch.code} ${branch.manager} ${branch.phone} ${branch.address}`.toLowerCase();

          const matchesSearch =
            !text ||
            searchable.includes(
              text
            );

          const matchesStatus =
            statusFilter === "All" ||
            branch.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      branches,
      search,
      statusFilter,
    ]);

  const activeBranches =
    branches.filter(
      (branch) =>
        branch.status ===
        "Active"
    ).length;

  const inactiveBranches =
    branches.length -
    activeBranches;

  const totalSales =
    branches.reduce(
      (sum, branch) =>
        sum +
        branch.totalSales,
      0
    );

  function formatPrice(
    value: number
  ) {
    return `Rs. ${value.toLocaleString(
      "en-PK"
    )}`;
  }

  function nextCode() {
    const maxNumber =
      branches.reduce(
        (max, branch) => {
          const match =
            branch.code.match(
              /(\d+)$/
            );

          const number = match
            ? Number(match[1])
            : 0;

          return Math.max(
            max,
            number
          );
        },
        0
      );

    return `BR-${String(
      maxNumber + 1
    ).padStart(3, "0")}`;
  }

  function openAddModal() {
    setEditingBranch(null);

    setForm({
      ...emptyForm,
      code: nextCode(),
    });

    setShowModal(true);
  }

  function openEditModal(
    branch: Branch
  ) {
    setEditingBranch(branch);

    setForm({
      name: branch.name,
      code: branch.code,
      manager:
        branch.manager,
      phone: branch.phone,
      address:
        branch.address,
      status: branch.status,
    });

    setShowModal(true);
  }

  async function saveBranch() {
    if (!form.name.trim()) return;

    if (!form.code.trim()) return;

    try {
      setSaving(true);

      const url =
        editingBranch
          ? `/api/branches/${editingBranch.id}`
          : "/api/branches";

      const response =
        await fetch(url, {
          method:
            editingBranch
              ? "PUT"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name:
              form.name.trim(),

            code:
              form.code
                .trim()
                .toUpperCase(),

            manager:
              form.manager.trim(),

            phone:
              form.phone.trim(),

            address:
              form.address.trim(),

            status:
              form.status,
          }),
        });

      await readResponse(response);

      setShowModal(false);
      setEditingBranch(null);

      await loadBranches();
    } catch (error) {
      
    } finally {
      setSaving(false);
    }
  }

  async function deleteBranch(
    branch: Branch
  ) {
    try {
      const response = await fetch(
        `/api/branches/${branch.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        if (
          selectedBranch?.id ===
          branch.id
        ) {
          setSelectedBranch(null);
        }

        await loadBranches();
        return;
      }

      // If the branch cannot be permanently deleted because
      // users/business records are linked to it, archive it
      // by making it inactive instead of showing an error.
      const fallbackResponse = await fetch(
        `/api/branches/${branch.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: branch.name,
            code: branch.code,
            manager: branch.manager,
            phone: branch.phone,
            address: branch.address,
            status: "Inactive",
          }),
        }
      );

      if (!fallbackResponse.ok) {
        return;
      }

      if (
        selectedBranch?.id ===
        branch.id
      ) {
        setSelectedBranch(null);
      }

      await loadBranches();
    } catch {
      // Silent fail:
      // no browser alert, no confirm, no console error overlay.
    }
  }

  async function toggleStatus(
    branch: Branch
  ) {
    try {
      const response =
        await fetch(
          `/api/branches/${branch.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: branch.name,
              code: branch.code,
              manager:
                branch.manager,
              phone: branch.phone,
              address:
                branch.address,

              status:
                branch.status ===
                "Active"
                  ? "Inactive"
                  : "Active",
            }),
          }
        );

      await readResponse(response);

      await loadBranches();
    } catch (error) {
      
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
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
                Branches
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage business branches and locations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <button
              type="button"
              onClick={() => void loadBranches()}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto sm:px-5"
            >
              + Add Branch
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Branches"
            value={String(
              branches.length
            )}
            icon="🏢"
          />

          <StatCard
            title="Active Branches"
            value={String(
              activeBranches
            )}
            icon="✓"
          />

          <StatCard
            title="Inactive Branches"
            value={String(
              inactiveBranches
            )}
            icon="⏸"
          />

          <StatCard
            title="Branch Sales"
            value={formatPrice(
              totalSales
            )}
            icon="💰"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search branch, code, manager or phone..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={
                statusFilter
              }
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

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 text-sm text-slate-500 sm:px-5">
            {loading ? "Loading branches..." : `Showing ${filteredBranches.length} branches`}
          </div>

          {!loading && filteredBranches.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-slate-500 sm:px-5">
              No branches found.
            </div>
          )}

          {!loading && filteredBranches.length > 0 && (
            <div className="divide-y divide-slate-100 lg:hidden">
              {filteredBranches.map((branch) => (
                <div key={branch.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-slate-900">{branch.name}</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">{branch.code}</p>
                    </div>
                    <button type="button" onClick={() => void toggleStatus(branch)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${branch.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {branch.status}
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Manager</p><p className="mt-1 truncate text-sm font-semibold text-slate-700">{branch.manager || "-"}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Phone</p><p className="mt-1 truncate text-sm font-semibold text-slate-700">{branch.phone || "-"}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Users</p><p className="mt-1 text-sm font-bold text-slate-900">{branch.totalUsers}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Sales</p><p className="mt-1 text-sm font-bold text-slate-900">{formatPrice(branch.totalSales)}</p></div>
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Address</p>
                    <p className="mt-1 text-sm text-slate-600">{branch.address || "-"}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setSelectedBranch(branch)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50">View</button>
                    <button type="button" onClick={() => openEditModal(branch)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50">Edit</button>
                    <button type="button" onClick={() => void deleteBranch(branch)} className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-275">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Branch","Manager","Phone","Address","Users","Sales","Status","Actions"].map((heading) => (
                    <th key={heading} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && filteredBranches.map((branch) => (
                  <tr key={branch.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                    <td className="px-5 py-4"><p className="font-bold text-slate-900">{branch.name}</p><p className="text-xs text-slate-500">{branch.code}</p></td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">{branch.manager || "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{branch.phone || "-"}</td>
                    <td className="max-w-65 px-5 py-4 text-sm text-slate-500"><p className="truncate">{branch.address || "-"}</p></td>
                    <td className="px-5 py-4 font-bold text-slate-800">{branch.totalUsers}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">{formatPrice(branch.totalSales)}</td>
                    <td className="px-5 py-4"><button type="button" onClick={() => void toggleStatus(branch)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${branch.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{branch.status}</button></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setSelectedBranch(branch)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold transition hover:bg-slate-50">View</button>
                        <button type="button" onClick={() => openEditModal(branch)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold transition hover:bg-slate-50">Edit</button>
                        <button type="button" onClick={() => void deleteBranch(branch)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <BranchModal
          form={form}
          setForm={setForm}
          editing={
            editingBranch !== null
          }
          saving={saving}
          onClose={() => {
            setShowModal(false);
            setEditingBranch(null);
          }}
          onSave={() =>
            void saveBranch()
          }
        />
      )}

      {selectedBranch && (
        <DetailsModal
          branch={selectedBranch}
          formatPrice={
            formatPrice
          }
          onClose={() =>
            setSelectedBranch(null)
          }
          onEdit={() => {
            const branch =
              selectedBranch;

            setSelectedBranch(null);
            openEditModal(branch);
          }}
        />
      )}
    </div>
  );
}

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

          <p className="mt-2 text-xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function BranchModal({
  form,
  setForm,
  editing,
  saving,
  onClose,
  onSave,
}: {
  form: typeof emptyForm;
  setForm: React.Dispatch<
    React.SetStateAction<
      typeof emptyForm
    >
  >;
  editing: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="mx-auto my-4 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:my-0">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-bold">
            {editing
              ? "Edit Branch"
              : "Add New Branch"}
          </h2>

          <button
            type="button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <Input
            label="Branch Name *"
            value={form.name}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                name: value,
              }))
            }
          />

          <Input
            label="Branch Code *"
            value={form.code}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                code:
                  value.toUpperCase(),
              }))
            }
          />

          <Input
            label="Manager"
            value={form.manager}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                manager: value,
              }))
            }
          />

          <Input
            label="Phone"
            value={form.phone}
            inputMode="numeric"
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                phone:
                  value.replace(
                    /\D/g,
                    ""
                  ),
              }))
            }
          />

          <div>
            <label className="mb-2 block text-sm font-bold">
              Status
            </label>

            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status:
                    event.target
                      .value as BranchStatus,
                }))
              }
              className="w-full rounded-xl border bg-slate-50 px-4 py-3"
            >
              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-bold">
              Address
            </label>

            <textarea
              value={form.address}
              rows={3}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address:
                    event.target
                      .value,
                }))
              }
              className="w-full rounded-xl border bg-slate-50 px-4 py-3"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t p-4 sm:flex sm:justify-end sm:p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-5 py-3 text-sm font-bold"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editing
              ? "Update Branch"
              : "Create Branch"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  inputMode?:
    | "text"
    | "numeric"
    | "decimal";
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold">
        {label}
      </label>

      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border bg-slate-50 px-4 py-3"
      />
    </div>
  );
}

function DetailsModal({
  branch,
  formatPrice,
  onClose,
  onEdit,
}: {
  branch: Branch;
  formatPrice: (
    value: number
  ) => string;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="mx-auto my-4 w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl sm:my-0 sm:p-6">
        <h2 className="text-xl font-bold">
          {branch.name}
        </h2>

        <p className="text-sm text-slate-500">
          {branch.code}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Detail
            label="Manager"
            value={
              branch.manager || "-"
            }
          />

          <Detail
            label="Phone"
            value={
              branch.phone || "-"
            }
          />

          <Detail
            label="Users"
            value={String(
              branch.totalUsers
            )}
          />

          <Detail
            label="Sales"
            value={formatPrice(
              branch.totalSales
            )}
          />

          <Detail
            label="Status"
            value={branch.status}
          />

          <Detail
            label="Address"
            value={
              branch.address || "-"
            }
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <button
            onClick={onEdit}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
          >
            Edit
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold">
        {value}
      </p>
    </div>
  );
}