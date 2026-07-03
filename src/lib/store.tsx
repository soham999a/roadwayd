import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { writeData, subscribeData } from "./firebase";

export type BillStatus = "Paid" | "Not Paid" | "Partial Paid";

export type Company = {
  id: string;
  name: string;
  gst: string;
  contact: string;
  email: string;
  number: string;
  createdAt: string;
};

export type Bill = {
  id: string;
  companyId: string;
  billNumber: string;
  invoiceNumber: string;
  loadingDate: string;
  truckCount: string;
  goods: string;
  amount: string;
  status: BillStatus;
  createdAt: string;
};

export type Payment = {
  id: string;
  billId?: string;
  companyId?: string;
  mode: string;
  date: string;
  account: string;
  amount: string;
  createdAt: string;
};

export type Quotation = {
  id: string;
  from: string;
  to: string;
  truckFreight: string;
  truckCategory: string;
  detentionPerDay: string;
  wbGovtSlot: string;
  loadingCharges: string;
  unloadingCharges: string;
  cwcParking: string;
  createdAt: string;
};

export type Activity = {
  id: string;
  type: "company" | "bill" | "payment" | "quotation";
  message: string;
  at: string;
};

export type Preferences = {
  businessFields: string[];
};

type State = {
  companies: Company[];
  bills: Bill[];
  payments: Payment[];
  quotations: Quotation[];
  activities: Activity[];
  preferences: Preferences;
};

const STORAGE_KEY = "popular-roadways-v1";
const FIREBASE_PATH = "roadways-data";

const initial: State = {
  companies: [],
  bills: [],
  payments: [],
  quotations: [],
  activities: [],
  preferences: {
    businessFields: ["Steel", "Cement", "Textile", "FMCG"],
  },
};

function loadLocal(): State {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return { ...initial, ...parsed, preferences: { ...initial.preferences, ...(parsed.preferences ?? {}) } };
  } catch {
    return initial;
  }
}

function saveLocal(state: State): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — ignore */ }
}

let _counter = 0;
function uid() {
  _counter++;
  return Date.now().toString(36) + _counter.toString(36) + Math.random().toString(36).slice(2, 6);
}

type SyncStatus = "loading" | "synced" | "error";

type Ctx = {
  state: State;
  syncStatus: SyncStatus;
  addCompany: (c: Omit<Company, "id" | "createdAt">) => Company;
  updateCompany: (id: string, data: Partial<Omit<Company, "id" | "createdAt">>) => void;
  deleteCompany: (id: string) => void;
  addBill: (b: Omit<Bill, "id" | "createdAt">) => Bill;
  deleteBill: (id: string) => void;
  addPayment: (p: Omit<Payment, "id" | "createdAt">) => Payment;
  deletePayment: (id: string) => void;
  addQuotation: (q: Omit<Quotation, "id" | "createdAt">) => Quotation;
  deleteQuotation: (id: string) => void;
  setBusinessFields: (fields: string[]) => void;
};

const StoreContext = createContext<Ctx | null>(null);

