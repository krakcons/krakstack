import { Outlet, createFileRoute } from "@tanstack/react-router";

import { LocaleToggle } from "@/components/locale-toggle";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <main className="relative grid min-h-screen place-items-center px-6 py-10">
      <div className="absolute top-6 right-6 md:top-10 md:right-10">
        <LocaleToggle />
      </div>
      <Outlet />
    </main>
  );
}
