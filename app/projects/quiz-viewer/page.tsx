'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Question {
  subject: string;
  stem: string;
  options?: string[];
  blanks?: string[];
  imageDescription?: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  questions: Question[];
  error?: string;
}

const QuizViewer = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/projects/quiz-viewer/api/questions');
      const data: ApiResponse = await response.json();
      
      if (data.success && data.questions.length > 0) {
        setQuestions(data.questions);
        setError(null);
      } else {
        setError(data.error || 'No questions available');
      }
    } catch (err) {
      setError('Failed to load questions');
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : questions.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < questions.length - 1 ? prev + 1 : 0));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-600 font-medium">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white shadow-xl rounded-lg border border-indigo-200 max-w-md">
          <h1 className="text-3xl font-bold text-indigo-600 mb-4">Quiz Viewer</h1>
          <p className="text-gray-600 mb-6">{error || 'No questions available yet'}</p>
          <Link
            className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-md hover:bg-indigo-600 transition inline-block"
            href="/projects"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/projects"
            className="text-indigo-600 hover:text-indigo-800 font-medium transition"
          >
            ← Back to Projects
          </Link>
          <h1 className="text-3xl font-bold text-indigo-600">Quiz Viewer</h1>
          <div className="text-indigo-600 font-medium">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white shadow-xl rounded-lg border border-indigo-200 p-8 mb-6">
          {/* Subject Badge */}
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-full text-sm">
              {currentQuestion.subject}
            </span>
          </div>

          {/* Question Stem */}
          {currentQuestion.stem && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Question</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {currentQuestion.stem}
              </p>
            </div>
          )}

          {/* Options */}
          {currentQuestion.options && currentQuestion.options.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Options</h3>
              <div className="space-y-2">
                {currentQuestion.options.map((option, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition"
                  >
                    <span className="font-medium text-indigo-600 mr-2">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span className="text-gray-700">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blanks */}
          {currentQuestion.blanks && currentQuestion.blanks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Fill in the Blanks</h3>
              <div className="space-y-2">
                {currentQuestion.blanks.map((blank, idx) => (
                  <div key={idx} className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
                    <span className="font-medium text-yellow-700 mr-2">Blank {idx + 1}:</span>
                    <span className="text-gray-700">{blank}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Description */}
          {currentQuestion.imageDescription && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Image Description</h3>
              <p className="text-gray-600 italic bg-blue-50 p-4 rounded-md border border-blue-200">
                {currentQuestion.imageDescription}
              </p>
            </div>
          )}

          {/* Question Index */}
          <div className="text-xs text-gray-400 mt-6 pt-4 border-t border-gray-200">
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-md hover:bg-indigo-600 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={questions.length <= 1}
          >
            ← Previous
          </button>
          
          <div className="text-gray-600 font-medium">
            Question {currentIndex + 1} of {questions.length}
          </div>
          
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-md hover:bg-indigo-600 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={questions.length <= 1}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizViewer;
