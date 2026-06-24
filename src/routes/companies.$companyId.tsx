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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ArrowLeft, Trash2, Wallet } from "lucide-react";
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
  const { state, addBill, deleteBill, addPayment, deletePayment, state: s2 } = useStore();
  const company = state.companies.find((c) => c.id === companyId);
  const [billOpen, setBillOpen] = useState(false);
  const [billForm, setBillForm] = useState(emptyBill);
  const [payOpenFor, setPayOpenFor] = useState<string | null>(null);
  const [payForm, setPayForm] = useState(emptyPayment);
  const [expanded, setExpanded] = useState<string | null>(null);
  void s2;

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

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <Link to="/companies" className="text-xs text-muted-foreground inline-flex items-center gap-1 mb-3">
        <ArrowLeft className="size-3" /> Back to companies
      </Link>
      <PageHeader
        title={company.name}
        description={[company.gst && `GST: ${company.gst}`, company.contact, company.email, company.number]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <Dialog open={billOpen} onOpenChange={setBillOpen}>
            <DialogTrigger asChild>
              <Button>
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
                <F label="How many trucks" type="number" v={billForm.truckCount} on={(v) => setBillForm({ ...billForm, truckCount: v })} />
                <F label="Which goods" v={billForm.goods} on={(v) => setBillForm({ ...billForm, goods: v })} />
                <F label="Bill amount (₹)" type="number" v={billForm.amount} on={(v) => setBillForm({ ...billForm, amount: v })} />
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

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill #</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Loading</TableHead>
              <TableHead>Trucks</TableHead>
              <TableHead>Goods</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  No bills yet. Click “Add bill”.
                </TableCell>
              </TableRow>
            ) : (
              bills.map((b) => {
                const billPayments = state.payments.filter((p) => p.billId === b.id);
                const received = billPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
                const isExpanded = expanded === b.id;
                return (
                  <>
                    <TableRow key={b.id} className="cursor-pointer" onClick={() => setExpanded(isExpanded ? null : b.id)}>
                      <TableCell className="font-medium">{b.billNumber || "—"}</TableCell>
                      <TableCell>{b.invoiceNumber || "—"}</TableCell>
                      <TableCell>{b.loadingDate || "—"}</TableCell>
                      <TableCell>{b.truckCount || "—"}</TableCell>
                      <TableCell>{b.goods || "—"}</TableCell>
                      <TableCell>{b.amount ? `₹${Number(b.amount).toLocaleString("en-IN")}` : "—"}</TableCell>
                      <TableCell>
                        <Badge className={statusVariant(b.status)}>{b.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPayForm(emptyPayment);
                              setPayOpenFor(b.id);
                            }}
                          >
                            <Wallet className="size-3.5" /> Add payment
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Delete this bill and its payments?")) {
                                deleteBill(b.id);
                                toast.success("Bill deleted");
                              }
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/40">
                          <div className="px-2 py-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-medium uppercase text-muted-foreground">
                                Payments · Received ₹{received.toLocaleString("en-IN")}
                              </div>
                            </div>
                            {billPayments.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Account</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {billPayments.map((p) => (
                                    <TableRow key={p.id}>
                                      <TableCell>{p.mode || "—"}</TableCell>
                                      <TableCell>{p.date || "—"}</TableCell>
                                      <TableCell>{p.account || "—"}</TableCell>
                                      <TableCell>₹{Number(p.amount || 0).toLocaleString("en-IN")}</TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => {
                                            deletePayment(p.id);
                                            toast.success("Payment removed");
                                          }}
                                        >
                                          <Trash2 className="size-4 text-destructive" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!payOpenFor} onOpenChange={(o) => !o && setPayOpenFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPayment} className="grid gap-3 sm:grid-cols-2">
            <F label="Mode of payment" v={payForm.mode} on={(v) => setPayForm({ ...payForm, mode: v })} />
            <F label="Date of payment" type="date" v={payForm.date} on={(v) => setPayForm({ ...payForm, date: v })} />
            <F label="Account received in" v={payForm.account} on={(v) => setPayForm({ ...payForm, account: v })} />
            <F label="Amount (₹)" type="number" v={payForm.amount} on={(v) => setPayForm({ ...payForm, amount: v })} />
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setPayOpenFor(null)}>Cancel</Button>
              <Button type="submit">Save payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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

function CardContentUnused() {
  return <CardContent />;
}
void CardContentUnused;
