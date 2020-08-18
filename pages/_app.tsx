import Head from "next/head";
import React from "react";
import { ThemeProvider } from "theme-ui";
import theme from "../lib/theme";
import { Global } from "@emotion/core";

export default ({ Component, pageProps }) => (
  <ThemeProvider theme={theme}>
    <Head>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@531&display=swap"
        rel="stylesheet"
      />
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
  </ThemeProvider>
);
