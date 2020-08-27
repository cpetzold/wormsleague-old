import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import withApollo from "../lib/withApollo";
import Page from "../components/Page";
import { Grid, Input, Label, Box, Button, Flex } from "theme-ui";

const HOME_QUERY = gql`
  {
    me {
      username
      discriminator
    }
  }
`;

function Signup() {
  const router = useRouter();
  const { loading, data } = useQuery(HOME_QUERY);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const me = data?.me;

  useEffect(() => {
    if (me) {
      router.replace("/");
    }
  }, [me]);

  if (loading) return null;

  return (
    <Page>
      <Flex sx={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <Grid
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            console.log({ username, email, password });
          }}
          sx={{ width: "100%", maxWidth: 300 }}
        >
          <Box>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Box>
          <Box>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Box>
          <Box>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Box>

          <Button>Sign up</Button>
        </Grid>
      </Flex>
    </Page>
  );
}

export default withApollo(Signup);