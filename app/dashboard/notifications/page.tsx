"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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
      } catch {} finally {
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
    } catch {}
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
    } catch {}
  }

  async function deleteOne(
    notification: Notification
  ) {

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
    } catch {}
  }

  async function clearAll() {

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
    } catch {}
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Notifications
                </h1>

                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                    {unreadCount} New
                  </span>
                )}
              </div>

              <p className="mt-1 wrap-break-word text-sm text-slate-500">
                Sales, payments, stock and system activities
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              disabled={unreadCount === 0}
              onClick={() => void markAllRead()}
              className="rounded-xl border bg-white px-3 py-3 text-xs font-bold disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              ✓ Mark All Read
            </button>

            <button
              type="button"
              disabled={notifications.length === 0}
              onClick={() => void clearAll()}
              className="rounded-xl bg-red-50 px-3 py-3 text-xs font-bold text-red-600 disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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
                className={`rounded-xl px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm ${
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
                  className={`flex flex-col gap-4 border-b p-4 sm:p-5 md:flex-row md:items-center ${
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
                    className="self-start text-2xl"
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
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="wrap-break-word font-bold">
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

                  <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0">
                    <button
                      onClick={() =>
                        void updateRead(
                          notification,
                          !notification.isRead
                        )
                      }
                      className="w-full rounded-lg border px-3 py-2.5 text-xs font-bold md:w-auto"
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
                      className="w-full rounded-lg bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 md:w-auto"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
          <div className="mx-auto my-4 w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl sm:my-0 sm:p-6">
            <div className="flex items-start justify-between gap-3">
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

            <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <button
                onClick={() =>
                  void updateRead(
                    selected,
                    !selected.isRead
                  )
                }
                className="w-full rounded-xl border px-4 py-3 text-sm font-bold sm:w-auto"
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
                className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white sm:w-auto"
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