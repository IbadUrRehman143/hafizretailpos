"use client";

import { useState } from "react";

type Settings = {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  invoicePrefix: string;
  taxEnabled: boolean;
  taxRate: string;
  lowStockAlert: boolean;
  lowStockLimit: string;
  whatsappEnabled: boolean;
  autoPrint: boolean;
};

const initialSettings: Settings = {
  businessName: "Hafiz Retail POS",
  phone: "0300-1234567",
  email: "info@hafizretail.com",
  address: "Main Jahangira Swabi Road",
  currency: "PKR",
  invoicePrefix: "INV-",
  taxEnabled: false,
  taxRate: "0",
  lowStockAlert: true,
  lowStockLimit: "5",
  whatsappEnabled: true,
  autoPrint: false,
};

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<Settings>(initialSettings);

  const [saved, setSaved] =
    useState(false);

  const updateField = <K extends keyof Settings>(
    field: K,
    value: Settings[K]
  ) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  };

  const saveSettings = () => {
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const resetSettings = () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all settings?"
    );

    if (!confirmed) return;

    setSettings(initialSettings);
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-6xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your POS and business settings
            </p>
          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={resetSettings}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={saveSettings}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Save Settings
            </button>

          </div>

        </div>

        {/* SUCCESS MESSAGE */}
        {saved && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            ✓ Settings saved successfully.
          </div>
        )}

        {/* BUSINESS INFORMATION */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <SectionHeader
            icon="🏢"
            title="Business Information"
            description="Basic information about your business"
          />

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">

            <InputField
              label="Business Name"
              value={settings.businessName}
              placeholder="Hafiz Retail POS"
              onChange={(value) =>
                updateField(
                  "businessName",
                  value
                )
              }
            />

            <InputField
              label="Phone"
              value={settings.phone}
              placeholder="0300-1234567"
              onChange={(value) =>
                updateField(
                  "phone",
                  value
                )
              }
            />

            <InputField
              label="Email"
              value={settings.email}
              placeholder="info@example.com"
              type="email"
              onChange={(value) =>
                updateField(
                  "email",
                  value
                )
              }
            />

            <InputField
              label="Currency"
              value={settings.currency}
              placeholder="PKR"
              onChange={(value) =>
                updateField(
                  "currency",
                  value
                )
              }
            />

            <div className="sm:col-span-2">

              <label className="mb-2 block text-sm font-bold text-slate-700">
                Business Address
              </label>

              <textarea
                value={settings.address}
                onChange={(event) =>
                  updateField(
                    "address",
                    event.target.value
                  )
                }
                rows={3}
                placeholder="Enter business address"
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />

            </div>

          </div>

        </section>

        {/* INVOICE SETTINGS */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <SectionHeader
            icon="🧾"
            title="Invoice Settings"
            description="Configure invoice and billing options"
          />

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">

            <InputField
              label="Invoice Prefix"
              value={settings.invoicePrefix}
              placeholder="INV-"
              onChange={(value) =>
                updateField(
                  "invoicePrefix",
                  value
                )
              }
            />

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Currency
              </label>

              <select
                value={settings.currency}
                onChange={(event) =>
                  updateField(
                    "currency",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="PKR">
                  PKR - Pakistani Rupee
                </option>

                <option value="SAR">
                  SAR - Saudi Riyal
                </option>

                <option value="USD">
                  USD - US Dollar
                </option>
              </select>
            </div>

          </div>

        </section>

        {/* TAX SETTINGS */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <SectionHeader
            icon="💰"
            title="Tax Settings"
            description="Manage tax calculation on sales"
          />

          <div className="space-y-5 p-5 sm:p-6">

            <ToggleRow
              title="Enable Tax"
              description="Automatically calculate tax on invoices"
              checked={settings.taxEnabled}
              onChange={(checked) =>
                updateField(
                  "taxEnabled",
                  checked
                )
              }
            />

            {settings.taxEnabled && (
              <div className="max-w-sm">

                <InputField
                  label="Tax Rate (%)"
                  value={settings.taxRate}
                  type="number"
                  placeholder="0"
                  onChange={(value) =>
                    updateField(
                      "taxRate",
                      value
                    )
                  }
                />

              </div>
            )}

          </div>

        </section>

        {/* INVENTORY SETTINGS */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <SectionHeader
            icon="📦"
            title="Inventory Settings"
            description="Configure stock alerts"
          />

          <div className="space-y-5 p-5 sm:p-6">

            <ToggleRow
              title="Low Stock Alert"
              description="Show notification when product stock is low"
              checked={
                settings.lowStockAlert
              }
              onChange={(checked) =>
                updateField(
                  "lowStockAlert",
                  checked
                )
              }
            />

            {settings.lowStockAlert && (
              <div className="max-w-sm">

                <InputField
                  label="Low Stock Limit"
                  value={
                    settings.lowStockLimit
                  }
                  type="number"
                  placeholder="5"
                  onChange={(value) =>
                    updateField(
                      "lowStockLimit",
                      value
                    )
                  }
                />

                <p className="mt-2 text-xs text-slate-500">
                  Alert will appear when stock reaches this quantity.
                </p>

              </div>
            )}

          </div>

        </section>

        {/* NOTIFICATION SETTINGS */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <SectionHeader
            icon="🔔"
            title="Notifications"
            description="Manage customer and system notifications"
          />

          <div className="space-y-5 p-5 sm:p-6">

            <ToggleRow
              title="WhatsApp Notifications"
              description="Enable WhatsApp customer notifications"
              checked={
                settings.whatsappEnabled
              }
              onChange={(checked) =>
                updateField(
                  "whatsappEnabled",
                  checked
                )
              }
            />

            <ToggleRow
              title="Auto Print Invoice"
              description="Automatically print invoice after checkout"
              checked={settings.autoPrint}
              onChange={(checked) =>
                updateField(
                  "autoPrint",
                  checked
                )
              }
            />

          </div>

        </section>

        {/* SYSTEM INFORMATION */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <SectionHeader
            icon="⚙️"
            title="System Information"
            description="Current POS application information"
          />

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3 sm:p-6">

            <InfoBox
              label="Application"
              value="Hafiz Retail POS"
            />

            <InfoBox
              label="Version"
              value="1.0.0"
            />

            <InfoBox
              label="Environment"
              value="Frontend"
            />

          </div>

        </section>

        {/* BOTTOM SAVE */}
        <div className="flex justify-end pb-6">

          <button
            type="button"
            onClick={saveSettings}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            Save Settings
          </button>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   SECTION HEADER
===================================================== */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 p-5 sm:p-6">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
        {icon}
      </div>

      <div>
        <h2 className="font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

    </div>
  );
}

/* =====================================================
   INPUT FIELD
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
   TOGGLE
===================================================== */

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">

      <div>

        <p className="text-sm font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>

      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() =>
          onChange(!checked)
        }
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked
            ? "bg-blue-600"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>

    </div>
  );
}

/* =====================================================
   INFO BOX
===================================================== */

function InfoBox({
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