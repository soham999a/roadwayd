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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Plus, LogIn, Pencil, Trash2 } from "lucide-react";
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
  const { state, addCompany, updateCompany, deleteCompany } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(empty);

  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(empty);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    addCompany(addForm);
    toast.success("Company added");
    setAddForm(empty);
    setAddOpen(false);
  };

  const openEdit = (c: (typeof state.companies)[number]) => {
    setEditTarget(c.id);
    setEditForm({ name: c.name, gst: c.gst, contact: c.contact, email: c.email, number: c.number });
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (editTarget) {
      updateCompany(editTarget, editForm);
      toast.success("Company updated");
      setEditTarget(null);
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      const name = state.companies.find((c) => c.id === deleteTarget)?.name;
      deleteCompany(deleteTarget);
      toast.success(`"${name}" deleted`);
      setDeleteTarget(null);
      setEditTarget(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto">
      <PageHeader
        title="Companies"
        description="All client companies."
        actions={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Add company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add company</DialogTitle>
              </DialogHeader>
              <form onSubmit={submitAdd} className="grid gap-3">
                <Field label="Company name *" v={addForm.name} on={(v) => setAddForm({ ...addForm, name: v })} />
                <Field label="GST" v={addForm.gst} on={(v) => setAddForm({ ...addForm, gst: v })} />
                <Field label="Contact person" v={addForm.contact} on={(v) => setAddForm({ ...addForm, contact: v })} />
                <Field label="Email" type="email" v={addForm.email} on={(v) => setAddForm({ ...addForm, email: v })} />
                <Field label="Number" v={addForm.number} on={(v) => setAddForm({ ...addForm, number: v })} />
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Company</TableHead>
                <TableHead className="w-1/2">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-10">
                    No companies yet. Click "Add company" to create your first one.
                  </TableCell>
                </TableRow>
              ) : (
                state.companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-base">{c.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="default">
                          <Link to="/companies/$companyId" params={{ companyId: c.id }}>
                            <LogIn className="size-3.5" /> Enter
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit company</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="grid gap-3">
            <Field label="Company name *" v={editForm.name} on={(v) => setEditForm({ ...editForm, name: v })} />
            <Field label="GST" v={editForm.gst} on={(v) => setEditForm({ ...editForm, gst: v })} />
            <Field label="Contact person" v={editForm.contact} on={(v) => setEditForm({ ...editForm, contact: v })} />
            <Field label="Email" type="email" v={editForm.email} on={(v) => setEditForm({ ...editForm, email: v })} />
            <Field label="Number" v={editForm.number} on={(v) => setEditForm({ ...editForm, number: v })} />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteTarget(editTarget)}
                className="mr-auto"
              >
                <Trash2 className="size-4" /> Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save changes</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{state.companies.find((c) => c.id === deleteTarget)?.name}" and all its bills and payments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
