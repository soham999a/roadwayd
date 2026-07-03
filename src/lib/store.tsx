import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { writeDoc, deleteDoc_, subscribeCollection, subscribeDoc, writeBatchData } from "./firebase";
import type { Unsubscribe } from "firebase/firestore";

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
  } catch { }
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

function toMap<T extends { id: string }>(items: T[]): Record<string, T> {
  const map: Record<string, T> = {};
  for (const item of items) map[item.id] = item;
  return map;
}

function fromMap<T extends { id: string }>(map: Record<string, T>): T[] {
  return Object.values(map);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [hydrated, setHydrated] = useState(false);
  const [fbReady, setFbReady] = useState(false);
  const stateRef = useRef(state);
  const seededRef = useRef(false);

  stateRef.current = state;

  // 1. Hydrate from localStorage instantly
  useEffect(() => {
    const local = loadLocal();
    setState(local);
    setHydrated(true);
  }, []);

  // 2. Subscribe to Firestore collections
  useEffect(() => {
    if (!hydrated) return;
    const unsubs: Unsubscribe[] = [];
    let loads = 0;
    const total = 6;

    const onLoad = () => {
      loads++;
      if (loads >= total) {
        setSyncStatus("synced");
        setFbReady(true);
      }
    };

    const onError = () => setSyncStatus("error");

    const onCompanies = (data: Record<string, Omit<Company, "id">>) => {
      const items = fromMap(data as unknown as Record<string, Company>);
      setState((prev) => {
        const next = { ...prev, companies: items };
        saveLocal(next);
        return next;
      });
      onLoad();
    };
    const onBills = (data: Record<string, Omit<Bill, "id">>) => {
      const items = fromMap(data as unknown as Record<string, Bill>);
      setState((prev) => {
        const next = { ...prev, bills: items };
        saveLocal(next);
        return next;
      });
      onLoad();
    };
    const onPayments = (data: Record<string, Omit<Payment, "id">>) => {
      const items = fromMap(data as unknown as Record<string, Payment>);
      setState((prev) => {
        const next = { ...prev, payments: items };
        saveLocal(next);
        return next;
      });
      onLoad();
    };
    const onQuotations = (data: Record<string, Omit<Quotation, "id">>) => {
      const items = fromMap(data as unknown as Record<string, Quotation>);
      setState((prev) => {
        const next = { ...prev, quotations: items };
        saveLocal(next);
        return next;
      });
      onLoad();
    };
    const onActivities = (data: Record<string, Omit<Activity, "id">>) => {
      const items = fromMap(data as unknown as Record<string, Activity>);
      setState((prev) => {
        const next = { ...prev, activities: items };
        saveLocal(next);
        return next;
      });
      onLoad();
    };
    const onPreferences = (data: Preferences | null) => {
      setState((prev) => {
        const next = { ...prev, preferences: { ...prev.preferences, ...(data ?? {}) } };
        saveLocal(next);
        return next;
      });
      onLoad();
    };

    try {
      unsubs.push(subscribeCollection("companies", onCompanies));
      unsubs.push(subscribeCollection("bills", onBills));
      unsubs.push(subscribeCollection("payments", onPayments));
      unsubs.push(subscribeCollection("quotations", onQuotations));
      unsubs.push(subscribeCollection("activities", onActivities));
      unsubs.push(subscribeDoc("preferences/default", onPreferences));
    } catch {
      onError();
    }

    return () => unsubs.forEach((u) => u());
  }, [hydrated]);

  // 3. Seed data once if both localStorage and Firestore are empty
  useEffect(() => {
    if (!fbReady) return;
    if (seededRef.current) return;
    if (state.companies.length > 0) return;

    seededRef.current = true;
    const seed = seedData();
    const batchItems = [
      ...seed.companies.map((c) => ({ path: "companies", id: c.id, data: c })),
      ...seed.bills.map((b) => ({ path: "bills", id: b.id, data: b })),
      ...seed.payments.map((p) => ({ path: "payments", id: p.id, data: p })),
      ...seed.quotations.map((q) => ({ path: "quotations", id: q.id, data: q })),
      ...seed.activities.map((a) => ({ path: "activities", id: a.id, data: a })),
      { path: "preferences", id: "default", data: seed.preferences },
    ];
    writeBatchData(batchItems).catch(() => setSyncStatus("error"));
    setState(seed);
    saveLocal(seed);
  }, [fbReady, state.companies.length]);

  const pushActivity = async (a: Omit<Activity, "id" | "at">) => {
    const entry: Activity = { id: uid(), at: new Date().toISOString(), ...a };
    setState((s) => {
      const next = { ...s, activities: [entry, ...s.activities].slice(0, 200) };
      saveLocal(next);
      return next;
    });
    try {
      await writeDoc("activities", entry.id, entry);
    } catch {
      setSyncStatus("error");
    }
  };

  const ctx: Ctx = {
    state,
    syncStatus,
    addCompany: (c) => {
      const company: Company = { id: uid(), createdAt: new Date().toISOString(), ...c };
      setState((s) => {
        const next = { ...s, companies: [company, ...s.companies] };
        saveLocal(next);
        return next;
      });
      writeDoc("companies", company.id, company).catch(() => setSyncStatus("error"));
      pushActivity({ type: "company", message: `Added company "${company.name}"` });
      return company;
    },
    updateCompany: (id, data) => {
      setState((s) => {
        const next = { ...s, companies: s.companies.map((c) => (c.id === id ? { ...c, ...data } : c)) };
        saveLocal(next);
        return next;
      });
      writeDoc("companies", id, { ...data }).catch(() => setSyncStatus("error"));
    },
    deleteCompany: (id) => {
      const billIds = stateRef.current.bills.filter((b) => b.companyId === id).map((b) => b.id);
      setState((s) => {
        const next = {
          ...s,
          companies: s.companies.filter((c) => c.id !== id),
          bills: s.bills.filter((b) => b.companyId !== id),
          payments: s.payments.filter((p) => !billIds.includes(p.billId)),
        };
        saveLocal(next);
        return next;
      });
      deleteDoc_("companies", id).catch(() => setSyncStatus("error"));
      billIds.forEach((bid) => deleteDoc_("bills", bid).catch(() => {}));
    },
    addBill: (b) => {
      const bill: Bill = { id: uid(), createdAt: new Date().toISOString(), ...b };
      setState((s) => {
        const next = { ...s, bills: [bill, ...s.bills] };
        saveLocal(next);
        return next;
      });
      writeDoc("bills", bill.id, bill).catch(() => setSyncStatus("error"));
      pushActivity({ type: "bill", message: `Bill ${bill.billNumber || "(no #)"} added` });
      return bill;
    },
    deleteBill: (id) => {
      setState((s) => {
        const next = {
          ...s,
          bills: s.bills.filter((b) => b.id !== id),
          payments: s.payments.filter((p) => p.billId !== id),
        };
        saveLocal(next);
        return next;
      });
      deleteDoc_("bills", id).catch(() => setSyncStatus("error"));
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
        saveLocal(next);
        return next;
      });
      writeDoc("payments", payment.id, payment).catch(() => setSyncStatus("error"));
      return payment;
    },
    deletePayment: (id) => {
      setState((s) => {
        const next = { ...s, payments: s.payments.filter((p) => p.id !== id) };
        saveLocal(next);
        return next;
      });
      deleteDoc_("payments", id).catch(() => setSyncStatus("error"));
    },
    addQuotation: (q) => {
      const quotation: Quotation = { id: uid(), createdAt: new Date().toISOString(), ...q };
      setState((s) => {
        const next = { ...s, quotations: [quotation, ...s.quotations] };
        saveLocal(next);
        return next;
      });
      writeDoc("quotations", quotation.id, quotation).catch(() => setSyncStatus("error"));
      pushActivity({ type: "quotation", message: `Quotation ${quotation.from} → ${quotation.to}` });
      return quotation;
    },
    deleteQuotation: (id) => {
      setState((s) => {
        const next = { ...s, quotations: s.quotations.filter((q) => q.id !== id) };
        saveLocal(next);
        return next;
      });
      deleteDoc_("quotations", id).catch(() => setSyncStatus("error"));
    },
    setBusinessFields: (fields) => {
      setState((s) => {
        const next = { ...s, preferences: { ...s.preferences, businessFields: fields } };
        saveLocal(next);
        return next;
      });
      writeDoc("preferences", "default", { businessFields: fields }).catch(() => setSyncStatus("error"));
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
