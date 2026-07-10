import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
} from "@/components/ui/combobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComboboxListVirtualized } from "@/components/ui/combobox-list-virtualized";

const cities = Array.from({ length: 1_000 }, (_, index) => ({
  id: `city-${index + 1}`,
  label: `City ${index + 1}`,
}));

export function ComboboxListVirtualizedPreview() {
  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Virtualized Combobox List</CardTitle>
        <CardDescription>
          Search 1,000 options while only rendering the visible rows.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-w-sm">
        <Combobox items={cities}>
          <ComboboxInput placeholder="Search cities" />
          <ComboboxContent>
            <ComboboxEmpty>No cities found.</ComboboxEmpty>
            <ComboboxListVirtualized<(typeof cities)[number]>
              getItemKey={(city) => city.id}
            >
              {(city) => city.label}
            </ComboboxListVirtualized>
          </ComboboxContent>
        </Combobox>
      </CardContent>
    </Card>
  );
}
