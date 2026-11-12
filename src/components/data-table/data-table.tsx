"use client";

import React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  Row,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  PaginationState,
  Updater,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { DataTableToolbar } from "./data-table-toolbar";
import type { DataTableToolbarProps } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { Icons } from "../icons";

/** For a faceted-filter column: keeps rows whose value is one of the ticked options. */
export function inFacet<TData>(row: Row<TData>, columnId: string, value: string[]): boolean {
  return value.includes(String(row.getValue(columnId)));
}

/** Columns that can't be hidden: for a table with no "View" menu to bring them back. */
export function fixedColumns<TData>(columns: ColumnDef<TData>[]): ColumnDef<TData>[] {
  return columns.map((column) => ({ ...column, enableHiding: false }));
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Rows per page to start with. */
  pageSize?: number;
  /** Makes each row a button. */
  onRowClick?: (row: Row<TData>) => void;
  /** Shown when no row matches. */
  emptyText?: string;
  /** Render the search / faceted-filter / column-visibility toolbar. */
  toolbar?: boolean;
  /** Toolbar configuration, forwarded when `toolbar` is enabled. */
  toolbarProps?: Omit<DataTableToolbarProps<TData>, "table">;
  manualPagination?: boolean;
  gridCount?: number;
  loading?: boolean;
  handleGridChange?: (updater: Updater<PaginationState>) => void;
  gridColor?: "bg-background";
}

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar = false,
  toolbarProps,
  manualPagination = false,
  handleGridChange,
  gridCount,
  loading,
  gridColor,
  pageSize = 10,
  onRowClick,
  emptyText = "No results.",
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  React.useEffect(() => {
    handleGridChange?.(pagination);
  }, [pagination, handleGridChange]);

  // TanStack Table hands back functions the React Compiler cannot prove are safe
  // to memoize, so it declines to optimise anything downstream of `table`. That
  // is a property of the library's API rather than of this component — there is
  // no way to write the call that satisfies the rule — so it is suppressed here
  // rather than left as standing noise that teaches people to skim past the
  // linter. Worth revisiting if TanStack ships a compiler-compatible API.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    manualPagination: manualPagination,
    rowCount: manualPagination ? gridCount : undefined,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
<div className="w-full space-y-4">
  {toolbar ? <DataTableToolbar table={table} {...toolbarProps} /> : null}

  {/* The grid carries its own white ground rather than borrowing whatever is
      behind it. Inside a Card that changes nothing; on the canvas it is the
      difference between white data rows under a tinted header and the whole
      grid sitting flat in the page's own colour. */}
  <div className={`rounded-md border overflow-hidden ${gridColor || "bg-card"}`}>
    <Table>
      <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan} className="h-10 px-2 text-muted-foreground">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`hover:bg-muted/50 data-[state=selected]:bg-muted ${onRowClick ? "cursor-pointer" : ""}`}
                  {...(onRowClick && {
                    tabIndex: 0,
                    onClick: () => onRowClick(row),
                    onKeyDown: (event: React.KeyboardEvent) =>
                      (event.key === "Enter" || event.key === " ") && onRowClick(row),
                  })}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-2 py-1.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex h-full items-center justify-center">
                    <Icons.spinner className="h-6 w-6 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}