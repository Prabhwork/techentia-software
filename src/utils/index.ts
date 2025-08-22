import type { Transaction, Partner, PersonCalculation } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export const formatDate = (timestamp: any): string => {
  if (!timestamp || !timestamp.toDate) return 'N/A';
  return timestamp.toDate().toLocaleDateString();
};

export const calculatePersonLiability = (
  transaction: Transaction, 
  partnerId: string, 
  partners: Partner[]
): PersonCalculation => {
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return { liability: 0, net: 0, share: 0 };

  const share = transaction.amount * partner.equity;
  let liability = 0;
  let net = 0;

  if (transaction.type === 'Expense') {
    const paidByThisPerson = transaction.paidBy === partner.name;
    net = paidByThisPerson ? transaction.amount - share : -share;
  } else if (transaction.type === 'Payable') {
    liability = transaction.receivedBy === partner.name ? transaction.amount : 0;
  } else if (transaction.type === 'Receivable') {
    const receivedByThisPerson = transaction.receivedBy === partner.name;
    net = receivedByThisPerson ? transaction.amount : 0;
  }

  return { liability, net, share };
};

export const getTotalsByType = (transactions: Transaction[]) => {
  const totals = {
    Expense: 0,
    Receivable: 0,
    Payable: 0
  };

  transactions.forEach(tx => {
    totals[tx.type] += tx.amount;
  });

  return totals;
};

export const getStatusClass = (status: string): string => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const getNetBalanceClass = (value: number): string => {
  if (value > 0) return 'text-green-700';
  if (value < 0) return 'text-red-700';
  return 'text-gray-700';
};
