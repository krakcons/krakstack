import { useNavigate } from "@tanstack/react-router";

import { SearchMenu, type SearchMenuGroup } from "@/components/ui/search-menu";
import { krakstackSites } from "@/lib/krakstack-sites";
import {
  getRegistryGroup,
  getRegistryIcon,
  registryItems,
} from "@/lib/registry";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

const registryGroupsByHeading = new Map<string, typeof registryItems>();

for (const item of registryItems) {
  const group = getRegistryGroup(item);
  registryGroupsByHeading.set(group, [
    ...(registryGroupsByHeading.get(group) ?? []),
    item,
  ]);
}

export function RegistryCommandMenu({ className }: { className?: string }) {
  const navigate = useNavigate();
  const groups: SearchMenuGroup[] = [
    {
      heading: m.krakstack_sites_heading(),
      items: krakstackSites.map((site) => {
        const Icon = site.icon;

        return {
          id: site.url,
          label: site.title(),
          description: site.description(),
          keywords: Array.from(site.keywords),
          icon: <Icon className="size-4" />,
          onSelect: () => navigate({ to: site.docsHref }),
        };
      }),
    },
    ...Array.from(registryGroupsByHeading).map(([heading, items]) => ({
      heading,
      items: items.map((item) => {
        const Icon = getRegistryIcon(item);

        return {
          id: item.name,
          label: item.title ?? item.name,
          description: item.description,
          keywords: [item.name],
          icon: <Icon className="size-4" />,
          onSelect: () =>
            navigate({
              to: "/docs/registry/$slug",
              params: { slug: item.name },
            }),
        };
      }),
    })),
  ];

  return (
    <SearchMenu
      className={cn(className)}
      groups={groups}
      title={m.registry_search_title()}
      description={m.registry_search_description()}
      placeholder={m.registry_search_placeholder()}
      inputPlaceholder={m.registry_search_input_placeholder()}
      emptyMessage={m.registry_search_empty()}
    />
  );
}
