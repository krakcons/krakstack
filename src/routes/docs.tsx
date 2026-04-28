import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Activity, Database, Globe, KeyRound, ListChecks, Shield, Table2, UserRound } from "lucide-react";
import { getRegistryGroup, registryItems } from "@/lib/registry";
import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({ component: DocsLayout });

const iconByName = {
  "data-table": Table2,
  form: ListChecks,
  "locale-toggle": Globe,
  "user-button": UserRound,
  "sign-in": KeyRound,
  "sign-up": KeyRound,
  auth: Shield,
  "service-database": Database,
  "service-opentelemetry": Activity,
} as const;

const registrySections = registryItems.reduce(
  (sections, item) => {
    const title = getRegistryGroup(item);
    const section = sections.find((entry) => entry.title === title);
    const navItem = {
      title: item.title ?? item.name,
      to: `/docs/registry/${item.name}`,
      icon: iconByName[item.name as keyof typeof iconByName] ?? Shield,
    };

    if (section) section.items.push(navItem);
    else sections.push({ title, items: [navItem] });

    return sections;
  },
  [] as Array<{ title: string; items: Array<{ title: string; to: string; icon: typeof Box }> }>,
);

const docsNav = registrySections;

function DocsLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip="Krakstack" render={<Link to="/" />}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  K
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Krakstack</span>
                  <span className="truncate text-xs">Documentation</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {docsNav.map((section) => (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        isActive={pathname === item.to}
                        render={<Link to={item.to} />}
                        tooltip={item.title}
                      >
                        <item.icon />
                        <span>{item.title}</span>
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
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <Link to="/docs/registry/data-table" className="text-sm font-medium">
              Docs
            </Link>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
