import  { useState, useEffect,  } from 'react';
import type { FormEvent } from 'react';
import { db } from '../Firebase/Config';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore';
import { Trash2, Edit3,  X,  } from 'lucide-react';

// Interfaces
interface Partner {
  id: string;
  name: string;
  equity: number; // Changed from percentage to equity for consistency
}


interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  paidBy: string;
  receivedBy: string;
  notes: string;
  date: any;
  createdAt: any;
}

interface PersonCalculation {
  liability: number;
  net: number;
  share: number;
}

interface Message {
  text: string;
  type: 'success' | 'error';
}

interface EditingCell {
  txId: string;
  field: string;
  value: any;
}

type TransactionType = 'Expense' | 'Receivable' | 'Payable';
type TransactionStatus = 'Pending' | 'Completed' | 'Cancelled';
type ActiveTab =  'transactions' | 'partners';

export default function TransactionTable(): JSX.Element {
  // Common state
  const [activeTab, setActiveTab] = useState<ActiveTab>('transactions');
  const [transactionReceivedBy, setTransactionReceivedBy] = useState('');
const [customPartnerName, setCustomPartnerName] = useState('');
const [showCustomInput, setShowCustomInput] = useState(false);

  
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  // Data state
  const [partners, setPartners] = useState<Partner[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Form state for expenses
  

  // Form state for transactions
  const [transactionDescription, setTransactionDescription] = useState<string>('');
  const [transactionAmount, setTransactionAmount] = useState<string>('');
  const [transactionType, setTransactionType] = useState<TransactionType>('Expense');
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('Pending');
  const [transactionPaidBy, setTransactionPaidBy] = useState<string>('');
 
  const [transactionNotes, setTransactionNotes] = useState<string>('');

  // Form state for partners
  const [partnerName, setPartnerName] = useState<string>('');
  const [partnerEquity, setPartnerEquity] = useState<string>('');

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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

 



  const calculatePersonLiability = (transaction: Transaction, partnerId: string): PersonCalculation => {
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

  // CRUD operations for Partners
  const handlePartnerSubmit = (e: FormEvent) => {
  e.preventDefault();

  const newEquity = parseFloat(partnerEquity);
  if (isNaN(newEquity) || newEquity <= 0 || newEquity > 1) {
    alert('Equity must be between 0 and 1');
    return;
  }

  const totalEquity = partners.reduce((sum, p) => sum + p.equity, 0);

  let updatedPartners = [...partners];

  if (totalEquity >= 1) {
    // Reduce existing partners' equity proportionally
    updatedPartners = updatedPartners.map((p) => ({
      ...p,
      equity: p.equity * (1 - newEquity),
    }));
  } else if (totalEquity + newEquity > 1) {
    alert(`Only ${(1 - totalEquity).toFixed(2)} equity left to assign`);
    return;
  }

  const newPartner = {
    id: Date.now().toString(),
    name: partnerName,
    equity: newEquity,
  };

  setPartners([...updatedPartners, newPartner]);
  setPartnerName('');
  setPartnerEquity('');
};


  const handleTransactionSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!transactionDescription.trim() || !transactionAmount.trim()) {
        throw new Error('Description and amount are required');
      }

      const amountNum = parseFloat(transactionAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      const transactionData: Omit<Transaction, 'id'> = {
        description: transactionDescription.trim(),
        amount: amountNum,
        type: transactionType,
        status: transactionStatus,
        paidBy: transactionPaidBy.trim(),
        receivedBy: transactionReceivedBy.trim(),
        notes: transactionNotes.trim(),
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'transactions'), transactionData);

      showMessage('Transaction added successfully!', 'success');
      setTransactionDescription('');
      setTransactionAmount('');
      setTransactionPaidBy('');
      setTransactionReceivedBy('');
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
        await deleteDoc(doc(db, 'partners', id));
        showMessage('Partner deleted successfully!', 'success');
      } catch (error) {
        showMessage('Failed to delete partner', 'error');
      }
    }
  };

 
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

  // Update operations
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

  const formatDate = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString();
  };

  const getTotalsByType = () => {
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

  const totals = getTotalsByType();

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white shadow rounded-lg">
      {/* Header with Edit Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Management</h1>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors  ₹{
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
        <div className="flex border-b">
          {(['partners','transactions'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize  ₹{
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
          className={`mb-4 p-3 rounded-lg  ₹{
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
          <div>
            <h2 className="text-xl font-semibold mb-4">Add New Partner</h2>
            <form onSubmit={handlePartnerSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Partner Name:</label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter partner name"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Equity (0-1):</label>
                <input
                  type="number"
                  value={partnerEquity}
                  onChange={(e) => setPartnerEquity(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="e.g. 0.5 for 50%"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Adding...' : 'Add Partner'}
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Partners ({partners.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {partners.length === 0 ? (
                <p className="text-gray-500 italic">No partners added yet.</p>
              ) : (
                partners.map((partner) => (
                  <div key={partner.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                    <div>
                      <strong className="text-gray-800">{partner.name}</strong>
                      <span className="ml-2 text-blue-600 font-medium">
                        {(partner.equity * 100).toFixed(1)}%
                      </span>
                    </div>
                    {isEditMode && (
                      <button
                        onClick={() => handleDeletePartner(partner.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            {partners.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Total Equity: {(partners.reduce((sum, p) => sum + p.equity, 0) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      
      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Add Transaction Form */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Add New Transaction</h2>
            <form onSubmit={handleTransactionSubmit} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-1">Description:</label>
                <input
                  type="text"
                  value={transactionDescription}
                  onChange={(e) => setTransactionDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Type:</label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Expense">Expense</option>
                  <option value="Receivable">Receivable</option>
                  <option value="Payable">Payable</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Status:</label>
                <select
                  value={transactionStatus}
                  onChange={(e) => setTransactionStatus(e.target.value as TransactionStatus)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Paid By:</label>
                <div className="w-full border rounded-lg p-4 bg-white shadow-sm">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Select Partner(s)
  </label>

  <div className="space-y-2">
  {partners.map((partner) => (
    <label
      key={partner.id}
      className="flex items-center space-x-2 text-gray-800"
    >
      <input
        type="checkbox"
        value={partner.name}
        checked={transactionPaidBy.includes(partner.name)}
        onChange={(e) => {
  const { value, checked } = e.target;
  setTransactionPaidBy((prev) => {
    if (checked) {
      return prev.includes(value) ? prev : [...prev, value];
    } else {
      return prev.filter((name) => name !== value);
    }
  });
}}
        className="form-checkbox h-4 w-4 text-blue-600"
      />
      <span>{partner.name}</span>
    </label>
  ))}
</div>


</div>

              </div>

              <div>
                <label className="block font-medium mb-1">Received By:</label>
                <select
  value={transactionReceivedBy}
  onChange={(e) => {
    const value = e.target.value;
    setTransactionReceivedBy(value);
    if (value === "custom") setShowCustomInput(true);
    else setShowCustomInput(false);
  }}
  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  required
>
  <option value="">Select partner</option>
  {partners.map((partner) => (
    <option key={partner.id} value={partner.name}>
      {partner.name}
    </option>
  ))}
  <option value="custom">Other (Custom)</option>
</select>

{showCustomInput && (
  <input
    type="text"
    value={customPartnerName}
    onChange={(e) => setCustomPartnerName(e.target.value)}
    placeholder="Enter custom partner name"
    className="mt-2 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
)}

              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block font-medium mb-1">Notes:</label>
                <textarea
                  value={transactionNotes}
                  onChange={(e) => setTransactionNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes"
                  rows={2}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={loading || partners.length === 0}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Adding...' : 'Add Transaction'}
                </button>
                {partners.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">Please add partners first</p>
                )}
              </div>
            </form>
          </div>

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
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Delete Transaction"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                        
                        <td
                          className={`px-4 py-3 font-medium  ₹{isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
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
                              className="w-full px-2 py-1 border rounded"
                              autoFocus
                            />
                          ) : (
                            <div className="line-clamp-1">{transaction.description}</div>
                          )}
                        </td>
                        
                        <td
                          className={`px-4 py-3 font-semibold text-gray-900  ₹{isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
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
                              className="w-full px-2 py-1 border rounded"
                              step="0.01"
                              min="0"
                              autoFocus
                            />
                          ) : (
                            formatCurrency(transaction.amount)
                          )}
                        </td>
                        
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium  ₹{
                            transaction.type === 'Expense' ? 'bg-blue-100 text-blue-800' :
                            transaction.type === 'Receivable' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        
                        <td
                          className={`px-4 py-3  ₹{isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                          onClick={() => handleCellClick(transaction.id, 'status', transaction.status)}
                        >
                          {editingCell?.txId === transaction.id && editingCell?.field === 'status' ? (
                            <select
                              defaultValue={transaction.status}
                              onBlur={(e) => handleUpdateTransaction(transaction.id, 'status', e.target.value)}
                              onChange={(e) => handleUpdateTransaction(transaction.id, 'status', e.target.value)}
                              className="w-full px-2 py-1 border rounded"
                              autoFocus
                            >
                              <option value="Pending">Pending</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border  ₹{getStatusClass(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          )}
                        </td>
                        
                        <td
                          className={`px-4 py-3  ₹{isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                          onClick={() => handleCellClick(transaction.id, 'paidBy', transaction.paidBy)}
                          title={transaction.paidBy}
                        >
                          {editingCell?.txId === transaction.id && editingCell?.field === 'paidBy' ? (
                            <select
                              defaultValue={transaction.paidBy}
                              onBlur={(e) => handleUpdateTransaction(transaction.id, 'paidBy', e.target.value)}
                              onChange={(e) => handleUpdateTransaction(transaction.id, 'paidBy', e.target.value)}
                              className="w-full px-2 py-1 border rounded"
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
                            <div className="line-clamp-1">{transaction.paidBy}</div>
                          )}
                        </td>
                        
                        <td
                          className={`px-4 py-3  ₹{isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                          onClick={() => handleCellClick(transaction.id, 'receivedBy', transaction.receivedBy)}
                          title={transaction.receivedBy}
                        >
                          {editingCell?.txId === transaction.id && editingCell?.field === 'receivedBy' ? (
                            <select
                              defaultValue={transaction.receivedBy}
                              onBlur={(e) => handleUpdateTransaction(transaction.id, 'receivedBy', e.target.value)}
                              onChange={(e) => handleUpdateTransaction(transaction.id, 'receivedBy', e.target.value)}
                              className="w-full px-2 py-1 border rounded"
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
                            <div className="line-clamp-1">{transaction.receivedBy}</div>
                          )}
                        </td>
                        
                        {partners.map((partner) => {
                          const calc = calculatePersonLiability(transaction, partner.id);
                           
                          return (
                            <td key={partner.id} className={`px-4 py-3 font-semibold text-center  ₹{getNetBalanceClass(displayValue)}`}>
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
                          className={`px-4 py-3 text-sm text-gray-600  ₹{isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''}`}
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
                              className="w-full px-2 py-1 border rounded resize-none"
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

          {/* Partner Balance Summary */}
          {partners.length > 0 && transactions.length > 0 && (
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
                        const calc = calculatePersonLiability(tx, partner.id);
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
                          <td className={`px-4 py-3 font-semibold  ₹{getNetBalanceClass(totalExpenseNet)}`}>
                            {totalExpenseNet >= 0 ? '+' : ''}{formatCurrency(totalExpenseNet)}
                          </td>
                          <td className={`px-4 py-3 font-semibold  ₹{getNetBalanceClass(totalReceivableNet)}`}>
                            {totalReceivableNet >= 0 ? '+' : ''}{formatCurrency(totalReceivableNet)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-red-700">
                            {formatCurrency(totalPayableLiability)}
                          </td>
                          <td className={`px-4 py-3 font-bold text-lg {getNetBalanceClass(netBalance)}`}>
                            {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}