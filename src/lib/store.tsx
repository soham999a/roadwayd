import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

const KEY = "popular-roadways-v1";

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

function load(): State {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return { ...initial, ...parsed, preferences: { ...initial.preferences, ...(parsed.preferences ?? {}) } };
  } catch {
    return initial;
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

type Ctx = {
  state: State;
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const pushActivity = (a: Omit<Activity, "id" | "at">) =>
    setState((s) => ({
      ...s,
      activities: [{ id: uid(), at: new Date().toISOString(), ...a }, ...s.activities].slice(0, 200),
    }));

  const ctx: Ctx = {
    state,
    addCompany: (c) => {
      const company: Company = { id: uid(), createdAt: new Date().toISOString(), ...c };
      setState((s) => ({ ...s, companies: [company, ...s.companies] }));
      pushActivity({ type: "company", message: `Added company "${company.name}"` });
      return company;
    },
    updateCompany: (id, data) =>
      setState((s) => ({
        ...s,
        companies: s.companies.map((c) => (c.id === id ? { ...c, ...data } : c)),
      })),
    deleteCompany: (id) =>
      setState((s) => {
        const billIds = s.bills.filter((b) => b.companyId === id).map((b) => b.id);
        return {
          ...s,
          companies: s.companies.filter((c) => c.id !== id),
          bills: s.bills.filter((b) => b.companyId !== id),
          payments: s.payments.filter((p) => !billIds.includes(p.billId)),
        };
      }),
    addBill: (b) => {
      const bill: Bill = { id: uid(), createdAt: new Date().toISOString(), ...b };
      setState((s) => ({ ...s, bills: [bill, ...s.bills] }));
      pushActivity({ type: "bill", message: `Bill ${bill.billNumber || "(no #)"} added` });
      return bill;
    },
    deleteBill: (id) =>
      setState((s) => ({
        ...s,
        bills: s.bills.filter((b) => b.id !== id),
        payments: s.payments.filter((p) => p.billId !== id),
      })),
    addPayment: (p) => {
      const payment: Payment = { id: uid(), createdAt: new Date().toISOString(), ...p };
      setState((s) => {
        const company = p.companyId ? s.companies.find((c) => c.id === p.companyId) : undefined;
        return {
          ...s,
          payments: [payment, ...s.payments],
          activities: [
            {
              id: uid(),
              at: new Date().toISOString(),
              type: "payment" as const,
              message: `Payment of ₹${payment.amount}${company ? ` from ${company.name}` : ""} received`,
            },
            ...s.activities,
          ].slice(0, 200),
        };
      });
      return payment;
    },
    deletePayment: (id) => setState((s) => ({ ...s, payments: s.payments.filter((p) => p.id !== id) })),
    addQuotation: (q) => {
      const quotation: Quotation = { id: uid(), createdAt: new Date().toISOString(), ...q };
      setState((s) => ({ ...s, quotations: [quotation, ...s.quotations] }));
      pushActivity({ type: "quotation", message: `Quotation ${quotation.from} → ${quotation.to}` });
      return quotation;
    },
    deleteQuotation: (id) => setState((s) => ({ ...s, quotations: s.quotations.filter((q) => q.id !== id) })),
    setBusinessFields: (fields) =>
      setState((s) => ({ ...s, preferences: { ...s.preferences, businessFields: fields } })),
  };

  return <StoreContext.Provider value={ctx}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
