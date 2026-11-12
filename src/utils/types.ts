import type { JSX } from "react";

export type SideNavItem = {
  title: string;
  /** Sections get their own expanded-sidebar UI; menu entries stay in the workspace menu. */
  placement?: "section" | "menu";
  /** Where the item navigates to, and the first path it counts as selected on. */
  path: string;
  /**
   * Extra path prefixes that also count as this item being selected.
   *
   * For a screen that BELONGS to a nav item but does not live under its path —
   * a detail view reached from a list at a different URL, say — where a prefix
   * test on `path` alone would leave the sidebar showing nothing selected, and
   * an admin shell with no selected item reads as "you have navigated out of
   * the app".
   *
   * Prefixes, matched the same way `path` is: exact, or followed by a `/`.
   */
  activeOn?: string[];
  indicator?: boolean;
  /** A number shown beside the item (a dot in the rail), e.g. items waiting in the Inbox. */
  count?: number;
  icon?: JSX.Element;
  submenu?: boolean;
  subMenuItems?: SideNavItem[];
};

export interface SideNavState {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
}

export type SideNavbar = {
  title: string;
  items: SideNavItem[];
};
