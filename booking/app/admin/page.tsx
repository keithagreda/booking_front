"use client";

import Link from "next/link";

const SECTIONS = [
  { href: "/admin/games", label: "Games", desc: "Create and manage games" },
  { href: "/admin/rooms", label: "Rooms", desc: "Courts, tables, prices" },
  { href: "/admin/payments", label: "Payments", desc: "Review GCash proofs" },
];

export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-pitch pt-28 pb-28">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-chalk/25 block mb-3">
          Console
        </span>
        <h1 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] uppercase tracking-[0.02em] text-chalk leading-none mb-12">
          Admin
        </h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-chalk/8">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="bg-pitch p-7 hover:bg-court transition flex flex-col gap-4 min-h-[160px]"
            >
              <div className="font-display text-2xl text-chalk">{s.label}</div>
              <div className="font-sans text-xs text-chalk/50">{s.desc}</div>
              <div className="mt-auto font-mono text-[9px] tracking-[0.25em] uppercase text-ace">
                Manage →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
