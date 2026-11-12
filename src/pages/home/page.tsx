import { Link } from "react-router-dom";
import { RiSettings3Line } from "@remixicon/react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { APP_NAME, AUTH_ENABLED } from "@/config/app";
import { useAuthStore } from "@/store/auth-store";

/** The signed-in landing page. Replace it with your product's own home. */
export default function HomePage() {
  const name = useAuthStore((state) => state.user?.name ?? "");
  const firstName = name.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title={firstName ? `Welcome, ${firstName}` : "Welcome"}
        subtitle={AUTH_ENABLED ? `You're signed in to ${APP_NAME}.` : `Welcome to ${APP_NAME}.`}
      />
      <Empty className="border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle>Nothing here yet</EmptyTitle>
          <EmptyDescription>
            This is your starting point. Build your first feature in{" "}
            <code>src/pages</code> and add it to the sidebar in{" "}
            <code>src/layouts/app-layout.tsx</code>.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline" size="sm">
            <Link to="/settings">
              <RiSettings3Line />
              Settings
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
