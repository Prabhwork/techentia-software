import  { useState,  } from 'react';
import type { FormEvent } from 'react';
import { db } from '../Firebase/Config';
import { collection, addDoc } from 'firebase/firestore';

interface Partner {
  name: string;
  percentage: number;
}

export default function AddPartnerForm(): JSX.Element {
  const [name, setName] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!name.trim() || !percentage.trim()) {
      alert('All fields are required.');
      return;
    }

    const percentageNum = parseFloat(percentage);
    if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
      alert('Percentage must be a valid number between 0 and 100.');
      return;
    }

    setLoading(true);

    try {
      const partnerData: Partner = {
        name: name.trim(),
        percentage: percentageNum
      };

      await addDoc(collection(db, 'partners'), partnerData);

      alert('Partner added successfully!');
      setName('');
      setPercentage('');
    } catch (error) {
      console.error('Error adding partner:', error);
      alert('Failed to add partner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow rounded">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Add Partner</h2>
        
        <div>
          <label className="block font-medium mb-1">Partner Name:</label>
          <input
            type="text"
            placeholder="Enter partner name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Percentage:</label>
          <input
            type="number"
            placeholder="e.g. 25"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            step="0.01"
            min="0"
            max="100"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Partner'}
        </button>
      </form>
    </div>
  );
}