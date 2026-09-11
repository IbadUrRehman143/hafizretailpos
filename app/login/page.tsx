"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

export default function LoginPage() {
  const [setupRequired, setSetupRequired] =
    useState(false);

  const [checkingSetup, setCheckingSetup] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [name, setName] =
    useState("Super Admin");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  /* =====================================================
     CHECK FIRST-TIME SETUP
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function checkSetup() {
      try {
        const res = await fetch(
          "/api/auth/setup",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (mounted) {
          setSetupRequired(
            Boolean(data.setupRequired)
          );
        }
      } catch {
        if (mounted) {
          setMessage(
            "Unable to check authentication setup."
          );
        }
      } finally {
        if (mounted) {
          setCheckingSetup(false);
        }
      }
    }

    checkSetup();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     LOGIN / SETUP
  ===================================================== */

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading || checkingSetup) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const endpoint = setupRequired
        ? "/api/auth/setup"
        : "/api/auth/login";

      const res = await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        credentials: "same-origin",

        body: JSON.stringify({
          name: name.trim(),
          email: email
            .trim()
            .toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(
          data?.message ||
            (setupRequired
              ? "Unable to create admin."
              : "Unable to login.")
        );

        return;
      }

      /*
       * Full browser navigation.
       *
       * Session cookie login response ke baad
       * browser fresh /dashboard request karega.
       */
      window.location.replace(
        "/dashboard"
      );
    } catch (error) {
      console.error(
        "LOGIN PAGE ERROR:",
        error
      );

      setMessage(
        "Server connection failed."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">

        {/* HEADER */}

        <div className="mb-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
            <LockKeyhole size={24} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Hafiz Retail POS
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {checkingSetup
              ? "Checking authentication..."
              : setupRequired
                ? "First-time Super Admin setup"
                : "Sign in to continue"}
          </p>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* NAME */}

          {setupRequired && (
            <label className="block">
              <span className="text-sm font-medium text-slate-900">
                Name
              </span>

              <div className="mt-1 flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-slate-500">
                <UserRound
                  size={17}
                  className="shrink-0 text-slate-500"
                />

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  required
                  autoComplete="name"
                  className="w-full bg-transparent p-3 outline-none"
                  placeholder="Super Admin"
                />
              </div>
            </label>
          )}

          {/* EMAIL */}

          <label className="block">
            <span className="text-sm font-medium text-slate-900">
              Email
            </span>

            <div className="mt-1 flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-slate-500">
              <Mail
                size={17}
                className="shrink-0 text-slate-500"
              />

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                required
                autoComplete="email"
                placeholder="admin@hafizpos.com"
                className="w-full bg-transparent p-3 outline-none"
              />
            </div>
          </label>

          {/* PASSWORD */}

          <label className="block">
            <span className="text-sm font-medium text-slate-900">
              Password
            </span>

            <div className="mt-1 flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-slate-500">

              <LockKeyhole
                size={17}
                className="shrink-0 text-slate-500"
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                required
                minLength={8}
                autoComplete={
                  setupRequired
                    ? "new-password"
                    : "current-password"
                }
                placeholder="Enter password"
                className="w-full bg-transparent p-3 outline-none"
              />

              {/* EYE BUTTON */}

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {showPassword ? (
                  <EyeOff
                    size={18}
                  />
                ) : (
                  <Eye
                    size={18}
                  />
                )}
              </button>
            </div>
          </label>

          {/* ERROR MESSAGE */}

          {message && (
            <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              {message}
            </p>
          )}

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={
              loading ||
              checkingSetup
            }
            className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checkingSetup
              ? "Checking..."
              : loading
                ? "Please wait..."
                : setupRequired
                  ? "Create Admin & Login"
                  : "Login"}
          </button>

          {/* FIRST SETUP INFO */}

          {setupRequired && (
            <p className="text-xs text-slate-500">
              Password must be at least
              8 characters and should
              contain letters and numbers.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}