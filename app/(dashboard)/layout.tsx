"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useDashboardLayoutStore } from "@/lib/state/stores";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { FullPageLoader } from "@/components/ui/loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, initialized } = useAuth();
  const isSidebarOpen = useDashboardLayoutStore((state) => state.isSidebarOpen);
  const toggleSidebar = useDashboardLayoutStore((state) => state.toggleSidebar);

  if (!initialized || loading) {
    return <FullPageLoader />;
  }

  return (
    <div className="h-screen relative overflow-y-hidden overflow-x-visible bg-white">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "#ffffff",
          backgroundImage: `
            radial-gradient(circle at top center, rgba(59, 130, 246, 0.5), transparent 70%)
          `,
        }}
      />

      <div className="relative z-10 h-full flex flex-col">
        <Navbar />
        <div className="flex flex-1 min-h-0">
          <Sidebar isOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
          <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
