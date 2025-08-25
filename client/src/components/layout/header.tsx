import { Bell } from "lucide-react";
import React from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user, logout } = useAuth();

  const getPageTitle = () => {
    const path = window.location.pathname;
    const titles: Record<string, string> = {
      "/": "Dashboard",
      "/dashboard": "Dashboard",
      "/chat": "Chat Development",
      "/projects": "Projects",
      "/servers": "MCP Servers",
      "/marketplace": "Marketplace",
      "/analytics": "Analytics",
      "/billing": "Billing",
      "/admin": "Admin Panel",
    };
    return titles[path] || "Dashboard";
  };

  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
          {getPageTitle()}
        </h1>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" data-testid="button-notifications">
            <Bell size={20} className="text-gray-500" />
          </Button>
          <div className="relative flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900" data-testid="text-user-name">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500" data-testid="text-user-plan">
                {user?.plan || "Free Plan"}
              </p>
            </div>
            <button
              className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium focus:outline-none"
              onClick={() => setDropdownOpen((open) => !open)}
              aria-label="User menu"
              type="button"
            >
              {initials}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-12 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => { logout(); setDropdownOpen(false); }}
                  data-testid="button-logout"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
