import { useMemo, useRef, useState, type DragEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { RiAlertLine, RiCheckLine, RiUpload2Line } from "@remixicon/react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { xerService, type CheckId, type CheckResult, type XerReport } from "@/services/xer.service";

/** Rows shown before "Show all": enough to scan, short enough to keep the page usable. */
const PREVIEW_ROWS = 25;

const STATUS_LABEL: Record<string, string> = {
  TK_NotStart: "Not started",
  TK_Active: "In progress",
  TK_Complete: "Complete",
};

const TYPE_LABEL: Record<string, string> = {
  TT_Task: "Task",
  TT_Rsrc: "Resource dependent",
  TT_Mile: "Start milestone",
  TT_FinMile: "Finish milestone",
  TT_LOE: "Level of effort",
  TT_WBS: "WBS summary",
};

type Source = { kind: "sample"; id: string } | { kind: "file"; file: File };

/** Checks a bundled sample or an uploaded file. Nothing a visitor uploads is stored. */
export default function CheckPage() {
  const samples = useQuery({ queryKey: ["xer-samples"], queryFn: xerService.samples });
  const [source, setSource] = useState<Source | null>(null);
  const activeSource: Source | null = source ?? (samples.data?.[0] ? { kind: "sample", id: samples.data[0].id } : null);

  const sampleReport = useQuery({
    queryKey: ["xer-sample-check", activeSource?.kind === "sample" ? activeSource.id : null],
    queryFn: () => xerService.checkSample((activeSource as { id: string }).id),
    enabled: activeSource?.kind === "sample",
    staleTime: Infinity,
  });
  const upload = useMutation({ mutationFn: xerService.checkFile });

  const report = activeSource?.kind === "file" ? upload.data : sampleReport.data;
  const loading = samples.isLoading || (activeSource?.kind === "file" ? upload.isPending : sampleReport.isLoading);
  const error = activeSource?.kind === "file" ? upload.error : (sampleReport.error ?? samples.error);

  const chooseFile = (file: File | undefined) => {
    if (!file) return;
    setSource({ kind: "file", file });
    upload.mutate(file);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Schedule checker"
        subtitle="Reads a Primavera P6 export (.xer), lists every row it could not read, and runs three checks on the activities that are not yet complete: missing links, negative float and high float."
        className="mb-0"
      />

      <SourcePicker
        samples={samples.data ?? []}
        active={activeSource}
        onSample={(id) => setSource({ kind: "sample", id })}
        onFile={chooseFile}
      />

      {loading && (
        <div className="flex items-center gap-2 py-16 text-xs text-muted-foreground">
          <Spinner className="size-4" /> Reading the schedule…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
          <RiAlertLine className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">This file could not be checked</p>
            <p className="mt-0.5 text-destructive/90">
              {getApiErrorMessage(error, "Something went wrong reading the file.")}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && report && <Report report={report} />}
    </div>
  );
}

function SourcePicker({
  samples,
  active,
  onSample,
  onFile,
}: {
  samples: { id: string; title: string; description: string; fileName: string }[];
  active: Source | null;
  onSample: (id: string) => void;
  onFile: (file: File | undefined) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    onFile(event.dataTransfer.files[0]);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {samples.map((sample) => {
        const selected = active?.kind === "sample" && active.id === sample.id;
        return (
          <button
            key={sample.id}
            type="button"
            onClick={() => onSample(sample.id)}
            aria-pressed={selected}
            className={cn(
              "flex flex-col items-start gap-1 rounded-lg border bg-card p-4 text-left transition-colors",
              selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-foreground/30",
            )}
          >
            <span className="text-3xs font-medium tracking-wider text-muted-foreground uppercase">Sample</span>
            <span className="text-sm font-medium">{sample.title}</span>
            <span className="text-xs text-muted-foreground">{sample.description}</span>
            <span className="mt-1 font-mono text-3xs text-muted-foreground">{sample.fileName}</span>
          </button>
        );
      })}
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-start gap-1 rounded-lg border border-dashed bg-card p-4 transition-colors",
          active?.kind === "file" ? "border-primary ring-2 ring-primary/20" : "border-border",
          dragging && "border-primary bg-primary/5",
        )}
      >
        <span className="text-3xs font-medium tracking-wider text-muted-foreground uppercase">Your file</span>
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <RiUpload2Line className="size-4" /> Upload a .xer file
        </span>
        <span className="text-xs text-muted-foreground">Drop it here or click to choose. Up to 25 MB.</span>
        {active?.kind === "file" && (
          <span className="mt-1 max-w-full truncate font-mono text-3xs text-muted-foreground">{active.file.name}</span>
        )}
        <input
          ref={input}
          type="file"
          accept=".xer"
          className="hidden"
          onChange={(event) => {
            onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function Report({ report }: { report: XerReport }) {
  const [selected, setSelected] = useState<CheckId>("missing_links");
  const check = report.checks.find((c) => c.id === selected) ?? report.checks[0];
  const project = report.projects[0];

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border bg-card p-4 text-xs sm:grid-cols-3 lg:grid-cols-6">
        <Fact label="File" value={report.file.name} mono />
        <Fact
          label="Project"
          value={
            project ? `${project.shortName}${project.name !== project.shortName ? ` · ${project.name}` : ""}` : "—"
          }
        />
        <Fact label="P6 version" value={report.p6Version ?? "—"} />
        <Fact label="Data date" value={project?.dataDate ?? "Not set"} />
        <Fact
          label="Activities"
          value={`${report.counts.activities}`}
          note={`${report.counts.checked} checked · ${report.counts.complete} complete · ${report.counts.excluded} LOE/WBS`}
        />
        <Fact label="Relationships" value={`${report.counts.relationships}`} />
      </dl>

      {report.projects.length > 1 && (
        <p className="text-xs text-muted-foreground">
          This file holds {report.projects.length} projects; the checks cover the activities of all of them.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {report.checks.map((c) => (
          <CheckTile key={c.id} check={c} selected={c.id === check.id} onSelect={() => setSelected(c.id)} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Total float</CardTitle>
            <CardDescription>
              Checked activities by total float, in working days on each activity's own calendar.
              {report.counts.noFloatValue > 0 && ` ${report.counts.noFloatValue} have no float value and are left out.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FloatChart bins={report.floatHistogram} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{check.name}</CardTitle>
            <CardDescription>
              {check.rule}. {check.count} of {check.denominator} checked activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTable check={check} />
          </CardContent>
        </Card>
      </div>

      <BrokenRows report={report} />

      <p className="text-3xs/relaxed text-muted-foreground">
        Checked activities are those not yet complete, leaving out level-of-effort and WBS summary activities. Float is
        converted from hours with each activity's calendar (hours per day); a blank calendar means the project's
        default. High float is more than 44 working days (DCMA 14-point check). Links pointing to activities that are
        not in the file are reported as broken rows and not counted.
      </p>
    </div>
  );
}

function Fact({ label, value, note, mono }: { label: string; value: string; note?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-3xs font-medium tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd className={cn("mt-1 truncate font-medium", mono && "font-mono")} title={value}>
        {value}
      </dd>
      {note && <dd className="mt-0.5 text-3xs text-muted-foreground">{note}</dd>}
    </div>
  );
}

function CheckTile({ check, selected, onSelect }: { check: CheckResult; selected: boolean; onSelect: () => void }) {
  const pass = check.count === 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-5 text-left shadow-sm transition-colors",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-foreground/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-3xs font-medium tracking-wider text-muted-foreground uppercase">{check.name}</span>
        <Badge variant={pass ? "success" : "danger"}>
          {pass ? <RiCheckLine /> : <RiAlertLine />}
          {pass ? "None found" : "Flagged"}
        </Badge>
      </div>
      <div>
        <p className="font-heading text-xl font-medium tabular-nums">
          {check.count}
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            of {check.denominator} · {check.pct}%
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{check.rule}</p>
      </div>
    </button>
  );
}

const chartConfig = {
  count: { label: "Activities", color: "var(--primary)" },
} satisfies ChartConfig;

function FloatChart({ bins }: { bins: XerReport["floatHistogram"] }) {
  const fill = (id: string) =>
    id === "negative" ? "var(--destructive)" : id === "high" ? "oklch(0.769 0.188 70.08)" : "var(--primary)";
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <BarChart data={bins} margin={{ top: 20, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={<ChartTooltipContent hideIndicator labelFormatter={(label) => `${label} working days`} />}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {bins.map((bin) => (
            <Cell key={bin.id} fill={fill(bin.id)} />
          ))}
          <LabelList dataKey="count" position="top" className="fill-muted-foreground text-3xs" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

function ActivityTable({ check }: { check: CheckResult }) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? check.activities : check.activities.slice(0, PREVIEW_ROWS);
  if (check.activities.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground">No activities fail this check.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-[420px] overflow-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity</TableHead>
              <TableHead>Type · status</TableHead>
              <TableHead className="text-right">Float (d)</TableHead>
              <TableHead>Finding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.taskId}>
                <TableCell className="max-w-[200px]">
                  <span className="block font-mono text-3xs text-muted-foreground">{a.code}</span>
                  <span className="block truncate" title={a.name}>
                    {a.name}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="block">{TYPE_LABEL[a.type] ?? a.type}</span>
                  <span className="block text-3xs">{STATUS_LABEL[a.status] ?? a.status}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{a.totalFloatDays ?? "—"}</TableCell>
                <TableCell className="min-w-[160px] whitespace-normal">{a.detail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {check.activities.length > PREVIEW_ROWS && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show fewer" : `Show all ${check.activities.length}`}
        </Button>
      )}
    </div>
  );
}

const KIND_LABEL: Record<string, string> = {
  structure: "Structure",
  value: "Bad value",
  reference: "Broken link",
  duplicate: "Duplicate",
};

function BrokenRows({ report }: { report: XerReport }) {
  const [showAll, setShowAll] = useState(false);
  const rows = report.brokenRows;
  const byKind = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1);
    return [...counts.entries()];
  }, [rows]);
  const visible = showAll ? rows : rows.slice(0, PREVIEW_ROWS);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Broken rows
          <Badge variant={rows.length === 0 ? "success" : "warning"}>{rows.length}</Badge>
          {byKind.map(([kind, count]) => (
            <Badge key={kind} variant="neutral">
              {KIND_LABEL[kind] ?? kind}: {count}
            </Badge>
          ))}
        </CardTitle>
        <CardDescription>
          Rows the reader could not use as they are, with the line number in the file so each one can be found in a text
          editor. Tables read: {report.tables.map((t) => `${t.name} (${t.rows})`).join(", ")}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="flex items-center gap-1.5 py-4 text-xs text-muted-foreground">
            <RiCheckLine className="size-4 text-primary" /> Every row was read without a problem.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="max-h-[420px] overflow-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Line</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead className="text-right">Row</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((row, i) => (
                    <TableRow key={`${row.line}-${row.field}-${i}`}>
                      <TableCell className="text-right font-mono tabular-nums">{row.line}</TableCell>
                      <TableCell className="font-mono">{row.table}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.rowNumber ?? "—"}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{row.field ?? "—"}</TableCell>
                      <TableCell>{KIND_LABEL[row.kind] ?? row.kind}</TableCell>
                      <TableCell className="min-w-[280px]">{row.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rows.length > PREVIEW_ROWS && (
              <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Show fewer" : `Show all ${rows.length}`}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
