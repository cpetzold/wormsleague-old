import { Container, Fab, Grid, Paper, Typography } from "@material-ui/core";

import Games from "../components/Games";
import Standings from "../components/Standings";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";

export const HOME_QUERY = gql`
  query Home {
    currentLeague {
      ranks {
        ...Standings_rank
      }
      games {
        ...Games_game
      }
    }
  }
  ${Games.fragments.game}
  ${Standings.fragments.rank}
`;

export default function Home() {
  const { loading, data } = useQuery(HOME_QUERY);

  if (loading) return null;

  const { ranks, games } = data?.currentLeague;

  return (
    <Container maxWidth={false}>
      <Grid container spacing={5}>
        <Grid item xs>
          <Typography variant="h6">Standings</Typography>
          <Paper>
            <Standings ranks={ranks} />
          </Paper>
        </Grid>
        <Grid item xs>
          <Typography variant="h6">Games</Typography>
          <Paper>
            <Games games={games} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
