import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { InferenceClient } from '@huggingface/inference';
import { aiTemplateService } from '../../services/aiTemplateService';

// Types
interface Word {
  enUS: string;
  zhTW: string;
  label: string;
  templates?: Array<{
    template: string;
    options: string[];
  }>;
}

interface AITemplate {
  word: string;
  sentence: string;
  options: string[];
  answer: string;
}

interface GenerationStatus {
  status: 'idle' | 'running' | 'completed' | 'error' | 'paused';
  progress: {
    processed: number;
    total: number;
    currentBatch: number;
    totalBatches: number;
    failedBatches: number[];
  };
  error?: string;
  lastProcessedBatch?: number;
}

// Global state for generation status
let generationStatus: GenerationStatus = {
  status: 'idle',
  progress: {
    processed: 0,
    total: 0,
    currentBatch: 0,
    totalBatches: 0,
    failedBatches: [],
  },
};

// Load words from JSON file
function loadWords(): Word[] {
  const wordsPath =
    process.env.WORDS_JSON_PATH ||
    path.join(process.cwd(), 'app/projects/wordbridge/api/graphql/words.json');
  const wordsData = fs.readFileSync(wordsPath, 'utf8');
  return JSON.parse(wordsData);
}

// Save AI templates to JSON file
async function saveAITemplates(templates: AITemplate[]): Promise<void> {
  const templatesPath =
    process.env.WORDS_AI_JSON_PATH ||
    path.join(
      process.cwd(),
      'app/projects/wordbridge/api/graphql/words_ai.json',
    );
  fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
  console.log(`✅ Saved ${templates.length} AI templates to words_ai.json`);

  // Clear all caches to force refresh
  clearAITemplateServiceCache();
}

// Clear AI template service cache
function clearAITemplateServiceCache() {
  try {
    aiTemplateService.clearCache();
    console.log('🔄 Cleared AI template service cache');
  } catch (error) {
    console.error('❌ Failed to clear AI template service cache:', error);
  }
}

// Load existing AI templates
function loadAITemplates(): AITemplate[] {
  const templatesPath =
    process.env.WORDS_AI_JSON_PATH ||
    path.join(
      process.cwd(),
      'app/projects/wordbridge/api/graphql/words_ai.json',
    );
  if (fs.existsSync(templatesPath)) {
    const templatesData = fs.readFileSync(templatesPath, 'utf8');
    return JSON.parse(templatesData);
  }
  return [];
}

// Create batch prompt for multiple words using the new format
function createBatchPrompt(words: Word[]): string {
  const wordList = words.map((w) => w.enUS);
  return `You are a quiz generator for children aged 6–12.

Task:
- Make one fill-in-the-blank quiz for each of the following words: ${wordList.join(', ')}.
- The quizzes should be simple and child-friendly.
- Output strictly in JSON format: an array of objects.
- Each object must follow this schema:
  {
    "word": "<the input word>",
    "sentence": "One short sentence with a blank (____).",
    "options": ["<4 choices>"],
    "answer": "<the correct word>"
  }

Rules:
- Exactly 4 options per quiz.
- Only 1 option should be correct, and it must be the input word.
- The other 3 options should be simple distractors (easy, common nouns kids know).
- Keep vocabulary at the level of a 6–12 year old.
- Do not include explanations or text outside of the JSON array.`;
}

// Initialize Hugging Face Inference Client
function getInferenceClient(): InferenceClient {
  const apiKey = process.env.HUGGING_FACE_API_KEY;
  if (!apiKey) {
    throw new Error('HUGGING_FACE_API_KEY environment variable is required');
  }
  return new InferenceClient(apiKey);
}

// Mock response for testing when no API is available
function createMockResponse(words: Word[]): AITemplate[] {
  console.log('🎭 Using mock response for testing');

  return words.map((word) => ({
    word: word.enUS,
    sentence: `The ${word.enUS} is a beautiful animal that lives in the forest.`,
    options: [word.enUS, 'lion', 'tiger', 'bear'],
    answer: word.enUS,
  }));
}

