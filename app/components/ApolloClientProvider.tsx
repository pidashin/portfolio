'use client';

import React, { ReactNode, useMemo } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

type ApolloClientProviderProps = {
  children: ReactNode; // Children to be wrapped by the ApolloProvider
  uri: string; // GraphQL endpoint URI
};

const ApolloClientProvider: React.FC<ApolloClientProviderProps> = ({
  children,
  uri,
}) => {
  // Memoize the ApolloClient instance
  const client = useMemo(() => {
    return new ApolloClient({
      uri, // Use the provided URI
      cache: new InMemoryCache(),
    });
  }, [uri]); // Recreate the client only if the URI changes

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export default ApolloClientProvider;
