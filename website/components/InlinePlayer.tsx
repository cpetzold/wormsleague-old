import { Avatar, Box } from "@material-ui/core";

import Flag from "./Flag";
import { InlinePlayer_PlayerFragment } from "../lib/graphql/generated/client";
import gql from "graphql-tag";

export default function InlinePlayer({
  player,
}: {
  player: InlinePlayer_PlayerFragment;
}) {
  return (
    <Box display="flex" alignItems="center">
      <Flag countryCode={player.user.countryCode} />
      &emsp;
      {player.user.username}
    </Box>
  );
}

InlinePlayer.fragments = {
  player: gql`
    fragment InlinePlayer_player on Player {
      user {
        username
        countryCode
      }
    }
  `,
};
