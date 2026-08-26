import { Activity, FileCode2, ShieldCheck } from "lucide-react";

import { m } from "@/paraglide/messages";

export const krakstackRepositories = [
  {
    icon: FileCode2,
    title: () => m.home_repository_template_title(),
    description: () => m.home_repository_template_description(),
    href: "https://github.com/krakcons/krakstack-template",
    isNew: false,
  },
  {
    icon: ShieldCheck,
    title: () => m.home_repository_auth_title(),
    description: () => m.home_repository_auth_description(),
    href: "https://github.com/krakcons/krakstack-auth",
    isNew: false,
  },
  {
    icon: Activity,
    title: () => m.home_repository_uptime_title(),
    description: () => m.home_repository_uptime_description(),
    href: "https://github.com/krakcons/krakstack-uptime",
    isNew: true,
  },
] as const;
