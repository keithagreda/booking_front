"use client";

import Link from "next/link";
import UpcomingEvents from "@/components/UpcomingEvents";

const SECTIONS = [
  { href: "/admin/bookings", label: "Bookings", desc: "Create & manage all bookings", icon: "bookings" },
  { href: "/admin/schedule", label: "Schedule", desc: "Calendar view", icon: "calendar" },
  { href: "/admin/games", label: "Games", desc: "Create and manage games", icon: "game" },
  { href: "/admin/rooms", label: "Rooms", desc: "Courts, tables, prices", icon: "room" },
  { href: "/admin/payments", label: "Payments", desc: "Review GCash proofs", icon: "payment" },
  { href: "/admin/users", label: "Users", desc: "Accounts, roles, bans", icon: "users" },
  { href: "/admin/audit-logs", label: "Audit Logs", desc: "Request & error logs", icon: "audit" },
];

export default function AdminHomePage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-[0.05em] text-white uppercase">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage your venue — games, rooms, and payments.
        </p>
      </div>

      <UpcomingEvents hours={48} />

      <div className="mt-8">
        <h2 className="font-display text-lg tracking-[0.05em] text-white uppercase mb-4">
          Quick Access
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group block rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700 hover:bg-zinc-900 transition"
            >
              <div className="font-medium text-lg text-zinc-100 mb-1 group-hover:text-white transition">
                {s.label}
              </div>
              <div className="text-sm text-zinc-500">{s.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
