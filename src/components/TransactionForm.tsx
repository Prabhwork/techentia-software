import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../Firebase/Config';
import type { Partner, TransactionType, TransactionStatus, Transaction } from '../types';

interface TransactionFormProps {
    partners: Partner[];
    showMessage: (text: string, type: 'success' | 'error') => void;
}

export default function TransactionForm({ partners, showMessage }: TransactionFormProps) {
    const [loading, setLoading] = useState(false);
    const [transactionDescription, setTransactionDescription] = useState('');
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionType, setTransactionType] = useState<TransactionType>('Expense');
    const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('Pending');
    const [transactionPaidBy, setTransactionPaidBy] = useState<string[]>([]);
    const [transactionReceivedBy, setTransactionReceivedBy] = useState('');
    const [transactionNotes, setTransactionNotes] = useState('');
    const [customPartnerName, setCustomPartnerName] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    const handleTransactionSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
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

            const finalReceivedBy = showCustomInput && customPartnerName ? customPartnerName : transactionReceivedBy;

            const transactionData: Omit<Transaction, 'id'> = {
                description: transactionDescription.trim(),
                amount: amountNum,
                type: transactionType,
                status: transactionStatus,
                paidBy: transactionPaidBy.join(', '),
                receivedBy: finalReceivedBy.trim(),
                notes: transactionNotes.trim(),
                date: serverTimestamp(),
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'transactions'), transactionData);

            showMessage('Transaction added successfully!', 'success');

            // Reset form
            setTransactionDescription('');
            setTransactionAmount('');
            setTransactionPaidBy([]);
            setTransactionReceivedBy('');
            setTransactionNotes('');
            setCustomPartnerName('');
            setShowCustomInput(false);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Add New Transaction</h2>
            <form onSubmit={handleTransactionSubmit} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label className="block font-medium mb-1">Description:</label>
                    <input
                        type="text"
                        value={transactionDescription}
                        onChange={(e) => setTransactionDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                <div>
                    <label className="block font-medium mb-1">Paid By:</label>
                    <div className="w-full border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Partner(s) / Business / Custom
                        </label>

                        <div className="space-y-2">
                            {/* Business option */}
                            <label className="flex items-center space-x-2 text-gray-800">
                                <input
                                    type="checkbox"
                                    value="Business"
                                    checked={transactionPaidBy.includes("Business")}
                                    onChange={(e) => {
                                        const { value, checked } = e.target;
                                        setTransactionPaidBy((prev) => {
                                            if (checked) return prev.includes(value) ? prev : [...prev, value];
                                            return prev.filter((name) => name !== value);
                                        });
                                    }}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span>Business</span>
                            </label>

                            {/* Existing partners */}
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
                                                if (checked) return prev.includes(value) ? prev : [...prev, value];
                                                return prev.filter((name) => name !== value);
                                            });
                                        }}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span>{partner.name}</span>
                                </label>
                            ))}

                            {/* Custom option toggle */}
                            <label className="flex items-center space-x-2 text-gray-800">
                                <input
                                    type="checkbox"
                                    value="custom"
                                    checked={transactionPaidBy.includes("custom")}
                                    onChange={(e) => {
                                        const { checked } = e.target;
                                        setTransactionPaidBy((prev) => {
                                            if (checked) return [...prev, "custom"];
                                            return prev.filter((name) => name !== "custom");
                                        });
                                    }}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span>Other (Custom)</span>
                            </label>

                            {/* Show input only if custom is checked */}
                            {transactionPaidBy.includes("custom") && (
                                <input
                                    type="text"
                                    placeholder="Enter custom name"
                                    value={customPartnerName}
                                    onChange={(e) => setCustomPartnerName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                                />
                            )}
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
                            if (value === "custom") {
                                setShowCustomInput(true);
                            } else {
                                setShowCustomInput(false);
                                setCustomPartnerName('');
                            }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={!showCustomInput}
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
                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    )}
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                    <label className="block font-medium mb-1">Notes:</label>
                    <textarea
                        value={transactionNotes}
                        onChange={(e) => setTransactionNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Optional notes"
                        rows={2}
                    />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                    <button
                        type="submit"
                        disabled={loading || partners.length === 0}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Adding...' : 'Add Transaction'}
                    </button>
                    {partners.length === 0 && (
                        <p className="text-sm text-red-600 mt-1">Please add partners first</p>
                    )}
                </div>
            </form>
        </div>
    );
}