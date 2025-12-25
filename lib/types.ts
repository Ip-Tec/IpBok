export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
  businessId?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: {
    name: string;
  };
  paymentMethod: string;
  description: string | null;
  date: string;
  recordedBy: {
    name: string | null;
    email: string;
  } | null;
  status: string;
}

export interface CashAdvance {
  id: string;
  amount: number;
  description: string | null;
  recordedBy: {
    name: string | null;
  } | null;
}

export interface AgentSummaryCards {
  todayTotalCollected: number;
  cashCollectedToday: number;
  bankCollectedToday: number;
  pendingReconciliationStatus: string;
  yesterdayBalance: number;
}

export interface AgentTaskStatus {
  loggedIn: boolean;
  transactionsRecorded: boolean;
  reconciliationPending: boolean;
  reconciled: boolean;
}