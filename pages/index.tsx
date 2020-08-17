import Head from "next/head";
import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import withApollo from "../lib/withApollo";

import { Flex } from "theme-ui";

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
    <Flex
      sx={{
        width: "100vw",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Head>
        <title>Worms League</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {me ? (
        <div>
          Hi {me.username}#{me.discriminator}
        </div>
      ) : (
        <a href="/api/discord/authorize">
          <img src="/drill.gif" />
        </a>
      )}
    </Flex>
  );
}

export default withApollo(Home);
