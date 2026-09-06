"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, UserRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [setupRequired, setSetupRequired] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("Super Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSetup() {
      try {
        const res = await fetch("/api/auth/setup", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (mounted) {
          setSetupRequired(Boolean(data.setupRequired));
        }
      } catch {
        if (mounted) {
          setMessage("Unable to check authentication setup.");
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading || checkingSetup) return;

    setLoading(true);
    setMessage("");

    try {
      const endpoint = setupRequired
        ? "/api/auth/setup"
        : "/api/auth/login";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
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

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setMessage("Server connection failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {setupRequired && (
            <label className="block">
              <span className="text-sm font-medium text-slate-900">
                Name
              </span>

              <div className="mt-1 flex items-center rounded-lg border border-slate-300 px-3">
                <UserRound size={17} className="text-slate-500" />

                <input
                  type="text"
                  className="w-full bg-transparent p-3 outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-slate-900">
              Email
            </span>

            <div className="mt-1 flex items-center rounded-lg border border-slate-300 px-3">
              <Mail size={17} className="text-slate-500" />

              <input
                type="email"
                className="w-full bg-transparent p-3 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@hafizpos.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-900">
              Password
            </span>

            <div className="mt-1 flex items-center rounded-lg border border-slate-300 px-3">
              <LockKeyhole size={17} className="text-slate-500" />

              <input
                type="password"
                className="w-full bg-transparent p-3 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={
                  setupRequired ? "new-password" : "current-password"
                }
                placeholder="Enter password"
              />
            </div>
          </label>

          {message && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || checkingSetup}
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

          {setupRequired && (
            <p className="text-xs text-slate-500">
              Password must be at least 8 characters and should contain
              letters and numbers.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}