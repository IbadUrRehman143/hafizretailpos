"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

type Settings = {
  id?: number;
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

const defaultSettings: Settings = {
  businessName: "Hafiz Retail POS",
  phone: "",
  email: "",
  address: "",
  currency: "PKR",
  invoicePrefix: "INV-",
  taxEnabled: false,
  taxRate: "0",
  lowStockAlert: true,
  lowStockLimit: "5",
  whatsappEnabled: false,
  autoPrint: false,
};

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function stringValue(
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

function booleanValue(
  value: unknown,
  fallback = false
) {
  return typeof value === "boolean"
    ? value
    : fallback;
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
        `Server returned invalid response (${response.status}).`
      );
    }
  }

  if (!response.ok) {
    const message =
      isRecord(data) &&
      typeof data.message === "string"
        ? data.message
        : `Request failed (${response.status}).`;

    throw new Error(message);
  }

  return data;
}

function cleanDecimal(value: string) {
  let cleaned = value.replace(
    /[^0-9.]/g,
    ""
  );

  const firstDot =
    cleaned.indexOf(".");

  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned
        .slice(firstDot + 1)
        .replace(/\./g, "");
  }

  return cleaned;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] =
    useState<Settings>(
      defaultSettings
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [passwordSuccess, setPasswordSuccess] =
    useState("");

  const loadSettings =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/settings",
          {
            cache: "no-store",
          }
        );

        const data =
          await readResponse(response);

        if (!isRecord(data)) {
          throw new Error(
            "Invalid settings response."
          );
        }

        const raw = isRecord(
          data.settings
        )
          ? data.settings
          : data;

        setSettings({
          id:
            typeof raw.id === "number"
              ? raw.id
              : undefined,

          businessName: stringValue(
            raw.businessName,
            "Hafiz Retail POS"
          ),

          phone: stringValue(
            raw.phone
          ),

          email: stringValue(
            raw.email
          ),

          address: stringValue(
            raw.address
          ),

          currency: stringValue(
            raw.currency,
            "PKR"
          ),

          invoicePrefix: stringValue(
            raw.invoicePrefix,
            "INV-"
          ),

          taxEnabled: booleanValue(
            raw.taxEnabled
          ),

          taxRate: stringValue(
            raw.taxRate,
            "0"
          ),

          lowStockAlert: booleanValue(
            raw.lowStockAlert,
            true
          ),

          lowStockLimit: stringValue(
            raw.lowStockLimit,
            "5"
          ),

          whatsappEnabled:
            booleanValue(
              raw.whatsappEnabled
            ),

          autoPrint: booleanValue(
            raw.autoPrint
          ),
        });
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load settings."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function updateField<
    K extends keyof Settings
  >(
    field: K,
    value: Settings[K]
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  }

  async function saveSettings() {
    if (
      !settings.businessName.trim()
    ) {
      setError("Business name is required.");
      return;
    }

    if (
      !settings.invoicePrefix.trim()
    ) {
      setError("Invoice prefix is required.");
      return;
    }

    const taxRate =
      Number(settings.taxRate || 0);

    const lowStockLimit =
      Number(
        settings.lowStockLimit || 0
      );

    if (
      !Number.isFinite(taxRate) ||
      taxRate < 0
    ) {
      setError("Enter a valid tax rate.");
      return;
    }

    if (
      !Number.isFinite(
        lowStockLimit
      ) ||
      lowStockLimit < 0
    ) {
      setError("Enter a valid low stock limit.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const response = await fetch(
        "/api/settings",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            businessName:
              settings.businessName.trim(),

            phone:
              settings.phone.trim(),

            email:
              settings.email.trim(),

            address:
              settings.address.trim(),

            currency:
              settings.currency,

            invoicePrefix:
              settings.invoicePrefix.trim(),

            taxEnabled:
              settings.taxEnabled,

            taxRate,

            lowStockAlert:
              settings.lowStockAlert,

            lowStockLimit,

            whatsappEnabled:
              settings.whatsappEnabled,

            autoPrint:
              settings.autoPrint,
          }),
        }
      );

      await readResponse(response);

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  }


  async function changePassword() {
    setPasswordError("");
    setPasswordSuccess("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Please fill all password fields."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await fetch(
        "/api/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await readResponse(response);

      if (
        !isRecord(data) ||
        data.success !== true
      ) {
        throw new Error(
          "Password update failed."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordSuccess(
        "Password changed successfully."
      );
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Password update failed."
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 sm:p-10">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-6">
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
                Settings
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage POS and business settings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>
        </div>

        {saved && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            ✓ Settings saved successfully.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <SettingsSection
          icon="🏢"
          title="Business Information"
          description="Basic information about your business"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InputField
              label="Business Name *"
              value={
                settings.businessName
              }
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
              placeholder="03001234567"
              inputMode="numeric"
              onChange={(value) =>
                updateField(
                  "phone",
                  value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
            />

            <InputField
              label="Email"
              value={settings.email}
              type="email"
              placeholder="info@example.com"
              onChange={(value) =>
                updateField(
                  "email",
                  value
                )
              }
            />

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Currency
              </label>

              <select
                value={
                  settings.currency
                }
                onChange={(event) =>
                  updateField(
                    "currency",
                    event.target.value
                  )
                }
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
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

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Business Address
              </label>

              <textarea
                value={
                  settings.address
                }
                rows={3}
                onChange={(event) =>
                  updateField(
                    "address",
                    event.target.value
                  )
                }
                placeholder="Enter business address"
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          icon="🧾"
          title="Invoice Settings"
          description="Configure invoice and billing options"
        >
          <div className="max-w-md">
            <InputField
              label="Invoice Prefix *"
              value={
                settings.invoicePrefix
              }
              placeholder="INV-"
              onChange={(value) =>
                updateField(
                  "invoicePrefix",
                  value.toUpperCase()
                )
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon="💰"
          title="Tax Settings"
          description="Manage invoice tax calculation"
        >
          <div className="space-y-5">
            <ToggleRow
              title="Enable Tax"
              description="Automatically calculate tax on invoices"
              checked={
                settings.taxEnabled
              }
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
                  value={
                    settings.taxRate
                  }
                  placeholder="0"
                  inputMode="decimal"
                  onChange={(value) =>
                    updateField(
                      "taxRate",
                      cleanDecimal(
                        value
                      )
                    )
                  }
                />
              </div>
            )}
          </div>
        </SettingsSection>

        <SettingsSection
          icon="📦"
          title="Inventory Settings"
          description="Configure stock alerts"
        >
          <div className="space-y-5">
            <ToggleRow
              title="Low Stock Alert"
              description="Notify when stock reaches low-stock limit"
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
                  placeholder="5"
                  inputMode="decimal"
                  onChange={(value) =>
                    updateField(
                      "lowStockLimit",
                      cleanDecimal(
                        value
                      )
                    )
                  }
                />
              </div>
            )}
          </div>
        </SettingsSection>

        <SettingsSection
          icon="🔔"
          title="Notifications & Printing"
          description="Configure notification and printing preferences"
        >
          <div className="space-y-4">
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
              checked={
                settings.autoPrint
              }
              onChange={(checked) =>
                updateField(
                  "autoPrint",
                  checked
                )
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon="🔐"
          title="Security & Password"
          description="Manage your account password and security"
        >
          <div className="max-w-2xl space-y-5">
            <PasswordField
              label="Current Password"
              value={currentPassword}
              placeholder="Enter current password"
              showPassword={showCurrentPassword}
              onToggleShow={() =>
                setShowCurrentPassword(
                  (current) => !current
                )
              }
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <PasswordField
                label="New Password"
                value={newPassword}
                placeholder="Enter new password"
                showPassword={showNewPassword}
                onToggleShow={() =>
                  setShowNewPassword(
                    (current) => !current
                  )
                }
                onChange={setNewPassword}
                autoComplete="new-password"
              />

              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                placeholder="Confirm new password"
                showPassword={showConfirmPassword}
                onToggleShow={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />
            </div>

            <p className="text-xs text-slate-500">
              Password must be at least 8 characters and contain at least one letter and one number.
            </p>

            {passwordError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                ✓ {passwordSuccess}
              </div>
            )}

            <button
              type="button"
              onClick={changePassword}
              disabled={passwordLoading}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {passwordLoading
                ? "Changing Password..."
                : "Change Password"}
            </button>
          </div>
        </SettingsSection>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            icon="⚙️"
            title="System Information"
            description="Current application information"
          />

          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-5 md:p-6">
            <InfoBox
              label="Application"
              value="Hafiz Retail POS"
            />

            <InfoBox
              label="Version"
              value="1.0.0"
            />

            <InfoBox
              label="Database"
              value="PostgreSQL"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <SectionHeader
        icon={icon}
        title={title}
        description={description}
      />

      <div className="p-4 sm:p-5 md:p-6">
        {children}
      </div>
    </section>
  );
}

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
    <div className="flex items-start gap-3 border-b border-slate-200 p-4 sm:items-center sm:p-5 md:p-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg sm:h-11 sm:w-11 sm:text-xl">
        {icon}
      </div>

      <div className="min-w-0">
        <h2 className="break-words font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 break-words text-xs text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  placeholder,
  type = "text",
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  inputMode?:
    | "text"
    | "numeric"
    | "decimal"
    | "email"
    | "tel";
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function PasswordField({
  label,
  value,
  placeholder,
  showPassword,
  onToggleShow,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  placeholder: string;
  showPassword: boolean;
  onToggleShow: () => void;
  onChange: (value: string) => void;
  autoComplete:
    | "current-password"
    | "new-password";
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          type={
            showPassword
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
          title={
            showPassword
              ? "Hide password"
              : "Show password"
          }
        >
          {showPassword ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:gap-4 sm:p-4">
      <div className="min-w-0">
        <p className="break-words text-sm font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-1 break-words text-xs text-slate-500">
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
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

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