import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

type AppBrandBaseProps = {
  label: string;
  subtitle: string;
  className?: string;
  variant?: "default" | "sidebar";
} & (
  | (Omit<ComponentProps<typeof Link>, "to"> & { to?: string })
  | (ComponentProps<"div"> & { to: null })
);

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
  to,
  variant = "default",
  ...props
}: AppBrandProps) {
  const iconClassName =
    variant === "sidebar" ? "bg-sidebar-primary" : "bg-primary";
  const iconColor =
    variant === "sidebar"
      ? "var(--sidebar-primary-foreground)"
      : "var(--primary-foreground)";
  const contentClassName =
    variant === "sidebar" ? "group-data-[collapsible=icon]:hidden" : undefined;

  const content = (
    <>
      <div
        className={[
          "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md",
          imageSrc ? "border bg-background" : iconClassName,
        ].join(" ")}
      >
        {imageSrc ? (
          <img src={imageSrc} alt={label} className="size-full object-cover" />
        ) : Icon ? (
          <Icon className="size-4" color={iconColor} />
        ) : null}
      </div>
      <div
        className={["flex min-w-0 flex-col leading-tight", contentClassName]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="truncate font-semibold tracking-tight">{label}</span>
        {subtitle ? (
          <span className="text-muted-foreground truncate text-xs">
            {subtitle}
          </span>
        ) : null}
      </div>
    </>
  );
  const brandClassName = [
    "flex min-w-0 items-center gap-2 text-foreground hover:text-foreground",
    variant === "sidebar"
      ? "p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to === null) {
    return (
      <div className={brandClassName} {...(props as ComponentProps<"div">)}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to ?? "/"}
      className={brandClassName}
      {...(props as Omit<ComponentProps<typeof Link>, "to">)}
    >
      {content}
    </Link>
  );
}
