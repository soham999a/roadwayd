import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Today's Activity — Popular Roadways" },
      { name: "description", content: "Activity log for today." },
    ],
  }),
  component: ActivityPage,
});

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function ActivityPage() {
  const { state } = useStore();
  const today = state.activities.filter((a) => isToday(a.at));
  const earlier = state.activities.filter((a) => !isToday(a.at));

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
      <PageHeader title="Today's Activity" description="Everything that happened today, in order." />

      <Card>
        <CardContent className="p-0">
          <Section title="Today" items={today} empty="No activity yet today." />
          <Section title="Earlier" items={earlier} empty="Nothing earlier." />
        </CardContent>
      </Card>
    </div>
  );
}

function Section({
  title,
  items,
  empty,
}: {
  title: string;
  items: ReturnType<typeof useStore>["state"]["activities"];
  empty: string;
}) {
  return (
    <div className="border-b last:border-0">
      <div className="px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground bg-muted/50">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y">
          {items.map((a) => (
            <li key={a.id} className="px-5 py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="capitalize">{a.type}</Badge>
                <span className="text-sm">{a.message}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(a.at).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
