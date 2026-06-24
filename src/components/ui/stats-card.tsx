import {
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactNode,
} from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const normalizeIcon = (icon: ReactNode) => {
  if (!isValidElement<{ className?: string }>(icon)) return icon;

  return cloneElement(icon, {
    className: ["size-4", icon.props.className].filter(Boolean).join(" "),
  });
};

export const StatsCard = ({
  title,
  icon,
  value,
  description,
  children,
  className,
  size = "default",
  valueClassName,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  children?: ReactNode;
  className?: string;
  size?: ComponentProps<typeof Card>["size"];
  valueClassName?: string;
}) => {
  const normalizedIcon = normalizeIcon(icon);

  return (
    <Card
      size={size}
      className={[
        "group-hover/card-link:ring-foreground/20 @container/card h-full flex-1 gap-4 transition-all duration-200 group-hover/card-link:-translate-y-0.5 group-hover/card-link:shadow-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      key={title}
    >
      <CardHeader className="relative">
        <CardDescription className="flex items-center justify-between gap-2">
          {title}
          {normalizedIcon}
        </CardDescription>
        <CardTitle
          className={[
            "justify-center font-semibold text-2xl tabular-nums @[250px]/card:text-3xl",
            valueClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {value}
        </CardTitle>
      </CardHeader>
      {children ? <CardContent>{children}</CardContent> : null}
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="text-muted-foreground text-xs">{description}</div>
      </CardFooter>
    </Card>
  );
};
