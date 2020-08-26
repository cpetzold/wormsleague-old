import * as React from "react";
import Page from "../components/Page";
import withApollo from "../lib/withApollo";
import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { Grid, Button, Label, Input, Box, Heading } from "theme-ui";
import Select from "react-select";
import { map } from "ramda";

const REPORT_QUERY = gql`
  {
    users {
      id
      username
    }
  }
`;

const REPORT_WIN_MUTATION = gql`
  mutation ReportWin($loserId: String!, $replay: String!) {
    reportWin(loserId: $loserId, replay: $replay) {
      id
    }
  }
`;

function Report() {
  const { loading, data } = useQuery(REPORT_QUERY);
  const [reportWin, { called }] = useMutation(REPORT_WIN_MUTATION);
  const [gameLog, setGameLog] = React.useState<string>();
  const [loser, setLoser] = React.useState<string>();

  const users = data?.users ?? [];
  const userOptions = map(
    ({ id, username }) => ({ value: id, label: username }),
    users
  );

  return (
    <Page>
      <Grid
        sx={{ gap: 4 }}
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          console.log({ loser, gameLog });
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
            onChange={async ({ target: { validity, files } }) => {
              const form = new FormData();
              form.append("replay", files[0]);
              const res = await fetch("/api/replay", {
                method: "POST",
                body: form,
              });
              setGameLog(await res.text());
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
    </Page>
  );
}

export default withApollo(Report);
