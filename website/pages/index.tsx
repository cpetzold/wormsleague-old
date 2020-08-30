import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Standings from "../components/Standings";
import SignupDialog from "../components/SignupDialog";
import withApollo from "../lib/withApollo";
import { useState } from "react";
import { Container } from "@material-ui/core";

const HOME_QUERY = gql`
  {
    currentLeague {
      ranks {
        user {
          username
          countryCode
        }
        place
        points
        wins
        losses
      }
    }
  }
`;

function Home() {
  const { loading, data } = useQuery(HOME_QUERY);

  if (loading) return null;

  const { ranks } = data?.currentLeague;
  console.log(ranks);

  const players = ranks.map(
    ({ user: { username, countryCode }, place, points, wins, losses }) => ({
      username,
      countryCode,
      place,
      points,
      wins,
      losses,
    })
  );

  return (
    <Container maxWidth="md">
      <Standings players={players} />
    </Container>
  );
}

export default withApollo(Home);
