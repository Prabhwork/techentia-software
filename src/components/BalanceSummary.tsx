import type { Partner, Transaction } from '../types';
import { formatCurrency, calculatePersonLiability, getNetBalanceClass } from '../utils';

interface BalanceSummaryProps {
  partners: Partner[];
  transactions: Transaction[];
}

export default function BalanceSummary({ partners, transactions }: BalanceSummaryProps) {
  if (partners.length === 0 || transactions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Partner Balance Summary</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Partner</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Equity</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Total Expenses</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Total Receivables</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Total Payables</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Net Balance</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => {
              const partnerTransactions = transactions.filter(tx =>
                tx.paidBy === partner.name || tx.receivedBy === partner.name
              );

              let totalExpenseNet = 0;
              let totalReceivableNet = 0;
              let totalPayableLiability = 0;

              partnerTransactions.forEach(tx => {
                const calc = calculatePersonLiability(tx, partner.id, partners);
                if (tx.type === 'Expense') {
                  totalExpenseNet += calc.net;
                } else if (tx.type === 'Receivable') {
                  totalReceivableNet += calc.net;
                } else if (tx.type === 'Payable') {
                  totalPayableLiability += calc.liability;
                }
              });

              const netBalance = totalExpenseNet + totalReceivableNet - totalPayableLiability;

              return (
                <tr key={partner.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">{partner.name}</td>
                  <td className="px-4 py-3">{(partner.equity * 100).toFixed(1)}%</td>
                  <td className={`px-4 py-3 font-semibold ${getNetBalanceClass(totalExpenseNet)}`}>
                    {totalExpenseNet >= 0 ? '+' : ''}{formatCurrency(totalExpenseNet)}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${getNetBalanceClass(totalReceivableNet)}`}>
                    {totalReceivableNet >= 0 ? '+' : ''}{formatCurrency(totalReceivableNet)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-red-700">
                    {formatCurrency(totalPayableLiability)}
                  </td>
                  <td className={`px-4 py-3 font-bold text-lg ${getNetBalanceClass(netBalance)}`}>
                    {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}