import ApolloClient, { InMemoryCache } from "apollo-boost";

import { ApolloProvider } from "@apollo/react-hooks";
import withApollo from "next-with-apollo";

export default withApollo(
  ({ initialState }) => {
    return new ApolloClient({
      uri: "/api/graphql",
      cache: new InMemoryCache().restore(initialState || {}),
      credentials: "include",
      fetchOptions: {
        credentials: "include",
      },
    });
  },
  {
    render: ({ Page, props }) => {
      return (
        <ApolloProvider client={props.apollo}>
          <Page {...props} />
        </ApolloProvider>
      );
    },
  }
);
