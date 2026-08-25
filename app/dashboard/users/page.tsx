"use client";

import { useMemo, useState } from "react";

type Role =
  | "Admin"
  | "Manager"
  | "Cashier"
  | "Salesman"
  | "Store Keeper";

type UserStatus = "Active" | "Inactive";

type PermissionKey =
  | "dashboard"
  | "pos"
  | "products"
  | "inventory"
  | "purchases"
  | "sales"
  | "returns"
  | "customers"
  | "suppliers"
  | "expenses"
  | "reports"
  | "users"
  | "branches"
  | "settings";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  branch: string;
  status: UserStatus;
  lastLogin: string;
  permissions: PermissionKey[];
};

const allPermissions: {
  key: PermissionKey;
  label: string;
}[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "pos", label: "POS" },
  { key: "products", label: "Products" },
  { key: "inventory", label: "Inventory" },
  { key: "purchases", label: "Purchases" },
  { key: "sales", label: "Sales" },
  { key: "returns", label: "Returns" },
  { key: "customers", label: "Customers" },
  { key: "suppliers", label: "Suppliers" },
  { key: "expenses", label: "Expenses" },
  { key: "reports", label: "Reports" },
  { key: "users", label: "Users & Roles" },
  { key: "branches", label: "Branches" },
  { key: "settings", label: "Settings" },
];

const roles: Role[] = [
  "Admin",
  "Manager",
  "Cashier",
  "Salesman",
  "Store Keeper",
];

const branches = [
  "Main Branch",
  "Islamabad Market",
  "Shah Market",
  "Sadar Bazar",
];

const initialUsers: User[] = [
  {
    id: 1,
    name: "Ibad Ur Rehman",
    email: "admin@hafizretailpos.com",
    phone: "0300-1111111",
    role: "Admin",
    branch: "Main Branch",
    status: "Active",
    lastLogin: "Today, 06:30 PM",
    permissions: allPermissions.map(
      (permission) => permission.key
    ),
  },
  {
    id: 2,
    name: "Muhammad Ali",
    email: "manager@hafizretailpos.com",
    phone: "0312-2222222",
    role: "Manager",
    branch: "Main Branch",
    status: "Active",
    lastLogin: "Today, 05:45 PM",
    permissions: [
      "dashboard",
      "pos",
      "products",
      "inventory",
      "purchases",
      "sales",
      "returns",
      "customers",
      "suppliers",
      "expenses",
      "reports",
    ],
  },
  {
    id: 3,
    name: "Abdul Rehman",
    email: "cashier@hafizretailpos.com",
    phone: "0321-3333333",
    role: "Cashier",
    branch: "Islamabad Market",
    status: "Active",
    lastLogin: "Today, 04:20 PM",
    permissions: [
      "dashboard",
      "pos",
      "sales",
      "returns",
      "customers",
    ],
  },
  {
    id: 4,
    name: "Sajid Khan",
    email: "store@hafizretailpos.com",
    phone: "0333-4444444",
    role: "Store Keeper",
    branch: "Shah Market",
    status: "Active",
    lastLogin: "Yesterday, 07:10 PM",
    permissions: [
      "dashboard",
      "products",
      "inventory",
      "purchases",
      "suppliers",
    ],
  },
  {
    id: 5,
    name: "Usman Khan",
    email: "sales@hafizretailpos.com",
    phone: "0345-5555555",
    role: "Salesman",
    branch: "Sadar Bazar",
    status: "Inactive",
    lastLogin: "5 days ago",
    permissions: [
      "dashboard",
      "pos",
      "sales",
      "customers",
    ],
  },
];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "Cashier" as Role,
  branch: "Main Branch",
  status: "Active" as UserStatus,
  permissions: [
    "dashboard",
    "pos",
    "sales",
  ] as PermissionKey[],
};

