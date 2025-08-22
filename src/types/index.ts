// Types and Interfaces
export interface Partner {
  id: string;
  name: string;
  equity: number; // decimal value between 0 and 1
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  paidBy: string;
  receivedBy: string;
  notes: string;
  date: any;
  createdAt: any;
}

export interface PersonCalculation {
  liability: number;
  net: number;
  share: number;
}

export interface Message {
  text: string;
  type: 'success' | 'error';
}

export interface EditingCell {
  txId: string;
  field: string;
  value: any;
}

export type TransactionType = 'Expense' | 'Receivable' | 'Payable';
export type TransactionStatus = 'Pending' | 'Completed' | 'Cancelled';
export type ActiveTab = 'transactions' | 'partners';