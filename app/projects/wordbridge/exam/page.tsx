'use client';

import React, { useState } from 'react';
// import wordResource from './words.json';
import { FiX } from 'react-icons/fi'; // Icon for exit button
import GET_WORDS from '../gql/getWords';
import { useQuery } from '@apollo/client';
import Notice, { ColorVariant } from '../components/notice';

type Word = { enUS: string; zhTW: string };

type Question = {
  question: { enUS: string; zhTW: string };
  options: { enUS: string; zhTW: string }[];
};

type WrongAnswer = {
  word: string;
  correct: string;
};

const ExitAlert: React.FC<{ onCancel: () => void; onConfirm: () => void }> = ({
  onCancel,
  onConfirm,
}) => {
  return (
    <div className="fixed px-8 inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-md">
        <p className="mb-4">
          Are you sure you want to leave the exam? Your progress will be lost.
        </p>
        <div className="flex justify-end">
          <button
            className="px-4 py-2 mr-2 bg-gray-300 rounded-md"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-md"
            onClick={onConfirm}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

const Summary = ({
  score,
  wrongAnswers,
  onRetry,
}: {
  score: number;
  wrongAnswers: WrongAnswer[];
  onRetry: () => void;
}) => {
  const handleExit = () => {
    window.location.href = '/projects/wordbridge';
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Exam Summary</h1>
      <p className="mb-4">
        Your Score:{' '}
        <span className="font-semibold text-4xl text-red-500">{score}</span>
      </p>
      {wrongAnswers.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Incorrect Answers:</h2>
          <ul className="list-disc ml-6">
            {wrongAnswers.map((answer, index) => (
              <li key={index} className="text-xl p-2">
                <span className="mr-2">{answer.word}:</span>
                <span>{answer.correct}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Perfect score! Well done!</p>
      )}
      <div className="mt-12 w-full flex">
        <button
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md mr-8"
          onClick={onRetry}
        >
          Retry
        </button>
        <button
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md"
          onClick={handleExit}
        >
          Exit
        </button>
      </div>
    </div>
  );
};

const genQuestions = (wordResource: Word[]): Question[] => {
  // Prepare 10 random questions
  const shuffledWords = [...wordResource]
    .sort(() => 0.5 - Math.random())
    .slice(0, 10);
  return shuffledWords.map((word) => {
    // Generate options
    const shuffledOptions = [...wordResource]
      .filter((w) => w.enUS !== word.enUS)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    shuffledOptions.push(word);
    return {
      question: word,
      options: shuffledOptions.sort(() => 0.5 - Math.random()),
    };
  });
};

const ENUS_QUESTION_WEIGHT = 0.6;

const ExamPage = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(
    null,
  );
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showExitAlert, setShowExitAlert] = useState(false);

  const [isReverse, setIsReverse] = useState(
    Math.random() > ENUS_QUESTION_WEIGHT,
  );

  const {
    data: data_get_words,
    loading,
    error,
  } = useQuery(GET_WORDS, {
    onCompleted: (data) => {
      setQuestions(genQuestions(data.words));
    },
  });

  const handleOptionSelect = (idx: number) => {
    if (isCorrect === null) {
      setSelectedOptionIdx(idx);
    }
  };

  const handleSubmit = () => {
    if (selectedOptionIdx === null) {
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isAnswerCorrect =
      currentQuestion.options[selectedOptionIdx].zhTW ===
      currentQuestion.question.zhTW;
    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      setScore(score + 10);
    } else {
      setWrongAnswers([
        ...wrongAnswers,
        {
          word: currentQuestion.question.enUS,
          correct: currentQuestion.question.zhTW,
        },
      ]);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOptionIdx(null);
      setIsCorrect(null);
      setIsReverse(Math.random() > ENUS_QUESTION_WEIGHT);
    } else {
      setShowSummary(true);
    }
  };

  const confirmExit = () => {
    window.location.href = '/projects/wordbridge'; // Navigate to main page
  };

  const handleExit = () => {
    if (currentQuestionIndex > 0) {
      setShowExitAlert(true);
    } else {
      confirmExit(); // Navigate to main page
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedOptionIdx(null);
    setIsCorrect(null);
    setShowSummary(false);
    setWrongAnswers([]);
    setScore(0);
    setQuestions(genQuestions(data_get_words.words));
    setIsReverse(Math.random() > ENUS_QUESTION_WEIGHT);
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

  if (showSummary) {
    return (
      <Summary
        score={score}
        wrongAnswers={wrongAnswers}
        onRetry={handleRetry}
      />
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="p-8">
      <button
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        onClick={handleExit}
      >
        <FiX size={24} />
      </button>

      {showExitAlert && (
        <ExitAlert
          onCancel={() => setShowExitAlert(false)}
          onConfirm={confirmExit}
        />
      )}

      <h1 className="text-2xl font-bold mb-6">
        Question {currentQuestionIndex + 1}
      </h1>
      <p className="mb-4 text-3xl font-semibold capitalize">
        {isReverse
          ? currentQuestion?.question.zhTW
          : currentQuestion?.question.enUS}
      </p>
      <div className="mb-4">
        {currentQuestion?.options.map((option, index) => {
          const isAnswerCorrect = option.zhTW === currentQuestion.question.zhTW;

          let btnClass =
            'block w-full p-2 mb-2 text-left border rounded-md transition-all duration-200 text-2xl';

          if (selectedOptionIdx === index) {
            if (isCorrect) {
              btnClass += ' bg-green-200 border-green-400';
            } else {
              btnClass += ' bg-orange-200 border-orange-400';
            }
          } else if (isCorrect !== null && isAnswerCorrect) {
            btnClass += ' bg-green-200 border-green-400';
          }

          return (
            <button
              key={index}
              className={btnClass}
              onClick={() => handleOptionSelect(index)}
            >
              {isReverse ? option.enUS : option.zhTW}
            </button>
          );
        })}
      </div>
      <p
        className={`${isCorrect === null ? 'invisible' : 'visible'} ${isCorrect ? 'text-green-500' : 'text-red-500'} mb-4 text-xl`}
      >
        {isCorrect ? 'Correct!' : 'Wrong!'}
      </p>

      {selectedOptionIdx !== null && isCorrect === null && (
        <button
          className="w-full px-4 py-2 bg-green-500 text-white rounded-md mr-4"
          onClick={handleSubmit}
          disabled={isCorrect !== null}
        >
          OK
        </button>
      )}

      {isCorrect !== null && (
        <>
          <button
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md "
            onClick={handleNext}
          >
            Next
          </button>
        </>
      )}
    </div>
  );
};

export default ExamPage;
