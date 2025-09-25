import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

// Define the shape of a word
interface Word {
  enUS: string;
  zhTW: string;
  label?: string;
  templates?: string[];
  hasAITemplate?: boolean;
}

// Define the shape of an AI template
interface AITemplate {
  word: string;
  sentence: string;
  options: string[];
  answer: string;
}

interface WordInput {
  enUS: string;
  zhTW: string;
}

// Path to the words.json file (ensure it's relative to the project root or public directory)
const wordsFilePath =
  process.env.WORDS_JSON_PATH ||
  path.join(
    process.cwd(),
    'app',
    'projects',
    'wordbridge',
    'api',
    'graphql',
    'words.json',
  );

// Path to the words_ai.json file
const wordsAIFilePath =
  process.env.WORDS_AI_JSON_PATH ||
  path.join(
    process.cwd(),
    'app',
    'projects',
    'wordbridge',
    'api',
    'graphql',
    'words_ai.json',
  );

let wordsCache: Word[] | null = null;
let aiTemplatesCache: AITemplate[] | null = null;
let wordsLastModified: number | null = null;
let aiTemplatesLastModified: number | null = null;

// Clear cache function
const clearCache = () => {
  wordsCache = null;
  aiTemplatesCache = null;
  wordsLastModified = null;
  aiTemplatesLastModified = null;
  console.log('🔄 GraphQL cache cleared');
};

// Load AI templates from file
const loadAITemplates = (): AITemplate[] => {
  // Check if file has been modified since last cache
  const fileExists = fs.existsSync(wordsAIFilePath);
  if (fileExists) {
    const stats = fs.statSync(wordsAIFilePath);
    const lastModified = stats.mtime.getTime();

    // If file has been modified since last cache, clear cache
    if (
      aiTemplatesLastModified !== null &&
      lastModified > aiTemplatesLastModified
    ) {
      console.log('🔄 AI templates file updated, clearing cache');
      aiTemplatesCache = null;
    }

    // If we have valid cache, return it
    if (aiTemplatesCache && aiTemplatesLastModified === lastModified) {
      return aiTemplatesCache;
    }

    // Load fresh data from file
    try {
      console.log('Loading AI templates from:', wordsAIFilePath);
      const fileData = fs.readFileSync(wordsAIFilePath, 'utf-8');
      aiTemplatesCache = JSON.parse(fileData);
      aiTemplatesLastModified = lastModified;
      console.log('Loaded', aiTemplatesCache?.length || 0, 'AI templates');
    } catch (error) {
      console.error('Error loading AI templates:', error);
      aiTemplatesCache = [];
      aiTemplatesLastModified = lastModified;
    }
  } else {
    console.log('AI templates file does not exist');
    aiTemplatesCache = [];
    aiTemplatesLastModified = null;
  }

  return aiTemplatesCache || [];
};

// Check if a word has AI template
const checkAITemplateStatus = (word: string): boolean => {
  const templates = loadAITemplates();
  return templates.some(
    (template) => template.word.toLowerCase() === word.toLowerCase(),
  );
};

// Read the words from the JSON file
const getWords = (): Word[] | null => {
  // Check if file has been modified since last cache
  const fileExists = fs.existsSync(wordsFilePath);
  if (fileExists) {
    const stats = fs.statSync(wordsFilePath);
    const lastModified = stats.mtime.getTime();

    // If file has been modified since last cache, clear cache
    if (wordsLastModified !== null && lastModified > wordsLastModified) {
      console.log('🔄 Words file updated, clearing cache');
      wordsCache = null;
    }

    // If we have valid cache, return it
    if (wordsCache && wordsLastModified === lastModified) {
      return wordsCache;
    }

    // Load fresh data from file
    try {
      console.log('Loading words from:', wordsFilePath);
      const fileData = fs.readFileSync(wordsFilePath, 'utf-8');
      wordsCache = JSON.parse(fileData);
      wordsLastModified = lastModified;
      console.log('Loaded', wordsCache?.length || 0, 'words');
    } catch (error) {
      console.error('Error reading the words.json file:', error);
      wordsCache = [];
      wordsLastModified = lastModified;
    }
  } else {
    // If the file doesn't exist, create an empty file
    try {
      console.log('Words file does not exist, creating empty file');
      fs.writeFileSync(wordsFilePath, JSON.stringify([]));
      wordsCache = [];
      wordsLastModified = Date.now();
    } catch (error) {
      console.error('Error creating words.json file:', error);
      return null;
    }
  }

  return wordsCache;
};

// Save the updated words to the JSON file
const saveWords = (words: Word[]) => {
  try {
    fs.writeFileSync(wordsFilePath, JSON.stringify(words, null, 2));
    wordsCache = words; // Update in-memory cache
  } catch (error) {
    console.error('Error saving the words.json file:', error);
  }
};

