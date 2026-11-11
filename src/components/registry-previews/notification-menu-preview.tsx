import { useState } from "react";
import { NotificationMenu } from "@krak-stack/notifications/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { m } from "@/paraglide/messages";

const timestamp = "2026-11-11T12:00:00.000Z";

export const NotificationMenuPreview = () => {
  const [readIds, setReadIds] = useState<readonly string[]>([]);
  const [archivedIds, setArchivedIds] = useState<readonly string[]>(["export"]);
  const [resetKey, setResetKey] = useState(0);
  const notifications = [
    {
      id: "course",
      title: m.notification_menu_preview_course_title(),
      description: m.notification_menu_preview_course_description(),
    },
    {
      id: "collection",
      title: m.notification_menu_preview_collection_title(),
      description: m.notification_menu_preview_collection_description(),
    },
    {
      id: "export",
      title: m.notification_menu_preview_export_title(),
      description: m.notification_menu_preview_export_description(),
    },
  ].map((notification) => ({
    ...notification,
    createdAt: timestamp,
    readAt: readIds.includes(notification.id) ? timestamp : null,
    archivedAt: archivedIds.includes(notification.id) ? timestamp : null,
  }));

  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>{m.notification_menu_preview_title()}</CardTitle>
        <CardDescription>
          {m.notification_menu_preview_description()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-40 items-center justify-center gap-4">
        <NotificationMenu
          key={resetKey}
          notifications={notifications}
          onMarkRead={(ids) =>
            setReadIds((previous) => [...new Set([...previous, ...ids])])
          }
          onArchive={(ids) =>
            setArchivedIds((previous) => [...new Set([...previous, ...ids])])
          }
        />
        <Button
          onClick={() => {
            setReadIds([]);
            setArchivedIds(["export"]);
            setResetKey((previous) => previous + 1);
          }}
          type="button"
          variant="outline"
        >
          {m.notification_menu_preview_reset()}
        </Button>
      </CardContent>
    </Card>
  );
};
