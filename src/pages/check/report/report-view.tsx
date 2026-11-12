import { useState } from "react";
import { Link } from "react-router-dom";
import { RiAlertLine, RiArrowLeftLine, RiDownload2Line, RiInformationLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { checkPaths, formatDateTime } from "@/pages/check/labels";
import { AskPanel } from "@/pages/check/report/ask-panel";
import { ActivityTable, BrokenRowsTable } from "@/pages/check/report/finding-tables";
import { findingsOf, firstFlagged, type Finding, type FindingId } from "@/pages/check/report/findings";
import { FloatChart } from "@/pages/check/report/float-chart";
import { xerService, type XerReport } from "@/services/xer.service";

/** One file's screen: what is wrong with it, where, and a place to ask about it. */
export function ReportView({
  report,
  loading,
  error,
  alreadyStored,
}: {
  report: XerReport | undefined;
  loading: boolean;
  error: unknown;
  /** The upload that opened this screen matched a file already stored. */
  alreadyStored: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-2 self-start text-muted-foreground" asChild>
        <Link to={checkPaths.library}>
          <RiArrowLeftLine /> All schedules
        </Link>
      </Button>

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-xs text-muted-foreground">
          <Spinner className="size-4" /> Reading the schedule…
        </div>
      ) : error || !report ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive"
        >
          <RiAlertLine className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-medium">This schedule could not be opened.</span>{" "}
            {getApiErrorMessage(error, "Something went wrong reading the file.")}
          </p>
        </div>
      ) : (
        <Report report={report} alreadyStored={alreadyStored} />
      )}
    </div>
  );
}

function Report({ report, alreadyStored }: { report: XerReport; alreadyStored: boolean }) {
  const findings = findingsOf(report);
  const [selected, setSelected] = useState<FindingId>(() => firstFlagged(findings));
  const finding = findings.find((f) => f.id === selected) ?? findings[0];

  return (
    <>
      <ReportHeader report={report} />

      {alreadyStored && <AlreadyUploaded uploadedAt={report.file.uploadedAt} />}

      <section aria-label="Findings" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {findings.map((f) => (
          <FindingTile key={f.id} finding={f} selected={f.id === finding.id} onSelect={() => setSelected(f.id)} />
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{finding.name}</CardTitle>
          <CardDescription>{finding.rule}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Keyed, so another finding opens with no search, filter or page left over. */}
          {finding.id === "broken_rows" ? (
            <BrokenRowsTable key={finding.id} rows={report.brokenRows} />
          ) : (
            <ActivityTable
              key={finding.id}
              activities={report.checks.find((c) => c.id === finding.id)?.activities ?? []}
            />
          )}
        </CardContent>
      </Card>

      {report.file.id ? (
        <AskPanel key={report.file.id} fileId={report.file.id} />
      ) : (
        <p className="text-xs text-muted-foreground">Upload this file to ask questions about it.</p>
      )}

      <ScheduleDetails report={report} />
    </>
  );
}

/** Which file this is: project, file name, data date, and the download link for a stored upload. */
function ReportHeader({ report }: { report: XerReport }) {
  const project = report.projects[0];
  const title = project ? project.name || project.shortName : report.file.name;
  const meta = [
    report.file.name,
    project?.dataDate ? `Data date ${project.dataDate}` : null,
    report.file.uploadedAt ? `Uploaded ${formatDateTime(report.file.uploadedAt)}` : report.file.sample ? "Sample" : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="truncate font-heading text-lg font-medium" title={title}>
          {title}
        </h1>
        <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          {meta.map((item, i) => (
            <span key={i} className={cn(i === 0 && "font-mono")}>
              {i > 0 && <span className="mr-2">·</span>}
              {item}
            </span>
          ))}
        </p>
      </div>
      {report.file.id && (
        <Button variant="outline" size="sm" asChild>
          <a href={xerService.contentUrl(report.file.id)}>
            <RiDownload2Line /> Download
          </a>
        </Button>
      )}
    </div>
  );
}

function FindingTile({ finding, selected, onSelect }: { finding: Finding; selected: boolean; onSelect: () => void }) {
  const pass = finding.count === 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-2 overflow-hidden rounded-lg border p-4 text-left transition-colors",
        // Selected reads like an open tab: tinted, and a bar along the bottom edge.
        selected
          ? "border-primary bg-primary/5 shadow-[inset_0_-3px_0_var(--primary)]"
          : "border-border bg-card shadow-sm hover:border-foreground/30 hover:bg-muted/40",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={cn("text-xs font-medium", !selected && "text-muted-foreground")}>{finding.name}</span>
        {pass ? (
          <span className="text-3xs text-muted-foreground">None found</span>
        ) : (
          <Badge variant="danger">
            <RiAlertLine /> Flagged
          </Badge>
        )}
      </span>
      <span
        className={cn("font-heading text-2xl font-medium tabular-nums", pass ? "text-muted-foreground" : "text-foreground")}
      >
        {finding.count}
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">{finding.scope}</span>
      </span>
    </button>
  );
}

/** Shown when an upload matched a file already stored, so it does not look like the upload failed. */
function AlreadyUploaded({ uploadedAt }: { uploadedAt: string | null }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground"
    >
      <RiInformationLine className="mt-0.5 size-4 shrink-0 text-foreground" />
      <p>
        <span className="font-medium text-foreground">Already uploaded.</span>{" "}
        {uploadedAt ? `Showing the report from ${formatDateTime(uploadedAt)}.` : "Showing the saved report."}
      </p>
    </div>
  );
}

/** Context for the findings: what the file holds, and how float is spread. */
function ScheduleDetails({ report }: { report: XerReport }) {
  const { counts } = report;
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
            <Fact label="Activities" value={`${counts.activities}`} note={`${counts.checked} checked`} />
            <Fact label="Relationships" value={`${counts.relationships}`} />
            <Fact
              label="Skipped"
              value={`${counts.complete + counts.excluded}`}
              note={`${counts.complete} complete · ${counts.excluded} LOE/WBS`}
            />
            <Fact label="P6 version" value={report.p6Version ?? "—"} />
            {report.projects.length > 1 && <Fact label="Projects" value={`${report.projects.length}`} />}
          </dl>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Total float <Badge variant="neutral">working days</Badge>
          </CardTitle>
          {counts.noFloatValue > 0 && (
            <CardDescription>{counts.noFloatValue} without float left out.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <FloatChart bins={report.floatHistogram} />
        </CardContent>
      </Card>
    </div>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-3xs font-medium tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium tabular-nums" title={value}>
        {value}
      </dd>
      {note && <dd className="mt-0.5 text-3xs text-muted-foreground">{note}</dd>}
    </div>
  );
}
