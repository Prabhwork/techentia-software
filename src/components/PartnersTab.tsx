import React, { useState } from 'react';
import { Plus, Save, X, Trash2 } from 'lucide-react';
import type { Partner, NewPartner } from '../types';

interface PartnersTabProps {
  partners: Partner[];
  onAddPartner: (partner: NewPartner) => void;
  onDeletePartner: (id: string) => void;
}

const PartnersTab: React.FC<PartnersTabProps> = ({ partners, onAddPartner, onDeletePartner }) => {
  const [showAddPartnerForm, setShowAddPartnerForm] = useState<boolean>(false);
  const [newPartner, setNewPartner] = useState<NewPartner>({
    name: '',
    equity: 0
  });

  const handleAddPartner = (): void => {
    if (!newPartner.name.trim()) {
      alert('Please enter a valid partner name');
      return;
    }

    onAddPartner(newPartner);
    setNewPartner({ name: '', equity: 0 });
    setShowAddPartnerForm(false);
  };

  const handleDeletePartner = (id: string): void => {
    if (partners.length <= 1) {
      alert('Cannot delete the last partner');
      return;
    }
    if (window.confirm('Are you sure you want to delete this partner? Their equity will be redistributed among remaining partners.')) {
      onDeletePartner(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Partner Management</h3>
          <button
            onClick={() => setShowAddPartnerForm(!showAddPartnerForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Partner
          </button>
        </div>

        {showAddPartnerForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Add New Partner</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Enter partner name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Equity Share (Optional)
                </label>
                <input
                  type="number"
                  value={newPartner.equity || ''}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, equity: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="0.10"
                  min="0"
                  max="1"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for auto-calculation based on existing partners
                </p>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleAddPartner}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  Add
                </button>
                <button
                  onClick={() => setShowAddPartnerForm(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Equity Share</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Percentage</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{partner.name}</td>
                  <td className="px-4 py-3 text-gray-700">{partner.equity.toFixed(3)}</td>
                  <td className="px-4 py-3 text-gray-700">{(partner.equity * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeletePartner(partner.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Delete Partner"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Total Equity:</strong> {(partners.reduce((sum, p) => sum + p.equity, 0) * 100).toFixed(1)}%
            {Math.abs(partners.reduce((sum, p) => sum + p.equity, 0) - 1) > 0.001 && (
              <span className="text-red-600 ml-2">(Warning: Should equal 100%)</span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Equity Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {partners.map((partner) => (
            <div key={partner.id} className="text-center bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{partner.name}</h4>
              <div className="text-3xl font-bold text-blue-600">{(partner.equity * 100).toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartnersTab;