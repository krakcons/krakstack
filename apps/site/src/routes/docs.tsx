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
} from '@/components/ui/sidebar'
import { Link, Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { Database, FileText, Home, Table2 } from 'lucide-react'

export const Route = createFileRoute('/docs')({ component: DocsLayout })

const docsNav = [
  {
    title: 'Overview',
    items: [{ title: 'Home', to: '/', icon: Home }],
  },
  {
    title: 'Components',
    items: [
      { title: 'Form', to: '/docs/form', icon: FileText },
      { title: 'Data table', to: '/docs/data-table', icon: Table2 },
    ],
  },
  {
    title: 'Services',
    items: [{ title: 'Database', to: '/docs/service-database', icon: Database }],
  },
] as const

function DocsLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip="Krakstack docs">
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
          <div className="text-sm font-medium">Docs</div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
