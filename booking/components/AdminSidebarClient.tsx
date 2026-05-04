"use client";

import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminSidebarClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="fixed inset-0 bg-zinc-950 text-zinc-100 font-sans overflow-auto">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div
        className={`transition-[margin] duration-300 min-h-screen ${
          collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
        }`}
      >
        <div className="pt-14 lg:pt-0">
          <main className="p-6 lg:p-10 max-w-7xl">{children}</main>
        </div>
      </div>
    </div>
  );
}
