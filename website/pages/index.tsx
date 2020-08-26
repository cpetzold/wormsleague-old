import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Page from "../components/Page";
import Standings from "../components/Standings";
import withApollo from "../lib/withApollo";

const HOME_QUERY = gql`
  {
    me {
      username
      discriminator
    }
  }
`;

const TEST_PLAYERS = [
  {
    rank: 4,
    wins: 0,
    losses: 0,
    username: "Syc",
    countryCode: "US",
    clan: { tag: "SfX" },
    avatar:
      "https://cdn.discordapp.com/avatars/107678855325573120/dc564862764261169aedd894d3ebbddf.png?size=256",
  },
  {
    rank: 1,
    wins: 15,
    losses: 3,
    username: "M3ntal",
    countryCode: "GB",
    clan: { tag: "SfX" },
  },
  {
    rank: 3,
    wins: 13,
    losses: 2,
    username: "KRD",
    countryCode: "SI",
    clan: { tag: "SfX" },
    avatar:
      "https://cdn.discordapp.com/avatars/230108863183978496/848adffd735edc6ebbf43b177de2b3f2.png?size=256",
  },
  {
    rank: 2,
    wins: 1337,
    losses: 1337,
    username: "Deadcode",
    countryCode: "US",
  },
];

function Home() {
  const { loading, data } = useQuery(HOME_QUERY);
  const me = data?.me;

  if (loading) return null;

  return (
    <Page>
      <Standings players={TEST_PLAYERS.sort((a, b) => a.rank - b.rank)} />
    </Page>
  );
}

export default withApollo(Home);
