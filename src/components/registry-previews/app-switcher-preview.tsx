import { BookOpen, Layers, MessagesSquare } from "lucide-react";
import { AppSwitcher } from "@/components/ui/app-switcher";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const AppSwitcherPreview = () => (
  <div className="flex items-center justify-between gap-4">
    <p className="text-muted-foreground text-sm">
      {m.new_components_switcher_help()}
    </p>
    <AppSwitcher
      locale={getLocale()}
      currentApp="learning"
      items={[
        {
          id: "learning",
          label: m.new_components_learning(),
          href: "#learning",
          icon: <BookOpen />,
          description: m.new_components_learning_description(),
        },
        {
          id: "courses",
          label: m.new_components_courses(),
          href: "#courses",
          icon: <Layers />,
          description: m.new_components_courses_description(),
        },
        {
          id: "simulator",
          label: m.new_components_simulator(),
          href: "#simulator",
          icon: <MessagesSquare />,
          disabled: true,
        },
      ]}
    />
  </div>
);
