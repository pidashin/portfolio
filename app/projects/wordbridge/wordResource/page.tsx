'use client';

import { useState } from 'react';
import { FiSave, FiX, FiPlus } from 'react-icons/fi';
import { TbJson } from 'react-icons/tb';
import JsonInputModal from './JsonInputModal';

const WordUpdatePage: React.FC = () => {
  const [wordGroups, setWordGroups] = useState([{ enUS: '', zhTW: '' }]);
  const [isSaved, setIsSaved] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = () => {
    // Logic to save/update the word resources (e.g., send to the server)
    setIsSaved(true);
  };

  const handleClear = () => {
    setWordGroups([{ enUS: '', zhTW: '' }]);
    setIsSaved(false);
  };

  const handleAddGroup = () => {
    setWordGroups([...wordGroups, { enUS: '', zhTW: '' }]);
  };

  const handleRemoveGroup = (index: number) => {
    if (wordGroups.length > 1) {
      const updatedGroups = wordGroups.filter((_, i) => i !== index);
      setWordGroups(updatedGroups);
    }
  };

  const handleChange = (
    index: number,
    field: 'enUS' | 'zhTW',
    value: string,
  ) => {
    const updatedGroups = [...wordGroups];
    updatedGroups[index][field] = value;
    setWordGroups(updatedGroups);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Update Word Resources</h1>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={handleClear}
        >
          <FiX size={24} />
        </button>
      </div>

      {/* Toolbar (new) */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            className="text-gray-500 hover:text-gray-700 border border-gray-300 sm:border-transparent sm:hover:border-gray-300 p-2 rounded-md shadow-md sm:shadow-none sm:hover:shadow-md"
            onClick={() => setIsModalOpen(true)} // Open modal for JSON update
          >
            <TbJson size={24} />
          </button>

          {isModalOpen && (
            <JsonInputModal
              onClose={() => setIsModalOpen(false)}
              onConfirm={(json) => console.log(json)}
            />
          )}
          {/* Add more buttons here if needed */}
        </div>
      </div>

      {/* Word Groups Section */}
      <div className="space-y-4">
        {wordGroups.map((group, index) => (
          <div
            key={index}
            className="space-y-4 p-4 border border-gray-300 rounded-md"
          >
            <div>
              <label
                htmlFor={`enUS-${index}`}
                className="block text-xl font-medium mb-2"
              >
                English (enUS)
              </label>
              <input
                id={`enUS-${index}`}
                type="text"
                value={group.enUS}
                onChange={(e) => handleChange(index, 'enUS', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter English translation"
              />
            </div>

            <div>
              <label
                htmlFor={`zhTW-${index}`}
                className="block text-xl font-medium mb-2"
              >
                Chinese (Traditional) (zhTW)
              </label>
              <input
                id={`zhTW-${index}`}
                type="text"
                value={group.zhTW}
                onChange={(e) => handleChange(index, 'zhTW', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Chinese Traditional translation"
              />
            </div>

            {wordGroups.length > 1 && (
              <button
                className="flex items-center justify-center py-3 px-6 mt-2 text-white bg-red-500 rounded-md text-lg hover:bg-red-600 transition duration-200"
                onClick={() => handleRemoveGroup(index)}
              >
                Remove Word
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        className="flex items-center justify-center py-3 px-6 mt-4 text-white bg-green-500 rounded-md text-lg hover:bg-green-600 transition duration-200"
        onClick={handleAddGroup}
      >
        <FiPlus size={20} className="mr-2" />
        Add Another Word
      </button>

      {isSaved && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md">
          <p className="text-lg">Word resources updated successfully!</p>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          className="w-1/2 p-3 bg-blue-500 text-white rounded-md text-lg hover:bg-blue-600 transition duration-200"
          onClick={handleSave}
          disabled={wordGroups.some((group) => !group.enUS || !group.zhTW)}
        >
          <FiSave className="inline mr-2" size={20} />
          Save
        </button>
        <button
          className="w-1/2 p-3 bg-gray-500 text-white rounded-md text-lg hover:bg-gray-600 transition duration-200"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default WordUpdatePage;
