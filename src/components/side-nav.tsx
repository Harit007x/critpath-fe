import { type RefObject, useRef, useEffect, useMemo } from "react";
import clsx from "clsx";
import MenuItem, { NavHighlightProvider } from "./menu-item";
import Header from "./header";
import BrandMark from "./brand-mark";
import { useSidebarMediaQuery } from "@/hooks/useSidebarMediaQuery";
import { useHandleClickOutside } from "@/hooks/useHandleClickOutside";
import type { SideNavbar } from "@/utils/types";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  RiArrowDownSLine,
  RiLogoutBoxRLine,
  RiSettings3Line,
} from "@remixicon/react";
import { toast } from "sonner";
import { APP_NAME, AUTH_ENABLED } from "@/config/app";
import { authService } from "@/services/auth.service";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";

interface SideNavProps {
  children: React.ReactNode;
  navBar: SideNavbar[];
}

/**
 * The app shell: a full-height sidebar beside the content column. Only the
 * content column scrolls, so pages must not assume page-level scroll.
 *
 * Collapsing narrows the sidebar to a 52px icon rail rather than removing it;
 * on a small screen it is a drawer over the content instead.
 */
const SideNav = ({ navBar, children }: SideNavProps) => {
  const sideNavRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isSmallScreen, sidebarOpen, setSidebarOpen } = useSidebarMediaQuery(
    "(min-width: 1024px)",
  );

  const { user, logout } = useAuthStore();
  const userName = user?.name || "Guest";
  const userEmail = user?.email || "";
  const userInitials = userName.substring(0, 2).toUpperCase();

  /**
   * Rail mode is a desktop state only. On a small screen the sidebar is a
   * drawer over the content, and a 68px strip permanently taking a fifth of a
   * phone's width would be a worse answer than sliding it away.
   */
  const rail = !isSmallScreen && !sidebarOpen;
  const onNavigate = isSmallScreen ? () => setSidebarOpen(false) : undefined;
  // Keep the full navigation catalog for breadcrumbs, including pages moved out of the main list.
  const visibleNav = navBar
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.placement || (rail && item.placement === "section")),
    }))
    .filter((group) => group.items.length > 0);

  const handleLogout = async () => {
    try {
      // Clears the httpOnly session cookie server-side.
      await authService.logout();
    } catch {
      // Already signed out server-side, or the API is unreachable: clear locally anyway.
    }
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  /**
   * The one nav item the current route belongs to.
   *
   * Longest match wins, which is what stops "Settings" and "Accounts" both
   * lighting up on /settings/accounts. Resolved once here rather than per item,
   * because an item cannot know whether a longer sibling also matches — and two
   * selected items is a sidebar that has stopped answering "where am I".
   */
  const selectedPath = useMemo(() => {
    const onPath = (path: string) =>
      pathname === path || pathname.startsWith(path + "/");

    return (
      navBar
        .flatMap((group) => group.items)
        .filter(
          (item) => onPath(item.path) || (item.activeOn ?? []).some(onPath),
        )
        .sort((a, b) => b.path.length - a.path.length)[0]?.path ?? null
    );
  }, [navBar, pathname]);

  /** The nav entry the current route falls under, for the top bar's breadcrumb. */
  const activePage = useMemo(() => {
    const onPath = (path: string) =>
      pathname === path || pathname.startsWith(path + "/");

    const items = navBar.flatMap((group) => group.items);
    const match = items
      // `activeOn` covers a screen that belongs to an item without living under
      // its path — a detail view reached from a list at a different URL, say.
      // Without it the crumb goes blank there, which reads as a broken page.
      .filter((item) => onPath(item.path) || (item.activeOn ?? []).some(onPath))
      // The longest matching path wins, so a nested route does not fall back
      // to a shorter sibling that happens to share a prefix.
      .sort((a, b) => b.path.length - a.path.length)[0];
    return match && { title: match.title, icon: match.icon };
  }, [navBar, pathname]);

  const crumb = activePage;

  // Prevent body scroll when the drawer is open on a small screen.
  useEffect(() => {
    if (isSmallScreen && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSmallScreen, sidebarOpen]);

  // The drawer on a phone: focus goes in when it opens and back when it closes, and Esc closes it.
  // `wasDrawerOpen` starts true so the sidebar's open-then-closed first render doesn't take focus.
  const drawerOpen = isSmallScreen && sidebarOpen;
  const wasDrawerOpen = useRef(true);
  const beforeDrawer = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const opened = drawerOpen && !wasDrawerOpen.current;
    const closed = !drawerOpen && wasDrawerOpen.current;
    wasDrawerOpen.current = drawerOpen;
    if (opened) {
      beforeDrawer.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      sideNavRef.current?.querySelector<HTMLElement>("a[href], button")?.focus();
    } else if (closed) {
      if (beforeDrawer.current?.isConnected) beforeDrawer.current.focus();
      beforeDrawer.current = null;
    }
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, setSidebarOpen]);

  useHandleClickOutside(
    sideNavRef as RefObject<HTMLDivElement>,
    isSmallScreen,
    () => setSidebarOpen(false),
  );

  const toggleCollapse = () => setSidebarOpen(!sidebarOpen);
  const { width, resizing, handleProps } = useSidebarWidth(() =>
    setSidebarOpen(false),
  );
  // On a phone the drawer keeps a fixed width; on desktop it is yours to drag.
  const expandedWidth = isSmallScreen ? 264 : width;

  return (
    <TooltipProvider>
      <div className="h-screen w-full overflow-hidden bg-sidebar">
        <div className="relative flex h-full w-full overflow-hidden">
          {isSmallScreen && sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-background/60 backdrop-blur-[2px] transition-opacity duration-200 ease-out"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          <aside
            ref={sideNavRef}
            // Slid off a phone's screen it is still in the page, and Tab walked through every
            // hidden row before reaching anything visible.
            inert={isSmallScreen && !sidebarOpen}
            style={rail ? undefined : { width: expandedWidth }}
            className={clsx(
              // Nothing in the sidebar is text to copy, and a double-click on a
              // row should not paint a selection over it, as in Linear.
              "h-full shrink-0 bg-sidebar select-none motion-reduce:transition-none",
              !resizing && "transition-[width] duration-200 ease-out",
              // Not alongside `fixed`: Tailwind emits `relative` later, so it would win.
              !isSmallScreen && "relative",
              {
                "max-w-[85vw]": isSmallScreen,
                "w-[52px]": rail,
                "fixed left-0 top-0 z-40 h-screen translate-x-0 border-e border-border":
                  isSmallScreen && sidebarOpen,
                "fixed left-0 top-0 z-40 h-screen -translate-x-full":
                  isSmallScreen && !sidebarOpen,
              },
            )}
            aria-label="Sidebar navigation"
          >
            <div className="flex h-full flex-col overflow-hidden">
              {/* Account menu, Linear-style; 44px to line up with the top bar. */}
              <div
                className={clsx(
                  "flex h-11 shrink-0 items-center gap-1",
                  rail ? "justify-center" : "px-2",
                )}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      tabIndex={0}
                      type="button"
                      aria-label={`${APP_NAME} menu`}
                      className={clsx(
                        "flex min-w-0 items-center gap-2 rounded-md outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30",
                        rail ? "size-8 justify-center" : "h-7 px-1.5",
                      )}
                    >
                      <BrandMark
                        showWordmark={!rail}
                        className="gap-2 [&_img]:size-5 [&>span:last-child]:text-xs"
                      />
                      {!rail && (
                        <RiArrowDownSLine className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-60"
                    side={rail ? "right" : "bottom"}
                    align="start"
                    sideOffset={6}
                  >
                    {AUTH_ENABLED && (
                      <>
                        <DropdownMenuLabel className="p-0 font-normal">
                          <div className="flex items-center gap-2.5 px-2 py-1.5">
                            <Avatar size="sm">
                              <AvatarImage src={user?.image ?? ""} alt="" />
                              <AvatarFallback>{userInitials}</AvatarFallback>
                            </Avatar>
                            <div className="grid min-w-0 flex-1">
                              <span className="truncate text-xs/relaxed font-semibold text-foreground">
                                {userName}
                              </span>
                              <span className="truncate text-2xs font-normal text-muted-foreground">
                                {userEmail}
                              </span>
                            </div>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild onSelect={onNavigate}>
                        <Link tabIndex={0} to="/settings">
                          <RiSettings3Line />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    {AUTH_ENABLED && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                          <RiLogoutBoxRLine />
                          Log out
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Menu */}
              <div className="no-scrollbar relative flex-1 overflow-y-auto px-2 pt-1 pb-3">
                {/* One provider for every group, so the hover fill travels
                    across the gaps between them. */}
                <NavHighlightProvider className="flex flex-col">
                  {visibleNav.map((category, idx) => (
                    // The group is named for assistive tech but not drawn.
                    <nav
                      key={idx}
                      aria-label={category.title}
                      className="mt-3 first:mt-0"
                    >
                      <div className="flex flex-col gap-px">
                        {category.items.map((item, itemIdx) => (
                          <MenuItem
                            key={itemIdx}
                            item={item}
                            collapsed={rail}
                            active={item.path === selectedPath}
                            onExpand={() => setSidebarOpen(true)}
                            onNavigate={onNavigate}
                          />
                        ))}
                      </div>
                    </nav>
                  ))}
                </NavHighlightProvider>
              </div>
            </div>

            {/* Drag the edge to resize (desktop only). Only the cursor shows it,
                as in Linear; the line appears for keyboard focus alone. */}
            {!rail && !isSmallScreen && (
              <div
                {...handleProps}
                className="group/resize absolute inset-y-0 -right-1.5 z-10 w-3 cursor-col-resize outline-none"
              >
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-focus-visible/resize:bg-primary" />
              </div>
            )}
          </aside>

          {/* Content: an inset panel on the sidebar's ground, as in Linear.
              Padding and scrolling belong to whatever is rendered here. */}
          <main
            className="flex w-full min-w-0 flex-1 flex-col overflow-hidden bg-background lg:my-2 lg:mr-2 lg:rounded-lg lg:border lg:border-border lg:shadow-xs"
            // Behind the open drawer's scrim, Tab stays in the drawer.
            inert={drawerOpen}
          >
            <Header
              collapsed={!sidebarOpen}
              toggleCollapse={toggleCollapse}
              page={crumb}
            />
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SideNav;
