import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LocaleToggle } from "@/components/locale-toggle";
import { UserButton } from "@/components/user-button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type NavItem = {
  label: () => string;
  href: string;
  icon: LucideIcon;
};

type NavGroup = {
  label: () => string;
  items: NavItem[];
};

export type { NavItem, NavGroup };

type AppSidebarProps = {
  groups: NavGroup[];
  header?: React.ReactNode;
};

function AppSidebar({ groups, header }: AppSidebarProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <Sidebar collapsible="icon">
      {header && <SidebarHeader>{header}</SidebarHeader>}
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label()}>
            <SidebarGroupLabel>{group.label()}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      render={<Link to={item.href} />}
                      tooltip={item.label()}
                    >
                      <item.icon />
                      <span>{item.label()}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

type SidebarPageHeaderProps = {
  title: string;
  description?: string;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "outline" | "destructive";
  };
  actions?: React.ReactNode;
};

export function SidebarPageHeader({
  title,
  description,
  badge,
  actions,
}: SidebarPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-2">
        {badge ? (
          <Badge className="w-fit" variant={badge.variant ?? "secondary"}>
            {badge.label}
          </Badge>
        ) : null}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-muted-foreground max-w-2xl text-sm">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </header>
  );
}

export function SidebarLayout({
  groups,
  children,
  sidebarHeader,
}: {
  groups: NavGroup[];
  children?: React.ReactNode;
  sidebarHeader?: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar groups={groups} header={sidebarHeader} />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
          <SidebarTrigger />
          <div className="ml-auto flex items-center gap-2">
            <LocaleToggle />
            <UserButton />
          </div>
        </header>
        <div className="flex flex-col gap-6 px-5 py-6 md:px-8">
          {children ?? <Outlet />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
