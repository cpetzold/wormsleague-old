import CssBaseline from "@material-ui/core/CssBaseline";
import Head from "next/head";
import React from "react";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import Page from "../components/Page";
import { blue, pink } from "@material-ui/core/colors";

export default function App({ Component, pageProps }) {
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
    <ThemeProvider theme={theme}>
      <Page>
        <Head>
          <title>WormsLeague</title>
        </Head>
        <CssBaseline />
        <Component {...pageProps} />
      </Page>
    </ThemeProvider>
  );
}
