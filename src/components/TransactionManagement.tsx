import { useState, useEffect } from 'react';
import { db } from '../Firebase/Config';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { X, Edit3 } from 'lucide-react';

import type { Partner, Transaction, Message, ActiveTab } from '../types';
import { formatCurrency, getTotalsByType } from '../utils';
import PartnerForm from './PartnerForm';
import PartnerList from './PartnerList';
import TransactionForm from './TransactionForm';
import TransactionTable from './TransactionsTable';
import BalanceSummary from './BalanceSummary';

export default function TransactionManagement() {
  // Common state
  const [activeTab, setActiveTab] = useState<ActiveTab>('transactions');
  
  const [message, setMessage] = useState<Message | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Data state
  const [partners, setPartners] = useState<Partner[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Set up real-time listeners
    const unsubscribePartners = setupPartnersListener();
    const unsubscribeTransactions = setupTransactionsListener();

    return () => {
      unsubscribePartners();
      unsubscribeTransactions();
    };
  }, []);

  // Real-time listeners
  const setupPartnersListener = () => {
    const q = query(collection(db, 'partners'), orderBy('name'));
    return onSnapshot(q, (querySnapshot) => {
      const partnersData: Partner[] = [];
      querySnapshot.forEach((doc) => {
        partnersData.push({
          id: doc.id,
          ...doc.data()
        } as Partner);
      });
      setPartners(partnersData);
    }, (error) => {
      console.error('Error fetching partners:', error);
    });
  };

  const setupTransactionsListener = () => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const transactionsData: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({
          id: doc.id,
          ...doc.data()
        } as Transaction);
      });
      setTransactions(transactionsData);
    }, (error) => {
      console.error('Error fetching transactions:', error);
    });
  };

  // Utility functions
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const totals = getTotalsByType(transactions);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      {/* Header with Edit Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Management</h1>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isEditMode 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {isEditMode ? <X size={16} /> : <Edit3 size={16} />}
          {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          {(['partners', 'transactions'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <PartnerForm 
            partners={partners}
            setPartners={setPartners}
            showMessage={showMessage}
          />
          <PartnerList 
            partners={partners}
            setPartners={setPartners}
            isEditMode={isEditMode}
            showMessage={showMessage}
          />
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Add Transaction Form */}
          <TransactionForm 
            partners={partners}
            showMessage={showMessage}
          />

          {/* Transaction Summary */}
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

          {/* Transactions Table */}
          <TransactionTable 
            transactions={transactions}
            partners={partners}
            isEditMode={isEditMode}
            showMessage={showMessage}
          />

          {/* Partner Balance Summary */}
          <BalanceSummary 
            partners={partners}
            transactions={transactions}
          />
        </div>
      )}
    </div>
  );
}