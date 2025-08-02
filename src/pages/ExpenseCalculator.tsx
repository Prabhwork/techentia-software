import React, { useState, useCallback } from 'react';
import { Plus, Edit, Save, X, Users, Calculator, FileText, TrendingUp } from 'lucide-react';
import type { Partner, Transaction, NewTransaction, NewPartner, EditingCell, PersonCalculation, PersonBalance } from '../types';
import TransactionTable from '../components/TransactionTable';
import PartnersTab from '../components/PartnersTab';
import ResultsTab from '../components/ResultsTab';

const oldTransactions: Transaction[] = [
    {
        id: 1,
        description: "Justdial",
        type: "Expense",
        amount: 20626,
        receivedBy: "Justdial",
        paidBy: "Karan + Prabee",
        status: "Paid",
        notes: "Split between all partners as per equity"
    },
    {
        id: 2,
        description: "Domain+Hosting",
        type: "Expense",
        amount: 1000,
        receivedBy: "Company",
        paidBy: "Karan + Prabee",
        status: "Paid",
        notes: "Split between all partners as per equity"
    },
    {
        id: 3,
        description: "Upwork",
        type: "Expense",
        amount: 3500,
        receivedBy: "Upwork",
        paidBy: "Karan",
        status: "Paid",
        notes: "Split as per equity"
    },
    {
        id: 4,
        description: "Twitter",
        type: "Expense",
        amount: 4300,
        receivedBy: "Twitter",
        paidBy: "Karan",
        status: "Paid",
        notes: "Split as per equity"
    },
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
    {
        id: 7,
        description: "Payment from Ankur",
        type: "Receivable",
        amount: 37000,
        receivedBy: "Business Account",
        paidBy: "Ankur",
        status: "Partial (₹15,000 Paid)",
        notes: "₹22,000 pending - Distributed per equity"
    },
    {
        id: 8,
        description: "Client Project Payment",
        type: "Receivable",
        amount: 7500,
        receivedBy: "Team",
        paidBy: "Client",
        status: "Pending",
        notes: "Will be distributed as per equity when received"
    }
] as Transaction[]

