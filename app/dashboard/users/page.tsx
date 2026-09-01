"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type UserStatus =
  | "Active"
  | "Inactive";

type Role = {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  totalUsers: number;
};

type Branch = {
  id: number;
  name: string;
  code: string;
  status: string;
};

type AppUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  roleId: number | null;
  role: string;
  branchId: number | null;
  branch: string;
  status: UserStatus;
  lastLogin: string;
  permissions: string[];
};

const permissionOptions = [
  ["dashboard.view", "Dashboard — View"],
  ["dashboard.create", "Dashboard — Create"],
  ["dashboard.edit", "Dashboard — Edit"],
  ["dashboard.delete", "Dashboard — Delete"],
  ["dashboard.export", "Dashboard — Export"],
  ["pos.view", "POS — View"],
  ["pos.create", "POS — Create"],
  ["pos.edit", "POS — Edit"],
  ["pos.delete", "POS — Delete"],
  ["pos.export", "POS — Export"],
  ["products.view", "Products — View"],
  ["products.create", "Products — Create"],
  ["products.edit", "Products — Edit"],
  ["products.delete", "Products — Delete"],
  ["products.export", "Products — Export"],
  ["inventory.view", "Inventory — View"],
  ["inventory.create", "Inventory — Create"],
  ["inventory.edit", "Inventory — Edit"],
  ["inventory.delete", "Inventory — Delete"],
  ["inventory.export", "Inventory — Export"],
  ["purchases.view", "Purchases — View"],
  ["purchases.create", "Purchases — Create"],
  ["purchases.edit", "Purchases — Edit"],
  ["purchases.delete", "Purchases — Delete"],
  ["purchases.export", "Purchases — Export"],
  ["sales.view", "Sales — View"],
  ["sales.create", "Sales — Create"],
  ["sales.edit", "Sales — Edit"],
  ["sales.delete", "Sales — Delete"],
  ["sales.export", "Sales — Export"],
  ["returns.view", "Returns — View"],
  ["returns.create", "Returns — Create"],
  ["returns.edit", "Returns — Edit"],
  ["returns.delete", "Returns — Delete"],
  ["returns.export", "Returns — Export"],
  ["customers.view", "Customers — View"],
  ["customers.create", "Customers — Create"],
  ["customers.edit", "Customers — Edit"],
  ["customers.delete", "Customers — Delete"],
  ["customers.export", "Customers — Export"],
  ["suppliers.view", "Suppliers — View"],
  ["suppliers.create", "Suppliers — Create"],
  ["suppliers.edit", "Suppliers — Edit"],
  ["suppliers.delete", "Suppliers — Delete"],
  ["suppliers.export", "Suppliers — Export"],
  ["expenses.view", "Expenses — View"],
  ["expenses.create", "Expenses — Create"],
  ["expenses.edit", "Expenses — Edit"],
  ["expenses.delete", "Expenses — Delete"],
  ["expenses.export", "Expenses — Export"],
  ["reports.view", "Reports — View"],
  ["reports.create", "Reports — Create"],
  ["reports.edit", "Reports — Edit"],
  ["reports.delete", "Reports — Delete"],
  ["reports.export", "Reports — Export"],
  ["notifications.view", "Notifications — View"],
  ["notifications.create", "Notifications — Create"],
  ["notifications.edit", "Notifications — Edit"],
  ["notifications.delete", "Notifications — Delete"],
  ["notifications.export", "Notifications — Export"],
  ["users.view", "Users & Roles — View"],
  ["users.create", "Users & Roles — Create"],
  ["users.edit", "Users & Roles — Edit"],
  ["users.delete", "Users & Roles — Delete"],
  ["users.export", "Users & Roles — Export"],
  ["branches.view", "Branches — View"],
  ["branches.create", "Branches — Create"],
  ["branches.edit", "Branches — Edit"],
  ["branches.delete", "Branches — Delete"],
  ["branches.export", "Branches — Export"],
  ["settings.view", "Settings — View"],
  ["settings.create", "Settings — Create"],
  ["settings.edit", "Settings — Edit"],
  ["settings.delete", "Settings — Delete"],
  ["settings.export", "Settings — Export"],
  ["auditLogs.view", "Audit Logs — View"],
  ["auditLogs.create", "Audit Logs — Create"],
  ["auditLogs.edit", "Audit Logs — Edit"],
  ["auditLogs.delete", "Audit Logs — Delete"],
  ["auditLogs.export", "Audit Logs — Export"],
] as const;

const emptyUserForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  roleId: "",
  branchId: "",
  status:
    "Active" as UserStatus,
};

const emptyRoleForm = {
  name: "",
  description: "",
  permissions: [] as string[],
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

function numberValue(
  value: unknown
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function stringValue(
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

function normalizeRole(
  raw: unknown
): Role | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = numberValue(
    raw.id
  );

  if (!id) return null;

  return {
    id,
    name: stringValue(raw.name),
    description:
      stringValue(
        raw.description
      ),
    permissions:
      Array.isArray(
        raw.permissions
      )
        ? raw.permissions.map(
            stringValue
          )
        : [],
    totalUsers:
      numberValue(
        raw.totalUsers
      ),
  };
}

function normalizeBranch(
  raw: unknown
): Branch | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = numberValue(
    raw.id
  );

  if (!id) return null;

  return {
    id,
    name: stringValue(raw.name),
    code: stringValue(raw.code),
    status:
      stringValue(
        raw.status
      ) || "Active",
  };
}

function normalizeUser(
  raw: unknown
): AppUser | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = numberValue(
    raw.id
  );

  if (!id) return null;

  const roleId =
    raw.roleId === null ||
    raw.roleId === undefined
      ? null
      : numberValue(
          raw.roleId
        ) || null;

  const branchId =
    raw.branchId === null ||
    raw.branchId === undefined
      ? null
      : numberValue(
          raw.branchId
        ) || null;

  return {
    id,
    name: stringValue(raw.name),
    email:
      stringValue(raw.email),
    phone:
      stringValue(raw.phone),
    roleId,
    role:
      stringValue(raw.role),
    branchId,
    branch:
      stringValue(raw.branch),
    status:
      raw.status ===
      "Inactive"
        ? "Inactive"
        : "Active",
    lastLogin:
      stringValue(
        raw.lastLogin
      ) || "Never",
    permissions:
      Array.isArray(
        raw.permissions
      )
        ? raw.permissions.map(
            stringValue
          )
        : [],
  };
}

