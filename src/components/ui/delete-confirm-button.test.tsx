import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle,
} from "@/components/ui/dialog";

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("delete confirmation keyboard focus", () => {
  async function renderDialog({ disabled = false, loading = false } = {}) {
    const confirm = vi.fn();
    const cancel = vi.fn();
    const onOpenChange = vi.fn();
    await act(async () => {
      root.render(
        <Dialog open onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Delete this note?</DialogTitle>
            <DialogDescription>The note will be deleted.</DialogDescription>
            <DialogFooter>
              <Button onClick={cancel}>Cancel</Button>
              <DeleteConfirmButton disabled={disabled} loading={loading} onClick={confirm}>
                Delete
              </DeleteConfirmButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );
    });
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
    const cancelButton = buttons.find((el) => el.textContent === "Cancel")!;
    const button = buttons.find((el) => el.textContent?.includes("Delete"))!;
    return { button, cancelButton, confirm, cancel, onOpenChange };
  }

  const press = (key: string) =>
    act(async () => {
      document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    });

  it("focuses Cancel on open, so Enter alone never deletes", async () => {
    const { button, cancelButton, confirm } = await renderDialog();
    expect(document.activeElement).toBe(cancelButton);
    expect(button.type).toBe("button");
    expect(confirm).not.toHaveBeenCalled();
  });

  it("moves between Cancel and Delete with the arrow keys", async () => {
    const { button, cancelButton, confirm } = await renderDialog();
    await press("ArrowRight");
    expect(document.activeElement).toBe(button);
    await press("ArrowRight");
    expect(document.activeElement).toBe(button);
    await press("ArrowLeft");
    expect(document.activeElement).toBe(cancelButton);
    await press("ArrowLeft");
    expect(document.activeElement).toBe(cancelButton);
    await press("ArrowRight");
    await act(async () => (document.activeElement as HTMLButtonElement).click());
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it.each([{ disabled: true }, { loading: true }])("cannot reach or confirm while unavailable: %o", async (state) => {
    const { button, cancelButton, confirm } = await renderDialog(state);
    expect(button.disabled).toBe(true);
    await press("ArrowRight");
    expect(document.activeElement).toBe(cancelButton);
    await act(async () => button.click());
    expect(confirm).not.toHaveBeenCalled();
  });

  it("keeps Escape dismissal", async () => {
    const { confirm, onOpenChange } = await renderDialog();
    await press("Escape");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(confirm).not.toHaveBeenCalled();
  });
});