const ExpenseCalculator: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'all' | 'expenses' | 'receivables' | 'payables' | 'partners' | 'results'>('all');
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [showAddForm, setShowAddForm] = useState<boolean>(false);

    const [partners, setPartners] = useState<Partner[]>([
        { id: '1', name: 'Karan', equity: 0.4 },
        { id: '2', name: 'Prabee', equity: 0.4 },
        { id: '3', name: 'Garvit', equity: 0.2 }
    ]);

    const [transactions, setTransactions] = useState<Transaction[]>(oldTransactions);

    const [newTransaction, setNewTransaction] = useState<NewTransaction>({
        description: '',
        type: 'Expense',
        amount: 0,
        receivedBy: '',
        paidBy: 'Pending',
        status: 'Pending',
        notes: ''
    });

    const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

    // Helper function to redistribute equity among remaining partners
    const redistributeEquity = (remainingPartners: Partner[], removedEquity: number): Partner[] => {
        if (remainingPartners.length === 0) return remainingPartners;

        const totalCurrentEquity = remainingPartners.reduce((sum, p) => sum + p.equity, 0);

        return remainingPartners.map(partner => ({
            ...partner,
            equity: partner.equity + (partner.equity / totalCurrentEquity) * removedEquity
        }));
    };

    // Helper function to adjust equity when adding a new partner
    const adjustEquityForNewPartner = (existingPartners: Partner[], newPartnerEquity: number): Partner[] => {
        if (newPartnerEquity === 0) {
            // Auto-calculate equity: new partner gets equal share
            const equalShare = 1 / (existingPartners.length + 1);
            const adjustedPartners = existingPartners.map(partner => ({
                ...partner,
                equity: equalShare
            }));
            return adjustedPartners;
        } else {
            // Proportionally reduce existing partners' equity
            const totalCurrentEquity = existingPartners.reduce((sum, p) => sum + p.equity, 0);
            const reductionRatio = (totalCurrentEquity - newPartnerEquity) / totalCurrentEquity;

            return existingPartners.map(partner => ({
                ...partner,
                equity: partner.equity * reductionRatio
            }));
        }
    };

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

    const addTransaction = (): void => {
        if (!newTransaction.description.trim() || newTransaction.amount <= 0) {
            alert('Please fill in required fields');
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

    const addPartner = (newPartner: NewPartner): void => {
        const adjustedExistingPartners = adjustEquityForNewPartner(partners, newPartner.equity);
        const newId = (Math.max(...partners.map(p => parseInt(p.id)), 0) + 1).toString();

        const finalEquity = newPartner.equity || (1 / (partners.length + 1));

        const partnerToAdd: Partner = {
            id: newId,
            name: newPartner.name.trim(),
            equity: finalEquity
        };

        setPartners([...adjustedExistingPartners, partnerToAdd]);
        alert('Partner added successfully! Equity has been automatically adjusted.');
    };

    const deletePartner = (id: string): void => {
        const partnerToDelete = partners.find(p => p.id === id);
        if (!partnerToDelete) return;

        const remainingPartners = partners.filter(p => p.id !== id);
        const redistributedPartners = redistributeEquity(remainingPartners, partnerToDelete.equity);

        setPartners(redistributedPartners);
        alert('Partner deleted successfully! Equity has been redistributed among remaining partners.');
    };

    const calculatePersonLiability = (transaction: Transaction, partnerId: string): PersonCalculation => {
        const partner = partners.find(p => p.id === partnerId);
        if (!partner) return { liability: 0, payment: 0, receivable: 0, net: 0 };

        const personEquity = partner.equity;
        let liability = 0;
        let payment = 0;
        let receivable = 0;

        if (transaction.type === 'Expense') {
            if (transaction.status === 'Paid' || transaction.status.includes('Paid')) {
                liability = transaction.amount * personEquity;
            }

            if (transaction.paidBy.toLowerCase().includes(partner.name.toLowerCase())) {
                if (transaction.paidBy.includes('+') || transaction.paidBy === 'All Partners') {
                    const payers = transaction.paidBy.split('+').map(p => p.trim());
                    payment = transaction.amount / payers.length;
                } else {
                    payment = transaction.amount;
                }
            }
        } else if (transaction.type === 'Receivable') {
            let actualReceived = 0;

            if (transaction.status === 'Paid' || transaction.status.includes('Paid') || transaction.status === 'Received') {
                if (transaction.status.includes('₹')) {
                    const match = transaction.status.match(/₹([\d,]+)/);
                    actualReceived = match ? parseFloat(match[1].replace(',', '')) : transaction.amount;
                } else {
                    actualReceived = transaction.amount;
                }
            }

            if (transaction.receivedBy.toLowerCase() === 'team' ||
                transaction.receivedBy.toLowerCase() === 'business account' ||
                transaction.receivedBy.toLowerCase() === 'all partners') {
                receivable = actualReceived * personEquity;
            } else if (transaction.receivedBy.toLowerCase() === partner.name.toLowerCase()) {
                receivable = actualReceived;
            }
        } else if (transaction.type === 'Payable') {
            liability = transaction.amount * personEquity;

            if (transaction.status === 'Paid' || transaction.status.includes('Paid')) {
                if (transaction.paidBy.toLowerCase().includes(partner.name.toLowerCase())) {
                    if (transaction.paidBy.includes('+') || transaction.paidBy === 'All Partners') {
                        const payers = transaction.paidBy.split('+').map(p => p.trim());
                        payment = transaction.amount / payers.length;
                    } else {
                        payment = transaction.amount;
                    }
                }
            }
        }

        const net = payment + receivable - liability;
        return { liability, payment, receivable, net };
    };

    const calculateBalances = (): Record<string, PersonBalance> => {
        const balances: Record<string, PersonBalance> = {};

        partners.forEach(partner => {
            balances[partner.id] = { paid: 0, liability: 0, receivables: 0, totalNet: 0 };
        });

        transactions.forEach(tx => {
            partners.forEach(partner => {
                const calc = calculatePersonLiability(tx, partner.id);
                balances[partner.id].paid += calc.payment;
                balances[partner.id].liability += calc.liability;
                balances[partner.id].receivables += calc.receivable;
                balances[partner.id].totalNet += calc.net;
            });
        });

        return balances;
    };

    const balances = calculateBalances();

    const handleCellClick = (txId: number, field: keyof Transaction, currentValue: string | number): void => {
        if (!isEditMode) return;
        setEditingCell({ txId, field, currentValue });
    };

    const formatCurrency = (amount: number): string => {
        return `₹${Math.abs(amount).toLocaleString()}`;
    };

    const getStatusClass = (status: string): string => {
        if (status.includes('Paid') && !status.includes('Partial') || status === 'Received')
            return 'text-green-700 bg-green-100 border-green-200';
        if (status === 'Partial' || status.includes('Partial'))
            return 'text-yellow-700 bg-yellow-100 border-yellow-200';
        if (status === 'Overdue')
            return 'text-red-700 bg-red-100 border-red-200';
        if (status === 'Cancelled')
            return 'text-gray-600 bg-gray-100 border-gray-200';
        return 'text-blue-700 bg-blue-100 border-blue-200';
    };

    const getNetBalanceClass = (net: number): string => {
        if (net > 0) return 'bg-green-50 text-green-700';
        if (net < 0) return 'bg-red-50 text-red-700';
        return 'bg-gray-50 text-gray-700';
    };

    const renderTabContent = () => {
        const commonTableProps = {
            partners,
            isEditMode,
            editingCell,
            onCellClick: handleCellClick,
            onUpdateTransaction: updateTransaction,
            onDeleteTransaction: deleteTransaction,
            setEditingCell,
            calculatePersonLiability,
            formatCurrency,
            getStatusClass,
            getNetBalanceClass
        };

        switch (activeTab) {
            case 'all':
                return <TransactionTable transactions={transactions} {...commonTableProps} />;

            case 'expenses':
                return <TransactionTable transactions={transactions.filter(t => t.type === 'Expense')} {...commonTableProps} />;

            case 'receivables':
                return <TransactionTable transactions={transactions.filter(t => t.type === 'Receivable')} {...commonTableProps} />;

            case 'payables':
                return <TransactionTable transactions={transactions.filter(t => t.type === 'Payable')} {...commonTableProps} />;

            case 'partners':
                return <PartnersTab partners={partners} onAddPartner={addPartner} onDeletePartner={deletePartner} />;

            case 'results':
                return <ResultsTab partners={partners} transactions={transactions} balances={balances} formatCurrency={formatCurrency} />;

            default:
                return null;
        }
    };

    const handleNewTransactionChange = useCallback((field: keyof NewTransaction, value: any) => {
        setNewTransaction(prev => ({ ...prev, [field]: value }));
    }, []);

    // Predefined options for dropdowns
    const paidByOptions = [
        'Pending',
        ...partners.map(p => p.name),
        'Business Account',
        'External'
    ];

    const receivedByOptions = [
        'Team',
        'Business Account',
        ...partners.map(p => p.name),
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

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            T
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Techentia Expense Calculator</h1>
                    </div>
                    <p className="text-gray-600">Professional Financial Management System</p>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-3 mb-8 flex-wrap">
                    <button
                        onClick={toggleEditMode}
                        className={`px-4 py-2 rounded-lg font-medium transition-all border flex items-center gap-2 ${isEditMode
                            ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <Edit size={16} />
                        {isEditMode ? 'Disable Edit' : 'Enable Edit'}
                    </button>

                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add Transaction
                    </button>

                    <button
                        onClick={saveData}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <Save size={16} />
                        Save Changes
                    </button>

                    <button
                        onClick={lockAll}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        <X size={16} />
                        Lock All
                    </button>
                </div>

                {/* Add Transaction Form */}
                {showAddForm && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Transaction</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                <input
                                    type="text"
                                    value={newTransaction.description}
                                    onChange={(e) => handleNewTransactionChange('description', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    placeholder="Enter transaction description"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                <select
                                    value={newTransaction.type}
                                    onChange={(e) => handleNewTransactionChange('type', e.target.value as 'Expense' | 'Receivable' | 'Payable')}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="Expense">💳 Expense</option>
                                    <option value="Receivable">💰 Receivable</option>
                                    <option value="Payable">📋 Payable</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                <input
                                    type="number"
                                    value={newTransaction.amount || ''}
                                    onChange={(e) => handleNewTransactionChange('amount', parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Received By *</label>
                                <select
                                    value={newTransaction.receivedBy}
                                    onChange={(e) => handleNewTransactionChange('receivedBy', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Select recipient...</option>
                                    {receivedByOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Paid By *</label>
                                <select
                                    value={newTransaction.paidBy}
                                    onChange={(e) => handleNewTransactionChange('paidBy', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    {paidByOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={newTransaction.status}
                                    onChange={(e) => handleNewTransactionChange('status', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    {statusOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={newTransaction.notes}
                                    onChange={(e) => handleNewTransactionChange('notes', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    rows={2}
                                    placeholder="Additional notes..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={addTransaction}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Save size={16} />
                                Add Transaction
                            </button>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
                            >
                                <X size={16} />
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {[
                                { id: 'all', name: 'All Transactions', icon: FileText },
                                { id: 'expenses', name: 'Expenses', icon: Calculator },
                                { id: 'receivables', name: 'Receivables', icon: TrendingUp },
                                { id: 'payables', name: 'Payables', icon: FileText },
                                { id: 'partners', name: 'Partners', icon: Users },
                                { id: 'results', name: 'Results', icon: TrendingUp }
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        {tab.name}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default ExpenseCalculator;