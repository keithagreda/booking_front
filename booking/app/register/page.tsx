"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber || undefined,
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-chalk/18 bg-transparent text-chalk text-sm px-4 py-3 outline-none transition-colors focus:border-ace placeholder:text-chalk/25 font-sans";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-display text-4xl uppercase tracking-wide text-chalk">
            Create an account
          </h1>
          <p className="mt-2 font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/40">
            Sign up to start booking
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="firstName"
                className="mb-1.5 block font-mono text-[8px] tracking-[0.35em] uppercase text-chalk/35"
              >
                First name
              </label>
              <input
                id="firstName"
                required
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="mb-1.5 block font-mono text-[8px] tracking-[0.35em] uppercase text-chalk/35"
              >
                Last name
              </label>
              <input
                id="lastName"
                required
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block font-mono text-[8px] tracking-[0.35em] uppercase text-chalk/35"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="mb-1.5 block font-mono text-[8px] tracking-[0.35em] uppercase text-chalk/35"
            >
              Phone number{" "}
              <span className="text-chalk/25">(optional)</span>
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => update("phoneNumber", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block font-mono text-[8px] tracking-[0.35em] uppercase text-chalk/35"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block font-mono text-[8px] tracking-[0.35em] uppercase text-chalk/35"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ace text-pitch font-bold text-[11px] tracking-[0.18em] uppercase py-3.5 transition-all hover:bg-chalk disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center font-mono text-[10px] tracking-[0.15em] uppercase text-chalk/40">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-ace transition-colors hover:text-chalk"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
