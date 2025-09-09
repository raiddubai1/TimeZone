"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, User, LogOut, Loader2, ChevronDown, Calculator, Calendar, Settings, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Main navigation items (excluding About and Contact as requested)
const mainNavigationItems = [
  { name: "Home", href: "/", roles: ["user", "manager", "admin"] },
  { name: "Teams", href: "/teams", roles: ["user", "manager", "admin"] },
  { name: "Calculators", href: "/calculators", roles: ["user", "manager", "admin"] },
  { name: "Meeting Scheduler", href: "/scheduler", roles: ["user", "manager", "admin"] },
  { name: "Preferences", href: "/preferences", roles: ["user", "manager", "admin"] },
  { name: "AI Assistant", href: "/ai-assistant", roles: ["user", "manager", "admin"] },
];

// Tools dropdown items
const toolsDropdownItems = [
  { name: "Time Zone Converter", href: "/converter", icon: Calculator, description: "Convert time between cities instantly" },
  { name: "World Clock", href: "/tools", icon: Calendar, description: "View multiple time zones at once" },
  { name: "Working Hours Calculator", href: "/calculators", icon: Calculator, description: "Calculate business hours across time zones" },
];

// Role-based navigation items
const roleBasedItems = [
  { name: "Manager Dashboard", href: "/manager-dashboard", roles: ["manager", "admin"] },
  { name: "Admin Dashboard", href: "/admin-dashboard", roles: ["admin"] },
];

// Helper function to get navigation items based on user role
const getNavigationItems = (role: string | null) => {
  if (!role) return mainNavigationItems.filter(item => item.roles.includes("user"));
  return [...mainNavigationItems.filter(item => item.roles.includes(role)), 
          ...roleBasedItems.filter(item => item.roles.includes(role))];
};

// Desktop Navigation Item Component
const DesktopNavItem = ({ item, isActive }: { item: any; isActive: boolean }) => (
  <Link
    href={item.href}
    className={cn(
      "relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg",
      "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
      "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
      "after:w-0 after:h-0.5 after:bg-orange-500 after:transition-all after:duration-300",
      "hover:after:w-3/4",
      isActive && "text-gray-900 after:w-3/4"
    )}
  >
    {item.name}
  </Link>
);

