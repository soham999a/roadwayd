import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, Building2, FileText, Activity, Settings, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: LinkProps["to"]; label: string; icon: ReactNode };

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  { to: "/companies", label: "Companies", icon: <Building2 className="size-4" /> },
  { to: "/quotation", label: "Quotation", icon: <FileText className="size-4" /> },
  { to: "/activity", label: "Today's Activity", icon: <Activity className="size-4" /> },
  { to: "/settings", label: "Settings", icon: <Settings className="size-4" /> },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
          <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Truck className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Popular Roadways</div>
            <div className="text-[11px] text-sidebar-foreground/70">Logistics Manager</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 text-[11px] text-sidebar-foreground/60 border-t border-sidebar-border">
          © {new Date().getFullYear()} Popular Roadways
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-sidebar text-sidebar-foreground">
          <div className="flex items-center gap-2">
            <Truck className="size-5" />
            <span className="font-semibold text-sm">Popular Roadways</span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden">{children}</main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
          {navItems.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 flex-1 py-2 text-[10px] transition-colors",
                  active
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground/90",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
