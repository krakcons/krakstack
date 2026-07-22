import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { m } from "@/paraglide/messages";

const totalRows = 137;

export function PaginationPreview() {
  const [page, setPage] = useState(2);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.ceil(totalRows / pageSize);

  const changePageSize = (size: number) => {
    setPage(0);
    setPageSize(size);
  };

  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>{m.pagination_preview_title()}</CardTitle>
        <CardDescription>{m.pagination_preview_description()}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8">
        <section className="grid gap-3">
          <p className="text-muted-foreground text-sm font-medium">
            {m.pagination_preview_full()}
          </p>
          <div className="bg-background/60 rounded-xl border px-3 py-4">
            <Pagination
              onPageChange={setPage}
              onPageSizeChange={changePageSize}
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              selectedRows={3}
              totalRows={totalRows}
            />
          </div>
        </section>

        <section className="grid gap-3">
          <p className="text-muted-foreground text-sm font-medium">
            {m.pagination_preview_compact()}
          </p>
          <div className="bg-background/60 max-w-sm rounded-xl border p-4">
            <Pagination
              compact
              onPageChange={setPage}
              onPageSizeChange={changePageSize}
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              showResults={false}
              totalRows={totalRows}
            />
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
