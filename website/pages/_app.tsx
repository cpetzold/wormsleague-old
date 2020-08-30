import CssBaseline from "@material-ui/core/CssBaseline";
import Head from "next/head";
import React from "react";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import Page from "../components/Page";
import { blue, pink } from "@material-ui/core/colors";
import withApollo from "next-with-apollo";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  ApolloLink,
} from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";

function App({ Component, pageProps, apollo }) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: "dark",
          // type: prefersDarkMode ? "dark" : "light",
          primary: blue,
          secondary: pink,
        },
      }),
    [prefersDarkMode]
  );

  return (
    <ApolloProvider client={apollo}>
      <ThemeProvider theme={theme}>
        <Page>
          <Head>
            <title>WormsLeague</title>
          </Head>
          <CssBaseline />
          <Component {...pageProps} />
        </Page>
      </ThemeProvider>
    </ApolloProvider>
  );
}

const link = createUploadLink({
  credentials: "include",
  uri: "/api/graphql",
  fetchOptions: {
    credentials: "inlude",
  },
});

export default withApollo(({ initialState }) => {
  return new ApolloClient({
    cache: new InMemoryCache().restore(initialState || {}),
    link: (link as unknown) as ApolloLink,
  });
})(App);
