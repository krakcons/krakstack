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

const cities = Array.from({ length: 1_000 }, (_, index) => ({
  value: `city-${index + 1}`,
  label: `City ${index + 1}`,
}));

export function VirtualizedComboboxPreview() {
  const [value, setValue] = useState<VirtualizedComboboxOption | null>(null);

  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Virtualized Combobox</CardTitle>
        <CardDescription>
          Search 1,000 options while only rendering the visible rows.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-w-sm">
        <VirtualizedCombobox
          ariaLabel="Select a city"
          emptyLabel="No cities found."
          items={cities}
          onValueChange={setValue}
          placeholder="Select a city"
          value={value}
        />
      </CardContent>
    </Card>
  );
}
