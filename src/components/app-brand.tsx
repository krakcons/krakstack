import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

type AppBrandBaseProps = Omit<ComponentProps<typeof Link>, "to"> & {
  label: string;
  subtitle: string;
  to?: string;
  variant?: "default" | "sidebar";
};

type AppBrandProps = AppBrandBaseProps &
  (
    | { icon: LucideIcon; imageSrc?: string }
    | { imageSrc: string; icon?: LucideIcon }
  );

export function AppBrand({
  className,
  label,
  subtitle,
  icon: Icon,
  imageSrc,
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
      className={[
        "flex min-w-0 items-center gap-2 text-foreground hover:text-foreground",
        variant === "sidebar"
          ? "p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div
        className={[
          "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md",
          imageSrc ? "border bg-background" : iconClassName,
        ].join(" ")}
      >
        {imageSrc ? (
          <img src={imageSrc} alt={label} className="size-full object-cover" />
        ) : Icon ? (
          <Icon className="size-4" />
        ) : null}
      </div>
      <div
        className={["flex min-w-0 flex-col leading-none", contentClassName]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="truncate font-semibold tracking-tight">{label}</span>
        <span className="text-muted-foreground truncate text-xs">
          {subtitle}
        </span>
      </div>
    </Link>
  );
}
