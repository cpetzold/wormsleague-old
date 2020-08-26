import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  ApolloLink,
} from "@apollo/client";
import withApollo from "next-with-apollo";
import { createUploadLink } from "apollo-upload-client";

const link = createUploadLink({
  credentials: "include",
  uri: "/api/graphql",
  fetchOptions: {
    credentials: "inlude",
  },
});

export default withApollo(
  ({ initialState }) => {
    return new ApolloClient({
      cache: new InMemoryCache().restore(initialState || {}),
      link: (link as unknown) as ApolloLink,
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
