import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Quotation } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Printer, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/quotation")({
  head: () => ({
    meta: [
      { title: "Quotation — Popular Roadways" },
      { name: "description", content: "Create and manage freight quotations." },
    ],
  }),
  component: QuotationPage,
});

const empty = {
  from: "",
  to: "",
  truckFreight: "",
  truckCategory: "",
  detentionPerDay: "",
  wbGovtSlot: "",
  loadingCharges: "",
  unloadingCharges: "",
  cwcParking: "",
};

function QuotationPage() {
  const { state, addQuotation, deleteQuotation } = useStore();
  const [form, setForm] = useState(empty);
  const [preview, setPreview] = useState<Quotation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.from.trim() || !form.to.trim()) {
      toast.error("From and To are required");
      return;
    }
    const q = addQuotation(form);
    toast.success("Quotation saved");
    setForm(empty);
    setPreview(q);
  };

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
      <PageHeader title="Quotation" description="Build a freight quotation, save it, print or share." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New quotation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <F label="From" v={form.from} on={(v) => setForm({ ...form, from: v })} />
              <F label="To" v={form.to} on={(v) => setForm({ ...form, to: v })} />
              <F label="Truck freight (₹)" v={form.truckFreight} on={(v) => setForm({ ...form, truckFreight: v })} />
              <F label="Truck category" v={form.truckCategory} on={(v) => setForm({ ...form, truckCategory: v })} />
              <F label="Detention / day (₹)" v={form.detentionPerDay} on={(v) => setForm({ ...form, detentionPerDay: v })} />
              <F label="W.B. GOVT slot booking" v={form.wbGovtSlot} on={(v) => setForm({ ...form, wbGovtSlot: v })} />
              <F label="Loading charges (₹)" v={form.loadingCharges} on={(v) => setForm({ ...form, loadingCharges: v })} />
              <F label="Unloading charges (₹)" v={form.unloadingCharges} on={(v) => setForm({ ...form, unloadingCharges: v })} />
              <F label="C.W.C parking (₹)" v={form.cwcParking} on={(v) => setForm({ ...form, cwcParking: v })} />
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setForm(empty)}>Reset</Button>
                <Button type="submit"><Plus className="size-4" /> Save quotation</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved quotations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From → To</TableHead>
                    <TableHead>Freight</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.quotations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No quotations yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    state.quotations.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium whitespace-nowrap">{q.from} → {q.to}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs sm:text-sm">{q.truckFreight ? `₹${Number(q.truckFreight).toLocaleString("en-IN")}` : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">{new Date(q.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="size-8 sm:size-9" onClick={() => setPreview(q)}>
                              <Printer className="size-3.5 sm:size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 sm:size-9"
                              onClick={() => setDeleteTarget(q.id)}
                            >
                              <Trash2 className="size-3.5 sm:size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the quotation from {state.quotations.find((q) => q.id === deleteTarget)?.from} → {state.quotations.find((q) => q.id === deleteTarget)?.to}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteQuotation(deleteTarget);
                  toast.success("Deleted");
                  setDeleteTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quotation preview</DialogTitle>
          </DialogHeader>
          {preview && <QuotationDoc q={preview} />}
          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="ghost" onClick={() => setPreview(null)}>Close</Button>
            <Button onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuotationDoc({ q }: { q: Quotation }) {
  const rows: Array<[string, string]> = [
    ["From", q.from],
    ["To", q.to],
    ["Truck category", q.truckCategory],
    ["Truck freight", q.truckFreight ? `₹${Number(q.truckFreight).toLocaleString("en-IN")}` : ""],
    ["Detention / day", q.detentionPerDay ? `₹${Number(q.detentionPerDay).toLocaleString("en-IN")}` : ""],
    ["W.B. GOVT slot booking", q.wbGovtSlot ? `₹${Number(q.wbGovtSlot).toLocaleString("en-IN")}` : ""],
    ["Loading charges", q.loadingCharges ? `₹${Number(q.loadingCharges).toLocaleString("en-IN")}` : ""],
    ["Unloading charges", q.unloadingCharges ? `₹${Number(q.unloadingCharges).toLocaleString("en-IN")}` : ""],
    ["C.W.C parking", q.cwcParking ? `₹${Number(q.cwcParking).toLocaleString("en-IN")}` : ""],
  ];
  const total =
    (Number(q.truckFreight) || 0) +
    (Number(q.loadingCharges) || 0) +
    (Number(q.unloadingCharges) || 0) +
    (Number(q.wbGovtSlot) || 0) +
    (Number(q.cwcParking) || 0);

  return (
    <div className="border rounded-md p-6 bg-white text-foreground">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-semibold">Popular Roadways</div>
          <div className="text-xs text-muted-foreground">Freight Quotation</div>
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(q.createdAt).toLocaleDateString()}
        </div>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b last:border-0">
              <td className="py-2 text-muted-foreground w-1/2">{k}</td>
              <td className="py-2 font-medium">{v || "—"}</td>
            </tr>
          ))}
          <tr>
            <td className="pt-3 font-semibold">Estimated total</td>
            <td className="pt-3 font-semibold">₹{total.toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function F({
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
