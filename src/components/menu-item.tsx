import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { cn } from "@/lib/utils";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import type { SideNavItem } from "@/utils/types";
import { Icons } from "./icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface MenuItemProps {
  item: SideNavItem;
  /** Rail mode: icons only, with the label moved into a tooltip. */
  collapsed?: boolean;
  /** Opens the rail back up — the only sane response to a submenu at 68px wide. */
  onExpand?: () => void;
  /** Close the mobile drawer after choosing a destination. */
  onNavigate?: () => void;
  /**
   * Whether this is the selected item, decided by the shell rather than here.
   *
   * An item cannot answer this alone once one nav path is a prefix of another:
   * on /settings/accounts, a per-item prefix test lights up BOTH "Settings" and
   * "Accounts", and two selected items is a sidebar that has stopped telling you
   * where you are. The shell compares every item and gives the longest match,
   * which is the same rule the breadcrumb already used.
   *
   * Left optional so a MenuItem rendered outside the shell still behaves.
   */
  active?: boolean;
}

/**
 * Two surfaces, animated differently on purpose.
 *
 * The selected scrim does NOT travel. Choosing an item is a decision, not a
 * pointer passing by, and a scrim flying in from the old item three rows away
 * read as the old selection chasing the click. So selection cross-fades: the
 * item you left fades its scrim out, the item you clicked fades its own in,
 * and neither moves.
 *
 * The hover fill is the one that moves: a single element shared by `layoutId`
 * that follows the pointer (or keyboard focus) from row to row, the same move
 * as the marketing site's header links.
 *
 * The hover fill only GLIDES between rows. Entering the list from outside it
 * fades in under the pointer rather than travelling from wherever it was last
 * seen, which reads as lag; leaving the list fades it out in place. Over the
 * selected row it hides, because the selected scrim is already there and a
 * second fill on top made that row darker than selection means.
 *
 * Layering is across the whole list, not per row. A row's fill travels
 * through the rows between, and a row later in the list paints over earlier
 * ones, so without z-indices the fill for "Settings" slid OVER the selected
 * "Accounts" on its way down. No row is a stacking context, so these three
 * levels are shared by every row: the hover fill at 0, the selected scrim at 1,
 * every icon and label at 10 — a fill in flight passes behind the selected
 * scrim and behind every word it crosses.
 *
 * Both need to know about every row at once, so the list owns this state and
 * rows read it from context. A `MenuItem` rendered outside a provider falls
 * back to the old per-row backgrounds.
 */
type Highlight = {
  hoverId: string;
  /** The row under the pointer, or null when the pointer is outside the list. */
  lit: string | null;
  /** Where the hover fill currently sits, lit or not. */
  at: string | null;
  /** Whether the last move came from another row (glide) or from outside (appear). */
  glide: boolean;
  light: (key: string) => void;
};

const NavHighlight = createContext<Highlight | null>(null);

/**
 * Deliberately unhurried. At 0.4s the hover fill arrived before the eye had
 * followed it and read as a flicker rather than as travel; the owner asked
 * for more time.
 */
const HOVER_GLIDE = { type: "spring", bounce: 0.12, duration: 0.55 } as const;
/** How long a selection takes to hand over from the old item to the new one. */
const SELECT_FADE = { duration: 0.3, ease: "easeOut" } as const;

export function NavHighlightProvider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const hoverId = useId();
  const [lit, setLit] = useState<string | null>(null);
  const [at, setAt] = useState<string | null>(null);
  const [glide, setGlide] = useState(false);

  // The current `lit` is read through a ref so `light` can stay stable and
  // decide glide-or-appear without a state updater that has side effects.
  const litRef = useRef<string | null>(null);

  const light = useCallback((key: string) => {
    setGlide(litRef.current !== null);
    litRef.current = key;
    setLit(key);
    setAt(key);
  }, []);

  const clear = useCallback(() => {
    litRef.current = null;
    setLit(null);
  }, []);

  const value = useMemo(
    () => ({ hoverId, lit, at, glide, light }),
    [hoverId, lit, at, glide, light]
  );

  return (
    // `reducedMotion="user"` drops the glide for anyone who asked for less
    // motion: the fill simply lands on its row. Fades are kept.
    <MotionConfig reducedMotion="user">
      <NavHighlight.Provider value={value}>
        <div
          className={className}
          onMouseLeave={clear}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) clear();
          }}
        >
          {children}
        </div>
      </NavHighlight.Provider>
    </MotionConfig>
  );
}

