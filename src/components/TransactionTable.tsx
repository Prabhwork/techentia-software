import React from 'react';
import { Trash2 } from 'lucide-react';
import type { TransactionTableProps, Transaction, PersonCalculation } from '../types';
import EditableCell from './EditableCell';

const TransactionTable: React.FC<TransactionTableProps & { 
  calculatePersonLiability: (transaction: Transaction, partnerId: string) => PersonCalculation;
  formatCurrency: (amount: number) => string;
  getStatusClass: (status: string) => string;
  getNetBalanceClass: (net: number) => string;
}> = ({
  transactions: tableTransactions,
  partners,
  isEditMode,
  editingCell,
  onCellClick,
  onUpdateTransaction,
  onDeleteTransaction,
  setEditingCell,
  calculatePersonLiability,
  formatCurrency,
  getStatusClass,
  getNetBalanceClass
}) => {
  const getColumnsForType = (type: string) => {
    const baseColumns = ['Actions', 'Description', 'Amount', 'Status'];
    
    if (type === 'Expense') {
      return [...baseColumns, 'Received By', 'Paid By', ...partners.map(p => `${p.name} (${(p.equity * 100).toFixed(0)}%)`), 'Notes'];
    } else if (type === 'Receivable') {
      return [...baseColumns, 'Paid By', 'Received By', ...partners.map(p => `${p.name} Net`), 'Notes'];
    } else if (type === 'Payable') {
      return [...baseColumns, 'Received By', 'Paid By', ...partners.map(p => `${p.name} Liability`), 'Notes'];
    }
    return [...baseColumns, 'Received By', 'Paid By', ...partners.map(p => `${p.name} Net`), 'Notes'];
  };

  const transactionType = tableTransactions[0]?.type || 'All';
  const columns = getColumnsForType(transactionType);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((column, index) => (
                <th key={index} className="px-4 py-3 text-left font-semibold text-gray-900 min-w-[120px]">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableTransactions.map((tx) => (
              <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 w-20">
                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                    title="Delete Transaction"
                    disabled={!isEditMode}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
                
                <td
                  className={`px-4 py-3 font-medium min-w-[200px] ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                  onClick={() => onCellClick(tx.id, 'description', tx.description)}
                  title={tx.description}
                >
                  {editingCell?.txId === tx.id && editingCell?.field === 'description' ? (
                    <EditableCell
                      value={tx.description}
                      onSave={(value) => onUpdateTransaction(tx.id, 'description', value)}
                      partners={partners}
                      editingCell={editingCell}
                      setEditingCell={setEditingCell}
                    />
                  ) : (
                    <div className="line-clamp-1">{tx.description}</div>
                  )}
                </td>
                
                <td
                  className={`px-4 py-3 font-semibold text-gray-900 min-w-[100px] ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                  onClick={() => onCellClick(tx.id, 'amount', tx.amount)}
                >
                  {editingCell?.txId === tx.id && editingCell?.field === 'amount' ? (
                    <EditableCell
                      value={tx.amount}
                      onSave={(value) => onUpdateTransaction(tx.id, 'amount', parseFloat(value.toString()) || 0)}
                      type="number"
                      partners={partners}
                      editingCell={editingCell}
                      setEditingCell={setEditingCell}
                    />
                  ) : formatCurrency(tx.amount)}
                </td>
                
                <td
                  className={`px-4 py-3 min-w-[120px] ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                  onClick={() => onCellClick(tx.id, 'status', tx.status)}
                >
                  {editingCell?.txId === tx.id && editingCell?.field === 'status' ? (
                    <EditableCell
                      value={tx.status}
                      onSave={(value) => onUpdateTransaction(tx.id, 'status', value)}
                      type="select"
                      field="status"
                      partners={partners}
                      editingCell={editingCell}
                      setEditingCell={setEditingCell}
                    />
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusClass(tx.status)}`}>
                      {tx.status}
                    </span>
                  )}
                </td>

                {transactionType !== 'Payable' && (
                  <>
                    <td
                      className={`px-4 py-3 min-w-[120px] ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                      onClick={() => onCellClick(tx.id, transactionType === 'Receivable' ? 'paidBy' : 'receivedBy', transactionType === 'Receivable' ? tx.paidBy : tx.receivedBy)}
                      title={transactionType === 'Receivable' ? tx.paidBy : tx.receivedBy}
                    >
                      {editingCell?.txId === tx.id && editingCell?.field === (transactionType === 'Receivable' ? 'paidBy' : 'receivedBy') ? (
                        <EditableCell
                          value={transactionType === 'Receivable' ? tx.paidBy : tx.receivedBy}
                          onSave={(value) => onUpdateTransaction(tx.id, transactionType === 'Receivable' ? 'paidBy' : 'receivedBy', value)}
                          type="select"
                          field={transactionType === 'Receivable' ? 'paidBy' : 'receivedBy'}
                          partners={partners}
                          editingCell={editingCell}
                          setEditingCell={setEditingCell}
                        />
                      ) : (
                        <div className="line-clamp-1">{transactionType === 'Receivable' ? tx.paidBy : tx.receivedBy}</div>
                      )}
                    </td>
                    
                    <td
                      className={`px-4 py-3 min-w-[120px] ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                      onClick={() => onCellClick(tx.id, transactionType === 'Receivable' ? 'receivedBy' : 'paidBy', transactionType === 'Receivable' ? tx.receivedBy : tx.paidBy)}
                      title={transactionType === 'Receivable' ? tx.receivedBy : tx.paidBy}
                    >
                      {editingCell?.txId === tx.id && editingCell?.field === (transactionType === 'Receivable' ? 'receivedBy' : 'paidBy') ? (
                        <EditableCell
                          value={transactionType === 'Receivable' ? tx.receivedBy : tx.paidBy}
                          onSave={(value) => onUpdateTransaction(tx.id, transactionType === 'Receivable' ? 'receivedBy' : 'paidBy', value)}
                          type="select"
                          field={transactionType === 'Receivable' ? 'receivedBy' : 'paidBy'}
                          partners={partners}
                          editingCell={editingCell}
                          setEditingCell={setEditingCell}
                        />
                      ) : (
                        <div className="line-clamp-1">{transactionType === 'Receivable' ? tx.receivedBy : tx.paidBy}</div>
                      )}
                    </td>
                  </>
                )}

                {transactionType === 'Payable' && (
                  <>
                    <td
                      className={`px-4 py-3 min-w-[120px] ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                      onClick={() => onCellClick(tx.id, 'receivedBy', tx.receivedBy)}
                      title={tx.receivedBy}
                    >
                      {editingCell?.txId === tx.id && editingCell?.field === 'receivedBy' ? (
                        <EditableCell
                          value={tx.receivedBy}
                          onSave={(value) => onUpdateTransaction(tx.id, 'receivedBy', value)}
                          type="select"
                          field="receivedBy"
                          partners={partners}
                          editingCell={editingCell}
                          setEditingCell={setEditingCell}
                        />
                      ) : (
                        <div className="line-clamp-1">{tx.receivedBy}</div>
                      )}
                    </td>
                    
                    <td
                      className={`px-4 py-3 min-w-[120px] ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                      onClick={() => onCellClick(tx.id, 'paidBy', tx.paidBy)}
                      title={tx.paidBy}
                    >
                      {editingCell?.txId === tx.id && editingCell?.field === 'paidBy' ? (
                        <EditableCell
                          value={tx.paidBy}
                          onSave={(value) => onUpdateTransaction(tx.id, 'paidBy', value)}
                          type="select"
                          field="paidBy"
                          partners={partners}
                          editingCell={editingCell}
                          setEditingCell={setEditingCell}
                        />
                      ) : (
                        <div className="line-clamp-1">{tx.paidBy}</div>
                      )}
                    </td>
                  </>
                )}

                {partners.map((partner) => {
                  const calc = calculatePersonLiability(tx, partner.id);
                  return (
                    <td key={partner.id} className={`px-4 py-3 font-semibold min-w-[100px] ${getNetBalanceClass(transactionType === 'Expense' ? calc.net : transactionType === 'Payable' ? calc.liability : calc.net)}`}>
                      {transactionType === 'Expense' && (
                        <div className="text-center">
                          {calc.net >= 0 ? '+' : ''}{formatCurrency(calc.net)}
                        </div>
                      )}
                      {transactionType === 'Receivable' && (
                        <div className="text-center">
                          {calc.net >= 0 ? '+' : ''}{formatCurrency(calc.net)}
                        </div>
                      )}
                      {transactionType === 'Payable' && (
                        <div className="text-center text-red-700">
                          {formatCurrency(calc.liability)}
                        </div>
                      )}
                    </td>
                  );
                })}
                
                <td
                  className={`px-4 py-3 text-sm text-gray-600 min-w-[200px] ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                  onClick={() => onCellClick(tx.id, 'notes', tx.notes)}
                  title={tx.notes}
                >
                  {editingCell?.txId === tx.id && editingCell?.field === 'notes' ? (
                    <EditableCell
                      value={tx.notes}
                      onSave={(value) => onUpdateTransaction(tx.id, 'notes', value)}
                      partners={partners}
                      editingCell={editingCell}
                      setEditingCell={setEditingCell}
                    />
                  ) : (
                    <div className="line-clamp-1">{tx.notes}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;