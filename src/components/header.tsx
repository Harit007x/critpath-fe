import { useTheme } from "@/components/theme-provider";
import { RiArrowRightSLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { Button } from "./ui/button";
import { SideNavToggleBtn } from "./side-nav-toggle-btn";
import { APP_NAME } from "@/config/app";

interface IHeader {
  collapsed: boolean;
  toggleCollapse: () => void;
  /** The active nav entry, so the bar says where you are. */
  page?: { title: string; icon?: React.ReactNode; parent?: string };
}

/**
 * The top bar: sidebar toggle, breadcrumb and the appearance switch. Page actions sit on the
 * page's own title row instead. Translucent over the content.
 */
function Header({ collapsed, toggleCollapse, page }: IHeader) {
  const { setTheme, resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-30 flex h-11 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur">
      {/* Always here, in both directions. The sidebar used to carry its own
          control, which meant the button you pressed to collapse was not the
          button you pressed to bring it back. */}
      <SideNavToggleBtn toggleCollapse={toggleCollapse} collapsed={collapsed} />

      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-1.5"
      >
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {APP_NAME}
        </span>
        {page?.parent && (
          <>
            <RiArrowRightSLine
              className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:block"
              aria-hidden="true"
            />
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">
              {page.parent}
            </span>
          </>
        )}
        {page && (
          <>
            <RiArrowRightSLine
              className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:block"
              aria-hidden="true"
            />
            <span
              aria-current="page"
              className="truncate text-xs font-medium text-foreground"
            >
              {page.title}
            </span>
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(dark ? "light" : "dark")}
          aria-label={
            dark ? "Switch to light appearance" : "Switch to dark appearance"
          }
        >
          {dark ? <RiSunLine /> : <RiMoonLine />}
        </Button>
      </div>
    </header>
  );
}

export default Header;
