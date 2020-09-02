import { Alert, Color } from "@material-ui/lab";
import {
  AppBar,
  Box,
  Button,
  Fab,
  Snackbar,
  Theme,
  Toolbar,
  Typography,
  createStyles,
  makeStyles,
} from "@material-ui/core";
import { useMutation, useQuery } from "@apollo/client";

import AddIcon from "@material-ui/icons/Add";
import Head from "next/head";
import LoginDialog from "./LoginDialog";
import ReportDialog from "./ReportDialog";
import SignupDialog from "./SignupDialog";
import gql from "graphql-tag";
import { useRouter } from "next/dist/client/router";
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
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  const [logout] = useMutation(LOGOUT_MUTATION);
  const { loading, data } = useQuery(PAGE_QUERY);
  const me = data?.me;

  if (loading) return null;

  return (
    <>
      <Head>
        <title>Worms League</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppBar color="inherit" position="sticky">
        <Toolbar>
          <Box display="flex" alignItems="center" flexGrow={1}>
            <Typography variant="h5">WormsLeague</Typography>
            &emsp;
            <img src="/victory.svg" height={40} />
          </Box>

          <Box justifySelf="flex-end">
            {me ? (
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
                <Button onClick={() => setLoginOpen(true)}>Log in</Button>
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  onClick={() => setSignupOpen(true)}
                >
                  Sign up
                </Button>
              </>
            )}
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
