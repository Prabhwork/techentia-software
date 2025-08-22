
import { formatCurrency } from '../utils';

interface SummaryCardsProps {
  totals: {
    Expense: number;
    Receivable: number;
    Payable: number;
  };
}

export default function SummaryCards({ totals }: SummaryCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-800">Total Expenses</h4>
        <p className="text-2xl font-bold text-blue-900">{formatCurrency(totals.Expense)}</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-800">Total Receivables</h4>
        <p className="text-2xl font-bold text-green-900">{formatCurrency(totals.Receivable)}</p>
      </div>
      <div className="bg-red-50 p-4 rounded-lg">
        <h4 className="font-medium text-red-800">Total Payables</h4>
        <p className="text-2xl font-bold text-red-900">{formatCurrency(totals.Payable)}</p>
      </div>
    </div>
  );
}