"use client";

import { useMemo, useState } from "react";

type BranchStatus = "Active" | "Inactive";

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

const initialBranches: Branch[] = [
  {
    id: 1,
    name: "Main Branch",
    code: "BR-001",
    manager: "Muhammad Ali",
    phone: "0300-1234567",
    address: "Main Jahangira Swabi Road",
    status: "Active",
    totalSales: 1850000,
    totalUsers: 8,
  },
  {
    id: 2,
    name: "Islamabad Market",
    code: "BR-002",
    manager: "Abdul Rehman",
    phone: "0312-7654321",
    address: "Islamabad Market",
    status: "Active",
    totalSales: 920000,
    totalUsers: 5,
  },
  {
    id: 3,
    name: "Shah Market",
    code: "BR-003",
    manager: "Sajid Khan",
    phone: "0333-4567890",
    address: "Shah Market",
    status: "Active",
    totalSales: 680000,
    totalUsers: 4,
  },
  {
    id: 4,
    name: "Sadar Bazar",
    code: "BR-004",
    manager: "Irfan Ahmad",
    phone: "0345-9876543",
    address: "Sadar Bazar Road",
    status: "Inactive",
    totalSales: 310000,
    totalUsers: 3,
  },
];

const emptyForm = {
  name: "",
  code: "",
  manager: "",
  phone: "",
  address: "",
  status: "Active" as BranchStatus,
};

