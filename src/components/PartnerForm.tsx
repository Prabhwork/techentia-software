import { useState } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../Firebase/Config';
import type { Partner } from '../types';

interface PartnerFormProps {
    partners: Partner[];
    setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
    showMessage: (text: string, type: 'success' | 'error') => void;
}

export default function PartnerForm({ partners, setPartners, showMessage }: PartnerFormProps) {
    const [partnerName, setPartnerName] = useState('');
    const [partnerEquity, setPartnerEquity] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePartnerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const newEquity = parseFloat(partnerEquity);
            if (isNaN(newEquity) || newEquity <= 0 || newEquity > 1) {
                throw new Error('Equity must be between 0 and 1');
            }

            const totalEquity = partners.reduce((sum, p) => sum + p.equity, 0);

            // If total equity is already 1 or more, redistribute proportionally
            if (totalEquity >= 1) {
                // Calculate new proportions
                const adjustmentFactor = (1 - newEquity) / totalEquity;

                // Update existing partners' equity proportionally
                const updatePromises = partners.map(partner => {
                    const newPartnerEquity = partner.equity * adjustmentFactor;
                    return updateDoc(doc(db, 'partners', partner.id), {
                        equity: newPartnerEquity
                    });
                });

                await Promise.all(updatePromises);

                // Update local state
                const updatedPartners = partners.map(p => ({
                    ...p,
                    equity: p.equity * adjustmentFactor
                }));

                setPartners(updatedPartners);

            } else if (totalEquity + newEquity > 1) {
                throw new Error(`Only ${(1 - totalEquity).toFixed(2)} equity left to assign`);
            }

            // Create new partner
            const newPartnerData = {
                name: partnerName.trim(),
                equity: newEquity,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'partners'), newPartnerData);

            setPartners([...partners, { id: docRef.id, ...newPartnerData }]);;

            
            setPartnerName('');
            setPartnerEquity('');

            showMessage('Partner added successfully!', 'success');

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Add New Partner</h2>
            <form onSubmit={handlePartnerSubmit} className="space-y-4">
                <div>
                    <label className="block font-medium mb-1">Partner Name:</label>
                    <input
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Adding...' : 'Add Partner'}
                </button>
            </form>
        </div>
    );
}