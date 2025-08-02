export interface Partner {
  id: string;
  name: string;
  equity: number;
}

export interface Transaction {
  id: number;
  description: string;
  type: 'Expense' | 'Receivable' | 'Payable';
  amount: number;
  receivedBy: string;
  paidBy: string;
  status: string;
  notes: string;
}

export interface PersonCalculation {
  liability: number;
  payment: number;
  receivable: number;
  net: number;
}

export interface PersonBalance {
  paid: number;
  liability: number;
  receivables: number;
  totalNet: number;
}

export interface EditingCell {
  txId: number;
  field: keyof Transaction;
  currentValue: string | number;
}

export interface EditableCellProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: 'text' | 'number' | 'select';
  options?: string[];
  field?: keyof Transaction;
}

export interface NewTransaction {
  description: string;
  type: 'Expense' | 'Receivable' | 'Payable';
  amount: number;
  receivedBy: string;
  paidBy: string;
  status: string;
  notes: string;
}

export interface NewPartner {
  name: string;
  equity: number;
}

export interface TransactionTableProps {
  transactions: Transaction[];
  partners: Partner[];
  isEditMode: boolean;
  editingCell: EditingCell | null;
  onCellClick: (txId: number, field: keyof Transaction, currentValue: string | number) => void;
  onUpdateTransaction: (id: number, field: keyof Transaction, value: string | number) => void;
  onDeleteTransaction: (id: number) => void;
  setEditingCell: (cell: EditingCell | null) => void;
}