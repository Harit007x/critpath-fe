import { RiCloseLine } from "@remixicon/react";
import type { Table } from "@tanstack/react-table";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

export interface FacetedFilterConfig {
  /** Column id to filter on. */
  columnId: string;
  title: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  /** Column id the free-text search box filters on. */
  searchColumn?: string;
  searchPlaceholder?: string;
  facetedFilters?: FacetedFilterConfig[];
  showViewOptions?: boolean;
}

export function DataTableToolbar<TData>({
  table,
  searchColumn,
  searchPlaceholder,
  facetedFilters = [],
  showViewOptions = true,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const column = searchColumn ? table.getColumn(searchColumn) : undefined;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center space-x-2">
        {column && (
          <Input
            placeholder={searchPlaceholder ?? "Search..."}
            value={(column.getFilterValue() as string) ?? ""}
            onChange={(event) => column.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[350px]"
          />
        )}

        {facetedFilters.map((filter) => {
          const facetColumn = table.getColumn(filter.columnId);
          if (!facetColumn) return null;

          return (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={facetColumn}
              title={filter.title}
              options={filter.options}
            />
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <RiCloseLine className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {showViewOptions && <DataTableViewOptions table={table} />}
    </div>
  );
}
