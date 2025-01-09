'use client';

import React, { useState, useEffect } from 'react';
import { FiTrash, FiPlus } from 'react-icons/fi';
import { useQuery, useMutation } from '@apollo/client';
import ADD_WORDS_MUTATION from '../gql/addWords';
import DELETE_WORDS_MUTATION from '../gql/deleteWords';
import GET_WORDS from '../gql/getWords';
import Notice, { ColorVariant } from '../components/notice';
import { TbJson } from 'react-icons/tb';
import JsonInputModal from './JsonInputModal';
import AddWordModal from './AddWordModal';
import { Word } from './types';

const WordGrid: React.FC = () => {
  const { data, loading, error } = useQuery(GET_WORDS);

  const [wordGroups, setWordGroups] = useState<Word[]>([]);

  const [isJsonInputModalOpen, setIsJsonInputModalOpen] = useState(false);

  const [isAddWordModalOpen, setIsAddWordModalOpen] = useState(false);

  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [addWords] = useMutation(ADD_WORDS_MUTATION);

  const [deleteWordsMutation] = useMutation(DELETE_WORDS_MUTATION);

  useEffect(() => {
    if (data) {
      setWordGroups(data.words);
    }
  }, [data]);

  const handleConfirmJsonInput = (newWords: Word[]) => {
    // Add isNew property to each new word
    const updatedNewWords = newWords.map((word) => ({ ...word, isNew: true }));
    setWordGroups((prev) => [...prev, ...updatedNewWords]);
  };

  const handleConfirmAddWord = (newWord: Word) => {
    setWordGroups((prev) => [...prev, { ...newWord, isNew: true }]);
  };

  const handleSaveNewWords = async () => {
    const newWords = wordGroups.filter((word) => word.isNew);

    if (newWords.length === 0) {
      return;
    }

    try {
      setErrMsg(null); // Clear any previous error
      await addWords({
        variables: {
          words: newWords.map(({ enUS, zhTW }) => ({ enUS, zhTW })),
        },
      });

      // Mark all new words as not new
      setWordGroups((prev) => prev.map((word) => ({ ...word, isNew: false })));
    } catch (error) {
      console.error('Error saving new words:', error);
      setErrMsg('Failed to save new words. Please try again.');
    }
  };

  const handleDeleteWord = async (index: number) => {
    const wordToDelete = wordGroups[index];

    // Set loading state
    setErrMsg(null);

    try {
      // Call the delete mutation
      const { data, errors } = await deleteWordsMutation({
        variables: { enUsKeys: [wordToDelete.enUS] },
      });

      if (errors) {
        setErrMsg('Failed to delete the word. Please try again.');
      } else if (data?.deleteWords) {
        // Remove the word from the state list if deletion was successful
        setWordGroups((prev) => prev.filter((_, i) => i !== index));
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setErrMsg('An error occurred while deleting the word.');
    }
  };

  if (loading) {
    return (
      <Notice
        colorVariant={ColorVariant.Loading}
        message="Loading questions, please wait..."
      />
    );
  }
  if (error) {
    return (
      <Notice
        colorVariant={ColorVariant.Loading}
        message={`Error loading questions: ${error}`}
      />
    );
  }

  return (
    <>
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Toolbar Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manage Words</h1>
          <div className="flex space-x-4">
            {/* Button to open modal for adding words from JSON */}
            <button
              className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={() => setIsJsonInputModalOpen(true)}
            >
              <TbJson size={24} /> {/* Use TbJson icon for JSON import */}
            </button>

            {/* Button to open modal for adding a single word */}
            <button
              className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              onClick={() => setIsAddWordModalOpen(true)} // This will open the modal for adding a single word
            >
              <FiPlus size={24} /> {/* Use FiPlus icon for adding a word */}
            </button>
          </div>
        </div>

        {/* Word Grid */}
        {/* Limit height and allow scrolling */}
        <div className="grid grid-cols-12 gap-x-4 gap-y-2 items-center w-full">
          {/* Header */}
          <div className="col-span-4 font-bold">English (enUS)</div>
          <div className="col-span-4 font-bold">Chinese (zhTW)</div>
          <div className="col-span-3 font-bold">Actions</div>

          <div className="col-span-12 grid grid-cols-subgrid gap-x-4 gap-y-2  overflow-y-auto max-h-[550px]">
            {/* Rows */}
            {wordGroups.map((word, index) => (
              <div
                key={index}
                className={`grid grid-cols-subgrid col-span-12 gap-4 items-center p-2 rounded-md shadow-sm w-full max-w-full ${
                  word.isNew
                    ? 'bg-yellow-100 hover:bg-yellow-200'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {/* English */}
                <div className="col-span-4">{word.enUS}</div>

                {/* Chinese */}
                <div className="col-span-4">{word.zhTW}</div>

                {/* Actions */}
                <div className="col-span-3 flex space-x-2">
                  <button
                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    onClick={() => handleDeleteWord(index)}
                  >
                    <FiTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-2 mt-6 min-h-[24px]">
          {errMsg && (
            <p className="text-red-500 text-sm">
              Failed to save new words. Please try again.
            </p>
          )}
        </div>

        {/* Save Section */}
        {wordGroups.some((word) => word.isNew) && (
          <div className="flex justify-end">
            <button
              className="py-2 px-6 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600"
              onClick={handleSaveNewWords}
            >
              Save New Words
            </button>
          </div>
        )}
      </div>
      {isJsonInputModalOpen && (
        <JsonInputModal
          onClose={() => setIsJsonInputModalOpen(false)}
          onConfirm={handleConfirmJsonInput}
        />
      )}

      {isAddWordModalOpen && (
        <AddWordModal
          onClose={() => setIsAddWordModalOpen(false)}
          onConfirm={handleConfirmAddWord}
        />
      )}
    </>
  );
};

export default WordGrid;
