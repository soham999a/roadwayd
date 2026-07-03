import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type BillStatus } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ArrowLeft, Trash2, Wallet, Building2, Phone, Mail, FileText, Truck, Calendar, Package, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/companies/$companyId")({
  head: () => ({ meta: [{ title: "Company — Popular Roadways" }] }),
  component: CompanyDetail,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p className="text-sm text-muted-foreground">Company not found.</p>
      <Link to="/companies" className="text-primary text-sm">
        Back to companies
      </Link>
    </div>
  ),
});

const emptyBill = {
  billNumber: "",
  invoiceNumber: "",
  loadingDate: "",
  truckCount: "",
  goods: "",
  amount: "",
  status: "Not Paid" as BillStatus,
};
const emptyPayment = { mode: "", date: "", account: "", amount: "" };

function statusVariant(s: BillStatus) {
  if (s === "Paid") return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
  if (s === "Partial Paid") return "bg-amber-100 text-amber-700 hover:bg-amber-100";
  return "bg-rose-100 text-rose-700 hover:bg-rose-100";
}

function CompanyDetail() {
  const { companyId } = Route.useParams();
  const { state, addBill, deleteBill, addPayment, deletePayment } = useStore();
  const company = state.companies.find((c) => c.id === companyId);
  const [billOpen, setBillOpen] = useState(false);
  const [billForm, setBillForm] = useState(emptyBill);
  const [payOpenFor, setPayOpenFor] = useState<string | null>(null);
  const [payForm, setPayForm] = useState(emptyPayment);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  if (!company) throw notFound();

  const bills = state.bills.filter((b) => b.companyId === companyId);

  const submitBill = (e: React.FormEvent) => {
    e.preventDefault();
    addBill({ companyId, ...billForm });
    toast.success("Bill added");
    setBillForm(emptyBill);
    setBillOpen(false);
  };

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payOpenFor) return;
    addPayment({ billId: payOpenFor, ...payForm });
    toast.success("Payment saved");
    setPayForm(emptyPayment);
    setPayOpenFor(null);
  };

  const confirmDeleteBill = () => {
    if (deleteTarget) {
      deleteBill(deleteTarget);
      toast.success("Bill deleted");
      setDeleteTarget(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
      <Link to="/companies" className="text-xs text-muted-foreground inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="size-3" /> Back to companies
      </Link>

      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">{company.name}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem icon={<FileText className="size-4" />} label="GST" value={company.gst || "—"} />
            <InfoItem icon={<Phone className="size-4" />} label="Contact" value={company.contact || "—"} />
            <InfoItem icon={<Mail className="size-4" />} label="Email" value={company.email || "—"} />
            <InfoItem icon={<Truck className="size-4" />} label="Number" value={company.number || "—"} />
          </div>
        </CardContent>
      </Card>

      <PageHeader
        title="Bills"
        actions={
          <Dialog open={billOpen} onOpenChange={setBillOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" /> Add bill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add bill</DialogTitle>
              </DialogHeader>
              <form onSubmit={submitBill} className="grid gap-3 sm:grid-cols-2">
                <F label="Bill number" v={billForm.billNumber} on={(v) => setBillForm({ ...billForm, billNumber: v })} />
                <F label="Invoice number" v={billForm.invoiceNumber} on={(v) => setBillForm({ ...billForm, invoiceNumber: v })} />
                <F label="Loading date" type="date" v={billForm.loadingDate} on={(v) => setBillForm({ ...billForm, loadingDate: v })} />
                <F label="How many trucks" v={billForm.truckCount} on={(v) => setBillForm({ ...billForm, truckCount: v })} />
                <F label="Which goods" v={billForm.goods} on={(v) => setBillForm({ ...billForm, goods: v })} />
                <F label="Bill amount (₹)" v={billForm.amount} on={(v) => setBillForm({ ...billForm, amount: v })} />
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={billForm.status}
                    onValueChange={(v) => setBillForm({ ...billForm, status: v as BillStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Not Paid">Not Paid</SelectItem>
                      <SelectItem value="Partial Paid">Partial Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="sm:col-span-2">
                  <Button type="button" variant="ghost" onClick={() => setBillOpen(false)}>Cancel</Button>
                  <Button type="submit">Save bill</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {bills.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border rounded-xl bg-muted/10">
          <Package className="size-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No bills yet. Click "Add bill".</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bills.map((b) => {
            const billPayments = state.payments.filter((p) => p.billId === b.id);
            const received = billPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
            const isExpanded = expanded === b.id;
            return (
              <Card key={b.id} className="overflow-hidden">
                <div
                  className="p-4 sm:p-5 cursor-pointer select-none"
                  onClick={() => setExpanded(isExpanded ? null : b.id)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{b.billNumber || "Bill"}</span>
                        {b.invoiceNumber && (
                          <span className="text-xs text-muted-foreground">Inv: {b.invoiceNumber}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-sm">
                        {b.amount ? `₹${Number(b.amount).toLocaleString("en-IN")}` : "—"}
                      </span>
                      <Badge className={statusVariant(b.status)}>{b.status}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {b.loadingDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" /> {b.loadingDate}
                      </span>
                    )}
                    {b.truckCount && (
                      <span className="inline-flex items-center gap-1">
                        <Truck className="size-3" /> {b.truckCount} {Number(b.truckCount) === 1 ? "truck" : "trucks"}
                      </span>
                    )}
                    {b.goods && (
                      <span className="inline-flex items-center gap-1">
                        <Package className="size-3" /> {b.goods}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => {
                        setPayForm(emptyPayment);
                        setPayOpenFor(b.id);
                      }}
                    >
                      <Wallet className="size-3.5 mr-1" /> Add payment
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => setDeleteTarget(b.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                    <div className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1">
                      <span>Payments: ₹{received.toLocaleString("en-IN")}</span>
                      {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t bg-muted/30 px-4 sm:px-5 py-3">
                    {billPayments.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No payments recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {billPayments.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3.5 py-2.5 text-sm"
                          >
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                              <span className="font-medium">{p.mode}</span>
                              <span className="text-muted-foreground">{p.date}</span>
                              <span className="text-muted-foreground">{p.account}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-semibold text-sm">₹{Number(p.amount || 0).toLocaleString("en-IN")}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7"
                                onClick={() => {
                                  deletePayment(p.id);
                                  toast.success("Payment removed");
                                }}
                              >
                                <Trash2 className="size-3.5 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!payOpenFor} onOpenChange={(o) => !o && setPayOpenFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPayment} className="grid gap-3 sm:grid-cols-2">
            <F label="Mode of payment" v={payForm.mode} on={(v) => setPayForm({ ...payForm, mode: v })} />
            <F label="Date of payment" type="date" v={payForm.date} on={(v) => setPayForm({ ...payForm, date: v })} />
            <F label="Account received in" v={payForm.account} on={(v) => setPayForm({ ...payForm, account: v })} />
            <F label="Amount (₹)" v={payForm.amount} on={(v) => setPayForm({ ...payForm, amount: v })} />
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setPayOpenFor(null)}>Cancel</Button>
              <Button type="submit">Save payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bill?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove bill "{bills.find((b) => b.id === deleteTarget)?.billNumber || "(no #)"}" and its payments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBill} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3.5 py-2.5">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