// Tools Dropdown Component
const ToolsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg",
            "text-gray-600 hover:text-gray-900 hover:bg-gray-100 group",
            "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
            "after:w-0 after:h-0.5 after:bg-orange-500 after:transition-all after:duration-300",
            "hover:after:w-3/4",
            isOpen && "text-gray-900 after:w-3/4"
          )}
        >
          <span>Tools</span>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-white border border-gray-200 rounded-xl shadow-xl"
        align="start"
        sideOffset={8}
      >
        <div className="p-2">
          <div className="px-3 py-2 text-sm font-semibold text-gray-900 border-b border-gray-100">
            Time Zone Tools
          </div>
          {toolsDropdownItems.map((item) => (
            <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 group-hover:text-orange-600">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.description}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Mobile Navigation Item Component
const MobileNavItem = ({ item, onClick }: { item: any; onClick: () => void }) => (
  <Link
    href={item.href}
    onClick={onClick}
    className="flex items-center justify-between w-full px-4 py-4 text-lg font-medium text-gray-300 hover:text-orange-400 hover:bg-gray-800 rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-orange-500"
  >
    <span>{item.name}</span>
    <span className="transform transition-transform duration-300 group-hover:translate-x-1 text-gray-500 group-hover:text-orange-400">
      →
    </span>
  </Link>
);

// Mobile Tools Dropdown Component
const MobileToolsDropdown = ({ onItemClick }: { onItemClick: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-4 text-lg font-medium text-gray-300 hover:text-orange-400 hover:bg-gray-800 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
        aria-expanded={isOpen}
        aria-controls="tools-dropdown"
      >
        <span>Tools</span>
        <ChevronDown className={cn(
          "w-5 h-5 transition-transform duration-300 text-gray-500",
          isOpen && "rotate-180 text-orange-400"
        )} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="tools-dropdown"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="pl-4 space-y-2 overflow-hidden"
          >
            {toolsDropdownItems.map((item) => (
              <Link key={item.name} href={item.href} onClick={onItemClick}>
                <div className="flex items-start space-x-3 p-4 text-gray-400 hover:text-orange-400 hover:bg-gray-800 rounded-xl transition-all duration-200 cursor-pointer group">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                    <item.icon className="w-5 h-5 text-orange-500 group-hover:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-gray-300 group-hover:text-orange-400">
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 group-hover:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  // Get navigation items based on user role
  const navigation = getNavigationItems(session?.user?.role || null);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleSignIn = () => {
    window.location.href = "/auth/signin";
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav 
      role="navigation" 
      aria-label="Main navigation"
      className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
              aria-label="TimeZone Home"
            >
              <div className="text-2xl font-bold">
                <span className="text-gray-900">Time</span>
                <span className="text-orange-500">Zone</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <div className="flex items-center space-x-1">
              {navigation.slice(0, 2).map((item) => (
                <DesktopNavItem key={item.name} item={item} isActive={false} />
              ))}
              
              {/* Tools Dropdown */}
              <div className="relative">
                <ToolsDropdown />
              </div>
              
              {navigation.slice(2).map((item) => (
                <DesktopNavItem key={item.name} item={item} isActive={false} />
              ))}
            </div>

            {/* Authentication Section */}
            <div className="flex items-center ml-4 space-x-3">
              {status === "loading" ? (
                <div className="flex items-center space-x-2 px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-9 w-9 rounded-full hover:bg-gray-100"
                      aria-label="User menu"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                        <AvatarFallback>
                          {session.user?.name?.charAt(0).toUpperCase() || 
                           session.user?.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-3">
                      <p className="text-sm font-medium leading-none text-gray-900">
                        {session.user?.name || "User"}
                      </p>
                      <p className="text-xs leading-none text-gray-500">
                        {session.user?.email}
                      </p>
                      <div className="flex items-center space-x-1 mt-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          {session.user?.role || "user"}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/preferences">
                        <User className="mr-2 h-4 w-4" />
                        <span>Preferences</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={handleSignIn}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Mobile Authentication */}
            {status === "loading" ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 rounded-full"
                    aria-label="User menu"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                      <AvatarFallback className="text-xs">
                        {session.user?.name?.charAt(0).toUpperCase() || 
                         session.user?.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-3">
                    <p className="text-sm font-medium leading-none text-gray-900">
                      {session.user?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-gray-500">
                      {session.user?.email}
                    </p>
                    <div className="flex items-center space-x-1 mt-2">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {session.user?.role || "user"}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/preferences" onClick={closeMobileMenu}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Preferences</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { handleSignOut(); closeMobileMenu(); }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={handleSignIn}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200"
              >
                Sign In
              </Button>
            )}

            {/* Mobile menu trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-900 hover:text-gray-600 hover:bg-gray-100 h-9 w-9"
                  aria-label="Open mobile menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[300px] sm:w-[350px] bg-gray-900 border-gray-800 p-0"
                aria-label="Mobile navigation menu"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <div className="text-xl font-bold">
                      <span className="text-white">Time</span>
                      <span className="text-orange-500">Zone</span>
                    </div>
                  </div>

                  {/* Navigation Items */}
                  <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6">
                    {navigation.slice(0, 2).map((item) => (
                      <MobileNavItem key={item.name} item={item} onClick={closeMobileMenu} />
                    ))}
                    
                    {/* Mobile Tools Dropdown */}
                    <div className="border-b border-gray-800 pb-6">
                      <MobileToolsDropdown onItemClick={closeMobileMenu} />
                    </div>
                    
                    {navigation.slice(2).map((item) => (
                      <MobileNavItem key={item.name} item={item} onClick={closeMobileMenu} />
                    ))}
                  </div>

                  {/* Mobile Authentication Section */}
                  <div className="p-6 border-t border-gray-800 bg-gray-900">
                    {status === "loading" ? (
                      <div className="flex items-center justify-center space-x-2 py-3">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-400">Loading...</span>
                      </div>
                    ) : session ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-xl">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                            <AvatarFallback className="text-sm bg-orange-500 text-white">
                              {session.user?.name?.charAt(0).toUpperCase() || 
                               session.user?.email?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-white truncate">
                              {session.user?.name || "User"}
                            </p>
                            <p className="text-sm text-gray-400 truncate">
                              {session.user?.email}
                            </p>
                            <div className="flex items-center space-x-1 mt-2">
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                {session.user?.role || "user"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Link
                            href="/preferences"
                            className="flex items-center space-x-3 w-full px-4 py-3 text-lg text-gray-300 hover:text-orange-400 hover:bg-gray-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                            onClick={closeMobileMenu}
                          >
                            <User className="w-5 h-5" />
                            <span className="font-medium">Preferences</span>
                          </Link>
                          <button
                            onClick={() => { handleSignOut(); closeMobileMenu(); }}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-lg text-gray-300 hover:text-orange-400 hover:bg-gray-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Sign out</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => { handleSignIn(); closeMobileMenu(); }}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}