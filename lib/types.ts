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
}
