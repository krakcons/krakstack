// @vitest-environment jsdom
import { expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import {
  NotificationListItem,
  notificationMenuMessages,
} from "./notification-menu";

afterEach(cleanup);

const labels = notificationMenuMessages("en");
const notification = { id: "course", title: "Course update", href: "#course" };

it("uses a native link and intercepts only plain clicks for custom navigation", () => {
  const onNavigate = vi.fn();
  render(
    <NotificationListItem
      labels={labels}
      locale="en"
      notification={notification}
      onNavigate={onNavigate}
    />,
  );

  const link = screen.getByRole("link", { name: "Course update" });
  expect(link.getAttribute("href")).toBe(notification.href);
  expect(fireEvent.click(link, { ctrlKey: true })).toBe(true);
  expect(fireEvent.click(link, { metaKey: true })).toBe(true);
  expect(onNavigate).not.toHaveBeenCalled();
  expect(fireEvent.click(link)).toBe(false);
  expect(onNavigate).toHaveBeenCalledExactlyOnceWith(notification);
});

it("keeps archive available when a notification has no destination", () => {
  const onArchive = vi.fn();
  render(
    <NotificationListItem
      labels={labels}
      locale="en"
      notification={{ id: "course", title: "Course update" }}
      onArchive={onArchive}
    />,
  );

  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.queryByRole("button", { name: "Course update" })).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Archive Course update" }),
  );
  expect(onArchive).toHaveBeenCalledExactlyOnceWith(["course"]);
});
