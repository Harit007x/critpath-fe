import { RiCheckLine } from "@remixicon/react";

import { DataTable, DataTableColumnHeader, fixedColumns, inFacet, type FacetedFilterConfig } from "@/components/data-table";
import { BROKEN_KIND_LABEL, STATUS_LABEL, TYPE_LABEL } from "@/pages/check/labels";
import { facetOptions } from "@/pages/check/facets";
import type { BrokenRow, CheckedActivity } from "@/services/xer.service";

/** A "Finding" filter only helps when findings repeat (missing links); float findings are all different. */
const MAX_FINDING_OPTIONS = 6;

const activityColumns = fixedColumns<CheckedActivity>([
  {
    id: "activity",
    accessorFn: (a) => `${a.code} ${a.name}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Activity" />,
    cell: ({ row: { original: a } }) => (
      <div className="max-w-[260px]">
        <span className="block font-mono text-3xs text-muted-foreground">{a.code}</span>
        <span className="block truncate" title={a.name}>
          {a.name}
        </span>
      </div>
    ),
  },
  {
    id: "type",
    accessorKey: "type",
    header: "Type",
    cell: ({ getValue }) => TYPE_LABEL[getValue<string>()] ?? getValue<string>(),
    filterFn: inFacet,
    enableSorting: false,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{STATUS_LABEL[getValue<string>()] ?? getValue<string>()}</span>
    ),
    filterFn: inFacet,
    enableSorting: false,
  },
  {
    id: "float",
    accessorKey: "totalFloatDays",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Float (d)" />,
    cell: ({ getValue }) => <span className="tabular-nums">{getValue<number | null>() ?? "—"}</span>,
    sortUndefined: "last",
  },
  {
    id: "finding",
    accessorKey: "detail",
    header: "Finding",
    cell: ({ getValue }) => <span className="block min-w-[180px] whitespace-normal">{getValue<string>()}</span>,
    filterFn: inFacet,
    enableSorting: false,
  },
]);

/** The activities that fail one check: search, filter by type, status and finding, sort, page. */
export function ActivityTable({ activities }: { activities: CheckedActivity[] }) {
  if (activities.length === 0) return <NoneFound text="No activities fail this check." />;
  const findings = facetOptions(activities, (a) => a.detail);
  const filters: FacetedFilterConfig[] = [
    { columnId: "type", title: "Type", options: facetOptions(activities, (a) => a.type, TYPE_LABEL) },
    { columnId: "status", title: "Status", options: facetOptions(activities, (a) => a.status, STATUS_LABEL) },
    ...(findings.length > 1 && findings.length <= MAX_FINDING_OPTIONS
      ? [{ columnId: "finding", title: "Finding", options: findings }]
      : []),
  ];
  return (
    <DataTable
      columns={activityColumns}
      data={activities}
      toolbar
      toolbarProps={{
        searchColumn: "activity",
        searchPlaceholder: "Search activity ID or name…",
        facetedFilters: filters.filter((f) => f.options.length > 1),
        showViewOptions: false,
      }}
      emptyText="No activities match."
    />
  );
}

const brokenRowColumns = fixedColumns<BrokenRow>([
  {
    id: "line",
    accessorKey: "line",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Line" />,
    cell: ({ getValue }) => <span className="font-mono tabular-nums">{getValue<number>()}</span>,
  },
  {
    id: "table",
    accessorKey: "table",
    header: "Where",
    cell: ({ row: { original: r } }) => (
      <>
        <span className="block font-mono">{r.table}</span>
        <span className="block font-mono text-3xs text-muted-foreground">
          {[r.rowNumber != null && `row ${r.rowNumber}`, r.field].filter(Boolean).join(" · ") || "—"}
        </span>
      </>
    ),
    filterFn: inFacet,
    enableSorting: false,
  },
  {
    id: "kind",
    accessorKey: "kind",
    header: "Kind",
    cell: ({ getValue }) => BROKEN_KIND_LABEL[getValue<string>()] ?? getValue<string>(),
    filterFn: inFacet,
    enableSorting: false,
  },
  {
    id: "reason",
    accessorKey: "reason",
    header: "Problem",
    cell: ({ getValue }) => <span className="block min-w-[240px] whitespace-normal">{getValue<string>()}</span>,
    enableSorting: false,
  },
]);

/** Rows of the file that could not be read: search the reason, filter by table and kind, page. */
export function BrokenRowsTable({ rows }: { rows: BrokenRow[] }) {
  if (rows.length === 0) return <NoneFound text="No broken rows." />;
  const filters: FacetedFilterConfig[] = [
    { columnId: "table", title: "Table", options: facetOptions(rows, (r) => r.table) },
    { columnId: "kind", title: "Kind", options: facetOptions(rows, (r) => r.kind, BROKEN_KIND_LABEL) },
  ];
  return (
    <DataTable
      columns={brokenRowColumns}
      data={rows}
      toolbar
      toolbarProps={{
        searchColumn: "reason",
        searchPlaceholder: "Search problems…",
        facetedFilters: filters.filter((f) => f.options.length > 1),
        showViewOptions: false,
      }}
      emptyText="No rows match."
    />
  );
}

function NoneFound({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-1.5 py-6 text-xs text-muted-foreground">
      <RiCheckLine className="size-4 text-primary" /> {text}
    </p>
  );
}
