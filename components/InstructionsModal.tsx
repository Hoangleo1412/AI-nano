import React, { useState, useEffect } from 'react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (instructions: string) => void;
  initialInstructions: string;
}

const EXAMPLES = [
  'Make it more vibrant and colorful',
  'Add a retro 80s style',
  'Transform to watercolor painting',
  'Make it look professional',
];

const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose, onSave, initialInstructions }) => {
  const [instructions, setInstructions] = useState(initialInstructions);

  useEffect(() => {
    if (isOpen) {
      setInstructions(initialInstructions);
    }
  }, [isOpen, initialInstructions]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(instructions);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">ADDITIONAL INSTRUCTIONS</h2>
          <span className="text-sm text-gray-500">{instructions.length}/2000</span>
        </div>
        
        <div className="mt-4 relative">
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            maxLength={2000}
            className="w-full h-48 p-4 bg-white border-2 border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 rounded-md text-gray-900 resize-none outline-none"
            aria-label="Additional instructions for AI"
          />
          {instructions.length === 0 && (
            <div className="absolute top-4 left-4 text-gray-500 pointer-events-none pr-4">
                <p>Add instructions to customize the AI output...</p>
                <div className="mt-4">
                    <p className="mb-2">Examples:</p>
                    <ul className="list-inside">
                        {EXAMPLES.map(ex => <li key={ex} className="list-item list-disc ml-4">{ex}</li>)}
                    </ul>
                </div>
            </div>
          )}
        </div>
        
        <p className="mt-2 text-sm text-gray-600">
          Describe how you want the AI to transform or reimagine the selected image region.
        </p>
        
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-5 py-2 rounded-md font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2 rounded-md font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Save Instructions
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructionsModal;
