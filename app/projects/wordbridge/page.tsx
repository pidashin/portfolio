'use client';

import React from 'react';
import Link from 'next/link';

const MainPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-orange-50">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg border border-orange-200">
        <h1 className="text-4xl font-bold text-orange-600 mb-6">Word Bridge</h1>
        <Link
          className="px-6 py-3 bg-orange-400 text-white font-semibold rounded-md hover:bg-orange-500 transition"
          href="/projects/wordbridge/exam"
        >
          Start
        </Link>
      </div>
    </div>
  );
};

export default MainPage;
