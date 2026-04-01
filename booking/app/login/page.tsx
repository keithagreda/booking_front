"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-display text-4xl uppercase tracking-wide text-chalk">
            Welcome back
          </h1>
          <p className="mt-2 font-mono text-[10px] tracking-[0.25em] uppercase text-chalk/40">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-chalk/18 bg-transparent text-chalk text-sm px-4 py-3 outline-none transition-colors focus:border-ace placeholder:text-chalk/25 font-sans"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-chalk/18 bg-transparent text-chalk text-sm px-4 py-3 outline-none transition-colors focus:border-ace placeholder:text-chalk/25 font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ace text-pitch font-bold text-[11px] tracking-[0.18em] uppercase py-3.5 transition-all hover:bg-chalk disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center font-mono text-[10px] tracking-[0.15em] uppercase text-chalk/40">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-bold text-ace transition-colors hover:text-chalk"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
