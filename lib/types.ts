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