import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/settings/support")({
  head: () => ({ meta: [{ title: "IT Support — Popular Roadways" }] }),
  component: SupportPage,
});

const SUPPORT_URL = "https://support.nicecare.co/chat";

function SupportPage() {
  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <Link to="/settings" className="text-xs text-muted-foreground inline-flex items-center gap-1 mb-3">
        <ArrowLeft className="size-3" /> Back to settings
      </Link>
      <PageHeader title="IT Support" description="Need a hand? Chat with the NiceCare team." />
      <Card>
        <CardContent className="p-6 flex items-start gap-4">
          <div className="size-12 rounded-md bg-accent text-accent-foreground flex items-center justify-center">
            <LifeBuoy className="size-6" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">NiceCare Support Chat</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Opens the support chat in a new tab.
            </p>
            <Button asChild className="mt-4">
              <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                Open support chat <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
