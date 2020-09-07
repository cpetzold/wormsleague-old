import { Alert, Color } from "@material-ui/lab";
import {
  AppBar,
  Box,
  Button,
  Fab,
  PaletteType,
  Snackbar,
  Theme,
  Toolbar,
  Typography,
  createStyles,
  makeStyles,
  useMediaQuery,
} from "@material-ui/core";
import { useMutation, useQuery } from "@apollo/client";

import AddIcon from "@material-ui/icons/Add";
import Head from "next/head";
import LoginDialog from "./LoginDialog";
import ReportDialog from "./ReportDialog";
import SignupDialog from "./SignupDialog";
import gql from "graphql-tag";
import { useCookies } from "react-cookie";
import usePaletteType from "../lib/usePaletteType";
import { useRouter } from "next/router";
import { useState } from "react";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      margin: theme.spacing(1),
    },
  })
);

const PAGE_QUERY = gql`
  query Page {
    me {
      username
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

type AlertState = {
  severity: Color;
  message: string;
};

export default function Page({ children }) {
  const router = useRouter();
  const classes = useStyles();
  const [paletteType, togglePaletteType] = usePaletteType();

  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  const [logout] = useMutation(LOGOUT_MUTATION);
  const { loading, data } = useQuery(PAGE_QUERY);
  const me = data?.me;

  return (
    <>
      <Head>
        <title>Worms League</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <AppBar color="inherit" position="sticky">
        <Toolbar>
          <Box
            display="flex"
            justifySelf="center"
            alignItems="center"
            flexGrow={1}
          >
            <img src="/logo.png" height={48} />
          </Box>

          <Box display="flex" justifySelf="flex-end" alignItems="center">
            {!loading &&
              (me ? (
                <>
                  <Button
                    onClick={async () => {
                      await logout();
                      router.reload();
                    }}
                    className={classes.button}
                  >
                    Log out
                  </Button>
                  <Fab
                    variant="extended"
                    color="primary"
                    size="medium"
                    aria-label="report win"
                    onClick={() => setReportOpen(true)}
                  >
                    <AddIcon /> Report win
                  </Fab>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setLoginOpen(true)}
                    className={classes.button}
                  >
                    Log in
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setSignupOpen(true)}
                  >
                    Sign up
                  </Button>
                </>
              ))}
            {/* <img
              style={{ cursor: "pointer" }}
              onClick={() => togglePaletteType()}
              src={paletteType === "dark" ? "/light-off.png" : "/light-on.png"}
              height={32}
            /> */}
          </Box>
        </Toolbar>
      </AppBar>
      <Box py={3}>{children}</Box>
      {!me && (
        <SignupDialog open={signupOpen} onClose={() => setSignupOpen(false)} />
      )}
      {!me && (
        <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      )}
      {me && (
        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          onSuccess={() => {
            setReportOpen(false);
            setAlert({
              severity: "success",
              message: "Your win has been reported.",
            });
          }}
        />
      )}
      <Snackbar
        open={!!alert}
        autoHideDuration={6000}
        onClose={() => setAlert(null)}
      >
        <Alert
          variant="filled"
          onClose={() => setAlert(null)}
          severity={alert?.severity}
        >
          {alert?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
