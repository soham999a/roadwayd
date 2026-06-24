import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Plus, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/companies/")({
  head: () => ({
    meta: [
      { title: "Companies — Popular Roadways" },
      { name: "description", content: "Manage companies, bills and payments." },
    ],
  }),
  component: CompaniesPage,
});

const empty = { name: "", gst: "", contact: "", email: "", number: "" };

function CompaniesPage() {
  const { state, addCompany, deleteCompany } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    addCompany(form);
    toast.success("Company added");
    setForm(empty);
    setOpen(false);
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <PageHeader
        title="Companies"
        description="All client companies, their bills and payment history."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Add company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add company</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="grid gap-3">
                <Field label="Company name *" v={form.name} on={(v) => setForm({ ...form, name: v })} />
                <Field label="GST" v={form.gst} on={(v) => setForm({ ...form, gst: v })} />
                <Field label="Contact person" v={form.contact} on={(v) => setForm({ ...form, contact: v })} />
                <Field
                  label="Email"
                  type="email"
                  v={form.email}
                  on={(v) => setForm({ ...form, email: v })}
                />
                <Field label="Number" v={form.number} on={(v) => setForm({ ...form, number: v })} />
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save company</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>GST</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Number</TableHead>
              <TableHead className="text-right">Open</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No companies yet. Click “Add company” to create your first one.
                </TableCell>
              </TableRow>
            ) : (
              state.companies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.gst || "—"}</TableCell>
                  <TableCell>{c.contact || "—"}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell>{c.number || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete ${c.name}? This removes its bills and payments.`)) {
                            deleteCompany(c.id);
                            toast.success("Company deleted");
                          }
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                      <Button asChild variant="ghost" size="icon">
                        <Link to="/companies/$companyId" params={{ companyId: c.id }}>
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Field({
  label,
  v,
  on,
  type = "text",
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={v} onChange={(e) => on(e.target.value)} />
    </div>
  );
}
