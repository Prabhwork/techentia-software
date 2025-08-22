import { useState } from 'react';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';
import { db } from '../Firebase/Config';
import type { Transaction, Partner, EditingCell} from '../types';
import { formatCurrency, formatDate, calculatePersonLiability, getStatusClass, getNetBalanceClass } from '../utils';

interface TransactionTableProps {
  transactions: Transaction[];
  partners: Partner[];
  isEditMode: boolean;
  showMessage: (text: string, type: 'success' | 'error') => void;
}

export default function TransactionTable({ transactions, partners, isEditMode, showMessage }: TransactionTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  const handleDeleteTransaction = async (id: string): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
        showMessage('Transaction deleted successfully!', 'success');
      } catch (error) {
        showMessage('Failed to delete transaction', 'error');
      }
    }
  };

  const handleUpdateTransaction = async (id: string, field: string, value: any): Promise<void> => {
    try {
      await updateDoc(doc(db, 'transactions', id), {
        [field]: value
      });
      setEditingCell(null);
      showMessage('Transaction updated successfully!', 'success');
    } catch (error) {
      showMessage('Failed to update transaction', 'error');
    }
  };

  const handleCellClick = (txId: string, field: string, value: any): void => {
    if (isEditMode) {
      setEditingCell({ txId, field, value });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Transactions ({transactions.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-900 min-w-[60px]">Actions</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 min-w-[200px]">Description</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 min-w-[100px]">Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 min-w-[80px]">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 min-w-[100px]">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 min-w-[120px]">Paid By</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 min-w-[120px]">Received By</th>
              {partners.map((partner) => (
                <th key={partner.id} className="px-4 py-3 text-left font-semibold text-gray-900 min-w-[100px]">
                  {partner.name} ({(partner.equity * 100).toFixed(0)}%)
                </th>
              ))}
              <th className="px-4 py-3 text-left font-semibold text-gray-900 min-w-[100px]">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 min-w-[200px]">Notes</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={10 + partners.length} className="px-4 py-8 text-center text-gray-500 italic">
                  No transactions added yet.
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {isEditMode && (
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Delete Transaction"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>

                  <td
                    className={`px-4 py-3 font-medium ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    onClick={() => handleCellClick(transaction.id, 'description', transaction.description)}
                    title={transaction.description}
                  >
                    {editingCell?.txId === transaction.id && editingCell?.field === 'description' ? (
                      <input
                        type="text"
                        defaultValue={transaction.description}
                        onBlur={(e) => handleUpdateTransaction(transaction.id, 'description', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateTransaction(transaction.id, 'description', e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <div className="truncate">{transaction.description}</div>
                    )}
                  </td>

                  <td
                    className={`px-4 py-3 font-semibold text-gray-900 ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    onClick={() => handleCellClick(transaction.id, 'amount', transaction.amount)}
                  >
                    {editingCell?.txId === transaction.id && editingCell?.field === 'amount' ? (
                      <input
                        type="number"
                        defaultValue={transaction.amount}
                        onBlur={(e) => handleUpdateTransaction(transaction.id, 'amount', parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateTransaction(transaction.id, 'amount', parseFloat(e.currentTarget.value) || 0);
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        step="0.01"
                        min="0"
                        autoFocus
                      />
                    ) : (
                      formatCurrency(transaction.amount)
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.type === 'Expense' ? 'bg-blue-100 text-blue-800' :
                      transaction.type === 'Receivable' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>

                  <td
                    className={`px-4 py-3 ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    onClick={() => handleCellClick(transaction.id, 'status', transaction.status)}
                  >
                    {editingCell?.txId === transaction.id && editingCell?.field === 'status' ? (
                      <select
                        defaultValue={transaction.status}
                        onBlur={(e) => handleUpdateTransaction(transaction.id, 'status', e.target.value)}
                        onChange={(e) => handleUpdateTransaction(transaction.id, 'status', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusClass(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    )}
                  </td>

                  <td
                    className={`px-4 py-3 ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    onClick={() => handleCellClick(transaction.id, 'paidBy', transaction.paidBy)}
                    title={transaction.paidBy}
                  >
                    {editingCell?.txId === transaction.id && editingCell?.field === 'paidBy' ? (
                      <select
                        defaultValue={transaction.paidBy}
                        onBlur={(e) => handleUpdateTransaction(transaction.id, 'paidBy', e.target.value)}
                        onChange={(e) => handleUpdateTransaction(transaction.id, 'paidBy', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      >
                        <option value="">Select partner</option>
                        {partners.map((partner) => (
                          <option key={partner.id} value={partner.name}>
                            {partner.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="truncate">{transaction.paidBy}</div>
                    )}
                  </td>

                  <td
                    className={`px-4 py-3 ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    onClick={() => handleCellClick(transaction.id, 'receivedBy', transaction.receivedBy)}
                    title={transaction.receivedBy}
                  >
                    {editingCell?.txId === transaction.id && editingCell?.field === 'receivedBy' ? (
                      <select
                        defaultValue={transaction.receivedBy}
                        onBlur={(e) => handleUpdateTransaction(transaction.id, 'receivedBy', e.target.value)}
                        onChange={(e) => handleUpdateTransaction(transaction.id, 'receivedBy', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      >
                        <option value="">Select partner</option>
                        {partners.map((partner) => (
                          <option key={partner.id} value={partner.name}>
                            {partner.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="truncate">{transaction.receivedBy}</div>
                    )}
                  </td>

                  {partners.map((partner) => {
                    const calc = calculatePersonLiability(transaction, partner.id, partners);

                    return (
                      <td key={partner.id} className={`px-4 py-3 font-semibold text-center ${getNetBalanceClass(calc.net)}`}>
                        {transaction.type === 'Expense' && (
                          <div>
                            {calc.net >= 0 ? '+' : ''}{formatCurrency(calc.net)}
                          </div>
                        )}
                        {transaction.type === 'Receivable' && (
                          <div>
                            {calc.net >= 0 ? '+' : ''}{formatCurrency(calc.net)}
                          </div>
                        )}
                        {transaction.type === 'Payable' && (
                          <div className="text-red-700">
                            {formatCurrency(calc.liability)}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(transaction.date)}
                  </td>

                  <td
                    className={`px-4 py-3 text-sm text-gray-600 ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    onClick={() => handleCellClick(transaction.id, 'notes', transaction.notes)}
                    title={transaction.notes}
                  >
                    {editingCell?.txId === transaction.id && editingCell?.field === 'notes' ? (
                      <textarea
                        defaultValue={transaction.notes}
                        onBlur={(e) => handleUpdateTransaction(transaction.id, 'notes', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            handleUpdateTransaction(transaction.id, 'notes', e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded resize-none"
                        rows={2}
                        autoFocus
                      />
                    ) : (
                      <div className="line-clamp-2">{transaction.notes || '-'}</div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}