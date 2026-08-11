import { FileCode2 } from "lucide-react";

import { m } from "@/paraglide/messages";

export const krakstackSites = [
  {
    id: "template",
    title: () => m.krakstack_site_template_title(),
    url: "template.krakstack.net",
    siteHref: "https://template.krakstack.net",
    githubHref: "https://github.com/krakcons/krakstack-template",
    docsHref: "/docs/sites/template",
    description: () => m.krakstack_site_template_description(),
    badge: () => m.krakstack_site_template_badge(),
    overview: () => m.krakstack_site_template_overview(),
    features: [
      {
        title: () => m.krakstack_site_template_feature_start_title(),
        description: () => m.krakstack_site_template_feature_start(),
      },
      {
        title: () => m.krakstack_site_template_feature_effect_title(),
        description: () => m.krakstack_site_template_feature_effect(),
      },
      {
        title: () => m.krakstack_site_template_feature_state_title(),
        description: () => m.krakstack_site_template_feature_state(),
      },
      {
        title: () => m.krakstack_site_template_feature_i18n_title(),
        description: () => m.krakstack_site_template_feature_i18n(),
      },
    ],
    keywords: ["template", "starter", "demo", "template.krakstack.net"],
    icon: FileCode2,
  },
] as const;

export function getKrakstackSite(id: (typeof krakstackSites)[number]["id"]) {
  return krakstackSites.find((site) => site.id === id);
}