function mergeState(current: State, incoming: Partial<State>): State {
  return {
    ...current,
    ...incoming,
    preferences: { ...current.preferences, ...(incoming.preferences ?? current.preferences) },
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  stateRef.current = state;

  // Hydrate from localStorage instantly; seed if empty
  useEffect(() => {
    const local = loadLocal();
    if (local.companies.length === 0 && local.bills.length === 0) {
      const seed = seedData();
      saveLocal(seed);
      setState(seed);
    } else {
      setState(local);
    }
    setHydrated(true);
  }, []);

  // Subscribe to Firebase real-time updates (after hydration)
  useEffect(() => {
    if (!hydrated) return;

    const unsub = subscribeData(FIREBASE_PATH, (fbData) => {
      if (fbData && typeof fbData === "object" && !Array.isArray(fbData)) {
        const incoming = fbData as Partial<State>;
        setState((prev) => {
          const merged = mergeState(prev, incoming);
          saveLocal(merged);
          return merged;
        });
      }
      setSyncStatus("synced");
    });

    // If Firebase never responds within 5s, mark synced anyway
    const timeout = setTimeout(() => setSyncStatus((s) => (s === "loading" ? "synced" : s)), 5000);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [hydrated]);

  // Persist to localStorage on every state change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveLocal(state);
  }, [state, hydrated]);

  // Debounced push to Firebase
  const pushToFirebase = useCallback((s: State) => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      writeData(FIREBASE_PATH, s).catch(() => setSyncStatus("error"));
    }, 300);
  }, []);

  const pushActivity = (a: Omit<Activity, "id" | "at">) => {
    const entry: Activity = { id: uid(), at: new Date().toISOString(), ...a };
    setState((s) => {
      const next = { ...s, activities: [entry, ...s.activities].slice(0, 200) };
      pushToFirebase(next);
      return next;
    });
  };

  const ctx: Ctx = {
    state,
    syncStatus,
    addCompany: (c) => {
      const company: Company = { id: uid(), createdAt: new Date().toISOString(), ...c };
      setState((s) => {
        const next = { ...s, companies: [company, ...s.companies] };
        pushToFirebase(next);
        return next;
      });
      pushActivity({ type: "company", message: `Added company "${company.name}"` });
      return company;
    },
    updateCompany: (id, data) => {
      setState((s) => {
        const next = { ...s, companies: s.companies.map((c) => (c.id === id ? { ...c, ...data } : c)) };
        pushToFirebase(next);
        return next;
      });
    },
    deleteCompany: (id) => {
      setState((s) => {
        const billIds = s.bills.filter((b) => b.companyId === id).map((b) => b.id);
        const next = {
          ...s,
          companies: s.companies.filter((c) => c.id !== id),
          bills: s.bills.filter((b) => b.companyId !== id),
          payments: s.payments.filter((p) => !billIds.includes(p.billId)),
        };
        pushToFirebase(next);
        return next;
      });
    },
    addBill: (b) => {
      const bill: Bill = { id: uid(), createdAt: new Date().toISOString(), ...b };
      setState((s) => {
        const next = { ...s, bills: [bill, ...s.bills] };
        pushToFirebase(next);
        return next;
      });
      pushActivity({ type: "bill", message: `Bill ${bill.billNumber || "(no #)"} added` });
      return bill;
    },
    deleteBill: (id) => {
      setState((s) => {
        const next = { ...s, bills: s.bills.filter((b) => b.id !== id), payments: s.payments.filter((p) => p.billId !== id) };
        pushToFirebase(next);
        return next;
      });
    },
    addPayment: (p) => {
      const payment: Payment = { id: uid(), createdAt: new Date().toISOString(), ...p };
      setState((s) => {
        const company = p.companyId ? s.companies.find((c) => c.id === p.companyId) : undefined;
        const next = {
          ...s,
          payments: [payment, ...s.payments],
          activities: [
            { id: uid(), at: new Date().toISOString(), type: "payment" as const, message: `Payment of ₹${payment.amount}${company ? ` from ${company.name}` : ""} received` },
            ...s.activities,
          ].slice(0, 200),
        };
        pushToFirebase(next);
        return next;
      });
      return payment;
    },
    deletePayment: (id) => {
      setState((s) => {
        const next = { ...s, payments: s.payments.filter((p) => p.id !== id) };
        pushToFirebase(next);
        return next;
      });
    },
    addQuotation: (q) => {
      const quotation: Quotation = { id: uid(), createdAt: new Date().toISOString(), ...q };
      setState((s) => {
        const next = { ...s, quotations: [quotation, ...s.quotations] };
        pushToFirebase(next);
        return next;
      });
      pushActivity({ type: "quotation", message: `Quotation ${quotation.from} → ${quotation.to}` });
      return quotation;
    },
    deleteQuotation: (id) => {
      setState((s) => {
        const next = { ...s, quotations: s.quotations.filter((q) => q.id !== id) };
        pushToFirebase(next);
        return next;
      });
    },
    setBusinessFields: (fields) => {
      setState((s) => {
        const next = { ...s, preferences: { ...s.preferences, businessFields: fields } };
        pushToFirebase(next);
        return next;
      });
    },
  };

  return <StoreContext.Provider value={ctx}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

