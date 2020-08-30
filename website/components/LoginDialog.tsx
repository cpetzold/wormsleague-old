import { useState } from "react";

import Autocomplete from "@material-ui/lab/Autocomplete";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";
import countryList from "country-list";
import Flag from "./Flag";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/dist/client/router";
const countries = countryList.getData();

const LOGIN_MUTATION = gql`
  mutation Login($usernameOrEmail: String!, $password: String!) {
    login(usernameOrEmail: $usernameOrEmail, password: $password) {
      id
      username
    }
  }
`;

export default function LoginDialog({ open, onClose }) {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");

  const [login] = useMutation(LOGIN_MUTATION);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          await login({
            variables: {
              usernameOrEmail,
              password,
            },
          });

          router.reload();
        }}
      >
        <DialogTitle>Log in</DialogTitle>
        <DialogContent>
          <DialogContentText>Welcome back</DialogContentText>
          <TextField
            label="Username or Email"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            variant="outlined"
            margin="normal"
            required
            autoFocus
            fullWidth
          />
          <TextField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            variant="outlined"
            margin="normal"
            required
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
          >
            Log in
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
