import { Link, useRouterState } from "@tanstack/react-router";
import { PanelsTopLeft } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function SidebarProvider({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex min-h-screen bg-background", className)} {...props} />;
}

function Sidebar({ className, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      className={cn(
        "hidden w-64 shrink-0 border-r bg-muted/30 p-3 md:flex md:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return <main className={cn("min-w-0 flex-1", className)} {...props} />;
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2 p-2", className)} {...props} />;
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-1 flex-col gap-3", className)} {...props} />;
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("px-2 text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />;
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex flex-col gap-1", className)} {...props} />;
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("list-none", className)} {...props} />;
}

function SidebarMenuButton({
  className,
  isActive,
  ...props
}: React.ComponentProps<typeof Button> & { isActive?: boolean }) {
  return (
    <Button
      className={cn("w-full justify-start", className)}
      data-active={isActive}
      size="sm"
      variant={isActive ? "secondary" : "ghost"}
      {...props}
    />
  );
}

function SidebarSeparator(props: React.ComponentProps<typeof Separator>) {
  return <Separator {...props} />;
}

function SidebarTrigger({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button className={cn("md:hidden", className)} size="icon-sm" variant="ghost" {...props}>
      <PanelsTopLeft />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

function AuthSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <PanelsTopLeft />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-medium">Krakstack</span>
            <span className="text-xs text-muted-foreground">Auth</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="pt-3">
        <SidebarGroup>
          <SidebarGroupLabel>OAuth</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === "/admin/oauth/clients"} render={<Link to="/admin/oauth/clients" />}>
                  <PanelsTopLeft data-icon="inline-start" />
                  Clients
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export {
  AuthSidebar,
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
  SidebarSeparator,
  SidebarTrigger,
};