function seedData(): State {
  const now = new Date();
  const day = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  const companies: Company[] = [
    { id: uid(), name: "Singh Transport", gst: "09AABCU9603R1ZN", contact: "Ramesh Singh", email: "ramesh@singhtransport.in", number: "+91 98765 43210", createdAt: day(30) },
    { id: uid(), name: "Raj Logistics", gst: "07AAECR1234H1ZD", contact: "Suresh Raj", email: "suresh@rajlogistics.com", number: "+91 87654 32109", createdAt: day(25) },
    { id: uid(), name: "Greenway Movers", gst: "19AABCU9603R1ZP", contact: "Amit Kumar", email: "amit@greenway.in", number: "+91 76543 21098", createdAt: day(20) },
    { id: uid(), name: "Patel Cargo Services", gst: "24AAECP5678H1ZJ", contact: "Vikram Patel", email: "vikram@patelcargo.com", number: "+91 65432 10987", createdAt: day(15) },
    { id: uid(), name: "Sunrise Freight", gst: "08AACCU9012R1ZX", contact: "Priya Sharma", email: "priya@sunrisefreight.in", number: "+91 54321 09876", createdAt: day(10) },
  ];

  const bills: Bill[] = [
    { id: uid(), companyId: companies[0].id, billNumber: "BILL-001", invoiceNumber: "INV-2401", loadingDate: day(5), truckCount: "2", goods: "Cement", amount: "45000", status: "Paid", createdAt: day(7) },
    { id: uid(), companyId: companies[0].id, billNumber: "BILL-002", invoiceNumber: "INV-2402", loadingDate: day(3), truckCount: "1", goods: "Steel", amount: "32000", status: "Not Paid", createdAt: day(4) },
    { id: uid(), companyId: companies[1].id, billNumber: "BILL-003", invoiceNumber: "INV-2403", loadingDate: day(6), truckCount: "3", goods: "Textile", amount: "78000", status: "Partial Paid", createdAt: day(8) },
    { id: uid(), companyId: companies[1].id, billNumber: "BILL-004", invoiceNumber: "INV-2404", loadingDate: day(2), truckCount: "1", goods: "FMCG", amount: "25000", status: "Not Paid", createdAt: day(3) },
    { id: uid(), companyId: companies[2].id, billNumber: "BILL-005", invoiceNumber: "INV-2405", loadingDate: day(4), truckCount: "2", goods: "Cement", amount: "56000", status: "Paid", createdAt: day(5) },
    { id: uid(), companyId: companies[3].id, billNumber: "BILL-006", invoiceNumber: "INV-2406", loadingDate: day(1), truckCount: "1", goods: "Steel", amount: "29000", status: "Not Paid", createdAt: day(2) },
    { id: uid(), companyId: companies[4].id, billNumber: "BILL-007", invoiceNumber: "INV-2407", loadingDate: day(0), truckCount: "2", goods: "Textile", amount: "63000", status: "Partial Paid", createdAt: day(1) },
  ];

  const payments: Payment[] = [
    { id: uid(), billId: bills[0].id, mode: "Bank Transfer", date: day(4), account: "HDFC - 1234", amount: "45000", createdAt: day(4) },
    { id: uid(), billId: bills[2].id, mode: "Cheque", date: day(5), account: "SBI - 5678", amount: "40000", createdAt: day(5) },
    { id: uid(), billId: bills[4].id, mode: "UPI", date: day(3), account: "ICICI - 9012", amount: "56000", createdAt: day(3) },
    { id: uid(), billId: bills[6].id, mode: "Cash", date: day(0), account: "HDFC - 1234", amount: "30000", createdAt: day(0) },
  ];

  const quotations: Quotation[] = [
    { id: uid(), from: "Mumbai", to: "Delhi", truckFreight: "55000", truckCategory: "14 Ton", detentionPerDay: "3000", wbGovtSlot: "1200", loadingCharges: "2500", unloadingCharges: "2000", cwcParking: "800", createdAt: day(12) },
    { id: uid(), from: "Kolkata", to: "Chennai", truckFreight: "48000", truckCategory: "10 Ton", detentionPerDay: "2500", wbGovtSlot: "1000", loadingCharges: "2000", unloadingCharges: "1500", cwcParking: "600", createdAt: day(8) },
  ];

  const activities: Activity[] = [
    { id: uid(), type: "company", message: "Added company \"Sunrise Freight\"", at: day(10) },
    { id: uid(), type: "bill", message: "Bill BILL-007 added", at: day(1) },
    { id: uid(), type: "payment", message: "Payment of ₹30000 from Sunrise Freight received", at: day(0) },
    { id: uid(), type: "quotation", message: "Quotation Mumbai → Delhi", at: day(12) },
  ];

  return { companies, bills, payments, quotations, activities, preferences: initial.preferences };
}
