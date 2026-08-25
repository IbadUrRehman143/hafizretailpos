"use client";

import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between px-6">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-4">

          {/* Menu Button */}
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="relative hidden w-80 md:block">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              placeholder="Search products, customers, invoices..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2">

          {/* Notification Button */}
          <button
            type="button"
            className="relative rounded-lg p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell size={20} />

            {/* Notification Dot */}
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* Divider */}
          <div className="mx-2 h-8 w-px bg-slate-200" />

          {/* ADMIN PROFILE */}
          <div className="relative">

            {/* Profile Button */}
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-50"
            >

              {/* Avatar */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <User size={18} />
              </div>

              {/* Admin Information */}
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  Admin
                </p>

                <p className="text-xs text-slate-500">
                  Administrator
                </p>
              </div>

              {/* Arrow */}
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* DROPDOWN */}
            {profileOpen && (
              <div className="absolute right-0 top-full z-[100] mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">

                {/* Profile */}
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <User size={17} />
                  <span>Profile</span>
                </button>

                {/* Settings */}
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <Settings size={17} />
                  <span>Settings</span>
                </button>

                {/* Divider */}
                <div className="my-1 border-t border-slate-100" />

                {/* Logout */}
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={17} />
                  <span>Logout</span>
                </button>

              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}