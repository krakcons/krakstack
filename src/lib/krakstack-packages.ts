import { Package } from "lucide-react";

import { m } from "@/paraglide/messages";

export const krakstackPackages = [
  {
    id: "auth",
    name: "@krak-stack/auth",
    title: () => m.krakstack_package_auth_title(),
    description: () => m.krakstack_package_auth_description(),
    badge: () => m.krakstack_package_auth_badge(),
    installCommand: "bun add @krak-stack/auth effect",
    npmHref: "https://www.npmjs.com/package/@krak-stack/auth",
    readmeHref:
      "https://github.com/krakcons/krakstack-auth/blob/main/packages/sdk/README.md",
    docsHref: "/docs/packages/auth",
    icon: Package,
  },
] as const;

export function getKrakstackPackage(
  id: (typeof krakstackPackages)[number]["id"],
) {
  return krakstackPackages.find((pkg) => pkg.id === id);
}
