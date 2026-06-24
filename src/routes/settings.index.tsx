import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Settings as SettingsIcon, LifeBuoy, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/settings/")({
  head: () => ({ meta: [{ title: "Settings — Popular Roadways" }] }),
  component: SettingsIndex,
});

function SettingsIndex() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <PageHeader title="Settings" description="Preferences and support." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Tile
          to="/settings/preferences"
          icon={<SettingsIcon className="size-5" />}
          title="User preference"
          desc="Set up the business field lists used across the app."
        />
        <Tile
          to="/settings/support"
          icon={<LifeBuoy className="size-5" />}
          title="IT Support"
          desc="Chat with the NiceCare support team."
        />
      </div>
    </div>
  );
}

function Tile({
  to,
  icon,
  title,
  desc,
}: {
  to: "/settings/preferences" | "/settings/support";
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link to={to} className="block">
      <Card className="transition-colors hover:bg-accent/40">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="size-10 rounded-md bg-accent text-accent-foreground flex items-center justify-center">
            {icon}
          </div>
          <div className="flex-1">
            <div className="font-medium flex items-center gap-2">
              {title} <ArrowRight className="size-3.5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
