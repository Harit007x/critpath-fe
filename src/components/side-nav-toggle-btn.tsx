import { RiSidebarFoldLine, RiSidebarUnfoldLine } from "@remixicon/react";

import { cn } from "@/lib/utils";

interface SideNavToggleBtnProps {
  /** True when the sidebar is a rail (desktop) or hidden (mobile). */
  collapsed: boolean;
  toggleCollapse: () => void;
  className?: string;
}

/**
 * The one control that opens and closes the sidebar.
 *
 * It lives in the top bar rather than inside the sidebar, so it stays in the
 * same place whatever the sidebar is doing — a control that moves when you use
 * it makes you hunt for it the second time.
 */
export const SideNavToggleBtn = ({
  collapsed,
  toggleCollapse,
  className,
}: SideNavToggleBtnProps) => {
  const Icon = collapsed ? RiSidebarUnfoldLine : RiSidebarFoldLine;

  return (
    <button
      tabIndex={0}
      type="button"
      onClick={toggleCollapse}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
      className={cn(
        "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none",
        "transition-[background-color,color,transform] duration-150 ease-out",
        "hover:bg-muted/50 hover:text-foreground active:scale-[0.97] active:duration-75",
        "focus-visible:ring-2 focus-visible:ring-ring/30",
        className
      )}
    >
      <Icon className="size-4" />
    </button>
  );
};
