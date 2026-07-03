import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { LayoutDashboard, Building2, FileText, Wallet, Settings, Truck, Plus, Trash2, Check, ChevronsUpDown, Cloud, CloudOff, Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type NavItem = { to: LinkProps["to"]; label: string; icon: ReactNode };

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  { to: "/companies", label: "Companies", icon: <Building2 className="size-4" /> },
  { to: "/quotation", label: "Quotation", icon: <FileText className="size-4" /> },
  { to: "/activity", label: "Payments", icon: <Wallet className="size-4" /> },
  { to: "/settings", label: "Settings", icon: <Settings className="size-4" /> },
];

const paymentEmpty = { companyId: "", mode: "", date: "", account: "", amount: "" };

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, addPayment, deletePayment, syncStatus } = useStore();
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState(paymentEmpty);
  const [companySearchOpen, setCompanySearchOpen] = useState(false);

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.companyId) {
      toast.error("Please select a company");
      return;
    }
    if (!payForm.amount.trim()) {
      toast.error("Amount is required");
      return;
    }
    addPayment({
      companyId: payForm.companyId,
      mode: payForm.mode,
      date: payForm.date,
      account: payForm.account,
      amount: payForm.amount,
    });
    toast.success("Payment added");
    setPayForm(paymentEmpty);
    setPayOpen(false);
  };

  const selectedCompany = state.companies.find((c) => c.id === payForm.companyId);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
          <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Truck className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Popular Roadways</div>
            <div className="text-[11px] text-sidebar-foreground/70">Logistics Manager</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : item.to === "/activity"
                  ? false
                  : pathname === item.to || pathname.startsWith(item.to + "/");
            if (item.to === "/activity") {
              return (
                <Dialog key={item.to} open={payOpen} onOpenChange={setPayOpen}>
                  <DialogTrigger asChild>
                    <button
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Payment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitPayment} className="grid gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Company *</Label>
                        <Popover open={companySearchOpen} onOpenChange={setCompanySearchOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={companySearchOpen}
                              className="justify-between"
                            >
                              {selectedCompany ? selectedCompany.name : "Search company..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search company..." />
                              <CommandList>
                                <CommandEmpty>No company found.</CommandEmpty>
                                <CommandGroup>
                                  {state.companies.map((c) => (
                                    <CommandItem
                                      key={c.id}
                                      value={c.name}
                                      onSelect={() => {
                                        setPayForm({ ...payForm, companyId: c.id });
                                        setCompanySearchOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          payForm.companyId === c.id ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      {c.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <PField label="Mode of payment" v={payForm.mode} on={(v) => setPayForm({ ...payForm, mode: v })} />
                      <PField label="Date of payment" type="date" v={payForm.date} on={(v) => setPayForm({ ...payForm, date: v })} />
                      <PField label="Account received in" v={payForm.account} on={(v) => setPayForm({ ...payForm, account: v })} />
                      <PField label="Amount (₹)" v={payForm.amount} on={(v) => setPayForm({ ...payForm, amount: v })} />
                      <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setPayOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          <Plus className="size-4" /> Save payment
                        </Button>
                      </DialogFooter>
                    </form>

                    <div className="mt-6 border-t pt-4">
                      <h3 className="text-sm font-medium mb-3">All Payments</h3>
                      {state.payments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No payments yet.</p>
                      ) : (
                        <div className="-mx-6 px-6 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Company</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-10"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {state.payments.map((p) => {
                                const c = state.companies.find((co) => co.id === p.companyId);
                                return (
                                  <TableRow key={p.id}>
                                    <TableCell className="whitespace-nowrap max-w-[120px] truncate">{c?.name || "—"}</TableCell>
                                    <TableCell className="whitespace-nowrap">{p.mode || "—"}</TableCell>
                                    <TableCell className="whitespace-nowrap">{p.date || "—"}</TableCell>
                                    <TableCell className="whitespace-nowrap max-w-[100px] truncate">{p.account || "—"}</TableCell>
                                    <TableCell className="whitespace-nowrap text-right font-medium">₹{Number(p.amount || 0).toLocaleString("en-IN")}</TableCell>
                                    <TableCell className="whitespace-nowrap">
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
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-3 text-[11px] text-sidebar-foreground/60 border-t border-sidebar-border space-y-1">
          <div className="flex items-center gap-1.5">
            {syncStatus === "loading" ? (
              <><Loader className="size-3 animate-spin" /> Syncing...</>
            ) : syncStatus === "error" ? (
              <><CloudOff className="size-3 text-destructive" /> Sync error</>
            ) : (
              <><Cloud className="size-3" /> Synced</>
            )}
          </div>
          <div>© {new Date().getFullYear()} Popular Roadways</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-sidebar text-sidebar-foreground">
          <div className="flex items-center gap-2">
            <Truck className="size-5" />
            <span className="font-semibold text-sm">Popular Roadways</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-sidebar-foreground/60">
            {syncStatus === "loading" ? (
              <><Loader className="size-3 animate-spin" /> Syncing</>
            ) : syncStatus === "error" ? (
              <><CloudOff className="size-3 text-destructive" /> Error</>
            ) : (
              <><Cloud className="size-3" /> OK</>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden">{children}</main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
          {navItems.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : item.to === "/activity"
                  ? false
                  : pathname === item.to || pathname.startsWith(item.to + "/");
            if (item.to === "/activity") {
              return (
                <Dialog key={item.to} open={payOpen} onOpenChange={setPayOpen}>
                  <DialogTrigger asChild>
                    <button
                      className={cn(
                        "flex flex-col items-center gap-0.5 flex-1 py-2 text-[10px] transition-colors",
                        "text-sidebar-foreground/60 hover:text-sidebar-foreground/90",
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  </DialogTrigger>
                </Dialog>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 flex-1 py-2 text-[10px] transition-colors",
                  active
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground/90",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function PField({
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

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
