import Head from "next/head";
import React from "react";
import { ThemeProvider } from "theme-ui";
import theme from "../lib/theme";
import { Global } from "@emotion/core";
import Page from "../components/Page";

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <Page>
        <Head>
          <title>Worms League</title>
        </Head>
        <Component {...pageProps} />
        <Global
          styles={(theme) => ({
            "*": {
              boxSizing: "border-box",
            },
            a: {
              color: theme.colors.primary,
              textDecoration: "none",
            },
          })}
        />
      </Page>
    </ThemeProvider>
  );
}
