import { Avatar, Box } from "@material-ui/core";

import Flag from "./Flag";
import { InlinePlayer_PlayerFragment } from "../lib/graphql/generated/client";
import gql from "graphql-tag";
import { ratingImage } from "../lib/rank";

export default function InlinePlayer({
  player,
}: {
  player: InlinePlayer_PlayerFragment;
}) {
  return (
    <Box display="flex" alignItems="center">
      <Flag countryCode={player.user.countryCode} />
      &ensp;
      <img src={ratingImage(player.rank.rating)} width="24" />
      &ensp;
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
      rank {
        rating
      }
    }
  `,
};
