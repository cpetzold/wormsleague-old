import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
} from "@material-ui/core";
import {
  HomeQuery,
  HomeQueryVariables,
  RecomputeRanksMutation,
  RecomputeRanksMutationVariables,
} from "../lib/graphql/generated/client";
import { useMutation, useQuery } from "@apollo/client";

import Games from "../components/Games";
import Standings from "../components/Standings";
import gql from "graphql-tag";

export const HOME_QUERY = gql`
  query Home {
    me {
      isAdmin
    }
    currentLeague {
      id
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

const RECOMPUTE_RANKS_MUTATION = gql`
  mutation RecomputeRanks($leagueId: String!) {
    recomputeRanks(leagueId: $leagueId)
  }
`;

export default function Home() {
  const { data } = useQuery<HomeQuery, HomeQueryVariables>(HOME_QUERY);
  const [recomputeRanks, { loading: recomputingRanks }] = useMutation<
    RecomputeRanksMutation,
    RecomputeRanksMutationVariables
  >(RECOMPUTE_RANKS_MUTATION, {
    variables: {
      leagueId: data?.currentLeague?.id,
    },
    refetchQueries: [{ query: HOME_QUERY }],
  });

  const isAdmin = data?.me?.isAdmin;
  const ranks = data?.currentLeague?.ranks ?? [];
  const games = data?.currentLeague?.games ?? [];

  return (
    <Container maxWidth={false}>
      <Grid container spacing={5}>
        <Grid item xs>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="h6">Standings</Typography>
            {isAdmin && (
              <Button
                onClick={() => {
                  recomputeRanks();
                }}
                color="secondary"
                size="small"
                disabled={recomputingRanks}
              >
                Recompute
              </Button>
            )}
          </Box>
          <Paper>
            <Standings ranks={ranks} />
          </Paper>
        </Grid>
        <Grid item xs>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="h6">Recent Games</Typography>
          </Box>
          <Paper>
            <Games games={games} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
