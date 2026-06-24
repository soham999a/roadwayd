import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, Receipt, IndianRupee, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Popular Roadways" },
      { name: "description", content: "Overview of companies, bills, payments and quotations." },
    ],
  }),
  component: Dashboard,
});

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold mt-0.5">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { state } = useStore();
  const totalReceived = state.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalBilled = state.bills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const outstanding = totalBilled - totalReceived;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <PageHeader title="Dashboard" description="A quick look at your business today." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Companies" value={state.companies.length} icon={<Building2 className="size-5" />} />
        <Stat label="Bills" value={state.bills.length} icon={<Receipt className="size-5" />} />
        <Stat
          label="Received"
          value={`₹${totalReceived.toLocaleString("en-IN")}`}
          icon={<IndianRupee className="size-5" />}
        />
        <Stat
          label="Outstanding"
          value={`₹${Math.max(outstanding, 0).toLocaleString("en-IN")}`}
          icon={<FileText className="size-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent companies</CardTitle>
            <Link to="/companies" className="text-xs text-primary inline-flex items-center gap-1">
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {state.companies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No companies yet. Add one to get started.</p>
            ) : (
              <ul className="divide-y">
                {state.companies.slice(0, 5).map((c) => (
                  <li key={c.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.contact || c.email || c.number}</div>
                    </div>
                    <Link
                      to="/companies/$companyId"
                      params={{ companyId: c.id }}
                      className="text-xs text-primary"
                    >
                      Open →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {state.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {state.activities.slice(0, 6).map((a) => (
                  <li key={a.id} className="text-sm flex justify-between gap-3">
                    <span>{a.message}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(a.at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
