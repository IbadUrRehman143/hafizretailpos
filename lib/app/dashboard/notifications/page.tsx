"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type NotificationType =
  | "Sale"
  | "Payment"
  | "Stock"
  | "Return"
  | "Expense"
  | "Purchase"
  | "System";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
};

const types = [
  "All",
  "Sale",
  "Payment",
  "Stock",
  "Purchase",
  "Return",
  "Expense",
  "System",
];

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

function normalizeNotification(
  raw: unknown
): Notification | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = Number(raw.id);

  if (!id) return null;

  return {
    id,
    title: toString(
      raw.title
    ),
    message: toString(
      raw.message
    ),
    type: toString(
      raw.type
    ) as NotificationType,
    isRead:
      raw.isRead === true,
    createdAt: toString(
      raw.createdAt
    ),
  };
}

function formatDateTime(
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

export default function NotificationsPage() {
  const [
    notifications,
    setNotifications,
  ] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");

  const [
    selected,
    setSelected,
  ] = useState<Notification | null>(
    null
  );

  const loadNotifications =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/notifications",
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
            data.notifications
          )
            ? data.notifications
            : [];

        setNotifications(
          raw
            .map(
              normalizeNotification
            )
            .filter(
              (
                item
              ): item is Notification =>
                item !== null
            )
        );
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "Failed to load notifications."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const filtered =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return notifications.filter(
        (notification) => {
          const matchesSearch =
            !text ||
            `${notification.title} ${notification.message} ${notification.type}`
              .toLowerCase()
              .includes(text);

          const matchesFilter =
            filter === "All" ||
            notification.type ===
              filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      notifications,
      search,
      filter,
    ]);

  const unreadCount =
    notifications.filter(
      (item) => !item.isRead
    ).length;

  async function updateRead(
    notification: Notification,
    isRead: boolean
  ) {
    try {
      const response =
        await fetch(
          `/api/notifications/${notification.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              isRead,
            }),
          }
        );

      await readResponse(response);

      setNotifications(
        (current) =>
          current.map((item) =>
            item.id ===
            notification.id
              ? {
                  ...item,
                  isRead,
                }
              : item
          )
      );

      if (
        selected?.id ===
        notification.id
      ) {
        setSelected(
          (current) =>
            current
              ? {
                  ...current,
                  isRead,
                }
              : null
        );
      }
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to update notification."
      );
    }
  }

  async function openNotification(
    notification: Notification
  ) {
    setSelected(notification);

    if (!notification.isRead) {
      await updateRead(
        notification,
        true
      );
    }
  }

  async function markAllRead() {
    try {
      const response =
        await fetch(
          "/api/notifications",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              action:
                "mark-all-read",
            }),
          }
        );

      await readResponse(response);

      setNotifications(
        (current) =>
          current.map((item) => ({
            ...item,
            isRead: true,
          }))
      );
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to mark notifications."
      );
    }
  }

  async function deleteOne(
    notification: Notification
  ) {
    if (
      !window.confirm(
        "Delete this notification?"
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/notifications/${notification.id}`,
          {
            method: "DELETE",
          }
        );

      await readResponse(response);

      setNotifications(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              notification.id
          )
      );

      if (
        selected?.id ===
        notification.id
      ) {
        setSelected(null);
      }
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to delete notification."
      );
    }
  }

  async function clearAll() {
    if (
      !window.confirm(
        "Delete all notifications?"
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          "/api/notifications",
          {
            method: "DELETE",
          }
        );

      await readResponse(response);

      setNotifications([]);
      setSelected(null);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to clear notifications."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Notifications
              </h1>

              {unreadCount >
                0 && (
                <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                  {unreadCount} New
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Sales, payments,
              stock and system
              activities
            </p>
          </div>

          <div className="flex gap-2">
            <button
              disabled={
                unreadCount === 0
              }
              onClick={() =>
                void markAllRead()
              }
              className="rounded-xl border bg-white px-4 py-3 text-sm font-bold disabled:opacity-50"
            >
              ✓ Mark All Read
            </button>

            <button
              disabled={
                notifications.length ===
                0
              }
              onClick={() =>
                void clearAll()
              }
              className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total"
            value={
              notifications.length
            }
          />

          <StatCard
            title="Unread"
            value={unreadCount}
          />

          <StatCard
            title="Read"
            value={
              notifications.length -
              unreadCount
            }
          />
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search notifications..."
            className="w-full rounded-xl border bg-slate-50 px-4 py-3"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {types.map((type) => (
              <button
                key={type}
                onClick={() =>
                  setFilter(type)
                }
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  filter === type
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading
              notifications...
            </div>
          ) : filtered.length ===
            0 ? (
            <div className="p-16 text-center">
              <div className="text-4xl">
                🔔
              </div>

              <p className="mt-3 font-bold">
                No notifications
                found
              </p>
            </div>
          ) : (
            filtered.map(
              (notification) => (
                <div
                  key={
                    notification.id
                  }
                  className={`flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center ${
                    notification.isRead
                      ? "bg-white"
                      : "bg-blue-50/50"
                  }`}
                >
                  <button
                    onClick={() =>
                      void openNotification(
                        notification
                      )
                    }
                    className="text-2xl"
                  >
                    {getIcon(
                      notification.type
                    )}
                  </button>

                  <button
                    onClick={() =>
                      void openNotification(
                        notification
                      )
                    }
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">
                        {
                          notification.title
                        }
                      </h3>

                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        notification.message
                      }
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {formatDateTime(
                        notification.createdAt
                      )}
                    </p>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        void updateRead(
                          notification,
                          !notification.isRead
                        )
                      }
                      className="rounded-lg border px-3 py-2 text-xs font-bold"
                    >
                      {notification.isRead
                        ? "Unread"
                        : "Read"}
                    </button>

                    <button
                      onClick={() =>
                        void deleteOne(
                          notification
                        )
                      }
                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl">
                  {getIcon(
                    selected.type
                  )}
                </div>

                <h2 className="mt-3 text-xl font-bold">
                  {selected.title}
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelected(null)
                }
              >
                ✕
              </button>
            </div>

            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {selected.message}
            </p>

            <p className="mt-4 text-sm text-slate-500">
              {formatDateTime(
                selected.createdAt
              )}
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() =>
                  void updateRead(
                    selected,
                    !selected.isRead
                  )
                }
                className="rounded-xl border px-4 py-3 text-sm font-bold"
              >
                {selected.isRead
                  ? "Mark Unread"
                  : "Mark Read"}
              </button>

              <button
                onClick={() =>
                  void deleteOne(
                    selected
                  )
                }
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white"
              >
                Delete
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

function getIcon(
  type: NotificationType
) {
  switch (type) {
    case "Sale":
      return "🛒";

    case "Payment":
      return "💰";

    case "Stock":
      return "📦";

    case "Purchase":
      return "🚚";

    case "Return":
      return "↩️";

    case "Expense":
      return "💸";

    case "System":
      return "⚙️";

    default:
      return "🔔";
  }
}