export default function UsersPage() {
  const [users, setUsers] =
    useState<AppUser[]>([]);

  const [roles, setRoles] =
    useState<Role[]>([]);

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [
    roleFilter,
    setRoleFilter,
  ] = useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [tab, setTab] =
    useState<"users" | "roles">(
      "users"
    );

  const [
    showUserModal,
    setShowUserModal,
  ] = useState(false);

  const [
    editingUser,
    setEditingUser,
  ] = useState<AppUser | null>(
    null
  );

  const [
    selectedUser,
    setSelectedUser,
  ] = useState<AppUser | null>(
    null
  );

  const [
    userForm,
    setUserForm,
  ] = useState(emptyUserForm);

  const [
    showRoleModal,
    setShowRoleModal,
  ] = useState(false);

  const [
    editingRole,
    setEditingRole,
  ] = useState<Role | null>(
    null
  );

  const [
    roleForm,
    setRoleForm,
  ] = useState(emptyRoleForm);

  const loadData =
    useCallback(async () => {
      try {
        setLoading(true);

        const [
          usersResponse,
          rolesResponse,
          branchesResponse,
        ] = await Promise.all([
          fetch("/api/users", {
            cache: "no-store",
          }),
          fetch("/api/roles", {
            cache: "no-store",
          }),
          fetch(
            "/api/branches",
            {
              cache: "no-store",
            }
          ),
        ]);

        const [
          usersData,
          rolesData,
          branchesData,
        ] = await Promise.all([
          readResponse(
            usersResponse
          ),
          readResponse(
            rolesResponse
          ),
          readResponse(
            branchesResponse
          ),
        ]);

        if (
          isRecord(usersData)
        ) {
          const raw =
            Array.isArray(
              usersData.users
            )
              ? usersData.users
              : [];

          setUsers(
            raw
              .map(normalizeUser)
              .filter(
                (
                  item
                ): item is AppUser =>
                  item !== null
              )
          );
        }

        if (
          isRecord(rolesData)
        ) {
          const raw =
            Array.isArray(
              rolesData.roles
            )
              ? rolesData.roles
              : [];

          setRoles(
            raw
              .map(normalizeRole)
              .filter(
                (
                  item
                ): item is Role =>
                  item !== null
              )
          );
        }

        if (
          isRecord(branchesData)
        ) {
          const raw =
            Array.isArray(
              branchesData.branches
            )
              ? branchesData.branches
              : [];

          setBranches(
            raw
              .map(
                normalizeBranch
              )
              .filter(
                (
                  item
                ): item is Branch =>
                  item !== null
              )
          );
        }
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "Failed to load users."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredUsers =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return users.filter(
        (user) => {
          const matchesSearch =
            !text ||
            `${user.name} ${user.email} ${user.phone} ${user.branch} ${user.role}`
              .toLowerCase()
              .includes(text);

          const matchesRole =
            roleFilter === "All" ||
            user.role ===
              roleFilter;

          const matchesStatus =
            statusFilter ===
              "All" ||
            user.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesRole &&
            matchesStatus
          );
        }
      );
    }, [
      users,
      search,
      roleFilter,
      statusFilter,
    ]);

  function openAddUser() {
    setEditingUser(null);

    setUserForm({
      ...emptyUserForm,
      roleId:
        roles[0]
          ? String(
              roles[0].id
            )
          : "",
      branchId:
        branches[0]
          ? String(
              branches[0].id
            )
          : "",
    });

    setShowUserModal(true);
  }

  function openEditUser(
    user: AppUser
  ) {
    setEditingUser(user);

    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      roleId:
        user.roleId
          ? String(
              user.roleId
            )
          : "",
      branchId:
        user.branchId
          ? String(
              user.branchId
            )
          : "",
      status: user.status,
    });

    setShowUserModal(true);
  }

  async function saveUser() {
    if (
      !userForm.name.trim()
    ) {
      window.alert(
        "User name is required."
      );
      return;
    }

    if (
      !userForm.email.trim()
    ) {
      window.alert(
        "Email is required."
      );
      return;
    }

    if (
      !userForm.phone.trim()
    ) {
      window.alert(
        "Phone is required."
      );
      return;
    }

    if (!editingUser && userForm.password.length < 8) {
      window.alert("Password must be at least 8 characters.");
      return;
    }

    if (!userForm.roleId) {
      window.alert(
        "Select a role."
      );
      return;
    }

    try {
      const response =
        await fetch(
          editingUser
            ? `/api/users/${editingUser.id}`
            : "/api/users",
          {
            method:
              editingUser
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name:
                userForm.name.trim(),

              email:
                userForm.email
                  .trim()
                  .toLowerCase(),

              phone:
                userForm.phone.trim(),

              password: userForm.password,

              roleId: Number(
                userForm.roleId
              ),

              branchId:
                userForm.branchId
                  ? Number(
                      userForm.branchId
                    )
                  : null,

              status:
                userForm.status,
            }),
          }
        );

      await readResponse(response);

      setShowUserModal(false);
      setEditingUser(null);

      await loadData();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to save user."
      );
    }
  }

  async function deleteUser(
    user: AppUser
  ) {
    if (
      !window.confirm(
        `Delete ${user.name}?`
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/users/${user.id}`,
          {
            method: "DELETE",
          }
        );

      await readResponse(response);

      if (
        selectedUser?.id ===
        user.id
      ) {
        setSelectedUser(null);
      }

      await loadData();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to delete user."
      );
    }
  }

  async function toggleUserStatus(
    user: AppUser
  ) {
    try {
      const response =
        await fetch(
          `/api/users/${user.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: user.name,
              email: user.email,
              phone: user.phone,
              roleId:
                user.roleId,
              branchId:
                user.branchId,
              status:
                user.status ===
                "Active"
                  ? "Inactive"
                  : "Active",
            }),
          }
        );

      await readResponse(response);
      await loadData();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to change status."
      );
    }
  }

  function openAddRole() {
    setEditingRole(null);

    setRoleForm({
      ...emptyRoleForm,
    });

    setShowRoleModal(true);
  }

  function openEditRole(
    role: Role
  ) {
    setEditingRole(role);

    setRoleForm({
      name: role.name,
      description:
        role.description,
      permissions: [
        ...role.permissions,
      ],
    });

    setShowRoleModal(true);
  }

  function togglePermission(
    permission: string
  ) {
    setRoleForm(
      (current) => ({
        ...current,

        permissions:
          current.permissions.includes(
            permission
          )
            ? current.permissions.filter(
                (item) =>
                  item !==
                  permission
              )
            : [
                ...current.permissions,
                permission,
              ],
      })
    );
  }

  async function saveRole() {
    if (
      !roleForm.name.trim()
    ) {
      window.alert(
        "Role name is required."
      );
      return;
    }

    if (
      roleForm.permissions
        .length === 0
    ) {
      window.alert(
        "Select at least one permission."
      );
      return;
    }

    try {
      const response =
        await fetch(
          editingRole
            ? `/api/roles/${editingRole.id}`
            : "/api/roles",
          {
            method:
              editingRole
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name:
                roleForm.name.trim(),

              description:
                roleForm.description.trim(),

              permissions:
                roleForm.permissions,
            }),
          }
        );

      await readResponse(response);

      setShowRoleModal(false);
      setEditingRole(null);

      await loadData();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to save role."
      );
    }
  }

  async function deleteRole(
    role: Role
  ) {
    if (
      !window.confirm(
        `Delete role ${role.name}?`
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/roles/${role.id}`,
          {
            method: "DELETE",
          }
        );

      await readResponse(response);
      await loadData();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to delete role."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Users & Roles
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage system users,
              roles and permissions
            </p>
          </div>

          <div className="flex gap-2">
            {tab === "users" ? (
              <button
                onClick={openAddUser}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
              >
                + Add User
              </button>
            ) : (
              <button
                onClick={openAddRole}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
              >
                + Add Role
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 rounded-2xl border bg-white p-2">
          <button
            onClick={() =>
              setTab("users")
            }
            className={`rounded-xl px-5 py-3 text-sm font-bold ${
              tab === "users"
                ? "bg-blue-600 text-white"
                : "text-slate-600"
            }`}
          >
            Users
          </button>

          <button
            onClick={() =>
              setTab("roles")
            }
            className={`rounded-xl px-5 py-3 text-sm font-bold ${
              tab === "roles"
                ? "bg-blue-600 text-white"
                : "text-slate-600"
            }`}
          >
            Roles & Permissions
          </button>
        </div>

        {tab === "users" ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Users"
                value={users.length}
              />

              <StatCard
                title="Active"
                value={
                  users.filter(
                    (user) =>
                      user.status ===
                      "Active"
                  ).length
                }
              />

              <StatCard
                title="Inactive"
                value={
                  users.filter(
                    (user) =>
                      user.status ===
                      "Inactive"
                  ).length
                }
              />

              <StatCard
                title="Roles"
                value={roles.length}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search user..."
                className="rounded-xl border bg-slate-50 px-4 py-3"
              />

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target
                      .value
                  )
                }
                className="rounded-xl border bg-slate-50 px-4 py-3"
              >
                <option value="All">
                  All Roles
                </option>

                {roles.map(
                  (role) => (
                    <option
                      key={role.id}
                      value={
                        role.name
                      }
                    >
                      {role.name}
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
                    event.target
                      .value
                  )
                }
                className="rounded-xl border bg-slate-50 px-4 py-3"
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

            <div className="overflow-x-auto rounded-2xl border bg-white">
              <table className="w-full min-w-250">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "User",
                      "Phone",
                      "Role",
                      "Branch",
                      "Permissions",
                      "Last Login",
                      "Status",
                      "Actions",
                    ].map(
                      (heading) => (
                        <th
                          key={
                            heading
                          }
                          className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500"
                        >
                          {
                            heading
                          }
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {!loading &&
                    filteredUsers.map(
                      (user) => (
                        <tr
                          key={
                            user.id
                          }
                          className="border-t"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold">
                              {
                                user.name
                              }
                            </p>

                            <p className="text-xs text-slate-500">
                              {
                                user.email
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm">
                            {
                              user.phone
                            }
                          </td>

                          <td className="px-5 py-4 font-semibold">
                            {
                              user.role
                            }
                          </td>

                          <td className="px-5 py-4 text-sm">
                            {user.branch ||
                              "-"}
                          </td>

                          <td className="px-5 py-4">
                            <button
                              onClick={() =>
                                setSelectedUser(
                                  user
                                )
                              }
                              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
                            >
                              {
                                user
                                  .permissions
                                  .length
                              }{" "}
                              Permissions
                            </button>
                          </td>

                          <td className="px-5 py-4 text-sm">
                            {
                              user.lastLogin
                            }
                          </td>

                          <td className="px-5 py-4">
                            <button
                              onClick={() =>
                                void toggleUserStatus(
                                  user
                                )
                              }
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                user.status ===
                                "Active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {
                                user.status
                              }
                            </button>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  openEditUser(
                                    user
                                  )
                                }
                                className="rounded-lg border px-3 py-2 text-xs font-bold"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  void deleteUser(
                                    user
                                  )
                                }
                                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {role.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        role.description
                      }
                    </p>
                  </div>

                  <span className="text-sm font-bold text-blue-600">
                    {
                      role.totalUsers
                    }{" "}
                    users
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {role.permissions.map(
                    (permission) => (
                      <span
                        key={
                          permission
                        }
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                      >
                        {
                          permission
                        }
                      </span>
                    )
                  )}
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() =>
                      openEditRole(
                        role
                      )
                    }
                    className="rounded-xl border px-4 py-2 text-sm font-bold"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      void deleteRole(
                        role
                      )
                    }
                    className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUserModal && (
        <UserModal
          form={userForm}
          setForm={setUserForm}
          roles={roles}
          branches={branches}
          editing={
            editingUser !== null
          }
          onClose={() =>
            setShowUserModal(false)
          }
          onSave={() =>
            void saveUser()
          }
        />
      )}

      {showRoleModal && (
        <RoleModal
          form={roleForm}
          setForm={setRoleForm}
          editing={
            editingRole !== null
          }
          onToggle={
            togglePermission
          }
          onClose={() =>
            setShowRoleModal(false)
          }
          onSave={() =>
            void saveRole()
          }
        />
      )}

      {selectedUser && (
        <UserDetails
          user={selectedUser}
          onClose={() =>
            setSelectedUser(null)
          }
        />
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

function UserModal({
  form,
  setForm,
  roles,
  branches,
  editing,
  onClose,
  onSave,
}: {
  form: typeof emptyUserForm;
  setForm: React.Dispatch<
    React.SetStateAction<
      typeof emptyUserForm
    >
  >;
  roles: Role[];
  branches: Branch[];
  editing: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      title={
        editing
          ? "Edit User"
          : "Add New User"
      }
      onClose={onClose}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label="Full Name *"
          value={form.name}
          onChange={(value) =>
            setForm(
              (current) => ({
                ...current,
                name: value,
              })
            )
          }
        />

        <Field
          label="Email *"
          value={form.email}
          type="email"
          onChange={(value) =>
            setForm(
              (current) => ({
                ...current,
                email: value,
              })
            )
          }
        />

        <Field
          label="Phone *"
          value={form.phone}
          onChange={(value) =>
            setForm(
              (current) => ({
                ...current,
                phone:
                  value.replace(
                    /\D/g,
                    ""
                  ),
              })
            )
          }
        />

        <Field
          label={editing ? "New Password (optional)" : "Password *"}
          value={form.password}
          type="password"
          onChange={(value) => setForm((current) => ({ ...current, password: value }))}
        />

        <SelectField
          label="Role *"
          value={form.roleId}
          onChange={(value) =>
            setForm(
              (current) => ({
                ...current,
                roleId: value,
              })
            )
          }
        >
          <option value="">
            Select Role
          </option>

          {roles.map((role) => (
            <option
              key={role.id}
              value={role.id}
            >
              {role.name}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Branch"
          value={form.branchId}
          onChange={(value) =>
            setForm(
              (current) => ({
                ...current,
                branchId: value,
              })
            )
          }
        >
          <option value="">
            No Branch
          </option>

          {branches
            .filter(
              (branch) =>
                branch.status ===
                "Active"
            )
            .map((branch) => (
              <option
                key={branch.id}
                value={branch.id}
              >
                {branch.name}
              </option>
            ))}
        </SelectField>

        <SelectField
          label="Status"
          value={form.status}
          onChange={(value) =>
            setForm(
              (current) => ({
                ...current,
                status:
                  value as UserStatus,
              })
            )
          }
        >
          <option value="Active">
            Active
          </option>

          <option value="Inactive">
            Inactive
          </option>
        </SelectField>
      </div>

      <ModalButtons
        onClose={onClose}
        onSave={onSave}
        saveLabel={
          editing
            ? "Update User"
            : "Create User"
        }
      />
    </Modal>
  );
}

function RoleModal({
  form,
  setForm,
  editing,
  onToggle,
  onClose,
  onSave,
}: {
  form: typeof emptyRoleForm;
  setForm: React.Dispatch<
    React.SetStateAction<
      typeof emptyRoleForm
    >
  >;
  editing: boolean;
  onToggle: (
    permission: string
  ) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      title={
        editing
          ? "Edit Role"
          : "Add Role"
      }
      onClose={onClose}
    >
      <div className="space-y-4">
        <Field
          label="Role Name *"
          value={form.name}
          onChange={(value) =>
            setForm(
              (current) => ({
                ...current,
                name: value,
              })
            )
          }
        />

        <Field
          label="Description"
          value={
            form.description
          }
          onChange={(value) =>
            setForm(
              (current) => ({
                ...current,
                description:
                  value,
              })
            )
          }
        />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-bold">
              Permissions *
            </label>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setForm(
                    (current) => ({
                      ...current,
                      permissions:
                        permissionOptions.map(
                          (
                            permission
                          ) =>
                            permission[0]
                        ),
                    })
                  )
                }
                className="text-xs font-bold text-blue-600"
              >
                Select All
              </button>

              <button
                onClick={() =>
                  setForm(
                    (current) => ({
                      ...current,
                      permissions:
                        [],
                    })
                  )
                }
                className="text-xs font-bold text-slate-500"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {permissionOptions.map(
              ([key, label]) => {
                const checked =
                  form.permissions.includes(
                    key
                  );

                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer gap-2 rounded-xl border p-3 text-sm font-semibold ${
                      checked
                        ? "border-blue-200 bg-blue-50"
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        checked
                      }
                      onChange={() =>
                        onToggle(
                          key
                        )
                      }
                    />

                    {label}
                  </label>
                );
              }
            )}
          </div>
        </div>
      </div>

      <ModalButtons
        onClose={onClose}
        onSave={onSave}
        saveLabel={
          editing
            ? "Update Role"
            : "Create Role"
        }
      />
    </Modal>
  );
}

function UserDetails({
  user,
  onClose,
}: {
  user: AppUser;
  onClose: () => void;
}) {
  return (
    <Modal
      title={user.name}
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-3">
        <Detail
          label="Email"
          value={user.email}
        />

        <Detail
          label="Phone"
          value={user.phone}
        />

        <Detail
          label="Role"
          value={user.role || "-"}
        />

        <Detail
          label="Branch"
          value={
            user.branch || "-"
          }
        />

        <Detail
          label="Status"
          value={user.status}
        />

        <Detail
          label="Last Login"
          value={user.lastLogin}
        />
      </div>

      <div className="mt-5">
        <p className="mb-3 font-bold">
          Role Permissions
        </p>

        <div className="flex flex-wrap gap-2">
          {user.permissions.map(
            (permission) => (
              <span
                key={permission}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
              >
                {permission}
              </span>
            )
          )}
        </div>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-bold">
            {title}
          </h2>

          <button
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalButtons({
  onClose,
  onSave,
  saveLabel,
}: {
  onClose: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="mt-6 flex justify-end gap-2 border-t pt-5">
      <button
        onClick={onClose}
        className="rounded-xl border px-5 py-3 text-sm font-bold"
      >
        Cancel
      </button>

      <button
        onClick={onSave}
        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
      >
        {saveLabel}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold">
        {label}
      </label>

      <input
        type={type}
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

function SelectField({
  label,
  value,
  children,
  onChange,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border bg-slate-50 px-4 py-3"
      >
        {children}
      </select>
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