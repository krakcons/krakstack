import { Link, type LinkProps } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

type AppBrandContentProps = {
  label: string;
  subtitle: string;
  className?: string;
  variant?: "default" | "sidebar";
};

type AppBrandVisualProps =
  | { icon: LucideIcon; imageSrc?: string }
  | { imageSrc: string; icon?: LucideIcon };

type AppBrandLinkProps = AppBrandContentProps &
  AppBrandVisualProps &
  Omit<LinkProps, "children" | "className" | "href" | "to"> & {
    href?: never;
    to?: Exclude<LinkProps["to"], null>;
  };

type AppBrandAnchorProps = AppBrandContentProps &
  AppBrandVisualProps &
  Omit<ComponentProps<"a">, "children" | "className"> & {
    href: string;
    to?: never;
  };

type AppBrandStaticProps = AppBrandContentProps &
  AppBrandVisualProps &
  Omit<ComponentProps<"div">, "children" | "className"> & {
    href?: never;
    to: null;
  };

type AppBrandProps =
  | AppBrandLinkProps
  | AppBrandAnchorProps
  | AppBrandStaticProps;

const isStaticBrand = (props: AppBrandProps): props is AppBrandStaticProps =>
  props.to === null;

const isAnchorBrand = (props: AppBrandProps): props is AppBrandAnchorProps =>
  props.href !== undefined;

export function AppBrand(brandProps: AppBrandProps) {
  const {
    className,
    label,
    subtitle,
    icon: Icon,
    imageSrc,
    variant = "default",
  } = brandProps;
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

  if (isStaticBrand(brandProps)) {
    const {
      className: _className,
      label: _label,
      subtitle: _subtitle,
      icon: _icon,
      imageSrc: _imageSrc,
      variant: _variant,
      to: _to,
      href: _href,
      ...props
    } = brandProps;
    return (
      <div className={brandClassName} {...props}>
        {content}
      </div>
    );
  }

  if (isAnchorBrand(brandProps)) {
    const {
      className: _className,
      label: _label,
      subtitle: _subtitle,
      icon: _icon,
      imageSrc: _imageSrc,
      variant: _variant,
      to: _to,
      href,
      ...props
    } = brandProps;
    return (
      <a className={brandClassName} href={href} {...props}>
        {content}
      </a>
    );
  }

  const {
    className: _className,
    label: _label,
    subtitle: _subtitle,
    icon: _icon,
    imageSrc: _imageSrc,
    variant: _variant,
    href: _href,
    to,
    ...props
  } = brandProps;
  return (
    <Link to={to ?? "/"} className={brandClassName} {...props}>
      {content}
    </Link>
  );
}
