import SideNav from "@/components/side-nav";
import { Icons } from "@/components/icons";
import type { SideNavbar } from "@/utils/types";
import { Outlet } from "react-router-dom";
import { useRouteScroll } from "@/hooks/use-route-scroll";

// Icons size themselves from the nav item, so none of these carry a size class.
// Add your app's pages here; `placement: "menu"` keeps an item in the account menu only.
const navItems: SideNavbar[] = [
  {
    title: "Main",
    items: [
      {
        title: "Home",
        path: "/home",
        icon: <Icons.home />,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "Settings",
        path: "/settings",
        icon: <Icons.settings />,
        placement: "menu",
      },
    ],
  },
];

export default function AppLayout() {
  // Each page opens at the top, not where the last one was scrolled to.
  const scroller = useRouteScroll<HTMLDivElement>();
  return (
    <SideNav navBar={navItems}>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={scroller}
          className="no-scrollbar flex-1 overflow-y-auto px-5 pt-6 pb-10 lg:px-7 2xl:px-9"
        >
          <Outlet />
        </div>
      </div>
    </SideNav>
  );
}
