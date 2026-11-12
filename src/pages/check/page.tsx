import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { xerUploadProblem } from "@/lib/xer-upload";
import { checkPaths } from "@/pages/check/labels";
import { LibraryView } from "@/pages/check/library-view";
import type { ReportLocationState } from "@/pages/check/report/page";
import { xerService } from "@/services/xer.service";

/** /check: upload a file, try a sample or reopen an upload. A checked file opens on its own screen. */
export default function CheckLibraryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const samples = useQuery({ queryKey: ["xer-samples"], queryFn: xerService.samples });
  const uploads = useQuery({ queryKey: ["xer-uploads"], queryFn: xerService.uploads });

  const upload = useMutation({
    mutationFn: (file: File) => {
      // Turned away here, before any upload; the server checks the same things again.
      const problem = xerUploadProblem(file);
      return problem ? Promise.reject(new Error(problem)) : xerService.checkFile(file);
    },
    onSuccess: ({ alreadyStored, ...report }) => {
      const id = report.file.id;
      if (!id) return;
      queryClient.setQueryData(["xer-upload", id], report);
      void queryClient.invalidateQueries({ queryKey: ["xer-uploads"] });
      const state: ReportLocationState = { alreadyStored };
      navigate(checkPaths.upload(id), { state });
    },
  });

  return (
    <LibraryView
      samples={samples.data ?? []}
      uploads={uploads.data ?? []}
      onFile={(file) => upload.mutate(file)}
      uploading={upload.isPending ? (upload.variables ?? null) : null}
      uploadError={upload.error}
    />
  );
}
