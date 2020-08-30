import {
  AppBar,
  Box,
  Button,
  createStyles,
  makeStyles,
  Theme,
  Toolbar,
  Typography,
} from "@material-ui/core";
import Head from "next/head";
import { useState } from "react";
import withApollo from "../lib/withApollo";
import SignupDialog from "./SignupDialog";
import LoginDialog from "./LoginDialog";
import gql from "graphql-tag";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/dist/client/router";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      margin: theme.spacing(1),
    },
  })
);

const PAGE_QUERY = gql`
  {
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

function Page({ children }) {
  const router = useRouter();
  const classes = useStyles();
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

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
                Hi, {me.username}{" "}
                <Button
                  onClick={async () => {
                    await logout();
                    router.reload();
                  }}
                >
                  Log out
                </Button>
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
      {children}
      <SignupDialog open={signupOpen} onClose={() => setSignupOpen(false)} />
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

export default withApollo(Page);
