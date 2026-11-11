"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import {
  CircleCheck,
  CircleAlert,
  Info,
  TriangleAlert,
  LoaderCircle,
  X,
} from "lucide-react";
import type { ComponentProps } from "react";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { cn } from "@/lib/utils";

export const useToast = ToastPrimitive.useToastManager;
export const createToastManager = ToastPrimitive.createToastManager;
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
export type ToastMessages = { notifications: string; dismiss: string };
export type ToastClassNames = Partial<
  Record<
    | "viewport"
    | "toast"
    | "content"
    | "icon"
    | "body"
    | "title"
    | "description"
    | "action"
    | "close",
    string
  >
>;
export type ToastProviderProps = ComponentProps<
  typeof ToastPrimitive.Provider
> & {
  position?: ToastPosition;
  locale?: string;
  messages?: Partial<Record<string, Partial<ToastMessages>>>;
  classNames?: ToastClassNames;
};

const positions = {
  "top-left": "top-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-4 right-4",
};

const ToastViewport = ({
  position,
  locale,
  messages,
  classNames,
}: Required<Pick<ToastProviderProps, "position">> &
  Pick<ToastProviderProps, "locale" | "messages" | "classNames">) => {
  const language = useKrakstackLocale(locale);
  const copy = {
    ...(language.startsWith("fr")
      ? { notifications: "Notifications", dismiss: "Fermer la notification" }
      : { notifications: "Notifications", dismiss: "Dismiss notification" }),
    ...messages?.[language.split("-")[0] ?? language],
    ...messages?.[language],
  };
  const { toasts } = useToast();
  return (
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport
        data-slot="toast-viewport"
        data-position={position}
        aria-label={copy.notifications}
        className={cn(
          "pointer-events-none fixed z-[100] flex max-h-[calc(100dvh-2rem)] w-96 max-w-[calc(100vw-2rem)] [scrollbar-width:none] flex-col gap-3 overflow-y-auto overscroll-contain outline-none [&::-webkit-scrollbar]:hidden",
          positions[position],
          classNames?.viewport,
        )}
      >
        {toasts.map((toast) => {
          const Icon =
            toast.type === "success"
              ? CircleCheck
              : toast.type === "error"
                ? CircleAlert
                : toast.type === "warning"
                  ? TriangleAlert
                  : toast.type === "loading"
                    ? LoaderCircle
                    : Info;
          return (
            <ToastPrimitive.Root
              data-slot="toast"
              key={toast.id}
              toast={toast}
              swipeDirection={
                position.endsWith("left")
                  ? ["left"]
                  : position.endsWith("right")
                    ? ["right"]
                    : [position.startsWith("top") ? "up" : "down"]
              }
              className={cn(
                "bg-popover text-popover-foreground focus-visible:ring-ring pointer-events-auto relative shrink-0 touch-pan-y rounded-lg border p-4 shadow-lg transition-[opacity,transform] duration-150 outline-none focus-visible:ring-2 data-ending-style:translate-y-2 data-ending-style:opacity-0 data-limited:hidden data-starting-style:translate-y-2 data-starting-style:opacity-0 motion-reduce:transition-none",
                classNames?.toast,
              )}
            >
              <ToastPrimitive.Content
                data-slot="toast-content"
                className={cn(
                  "flex min-w-0 items-start gap-3",
                  classNames?.content,
                )}
              >
                <Icon
                  data-slot="toast-icon"
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    toast.type === "success" &&
                      "text-emerald-600 dark:text-emerald-400",
                    toast.type === "error" && "text-destructive",
                    toast.type === "warning" &&
                      "text-amber-600 dark:text-amber-400",
                    toast.type === "loading" && "motion-safe:animate-spin",
                    classNames?.icon,
                  )}
                />
                <div
                  data-slot="toast-body"
                  className={cn(
                    "grid min-w-0 flex-1 gap-1 [overflow-wrap:anywhere]",
                    classNames?.body,
                  )}
                >
                  <ToastPrimitive.Title
                    data-slot="toast-title"
                    className={cn(
                      "text-sm leading-5 font-medium",
                      classNames?.title,
                    )}
                  />
                  <ToastPrimitive.Description
                    data-slot="toast-description"
                    className={cn(
                      "text-muted-foreground text-sm leading-5",
                      classNames?.description,
                    )}
                  />
                  <ToastPrimitive.Action
                    data-slot="toast-action"
                    className={cn(
                      "text-foreground mt-2 w-fit rounded-sm text-sm font-medium underline underline-offset-4 outline-offset-4 disabled:opacity-50",
                      classNames?.action,
                    )}
                  />
                </div>
                <ToastPrimitive.Close
                  data-slot="toast-close"
                  aria-label={copy.dismiss}
                  className={cn(
                    "text-muted-foreground hover:bg-muted hover:text-foreground -mt-1 -mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md outline-offset-2",
                    classNames?.close,
                  )}
                >
                  <X aria-hidden="true" className="size-4" />
                </ToastPrimitive.Close>
              </ToastPrimitive.Content>
            </ToastPrimitive.Root>
          );
        })}
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  );
};

/** Mount once around a client application or a deliberately isolated subtree. */
export const ToastProvider = ({
  children,
  position = "bottom-right",
  locale,
  messages,
  classNames,
  ...props
}: ToastProviderProps) => (
  <ToastPrimitive.Provider {...props}>
    {children}
    <ToastViewport
      position={position}
      locale={locale}
      messages={messages}
      classNames={classNames}
    />
  </ToastPrimitive.Provider>
);
