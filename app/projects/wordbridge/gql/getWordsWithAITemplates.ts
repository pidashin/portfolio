// app/projects/wordbridge/graphql/queries/getWordsWithAITemplates.ts
import { gql } from '@apollo/client';

export const GET_WORDS_WITH_AI_TEMPLATES = gql`
  query GetWordsWithAITemplates {
    wordsWithAITemplates {
      enUS
      zhTW
      label
      templates
      hasAITemplate
    }
  }
`;

export default GET_WORDS_WITH_AI_TEMPLATES;
