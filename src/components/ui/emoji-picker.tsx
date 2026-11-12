import { EmojiPicker as Picker, type Emoji } from "frimousse"
import { RiSearchLine } from "@remixicon/react"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

/**
 * A searchable emoji grid (frimousse), styled with the kit's tokens. Emoji data
 * comes from the Emojibase CDN on first open and is cached by the browser.
 */
function EmojiPicker({
  onSelect,
  className,
}: {
  onSelect: (emoji: Emoji) => void
  className?: string
}) {
  return (
    <Picker.Root
      className={cn(
        "isolate flex h-80 w-[19rem] flex-col bg-popover text-popover-foreground",
        className
      )}
      columns={9}
      onEmojiSelect={onSelect}
    >
      <div className="flex items-center gap-2 border-b border-border px-3">
        <RiSearchLine className="size-3.5 shrink-0 text-muted-foreground" />
        <Picker.Search
          autoFocus
          className="h-9 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          placeholder="Search emoji…"
        />
        <Picker.SkinToneSelector className="flex size-6 shrink-0 items-center justify-center rounded-md text-sm hover:bg-muted" />
      </div>
      <Picker.Viewport className="relative flex-1 outline-hidden">
        <Picker.Loading className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Spinner className="size-4" />
        </Picker.Loading>
        <Picker.Empty className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          No emoji found
        </Picker.Empty>
        <Picker.List
          className="pb-1.5 select-none"
          components={{
            CategoryHeader: ({ category, ...props }) => (
              <div
                className="bg-popover px-3 pt-2.5 pb-1 text-2xs font-medium text-muted-foreground"
                {...props}
              >
                {category.label}
              </div>
            ),
            Row: ({ children, ...props }) => (
              <div className="scroll-my-1.5 px-1.5" {...props}>
                {children}
              </div>
            ),
            Emoji: ({ emoji, ...props }) => (
              <button
                className="flex size-8 items-center justify-center rounded-md text-lg data-[active]:bg-muted"
                type="button"
                {...props}
              >
                {emoji.emoji}
              </button>
            ),
          }}
        />
      </Picker.Viewport>
    </Picker.Root>
  )
}

export { EmojiPicker }
