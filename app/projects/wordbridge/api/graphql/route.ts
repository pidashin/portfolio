import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import words from './words.json';

const typeDefs = gql`
  type Word {
    enUS: String!
    zhTW: String!
  }

  type Query {
    words: [Word!]!
  }
`;

const resolvers = {
  Query: {
    words: () => words,
  },
};

const server = new ApolloServer({
  resolvers,
  typeDefs,
});

const handler = startServerAndCreateNextHandler(server);

export { handler as GET, handler as POST };
