import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { IntrospectionQuery, buildClientSchema } from "graphql";

import { createUploadLink } from "apollo-upload-client";
import introspectionResult from "../lib/graphql/generated/graphql.schema.json";
import { useMemo } from "react";
import { withScalars } from "apollo-link-scalars";

let apolloClient: ApolloClient<InMemoryCache>;
const schema = buildClientSchema(
  (introspectionResult as unknown) as IntrospectionQuery
);

function createApolloClient() {
  const typesMap = {
    DateTime: {
      serialize: (date: Date) => date.toISOString(),
      parseValue: (raw: string | number | null): Date | null => {
        return raw ? new Date(raw) : null;
      },
    },
  };

  const uploadLink = createUploadLink({
    credentials: "include",
    uri: process.env.API_URL,
    fetchOptions: {
      credentials: "inlude",
    },
  });

  const link = ApolloLink.from([
    // TODO: re-enable when there's better support for serializing custom scalars in Apollo
    // withScalars({ schema, typesMap }),
    (uploadLink as unknown) as ApolloLink,
  ]);

  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link,
    cache: new InMemoryCache(),
  });
}

export function initializeApollo(initialState = null) {
  const _apolloClient = apolloClient ?? createApolloClient();

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();
    // Restore the cache using the data passed from getStaticProps/getServerSideProps
    // combined with the existing cached data
    _apolloClient.cache.restore({ ...existingCache, ...initialState });
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === "undefined") return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) {
    apolloClient = _apolloClient as ApolloClient<InMemoryCache>;
  }

  return _apolloClient;
}

export function useApollo(initialState) {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);
  return store;
}
