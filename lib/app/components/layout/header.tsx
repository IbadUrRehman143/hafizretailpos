"use client";

import {
  Bell,
  ChevronDown,
  FileText,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  User,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

// ======================================================
// TYPES
// ======================================================

type SearchResult = {
  id: string;
  recordId: number;
  type:
    | "product"
    | "customer"
    | "supplier"
    | "invoice"
    | "purchase";
  title: string;
  subtitle: string;
  href: string;
};

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

// ======================================================
// HEADER
// ======================================================

export default function Header() {
  const router = useRouter();

  // ====================================================
  // PROFILE
  // ====================================================

  const [profileOpen, setProfileOpen] =
    useState(false);

  // ====================================================
  // SEARCH
  // ====================================================

  const [search, setSearch] =
    useState("");

  const [
    searchResults,
    setSearchResults,
  ] = useState<SearchResult[]>([]);

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const [
    searchLoading,
    setSearchLoading,
  ] = useState(false);

  // ====================================================
  // NOTIFICATIONS
  // ====================================================

  const [
    notificationOpen,
    setNotificationOpen,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);

  const [
    notificationLoading,
    setNotificationLoading,
  ] = useState(false);

  // ====================================================
  // REFS
  // ====================================================

  const searchRef =
    useRef<HTMLDivElement>(null);

  const profileRef =
    useRef<HTMLDivElement>(null);

  const notificationRef =
    useRef<HTMLDivElement>(null);

  // ====================================================
  // UNREAD COUNT
  // ====================================================

  const unreadCount =
    notifications.filter(
      (item) => !item.isRead
    ).length;

  // ====================================================
  // LOAD NOTIFICATIONS
  // ====================================================

  const loadNotifications =
    async () => {
      try {
        setNotificationLoading(true);

        const response =
          await fetch(
            "/api/notifications",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (
          response.ok &&
          data.success
        ) {
          setNotifications(
            Array.isArray(
              data.notifications
            )
              ? data.notifications
              : []
          );
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error(
          "Load notifications error:",
          error
        );

        setNotifications([]);
      } finally {
        setNotificationLoading(false);
      }
    };

  // ====================================================
  // INITIAL NOTIFICATIONS
  // ====================================================

  useEffect(() => {
    loadNotifications();
  }, []);

  // ====================================================
  // GLOBAL SEARCH
  // ====================================================

  useEffect(() => {
    const value = search.trim();

    if (value.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);

      return;
    }

    const controller =
      new AbortController();

    const timer =
      window.setTimeout(
        async () => {
          try {
            setSearchLoading(true);

            const response =
              await fetch(
                `/api/search?q=${encodeURIComponent(
                  value
                )}`,
                {
                  method: "GET",
                  cache: "no-store",
                  signal:
                    controller.signal,
                }
              );

            const data =
              await response.json();

            if (
              response.ok &&
              data.success
            ) {
              setSearchResults(
                Array.isArray(
                  data.results
                )
                  ? data.results
                  : []
              );
            } else {
              setSearchResults([]);
            }
          } catch (error) {
            if (
              error instanceof
                DOMException &&
              error.name ===
                "AbortError"
            ) {
              return;
            }

            console.error(
              "Header search error:",
              error
            );

            setSearchResults([]);
          } finally {
            setSearchLoading(false);
          }
        },
        350
      );

    return () => {
      window.clearTimeout(timer);

      controller.abort();
    };
  }, [search]);

  // ====================================================
  // OUTSIDE CLICK
  // ====================================================

  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      const target =
        event.target as Node;

      if (
        searchRef.current &&
        !searchRef.current.contains(
          target
        )
      ) {
        setSearchOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(
          target
        )
      ) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          target
        )
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // ====================================================
  // SEARCH RESULT CLICK
  // ====================================================

  const handleSearchResult = (
    result: SearchResult
  ) => {
    setSearchOpen(false);
    setSearch("");
    setSearchResults([]);

    router.push(result.href);
  };

  // ====================================================
  // SEARCH ICON
  // ====================================================

  const getSearchIcon = (
    type: SearchResult["type"]
  ) => {
    switch (type) {
      case "product":
        return (
          <Package size={17} />
        );

      case "customer":
        return (
          <Users size={17} />
        );

      case "supplier":
        return (
          <Truck size={17} />
        );

      case "invoice":
        return (
          <FileText size={17} />
        );

      case "purchase":
        return (
          <ShoppingCart
            size={17}
          />
        );

      default:
        return (
          <Search size={17} />
        );
    }
  };

  // ====================================================
  // SEARCH LABEL
  // ====================================================

  const getSearchLabel = (
    type: SearchResult["type"]
  ) => {
    switch (type) {
      case "product":
        return "Product";

      case "customer":
        return "Customer";

      case "supplier":
        return "Supplier";

      case "invoice":
        return "Invoice";

      case "purchase":
        return "Purchase";

      default:
        return "Result";
    }
  };

  // ====================================================
  // OPEN NOTIFICATIONS
  // ====================================================

  const handleNotificationOpen =
    () => {
      setNotificationOpen(
        (previous) => !previous
      );

      setProfileOpen(false);
      setSearchOpen(false);

      if (!notificationOpen) {
        loadNotifications();
      }
    };

  // ====================================================
  // MARK NOTIFICATION READ
  // ====================================================

  const markNotificationRead =
    async (
      notification: Notification
    ) => {
      try {
        if (!notification.isRead) {
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
                  isRead: true,
                }),
              }
            );

          const data =
            await response.json();

          if (
            response.ok &&
            data.success
          ) {
            setNotifications(
              (previous) =>
                previous.map(
                  (item) =>
                    item.id ===
                    notification.id
                      ? {
                          ...item,
                          isRead:
                            true,
                        }
                      : item
                )
            );
          }
        }
      } catch (error) {
        console.error(
          "Mark notification error:",
          error
        );
      }
    };

  // ====================================================
  // MARK ALL READ
  // ====================================================

  const markAllRead =
    async () => {
      try {
        const response =
          await fetch(
            "/api/notifications",
            {
              method: "PUT",
            }
          );

        const data =
          await response.json();

        if (
          response.ok &&
          data.success
        ) {
          setNotifications(
            (previous) =>
              previous.map(
                (item) => ({
                  ...item,
                  isRead: true,
                })
              )
          );
        }
      } catch (error) {
        console.error(
          "Mark all read error:",
          error
        );
      }
    };

  // ====================================================
  // DATE FORMAT
  // ====================================================

  const formatDate = (
    value: string
  ) => {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleString(
      "en-PK",
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ====================================================
  // MENU BUTTON
  // ====================================================

  const handleMenuClick =
    () => {
      window.dispatchEvent(
        new CustomEvent(
          "toggle-sidebar"
        )
      );
    };

  // ====================================================
  // PROFILE
  // ====================================================

  const openProfile =
    () => {
      setProfileOpen(false);

      router.push(
        "/dashboard/users"
      );
    };

  // ====================================================
  // SETTINGS
  // ====================================================

  const openSettings =
    () => {
      setProfileOpen(false);

      router.push(
        "/dashboard/settings"
      );
    };

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout =
    () => {
      setProfileOpen(false);

      /*
        Authentication abhi connect
        nahi hai.

        Jab login/auth module banega,
        yahan real logout API/session
        clear karenge.
      */

      console.log(
        "Logout requires authentication setup."
      );
    };

  // ====================================================
  // UI
  // ====================================================

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">

        {/* ============================================= */}
        {/* LEFT */}
        {/* ============================================= */}

        <div className="flex min-w-0 items-center gap-3 sm:gap-4">

          {/* MENU */}

          <button
            type="button"
            onClick={
              handleMenuClick
            }
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          {/* =========================================== */}
          {/* SEARCH */}
          {/* =========================================== */}

          <div
            ref={searchRef}
            className="relative hidden w-72 md:block lg:w-96"
          >
            <Search
              size={18}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );

                setSearchOpen(true);

                setProfileOpen(false);

                setNotificationOpen(
                  false
                );
              }}
              onFocus={() => {
                setSearchOpen(true);

                setProfileOpen(false);

                setNotificationOpen(
                  false
                );
              }}
              placeholder="Search products, customers, invoices..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            {/* CLEAR SEARCH */}

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSearchResults(
                    []
                  );
                  setSearchOpen(
                    false
                  );
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}

            {/* ========================================= */}
            {/* SEARCH DROPDOWN */}
            {/* ========================================= */}

            {searchOpen &&
              search.trim().length >=
                2 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[430px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">

                  {/* LOADING */}

                  {searchLoading && (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      Searching
                      database...
                    </div>
                  )}

                  {/* NO RESULTS */}

                  {!searchLoading &&
                    searchResults.length ===
                      0 && (
                      <div className="px-4 py-8 text-center">
                        <Search
                          size={24}
                          className="mx-auto mb-2 text-slate-300"
                        />

                        <p className="text-sm font-medium text-slate-700">
                          No results
                          found
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Try another
                          product,
                          customer,
                          invoice or
                          supplier.
                        </p>
                      </div>
                    )}

                  {/* RESULTS */}

                  {!searchLoading &&
                    searchResults.length >
                      0 && (
                      <>
                        <div className="border-b border-slate-100 px-4 py-2.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Search
                            Results
                          </p>
                        </div>

                        <div className="p-1.5">
                          {searchResults.map(
                            (
                              result
                            ) => (
                              <button
                                key={
                                  result.id
                                }
                                type="button"
                                onClick={() =>
                                  handleSearchResult(
                                    result
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-slate-50"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                  {getSearchIcon(
                                    result.type
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {
                                        result.title
                                      }
                                    </p>

                                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500">
                                      {getSearchLabel(
                                        result.type
                                      )}
                                    </span>
                                  </div>

                                  {result.subtitle && (
                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                      {
                                        result.subtitle
                                      }
                                    </p>
                                  )}
                                </div>
                              </button>
                            )
                          )}
                        </div>
                      </>
                    )}
                </div>
              )}
          </div>
        </div>

        {/* ============================================= */}
        {/* RIGHT */}
        {/* ============================================= */}

        <div className="flex items-center gap-2">

          {/* =========================================== */}
          {/* NOTIFICATIONS */}
          {/* =========================================== */}

          <div
            ref={
              notificationRef
            }
            className="relative"
          >
            <button
              type="button"
              onClick={
                handleNotificationOpen
              }
              className="relative rounded-lg p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Notifications"
            >
              <Bell size={20} />

              {unreadCount >
                0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount >
                  99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </button>

            {/* ========================================= */}
            {/* NOTIFICATION DROPDOWN */}
            {/* ========================================= */}

            {notificationOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-[390px]">

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Notifications
                    </p>

                    <p className="text-xs text-slate-500">
                      {unreadCount}{" "}
                      unread
                    </p>
                  </div>

                  {unreadCount >
                    0 && (
                    <button
                      type="button"
                      onClick={
                        markAllRead
                      }
                      className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* CONTENT */}

                <div className="max-h-[390px] overflow-y-auto">
                  {notificationLoading ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-500">
                      Loading
                      notifications...
                    </div>
                  ) : notifications.length ===
                    0 ? (
                    <div className="px-4 py-10 text-center">
                      <Bell
                        size={28}
                        className="mx-auto mb-2 text-slate-300"
                      />

                      <p className="text-sm font-medium text-slate-700">
                        No
                        notifications
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        You are all
                        caught up.
                      </p>
                    </div>
                  ) : (
                    notifications
                      .slice(0, 8)
                      .map(
                        (
                          notification
                        ) => (
                          <button
                            key={
                              notification.id
                            }
                            type="button"
                            onClick={() =>
                              markNotificationRead(
                                notification
                              )
                            }
                            className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 ${
                              !notification.isRead
                                ? "bg-blue-50/50"
                                : "bg-white"
                            }`}
                          >
                            <div
                              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                !notification.isRead
                                  ? "bg-blue-500"
                                  : "bg-slate-200"
                              }`}
                            />

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800">
                                {
                                  notification.title
                                }
                              </p>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                {
                                  notification.message
                                }
                              </p>

                              <p className="mt-1.5 text-[11px] text-slate-400">
                                {formatDate(
                                  notification.createdAt
                                )}
                              </p>
                            </div>
                          </button>
                        )
                      )
                  )}
                </div>

                {/* VIEW ALL */}

                <button
                  type="button"
                  onClick={() => {
                    setNotificationOpen(
                      false
                    );

                    router.push(
                      "/dashboard/notifications"
                    );
                  }}
                  className="w-full border-t border-slate-100 px-4 py-3 text-center text-sm font-medium text-blue-600 transition hover:bg-slate-50"
                >
                  View all
                  notifications
                </button>
              </div>
            )}
          </div>

          {/* DIVIDER */}

          <div className="mx-2 hidden h-8 w-px bg-slate-200 sm:block" />

          {/* =========================================== */}
          {/* PROFILE */}
          {/* =========================================== */}

          <div
            ref={profileRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() => {
                setProfileOpen(
                  (previous) =>
                    !previous
                );

                setNotificationOpen(
                  false
                );

                setSearchOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <User size={18} />
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  Admin
                </p>

                <p className="text-xs text-slate-500">
                  Administrator
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`hidden text-slate-400 transition-transform sm:block ${
                  profileOpen
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>

            {/* ========================================= */}
            {/* PROFILE DROPDOWN */}
            {/* ========================================= */}

            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">

                <div className="border-b border-slate-100 px-3 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Admin
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Administrator
                  </p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={
                      openProfile
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <User
                      size={17}
                    />
                    <span>
                      Profile
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={
                      openSettings
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <Settings
                      size={17}
                    />
                    <span>
                      Settings
                    </span>
                  </button>
                </div>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut
                    size={17}
                  />
                  <span>
                    Logout
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}