import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LocaleToggle } from "@/components/locale-toggle/locale-toggle";
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
  brand: { label: () => string; subtitle: () => string; icon: LucideIcon; href: string };
  groups: NavGroup[];
};

function AppSidebar({ brand, groups }: AppSidebarProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={brand.label()} render={<Link to={brand.href} />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <brand.icon />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{brand.label()}</span>
                <span className="truncate text-xs">{brand.subtitle()}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
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

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  badge?: { label: string; variant?: "default" | "secondary" | "outline" | "destructive" };
  actions?: React.ReactNode;
};

export function AdminPageHeader({ title, description, badge, actions }: AdminPageHeaderProps) {
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
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </header>
  );
}

export function AdminLayout({
  brand,
  groups,
  children,
  headerEnd,
}: {
  brand: AppSidebarProps["brand"];
  groups: NavGroup[];
  children?: React.ReactNode;
  headerEnd?: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar brand={brand} groups={groups} />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <div className="ml-auto">{headerEnd ?? <LocaleToggle />}</div>
        </header>
        <div className="flex flex-col gap-6 px-5 py-6 md:px-8">{children ?? <Outlet />}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}