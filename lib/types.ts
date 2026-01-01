export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
  businessId?: string;
  transactionsPerPage?: number;
  businessType?: string;
}

export interface Transaction {
  id: string;
  businessId: string;
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
  recipientId?: string;
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
  currentCashBalance: number;
  currentBankBalance: number;
}

export interface AgentTaskStatus {
  loggedIn: boolean;
  transactionsRecorded: boolean;
  reconciliationPending: boolean;
  reconciled: boolean;
}