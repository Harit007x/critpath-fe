import { useEffect, useRef, useState } from "react";
import { RiCameraLine, RiPencilLine } from "@remixicon/react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { squareImage } from "@/lib/image";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";

/** The API takes these two only; the square keeps the picked type (PNG keeps its transparency). */
const PHOTO_TYPES = ["image/png", "image/jpeg"] as const;
type PhotoType = (typeof PHOTO_TYPES)[number];
const isPhotoType = (type: string): type is PhotoType =>
  (PHOTO_TYPES as readonly string[]).includes(type);

/**
 * Settings → Profile: the photo with the name beside it and the email under it, as Linear does.
 * The photo uploads at once (click it, use Change photo, or drop an image on the card) and shows
 * the new picture under a spinner while it does. The name is edited in place: Enter or leaving
 * the field saves, Esc puts it back.
 */
export function ProfileCard() {
  const user = useAuthStore((state) => state.user);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const changePhoto = async (change: () => Promise<void>, done: string) => {
    setBusy(true);
    try {
      await change();
      toast.success(done);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Something went wrong"));
    } finally {
      setBusy(false);
      setPreview(null);
    }
  };

  const upload = async (file: File | undefined) => {
    if (!file || busy) return;
    if (!isPhotoType(file.type)) {
      toast.error("Use a PNG or JPEG image");
      return;
    }
    let square: Blob;
    try {
      square = await squareImage(file, file.type);
    } catch {
      toast.error("That file could not be read as an image");
      return;
    }
    setPreview(URL.createObjectURL(square));
    await changePhoto(() => authService.setImage(square), "Photo updated");
  };

  const saveName = async () => {
    const trimmed = name.trim();
    // An emptied field is a slip, not a request for no name.
    if (!trimmed || trimmed === user?.name) {
      setName(user?.name ?? "");
      return;
    }
    setSavingName(true);
    try {
      await authService.updateName(trimmed);
      setName(trimmed);
      toast.success("Name updated");
    } catch (error) {
      setName(user?.name ?? "");
      toast.error(getApiErrorMessage(error, "Something went wrong"));
    } finally {
      setSavingName(false);
    }
  };

  const shown = preview ?? user?.image ?? null;
  const initials = (user?.name ?? "").substring(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-4 transition-colors sm:gap-5 sm:px-5",
        dragging && "bg-primary/5",
      )}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void upload(event.dataTransfer.files[0]);
      }}
    >
      <button
        aria-label={user?.image ? "Change photo" : "Upload photo"}
        className={cn(
          "group/photo relative shrink-0 rounded-full outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default",
          dragging && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        )}
        disabled={busy}
        onClick={() => fileInput.current?.click()}
        type="button"
      >
        {/* Keyed: Radix keeps "loaded" when the image unmounts, which hid the initials. */}
        <Avatar className="size-16 sm:size-[4.5rem]" key={shown ?? ""}>
          {shown && <AvatarImage alt="" src={shown} />}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white transition-opacity",
            busy || dragging
              ? "opacity-100"
              : "opacity-0 group-hover/photo:opacity-100 group-focus-visible/photo:opacity-100",
          )}
        >
          {busy ? <Spinner className="size-5" /> : <RiCameraLine className="size-5" />}
        </span>
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="group/name relative -ml-2 max-w-sm">
          <input
            aria-label="Name"
            className="h-9 w-full rounded-md border border-transparent bg-transparent px-2 pr-8 font-heading text-base font-medium text-foreground outline-none transition-colors hover:border-border focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
            disabled={savingName}
            maxLength={100}
            onBlur={() => void saveName()}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                setName(user?.name ?? "");
                // Blur after the reset lands, so onBlur sees nothing to save.
                const field = event.currentTarget;
                requestAnimationFrame(() => field.blur());
              }
            }}
            placeholder="Your name"
            value={name}
          />
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity group-hover/name:opacity-100 group-focus-within/name:opacity-0">
            {savingName ? <Spinner className="size-3.5" /> : <RiPencilLine className="size-3.5" />}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-1 gap-y-1">
          <Button
            className="-ml-2"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            size="sm"
            variant="ghost"
          >
            {user?.image ? "Change photo" : "Upload photo"}
          </Button>
          {user?.image && (
            <Button
              className="text-muted-foreground hover:text-destructive"
              disabled={busy}
              onClick={() => void changePhoto(authService.removeImage, "Photo removed")}
              size="sm"
              variant="ghost"
            >
              Remove
            </Button>
          )}
          <span className="hidden text-2xs text-muted-foreground sm:inline">
            {dragging ? "Drop to upload" : "· PNG or JPEG"}
          </span>
        </div>
      </div>

      <input
        accept={PHOTO_TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
        ref={fileInput}
        type="file"
      />
    </div>
  );
}
