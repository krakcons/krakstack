import { Link, type LinkProps } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppBrandClassNames = Partial<
  Record<"visual" | "image" | "icon" | "content" | "label" | "subtitle", string>
>;

type AppBrandContentProps = {
  label: string;
  subtitle: string;
  className?: string;
  classNames?: AppBrandClassNames;
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
  AppBrandLinkProps | AppBrandAnchorProps | AppBrandStaticProps;

const isStaticBrand = (props: AppBrandProps): props is AppBrandStaticProps =>
  props.to === null;

const isAnchorBrand = (props: AppBrandProps): props is AppBrandAnchorProps =>
  props.href !== undefined;

export function AppBrand(brandProps: AppBrandProps) {
  const {
    className,
    classNames,
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
        data-slot="app-brand-visual"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md",
          imageSrc ? "bg-background border" : iconClassName,
          classNames?.visual,
        )}
      >
        {imageSrc ? (
          <img
            data-slot="app-brand-image"
            src={imageSrc}
            alt={label}
            className={cn("size-full object-cover", classNames?.image)}
          />
        ) : Icon ? (
          <Icon
            data-slot="app-brand-icon"
            className={cn("size-4", classNames?.icon)}
            color={iconColor}
          />
        ) : null}
      </div>
      <div
        data-slot="app-brand-content"
        className={cn(
          "flex min-w-0 flex-col leading-tight",
          contentClassName,
          classNames?.content,
        )}
      >
        <span
          data-slot="app-brand-label"
          className={cn(
            "truncate font-semibold tracking-tight",
            classNames?.label,
          )}
        >
          {label}
        </span>
        {subtitle ? (
          <span
            data-slot="app-brand-subtitle"
            className={cn(
              "text-muted-foreground truncate text-xs",
              classNames?.subtitle,
            )}
          >
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
      classNames: _classNames,
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
      <div data-slot="app-brand" className={brandClassName} {...props}>
        {content}
      </div>
    );
  }

  if (isAnchorBrand(brandProps)) {
    const {
      className: _className,
      classNames: _classNames,
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
      <a
        data-slot="app-brand"
        className={brandClassName}
        href={href}
        {...props}
      >
        {content}
      </a>
    );
  }

  const {
    className: _className,
    classNames: _classNames,
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
    <Link
      data-slot="app-brand"
      to={to ?? "/"}
      className={brandClassName}
      {...props}
    >
      {content}
    </Link>
  );
}
