// app/projects/wordbridge/layout.tsx
import React from 'react';
import ApolloClientProvider from '../../components/ApolloClientProvider';

export const metadata = {
  title: 'WordBridge',
  description: 'A project for language learning',
};

const GRAPHQL_URI = '/projects/wordbridge/api/graphql'; // Specific URI for this project

const WordbridgeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ApolloClientProvider uri={GRAPHQL_URI}>{children}</ApolloClientProvider>
  );
};

export default WordbridgeLayout;
