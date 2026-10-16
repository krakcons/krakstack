import { describe, expect, it } from "@effect/vitest";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";

import { SidebarLayout, type NavGroup } from "./sidebar-layout";

const groups: NavGroup[] = [
  {
    label: () => "Navigation",
    items: [
      { label: () => "Overview", href: "/admin", exact: true },
      { label: () => "Courses", href: "/admin/courses" },
      { label: () => "Theme", href: "/admin/customizations", exact: true },
      {
        label: () => "Pages",
        href: "/admin/customizations/pages",
      },
      {
        label: () => "Emails",
        href: "/admin/customizations/emails",
      },
      { label: () => "External", href: "/external", external: true },
    ],
  },
];

const renderSidebar = async (path: string) => {
  const root = createRootRoute({
    component: () => <SidebarLayout groups={groups} />,
  });
  const route = createRoute({ getParentRoute: () => root, path: "$" });
  const router = createRouter({
    trailingSlash: "preserve",
    routeTree: root.addChildren([route]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  return renderToStaticMarkup(<RouterProvider router={router} />);
};

describe("SidebarLayout navigation", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/courses", "/admin/courses"],
    ["/admin/courses/course-1/settings", "/admin/courses"],
    ["/admin/courses/course-1/settings?locale=fr", "/admin/courses"],
    ["/admin/courses/", "/admin/courses"],
    ["/admin/customizations", "/admin/customizations"],
    ["/admin/customizations/pages/login", "/admin/customizations/pages"],
    ["/admin/customizations/emails/reminder", "/admin/customizations/emails"],
  ])(
    "highlights section links on nested routes and overview links only on exact matches at %s",
    async (path, href) => {
      const markup = await renderSidebar(path);
      const activeLinks = [
        ...markup.matchAll(/<a\b[^>]*data-active=""[^>]*>/g),
      ];
      expect(activeLinks).toHaveLength(1);
      expect(activeLinks[0]?.[0]).toContain(`href="${href}"`);
    },
  );

  it.each([
    "/administrator",
    "/admin/courses-archive",
    "/external",
    "/external/nested",
    "/",
  ])("does not activate unrelated or external links at %s", async (path) => {
    expect(await renderSidebar(path)).not.toContain('data-active=""');
  });
});
