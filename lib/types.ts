// Common types for IpBok application

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Owner' | 'Agent' | 'Accountant' | 'BranchManager';
  businessId?: string;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  businessId: string;
  userId: string;
  type: 'Deposit' | 'Withdrawal' | 'Expense' | 'Charge';
  amount: number;
  paymentMethod: 'cash' | 'bank';
  description?: string;
  date: string;
}

export interface Agent {
  id: string;
  businessId: string;
  name: string;
  email: string;
  permissions: string[]; // e.g., ['log_transactions', 'view_reports']
  branchId?: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  managerId?: string;
}

export interface Reconciliation {
  id: string;
  businessId: string;
  date: string;
  openingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalExpenses: number;
  totalCharges: number;
  closingBalance: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface GoogleAuthRequest {
  email: string;
  name: string;
  googleId: string;
}