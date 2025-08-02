// useBusinessManagement.ts
import { useState, FormEvent } from 'react';
import { 
  Partner, 
  Transaction, 
  Message, 
  EditingCell, 
  ActiveTab, 
  TransactionType, 
  TransactionStatus
} from './types';
import { generateId, getCurrentDateTime } from './utils';

export const useBusinessManagement = () => {
  // Common state
  const [activeTab, setActiveTab] = useState<ActiveTab>('partners');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  // Data state
  const [partners, setPartners] = useState<Partner[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Form state for transactions
  const [transactionDescription, setTransactionDescription] = useState<string>('');
  const [transactionAmount, setTransactionAmount] = useState<string>('');
  const [transactionType, setTransactionType] = useState<TransactionType>('Expense');
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('Pending');
  const [transactionPaidBy, setTransactionPaidBy] = useState<string[]>([]);
  const [transactionReceivedBy, setTransactionReceivedBy] = useState<string>('');
  const [customReceivedBy, setCustomReceivedBy] = useState<string>('');
  const [transactionNotes, setTransactionNotes] = useState<string>('');

  // Form state for partners
  const [partnerName, setPartnerName] = useState<string>('');

  // Utility functions
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // CRUD operations for Partners
  const handlePartnerSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!partnerName.trim()) {
        throw new Error('Partner name is required');
      }

      // Check if partner already exists
      const existingPartner = partners.find(p => p.name.toLowerCase() === partnerName.trim().toLowerCase());
      if (existingPartner) {
        throw new Error('Partner with this name already exists');
      }

      const currentTotalEquity = partners.reduce((sum, p) => sum + p.equity, 0);
      let newEquity: number;

      if (currentTotalEquity >= 1) {
        // If total equity is 100% or more, redistribute equally among all partners
        const totalPartners = partners.length + 1;
        newEquity = 1 / totalPartners;
        
        // Update existing partners' equity
        const updatedPartners = partners.map(partner => ({
          ...partner,
          equity: newEquity
        }));
        setPartners(updatedPartners);
      } else {
        // If total equity is less than 100%, give remaining equity to new partner
        newEquity = 1 - currentTotalEquity;
      }

      const newPartner: Partner = {
        id: generateId(),
        name: partnerName.trim(),
        equity: newEquity
      };

      setPartners(prev => [...prev, newPartner]);

      showMessage('Partner added successfully!', 'success');
      setPartnerName('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // CRUD operations for Transactions
  const handleTransactionSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!transactionDescription.trim() || !transactionAmount.trim()) {
        throw new Error('Description and amount are required');
      }

      if (transactionPaidBy.length === 0) {
        throw new Error('Please select at least one person who paid');
      }

      const finalReceivedBy = customReceivedBy.trim() || transactionReceivedBy;
      if (!finalReceivedBy) {
        throw new Error('Please specify who received the payment');
      }

      const amountNum = parseFloat(transactionAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      const newTransaction: Transaction = {
        id: generateId(),
        description: transactionDescription.trim(),
        amount: amountNum,
        type: transactionType,
        status: transactionStatus,
        paidBy: transactionPaidBy,
        receivedBy: finalReceivedBy,
        notes: transactionNotes.trim(),
        date: getCurrentDateTime(),
        createdAt: getCurrentDateTime()
      };

      setTransactions(prev => [newTransaction, ...prev]);

      showMessage('Transaction added successfully!', 'success');
      setTransactionDescription('');
      setTransactionAmount('');
      setTransactionPaidBy([]);
      setTransactionReceivedBy('');
      setCustomReceivedBy('');
      setTransactionNotes('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete operations
  const handleDeletePartner = async (id: string): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this partner?')) {
      try {
        setPartners(prev => prev.filter(partner => partner.id !== id));
        showMessage('Partner deleted successfully!', 'success');
      } catch (error) {
        showMessage('Failed to delete partner', 'error');
      }
    }
  };

  const handleDeleteTransaction = async (id: string): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        setTransactions(prev => prev.filter(transaction => transaction.id !== id));
        showMessage('Transaction deleted successfully!', 'success');
      } catch (error) {
        showMessage('Failed to delete transaction', 'error');
      }
    }
  };

  // Update operations
  const handleUpdateTransaction = async (id: string, field: string, value: any): Promise<void> => {
    try {
      setTransactions(prev => prev.map(transaction => 
        transaction.id === id ? { ...transaction, [field]: value } : transaction
      ));
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

  const handlePaidByChange = (partnerName: string, checked: boolean) => {
    if (checked) {
      setTransactionPaidBy([...transactionPaidBy, partnerName]);
    } else {
      setTransactionPaidBy(transactionPaidBy.filter(name => name !== partnerName));
    }
  };

  return {
    // State
    activeTab,
    setActiveTab,
    loading,
    message,
    isEditMode,
    setIsEditMode,
    editingCell,
    setEditingCell,
    partners,
    transactions,
    
    // Transaction form state
    transactionDescription,
    setTransactionDescription,
    transactionAmount,
    setTransactionAmount,
    transactionType,
    setTransactionType,
    transactionStatus,
    setTransactionStatus,
    transactionPaidBy,
    setTransactionPaidBy,
    transactionReceivedBy,
    setTransactionReceivedBy,
    customReceivedBy,
    setCustomReceivedBy,
    transactionNotes,
    setTransactionNotes,
    
    // Partner form state
    partnerName,
    setPartnerName,
    
    // Functions
    handlePartnerSubmit,
    handleTransactionSubmit,
    handleDeletePartner,
    handleDeleteTransaction,
    handleUpdateTransaction,
    handleCellClick,
    handlePaidByChange
  };
};