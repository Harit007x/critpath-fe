import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "react-router-dom";

import { ReportView } from "@/pages/check/report/report-view";
import { xerService } from "@/services/xer.service";

/** Set by the upload that opened the report. */
export type ReportLocationState = { alreadyStored?: boolean } | null;

/** /check/files/:fileId (a stored upload) and /check/samples/:sampleId (a bundled sample). */
export default function CheckReportPage() {
  const { fileId, sampleId } = useParams();
  const state = useLocation().state as ReportLocationState;

  // A report never changes, so each is fetched once.
  const stored = useQuery({
    queryKey: ["xer-upload", fileId ?? null],
    queryFn: () => xerService.upload(fileId!),
    enabled: fileId != null,
    staleTime: Infinity,
  });
  const sample = useQuery({
    queryKey: ["xer-sample-check", sampleId ?? null],
    queryFn: () => xerService.checkSample(sampleId!),
    enabled: sampleId != null,
    staleTime: Infinity,
  });
  const current = fileId != null ? stored : sample;

  return (
    <ReportView
      key={fileId ?? sampleId}
      report={current.data}
      loading={current.isLoading}
      error={current.error}
      alreadyStored={fileId != null && state?.alreadyStored === true}
    />
  );
}
