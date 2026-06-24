import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, X, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/preferences")({
  head: () => ({ meta: [{ title: "User Preference — Popular Roadways" }] }),
  component: PreferencesPage,
});

function PreferencesPage() {
  const { state, setBusinessFields } = useStore();
  const [value, setValue] = useState("");

  const add = () => {
    const v = value.trim();
    if (!v) return;
    if (state.preferences.businessFields.includes(v)) {
      toast.error("Already exists");
      return;
    }
    setBusinessFields([...state.preferences.businessFields, v]);
    setValue("");
  };

  const remove = (v: string) =>
    setBusinessFields(state.preferences.businessFields.filter((x) => x !== v));

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <Link to="/settings" className="text-xs text-muted-foreground inline-flex items-center gap-1 mb-3">
        <ArrowLeft className="size-3" /> Back to settings
      </Link>
      <PageHeader
        title="User preference"
        description="Manage the list of business fields available across the app."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business field list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Cement"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            />
            <Button onClick={add}>
              <Plus className="size-4" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.preferences.businessFields.length === 0 && (
              <p className="text-sm text-muted-foreground">No fields configured yet.</p>
            )}
            {state.preferences.businessFields.map((f) => (
              <Badge key={f} variant="secondary" className="gap-1 pr-1">
                {f}
                <button
                  type="button"
                  onClick={() => remove(f)}
                  className="ml-1 rounded hover:bg-foreground/10 p-0.5"
                  aria-label={`Remove ${f}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
