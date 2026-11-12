import {
  RiArrowLeftDoubleLine,
  RiArrowLeftSLine,
  RiArrowRightDoubleLine,
  RiArrowRightSLine,
} from "@remixicon/react";
import type { Table } from "@tanstack/react-table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";

const PAGE_SIZES = [10, 25, 50, 100];

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

/** "1–10 of 70", rows per page, and first / previous / next / last. */
export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);
  const pages = Math.max(1, table.getPageCount());
  const sizes = PAGE_SIZES.includes(pageSize) ? PAGE_SIZES : [pageSize, ...PAGE_SIZES].sort((a, b) => a - b);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
      <p className="text-muted-foreground tabular-nums">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-muted-foreground">Rows per page</span>
          {/* `size="sm"` rather than an `h-8` class. The trigger sets its
              height through a data-attribute variant, and tailwind-merge
              treats that as a different group from a plain utility — so the
              42px default survived, and the 16px side padding squeezed the
              value until it clipped. */}
          <Select value={`${pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
            <SelectTrigger size="sm" className="w-[72px] justify-center">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {sizes.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="font-medium tabular-nums">
          Page {pageIndex + 1} of {pages}
        </span>
        {/* Icon-only buttons take `size="icon-sm"`, never `h-8 w-8 p-0`. The
            default size carries `has-[>svg]:pl-4`, and that variant-scoped
            padding survives a `p-0` in className — which left every arrow
            sitting 8px right of centre. The icon sizes carry no padding. */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="First page"
          >
            <RiArrowLeftDoubleLine />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <RiArrowLeftSLine />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <RiArrowRightSLine />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Last page"
          >
            <RiArrowRightDoubleLine />
          </Button>
        </div>
      </div>
    </div>
  );
}
