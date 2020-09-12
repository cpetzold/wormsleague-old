import { Container, Grid, Paper, Typography } from "@material-ui/core";
import { HomeQuery, HomeQueryVariables } from "../lib/graphql/generated/client";
import { addIndex, fromPairs, map, sortWith } from "ramda";

import Games from "../components/Games";
import Standings from "../components/Standings";
import gql from "graphql-tag";
import { initializeApollo } from "../lib/apolloClient";
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

const mapIndexed = addIndex(map);

export default function Home() {
  const { data } = useQuery<HomeQuery, HomeQueryVariables>(HOME_QUERY);

  const ranks = data?.currentLeague?.ranks ?? [];
  const games = data?.currentLeague?.games ?? [];

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
          <Typography variant="h6">Recent Games</Typography>
          <Paper>
            <Games games={games} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export async function getStaticProps() {
  const apolloClient = initializeApollo();
  const staticProps = (props) => ({ props, revalidate: 1 });

  try {
    await apolloClient.query({
      query: HOME_QUERY,
    });
  } catch (e) {
    console.log(e);
    return staticProps({});
  }

  return staticProps({
    initialApolloState: apolloClient.cache.extract(),
  });
}
