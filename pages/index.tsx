import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import Head from "next/head";
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
    score: 1200,
    username: "Syc",
    countryCode: "US",
  },
  {
    score: 1500,
    username: "Mablak",
    countryCode: "US",
  },
  {
    score: 1460,
    username: "KRD",
    countryCode: "SI",
  },
  {
    score: 1337,
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
      <Head>
        <title>Worms League</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Standings players={TEST_PLAYERS.sort((a, b) => b.score - a.score)} />
    </Page>
  );
}

export default withApollo(Home);