// Helper function to add words while avoiding duplicates
const addUniqueWords = (words: Word[], newWords: WordInput[]): Word[] => {
  const existingWords = new Set(words.map((word) => word.enUS));

  newWords.forEach((newWord) => {
    if (!existingWords.has(newWord.enUS)) {
      words.push({ enUS: newWord.enUS, zhTW: newWord.zhTW });
      existingWords.add(newWord.enUS); // Mark the word as added
    }
  });

  return words;
};

const deleteWordsByKey = (words: Word[], enUsKeys: string[]): Word[] => {
  const wordsToDelete = new Set(enUsKeys);
  return words.filter((word) => !wordsToDelete.has(word.enUS));
};

// GraphQL Schema Definition
const typeDefs = gql`
  type Word {
    enUS: String!
    zhTW: String!
    label: String
    templates: [String!]
    hasAITemplate: Boolean
  }

  type AITemplate {
    word: String!
    sentence: String!
    options: [String!]!
    answer: String!
  }

  input WordInput {
    enUS: String!
    zhTW: String!
  }

  type Query {
    words: [Word!]!
    wordsWithAITemplates: [Word!]!
    aiTemplates: [AITemplate!]!
    clearCache: Boolean!
  }

  type Mutation {
    addWord(word: WordInput!): Word!
    updateWord(word: WordInput!): Word
    deleteWord(enUsKey: String!): Boolean

    addWords(words: [WordInput!]!): [Word!]!
    updateWords(words: [WordInput!]!): [Word!]!
    deleteWords(enUsKeys: [String!]!): Boolean
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    words: (): Word[] | null => {
      const words = getWords();
      if (!words) {
        return []; // Return empty array if words data is not found
      }

      // Add AI template status to each word
      return words.map((word) => ({
        ...word,
        hasAITemplate: checkAITemplateStatus(word.enUS),
      }));
    },

    wordsWithAITemplates: (): Word[] | null => {
      const words = getWords();
      if (!words) {
        return []; // Return empty array if words data is not found
      }

      // Filter words that have AI templates and add AI template data
      return words
        .filter((word) => checkAITemplateStatus(word.enUS))
        .map((word) => ({
          ...word,
          hasAITemplate: true,
        }));
    },

    aiTemplates: (): AITemplate[] => {
      return loadAITemplates();
    },

    clearCache: (): boolean => {
      clearCache();
      return true;
    },
  },
  Mutation: {
    addWord: (_: unknown, { word }: { word: WordInput }): Word => {
      const words = getWords();
      if (!words) {
        throw new Error('Failed to load words data.');
      }

      const updatedWords = addUniqueWords(words, [word]); // Pass as an array to reuse the helper
      saveWords(updatedWords); // Save the updated list
      return updatedWords.find((w) => w.enUS === word.enUS) as Word;
    },

    addWords: (_: unknown, { words }: { words: WordInput[] }): Word[] => {
      const currentWords = getWords();
      if (!currentWords) {
        throw new Error('Failed to load words data.');
      }

      const updatedWords = addUniqueWords(currentWords, words);
      saveWords(updatedWords);
      return updatedWords;
    },

    updateWord: (_: unknown, { word }: { word: WordInput }): Word | null => {
      const words = getWords();
      if (!words) {
        throw new Error('Failed to load words data.');
      }

      const index = words.findIndex((w) => w.enUS === word.enUS);
      if (index === -1) {
        return null; // Return null if word is not found
      }

      words[index] = { enUS: word.enUS, zhTW: word.zhTW };
      saveWords(words);
      return words[index];
    },

    updateWords: (_: unknown, { words }: { words: WordInput[] }): Word[] => {
      const currentWords = getWords();
      if (!currentWords) {
        throw new Error('Failed to load words data.');
      }

      words.forEach((word) => {
        const index = currentWords.findIndex((w) => w.enUS === word.enUS);
        if (index > -1) {
          currentWords[index] = { enUS: word.enUS, zhTW: word.zhTW };
        }
      });

      saveWords(currentWords);
      return currentWords;
    },

    deleteWord: (_: unknown, { enUsKey }: { enUsKey: string }): boolean => {
      const words = getWords();
      if (!words) {
        throw new Error('Failed to load words data.');
      }

      const newWords = deleteWordsByKey(words, [enUsKey]); // Pass single key as an array
      if (newWords.length === words.length) {
        return false; // No word was deleted
      }

      saveWords(newWords);
      return true;
    },

    deleteWords: (
      _: unknown,
      { enUsKeys }: { enUsKeys: string[] },
    ): boolean => {
      const words = getWords();
      if (!words) {
        throw new Error('Failed to load words data.');
      }

      const newWords = deleteWordsByKey(words, enUsKeys); // Pass multiple keys as an array
      if (newWords.length === words.length) {
        return false; // No words were deleted
      }

      saveWords(newWords);
      return true;
    },
  },
};

// Set up Apollo Server
const server = new ApolloServer({
  resolvers,
  typeDefs,
});

// Initialize the Next.js handler for GraphQL
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => ({ req }),
});

export { handler as GET, handler as POST };
