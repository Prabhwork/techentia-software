import React from 'react';
import type { Partner, Transaction, PersonBalance } from '../types';

interface ResultsTabProps {
  partners: Partner[];
  transactions: Transaction[];
  balances: Record<string, PersonBalance>;
  formatCurrency: (amount: number) => string;
}

const ResultsTab: React.FC<ResultsTabProps> = ({ partners, transactions, balances, formatCurrency }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {partners.map((partner) => {
          const balance = balances[partner.id];
          return (
            <div key={partner.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-xl font-semibold text-gray-900 mb-4">{partner.name}</div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Paid:</span>
                  <span className={`font-semibold ${balance.paid > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {formatCurrency(balance.paid)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Liability:</span>
                  <span className={`font-semibold ${balance.liability > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(balance.liability)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Receivables:</span>
                  <span className={`font-semibold ${balance.receivables > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {formatCurrency(balance.receivables)}
                  </span>
                </div>
                
                <div className={`p-4 rounded-lg text-center border-2 ${balance.totalNet >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className={`text-lg font-bold ${balance.totalNet >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Net Balance: {balance.totalNet >= 0 ? '+' : ''}{formatCurrency(balance.totalNet)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 font-medium">
                    {balance.totalNet >= 0 ? 'Should Receive' : 'Should Pay'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </div>
          <div className="text-center bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Expenses</div>
          </div>
          <div className="text-center bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(transactions.filter(t => t.type === 'Receivable').reduce((sum, t) => sum + t.amount, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Receivables</div>
          </div>
          <div className="text-center bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(transactions.filter(t => t.type === 'Payable').reduce((sum, t) => sum + t.amount, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Payables</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsTab;