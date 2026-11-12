import { useRef, useState, type DragEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RiAlertLine, RiFileTextLine, RiUpload2Line } from "@remixicon/react";

import { DataTable, DataTableColumnHeader, fixedColumns, inFacet } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/errors";
import { formatTimeLeft } from "@/lib/upload-progress";
import { MAX_XER_MB } from "@/lib/xer-upload";
import { cn } from "@/lib/utils";
import { checkPaths, formatDateTime } from "@/pages/check/labels";
import type { UploadStage } from "@/pages/check/send-xer";
import type { XerSample, XerUpload } from "@/services/xer.service";

/** The start screen: upload a file, try a sample, or reopen an earlier upload. */
export function LibraryView({
  samples,
  uploads,
  onFile,
  uploading,
  stage,
  uploadError,
}: {
  samples: XerSample[];
  uploads: XerUpload[];
  onFile: (file: File) => void;
  /** The file being checked, while it uploads. */
  uploading: File | null;
  /** Where the file is on its way to a report, while `uploading`. */
  stage: UploadStage | null;
  uploadError: unknown;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <PageHeader
        title="Schedule checker"
        subtitle="Check a P6 .xer file for missing links, negative float and high float."
        className="mb-0"
      />

      <div className="flex flex-col gap-3">
        <UploadDropzone onFile={onFile} uploading={uploading} stage={stage} />
        {uploadError != null && !uploading && <UploadError error={uploadError} />}
        {samples.length > 0 && <SampleLinks samples={samples} />}
      </div>

      <RecentUploads uploads={uploads} />
    </div>
  );
}

function UploadDropzone({
  onFile,
  uploading,
  stage,
}: {
  onFile: (file: File) => void;
  uploading: File | null;
  stage: UploadStage | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const choose = (file: File | undefined) => file && !uploading && onFile(file);
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-busy={uploading != null}
      onClick={() => !uploading && input.current?.click()}
      onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && !uploading && input.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-card px-6 py-12 text-center transition-colors",
        uploading ? "cursor-progress border-primary/50" : "cursor-pointer hover:border-foreground/30",
        dragging ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      {uploading ? (
        <UploadStatus file={uploading} stage={stage} />
      ) : (
        <>
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <RiUpload2Line className="size-5" />
          </span>
          <p className="text-sm font-medium">Drop a .xer file here, or click to choose</p>
          <p className="text-xs text-muted-foreground">Primavera P6 export · up to {MAX_XER_MB} MB</p>
        </>
      )}
      <input
        ref={input}
        type="file"
        accept=".xer"
        className="hidden"
        onChange={(event) => {
          choose(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}

/** Preparing the file, sending it (bar, percent, time left), then checking it, which takes seconds. */
function UploadStatus({ file, stage }: { file: File; stage: UploadStage | null }) {
  if (stage?.stage === "uploading") {
    return (
      <>
        <p className="text-sm font-medium">Uploading {file.name}</p>
        <Progress value={stage.percent} aria-label="Upload progress" className="h-1.5 w-full max-w-sm" />
        <p className="text-xs text-muted-foreground tabular-nums">
          {stage.percent}%{stage.secondsLeft != null && ` · ${formatTimeLeft(stage.secondsLeft)}`}
        </p>
      </>
    );
  }
  const checking = stage?.stage === "checking";
  return (
    <>
      <Spinner className="size-6 text-primary" />
      <p className="text-sm font-medium">
        {checking ? "Checking" : "Preparing"} {file.name}…
      </p>
      <p className="text-xs text-muted-foreground">
        {checking ? "Uploaded, reading the schedule" : "Compressing it to upload faster"}
      </p>
    </>
  );
}

function UploadError({ error }: { error: unknown }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
    >
      <RiAlertLine className="mt-0.5 size-4 shrink-0" />
      <p>
        <span className="font-medium">This file could not be checked.</span>{" "}
        {getApiErrorMessage(error, "Something went wrong reading the file.")}
      </p>
    </div>
  );
}

function SampleLinks({ samples }: { samples: XerSample[] }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs text-muted-foreground">
      <span className="mr-1">No file handy? Try a sample:</span>
      {samples.map((sample) => (
        <Button key={sample.id} variant="outline" size="sm" asChild>
          <Link to={checkPaths.sample(sample.id)} title={sample.description}>
            <RiFileTextLine /> {sample.title}
          </Link>
        </Button>
      ))}
    </p>
  );
}

const findingsTotal = (u: XerUpload) => u.missingLinks + u.negativeFloat + u.highFloat + u.brokenRowCount;

const uploadColumns = fixedColumns<XerUpload>([
  {
    id: "file",
    accessorFn: (u) => `${u.fileName} ${u.projectName ?? ""}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="File" />,
    cell: ({ row: { original: u } }) => (
      <div className="max-w-[280px]">
        <span className="block truncate font-medium" title={u.fileName}>
          {u.fileName}
        </span>
        <span className="block truncate text-3xs text-muted-foreground" title={u.projectName ?? undefined}>
          {u.projectName ?? "No project"}
        </span>
      </div>
    ),
  },
  {
    id: "activities",
    accessorKey: "activities",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Activities" />,
    cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
  },
  {
    id: "findings",
    accessorFn: (u) => (findingsTotal(u) > 0 ? "flagged" : "clean"),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Findings" />,
    cell: ({ row }) => <FindingsBadge upload={row.original} />,
    sortingFn: (a, b) => findingsTotal(a.original) - findingsTotal(b.original),
    filterFn: inFacet,
  },
  {
    id: "uploaded",
    accessorKey: "uploadedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Uploaded" />,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(getValue<string>())}</span>
    ),
  },
]);

/** Stored uploads, newest first: search, filter clean or flagged, sort, page; a row opens its report. */
function RecentUploads({ uploads }: { uploads: XerUpload[] }) {
  const navigate = useNavigate();
  if (uploads.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Recent uploads <Badge variant="neutral">{uploads.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={uploadColumns}
          data={uploads}
          onRowClick={(row) => navigate(checkPaths.upload(row.original.id))}
          toolbar
          toolbarProps={{
            searchColumn: "file",
            searchPlaceholder: "Search file or project…",
            facetedFilters: [
              {
                columnId: "findings",
                title: "Findings",
                options: [
                  { value: "flagged", label: "Flagged" },
                  { value: "clean", label: "Clean" },
                ],
              },
            ],
            showViewOptions: false,
          }}
          emptyText="No uploads match."
        />
      </CardContent>
    </Card>
  );
}

/** One badge per upload: clean, or how many findings, with the breakdown on hover. */
function FindingsBadge({ upload: u }: { upload: XerUpload }) {
  const total = findingsTotal(u);
  if (total === 0) return <Badge variant="success">Clean</Badge>;
  const breakdown = [
    `${u.missingLinks} missing links`,
    `${u.negativeFloat} negative float`,
    `${u.highFloat} high float`,
    `${u.brokenRowCount} broken rows`,
  ].join(" · ");
  return (
    <Badge variant="danger" title={breakdown}>
      {total} flagged
    </Badge>
  );
}
