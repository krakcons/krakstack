import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getLocale } from "@/paraglide/runtime";

export type PaginationMessages = {
  pageSize: string;
  results: (count: number) => string;
  selectedOf: (selected: number, total: number) => string;
  pageOf: (page: number, total: number) => string;
  goToFirstPage: string;
  goToPreviousPage: string;
  goToNextPage: string;
  goToLastPage: string;
};

const messages = {
  en: {
    pageSize: "Page size",
    results: (count: number) => `${count} results`,
    selectedOf: (selected: number, total: number) => `${selected} of ${total}`,
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
    goToFirstPage: "Go to first page",
    goToPreviousPage: "Go to previous page",
    goToNextPage: "Go to next page",
    goToLastPage: "Go to last page",
  },
  fr: {
    pageSize: "Taille de la page",
    results: (count: number) => `${count} résultats`,
    selectedOf: (selected: number, total: number) => `${selected} sur ${total}`,
    pageOf: (page: number, total: number) => `Page ${page} sur ${total}`,
    goToFirstPage: "Aller à la première page",
    goToPreviousPage: "Aller à la page précédente",
    goToNextPage: "Aller à la page suivante",
    goToLastPage: "Aller à la dernière page",
  },
} as const satisfies Record<"en" | "fr", PaginationMessages>;

export const paginationMessages = (
  locale = getLocale(),
  overrides?: Partial<PaginationMessages>,
) => ({
  ...(locale.startsWith("fr") ? messages.fr : messages.en),
  ...overrides,
});

export type PaginationProps = {
  compact?: boolean | undefined;
  messages?: Partial<PaginationMessages> | undefined;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizes?: readonly number[] | undefined;
  selectedRows?: number | undefined;
  showResults?: boolean | undefined;
  totalRows: number;
};

export function Pagination({
  compact = false,
  messages: messageOverrides,
  onPageChange,
  onPageSizeChange,
  page,
  pageCount,
  pageSize,
  pageSizes = [10, 20, 30, 40, 50],
  selectedRows = 0,
  showResults = true,
  totalRows,
}: PaginationProps) {
  const labels = paginationMessages(getLocale(), messageOverrides);
  const pageSizeId = useId();
  const canGoBack = page > 0;
  const canGoForward = page + 1 < pageCount;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between",
        compact && "gap-2 px-0 sm:flex-col sm:items-stretch",
      )}
    >
      {showResults ? (
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span>{labels.results(totalRows)}</span>
          {selectedRows > 0 ? (
            <span>{labels.selectedOf(selectedRows, totalRows)}</span>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          "flex items-center gap-4 sm:justify-end",
          compact && "flex-wrap justify-between gap-2 sm:justify-between",
        )}
      >
        <div className="flex items-center gap-2">
          <Label
            htmlFor={pageSizeId}
            className={cn("hidden text-sm sm:block", compact && "block")}
          >
            {labels.pageSize}
          </Label>
          <Select
            items={pageSizes.map((size) => ({
              label: size.toString(),
              value: size.toString(),
            }))}
            value={`${pageSize}`}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]" id={pageSizeId}>
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizes.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center text-sm font-medium sm:block">
            {labels.pageOf(page + 1, pageCount)}
          </div>
          <div className="flex items-center gap-1">
            <Button
              className={cn("hidden h-8 w-8 p-0 lg:flex", compact && "!hidden")}
              disabled={!canGoBack}
              onClick={() => onPageChange(0)}
              type="button"
            >
              <span className="sr-only">{labels.goToFirstPage}</span>
              <ChevronsLeft />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              disabled={!canGoBack}
              onClick={() => onPageChange(page - 1)}
              type="button"
            >
              <span className="sr-only">{labels.goToPreviousPage}</span>
              <ChevronLeft />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              disabled={!canGoForward}
              onClick={() => onPageChange(page + 1)}
              type="button"
            >
              <span className="sr-only">{labels.goToNextPage}</span>
              <ChevronRight />
            </Button>
            <Button
              className={cn("hidden h-8 w-8 p-0 lg:flex", compact && "!hidden")}
              disabled={!canGoForward}
              onClick={() => onPageChange(pageCount - 1)}
              type="button"
            >
              <span className="sr-only">{labels.goToLastPage}</span>
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
