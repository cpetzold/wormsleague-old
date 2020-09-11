import { ThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import { blue, green, red } from "@material-ui/core/colors";

import { ApolloProvider } from "@apollo/client";
import CssBaseline from "@material-ui/core/CssBaseline";
import Head from "next/head";
import Page from "../components/Page";
import React from "react";
import { useApollo } from "../lib/apolloClient";

export default function App({ Component, pageProps }) {
  const apolloClient = useApollo(pageProps.initialApolloState);
  // const [paletteType] = usePaletteType();
  const paletteType = "dark";

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: paletteType,
          primary: blue,
          secondary: green,
          error: {
            main: red[200],
          },
        },
      }),
    [paletteType]
  );

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={theme}>
        <Page>
          <Head>
            <title>Worms League</title>
          </Head>
          <CssBaseline />
          <Component {...pageProps} />
        </Page>
      </ThemeProvider>
    </ApolloProvider>
  );
}
