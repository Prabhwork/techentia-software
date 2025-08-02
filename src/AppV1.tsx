import React, { useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

// Type definitions
interface Transaction {
  id: number;
  description: string;
  type: 'Expense' | 'Receivable' | 'Payable';
  amount: number;
  receivedBy: string;
  paidBy: string;
  status: string;
  notes: string;
}

interface PersonCalculation {
  liability: number;
  payment: number;
  receivable: number;
  net: number;
}

interface PersonBalance {
  paid: number;
  liability: number;
  receivables: number;
  totalNet: number;
}

interface Balances {
  karan: PersonBalance;
  prabee: PersonBalance;
  garvit: PersonBalance;
}

interface Equity {
  karan: number;
  prabee: number;
  garvit: number;
}

interface EditingCell {
  txId: number;
  field: keyof Transaction;
  currentValue: string | number;
}

interface EditableCellProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: 'text' | 'number' | 'select';
  options?: string[];
  field?: keyof Transaction;
}

interface NewTransaction {
  description: string;
  type: 'Expense' | 'Receivable' | 'Payable';
  amount: number;
  receivedBy: string;
  paidBy: string;
  status: string;
  notes: string;
}

const ExpenseCalculator: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([
    // Expenses
    {
      id: 1,
      description: "Justdial",
      type: "Expense",
      amount: 20626,
      receivedBy: "Justdial",
      paidBy: "Karan + Prabee",
      status: "Paid",
      notes: "Split between all 3 as per equity"
    },
    {
      id: 2,
      description: "Techentia Domain+Hosting",
      type: "Expense",
      amount: 1000,
      receivedBy: "Company",
      paidBy: "Karan + Prabee",
      status: "Paid",
      notes: "Split between all 3 as per equity"
    },
    {
      id: 3,
      description: "Upwork",
      type: "Expense",
      amount: 3500,
      receivedBy: "Upwork",
      paidBy: "Karan",
      status: "Paid",
      notes: "Split 3 ways as per equity"
    },
    {
      id: 4,
      description: "Twitter",
      type: "Expense",
      amount: 4300,
      receivedBy: "Twitter",
      paidBy: "Karan",
      status: "Paid",
      notes: "Split 3 ways as per equity"
    },
    {
      id: 7,
      description: "Ankur Domain + Followers",
      type: "Expense",
      amount: 900,
      receivedBy: "Service Provider",
      paidBy: "Prabee",
      status: "Paid",
      notes: "₹450 domain + ₹450 followers - Split as per equity"
    },
    // Payables
    {
      id: 5,
      description: "Solana Wallet - Priyank",
      type: "Payable",
      amount: 15000,
      receivedBy: "Priyank",
      paidBy: "Pending",
      status: "Due 20 Aug",
      notes: "Future liability as per equity"
    },
    {
      id: 6,
      description: "Designers - Kamya + Sarfaraz",
      type: "Payable",
      amount: 20000,
      receivedBy: "Designers",
      paidBy: "Pending",
      status: "Due 20 Aug",
      notes: "10K each - Future liability as per equity"
    },
    // Receivables - FIXED: Ankur payment should go to Business Account, not Prabee directly
    {
      id: 8,
      description: "Payment from Ankur",
      type: "Receivable",
      amount: 20500,
      receivedBy: "Business Account", // FIXED: Changed from "Prabee" to "Business Account"
      paidBy: "Ankur",
      status: "Partial (₹9,000 Paid)",
      notes: "₹11,500 pending - Payment goes to business account and distributed per equity"
    },
    {
      id: 9,
      description: "Client Project Payment",
      type: "Receivable",
      amount: 7500,
      receivedBy: "Team",
      paidBy: "Client",
      status: "Pending",
      notes: "Will be distributed as per equity when received"
    },
  ]);

  const [newTransaction, setNewTransaction] = useState<NewTransaction>({
    description: '',
    type: 'Expense',
    amount: 0,
    receivedBy: '',
    paidBy: 'Pending',
    status: 'Pending',
    notes: ''
  });

  const equity: Equity = {
    karan: 0.4,
    prabee: 0.4,
    garvit: 0.2
  };

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  // Predefined options for dropdowns
  const paidByOptions = [
    'Pending',
    'Karan',
    'Prabee',
    'Garvit',
    'Karan + Prabee',
    'Karan + Garvit',
    'Prabee + Garvit',
    'All Partners',
    'Business Account',
    'External'
  ];

  const receivedByOptions = [
    'Team',
    'Business Account',
    'Karan',
    'Prabee',
    'Garvit',
    'Company',
    'External Party',
    'Service Provider',
    'Client',
    'Vendor'
  ];

  const statusOptions = [
    'Pending',
    'Paid',
    'Partial',
    'Received',
    'Due',
    'Overdue',
    'Cancelled'
  ];

  const toggleEditMode = (): void => {
    setIsEditMode(!isEditMode);
    setEditingCell(null);
  };

  const saveData = (): void => {
    alert('Data saved successfully!');
    setEditingCell(null);
  };

  const lockAll = (): void => {
    setIsEditMode(false);
    setEditingCell(null);
    setShowAddForm(false);
  };

  const updateTransaction = useCallback((id: number, field: keyof Transaction, value: string | number): void => {
    setTransactions(prevTransactions =>
      prevTransactions.map(tx =>
        tx.id === id ? { ...tx, [field]: value } : tx
      )
    );
  }, []);

  const deleteTransaction = (id: number): void => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prevTransactions =>
        prevTransactions.filter(tx => tx.id !== id)
      );
    }
  };

  const validateTransaction = (transaction: NewTransaction): string | null => {
    if (!transaction.description.trim()) {
      return 'Description is required';
    }
    if (transaction.amount <= 0) {
      return 'Amount must be greater than 0';
    }
    if (!transaction.receivedBy.trim()) {
      return 'Received By is required';
    }
    if (!transaction.paidBy.trim()) {
      return 'Paid By is required';
    }
    return null;
  };

  const addTransaction = (): void => {
    const validationError = validateTransaction(newTransaction);
    if (validationError) {
      alert(validationError);
      return;
    }

    const newId = Math.max(...transactions.map(t => t.id), 0) + 1;
    const transactionToAdd: Transaction = {
      id: newId,
      ...newTransaction,
      amount: Number(newTransaction.amount),
      description: newTransaction.description.trim(),
      receivedBy: newTransaction.receivedBy.trim(),
      paidBy: newTransaction.paidBy.trim(),
      notes: newTransaction.notes.trim()
    };

    setTransactions(prev => [...prev, transactionToAdd]);

    // Reset form
    setNewTransaction({
      description: '',
      type: 'Expense',
      amount: 0,
      receivedBy: '',
      paidBy: 'Pending',
      status: 'Pending',
      notes: ''
    });

    setShowAddForm(false);
    alert('Transaction added successfully!');
  };

  const calculatePersonLiability = (transaction: Transaction, person: string): PersonCalculation => {
    const personKey = person.toLowerCase() as keyof Equity;
    const personEquity = equity[personKey];
    let liability = 0;
    let payment = 0;
    let receivable = 0;

    // Handle expenses - Everyone is liable for their equity share if paid
    if (transaction.type === 'Expense') {
      if (transaction.status === 'Paid' || transaction.status.includes('Paid')) {
        liability = transaction.amount * personEquity;
      }

      // Check who actually paid
      if (transaction.paidBy.toLowerCase().includes(person.toLowerCase())) {
        if (transaction.paidBy.includes('+') || transaction.paidBy === 'All Partners') {
          if (transaction.paidBy === 'All Partners') {
            payment = transaction.amount / 3;
          } else {
            const payers = transaction.paidBy.split('+').map(p => p.trim());
            payment = transaction.amount / payers.length;
          }
        } else {
          // Single person paid
          payment = transaction.amount;
        }
      }
    }

    // Handle receivables - FIXED LOGIC
    else if (transaction.type === 'Receivable') {
      let actualReceived = 0;

      if (transaction.status === 'Paid' || transaction.status.includes('Paid') || transaction.status === 'Received') {
        if (transaction.status.includes('₹')) {
          // Extract amount from status like "Partial (₹9,000 Paid)"
          const match = transaction.status.match(/₹([\d,]+)/);
          actualReceived = match ? parseFloat(match[1].replace(',', '')) : transaction.amount;
        } else if (transaction.status === 'Received' || transaction.status === 'Paid') {
          actualReceived = transaction.amount;
        } else {
          actualReceived = transaction.amount;
        }
      }

      // FIXED: Check who receives the money - Business Account should be distributed per equity
      if (transaction.receivedBy.toLowerCase() === 'team' ||
        transaction.receivedBy.toLowerCase() === 'business account' ||
        transaction.receivedBy.toLowerCase() === 'all partners') {
        // Distributed based on equity
        receivable = actualReceived * personEquity;
      } else if (transaction.receivedBy.toLowerCase() === person.toLowerCase()) {
        // Specific person receives it
        receivable = actualReceived;
      }
    }

    // Handle payables (future liabilities)
    else if (transaction.type === 'Payable') {
      // Future liability based on equity
      liability = transaction.amount * personEquity;

      if (transaction.status === 'Paid' || transaction.status.includes('Paid')) {
        // Check who paid
        if (transaction.paidBy.toLowerCase().includes(person.toLowerCase())) {
          if (transaction.paidBy.includes('+') || transaction.paidBy === 'All Partners') {
            if (transaction.paidBy === 'All Partners') {
              payment = transaction.amount / 3;
            } else {
              const payers = transaction.paidBy.split('+').map(p => p.trim());
              payment = transaction.amount / payers.length;
            }
          } else {
            payment = transaction.amount;
          }
        }
      }
    }

    const net = payment + receivable - liability;
    return { liability, payment, receivable, net };
  };

  const getStatusClass = (status: string): string => {
    if (status.includes('Paid') && !status.includes('Partial') || status === 'Received') return 'text-green-600 bg-green-100';
    if (status === 'Partial' || status.includes('Partial')) return 'text-yellow-600 bg-yellow-100';
    if (status === 'Overdue') return 'text-red-800 bg-red-200';
    if (status === 'Cancelled') return 'text-gray-600 bg-gray-200';
    return 'text-red-600 bg-red-100';
  };

  const calculateBalances = (): Balances => {
    const balances: Balances = {
      karan: { paid: 0, liability: 0, receivables: 0, totalNet: 0 },
      prabee: { paid: 0, liability: 0, receivables: 0, totalNet: 0 },
      garvit: { paid: 0, liability: 0, receivables: 0, totalNet: 0 }
    };

    transactions.forEach(tx => {
      (['karan', 'prabee', 'garvit'] as const).forEach(person => {
        const calc = calculatePersonLiability(tx, person);
        balances[person].paid += calc.payment;
        balances[person].liability += calc.liability;
        balances[person].receivables += calc.receivable;
        balances[person].totalNet += calc.net;
      });
    });

    return balances;
  };

  const balances = calculateBalances();

  const EditableCell: React.FC<EditableCellProps> = ({ value, onSave, type = 'text', options = [], field }) => {
    const [editValue, setEditValue] = useState<string>(value.toString());
    const [isCustom, setIsCustom] = useState<boolean>(false);

    const handleSave = (): void => {
      const finalValue = type === 'number' ? parseFloat(editValue) || 0 : editValue.trim();
      onSave(finalValue);
      setEditingCell(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
    };

    // Get appropriate options based on field
    const getFieldOptions = () => {
      if (field === 'paidBy') return paidByOptions;
      if (field === 'receivedBy') return receivedByOptions;
      if (field === 'status') return statusOptions;
      if (field === 'type') return ['Expense', 'Receivable', 'Payable'];
      return options;
    };

    if (type === 'select') {
      const fieldOptions = getFieldOptions();
      const hasCurrentValue = fieldOptions.includes(editValue);

      if (isCustom || !hasCurrentValue) {
        return (
          <div className="flex gap-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyPress}
              className="flex-1 p-1 border border-black rounded text-sm bg-white"
              autoFocus
              placeholder="Enter custom value"
            />
            <button
              onClick={() => { setIsCustom(false); setEditValue(fieldOptions[0]); }}
              className="p-1 text-xs bg-gray-200 rounded"
              title="Back to dropdown"
            >
              ↩
            </button>
          </div>
        );
      }

      return (
        <select
          value={editValue}
          onChange={(e) => {
            if (e.target.value === 'custom') {
              setIsCustom(true);
              setEditValue('');
            } else {
              setEditValue(e.target.value);
            }
          }}
          onBlur={() => !isCustom && handleSave()}
          onKeyDown={handleKeyPress}
          className="w-full p-1 border border-black rounded text-sm bg-white"
          autoFocus
        >
          {fieldOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
          <option value="custom">🖊️ Custom...</option>
        </select>
      );
    }

    return (
      <input
        type={type === 'number' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyPress}
        className="w-full p-1 border border-black rounded text-sm bg-white"
        autoFocus
        min={type === 'number' ? "0" : undefined}
        step={type === 'number' ? "0.01" : undefined}
      />
    );
  };

  const handleCellClick = (txId: number, field: keyof Transaction, currentValue: string | number): void => {
    if (!isEditMode) return;
    setEditingCell({ txId, field, currentValue });
  };

  const formatCurrency = (amount: number): string => {
    return `₹{amount.toLocaleString()}`;
  };

  const getNetBalanceClass = (net: number): string => {
    if (net > 0) return 'bg-green-200';
    if (net < 0) return 'bg-red-200';
    return 'bg-gray-100';
  };

  const getLiabilityClass = (liability: number): string => {
    return liability > 0 ? 'bg-red-100' : 'bg-gray-50';
  };

  const filterTransactionsByType = (type: 'Expense' | 'Receivable' | 'Payable') => {
    return transactions.filter(tx => tx.type === type);
  };

  // FIXED: Optimized form handlers to prevent focus loss
  const handleNewTransactionChange = useCallback((field: keyof NewTransaction, value: any) => {
    setNewTransaction(prev => ({ ...prev, [field]: value }));
  }, []);

  const AddTransactionForm = () => (
    <div className="bg-white border-2 border-black rounded-lg p-6 mb-8">
      <h3 className="text-2xl font-bold text-black mb-4">➕ Add New Transaction</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-black mb-1">Description *</label>
          <input
            type="text"
            value={newTransaction.description}
            onChange={(e) => handleNewTransactionChange('description', e.target.value)}
            className="w-full p-2 border-2 border-black rounded bg-white"
            placeholder="Enter transaction description"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-black mb-1">Type *</label>
          <select
            value={newTransaction.type}
            onChange={(e) => handleNewTransactionChange('type', e.target.value as 'Expense' | 'Receivable' | 'Payable')}
            className="w-full p-2 border-2 border-black rounded bg-white"
          >
            <option value="Expense">💳 Expense</option>
            <option value="Receivable">💰 Receivable</option>
            <option value="Payable">📋 Payable</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-black mb-1">Amount *</label>
          <input
            type="number"
            value={newTransaction.amount || ''}
            onChange={(e) => handleNewTransactionChange('amount', parseFloat(e.target.value) || 0)}
            className="w-full p-2 border-2 border-black rounded bg-white"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-black mb-1">Received By *</label>
          <select
            value={newTransaction.receivedBy}
            onChange={(e) => handleNewTransactionChange('receivedBy', e.target.value)}
            className="w-full p-2 border-2 border-black rounded bg-white"
          >
            <option value="">Select who received...</option>
            {receivedByOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {newTransaction.receivedBy === '' && (
            <input
              type="text"
              placeholder="Or type custom recipient"
              onChange={(e) => handleNewTransactionChange('receivedBy', e.target.value)}
              className="w-full p-2 border border-gray-400 rounded bg-white mt-2 text-sm"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-black mb-1">Paid By *</label>
          <select
            value={newTransaction.paidBy}
            onChange={(e) => handleNewTransactionChange('paidBy', e.target.value)}
            className="w-full p-2 border-2 border-black rounded bg-white"
          >
            {paidByOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-black mb-1">Status</label>
          <select
            value={newTransaction.status}
            onChange={(e) => handleNewTransactionChange('status', e.target.value)}
            className="w-full p-2 border-2 border-black rounded bg-white"
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-black mb-1">Notes</label>
          <textarea
            value={newTransaction.notes}
            onChange={(e) => handleNewTransactionChange('notes', e.target.value)}
            className="w-full p-2 border-2 border-black rounded bg-white"
            rows={2}
            placeholder="Additional notes or details..."
            maxLength={500}
          />
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <button
          onClick={addTransaction}
          className="px-6 py-2 bg-black text-white rounded font-bold transition-all border-2 border-black hover:bg-white hover:text-black flex items-center gap-2"
        >
          <Save size={16} />
          Add Transaction
        </button>
        <button
          onClick={() => setShowAddForm(false)}
          className="px-6 py-2 bg-white text-black rounded font-bold transition-all border-2 border-black hover:bg-black hover:text-white flex items-center gap-2"
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </div>
  );

  const renderTransactionTable = (transactionType: 'Expense' | 'Receivable' | 'Payable') => {
    const filteredTransactions = filterTransactionsByType(transactionType);

    return (
      <div className="bg-white border-2 border-black rounded-lg p-6 mb-8 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-black">
            {transactionType === 'Expense' ? '💳 Expenses' :
              transactionType === 'Receivable' ? '💰 Receivables' : '📋 Payables'}
          </h3>
          <span className="text-sm text-gray-600 font-semibold">
            {filteredTransactions.length} transactions
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-black">
                <th rowSpan={2} className="border-2 border-black p-3 bg-gray-200 font-bold">Actions</th>
                <th rowSpan={2} className="border-2 border-black p-3 bg-gray-200 font-bold">Description</th>
                <th rowSpan={2} className="border-2 border-black p-3 bg-gray-200 font-bold">Amount</th>
                <th rowSpan={2} className="border-2 border-black p-3 bg-gray-200 font-bold">Received By</th>
                <th rowSpan={2} className="border-2 border-black p-3 bg-gray-200 font-bold">Paid By</th>
                <th rowSpan={2} className="border-2 border-black p-3 bg-gray-200 font-bold">Status</th>
                <th colSpan={3} className="border-2 border-black p-3 bg-gray-200 font-bold">Individual Liability/Share</th>
                <th colSpan={3} className="border-2 border-black p-3 bg-gray-200 font-bold">Net Balance Impact</th>
                <th rowSpan={2} className="border-2 border-black p-3 bg-gray-200 font-bold">Notes</th>
              </tr>
              <tr className="text-black">
                <th className="border-2 border-black p-3 bg-gray-100 font-semibold">Karan (40%)</th>
                <th className="border-2 border-black p-3 bg-gray-100 font-semibold">Prabee (40%)</th>
                <th className="border-2 border-black p-3 bg-gray-100 font-semibold">Garvit (20%)</th>
                <th className="border-2 border-black p-3 bg-gray-100 font-semibold">Karan Net</th>
                <th className="border-2 border-black p-3 bg-gray-100 font-semibold">Prabee Net</th>
                <th className="border-2 border-black p-3 bg-gray-100 font-semibold">Garvit Net</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const karanCalc = calculatePersonLiability(tx, 'Karan');
                const prabeeCalc = calculatePersonLiability(tx, 'Prabee');
                const garvitCalc = calculatePersonLiability(tx, 'Garvit');

                return (
                  <tr key={tx.id} className="text-black">
                    <td className="border-2 border-black p-3 bg-white">
                      <div className="flex gap-1">
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Delete Transaction"
                          disabled={!isEditMode}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                    <td
                      className={`border-2 border-black p-3 bg-white font-medium ₹{isEditMode ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => handleCellClick(tx.id, 'description', tx.description)}
                    >
                      {editingCell?.txId === tx.id && editingCell?.field === 'description' ? (
                        <EditableCell
                          value={tx.description}
                          onSave={(value) => updateTransaction(tx.id, 'description', value)}
                        />
                      ) : tx.description}
                    </td>
                    <td
                      className={`border-2 border-black p-3 bg-white font-semibold  ₹{isEditMode ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => handleCellClick(tx.id, 'amount', tx.amount)}
                    >
                      {editingCell?.txId === tx.id && editingCell?.field === 'amount' ? (
                        <EditableCell
                          value={tx.amount}
                          onSave={(value) => updateTransaction(tx.id, 'amount', parseFloat(value.toString()) || 0)}
                          type="number"
                        />
                      ) : formatCurrency(tx.amount)}
                    </td>
                    <td
                      className={`border-2 border-black p-3 bg-white  ₹{isEditMode ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => handleCellClick(tx.id, 'receivedBy', tx.receivedBy)}
                    >
                      {editingCell?.txId === tx.id && editingCell?.field === 'receivedBy' ? (
                        <EditableCell
                          value={tx.receivedBy}
                          onSave={(value) => updateTransaction(tx.id, 'receivedBy', value)}
                          type="select"
                          field="receivedBy"
                        />
                      ) : tx.receivedBy}
                    </td>
                    <td
                      className={`border-2 border-black p-3 bg-white  ₹{isEditMode ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => handleCellClick(tx.id, 'paidBy', tx.paidBy)}
                    >
                      {editingCell?.txId === tx.id && editingCell?.field === 'paidBy' ? (
                        <EditableCell
                          value={tx.paidBy}
                          onSave={(value) => updateTransaction(tx.id, 'paidBy', value)}
                          type="select"
                          field="paidBy"
                        />
                      ) : tx.paidBy}
                    </td>
                    <td
                      className={`border-2 border-black p-3 bg-white  ₹{isEditMode ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => handleCellClick(tx.id, 'status', tx.status)}
                    >
                      {editingCell?.txId === tx.id && editingCell?.field === 'status' ? (
                        <EditableCell
                          value={tx.status}
                          onSave={(value) => updateTransaction(tx.id, 'status', value)}
                          type="select"
                          field="status"
                        />
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border  ₹{getStatusClass(tx.status)}`}>
                          {tx.status}
                        </span>
                      )}
                    </td>
                    <td className={`border-2 border-black p-3 font-semibold  ₹{getLiabilityClass(karanCalc.liability)}`}>
                      {formatCurrency(Math.abs(karanCalc.liability))}
                    </td>
                    <td className={`border-2 border-black p-3 font-semibold  ₹{getLiabilityClass(prabeeCalc.liability)}`}>
                      {formatCurrency(Math.abs(prabeeCalc.liability))}
                    </td>
                    <td className={`border-2 border-black p-3 font-semibold  ₹{getLiabilityClass(garvitCalc.liability)}`}>
                      {formatCurrency(Math.abs(garvitCalc.liability))}
                    </td>
                    <td className={`border-2 border-black p-3 font-bold  ₹{getNetBalanceClass(karanCalc.net)}`}>
                      {karanCalc.net >= 0 ? '+' : ''}{formatCurrency(Math.abs(karanCalc.net))}
                    </td>
                    <td className={`border-2 border-black p-3 font-bold  ₹{getNetBalanceClass(prabeeCalc.net)}`}>
                      {prabeeCalc.net >= 0 ? '+' : ''}{formatCurrency(Math.abs(prabeeCalc.net))}
                    </td>
                    <td className={`border-2 border-black p-3 font-bold  ₹{getNetBalanceClass(garvitCalc.net)}`}>
                      {garvitCalc.net >= 0 ? '+' : ''}{formatCurrency(Math.abs(garvitCalc.net))}
                    </td>
                    <td
                      className={`border-2 border-black p-3 bg-white text-sm  ₹{isEditMode ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => handleCellClick(tx.id, 'notes', tx.notes)}
                    >
                      {editingCell?.txId === tx.id && editingCell?.field === 'notes' ? (
                        <EditableCell
                          value={tx.notes}
                          onSave={(value) => updateTransaction(tx.id, 'notes', value)}
                        />
                      ) : (
                        <div className="max-w-xs truncate" title={tx.notes}>
                          {tx.notes}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6ede7' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center text-white font-bold text-2xl">
              T
            </div>
            <h1 className="text-4xl font-bold text-black">Techentia Expense Calculator</h1>
          </div>
          <p className="text-gray-700 text-lg">Advanced Financial Management System</p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <button
            onClick={toggleEditMode}
            className={`px-6 py-3 rounded-full font-bold transition-all border-2 border-black flex items-center gap-2  ₹{isEditMode
                ? 'bg-black text-white hover:bg-white hover:text-black'
                : 'bg-white text-black hover:bg-black hover:text-white'
              }`}
          >
            <Edit size={16} />
            {isEditMode ? '🔒 Disable Editing' : '🔓 Enable Editing'}
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-green-600 text-white rounded-full font-bold transition-all border-2 border-green-600 hover:bg-white hover:text-green-600 flex items-center gap-2"
          >
            <Plus size={16} />
            Add Transaction
          </button>

          <button
            onClick={saveData}
            className="px-6 py-3 bg-black text-white rounded-full font-bold transition-all border-2 border-black hover:bg-white hover:text-black flex items-center gap-2"
          >
            <Save size={16} />
            Save Changes
          </button>

          <button
            onClick={lockAll}
            className="px-6 py-3 bg-white text-black rounded-full font-bold transition-all border-2 border-black hover:bg-black hover:text-white flex items-center gap-2"
          >
            <X size={16} />
            Lock All
          </button>
        </div>

        {/* Add Transaction Form */}
        {showAddForm && <AddTransactionForm />}

        {/* Equity Distribution */}
        <div className="bg-white border-2 border-black rounded-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-black mb-4">🎯 Equity Distribution</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center bg-gray-100 border-2 border-black rounded-lg p-4">
              <h4 className="text-lg font-bold text-black mb-2">Karan</h4>
              <div className="text-4xl font-bold text-black">40%</div>
            </div>
            <div className="text-center bg-gray-100 border-2 border-black rounded-lg p-4">
              <h4 className="text-lg font-bold text-black mb-2">Prabee</h4>
              <div className="text-4xl font-bold text-black">40%</div>
            </div>
            <div className="text-center bg-gray-100 border-2 border-black rounded-lg p-4">
              <h4 className="text-lg font-bold text-black mb-2">Garvit</h4>
              <div className="text-4xl font-bold text-black">20%</div>
            </div>
          </div>
        </div>

        {/* Separate Tables for Each Transaction Type */}
        {renderTransactionTable('Expense')}
        {renderTransactionTable('Receivable')}
        {renderTransactionTable('Payable')}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {(Object.entries(balances) as [keyof Balances, PersonBalance][]).map(([person, data]) => (
            <div key={person} className="bg-white border-2 border-black rounded-lg p-6">
              <div className="text-2xl font-bold text-black mb-4 capitalize">{person}</div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Paid Out:</span>
                  <span className={`font-bold  ₹{data.paid > 0 ? 'text-green-600' : 'text-black'}`}>
                    {formatCurrency(data.paid)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Liability:</span>
                  <span className={`font-bold  ₹{data.liability > 0 ? 'text-red-600' : 'text-black'}`}>
                    {formatCurrency(data.liability)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Receivables:</span>
                  <span className={`font-bold  ₹{data.receivables > 0 ? 'text-green-600' : 'text-black'}`}>
                    {formatCurrency(data.receivables)}
                  </span>
                </div>

                <div className={`p-4 rounded-lg text-center border-2 border-black  ₹{data.totalNet >= 0 ? 'bg-green-200' : 'bg-red-200'}`}>
                  <div className={`text-lg font-bold  ₹{data.totalNet >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                    Net Balance: {data.totalNet >= 0 ? '+' : ''}{formatCurrency(Math.abs(data.totalNet))}
                  </div>
                  <div className="text-sm text-gray-700 mt-1 font-semibold">
                    {data.totalNet >= 0 ? 'Should Receive' : 'Should Pay'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpenseCalculator;