import { Switch, Route, Link, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { Shield, Key, LayoutDashboard, FileText, LogOut, Code2, MessageSquare, User } from "lucide-react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import "@/i18n/config";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import ApiKeys from "@/pages/ApiKeys";
import Login from "@/pages/Login";
import RegisterPage from "@/pages/RegisterPage";
import ApiDocs from "@/pages/ApiDocs";
import IntegrationHelper from "@/pages/integration-helper";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import VerifyResetCodePage from "@/pages/VerifyResetCodePage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import NotFound from "@/pages/not-found";

const dashboardMenuItems = [
  { titleKey: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard },
  { titleKey: "nav.apiKeys", url: "/api-keys", icon: Key },
  { titleKey: "nav.chat", url: "/chat", icon: MessageSquare },
  { titleKey: "nav.profile", url: "/profile", icon: User },
  { titleKey: "nav.integrationHelper", url: "/integration-helper", icon: Code2 },
  { titleKey: "nav.apiDocs", url: "/api-docs", icon: FileText },
];

function AppSidebar() {
  const [location] = useLocation();
  const { developer, logout } = useAuth();
  const { t } = useTranslation();

  if (!developer) return null;

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-4 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" data-testid="icon-logo" />
            <SidebarGroupLabel className="text-lg font-bold">ProofCaptcha</SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardMenuItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`menu-item-${item.titleKey.split('.')[1]}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function ProtectedRoute({ component: Component, requireVerification = true }: { component: () => JSX.Element; requireVerification?: boolean }) {
  const { developer, isLoading } = useAuth();
  const { t } = useTranslation();
  const [location] = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">{t('common.loading')}</div>;
  }

  if (!developer) {
    return <Redirect to="/login" />;
  }

  // If user is not verified and trying to access protected pages (not verify-email itself)
  if (requireVerification && !developer.isEmailVerified && location !== "/verify-email") {
    return <Redirect to="/verify-email" />;
  }

  // If user is already verified and trying to access verify-email page
  if (developer.isEmailVerified && location === "/verify-email") {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function PublicRoute({ component: Component }: { component: () => JSX.Element }) {
  const { developer, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">{t('common.loading')}</div>;
  }

  if (developer) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login">{() => <PublicRoute component={Login} />}</Route>
      <Route path="/register">{() => <PublicRoute component={RegisterPage} />}</Route>
      <Route path="/forgot-password">{() => <PublicRoute component={ForgotPasswordPage} />}</Route>
      <Route path="/verify-reset-code">{() => <PublicRoute component={VerifyResetCodePage} />}</Route>
      <Route path="/reset-password">{() => <PublicRoute component={ResetPasswordPage} />}</Route>
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/verify-email">{() => <ProtectedRoute component={VerifyEmailPage} requireVerification={false} />}</Route>
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/api-keys">{() => <ProtectedRoute component={ApiKeys} />}</Route>
      <Route path="/chat">{() => <ProtectedRoute component={Chat} />}</Route>
      <Route path="/profile">{() => <ProtectedRoute component={Profile} />}</Route>
      <Route path="/integration-helper">{() => <ProtectedRoute component={IntegrationHelper} />}</Route>
      <Route path="/api-docs">{() => <ProtectedRoute component={ApiDocs} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { developer, logout } = useAuth();
  const { t } = useTranslation();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (!developer) {
    return (
      <div className="min-h-screen">
        <Router />
      </div>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <span className="text-sm text-muted-foreground" data-testid="text-developer-email">
                {developer.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={logout} data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-2" />
                {t('nav.logout')}
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
