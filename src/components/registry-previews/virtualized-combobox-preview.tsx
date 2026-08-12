import { useState } from "react";

import {
  VirtualizedCombobox,
  type VirtualizedComboboxOption,
} from "@/components/ui/virtualized-combobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { m } from "@/paraglide/messages";

export function VirtualizedComboboxPreview() {
  const [value, setValue] = useState<VirtualizedComboboxOption | null>(null);
  const [values, setValues] = useState<VirtualizedComboboxOption[]>([]);
  const cities = Array.from({ length: 1_000 }, (_, index) => ({
    value: `city-${index + 1}`,
    label: m.virtualized_combobox_preview_city({ number: index + 1 }),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-[var(--surface-strong)]">
        <CardHeader>
          <CardTitle>{m.virtualized_combobox_preview_single_title()}</CardTitle>
          <CardDescription>
            {m.virtualized_combobox_preview_description()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VirtualizedCombobox
            ariaLabel={m.virtualized_combobox_preview_single_label()}
            emptyLabel={m.virtualized_combobox_preview_empty()}
            items={cities}
            onValueChange={setValue}
            placeholder={m.virtualized_combobox_preview_single_placeholder()}
            value={value}
          />
        </CardContent>
      </Card>

      <Card className="bg-[var(--surface-strong)]">
        <CardHeader>
          <CardTitle>
            {m.virtualized_combobox_preview_multiple_title()}
          </CardTitle>
          <CardDescription>
            {m.virtualized_combobox_preview_multiple_description()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VirtualizedCombobox
            ariaLabel={m.virtualized_combobox_preview_multiple_label()}
            emptyLabel={m.virtualized_combobox_preview_empty()}
            items={cities}
            multiple
            onValueChange={setValues}
            placeholder={m.virtualized_combobox_preview_multiple_placeholder()}
            value={values}
          />
        </CardContent>
      </Card>
    </div>
  );
}
