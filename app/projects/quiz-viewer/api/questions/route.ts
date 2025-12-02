import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the shape of OCR data
interface OcrData {
  subject: string;
  questionStem?: string;
  options?: string[];
  blanks?: string[];
  imageDescription?: string;
  [key: string]: any;
}

// Define the shape of a question
interface Question {
  id: string;
  timestamp: string;
  subject: string;
  userId: string;
  imagePath: string;
  ocrData: OcrData;
  status: string;
}

// Path to the ocr-results.json file
const ocrResultsFilePath =
  process.env.OCR_RESULTS_PATH ||
  path.join(
    process.cwd(),
    'app',
    'projects',
    'quiz-viewer',
    'data',
    'ocr-results.json',
  );

let questionsCache: Question[] | null = null;
let questionsLastModified: number | null = null;

// Load questions from file with caching
const getQuestions = (): Question[] => {
  // Check if file exists
  const fileExists = fs.existsSync(ocrResultsFilePath);
  
  if (fileExists) {
    const stats = fs.statSync(ocrResultsFilePath);
    const lastModified = stats.mtime.getTime();

    // If file has been modified since last cache, clear cache
    if (questionsLastModified !== null && lastModified > questionsLastModified) {
      console.log('🔄 OCR results file updated, clearing cache');
      questionsCache = null;
    }

    // If we have valid cache, return it
    if (questionsCache && questionsLastModified === lastModified) {
      console.log('📦 Returning cached questions:', questionsCache.length);
      return questionsCache;
    }

    // Load fresh data from file
    try {
      console.log('📖 Loading questions from:', ocrResultsFilePath);
      const fileData = fs.readFileSync(ocrResultsFilePath, 'utf-8');
      questionsCache = JSON.parse(fileData);
      questionsLastModified = lastModified;
      console.log('✅ Loaded', questionsCache?.length || 0, 'questions');
    } catch (error) {
      console.error('❌ Error reading OCR results file:', error);
      questionsCache = [];
      questionsLastModified = lastModified;
    }
  } else {
    // If the file doesn't exist, create an empty file
    try {
      console.log('📝 OCR results file does not exist, creating empty file');
      fs.writeFileSync(ocrResultsFilePath, JSON.stringify([], null, 2));
      questionsCache = [];
      questionsLastModified = Date.now();
    } catch (error) {
      console.error('❌ Error creating OCR results file:', error);
      questionsCache = [];
    }
  }

  return questionsCache || [];
};

export async function GET() {
  try {
    const questions = getQuestions();
    
    return NextResponse.json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error('❌ Error in GET /api/questions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load questions',
        questions: []
      },
      { status: 500 }
    );
  }
}
