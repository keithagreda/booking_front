import { AuthProvider } from "@/lib/auth-context";
import AdminSidebarClient from "@/components/AdminSidebarClient";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminSidebarClient>
        {children}
      </AdminSidebarClient>
    </AuthProvider>
  );
}