/**
 * Lights the shared hover fill on `key` when the pointer or keyboard reaches a
 * row. Keys share one namespace across the list, so rows outside `MenuItem`
 * (the sidebar's projects) prefix theirs. Null outside a provider.
 */
function useNavHover(key: string) {
  const highlight = useContext(NavHighlight);
  if (!highlight) return null;
  return {
    onMouseEnter: () => highlight.light(key),
    onFocus: () => highlight.light(key),
  };
}

/**
 * A row's hover fill and selected scrim, for any row in the list. The row must
 * be `relative` with its content at `z-10` (see the layering note above).
 */
function NavSurfaces({ rowKey, selected }: { rowKey: string; selected: boolean }) {
  const highlight = useContext(NavHighlight);
  if (!highlight) return null;
  return (
    <>
      {highlight.at === rowKey && (
        <motion.span
          aria-hidden
          data-nav-surface
          layoutId={highlight.hoverId}
          initial={false}
          animate={{ opacity: highlight.lit === rowKey && !selected ? 1 : 0 }}
          transition={{
            layout: highlight.glide ? HOVER_GLIDE : { duration: 0 },
            opacity: { duration: 0.25 },
          }}
          className="absolute inset-0 z-0 rounded-md bg-muted"
        />
      )}
      {/* `initial={false}`: the item a page loads on is simply selected;
          only a change of selection fades. */}
      <AnimatePresence initial={false}>
        {selected && (
          <motion.span
            key="selected"
            aria-hidden
            data-nav-surface
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SELECT_FADE}
            className="absolute inset-0 z-[1] rounded-md bg-primary/10"
          />
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * A row outside `MenuItem` (the sidebar's projects) on the same hover fill and selected scrim, so
 * the fill glides there as it does over Home, Inbox and the rest. Every child is lifted over the fill: the surfaces sit
 * under the row's content, never over it.
 */
export function NavRow({
  rowKey,
  active = false,
  expanded,
  to,
  onClick,
  className,
  children,
}: {
  /** Unique across the whole sidebar's list. */
  rowKey: string;
  active?: boolean;
  expanded?: boolean;
  to?: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}) {
  const hover = useNavHover(rowKey);
  const classes = cn(
    "relative flex h-7 w-full cursor-pointer select-none items-center gap-2 rounded-md text-xs/relaxed outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/30 [&>:not([data-nav-surface])]:relative [&>:not([data-nav-surface])]:z-10",
    active ? "font-medium text-primary-ink" : "text-muted-foreground hover:text-foreground",
    // Outside the shell's provider there is no moving fill, so the row paints its own.
    !hover && (active ? "bg-primary/10" : "hover:bg-muted"),
    className,
  );
  const surfaces = <NavSurfaces rowKey={rowKey} selected={active} />;
  if (to)
    return (
      <Link
        tabIndex={0}
        aria-current={active ? "page" : undefined}
        className={classes}
        onClick={onClick}
        to={to}
        {...hover}
      >
        {surfaces}
        {children}
      </Link>
    );
  return (
    <button tabIndex={0} aria-expanded={expanded} className={classes} onClick={onClick} type="button" {...hover}>
      {surfaces}
      {children}
    </button>
  );
}

/**
 * The label, shown beside the icon or on hover.
 *
 * In the rail the name has nowhere to sit, so it moves to a tooltip and an
 * `sr-only` copy keeps the link named for anyone not looking at it.
 */
function Labelled({
  collapsed,
  title,
  children,
}: {
  collapsed: boolean;
  title: string;
  children: ReactNode;
}) {
  if (!collapsed) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * A sidebar row in upasana's nav treatment: the active row takes a green tint
 * with primary ink, idle rows are muted and fill on hover. `aria-current`
 * carries the selection to anyone not looking at the screen.
 */
const MenuItem = ({ item, collapsed = false, onExpand, onNavigate, active }: MenuItemProps) => {
  const { pathname } = useLocation();
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const highlight = useContext(NavHighlight);
  const hover = useNavHover(item.path);

  const toggleSubMenu = () => setSubMenuOpen(!subMenuOpen);

  const onPath = (path: string) => pathname === path || pathname.startsWith(path + "/");

  /**
   * `activeOn` covers a screen that belongs to this item without living under
   * its path — a detail view reached from a list at a different URL, say.
   * Without it the sidebar shows nothing selected there, which reads as having
   * navigated out of the app rather than deeper into it.
   */
  const isActive = (nav: Pick<SideNavItem, "path" | "activeOn">) =>
    onPath(nav.path) || (nav.activeOn ?? []).some(onPath);

  /** The shell's verdict wins when it has one; the local test is the fallback. */
  const selected = active ?? isActive(item);

  // The glyph tracks the label rather than holding its own colour: an icon set
  // one level lighter than the word beside it is the detail that made the old
  // rows read as two separate things sharing a line.
  const tone = (active: boolean) =>
    active
      ? "bg-primary/10 font-medium text-primary-ink"
      : "text-muted-foreground hover:bg-muted hover:text-foreground";

  // Inside the list the backgrounds are the moving surfaces below, so the row
  // itself only carries the type.
  const ink = (active: boolean) =>
    active
      ? "font-medium text-primary-ink"
      : "text-muted-foreground hover:text-foreground";

  const shape = collapsed
    ? "mx-auto size-8 justify-center rounded-md"
    : "h-7 w-full gap-2 rounded-md px-2";

  const base =
    "relative flex select-none flex-row items-center text-xs/relaxed transition-[background-color,color] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring/30 [&_svg]:size-4 [&_svg]:shrink-0";

  if (item.submenu) {
    return (
      <div className="w-full">
        <Labelled collapsed={collapsed} title={item.title}>
          <button
            tabIndex={0}
            // A submenu cannot open inside a 68px rail, so the click opens the
            // rail instead and the user gets the menu they were reaching for.
            onClick={collapsed ? onExpand : toggleSubMenu}
            aria-expanded={collapsed ? undefined : subMenuOpen}
            className={clsx(
              base,
              shape,
              "text-start",
              tone(selected)
            )}
          >
            {item.icon && (
              <span className="flex size-4 shrink-0 items-center justify-center">
                {item.icon}
              </span>
            )}
            {collapsed ? (
              <span className="sr-only">{item.title}</span>
            ) : (
              <>
                <span className="flex-1 truncate text-start">{item.title}</span>
                <Icons.chevronDown
                  className={clsx("shrink-0 transition-transform duration-200 ease-out", {
                    "rotate-180": subMenuOpen,
                  })}
                />
              </>
            )}
          </button>
        </Labelled>

        {subMenuOpen && !collapsed && (
          <div className="mt-1 flex flex-col gap-0.5">
            {item.subMenuItems?.map((subItem, idx) => (
              <Link
                tabIndex={0}
                key={idx}
                to={subItem.path}
                onClick={onNavigate}
                className={clsx(
                  base,
                  "h-7 w-full gap-2 rounded-md px-2 ps-8",
                  tone(isActive(subItem))
                )}
              >
                {subItem.icon && (
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {subItem.icon}
                  </span>
                )}
                <span className="truncate">{subItem.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Labelled collapsed={collapsed} title={item.title}>
      <Link
        tabIndex={0}
        to={item.path}
        onClick={onNavigate}
        aria-current={selected ? "page" : undefined}
        {...hover}
        className={clsx(base, shape, highlight ? ink(selected) : tone(selected))}
      >
        <NavSurfaces rowKey={item.path} selected={selected} />
        {item.icon && (
          <span className="relative z-10 flex size-4 shrink-0 items-center justify-center">
            {item.icon}
          </span>
        )}
        {collapsed ? (
          <span className="sr-only">
            {item.title}
            {item.count ? ` (${item.count})` : ""}
          </span>
        ) : (
          <span className="relative z-10 truncate">{item.title}</span>
        )}
        {Boolean(item.count) &&
          (collapsed ? (
            <span
              aria-hidden
              className="absolute top-1 right-1 z-10 size-1.5 rounded-full bg-primary"
            />
          ) : (
            <span className="relative z-10 ml-auto rounded-full bg-primary/15 px-1.5 text-3xs font-medium text-primary-ink tabular-nums">
              {item.count}
            </span>
          ))}
      </Link>
    </Labelled>
  );
};

export default MenuItem;
