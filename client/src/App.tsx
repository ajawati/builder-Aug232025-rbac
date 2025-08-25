import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";

import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ChatDevelopment from "@/pages/chat-development";
import Projects from "@/pages/projects";
import MCPServers from "@/pages/mcp-servers";
import Marketplace from "@/pages/marketplace";
import Analytics from "@/pages/analytics";
import Billing from "@/pages/billing";
import Admin from "@/pages/admin";
import MainLayout from "@/components/layout/main-layout";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, allowedPersonas }: { component: React.ComponentType, allowedPersonas?: string[] }) {
  const auth = useAuth();
  const [, setProtectedLocation] = useLocation();
  if (!auth.isAuthenticated) {
    return <LoginPage />;
  }
  if (allowedPersonas && auth.user && !allowedPersonas.includes(auth.user.persona)) {
    // Super admin should have access to all pages by default
    if (auth.user.persona === 'super_admin') {
      // allow through
    } else {
      // redirect other personas to their respective dashboards
      if (auth.user.persona === 'builder') setProtectedLocation('/dashboard');
      else setProtectedLocation('/marketplace');
      return null;
    }
  }
  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

function Router() {
  const auth = useAuth();
  const [, setRouterLocation] = useLocation();

  // After login, redirect to persona dashboard
  if (auth.isAuthenticated && auth.user) {
    if (window.location.pathname === "/" || window.location.pathname === "/login") {
      if (auth.user.persona === 'super_admin') setRouterLocation('/admin');
      else if (auth.user.persona === 'builder') setRouterLocation('/dashboard');
      else setRouterLocation('/marketplace');
    }
  }

  return (
    <Switch>
      <Route path="/" component={() => auth.isAuthenticated ? <ProtectedRoute component={Dashboard} allowedPersonas={["builder"]} /> : <LoginPage />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} allowedPersonas={["builder"]} />} />
      <Route path="/chat" component={() => <ProtectedRoute component={ChatDevelopment} allowedPersonas={["builder"]} />} />
      <Route path="/projects" component={() => <ProtectedRoute component={Projects} allowedPersonas={["builder"]} />} />
      <Route path="/servers" component={() => <ProtectedRoute component={MCPServers} allowedPersonas={["builder"]} />} />
      <Route path="/marketplace" component={() => <ProtectedRoute component={Marketplace} allowedPersonas={["end_user","builder"]} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} allowedPersonas={["builder"]} />} />
      <Route path="/billing" component={() => <ProtectedRoute component={Billing} allowedPersonas={["builder"]} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={Admin} allowedPersonas={["super_admin"]} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