export default function UsersPage() {
  const [users, setUsers] =
    useState<User[]>(initialUsers);

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [showModal, setShowModal] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [form, setForm] =
    useState(emptyForm);

  const filteredUsers = useMemo(() => {
    const text =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !text ||
        user.name
          .toLowerCase()
          .includes(text) ||
        user.email
          .toLowerCase()
          .includes(text) ||
        user.phone
          .toLowerCase()
          .includes(text);

      const matchesRole =
        roleFilter === "All" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" ||
        user.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.status === "Active"
  ).length;

  const inactiveUsers = users.filter(
    (user) => user.status === "Inactive"
  ).length;

  const adminUsers = users.filter(
    (user) => user.role === "Admin"
  ).length;

  function openAddModal() {
    setEditingUser(null);

    setForm({
      ...emptyForm,
      permissions: [
        "dashboard",
        "pos",
        "sales",
      ],
    });

    setShowModal(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);

    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      branch: user.branch,
      status: user.status,
      permissions: [
        ...user.permissions,
      ],
    });

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingUser(null);
  }

  function handleSaveUser() {
    if (!form.name.trim()) {
      window.alert(
        "Please enter user name."
      );
      return;
    }

    if (!form.email.trim()) {
      window.alert(
        "Please enter email."
      );
      return;
    }

    if (!form.phone.trim()) {
      window.alert(
        "Please enter phone number."
      );
      return;
    }

    if (form.permissions.length === 0) {
      window.alert(
        "Please select at least one permission."
      );
      return;
    }

    if (editingUser) {
      setUsers((current) =>
        current.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                role: form.role,
                branch: form.branch,
                status: form.status,
                permissions: form.permissions,
              }
            : user
        )
      );
    } else {
      const newUser: User = {
        id:
          users.length > 0
            ? Math.max(
                ...users.map(
                  (user) => user.id
                )
              ) + 1
            : 1,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        branch: form.branch,
        status: form.status,
        lastLogin: "Never",
        permissions: form.permissions,
      };

      setUsers((current) => [
        newUser,
        ...current,
      ]);
    }

    closeModal();
  }

  function deleteUser(id: number) {
    const user = users.find(
      (item) => item.id === id
    );

    if (!user) return;

    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${user.name}?`
      );

    if (!confirmed) return;

    setUsers((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );

    if (selectedUser?.id === id) {
      setSelectedUser(null);
    }
  }

  function toggleUserStatus(
    user: User
  ) {
    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? {
              ...item,
              status:
                item.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : item
      )
    );
  }

  function togglePermission(
    permission: PermissionKey
  ) {
    setForm((current) => {
      const exists =
        current.permissions.includes(
          permission
        );

      return {
        ...current,
        permissions: exists
          ? current.permissions.filter(
              (item) =>
                item !== permission
            )
          : [
              ...current.permissions,
              permission,
            ],
      };
    });
  }

  function selectAllPermissions() {
    setForm((current) => ({
      ...current,
      permissions: allPermissions.map(
        (permission) => permission.key
      ),
    }));
  }

  function clearPermissions() {
    setForm((current) => ({
      ...current,
      permissions: [],
    }));
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Users & Roles
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage system users, roles and permissions
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95"
          >
            + Add User
          </button>

        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Users"
            value={totalUsers}
            icon="👥"
          />

          <StatCard
            title="Active Users"
            value={activeUsers}
            icon="✓"
          />

          <StatCard
            title="Inactive Users"
            value={inactiveUsers}
            icon="⏸"
          />

          <StatCard
            title="Admin Users"
            value={adminUsers}
            icon="🛡️"
          />

        </div>

        {/* FILTERS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search name, email or phone..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">
                All Roles
              </option>

              {roles.map((role) => (
                <option
                  key={role}
                  value={role}
                >
                  {role}
                </option>
              ))}
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

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>

          </div>

        </div>

        {/* USERS TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">

            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {filteredUsers.length}
              </span>{" "}
              user
              {filteredUsers.length !== 1
                ? "s"
                : ""}
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-275">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    User
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Phone
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Role
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Branch
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Permissions
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Last Login
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

                {filteredUsers.length === 0 ? (

                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >

                      <div className="text-4xl">
                        👥
                      </div>

                      <h3 className="mt-3 font-bold text-slate-800">
                        No users found
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or filters.
                      </p>

                    </td>
                  </tr>

                ) : (

                  filteredUsers.map(
                    (user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >

                        {/* USER */}
                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                              {user.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <p className="font-bold text-slate-900">
                                {user.name}
                              </p>

                              <p className="text-xs text-slate-500">
                                {user.email}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* PHONE */}
                        <td className="px-5 py-4 text-sm font-medium text-slate-700">
                          {user.phone}
                        </td>

                        {/* ROLE */}
                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${getRoleBadge(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>

                        </td>

                        {/* BRANCH */}
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {user.branch}
                        </td>

                        {/* PERMISSIONS */}
                        <td className="px-5 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedUser(
                                user
                              )
                            }
                            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
                          >
                            {
                              user
                                .permissions
                                .length
                            }{" "}
                            Permissions
                          </button>

                        </td>

                        {/* LAST LOGIN */}
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {user.lastLogin}
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              toggleUserStatus(
                                user
                              )
                            }
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              user.status ===
                              "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {user.status}
                          </button>

                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedUser(
                                  user
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
                                  user
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteUser(
                                  user.id
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
        <UserModal
          form={form}
          setForm={setForm}
          editingUser={editingUser}
          onClose={closeModal}
          onSave={handleSaveUser}
          onTogglePermission={
            togglePermission
          }
          onSelectAll={
            selectAllPermissions
          }
          onClearAll={
            clearPermissions
          }
        />
      )}

      {/* VIEW MODAL */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() =>
            setSelectedUser(null)
          }
          onEdit={() => {
            setSelectedUser(null);
            openEditModal(
              selectedUser
            );
          }}
          onDelete={() => {
            deleteUser(
              selectedUser.id
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
  value: number;
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
   USER MODAL
===================================================== */

function UserModal({
  form,
  setForm,
  editingUser,
  onClose,
  onSave,
  onTogglePermission,
  onSelectAll,
  onClearAll,
}: {
  form: typeof emptyForm;
  setForm: React.Dispatch<
    React.SetStateAction<typeof emptyForm>
  >;
  editingUser: User | null;
  onClose: () => void;
  onSave: () => void;
  onTogglePermission: (
    permission: PermissionKey
  ) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5 sm:p-6">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {editingUser
                ? "Edit User"
                : "Add New User"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Set user information, role and permissions
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
        <div className="space-y-6 p-5 sm:p-6">

          {/* BASIC INFO */}
          <div>

            <h3 className="mb-4 font-bold text-slate-900">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <InputField
                label="Full Name"
                value={form.name}
                placeholder="Enter full name"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    name: value,
                  }))
                }
              />

              <InputField
                label="Email"
                type="email"
                value={form.email}
                placeholder="user@example.com"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    email: value,
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
                  Role
                </label>

                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        role: event.target
                          .value as Role,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >
                  {roles.map(
                    (role) => (
                      <option
                        key={role}
                        value={role}
                      >
                        {role}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Branch
                </label>

                <select
                  value={form.branch}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        branch:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >
                  {branches.map(
                    (branch) => (
                      <option
                        key={branch}
                        value={branch}
                      >
                        {branch}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        status:
                          event.target
                            .value as UserStatus,
                      })
                    )
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

            </div>

          </div>

          {/* PERMISSIONS */}
          <div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="font-bold text-slate-900">
                  Permissions
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Select the pages this user can access.
                </p>
              </div>

              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={onSelectAll}
                  className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100"
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={onClearAll}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Clear
                </button>

              </div>

            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

              {allPermissions.map(
                (permission) => {
                  const checked =
                    form.permissions.includes(
                      permission.key
                    );

                  return (
                    <label
                      key={
                        permission.key
                      }
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                        checked
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >

                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          onTogglePermission(
                            permission.key
                          )
                        }
                        className="h-4 w-4 accent-blue-600"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        {permission.label}
                      </span>

                    </label>
                  );
                }
              )}

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Selected:{" "}
              <span className="font-bold text-slate-600">
                {form.permissions.length}
              </span>{" "}
              permissions
            </p>

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
            {editingUser
              ? "Update User"
              : "Create User"}
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
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
      />

    </div>
  );
}

/* =====================================================
   USER DETAILS MODAL
===================================================== */

function UserDetailsModal({
  user,
  onClose,
  onEdit,
  onDelete,
}: {
  user: User;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5 sm:p-6">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-600">
              {user.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                {user.name}
              </h2>

              <p className="text-sm text-slate-500">
                {user.email}
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

        {/* DETAILS */}
        <div className="space-y-5 p-5 sm:p-6">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <DetailBox
              label="Phone"
              value={user.phone}
            />

            <DetailBox
              label="Role"
              value={user.role}
            />

            <DetailBox
              label="Branch"
              value={user.branch}
            />

            <DetailBox
              label="Last Login"
              value={user.lastLogin}
            />

            <DetailBox
              label="Status"
              value={user.status}
            />

            <DetailBox
              label="Permission Count"
              value={`${user.permissions.length} Permissions`}
            />

          </div>

          <div>

            <h3 className="mb-3 font-bold text-slate-900">
              Assigned Permissions
            </h3>

            <div className="flex flex-wrap gap-2">

              {user.permissions.map(
                (permission) => {
                  const found =
                    allPermissions.find(
                      (item) =>
                        item.key ===
                        permission
                    );

                  return (
                    <span
                      key={permission}
                      className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700"
                    >
                      {found?.label ??
                        permission}
                    </span>
                  );
                }
              )}

            </div>

          </div>

        </div>

        {/* FOOTER */}
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
            Edit User
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

/* =====================================================
   ROLE BADGE
===================================================== */

function getRoleBadge(role: Role) {
  switch (role) {
    case "Admin":
      return "bg-purple-50 text-purple-700";

    case "Manager":
      return "bg-blue-50 text-blue-700";

    case "Cashier":
      return "bg-emerald-50 text-emerald-700";

    case "Salesman":
      return "bg-amber-50 text-amber-700";

    case "Store Keeper":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}