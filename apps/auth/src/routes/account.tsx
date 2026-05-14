import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";
import { Building2, KeyRound, ShieldCheck } from "lucide-react";

import { AppBrand } from "@/components/app-brand";
import { LocaleToggle } from "@/components/locale-toggle";
import { UserButton } from "@/components/user-button";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import { authClient } from "@/services/auth/client";

export const Route = createFileRoute("/account")({
  ssr: false,
  beforeLoad: async () => {
    const session = await authClient.getSession();

    if (!session.data?.user) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: AccountLayout,
});

const accountNav = [
  { to: "/account/security", label: m.account_nav_security, icon: ShieldCheck },
  {
    to: "/account/organizations",
    label: m.account_nav_organizations,
    icon: Building2,
  },
  { to: "/account/api-keys", label: m.account_nav_api_keys, icon: KeyRound },
] as const;

function AccountLayout() {
  return (
    <main className="bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <AppBrand
            label={m.account_title()}
            subtitle={m.account_description()}
            icon={ShieldCheck}
            to="/"
          />
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <UserButton side="bottom" />
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 md:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {accountNav.map((item) => (
            <Button
              key={item.to}
              variant="ghost"
              className="justify-start"
              render={<Link to={item.to} />}
            >
              <item.icon data-icon="inline-start" />
              {item.label()}
            </Button>
          ))}
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
