import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

type AppBrandProps = Omit<ComponentProps<typeof Link>, "to"> & {
  label: string;
  subtitle: string;
  icon: LucideIcon;
  to?: string;
  variant?: "default" | "sidebar";
};

export function AppBrand({
  className,
  label,
  subtitle,
  icon: Icon,
  to = "/",
  variant = "default",
  ...props
}: AppBrandProps) {
  const iconClassName =
    variant === "sidebar"
      ? "bg-sidebar-primary text-sidebar-primary-foreground"
      : "bg-primary text-primary-foreground";
  const contentClassName =
    variant === "sidebar" ? "group-data-[collapsible=icon]:hidden" : undefined;

  return (
    <Link
      to={to}
      className={["flex min-w-0 items-center gap-2 text-foreground hover:text-foreground", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className={["flex size-8 shrink-0 items-center justify-center rounded-md", iconClassName].join(" ")}>
        <Icon className="size-4" />
      </div>
      <div className={["flex min-w-0 flex-col leading-none", contentClassName].filter(Boolean).join(" ")}>
        <span className="truncate font-semibold tracking-tight">{label}</span>
        <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
      </div>
    </Link>
  );
}
