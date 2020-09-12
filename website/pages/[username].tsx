import { Container, Grid, Paper, Typography } from "@material-ui/core";
import { UserQuery, UserQueryVariables } from "../lib/graphql/generated/client";

import Games from "../components/Games";
import Standings from "../components/Standings";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";

export const USER_QUERY = gql`
  query User($username: String!) {
    user(username: $username) {
      username
      countryCode
      ranks {
        playedGames {
          game {
            ...Games_game
          }
        }
        ...Standings_rank
      }
    }
  }
  ${Standings.fragments.rank}
  ${Games.fragments.game}
`;

export default function User() {
  const router = useRouter();
  const { username } = router.query;
  const { data } = useQuery<UserQuery, UserQueryVariables>(USER_QUERY, {
    variables: { username: username as string },
  });

  const rank = data?.user.ranks?.[0];
  const games = rank?.playedGames?.map(({ game }) => game) ?? [];

  return (
    <Container maxWidth={false}>
      <Grid container spacing={5}>
        <Grid item xs>
          <Typography variant="h6">Standing</Typography>
          <Paper>
            <Standings ranks={rank ? [rank] : []} />
          </Paper>
          <br />
          <Typography variant="h6">Games</Typography>
          <Paper>
            <Games games={games} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
