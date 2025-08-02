import React, { useState, useEffect, FormEvent } from 'react';
import { addExpense, getExpenses } from '../services/ExpenseService';
import { db } from '../Firebase/Config';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';

// Interfaces
interface Expense {
  id: string;
  name: string;
  percentage: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  payer: string;
  type: TransactionType;
  date: any; // Firebase Timestamp
}

interface Message {
  text: string;
  type: 'success' | 'error';
}

type TransactionType = 'payable' | 'receivable';
type ActiveTab = 'expenses' | 'transactions';

export default function ExpenseTransactionManager(): JSX.Element {
  // Common state
  const [activeTab, setActiveTab] = useState<ActiveTab>('expenses');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);

  // Expense state
  const [expenseName, setExpenseName] = useState<string>('');
  const [expensePercentage, setExpensePercentage] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Transaction state
  const [transactionDescription, setTransactionDescription] = useState<string>('');
  const [transactionAmount, setTransactionAmount] = useState<string>('');
  const [transactionPayer, setTransactionPayer] = useState<string>('');
  const [transactionType, setTransactionType] = useState<TransactionType>('payable');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchExpenses();
    fetchTransactions();
  }, []);

  // Expense functions
  const fetchExpenses = async (): Promise<void> => {
    try {
      const data: Expense[] = await getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    }
  };

  const handleExpenseSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!expenseName.trim() || !expensePercentage.trim()) {
        throw new Error('All fields are required');
      }

      const percentageNum = parseFloat(expensePercentage);
      if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
        throw new Error('Percentage must be a valid number between 0 and 100');
      }

      await addExpense({ name: expenseName.trim(), percentage: percentageNum });

      setMessage({ text: 'Expense added successfully!', type: 'success' });
      setExpenseName('');
      setExpensePercentage('');
      fetchExpenses();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      setMessage({
        text: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Transaction functions
  const fetchTransactions = async (): Promise<void> => {
    try {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const transactionData: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        transactionData.push({
          id: doc.id,
          ...doc.data()
        } as Transaction);
      });
      
      setTransactions(transactionData);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handleTransactionSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!transactionDescription.trim() || !transactionAmount.trim() || !transactionPayer.trim()) {
        throw new Error('All fields are required');
      }

      const amountNum = parseFloat(transactionAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      const transactionData = {
        description: transactionDescription.trim(),
        amount: amountNum,
        payer: transactionPayer.trim(),
        type: transactionType,
        date: serverTimestamp()
      };

      await addDoc(collection(db, 'transactions'), transactionData);

      setMessage({ text: 'Transaction added successfully!', type: 'success' });
      setTransactionDescription('');
      setTransactionAmount('');
      setTransactionPayer('');
      setTransactionType('payable');
      fetchTransactions();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      setMessage({
        text: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString();
  };

  const getTotalByType = (type: TransactionType): number => {
    return transactions
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-lg">
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'expenses'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'transactions'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Transactions
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Add Expense Form */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Expense Name:</label>
                <input
                  type="text"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Rent"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Percentage:</label>
                <input
                  type="number"
                  value={expensePercentage}
                  onChange={(e) => setExpensePercentage(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 25"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Adding...' : 'Add Expense'}
              </button>
            </form>
          </div>

          {/* Expenses List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Existing Expenses</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {expenses.length === 0 ? (
                <p className="text-gray-500 italic">No expenses added yet.</p>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.id} className="border p-3 rounded bg-gray-50">
                    <div className="flex justify-between items-center">
                      <strong className="text-gray-800">{expense.name}</strong>
                      <span className="text-blue-600 font-medium">{expense.percentage}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {expenses.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-700">
                  Total: {expenses.reduce((sum, exp) => sum + exp.percentage, 0).toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Add Transaction Form */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Add New Transaction</h2>
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Description:</label>
                <input
                  type="text"
                  value={transactionDescription}
                  onChange={(e) => setTransactionDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Transaction description"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Amount:</label>
                <input
                  type="number"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Payer:</label>
                <input
                  type="text"
                  value={transactionPayer}
                  onChange={(e) => setTransactionPayer(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Who paid?"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Type:</label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="payable">Payable</option>
                  <option value="receivable">Receivable</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Adding...' : 'Add Transaction'}
              </button>
            </form>
          </div>

          {/* Transactions List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            
            {/* Summary */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-red-50 p-3 rounded">
                <p className="text-sm text-red-600">Total Payable</p>
                <p className="text-lg font-semibold text-red-700">
                  ${getTotalByType('payable').toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-green-600">Total Receivable</p>
                <p className="text-lg font-semibold text-green-700">
                  ${getTotalByType('receivable').toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-gray-500 italic">No transactions added yet.</p>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="border p-3 rounded bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{transaction.description}</h4>
                        <p className="text-sm text-gray-600">Paid by: {transaction.payer}</p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'payable' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ${transaction.amount.toFixed(2)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          transaction.type === 'payable' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {transaction.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}