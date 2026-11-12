import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs as TabsPrimitive } from "radix-ui";
import { RiPaletteLine, RiUserLine } from "@remixicon/react";
import { useTheme } from "@/components/theme-provider";

import { PageHeader } from "@/components/page-header";
import { ProfileCard } from "@/components/profile-card";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { PrivacyLink, TermsLink } from "@/components/legal-links";
import { AUTH_ENABLED } from "@/config/app";

type ThemeChoice = "light" | "dark" | "system";

const ALL_TABS = [
  { value: "profile", label: "Profile", icon: RiUserLine },
  { value: "appearance", label: "Appearance", icon: RiPaletteLine },
] as const;
type Tab = (typeof ALL_TABS)[number]["value"];
// The profile belongs to a signed-in account, so it only shows with sign-in on (config/app.ts).
const TABS = ALL_TABS.filter((item) => AUTH_ENABLED || item.value !== "profile");
const DEFAULT_TAB: Tab = TABS[0].value;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  // The open tab lives in the URL (`?tab=appearance`), so it can be linked and survives a reload.
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const tab: Tab = TABS.some((item) => item.value === requested) ? (requested as Tab) : DEFAULT_TAB;
  // On a phone the tabs scroll sideways; a link to a tab off-screen should still show it.
  const tabList = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabList.current
      ?.querySelector('[data-state="active"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [tab]);
  const openTab = (next: string) =>
    setParams(next === DEFAULT_TAB ? {} : { tab: next }, { replace: true });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader
        title="Settings"
        subtitle={AUTH_ENABLED ? "Your profile and how the app looks." : "How the app looks."}
      />

      <TabsPrimitive.Root onValueChange={openTab} value={tab}>
        {/* Underlined tabs; scrolls sideways on a phone. */}
        <TabsPrimitive.List
          ref={tabList}
          aria-label="Settings sections"
          className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b border-border"
        >
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsPrimitive.Trigger
              className="-mb-px flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 pt-1 pb-2 text-xs/relaxed whitespace-nowrap text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground data-[state=active]:border-primary data-[state=active]:font-medium data-[state=active]:text-foreground"
              key={value}
              value={value}
            >
              <Icon className="size-4" />
              {label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        {AUTH_ENABLED && (
          <TabsPrimitive.Content className="flex flex-col gap-8 outline-none" value="profile">
            <ListGroup title="Profile">
              <ProfileCard />
            </ListGroup>
          </TabsPrimitive.Content>
        )}

        <TabsPrimitive.Content className="flex flex-col gap-8 outline-none" value="appearance">
          <ListGroup title="Appearance">
            <ListRow
              title="Theme"
              trailing={
                <SegmentedControl<ThemeChoice>
                  aria-label="Theme"
                  onChange={setTheme}
                  options={[
                    { value: "light", label: "Light" },
                    { value: "dark", label: "Dark" },
                    { value: "system", label: "System" },
                  ]}
                  size="sm"
                  value={
                    (["light", "dark", "system"].includes(theme) ? theme : "system") as ThemeChoice
                  }
                />
              }
            />
          </ListGroup>
        </TabsPrimitive.Content>

      </TabsPrimitive.Root>

      <p className="mt-10 text-2xs text-muted-foreground">
        <TermsLink /> · <PrivacyLink />
      </p>
    </div>
  );
}
