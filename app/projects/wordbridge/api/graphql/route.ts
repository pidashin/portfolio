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
}

interface WordInput {
  enUS: string;
  zhTW: string;
}

// Path to the words.json file (ensure it's relative to the project root or public directory)
const wordsFilePath = path.join(
  process.cwd(),
  'app',
  'projects',
  'wordbridge',
  'api',
  'graphql',
  'words.json',
);

let wordsCache: Word[] | null = null;

// Read the words from the JSON file
const getWords = (): Word[] | null => {
  // Cache the words file to avoid reading from disk on every request
  if (wordsCache) return wordsCache;

  try {
    // Check if the file exists, and create it if it doesn't
    if (!fs.existsSync(wordsFilePath)) {
      // If the file doesn't exist, create an empty file
      fs.writeFileSync(wordsFilePath, JSON.stringify([]));
      wordsCache = [];
    } else {
      const fileData = fs.readFileSync(wordsFilePath, 'utf-8');
      wordsCache = JSON.parse(fileData);
    }
    return wordsCache;
  } catch (error) {
    console.error('Error reading the words.json file:', error);
    return null; // Return null if file read fails
  }
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
  }

  input WordInput {
    enUS: String!
    zhTW: String!
  }

  type Query {
    words: [Word!]!
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
      return words;
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