// Call Hugging Face Inference Providers API
async function callHuggingFaceAPI(words: Word[]): Promise<AITemplate[]> {
  try {
    const client = getInferenceClient();
    const prompt = createBatchPrompt(words);

    console.log('🔍 Calling Hugging Face Inference Providers API...');
    console.log('- Words:', words.map((w) => w.enUS).join(', '));
    console.log('- Prompt length:', prompt.length);

    const response = await client.chatCompletion({
      provider: 'hyperbolic', // Using hyperbolic provider as suggested
      model: 'Qwen/Qwen3-Next-80B-A3B-Instruct',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    console.log('📥 Response received from Hugging Face API');

    const content = response.choices[0].message.content || '';
    console.log('📝 Raw response:', content);

    // Try to parse JSON response
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        if (Array.isArray(parsed)) {
          console.log(`✅ Successfully parsed ${parsed.length} templates`);
          return parsed.map((item: Record<string, unknown>) => ({
            word: String(item.word || ''),
            sentence: String(item.sentence || ''),
            options: Array.isArray(item.options)
              ? item.options.map(String)
              : [],
            answer: String(item.answer || item.word || ''),
          }));
        }
      }

      throw new Error('No valid JSON array found in response');
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.log('📝 Raw content:', content);
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    console.error('❌ Hugging Face API error:', error);

    // Fallback to mock response
    console.log('🔄 Falling back to mock response...');
    return createMockResponse(words);
  }
}

async function processBatch(words: Word[]): Promise<AITemplate[]> {
  console.log(`📝 Processing batch of ${words.length} words`);

  const templates = await callHuggingFaceAPI(words);

  console.log(`✅ Generated ${templates.length} templates for batch`);
  return templates;
}

// GET - Check generation status
export async function GET() {
  return NextResponse.json(generationStatus);
}

// POST - Start, stop, or retry generation
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'start') {
      if (generationStatus.status === 'running') {
        return NextResponse.json(
          { error: 'Generation already in progress' },
          { status: 400 },
        );
      }

      // Start generation
      generationStatus = {
        status: 'running',
        progress: {
          processed: 0,
          total: 0,
          currentBatch: 0,
          totalBatches: 0,
          failedBatches: [],
        },
        lastProcessedBatch: 0,
      };

      // Start generation in background
      generateAITemplates().catch((error) => {
        console.error('❌ Generation failed:', error);
        generationStatus = {
          ...generationStatus,
          status: 'error',
          error: error.message,
        };
      });

      return NextResponse.json({ message: 'Generation started' });
    }

    if (action === 'retry') {
      if (
        generationStatus.status !== 'error' &&
        generationStatus.status !== 'paused'
      ) {
        return NextResponse.json(
          { error: 'No failed generation to retry' },
          { status: 400 },
        );
      }

      // Retry from where we left off
      generationStatus = {
        ...generationStatus,
        status: 'running',
        error: undefined,
      };

      // Start generation in background from last processed batch
      generateAITemplates().catch((error) => {
        console.error('❌ Generation failed:', error);
        generationStatus = {
          ...generationStatus,
          status: 'error',
          error: error.message,
        };
      });

      return NextResponse.json({ message: 'Generation retry started' });
    }

    if (action === 'stop') {
      if (generationStatus.status !== 'running') {
        return NextResponse.json(
          { error: 'No generation in progress' },
          { status: 400 },
        );
      }

      generationStatus = {
        ...generationStatus,
        status: 'paused',
      };

      return NextResponse.json({ message: 'Generation paused' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

async function generateAITemplates() {
  try {
    console.log('🚀 Starting AI template generation...');

    const words = loadWords();
    const existingTemplates = loadAITemplates();
    const existingWords = new Set(existingTemplates.map((t) => t.word));

    // Filter out words that already have AI templates
    const wordsToProcess = words.filter(
      (word) => !existingWords.has(word.enUS),
    );

    if (wordsToProcess.length === 0) {
      console.log('✅ All words already have AI templates');
      generationStatus = {
        status: 'completed',
        progress: {
          processed: words.length,
          total: words.length,
          currentBatch: 0,
          totalBatches: 0,
          failedBatches: [],
        },
      };
      return;
    }

    const BATCH_SIZE = 10; // Process 10 words at a time
    const totalBatches = Math.ceil(wordsToProcess.length / BATCH_SIZE);

    // Initialize progress if starting fresh
    if (generationStatus.progress.total === 0) {
      generationStatus.progress.total = wordsToProcess.length;
      generationStatus.progress.totalBatches = totalBatches;
    }

    const allTemplates: AITemplate[] = [...existingTemplates];
    const startBatch = generationStatus.lastProcessedBatch || 0;

    console.log(
      `📊 Processing ${wordsToProcess.length} words in ${totalBatches} batches`,
    );
    console.log(`🔄 Starting from batch ${startBatch + 1}`);

    for (
      let i = startBatch * BATCH_SIZE;
      i < wordsToProcess.length;
      i += BATCH_SIZE
    ) {
      // Check if generation was stopped
      if (generationStatus.status !== 'running') {
        console.log('⏸️ Generation stopped by user');
        generationStatus.lastProcessedBatch = Math.floor(i / BATCH_SIZE);
        return;
      }

      const batch = wordsToProcess.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

      generationStatus.progress.currentBatch = batchNumber;

      console.log(
        `🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} words)...`,
      );

      try {
        const batchTemplates = await processBatch(batch);
        allTemplates.push(...batchTemplates);

        generationStatus.progress.processed += batch.length;
        generationStatus.lastProcessedBatch = batchNumber;

        console.log(
          `✅ Batch ${batchNumber}/${totalBatches} completed successfully`,
        );
        console.log(
          `📊 Progress: ${generationStatus.progress.processed}/${generationStatus.progress.total} words`,
        );

        // Save progress after each successful batch
        await saveAITemplates(allTemplates);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Batch ${batchNumber} failed:`, error);

        // Stop the entire process on error
        generationStatus = {
          ...generationStatus,
          status: 'error',
          error: `Batch ${batchNumber} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastProcessedBatch: batchNumber - 1,
        };

        console.log(
          '🛑 Generation stopped due to error. Use retry to continue from where it left off.',
        );
        return;
      }
    }

    // All batches completed successfully
    generationStatus = {
      status: 'completed',
      progress: {
        processed: wordsToProcess.length,
        total: wordsToProcess.length,
        currentBatch: totalBatches,
        totalBatches: totalBatches,
        failedBatches: [],
      },
      lastProcessedBatch: totalBatches,
    };

    console.log('🎉 AI template generation completed successfully!');
  } catch (error) {
    console.error('❌ Generation failed:', error);
    generationStatus = {
      ...generationStatus,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
