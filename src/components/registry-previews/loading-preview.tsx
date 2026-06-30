import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";

export function LoadingPreview() {
  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Loading</CardTitle>
        <CardDescription>
          A reusable spinner and label for pending pages, tables, and inline
          regions.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2 sm:items-center">
        <div className="bg-background/60 rounded-xl border border-dashed px-4 py-10">
          <Loading variant="centered" />
        </div>
        <div className="bg-background/60 grid gap-2 rounded-xl border p-4">
          <p className="text-sm font-medium">Inline loading state</p>
          <Loading className="justify-start" label="Refreshing records..." />
        </div>
      </CardContent>
    </Card>
  );
}
