"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Activity, 
  Settings, 
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile: boolean;
  onCloseMobile?: () => void;
}

const navigationItems = [
  {
    name: "Dashboard Home",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    href: "/admin/dashboard/users",
    icon: Users,
  },
  {
    name: "Analytics",
    href: "/admin/dashboard/analytics",
    icon: BarChart3,
  },
  {
    name: "Activity Logs",
    href: "/admin/dashboard/activity-logs",
    icon: Activity,
  },
  {
    name: "Settings",
    href: "/admin/dashboard/settings",
    icon: Settings,
  },
  {
    name: "Notifications",
    href: "/admin/dashboard/notifications",
    icon: Bell,
  },
];

export default function AdminSidebar({ 
  isCollapsed, 
  onToggle, 
  isMobile, 
  onCloseMobile 
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300",
      isMobile ? "fixed inset-y-0 left-0 z-50 w-64" : 
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="text-xl font-bold text-gray-900">Admin</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCloseMobile}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Desktop Toggle Button */}
      {!isMobile && (
        <div className="flex items-center justify-end p-4 border-b border-gray-200">
          <Button variant="ghost" size="icon" onClick={onToggle}>
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Logo */}
      {!isCollapsed && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              <span className="text-gray-900">Time</span>
              <span className="text-orange-500">Zone</span>
            </div>
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
              Admin
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={isMobile ? onCloseMobile : undefined}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-orange-100 text-orange-900"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className={cn(
                "flex-shrink-0",
                isCollapsed ? "mx-auto" : "h-5 w-5"
              )} />
              {!isCollapsed && (
                <span>{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Admin Panel v1.0
          </div>
        </div>
      )}
    </div>
  );
}