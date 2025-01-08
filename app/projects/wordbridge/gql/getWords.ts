// app/projects/wordbridge/graphql/queries/getWords.ts
import { gql } from '@apollo/client';

export const GET_WORDS = gql`
  query GetWords {
    words {
      enUS
      zhTW
    }
  }
`;

export default GET_WORDS;