export default function BranchesPage() {
  const [branches, setBranches] =
    useState<Branch[]>(initialBranches);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [showModal, setShowModal] =
    useState(false);

  const [editingBranch, setEditingBranch] =
    useState<Branch | null>(null);

  const [selectedBranch, setSelectedBranch] =
    useState<Branch | null>(null);

  const [form, setForm] =
    useState(emptyForm);

  const filteredBranches = useMemo(() => {
    const text = search.trim().toLowerCase();

    return branches.filter((branch) => {
      const matchesSearch =
        !text ||
        branch.name
          .toLowerCase()
          .includes(text) ||
        branch.code
          .toLowerCase()
          .includes(text) ||
        branch.manager
          .toLowerCase()
          .includes(text) ||
        branch.phone
          .toLowerCase()
          .includes(text);

      const matchesStatus =
        statusFilter === "All" ||
        branch.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [branches, search, statusFilter]);

  const totalBranches = branches.length;

  const activeBranches = branches.filter(
    (branch) => branch.status === "Active"
  ).length;

  const inactiveBranches = branches.filter(
    (branch) => branch.status === "Inactive"
  ).length;

  const totalSales = branches.reduce(
    (sum, branch) =>
      sum + branch.totalSales,
    0
  );

  const totalUsers = branches.reduce(
    (sum, branch) =>
      sum + branch.totalUsers,
    0
  );

  function formatPrice(value: number) {
    return `Rs. ${value.toLocaleString(
      "en-PK"
    )}`;
  }

  function openAddModal() {
    setEditingBranch(null);

    setForm({
      ...emptyForm,
      code: `BR-${String(
        branches.length + 1
      ).padStart(3, "0")}`,
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
      manager: branch.manager,
      phone: branch.phone,
      address: branch.address,
      status: branch.status,
    });

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingBranch(null);
  }

  function handleSave() {
    if (!form.name.trim()) {
      window.alert(
        "Please enter branch name."
      );
      return;
    }

    if (!form.code.trim()) {
      window.alert(
        "Please enter branch code."
      );
      return;
    }

    if (!form.manager.trim()) {
      window.alert(
        "Please enter branch manager."
      );
      return;
    }

    if (!form.phone.trim()) {
      window.alert(
        "Please enter branch phone."
      );
      return;
    }

    if (!form.address.trim()) {
      window.alert(
        "Please enter branch address."
      );
      return;
    }

    if (editingBranch) {
      setBranches((current) =>
        current.map((branch) =>
          branch.id ===
          editingBranch.id
            ? {
                ...branch,
                name: form.name.trim(),
                code: form.code.trim(),
                manager:
                  form.manager.trim(),
                phone: form.phone.trim(),
                address:
                  form.address.trim(),
                status: form.status,
              }
            : branch
        )
      );
    } else {
      const newBranch: Branch = {
        id:
          branches.length > 0
            ? Math.max(
                ...branches.map(
                  (branch) =>
                    branch.id
                )
              ) + 1
            : 1,
        name: form.name.trim(),
        code: form.code.trim(),
        manager:
          form.manager.trim(),
        phone: form.phone.trim(),
        address:
          form.address.trim(),
        status: form.status,
        totalSales: 0,
        totalUsers: 0,
      };

      setBranches((current) => [
        newBranch,
        ...current,
      ]);
    }

    closeModal();
  }

  function deleteBranch(id: number) {
    const branch = branches.find(
      (item) => item.id === id
    );

    if (!branch) return;

    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${branch.name}?`
      );

    if (!confirmed) return;

    setBranches((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );

    if (
      selectedBranch?.id === id
    ) {
      setSelectedBranch(null);
    }
  }

  function toggleStatus(
    branch: Branch
  ) {
    setBranches((current) =>
      current.map((item) =>
        item.id === branch.id
          ? {
              ...item,
              status:
                item.status ===
                "Active"
                  ? "Inactive"
                  : "Active",
            }
          : item
      )
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Branches
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your business branches and locations
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95"
          >
            + Add Branch
          </button>

        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Branches"
            value={String(
              totalBranches
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
            title="Total Branch Sales"
            value={formatPrice(
              totalSales
            )}
            icon="💰"
          />

        </div>

        {/* FILTERS */}
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
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

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

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>

          </div>

        </div>

        {/* BRANCH TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">

            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {filteredBranches.length}
              </span>{" "}
              branch
              {filteredBranches.length !==
              1
                ? "es"
                : ""}
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-275">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Branch
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Manager
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Phone
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Address
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Users
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Sales
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredBranches.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <div className="text-4xl">
                        🏢
                      </div>

                      <h3 className="mt-3 font-bold text-slate-800">
                        No branches found
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredBranches.map(
                    (branch) => (
                      <tr
                        key={branch.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >

                        {/* BRANCH */}
                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                              🏢
                            </div>

                            <div>
                              <p className="font-bold text-slate-900">
                                {branch.name}
                              </p>

                              <p className="text-xs font-medium text-slate-500">
                                {branch.code}
                              </p>
                            </div>

                          </div>

                        </td>

                        {/* MANAGER */}
                        <td className="px-5 py-4">

                          <p className="text-sm font-semibold text-slate-800">
                            {branch.manager}
                          </p>

                        </td>

                        {/* PHONE */}
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {branch.phone}
                        </td>

                        {/* ADDRESS */}
                        <td className="max-w-55 px-5 py-4 text-sm text-slate-500">
                          {branch.address}
                        </td>

                        {/* USERS */}
                        <td className="px-5 py-4">

                          <span className="font-bold text-slate-800">
                            {branch.totalUsers}
                          </span>

                        </td>

                        {/* SALES */}
                        <td className="px-5 py-4">

                          <span className="font-bold text-slate-900">
                            {formatPrice(
                              branch.totalSales
                            )}
                          </span>

                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(
                                branch
                              )
                            }
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              branch.status ===
                              "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {branch.status}
                          </button>

                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedBranch(
                                  branch
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  branch
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteBranch(
                                  branch.id
                                )
                              }
                              className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                            >
                              Delete
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

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <BranchModal
          form={form}
          setForm={setForm}
          editingBranch={
            editingBranch
          }
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {/* VIEW MODAL */}
      {selectedBranch && (
        <BranchDetailsModal
          branch={selectedBranch}
          formatPrice={formatPrice}
          onClose={() =>
            setSelectedBranch(null)
          }
          onEdit={() => {
            setSelectedBranch(null);
            openEditModal(
              selectedBranch
            );
          }}
          onDelete={() => {
            deleteBranch(
              selectedBranch.id
            );
          }}
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

          <p className="mt-2 text-xl font-bold text-slate-900">
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
   BRANCH MODAL
===================================================== */

function BranchModal({
  form,
  setForm,
  editingBranch,
  onClose,
  onSave,
}: {
  form: typeof emptyForm;
  setForm: React.Dispatch<
    React.SetStateAction<typeof emptyForm>
  >;
  editingBranch: Branch | null;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5 sm:p-6">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {editingBranch
                ? "Edit Branch"
                : "Add New Branch"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter branch information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            ✕
          </button>

        </div>

        {/* FORM */}
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">

          <InputField
            label="Branch Name"
            value={form.name}
            placeholder="Main Branch"
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                name: value,
              }))
            }
          />

          <InputField
            label="Branch Code"
            value={form.code}
            placeholder="BR-001"
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                code: value,
              }))
            }
          />

          <InputField
            label="Manager"
            value={form.manager}
            placeholder="Manager name"
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                manager: value,
              }))
            }
          />

          <InputField
            label="Phone"
            value={form.phone}
            placeholder="0300-1234567"
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                phone: value,
              }))
            }
          />

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
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

            <label className="mb-2 block text-sm font-bold text-slate-700">
              Address
            </label>

            <textarea
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address:
                    event.target.value,
                }))
              }
              placeholder="Enter branch address"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

          </div>

        </div>

        {/* FOOTER */}
        <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end sm:p-6">

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            {editingBranch
              ? "Update Branch"
              : "Create Branch"}
          </button>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   INPUT
===================================================== */

function InputField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
      />

    </div>
  );
}

/* =====================================================
   DETAILS MODAL
===================================================== */

function BranchDetailsModal({
  branch,
  formatPrice,
  onClose,
  onEdit,
  onDelete,
}: {
  branch: Branch;
  formatPrice: (
    value: number
  ) => string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-200 p-5 sm:p-6">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
              🏢
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                {branch.name}
              </h2>

              <p className="text-sm text-slate-500">
                {branch.code}
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

        <div className="space-y-5 p-5 sm:p-6">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <DetailBox
              label="Manager"
              value={branch.manager}
            />

            <DetailBox
              label="Phone"
              value={branch.phone}
            />

            <DetailBox
              label="Users"
              value={String(
                branch.totalUsers
              )}
            />

            <DetailBox
              label="Total Sales"
              value={formatPrice(
                branch.totalSales
              )}
            />

            <DetailBox
              label="Status"
              value={branch.status}
            />

            <DetailBox
              label="Branch Code"
              value={branch.code}
            />

          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

            <p className="text-xs font-medium text-slate-400">
              ADDRESS
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              {branch.address}
            </p>

          </div>

        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-100"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            Edit Branch
          </button>

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
   DETAIL BOX
===================================================== */

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>

    </div>
  );
}