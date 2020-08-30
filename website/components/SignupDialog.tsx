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

type Country = {
  code: string;
  name: string;
};

const SIGNUP_MUTATION = gql`
  mutation Signup(
    $username: String!
    $email: String!
    $password: String!
    $countryCode: String!
  ) {
    signup(
      username: $username
      email: $email
      password: $password
      countryCode: $countryCode
    ) {
      id
      username
    }
  }
`;

export default function SignupDialog({ open, onClose }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState<Country>(null);

  const [signup] = useMutation(SIGNUP_MUTATION);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          console.log({ username, email, password, country });

          await signup({
            variables: {
              username,
              email,
              password,
              countryCode: country?.code,
            },
          });

          router.reload();
        }}
      >
        <DialogTitle>Sign up</DialogTitle>
        <DialogContent>
          <DialogContentText>Hello there</DialogContentText>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
            margin="normal"
            required
            autoFocus
            fullWidth
          />
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
            margin="normal"
            required
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
          <Autocomplete
            options={countries}
            value={country}
            onChange={(e, value) => setCountry(value as Country)}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Country"
                variant="outlined"
                margin="normal"
              />
            )}
            renderOption={(option) => (
              <>
                <Flag countryCode={option.code} />
                &ensp;{option.name}
              </>
            )}
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
            Sign up
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
