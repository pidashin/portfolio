'use client';

import React, { useState } from 'react';
import { FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';

interface JsonInputModalProps {
  onClose: () => void;
  onConfirm: (json: string) => void;
}

const JsonInputModal: React.FC<JsonInputModalProps> = ({
  onClose,
  onConfirm,
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
  };

  const handleConfirm = () => {
    try {
      const parsedJson = JSON.parse(jsonInput);
      if (Array.isArray(parsedJson)) {
        onConfirm(jsonInput); // Pass the valid JSON to the parent
        setJsonInput('');
        onClose();
      } else {
        setError('Invalid JSON structure. Expected an array.');
      }
    } catch (e) {
      setError('Invalid JSON format.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-md w-1/2">
        <h2 className="text-2xl font-bold mb-4">
          Update Word Resources from JSON
        </h2>

        <textarea
          value={jsonInput}
          onChange={handleChange}
          rows={8}
          className="w-full p-4 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter the word resource JSON here..."
        />

        <div className="min-h-[24px] my-2">
          {error && (
            <p className="text-red-500 text-sm flex items-center">
              <FiAlertCircle size={16} className="mr-2" />
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            className="flex items-center justify-center py-2 px-4 text-white bg-gray-500 rounded-md hover:bg-gray-600"
            onClick={onClose}
          >
            <FiX className="mr-2" />
            Cancel
          </button>
          <button
            className="flex items-center justify-center py-2 px-4 text-white bg-green-500 rounded-md hover:bg-green-600"
            onClick={handleConfirm}
          >
            <FiCheck className="mr-2" />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default JsonInputModal;
