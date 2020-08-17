import Head from "next/head";
import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import withApollo from "../lib/withApollo";

const HOME_QUERY = gql`
  {
    me {
      username
      discriminator
    }
  }
`;

function Home() {
  const { loading, data } = useQuery(HOME_QUERY);
  const me = data?.me;

  if (loading) return null;

  return (
    <div>
      <Head>
        <title>Worms League</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <img src="/drill.gif" />
      {me ? (
        <div>
          Hi {me.username}#{me.discriminator}
        </div>
      ) : (
        <a href="api/discord/authorize">Login</a>
      )}

      <style global jsx>{`
        body {
          background: black;
          color: white;
        }
      `}</style>
    </div>
  );
}

export default withApollo(Home);
