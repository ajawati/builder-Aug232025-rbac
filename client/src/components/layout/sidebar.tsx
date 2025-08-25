import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  MessageCircle, 
  Folder, 
  Server, 
  Store, 
  TrendingUp, 
  CreditCard, 
  Settings,
  Box
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Chat Development", href: "/chat", icon: MessageCircle },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "MCP Servers", href: "/servers", icon: Server },
  { name: "Marketplace", href: "/marketplace", icon: Store },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Admin", href: "/admin", icon: Settings },
];

// Persona -> allowed hrefs
const PERSONA_ALLOWED: Record<string, string[]> = {
  super_admin: navigation.map((n) => n.href),
  builder: ["/dashboard", "/chat", "/projects", "/servers", "/marketplace", "/analytics", "/billing"],
  end_user: ["/marketplace"],
};

import { useAuth } from "@/lib/auth";

export default function Sidebar() {
  const [location] = useLocation();
  const auth = useAuth();

  const persona = auth.user?.persona || null;
  const allowed = persona ? PERSONA_ALLOWED[persona] || [] : [];

  const visibleNavigation = persona ? navigation.filter((item) => allowed.includes(item.href)) : [];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="gradient-brand w-10 h-10 rounded-lg flex items-center justify-center">
            <Box size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg">MCP Builder</h1>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {visibleNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer",
                  isActive && "sidebar-active"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
  })}
      </nav>
    </div>
  );
}
