import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';
import { db } from '../Firebase/Config';
import type { Partner } from '../types';

interface PartnerListProps {
  partners: Partner[];
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
  isEditMode: boolean;
  showMessage: (text: string, type: 'success' | 'error') => void;
}

export default function PartnerList({ partners, setPartners, isEditMode, showMessage }: PartnerListProps) {
  const handleDeletePartner = async (id: string): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this partner?')) {
      try {
        const partnerToDelete = partners.find(p => p.id === id);
        if (!partnerToDelete) return;

        const deletedEquity = partnerToDelete.equity;
        const remainingPartners = partners.filter(p => p.id !== id);
        
        if (remainingPartners.length > 0) {
          // Redistribute deleted partner's equity proportionally among remaining partners
          const totalRemainingEquity = remainingPartners.reduce((sum, p) => sum + p.equity, 0);
          
          if (totalRemainingEquity > 0) {
            // Calculate redistribution factor
            const redistributionFactor = (totalRemainingEquity + deletedEquity) / totalRemainingEquity;
            
            // Update remaining partners' equity
            const updatePromises = remainingPartners.map(partner => {
              const newEquity = partner.equity * redistributionFactor;
              return updateDoc(doc(db, 'partners', partner.id), {
                equity: newEquity
              });
            });
            
            await Promise.all(updatePromises);
            
            // Update local state
            setPartners(remainingPartners.map(p => ({
              ...p,
              equity: p.equity * redistributionFactor
            })));
          }
        }

        // Delete the partner
        await deleteDoc(doc(db, 'partners', id));
        showMessage('Partner deleted successfully!', 'success');
      } catch (error) {
        showMessage('Failed to delete partner', 'error');
      }
    }
  };

  const totalEquity = partners.reduce((sum, p) => sum + p.equity, 0);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Partners ({partners.length})</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {partners.length === 0 ? (
          <p className="text-gray-500 italic">No partners added yet.</p>
        ) : (
          partners.map((partner) => (
            <div key={partner.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div>
                <strong className="text-gray-800">{partner.name}</strong>
                <span className="ml-2 text-blue-600 font-medium">
                  {(partner.equity * 100).toFixed(1)}%
                </span>
              </div>
              {isEditMode && (
                <button
                  onClick={() => handleDeletePartner(partner.id)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
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
            Total Equity: {(totalEquity * 100).toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}