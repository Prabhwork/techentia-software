import React, { useState } from 'react';
import type { EditableCellProps, Partner, Transaction } from '../types';

interface EditableCellComponentProps extends EditableCellProps {
  partners: Partner[];
  editingCell: { txId: number; field: keyof Transaction; currentValue: string | number } | null;
  setEditingCell: (cell: { txId: number; field: keyof Transaction; currentValue: string | number } | null) => void;
}

const EditableCell: React.FC<EditableCellComponentProps> = ({ 
  value, 
  onSave, 
  type = 'text', 
  options = [], 
  field,
  partners
}) => {
  const [editValue, setEditValue] = useState<string>(value.toString());
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const handleSave = (): void => {
    const finalValue = type === 'number' ? parseFloat(editValue) || 0 : editValue.trim();
    onSave(finalValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      // This would be handled by parent component
    }
  };

  const getFieldOptions = () => {
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
            className="flex-1 p-1 border border-gray-300 rounded text-sm"
            autoFocus
            placeholder="Enter custom value"
          />
          <button
            onClick={() => { setIsCustom(false); setEditValue(fieldOptions[0]); }}
            className="p-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
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
        className="w-full p-1 border border-gray-300 rounded text-sm"
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
      className="w-full p-1 border border-gray-300 rounded text-sm"
      autoFocus
      min={type === 'number' ? "0" : undefined}
      step={type === 'number' ? "0.01" : undefined}
    />
  );
};

export default EditableCell;