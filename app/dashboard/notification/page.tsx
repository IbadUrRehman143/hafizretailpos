"use client";

import { useMemo, useState } from "react";

type NotificationType =
  | "Sale"
  | "Payment"
  | "Stock"
  | "Return"
  | "Expense"
  | "System";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  date: string;
  time: string;
  read: boolean;
};

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "New Sale Completed",
    message:
      "Invoice INV-0004 has been completed successfully.",
    type: "Sale",
    date: "2026-08-25",
    time: "06:30 PM",
    read: false,
  },
  {
    id: 2,
    title: "Payment Received",
    message:
      "Rs. 30,000 payment received from Muhammad Ali.",
    type: "Payment",
    date: "2026-08-25",
    time: "05:45 PM",
    read: false,
  },
  {
    id: 3,
    title: "Low Stock Alert",
    message:
      "Pedestal Fan stock is running low. Only 3 units remaining.",
    type: "Stock",
    date: "2026-08-25",
    time: "04:20 PM",
    read: false,
  },
  {
    id: 4,
    title: "Return Request",
    message:
      "A customer return has been recorded for INV-0002.",
    type: "Return",
    date: "2026-08-25",
    time: "02:15 PM",
    read: true,
  },
  {
    id: 5,
    title: "Expense Added",
    message:
      "Shop electricity bill of Rs. 12,500 was added.",
    type: "Expense",
    date: "2026-08-24",
    time: "06:10 PM",
    read: true,
  },
  {
    id: 6,
    title: "System Update",
    message:
      "Your POS system settings were updated successfully.",
    type: "System",
    date: "2026-08-24",
    time: "11:30 AM",
    read: true,
  },
  {
    id: 7,
    title: "New Sale Completed",
    message:
      "Invoice INV-0003 has been completed successfully.",
    type: "Sale",
    date: "2026-08-23",
    time: "03:40 PM",
    read: true,
  },
];

const notificationTypes = [
  "All",
  "Sale",
  "Payment",
  "Stock",
  "Return",
  "Expense",
  "System",
];

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<Notification[]>(
      initialNotifications
    );

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");

  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const filteredNotifications =
    useMemo(() => {
      const text = search
        .trim()
        .toLowerCase();

      return notifications.filter(
        (notification) => {
          const matchesSearch =
            !text ||
            notification.title
              .toLowerCase()
              .includes(text) ||
            notification.message
              .toLowerCase()
              .includes(text) ||
            notification.type
              .toLowerCase()
              .includes(text);

          const matchesFilter =
            filter === "All" ||
            notification.type === filter;

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
      (notification) =>
        !notification.read
    ).length;

  const readCount =
    notifications.filter(
      (notification) =>
        notification.read
    ).length;

  function markAsRead(id: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification
      )
    );
  }

  function markAsUnread(id: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: false,
            }
          : notification
      )
    );
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }

  function deleteNotification(id: number) {
    setNotifications((current) =>
      current.filter(
        (notification) =>
          notification.id !== id
      )
    );

    if (
      selectedNotification?.id === id
    ) {
      setSelectedNotification(null);
    }
  }

  function clearAllNotifications() {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete all notifications?"
      );

    if (!confirmed) return;

    setNotifications([]);
  }

  function handleNotificationClick(
    notification: Notification
  ) {
    markAsRead(notification.id);
    setSelectedNotification(
      notification
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-6xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <h1 className="text-2xl font-bold text-slate-900">
                Notifications
              </h1>

              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                  {unreadCount} New
                </span>
              )}

            </div>

            <p className="mt-1 text-sm text-slate-500">
              Stay updated with sales, payments, stock and system activities
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={
                unreadCount === 0
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ✓ Mark All Read
            </button>

            <button
              type="button"
              onClick={
                clearAllNotifications
              }
              disabled={
                notifications.length === 0
              }
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear All
            </button>

          </div>

        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <StatCard
            title="Total Notifications"
            value={notifications.length}
            icon="🔔"
          />

          <StatCard
            title="Unread"
            value={unreadCount}
            icon="📩"
          />

          <StatCard
            title="Read"
            value={readCount}
            icon="✓"
          />

        </div>

        {/* FILTER AREA */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search notifications..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            <div className="flex flex-wrap gap-2">

              {notificationTypes.map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setFilter(type)
                    }
                    className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                      filter === type
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {type}
                  </button>
                )
              )}

            </div>

          </div>

        </div>

        {/* NOTIFICATION LIST */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-bold text-slate-900">
                  Notification List
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Showing{" "}
                  {filteredNotifications.length}{" "}
                  notification
                  {filteredNotifications.length !==
                  1
                    ? "s"
                    : ""}
                </p>
              </div>

              <span className="hidden text-sm text-slate-400 sm:block">
                {unreadCount} unread
              </span>

            </div>

          </div>

          {filteredNotifications.length ===
          0 ? (
            <EmptyState />
          ) : (
            <div>

              {filteredNotifications.map(
                (notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={
                      notification
                    }
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                    onMarkRead={() =>
                      notification.read
                        ? markAsUnread(
                            notification.id
                          )
                        : markAsRead(
                            notification.id
                          )
                    }
                    onDelete={() =>
                      deleteNotification(
                        notification.id
                      )
                    }
                  />
                )
              )}

            </div>
          )}

        </div>

      </div>

      {/* VIEW MODAL */}
      {selectedNotification && (
        <NotificationModal
          notification={
            selectedNotification
          }
          onClose={() =>
            setSelectedNotification(
              null
            )
          }
          onMarkUnread={() => {
            markAsUnread(
              selectedNotification.id
            );
            setSelectedNotification(
              null
            );
          }}
          onDelete={() => {
            deleteNotification(
              selectedNotification.id
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
   NOTIFICATION ITEM
===================================================== */

function NotificationItem({
  notification,
  onClick,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onClick: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group flex flex-col gap-4 border-b border-slate-100 p-5 transition last:border-b-0 sm:flex-row sm:items-center ${
        notification.read
          ? "bg-white hover:bg-slate-50"
          : "bg-blue-50/50 hover:bg-blue-50"
      }`}
    >

      {/* ICON */}
      <button
        type="button"
        onClick={onClick}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl ${
          getTypeBackground(
            notification.type
          )
        }`}
      >
        {getTypeIcon(
          notification.type
        )}
      </button>

      {/* CONTENT */}
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 text-left"
      >

        <div className="flex flex-wrap items-center gap-2">

          <h3
            className={`text-sm ${
              notification.read
                ? "font-semibold text-slate-800"
                : "font-bold text-slate-900"
            }`}
          >
            {notification.title}
          </h3>

          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-blue-600" />
          )}

          <span
            className={`rounded-full px-2 py-1 text-[10px] font-bold ${getTypeBadge(
              notification.type
            )}`}
          >
            {notification.type}
          </span>

        </div>

        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {notification.message}
        </p>

        <p className="mt-2 text-xs text-slate-400">
          {notification.date} •{" "}
          {notification.time}
        </p>

      </button>

      {/* ACTIONS */}
      <div className="flex items-center gap-2 sm:opacity-70 sm:transition sm:group-hover:opacity-100">

        <button
          type="button"
          onClick={onMarkRead}
          title={
            notification.read
              ? "Mark as unread"
              : "Mark as read"
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
        >
          {notification.read
            ? "Unread"
            : "Read"}
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
        >
          Delete
        </button>

      </div>

    </div>
  );
}

/* =====================================================
   EMPTY STATE
===================================================== */

function EmptyState() {
  return (
    <div className="px-5 py-20 text-center">

      <div className="text-5xl">
        🔔
      </div>

      <h3 className="mt-4 font-bold text-slate-800">
        No notifications found
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        You are all caught up.
      </p>

    </div>
  );
}

/* =====================================================
   VIEW MODAL
===================================================== */

function NotificationModal({
  notification,
  onClose,
  onMarkUnread,
  onDelete,
}: {
  notification: Notification;
  onClose: () => void;
  onMarkUnread: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5 sm:p-6">

          <div className="flex items-center gap-3">

            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${getTypeBackground(
                notification.type
              )}`}
            >
              {getTypeIcon(
                notification.type
              )}
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                {notification.title}
              </h2>

              <span
                className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${getTypeBadge(
                  notification.type
                )}`}
              >
                {notification.type}
              </span>

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
        <div className="space-y-5 p-5 sm:p-6">

          <div>

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Message
            </p>

            <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {notification.message}
            </p>

          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="rounded-xl border border-slate-100 p-4">

              <p className="text-xs text-slate-400">
                Date
              </p>

              <p className="mt-1 text-sm font-bold text-slate-800">
                {notification.date}
              </p>

            </div>

            <div className="rounded-xl border border-slate-100 p-4">

              <p className="text-xs text-slate-400">
                Time
              </p>

              <p className="mt-1 text-sm font-bold text-slate-800">
                {notification.time}
              </p>

            </div>

          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">

            <span className="text-sm text-slate-500">
              Status
            </span>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                notification.read
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {notification.read
                ? "Read"
                : "Unread"}
            </span>

          </div>

        </div>

        {/* FOOTER */}
        <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={onMarkUnread}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Mark Unread
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   ICON HELPERS
===================================================== */

function getTypeIcon(
  type: NotificationType
) {
  switch (type) {
    case "Sale":
      return "🛒";

    case "Payment":
      return "💰";

    case "Stock":
      return "📦";

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

function getTypeBackground(
  type: NotificationType
) {
  switch (type) {
    case "Sale":
      return "bg-blue-50";

    case "Payment":
      return "bg-emerald-50";

    case "Stock":
      return "bg-amber-50";

    case "Return":
      return "bg-purple-50";

    case "Expense":
      return "bg-red-50";

    case "System":
      return "bg-slate-100";

    default:
      return "bg-slate-100";
  }
}

function getTypeBadge(
  type: NotificationType
) {
  switch (type) {
    case "Sale":
      return "bg-blue-50 text-blue-700";

    case "Payment":
      return "bg-emerald-50 text-emerald-700";

    case "Stock":
      return "bg-amber-50 text-amber-700";

    case "Return":
      return "bg-purple-50 text-purple-700";

    case "Expense":
      return "bg-red-50 text-red-700";

    case "System":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
}