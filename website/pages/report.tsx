import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { map } from "ramda";
import * as React from "react";
import Select from "react-select";
import { Box, Button, Grid, Heading, Input, Label } from "theme-ui";
import withApollo from "../lib/withApollo";

const REPORT_QUERY = gql`
  {
    users {
      id
      username
    }
  }
`;

const REPORT_WIN_MUTATION = gql`
  mutation ReportWin($loserId: String!, $replay: Upload!) {
    reportWin(loserId: $loserId, replay: $replay) {
      id
    }
  }
`;

function Report() {
  const { loading, data } = useQuery(REPORT_QUERY);
  const [reportWin, { called }] = useMutation(REPORT_WIN_MUTATION);
  const [replay, setReplay] = React.useState<File>();
  const [loser, setLoser] = React.useState<string>();

  const users = data?.users ?? [];
  const userOptions = map(
    ({ id, username }) => ({ value: id, label: username }),
    users
  );

  return (
    <Grid
      sx={{ gap: 4 }}
      as="form"
      onSubmit={async (e) => {
        e.preventDefault();

        console.log({ loser, replay });

        const res = await reportWin({
          variables: { loserId: "foobar", replay },
        });

        console.log(res);
      }}
    >
      <Heading as="h3">Report a Win</Heading>
      <Box>
        <Label htmlFor="replay">Replay</Label>
        <Input
          id="replay"
          type="file"
          accept=".WAgame"
          disabled={called}
          sx={{
            border: 0,
            padding: 0,
          }}
          onChange={async ({ target: { files } }) => {
            setReplay(files[0]);
          }}
        />
      </Box>

      <Box>
        <Label htmlFor="opponent">Opponent</Label>
        <Select
          id="opponent"
          options={userOptions}
          value={loser}
          onChange={setLoser}
        />
      </Box>

      <Button>Report</Button>
    </Grid>
  );
}

export default withApollo(Report);
