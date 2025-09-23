'use client';

import React, { useState, useEffect } from 'react';
import { FiTrash, FiPlus, FiZap, FiRefreshCw } from 'react-icons/fi';
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
  const { data, loading, error, refetch } = useQuery(GET_WORDS);

  const [wordGroups, setWordGroups] = useState<Word[]>([]);

  const [isJsonInputModalOpen, setIsJsonInputModalOpen] = useState(false);

  const [isAddWordModalOpen, setIsAddWordModalOpen] = useState(false);

  const [errMsg, setErrMsg] = useState<string | null>(null);

  // AI Generation state
  const [aiGenerationStatus, setAiGenerationStatus] = useState<
    'idle' | 'running' | 'completed' | 'error' | 'paused'
  >('idle');
  const [aiProgress, setAiProgress] = useState({
    processed: 0,
    total: 0,
    currentBatch: 0,
    totalBatches: 0,
    failedBatches: [],
  });
  const [aiError, setAiError] = useState<string | null>(null);

  const [addWords] = useMutation(ADD_WORDS_MUTATION);

  const [deleteWordsMutation] = useMutation(DELETE_WORDS_MUTATION);

  useEffect(() => {
    if (data) {
      setWordGroups(data.words);
    }
  }, [data]);

  // AI Generation functions
  const startAIGeneration = async () => {
    try {
      setAiError(null);
      setAiGenerationStatus('running');

      const response = await fetch(
        '/projects/wordbridge/api/generate-ai-templates',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'start' }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start AI generation');
      }

      // Start polling for status
      pollAIGenerationStatus();
    } catch (error) {
      console.error('Failed to start AI generation:', error);
      setAiError(error instanceof Error ? error.message : 'Unknown error');
      setAiGenerationStatus('error');
    }
  };

  const stopAIGeneration = async () => {
    try {
      const response = await fetch(
        '/projects/wordbridge/api/generate-ai-templates',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'stop' }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to stop AI generation');
      }

      setAiGenerationStatus('paused');
    } catch (error) {
      console.error('Failed to stop AI generation:', error);
      setAiError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const retryAIGeneration = async () => {
    try {
      setAiError(null);
      setAiGenerationStatus('running');

      const response = await fetch(
        '/projects/wordbridge/api/generate-ai-templates',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'retry' }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to retry AI generation');
      }

      // Start polling for status
      pollAIGenerationStatus();
    } catch (error) {
      console.error('Failed to retry AI generation:', error);
      setAiError(error instanceof Error ? error.message : 'Unknown error');
      setAiGenerationStatus('error');
    }
  };

  const pollAIGenerationStatus = async () => {
    try {
      const response = await fetch(
        '/projects/wordbridge/api/generate-ai-templates',
      );
      const status = await response.json();

      setAiProgress(status.progress);
      setAiGenerationStatus(status.status);

      if (status.error) {
        setAiError(status.error);
      }

      // Continue polling if still running
      if (status.status === 'running') {
        setTimeout(pollAIGenerationStatus, 2000);
      } else if (status.status === 'completed') {
        // Refresh data when generation completes to get updated AI template status
        refetch();
      }
    } catch (error) {
      console.error('Failed to poll AI generation status:', error);
      setAiError('Failed to check generation status');
      setAiGenerationStatus('error');
    }
  };

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
            {/* AI Generation Button */}
            <button
              className={`p-2 rounded-md flex items-center space-x-2 ${
                aiGenerationStatus === 'running'
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : aiGenerationStatus === 'error'
                    ? 'bg-red-500 hover:bg-red-600'
                    : aiGenerationStatus === 'paused'
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-purple-500 hover:bg-purple-600'
              } text-white`}
              onClick={
                aiGenerationStatus === 'running'
                  ? stopAIGeneration
                  : aiGenerationStatus === 'error' ||
                      aiGenerationStatus === 'paused'
                    ? retryAIGeneration
                    : startAIGeneration
              }
            >
              <FiZap size={20} />
              <span>
                {aiGenerationStatus === 'running'
                  ? 'Stop AI'
                  : aiGenerationStatus === 'error'
                    ? 'Retry AI'
                    : aiGenerationStatus === 'paused'
                      ? 'Resume AI'
                      : 'Generate AI Templates'}
              </span>
            </button>

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

            {/* Button to refresh data */}
            <button
              className="p-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
              onClick={() => refetch()}
              title="Refresh Data"
            >
              <FiRefreshCw size={24} />
            </button>
          </div>
        </div>

        {/* AI Generation Status */}
        {aiGenerationStatus !== 'idle' && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">
                AI Template Generation
                {aiGenerationStatus === 'running' && ' (In Progress)'}
                {aiGenerationStatus === 'completed' && ' (Completed)'}
                {aiGenerationStatus === 'error' && ' (Error)'}
                {aiGenerationStatus === 'paused' && ' (Paused)'}
              </h3>
              <div className="flex space-x-2">
                {aiGenerationStatus === 'running' && (
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    onClick={stopAIGeneration}
                  >
                    Stop
                  </button>
                )}
                {(aiGenerationStatus === 'error' ||
                  aiGenerationStatus === 'paused') && (
                  <button
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    onClick={retryAIGeneration}
                  >
                    {aiGenerationStatus === 'error' ? 'Retry' : 'Resume'}
                  </button>
                )}
              </div>
            </div>

            {(aiGenerationStatus === 'running' ||
              aiGenerationStatus === 'paused') && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    Progress: {aiProgress.processed} / {aiProgress.total}
                  </span>
                  <span>
                    Batch: {aiProgress.currentBatch} / {aiProgress.totalBatches}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${aiProgress.total > 0 ? (aiProgress.processed / aiProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                {aiProgress.failedBatches &&
                  aiProgress.failedBatches.length > 0 && (
                    <div className="text-sm text-red-600">
                      Failed batches: {aiProgress.failedBatches.join(', ')}
                    </div>
                  )}
              </div>
            )}

            {aiError && (
              <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                <strong>Error:</strong> {aiError}
                <div className="mt-1 text-sm">
                  Click &quot;Retry&quot; to continue from where it left off.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Word Grid */}
        {/* Limit height and allow scrolling */}
        <div className="grid grid-cols-12 gap-x-4 gap-y-2 items-center w-full">
          {/* Header */}
          <div className="col-span-3 font-bold">English (enUS)</div>
          <div className="col-span-3 font-bold">Chinese (zhTW)</div>
          <div className="col-span-3 font-bold">AI Template</div>
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
                <div className="col-span-3">{word.enUS}</div>

                {/* Chinese */}
                <div className="col-span-3">{word.zhTW}</div>

                {/* AI Template Status */}
                <div className="col-span-3 flex items-center">
                  {word.hasAITemplate === true ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ Available
                    </span>
                  ) : word.hasAITemplate === false ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      ❌ Not Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
                      {word.isNew ? '🆕 New Word' : '⏳ Loading...'}
                    </span>
                  )}
                </div>

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

        {/* AI Template Summary */}
        {wordGroups.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">AI Template Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {wordGroups.filter((w) => w.hasAITemplate === true).length}
                </div>
                <div className="text-gray-600">With AI Template</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {wordGroups.filter((w) => w.hasAITemplate === false).length}
                </div>
                <div className="text-gray-600">Without AI Template</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {wordGroups.length}
                </div>
                <div className="text-gray-600">Total Words</div>
              </div>
            </div>
          </div>
        )}

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
