"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import RequireRole from "@/components/auth/require-role";
import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminHeader from "@/components/admin/admin-header";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleMobileMenuClick = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <RequireRole roles={["admin"]}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={closeMobileSidebar}
          />
        )}

        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <AdminSidebar
            isCollapsed={false}
            onToggle={toggleSidebar}
            isMobile={true}
            onCloseMobile={closeMobileSidebar}
          />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar
            isCollapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            isMobile={false}
          />
        </div>

        {/* Main Content */}
        <div className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}>
          {/* Header */}
          <AdminHeader onMobileMenuClick={handleMobileMenuClick} />

          {/* Page Content */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </RequireRole>
  );
}